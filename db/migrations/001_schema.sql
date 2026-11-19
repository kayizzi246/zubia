-- Zubia schema: plain Postgres, no extensions beyond what ships with the
-- server. Replaces the five supabase/migrations files with one clean
-- starting point, because the app no longer runs on Supabase.
--
-- WHAT CHANGED, AND WHY IT MATTERS
--
-- Supabase enforced permissions inside the database with Row Level Security,
-- using auth.uid() to know who was asking. Plain Postgres has no equivalent:
-- the app connects as one database user, so the database cannot tell one
-- visitor from another.
--
-- Authorization therefore moves entirely into the application, and
-- web/lib/permissions.ts is now the ONLY thing standing between a request
-- and the data. Every route and server action must call requirePermission()
-- before it reads or writes. There is no second line of defence any more.
--
-- What the database still guarantees, because it does not depend on knowing
-- the user: column types, enums, foreign keys, CHECK constraints, and the
-- rules about what a valid listing looks like.

begin;

-------------------------------------------------------------------------------
-- Enums
-------------------------------------------------------------------------------

create type public.listing_type as enum ('buy', 'rent', 'land');
create type public.tenure as enum ('mailo', 'freehold', 'leasehold', 'kibanja', 'condominium');
create type public.seller_type as enum ('owner', 'broker', 'agency', 'developer');
create type public.listing_status as enum ('pending', 'approved', 'rejected', 'archived');
create type public.message_topic as enum ('general', 'report', 'advertise', 'plans', 'help');

-- Three admin tiers, as before:
--   super_admin   everything, including inviting admins and changing roles
--   broker_admin  manages broker and agent accounts, plus all works_admin rights
--   works_admin   reviews listings, photos and messages; no access to accounts
create type public.user_role as enum (
  'user',
  'agent',
  'works_admin',
  'broker_admin',
  'super_admin'
);

-- How Ugandans describe a rental. See web/lib/uganda.ts, which holds the
-- same vocabulary for the app, and db/README.md for what each one means.
create type public.unit_type as enum (
  'single_room',
  'double_room',
  'bedsitter',
  'one_bedroom',
  'two_bedroom',
  'three_bedroom',
  'house',
  'bq',
  'hostel'
);

-- Where the toilet and shower are. 'inside' is what adverts call
-- "self-contained", the most decisive fact in a Ugandan rental listing.
create type public.bathroom_kind as enum ('inside', 'outside_private', 'shared');

create type public.water_source as enum (
  'piped_inside',
  'piped_yard',
  'shared_tap',
  'borehole'
);

-- 'own_yaka' is a prepaid meter in the tenant's own name.
create type public.power_supply as enum (
  'own_yaka',
  'shared_meter',
  'included',
  'none'
);

-------------------------------------------------------------------------------
-- Shared helpers
-------------------------------------------------------------------------------

-- Keeps updated_at honest. Unlike the old Supabase triggers this needs no
-- knowledge of who is signed in, so it survives the move.
create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-------------------------------------------------------------------------------
-- Users
-------------------------------------------------------------------------------
-- Replaces Supabase's auth.users plus the public.profiles mirror with one
-- table the app owns outright.

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 200),
  -- Null until the person sets a password through an invite link. A null
  -- hash can never match, so such an account cannot sign in.
  password_hash text,
  full_name text check (full_name is null or char_length(full_name) <= 120),
  phone text check (phone is null or char_length(phone) <= 30),
  role public.user_role not null default 'user',
  -- Admin invites: a hash of the one-time token, never the token itself.
  invite_token_hash text,
  invite_expires_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Email is the login, so it must be unique regardless of case. A functional
-- unique index avoids needing the citext extension.
create unique index users_email_lower_idx on public.users (lower(email));
create index users_role_idx on public.users (role);
-- Partial index: only the handful of accounts with an invite outstanding.
create index users_invite_idx on public.users (invite_token_hash)
  where invite_token_hash is not null;

create trigger users_touch
  before update on public.users
  for each row execute function public.touch_updated_at();

-------------------------------------------------------------------------------
-- Sessions
-------------------------------------------------------------------------------
-- Replaces Supabase Auth's JWT sessions. One row per signed-in device.
--
-- Only a SHA-256 hash of the session token is stored, so a leaked database
-- dump cannot be used to log in as anybody. The same row serves the web
-- app (sent as an httpOnly cookie) and the Flutter app (sent as a Bearer
-- token), so there is one way to sign in and one way to revoke.

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token_hash text not null unique,
  -- Recorded so someone can recognise their own devices, and so a stolen
  -- session is identifiable after the fact.
  user_agent text,
  ip text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index sessions_user_idx on public.sessions (user_id);
