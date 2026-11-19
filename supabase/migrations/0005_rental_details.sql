-- Zubia: Ugandan rental details.
-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Why these columns exist
--
-- Bedroom and bathroom counts describe a house for sale. They do not
-- describe how Ugandans rent. Somebody looking for a place to live asks
-- what kind of unit it is (single room, double room, bedsitter, 1 bedroom),
-- whether it is self-contained, and how much cash the landlord wants before
-- handing over the keys. Those three things are what these columns record,
-- and what the search filters on.

-------------------------------------------------------------------------------
-- Types
-------------------------------------------------------------------------------

-- The unit types people search for, smallest and cheapest first.
-- "bq" is boys' quarters, a separate unit in the compound of a bigger house.
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
-- "self-contained" and it is the single most decisive fact in a listing.
create type public.bathroom_kind as enum (
  'inside',
  'outside_private',
  'shared'
);

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
-- Columns
-------------------------------------------------------------------------------

alter table public.listings
  add column unit_type public.unit_type,
  add column bathroom public.bathroom_kind,
  add column own_kitchen boolean,
  add column water public.water_source,
  add column power public.power_supply,
  add column fenced boolean,
  -- Months of rent the tenant must pay before moving in. Kept as months
  -- rather than shillings so the figures stay correct if the rent changes.
  add column advance_months smallint,
  add column deposit_months smallint,
  -- The broker's commission charged TO THE TENANT. Custom in Uganda is that
  -- the landlord pays it, so this is normally 0, and the listing page
  -- queries anything above that on the tenant's behalf.
  add column broker_fee_months smallint;

-- Nobody pays a sensible landlord twelve months up front. These bounds stop
-- a typo (or a scam listing) claiming they do.
alter table public.listings
  add constraint listings_advance_months_range
    check (advance_months is null or advance_months between 0 and 12),
  add constraint listings_deposit_months_range
    check (deposit_months is null or deposit_months between 0 and 6),
  add constraint listings_broker_fee_months_range
    check (broker_fee_months is null or broker_fee_months between 0 and 3);

-- These columns only describe a rental. A plot of land has no bathroom.
alter table public.listings
  add constraint listings_rental_fields_only_on_rentals
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
    );

-------------------------------------------------------------------------------
-- Indexes
-------------------------------------------------------------------------------

-- The two filters nearly every rental search uses.
create index listings_unit_type_idx
  on public.listings (unit_type)
  where type = 'rent';

create index listings_bathroom_idx
  on public.listings (bathroom)
  where type = 'rent';

comment on column public.listings.unit_type is
  'Ugandan unit type: single room, double room, bedsitter, 1 bedroom and so on.';
comment on column public.listings.bathroom is
  'Where the toilet and shower are. ''inside'' means self-contained.';
comment on column public.listings.advance_months is
  'Months of rent payable in advance. One or two is normal in Uganda.';
comment on column public.listings.broker_fee_months is
  'Broker commission charged to the tenant. Normally 0: landlords pay it.';
