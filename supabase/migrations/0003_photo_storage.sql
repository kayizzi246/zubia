-- Zubia: storage for listing photos.
-- Run after 0002: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Bucket "listing-photos":
--   listings/...  enhanced photos shown on the site (public)
--   originals/... the untouched uploads, kept so any photo can be switched back

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  20971520, -- 20 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Anyone can view photos (they are on public listings).
create policy "Listing photos are public"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

-- Only admins can upload or delete for now.
-- TODO: let owners and agents upload photos for their own listings.
create policy "Admins upload listing photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-photos' and public.is_admin());

create policy "Admins delete listing photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-photos' and public.is_admin());
