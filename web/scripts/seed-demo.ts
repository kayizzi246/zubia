/*
  Demo data on top of the sample listings.

    npm run db:seed        first (the 40 approved listings)
    npm run db:seed-demo   then this

  npm run db:seed alone leaves the admin area looking empty: everything is
  already approved, there is one account and no enquiries. This adds the
  things an admin actually works on — listings waiting for review, a few
  staff and agent accounts, and an inbox with some messages still open.

  Safe to run more than once: everything is keyed on id or email.

  DEMO ACCOUNTS HAVE NO PASSWORD, on purpose. A null hash can never match,
  so none of them can be signed into even if this runs against a real
  server. To use one, give it a password:

    npm run db:create-admin -- mary@example.com "Achieng Mary" --role works_admin
*/

import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { contactMessages, listings, users } from "../lib/db/schema";
import type { ListingDbRow } from "../lib/db/schema";

// Real photographs of Ugandan houses. See public/sample/photos/CREDITS.md.
const P = (slug: string) => `/sample/photos/${slug}.webp`;

// Chosen to match what each listing is: a single room gets a muzigo, a
// flat gets an apartment block. See public/sample/photos/CREDITS.md.
const SINGLE_ROOM = [P("muzigo-1"), P("single-room-2")];
const SINGLE_ROOM_SC = [P("single-room-1"), P("single-room-3")];
const DOUBLE_ROOM = [P("room-2"), P("room-3")];
const BEDSITTER = [P("room-4"), P("room-2")];
const APARTMENT = [P("apartment-1"), P("apartment-2")];
const HOSTEL = [P("apartment-4"), P("area-1")];
const BQ = [P("bq-1"), P("house-4")];

type DemoListing = Omit<
  ListingDbRow,
  "createdAt" | "updatedAt" | "ownerId"
>;

/**
 * Rents are in the ranges Ugandan listing sites showed through 2025-2026.
 * Areas are spread wider than the first 40 so the district chart on the
 * dashboard has something to show.
 */
