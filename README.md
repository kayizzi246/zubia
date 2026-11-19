# Zubia

A property marketplace for Uganda: homes for sale, rentals and land across Kampala, Wakiso, Entebbe and Mukono, with the tenure and title-check status on every listing.

## What's in this repo

| Folder | What it is |
|---|---|
| `web/` | Website, admin area and the JSON API: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Drizzle |
| `db/` | Database setup: Postgres schema and the README explaining it |
| `flutterflow/` | Phone app: five FlutterFlow custom widgets, one per page. Each is self-contained and talks to `web/app/api/v1`. See [flutterflow/README.md](flutterflow/README.md). |
| `mobile/` | **Obsolete.** An untouched Expo starter template - no Zubia screens were ever written in it. Safe to delete. |
| `supabase/` | **Obsolete.** Kept only for reference; nothing reads it. Safe to delete. |

## Run the website

You need Node.js (LTS) installed.

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000. Without a database it shows 40 **sample listings** (all made up), including single rooms, double rooms and bedsitters at the prices those actually go for.

## Connect the database (Postgres)

You need Docker, or your own Postgres.

```bash
docker compose up -d                                  # repo root: starts Postgres on port 5433
cd web
cp .env.example .env.local                            # DATABASE_URL is already correct
npm run db:seed                                       # the 40 sample listings
npm run db:create-admin -- you@example.com "Your Name"  # prints a password once
npm run dev
```

Then sign in at http://localhost:3000/admin/login. After that, invite the
rest of the team from **Users & admins** instead of using the command line.

`docker compose up` applies `db/migrations/001_schema.sql` on first start.
See [db/README.md](db/README.md) for the schema, and `/admin/setup` in the
app for the same steps.

Listing photos go to **Cloudflare R2** (or any S3-compatible storage). Fill
in the `R2_` values in `.env.local`; everything else works without them.

## The API

`web/app/api/v1/` serves both the website and the Flutter app, so the two
can never disagree about what a listing means.

| Endpoint | What it does |
|---|---|
| `GET /api/v1/listings` | Search. Takes the same query parameters as the website's `/search` URL. |
| `GET /api/v1/listings/:id` | One listing, with the move-in cost itemised and the warnings worked out. |
| `GET /api/v1/meta` | The room-type vocabulary, price bands and districts, so clients don't hardcode them. |
| `POST /api/v1/auth/login` | Returns a bearer token. |
| `GET`/`DELETE /api/v1/auth/me` | Who the token belongs to; sign this device out. |
| `POST /api/v1/messages` | Send an enquiry. Open to signed-out people on purpose. |

Sessions are opaque tokens in the `sessions` table, sent as an httpOnly
cookie by the website and as `Authorization: Bearer <token>` by the app.
One mechanism, so signing out and revoking a stolen device work immediately
— which a stateless JWT could not do.

### How the dashboard, the website and the app join up

There is one database and one set of rules; the three clients are faces of
it, not copies.

- An admin approves a listing in `/admin/listings`. That action calls
  `updateTag(LISTINGS_TAG)`, which drops the cached listing set, so the
  website's pages and `GET /api/v1/listings` both serve the new listing on
  the next request - and the app sees it on the next search. No separate
  publish step, and no way for the app to show something the dashboard
  thinks is unapproved.
- Filtering runs through `web/lib/search.ts` for every client rather than
  being rewritten in SQL per endpoint, so the app and the website can never
  disagree about what "self-contained" means. The app's
  `SearchFilters.toQuery()` is the Dart twin of `filtersToQuery` there.
- The move-in total is computed on the server and sent as a number, so the
  figure Ugandan renters decide on is identical everywhere.
- An enquiry sent from the app (`POST /api/v1/messages`) is written to the
  same `messages` table the website's contact form writes to, and read in
  `/admin/messages`.
- The room-type vocabulary and price bands come from `GET /api/v1/meta`, so
  rewording a label does not need a Play Store release.

## Main pages

