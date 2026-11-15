# Zubia

A property marketplace for Uganda: homes for sale, rentals and land across Kampala, Wakiso, Entebbe and Mukono, with the tenure and title-check status on every listing.

## What's in this repo

| Folder | What it is |
|---|---|
| `web/` | Website and admin area: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| `mobile/` | Phone app: React Native with Expo (screens still to be built) |
| `supabase/` | Database setup: SQL migrations and sample data for Supabase (Postgres) |

## Run the website

You need Node.js (LTS) installed.

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000. Without a database it shows 12 **sample listings** (all made up).

## Connect the database (free Supabase plan)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run these files in order:
   `supabase/migrations/0001_init.sql`, `0002_contact_and_messages.sql`, `0003_photo_storage.sql`, then `supabase/seed.sql`.
3. Copy `web/.env.example` to `web/.env.local` and fill in your Project URL, Publishable key and Secret key.
   `.env.local` is ignored by git, so your keys never reach GitHub.
4. Create your user under **Authentication → Users**, then make it an admin:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
5. Restart `npm run dev` and sign in at http://localhost:3000/admin/login.

The same steps are shown in the app at `/admin/setup`.

## Main pages

- `/` home, `/search` map search, `/listing/[id]` listing (opens as a pop-up inside the site)
- `/saved`, `/pricing`, `/contact`, `/help`, `/about`, `/terms`, `/privacy`, `/sign-in`, `/account`
- `/admin`: dashboard, listings review, messages, users and admins

## Still to do

- Fill in the `UGX [PRICE]` placeholders on `/pricing`.
- Have a lawyer review `/terms` and `/privacy` (marked as drafts).
- Mobile Money payments (Flutterwave), in-app chat, the mobile app screens.
- Optional paid AI photo enhancement: set `AI_IMAGE_PROVIDER` in `web/.env.local` (see `.env.example`).
- Before launch, move map tiles from OpenStreetMap to a production tile provider (see `web/lib/map.ts`).