const DEMO_LISTINGS: DemoListing[] = [
  {
    id: "zb-041",
    type: "rent",
    title: "Single room near Nakulabye stage",
    priceUgx: 180_000,
    area: "Nakulabye",
    district: "Kampala",
    bedrooms: 1,
    bathrooms: 0,
    sizeDecimals: "1",
    tenure: "kibanja",
    titleChecked: false,
    sellerType: "owner",
    featured: false,
    photos: SINGLE_ROOM,
    sellerName: "Nalubega F.",
    sellerPhone: "256772000041",
    lat: 0.3236,
    lng: 32.5531,
    description:
      "Sample listing. One room a short walk from the stage, in a yard of six. Shared tap and latrine. Submitted for review.",
    status: "pending",
    unitType: "single_room",
    bathroom: "shared",
    ownKitchen: false,
    water: "shared_tap",
    power: "shared_meter",
    fenced: false,
    advanceMonths: 1,
    depositMonths: 1,
    brokerFeeMonths: 0,
  },
  {
    id: "zb-042",
    type: "rent",
    title: "Self-contained single room, Kyengera",
    priceUgx: 250_000,
    area: "Kyengera",
    district: "Wakiso",
    bedrooms: 1,
    bathrooms: 1,
    sizeDecimals: "1",
    tenure: "mailo",
    titleChecked: false,
    sellerType: "broker",
    featured: false,
    photos: SINGLE_ROOM_SC,
    sellerName: "Ssali B.",
    sellerPhone: "256772000042",
    lat: 0.2847,
    lng: 32.4761,
    description:
      "Sample listing. Own shower and toilet inside, own Yaka meter. Off the Masaka road. Awaiting review.",
    status: "pending",
    unitType: "single_room",
    bathroom: "inside",
    ownKitchen: false,
    water: "piped_yard",
    power: "own_yaka",
    fenced: true,
    advanceMonths: 2,
    depositMonths: 1,
    brokerFeeMonths: 0,
  },
  {
    id: "zb-043",
    type: "rent",
    title: "Double room self-contained, Naalya",
    priceUgx: 550_000,
    area: "Naalya",
    district: "Wakiso",
    bedrooms: 1,
    bathrooms: 1,
    sizeDecimals: "2",
    tenure: "freehold",
    titleChecked: true,
    sellerType: "agency",
    featured: false,
    photos: DOUBLE_ROOM,
    sellerName: "Naalya Homes",
    sellerPhone: "256772000043",
    lat: 0.3689,
    lng: 32.6392,
    description:
      "Sample listing. Two rooms, kitchen and bathroom inside, in a gated block of eight with a water tank.",
    status: "pending",
    unitType: "double_room",
    bathroom: "inside",
    ownKitchen: true,
    water: "piped_inside",
    power: "own_yaka",
    fenced: true,
    advanceMonths: 2,
    depositMonths: 1,
    brokerFeeMonths: 0,
  },
  {
    id: "zb-044",
    type: "rent",
    title: "Bedsitter in Kitintale",
    priceUgx: 450_000,
    area: "Kitintale",
    district: "Kampala",
    bedrooms: 1,
    bathrooms: 1,
    sizeDecimals: "1",
    tenure: "mailo",
    titleChecked: false,
    sellerType: "owner",
    featured: false,
    photos: BEDSITTER,
    sellerName: "Mugisha A.",
    sellerPhone: "256772000044",
    lat: 0.3092,
    lng: 32.6367,
    description:
      "Sample listing. One large room with a kitchen corner and its own bathroom, partitioned for privacy.",
    status: "pending",
    unitType: "bedsitter",
    bathroom: "inside",
    ownKitchen: true,
    water: "piped_inside",
    power: "own_yaka",
    fenced: true,
    advanceMonths: 1,
    depositMonths: 1,
    brokerFeeMonths: 0,
  },
  {
    id: "zb-045",
    type: "rent",
    title: "Hostel room, Nakawa",
    priceUgx: 300_000,
    area: "Nakawa",
    district: "Kampala",
    bedrooms: 1,
    bathrooms: 0,
    sizeDecimals: "1",
    tenure: "leasehold",
    titleChecked: false,
    sellerType: "agency",
    featured: false,
    photos: HOSTEL,
    sellerName: "Nakawa Student Hostel",
    sellerPhone: "256772000045",
    lat: 0.3297,
    lng: 32.6208,
    description:
      "Sample listing. Single occupancy room in a hostel near the campuses. Bathrooms shared per floor, power and water included.",
    status: "pending",
    unitType: "hostel",
    bathroom: "shared",
    ownKitchen: false,
    water: "piped_yard",
    power: "included",
    fenced: true,
    advanceMonths: 1,
    depositMonths: 0,
    brokerFeeMonths: 0,
  },
  {
    id: "zb-046",
    type: "rent",
    title: "Boys' quarters, Munyonyo",
    priceUgx: 600_000,
    area: "Munyonyo",
    district: "Kampala",
    bedrooms: 1,
    bathrooms: 1,
    sizeDecimals: "2",
    tenure: "freehold",
    titleChecked: true,
    sellerType: "owner",
    featured: true,
    photos: BQ,
    sellerName: "Kirabo S.",
    sellerPhone: "256772000046",
    lat: 0.2642,
    lng: 32.6256,
    description:
      "Sample listing. Self-contained two-roomed unit with its own entrance in a quiet family compound near the lake.",
    status: "approved",
    unitType: "bq",
    bathroom: "inside",
    ownKitchen: true,
    water: "piped_inside",
    power: "own_yaka",
    fenced: true,
    advanceMonths: 2,
    depositMonths: 1,
    brokerFeeMonths: 0,
  },
  {
    id: "zb-047",
    title: "Cheap single room, Matugga",
    type: "rent",
    priceUgx: 130_000,
    area: "Matugga",
    district: "Wakiso",
    bedrooms: 1,
    bathrooms: 0,
    sizeDecimals: "1",
    tenure: "kibanja",
    titleChecked: false,
    sellerType: "owner",
    featured: false,
    photos: SINGLE_ROOM,
    sellerName: "Kato J.",
    sellerPhone: "256772000047",
    lat: 0.4442,
    lng: 32.5486,
    description:
      "Sample listing. One room on the Bombo road side of Matugga. Shared tap and latrine, no power in the unit.",
    status: "approved",
    unitType: "single_room",
    bathroom: "shared",
    ownKitchen: false,
    water: "shared_tap",
    power: "none",
    fenced: false,
    advanceMonths: 1,
    depositMonths: 0,
    brokerFeeMonths: 0,
  },
  {
    id: "zb-048",
    type: "rent",
    title: "Double room, Gayaza",
    priceUgx: 220_000,
    area: "Gayaza",
    district: "Wakiso",
    bedrooms: 1,
    bathrooms: 0,
    sizeDecimals: "2",
    tenure: "kibanja",
    titleChecked: false,
    sellerType: "broker",
    featured: false,
    photos: DOUBLE_ROOM,
    sellerName: "Nsubuga R.",
    sellerPhone: "256772000048",
    lat: 0.4336,
    lng: 32.6042,
    description:
      "Sample listing. Two rooms with a small kitchen at the back. Toilet shared with three other tenants.",
    status: "approved",
    unitType: "double_room",
    bathroom: "shared",
    ownKitchen: true,
    water: "borehole",
    power: "own_yaka",
    fenced: false,
    advanceMonths: 1,
    depositMonths: 1,
    brokerFeeMonths: 0,
  },
  {
    id: "zb-049",
    type: "rent",
    title: "2-bedroom flat, Luzira",
    priceUgx: 900_000,
    area: "Luzira",
    district: "Kampala",
    bedrooms: 2,
    bathrooms: 1,
    sizeDecimals: "3",
    tenure: "condominium",
    titleChecked: true,
    sellerType: "agency",
    featured: false,
    photos: APARTMENT,
    sellerName: "Zubia Lettings",
    sellerPhone: "256772000049",
    lat: 0.2958,
    lng: 32.6489,
    description:
      "Sample listing. Two bedrooms, sitting room and kitchen in a small block with a shared compound and parking.",
    status: "approved",
    unitType: "two_bedroom",
    bathroom: "inside",
    ownKitchen: true,
    water: "piped_inside",
    power: "own_yaka",
    fenced: true,
    advanceMonths: 2,
    depositMonths: 1,
    brokerFeeMonths: 0,
  },
  {
    // Deliberately bad terms: six months in advance AND a broker fee the
    // tenant pays. Rejected, so the admin table shows what that looks like.
    id: "zb-050",
    type: "rent",
    title: "Bedsitter, 6 months advance required",
    priceUgx: 380_000,
    area: "Kajjansi",
    district: "Wakiso",
    bedrooms: 1,
    bathrooms: 1,
    sizeDecimals: "1",
    tenure: "mailo",
    titleChecked: false,
    sellerType: "broker",
    featured: false,
    photos: BEDSITTER,
    sellerName: "Quick Deals Agent",
    sellerPhone: "256772000050",
    lat: 0.1903,
    lng: 32.5447,
    description:
      "Sample listing. Rejected by review: six months' rent demanded in advance plus two months' commission from the tenant, with no written agreement offered.",
    status: "rejected",
    unitType: "bedsitter",
    bathroom: "inside",
    ownKitchen: true,
    water: "piped_yard",
    power: "own_yaka",
    fenced: false,
    advanceMonths: 6,
    depositMonths: 2,
    brokerFeeMonths: 2,
  },
  {
    id: "zb-051",
    type: "rent",
    title: "Single room self-contained, Seeta",
    priceUgx: 280_000,
    area: "Seeta",
    district: "Mukono",
    bedrooms: 1,
    bathrooms: 1,
    sizeDecimals: "1",
    tenure: "mailo",
    titleChecked: false,
    sellerType: "owner",
    featured: false,
    photos: SINGLE_ROOM_SC,
    sellerName: "Namatovu C.",
    sellerPhone: "256772000051",
    lat: 0.3719,
    lng: 32.7222,
    description:
      "Sample listing. Own bathroom inside, own Yaka meter, walled compound. Close to the Seeta stage.",
    status: "approved",
    unitType: "single_room",
    bathroom: "inside",
    ownKitchen: false,
    water: "piped_yard",
    power: "own_yaka",
    fenced: true,
    advanceMonths: 1,
    depositMonths: 1,
    brokerFeeMonths: 0,
  },
  {
    id: "zb-052",
    type: "rent",
    title: "1-bedroom near the airport, Katabi",
    priceUgx: 550_000,
    area: "Katabi",
    district: "Entebbe",
    bedrooms: 1,
    bathrooms: 1,
    sizeDecimals: "2",
    tenure: "leasehold",
    titleChecked: false,
    sellerType: "owner",
    featured: false,
    photos: APARTMENT,
    sellerName: "Ochieng P.",
    sellerPhone: "256772000052",
    lat: 0.0575,
    lng: 32.4489,
    description:
      "Sample listing. Archived because it has been taken. Kept so the admin table shows an archived row.",
    status: "archived",
    unitType: "one_bedroom",
    bathroom: "inside",
    ownKitchen: true,
    water: "piped_inside",
    power: "own_yaka",
    fenced: true,
    advanceMonths: 2,
    depositMonths: 1,
    brokerFeeMonths: 0,
  },
];

