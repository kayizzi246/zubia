# Zubia's database

Plain Postgres. No Supabase, no extensions beyond what the server ships with.

## Running it

```bash
docker compose up -d      # from the repo root
```

That starts Postgres 17 on **port 5433** (not 5432, so it cannot clash with
another Postgres you already run) and applies everything in
`db/migrations/` the first time the volume is created.

```bash
docker compose logs -f db   # watch it
docker compose down         # stop, keep the data
docker compose down -v      # stop and DELETE all data
```

To re-apply the migrations from scratch, `docker compose down -v` and start
again. If you use your own Postgres instead, point `DATABASE_URL` at it and
run `db/migrations/001_schema.sql` by hand.

## Then

```bash
cd web
npm run db:seed                                    # 40 sample listings
npm run db:create-admin -- you@example.com "Name"  # prints a password once
npm run db:studio                                  # browse the data
```

## Migrations

`db/migrations/*.sql` is **the source of truth** for the schema. It is
applied in filename order, and it holds things Drizzle's generator cannot
express: CHECK constraints, partial indexes, and the rule that rental
columns only apply to rentals.

`web/lib/db/schema.ts` mirrors it so queries are typed. **If you change one,
change the other.** Do not run `drizzle-kit push` against a real database —
it would try to drop what it does not understand.

## What moving off Supabase changed

Supabase enforced permissions inside the database with Row Level Security,
using `auth.uid()` to know who was asking. Plain Postgres has no equivalent:
the app connects as one database user, so **the database cannot tell one
visitor from another**.

Authorization therefore lives entirely in the application now:

- `web/lib/permissions.ts` — the table of who can do what
- `web/lib/auth.ts` — `requireAdmin()` and `requirePermission()`

Every admin page, Server Action and Route Handler must call one of those
before it touches data. **There is no second line of defence any more.** A
missing check is a data leak, not a cosmetic bug.

What the database still guarantees, because it does not need to know the
user: column types, enums, foreign keys, and the CHECK constraints
describing what a valid listing looks like.

Three things that used to be database triggers now live in the app:

| Was | Now |
|---|---|
| `auth.users` + `profiles` | one `users` table the app owns |
| Supabase Auth JWTs | `sessions` table, opaque tokens (`lib/auth/session.ts`) |
| "last super admin cannot be demoted" trigger | checked in `setUserRole()` |

## Tables

| Table | What it holds |
|---|---|
| `users` | Accounts and roles. Email is unique case-insensitively, via a unique index on `lower(email)`. `password_hash` is null while an invite is outstanding, and a null hash can never match, so such an account cannot sign in. |
| `sessions` | One row per signed-in device. Stores a SHA-256 **hash** of the token, never the token, so a database dump cannot be replayed as a login. The same row serves the website (httpOnly cookie) and the Flutter app (Bearer token), so sign-out and revocation work in one place. |
| `listings` | Homes and land. `id` is `text`, not `uuid`, so readable ids like `zb-001` work alongside generated ones. |
| `contact_messages` | Enquiries and reports from the website and the app. |

## The rental columns

These are the point of the whole schema, so they are worth spelling out.
Bedroom and bathroom counts describe a house for sale; they do not describe
how Ugandans rent. Someone looking for a place to live asks three
questions, and these columns answer them.

**1. What kind of unit is it?** — `unit_type`

| Value | Means |
|---|---|
| `single_room` | One room (a *muzigo*). Sleep, sit and often cook in the same room. The cheapest way to rent. |
| `double_room` | Two rooms joined, so the sitting room is separate from the bedroom. |
| `bedsitter` | One bigger room with its own kitchen corner and bathroom. Advertised as a studio. |
| `one_bedroom` | Separate bedroom, sitting room, kitchen, own bathroom. |
| `two_bedroom`, `three_bedroom` | Two, or three or more, bedrooms. |
| `house` | A whole house on its own compound. |
| `bq` | Boys' quarters: a separate unit in a bigger house's compound. |
| `hostel` | A room in a student hostel. |

**2. Is it self-contained?** — `bathroom`

`inside` is what adverts call "self-contained" and is the most decisive
fact in a Ugandan listing. `outside_private` means the toilet is in the
yard but only yours; `shared` means the yard shares it. It is a separate
column rather than a bathroom count because it is the thing people are most
often misled about.

**3. How much cash to move in?** — `advance_months`, `deposit_months`,
`broker_fee_months`

Stored as **months of rent**, not shillings, so the figures stay correct if
the rent changes. CHECK constraints bound them (12 / 6 / 3) so a typo, or a
scam listing, cannot claim a landlord wants a year up front.

`broker_fee_months` is the commission charged **to the tenant**. Custom in
Uganda is that the landlord pays the broker, so this is normally `0`, and
the listing page questions anything above that on the tenant's behalf.

Also recorded, because they are real running costs: `water`, `power`
(`own_yaka` is a prepaid meter in the tenant's own name), `own_kitchen` and
`fenced`.

The same vocabulary lives in `web/lib/uganda.ts` for the app, and is served
to clients at `GET /api/v1/meta` so the Flutter app does not hardcode it.