-- Used by the periodic cleanup of expired rows.
create index sessions_expires_idx on public.sessions (expires_at);

-------------------------------------------------------------------------------
-- Listings
-------------------------------------------------------------------------------
-- id stays text rather than uuid so readable ids like 'zb-001' keep working
-- alongside generated ones.

create table public.listings (
  id text primary key default gen_random_uuid()::text,
  type public.listing_type not null,
  title text not null check (char_length(title) between 3 and 140),
  price_ugx bigint not null check (price_ugx > 0),
  area text not null check (char_length(area) between 1 and 120),
  district text not null check (char_length(district) between 1 and 120),
  bedrooms int check (bedrooms >= 0 and bedrooms <= 50),
  bathrooms int check (bathrooms >= 0 and bathrooms <= 50),
  size_decimals numeric not null check (size_decimals > 0),
  tenure public.tenure not null,
  title_checked boolean not null default false,
  seller_type public.seller_type not null,
  featured boolean not null default false,
  photos text[] not null default '{}',
  seller_name text check (seller_name is null or char_length(seller_name) <= 120),
  -- International digits without the +, e.g. 256772123456.
  seller_phone text check (seller_phone is null or seller_phone ~ '^[0-9]{11,15}$'),
  lat double precision check (lat is null or lat between -90 and 90),
  lng double precision check (lng is null or lng between -180 and 180),
  description text not null default '',
  status public.listing_status not null default 'pending',
  owner_id uuid references public.users (id) on delete set null,

  -- --- Rentals -------------------------------------------------------------
  -- What renters actually search on. Null on sale and land listings.
  unit_type public.unit_type,
  bathroom public.bathroom_kind,
  own_kitchen boolean,
  water public.water_source,
  power public.power_supply,
  fenced boolean,
  -- Months of rent payable before the keys change hands. Stored as months
  -- rather than shillings so the figures stay right if the rent changes.
  advance_months smallint,
  deposit_months smallint,
  -- The broker's commission charged TO THE TENANT. Custom in Uganda is that
  -- the landlord pays it, so this is normally 0, and the listing page
  -- queries anything above that on the tenant's behalf.
  broker_fee_months smallint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Nobody sensible asks a year up front. These bounds catch a typo, and a
  -- scam listing claiming absurd terms.
  constraint listings_advance_months_range
    check (advance_months is null or advance_months between 0 and 12),
  constraint listings_deposit_months_range
    check (deposit_months is null or deposit_months between 0 and 6),
  constraint listings_broker_fee_months_range
    check (broker_fee_months is null or broker_fee_months between 0 and 3),

  -- These columns describe a rental. A plot of land has no bathroom.
  constraint listings_rental_fields_only_on_rentals
    check (
      type = 'rent'
      or (
        unit_type is null
        and bathroom is null
        and own_kitchen is null
        and water is null
        and power is null
        and fenced is null
        and advance_months is null
        and deposit_months is null
        and broker_fee_months is null
      )
    )
);

-- The public site always filters on status and type first.
create index listings_public_idx on public.listings (status, type, district);
create index listings_owner_idx on public.listings (owner_id);
create index listings_created_idx on public.listings (created_at desc);

-- The two filters nearly every rental search uses.
create index listings_unit_type_idx on public.listings (unit_type)
  where type = 'rent';
create index listings_bathroom_idx on public.listings (bathroom)
  where type = 'rent';

create trigger listings_touch
  before update on public.listings
  for each row execute function public.touch_updated_at();

comment on column public.listings.unit_type is
  'Ugandan unit type: single room, double room, bedsitter, 1 bedroom and so on.';
comment on column public.listings.bathroom is
  'Where the toilet and shower are. ''inside'' means self-contained.';
comment on column public.listings.advance_months is
  'Months of rent payable in advance. One or two is normal in Uganda.';
comment on column public.listings.broker_fee_months is
  'Broker commission charged to the tenant. Normally 0: landlords pay it.';

-------------------------------------------------------------------------------
-- Contact messages
-------------------------------------------------------------------------------

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  topic public.message_topic not null default 'general',
  name text not null check (char_length(name) between 1 and 120),
  email text check (email is null or char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 30),
  listing_id text references public.listings (id) on delete set null,
  message text not null check (char_length(message) between 5 and 4000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create index contact_messages_created_idx
  on public.contact_messages (created_at desc);
-- The admin inbox opens on the unhandled ones.
create index contact_messages_unhandled_idx
  on public.contact_messages (created_at desc)
  where handled = false;

commit;