/** Staff and agents, so the Users & admins page and the charts have rows. */
const DEMO_USERS = [
  {
    email: "mary@example.com",
    fullName: "Achieng Mary",
    phone: "256772100001",
    role: "works_admin" as const,
  },
  {
    email: "peter@example.com",
    fullName: "Tumusiime Peter",
    phone: "256772100002",
    role: "broker_admin" as const,
  },
  {
    email: "grace@example.com",
    fullName: "Nabirye Grace",
    phone: "256772100003",
    role: "agent" as const,
  },
  {
    email: "daniel@example.com",
    fullName: "Okot Daniel",
    phone: "256772100004",
    role: "agent" as const,
  },
  {
    email: "sarah@example.com",
    fullName: "Nakimuli Sarah",
    phone: "256772100005",
    role: "user" as const,
  },
  {
    email: "joseph@example.com",
    fullName: "Wasswa Joseph",
    phone: "256772100006",
    role: "user" as const,
  },
];

/** A realistic inbox: mostly renters asking about rooms, one report. */
const DEMO_MESSAGES = [
  {
    topic: "general" as const,
    name: "Brenda N.",
    email: null,
    phone: "256772200001",
    listingId: "zb-032",
    message:
      "Is this single room still available? I can move in at the end of the month. Does the 300,000 include water?",
    handled: false,
  },
  {
    topic: "general" as const,
    name: "Emmanuel K.",
    email: "emmak@example.com",
    phone: null,
    listingId: "zb-034",
    message:
      "I would like to view the double room in Kisaasi on Saturday morning. Is the landlord around?",
    handled: false,
  },
  {
    topic: "report" as const,
    name: "Concerned renter",
    email: null,
    phone: "256772200003",
    listingId: "zb-050",
    message:
      "This broker asked me for 50,000 just to be shown the bedsitter, then stopped answering. Please check this listing.",
    handled: false,
  },
  {
    topic: "advertise" as const,
    name: "Hope Properties",
    email: "sales@hopeproperties.example",
    phone: "256772200004",
    listingId: null,
    message:
      "We manage about 40 rentals around Kira and Bweyogerere. How do we list them all on Zubia?",
    handled: false,
  },
  {
    topic: "plans" as const,
    name: "Moses B.",
    email: "moses@example.com",
    phone: "256772200005",
    listingId: null,
    message:
      "[Plan: Agent] I am a broker in Mukono. What does the monthly agent plan cost and how many listings do I get?",
    handled: true,
  },
  {
    topic: "help" as const,
    name: "Faith A.",
    email: null,
    phone: "256772200006",
    listingId: null,
    message:
      "What does self-contained mean exactly? I want a room where nobody else uses my bathroom.",
    handled: true,
  },
];