- `/` home, `/search` map search, `/listing/[id]` listing (opens as a pop-up inside the site)
- `/saved`, `/pricing`, `/contact`, `/help`, `/about`, `/terms`, `/privacy`, `/sign-in`, `/account`
- `/admin`: dashboard, listings review, messages, users and admins

## How renting works in Zubia

Portals built for Europe and America ask "how many bedrooms and bathrooms?".
Someone looking for a place to live in Uganda asks three different
questions, and the rental search is built around them:

1. **What kind of unit is it?** Single room (muzigo), double room,
   bedsitter, 1 bedroom, boys' quarters, hostel room, whole house. A single
   room and a 1-bedroom flat are different products at very different
   prices, so this is the first filter rather than a bedroom count.
2. **Is it self-contained?** Whether the toilet and shower are inside your
   own unit, in the yard but private to you, or shared with the other
   tenants. This is its own field, not a bathroom count, because it is the
   fact people are most often misled about.
3. **How much cash to move in?** Rent in advance plus the security deposit
   plus any broker fee, which commonly comes to three or four months' rent.
   Every rental shows this total in shillings, itemised, and flags terms
   that are unusual: more than two months in advance, a deposit above one
   month, or a broker fee charged to the tenant when the landlord normally
   pays it.

The vocabulary lives in one file, `web/lib/uganda.ts`, used by the search,
the listing pages, the admin form and the glossary on `/help`. The search
also understands the words people actually type, so "muzigo", "self
contained" and "studio" find the right homes.

The rental columns are in `db/migrations/001_schema.sql`, which constrains
them to rentals and bounds the advance, deposit and broker fee so a typo
can't claim a landlord wants a year up front. See [db/README.md](db/README.md)
for what each value means.

## Admin roles

| Role | Can do |
|---|---|
| **Super admin** | Everything, including inviting admins and changing roles |
| **Broker admin** | Manages broker and agent accounts, plus everything a works admin can do |
| **Works admin** | Reviews, approves and edits listings, photos and messages. No access to accounts |

Permissions live in one table, `web/lib/permissions.ts`, used by both the UI
and the server checks.

> **Important:** that table is now the *only* thing enforcing them. Supabase's
> Row Level Security used to repeat these rules inside the database; plain
> Postgres cannot, because the app connects as a single database user. So
> every page, Server Action and Route Handler must call `requirePermission()`
> from `web/lib/auth.ts`. A missing check is a data leak, not a cosmetic bug.

## Done recently

- Photos are deleted from R2 when a listing is deleted (`deletePhotos` in
  `web/lib/storage/r2.ts`, called from `deleteListing`).
- `/api/v1/auth/login` and `/api/v1/messages` are rate limited
  (`web/lib/rate-limit.ts`). The counters live in memory, so they reset on
  restart and do not add up across instances — fine for one VPS, needs
  Postgres or Redis behind a load balancer.
- `/pricing` has real UGX figures and a free tier.

## Still to do

- Assemble the FlutterFlow project from the widgets in `flutterflow/`:
  paste each one in as a custom widget, wire up the navigation actions
  and set `_apiBase` to the deployed API.
- Email sending. There is no provider now that Supabase is gone, so admin
  invites produce a one-time link for a super admin to pass on by hand, and
  new accounts are not email-verified.
- Let owners and agents upload photos for their own listings (only admins can).
- Have a lawyer review `/terms` and `/privacy` (marked as drafts).
- Mobile Money payments (Flutterwave) and in-app chat. `/pricing` has the
  prices and the plans; nothing takes money yet.
- Validate the `/pricing` figures with real agents before launch. They are
  reasoned proposals, not researched market rates — no Ugandan portal
  publishes what it charges agents, so there was nothing to compare against.
- Optional paid AI photo enhancement: set `AI_IMAGE_PROVIDER` in `web/.env.local` (see `.env.example`).
- Before launch, move map tiles from OpenStreetMap to a production tile provider (see `web/lib/map.ts`).
