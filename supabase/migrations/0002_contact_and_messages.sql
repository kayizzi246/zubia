-- Zubia: seller contact details on listings, and the contact form inbox.
-- Run after 0001_init.sql: Dashboard -> SQL Editor -> New query -> paste -> Run.

-------------------------------------------------------------------------------
-- Seller name and phone on each listing (for the WhatsApp and Call buttons).
-------------------------------------------------------------------------------
alter table public.listings
  add column if not exists seller_name text,
  add column if not exists seller_phone text
    check (seller_phone is null or seller_phone ~ '^[0-9]{11,15}$');

comment on column public.listings.seller_phone is
  'International digits without +, e.g. 256772123456';

-------------------------------------------------------------------------------
-- Messages from the contact form (reports, advertising, plans, help).
-------------------------------------------------------------------------------
create type public.message_topic as enum ('general', 'report', 'advertise', 'plans', 'help');

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

create index contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Anyone (signed in or not) can send a message, but never read them.
create policy "Anyone can send a message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (handled = false);

create policy "Admins read messages"
  on public.contact_messages for select
  using (public.is_admin());

create policy "Admins update messages"
  on public.contact_messages for update
  using (public.is_admin());

create policy "Admins delete messages"
  on public.contact_messages for delete
  using (public.is_admin());