async function main() {
  // --- Listings -----------------------------------------------------------
  await db
    .insert(listings)
    .values(DEMO_LISTINGS)
    .onConflictDoUpdate({
      target: listings.id,
      set: {
        title: sql`excluded.title`,
        priceUgx: sql`excluded.price_ugx`,
        status: sql`excluded.status`,
        photos: sql`excluded.photos`,
        description: sql`excluded.description`,
        unitType: sql`excluded.unit_type`,
        bathroom: sql`excluded.bathroom`,
        advanceMonths: sql`excluded.advance_months`,
        depositMonths: sql`excluded.deposit_months`,
        brokerFeeMonths: sql`excluded.broker_fee_months`,
        featured: sql`excluded.featured`,
      },
    });

  // --- Users --------------------------------------------------------------
  // No password hash, so none of these can sign in. onConflictDoNothing on
  // the email index means re-running never disturbs an account whose
  // password someone has since set.
  for (const user of DEMO_USERS) {
    await db
      .insert(users)
      .values({ ...user, passwordHash: null })
      .onConflictDoNothing();
  }

  // --- Messages -----------------------------------------------------------
  // Cleared and re-inserted, because they have generated ids and would
  // otherwise pile up on every run.
  await db
    .delete(contactMessages)
    .where(sql`${contactMessages.name} in ${DEMO_MESSAGES.map((m) => m.name)}`);
  await db.insert(contactMessages).values(DEMO_MESSAGES);

  const counts = await db
    .select({
      status: listings.status,
      count: sql<number>`count(*)::int`,
    })
    .from(listings)
    .groupBy(listings.status);

  console.log("Demo data added.");
  console.log(
    "Listings by status:",
    Object.fromEntries(counts.map((c) => [c.status, c.count])),
  );
  console.log(`${DEMO_USERS.length} staff and agent accounts (no passwords).`);
  console.log(`${DEMO_MESSAGES.length} inbox messages, 2 already handled.`);
  console.log("");
  console.log("To sign in as one of them, give it a password, e.g.:");
  console.log(
    '  npm run db:create-admin -- mary@example.com "Achieng Mary" --role works_admin',
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Demo seeding failed:", error);
    process.exit(1);
  });
