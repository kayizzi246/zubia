-- Zubia database schema (Supabase / Postgres).
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

-------------------------------------------------------------------------------
-- Types
-------------------------------------------------------------------------------
create type public.listing_type as enum ('buy', 'rent', 'land');
create type public.tenure as enum ('mailo', 'freehold', 'leasehold', 'kibanja', 'condominium');
create type public.seller_type as enum ('owner', 'broker', 'agency', 'developer');
create type public.listing_status as enum ('pending', 'approved', 'rejected', 'archived');
create type public.user_role as enum ('user', 'agent', 'admin');

-------------------------------------------------------------------------------
-- Profiles: one row per signed-up user, holds their role.
-------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

-- Create a profile automatically whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- True when the signed-in user is an admin.
create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Only admins may change a role. The SQL editor (no signed-in user) is
-- allowed, which is how the very first admin is created.
create function public.protect_role()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_role();

-------------------------------------------------------------------------------
-- Listings
-------------------------------------------------------------------------------
create table public.listings (
  id text primary key default gen_random_uuid()::text,
  type public.listing_type not null,
  title text not null check (char_length(title) between 3 and 140),
  price_ugx bigint not null check (price_ugx > 0),
  area text not null,
  district text not null,
  bedrooms int check (bedrooms >= 0),
  bathrooms int check (bathrooms >= 0),
  size_decimals numeric not null check (size_decimals > 0),
  tenure public.tenure not null,
  title_checked boolean not null default false,
  seller_type public.seller_type not null,
  featured boolean not null default false,
  photos text[] not null default '{}',
  lat double precision,
  lng double precision,
  description text not null default '',
  status public.listing_status not null default 'pending',
  owner_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_public_idx on public.listings (status, type, district);
create index listings_owner_idx on public.listings (owner_id);

-- Keep updated_at fresh, and stop non-admins from approving their own
-- listings or giving themselves a "Featured" or "Title checked" badge.
create function public.guard_listing()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at := now();
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.featured := false;
      new.title_checked := false;
    else
      new.status := old.status;
      new.featured := old.featured;
      new.title_checked := old.title_checked;
    end if;
  end if;
  return new;
end;
$$;

create trigger listings_guard
  before insert or update on public.listings
  for each row execute function public.guard_listing();

-------------------------------------------------------------------------------
-- Row Level Security: who can read and write what.
-------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;

-- Profiles
create policy "Users read their own profile; admins read all"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "Users update their own profile; admins update all"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- Listings
create policy "Anyone reads approved listings; owners and admins read their own"
  on public.listings for select
  using (status = 'approved' or owner_id = auth.uid() or public.is_admin());

create policy "Signed-in users create listings for themselves"
  on public.listings for insert
  to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

create policy "Owners and admins update listings"
  on public.listings for update
  using (owner_id = auth.uid() or public.is_admin());

create policy "Owners and admins delete listings"
  on public.listings for delete
  using (owner_id = auth.uid() or public.is_admin());
