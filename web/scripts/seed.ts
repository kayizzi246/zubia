/*
  Puts the 40 sample listings into Postgres.

    npm run db:seed

  The sample data lives in TypeScript (lib/sample-listings.ts) because the
  site falls back to it when no database is configured. Seeding from that
  same array rather than a hand-written .sql file means the two can never
  drift apart.

  Safe to run more than once: listings are upserted by id, so re-running
  updates them instead of creating duplicates.
*/

import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { listings } from "../lib/db/schema";
import { SAMPLE_LISTINGS } from "../lib/sample-listings";
import type { Listing } from "../lib/types";

function toRow(listing: Listing) {
  return {
    id: listing.id,
    type: listing.type,
    title: listing.title,
    priceUgx: listing.priceUGX,
    area: listing.area,
    district: listing.district,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sizeDecimals: String(listing.sizeDecimals),
    tenure: listing.tenure,
    titleChecked: listing.titleChecked,
    sellerType: listing.sellerType,
    featured: listing.featured,
    photos: listing.photos,
    sellerName: listing.sellerName ?? null,
    sellerPhone: listing.sellerPhone ?? null,
    lat: listing.lat || null,
    lng: listing.lng || null,
    description: listing.description,
    // The samples exist to be browsed, so they go in already approved.
    status: "approved" as const,
    unitType: listing.unitType ?? null,
    bathroom: listing.bathroom ?? null,
    ownKitchen: listing.ownKitchen ?? null,
    water: listing.water ?? null,
    power: listing.power ?? null,
    fenced: listing.fenced ?? null,
    advanceMonths: listing.moveIn?.advanceMonths ?? null,
    depositMonths: listing.moveIn?.depositMonths ?? null,
    brokerFeeMonths: listing.moveIn?.brokerFeeMonths ?? null,
  };
}

async function main() {
  const rows = SAMPLE_LISTINGS.map(toRow);

  await db
    .insert(listings)
    .values(rows)
    .onConflictDoUpdate({
      target: listings.id,
      set: {
        type: sql`excluded.type`,
        title: sql`excluded.title`,
        priceUgx: sql`excluded.price_ugx`,
        area: sql`excluded.area`,
        district: sql`excluded.district`,
        bedrooms: sql`excluded.bedrooms`,
        bathrooms: sql`excluded.bathrooms`,
        sizeDecimals: sql`excluded.size_decimals`,
        tenure: sql`excluded.tenure`,
        titleChecked: sql`excluded.title_checked`,
        sellerType: sql`excluded.seller_type`,
        featured: sql`excluded.featured`,
        photos: sql`excluded.photos`,
        sellerName: sql`excluded.seller_name`,
        sellerPhone: sql`excluded.seller_phone`,
        lat: sql`excluded.lat`,
        lng: sql`excluded.lng`,
        description: sql`excluded.description`,
        status: sql`excluded.status`,
        unitType: sql`excluded.unit_type`,
        bathroom: sql`excluded.bathroom`,
        ownKitchen: sql`excluded.own_kitchen`,
        water: sql`excluded.water`,
        power: sql`excluded.power`,
        fenced: sql`excluded.fenced`,
        advanceMonths: sql`excluded.advance_months`,
        depositMonths: sql`excluded.deposit_months`,
        brokerFeeMonths: sql`excluded.broker_fee_months`,
      },
    });

  const byType = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});
  const rentals = rows.filter((r) => r.unitType).length;

  console.log(`Seeded ${rows.length} listings:`, byType);
  console.log(`${rentals} rentals have a Ugandan room type set.`);
  console.log("All are status=approved, so they show on the public site.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
