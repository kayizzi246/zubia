-- Zubia: tiered admin roles.
-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Replaces the single flat 'admin' role with three tiers:
--
--   super_admin   Everything, including creating other admins and changing roles.
--   broker_admin  Manages broker and agent accounts and their listings.
--                 Can move people between 'user' and 'agent'. Cannot make admins.
--   works_admin   Reviews, approves and edits listings, photos and messages.
--                 No access to accounts or roles.
--
-- Existing 'admin' accounts become 'super_admin', so nobody is locked out.

-------------------------------------------------------------------------------
-- Swap the enum
-------------------------------------------------------------------------------
-- Postgres cannot add a value to an enum and use it in the same transaction,
-- so the column is moved onto a fresh type instead.

alter table public.profiles alter column role drop default;

create type public.user_role_new as enum (
  'user',
  'agent',
  'works_admin',
  'broker_admin',
  'super_admin'
);

alter table public.profiles
  alter column role type public.user_role_new
  using (
    case role::text
      when 'admin' then 'super_admin'
      else role::text
    end
  )::public.user_role_new;

alter table public.profiles alter column role set default 'user';

drop type public.user_role;
alter type public.user_role_new rename to user_role;

-------------------------------------------------------------------------------
-- Helper functions
-------------------------------------------------------------------------------

-- The signed-in user's role, or null when signed out.
create or replace function public.current_role_name()
returns text
language sql
stable
security definer set search_path = ''
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

-- True for any of the three admin tiers. Every existing policy uses this, so
-- all three tiers keep the access the single 'admin' role used to have, and
-- the tighter rules below narrow it where it matters.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select public.current_role_name() in ('works_admin', 'broker_admin', 'super_admin');
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select public.current_role_name() = 'super_admin';
$$;

-- Super admins and broker admins may touch other people's accounts.
create or replace function public.can_manage_users()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select public.current_role_name() in ('broker_admin', 'super_admin');
$$;

-------------------------------------------------------------------------------
-- Who may change a role
-------------------------------------------------------------------------------
-- super_admin  : any role.
-- broker_admin : may only move someone between 'user' and 'agent'.
-- anyone else  : no.
-- The SQL editor (no signed-in user) is still allowed, which is how the very
-- first super admin is created.

create or replace function public.protect_role()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.role is not distinct from old.role then
    return new;
  end if;

  -- Running from the SQL editor: allow, so the first admin can be created.
  if auth.uid() is null then
    return new;
  end if;

  if public.is_super_admin() then
    -- Never let the last super admin be demoted, or there is no way back in.
    if old.role = 'super_admin' and new.role <> 'super_admin'
       and (select count(*) from public.profiles where role = 'super_admin') <= 1 then
      raise exception 'This is the only super admin. Make someone else a super admin first.';
    end if;
    return new;
  end if;

  if public.can_manage_users()
     and old.role in ('user', 'agent')
     and new.role in ('user', 'agent') then
    return new;
  end if;

  raise exception 'You do not have permission to change this role';
end;
$$;

-------------------------------------------------------------------------------
-- Profile access
-------------------------------------------------------------------------------
-- All admins may READ profiles (the dashboard counts users and agents), but
-- only super admins and broker admins may edit someone else's profile.

drop policy if exists "Users update their own profile; admins update all" on public.profiles;

create policy "Users update their own profile; user managers update all"
  on public.profiles for update
  using (id = auth.uid() or public.can_manage_users());

-------------------------------------------------------------------------------
-- After running this file
-------------------------------------------------------------------------------
-- Check your own account is a super admin:
--
--   select email, role from public.profiles order by role;
--
-- If you need to set one by hand:
--
--   update public.profiles set role = 'super_admin' where email = 'you@example.com';
