import "server-only";
import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, isDatabaseConfigured } from "@/lib/db";
import { rowToListing } from "@/lib/db/rows";
import { listings } from "@/lib/db/schema";
import { SAMPLE_LISTINGS } from "@/lib/sample-listings";
import type { Listing } from "@/lib/types";

/** Tag the admin uses to refresh public pages after a change. */
export const LISTINGS_TAG = "listings";

/** One approved listing, or undefined if it doesn't exist or isn't live. */
export async function getPublicListing(id: string): Promise<Listing | undefined> {
  return (await getPublicListings()).find((l) => l.id === id);
}

/**
 * Approved listings for the public site. Cached so pages stay static and
 * fast, which matters a great deal on a slow Ugandan connection; the admin
 * refreshes the cache whenever a listing changes.
 *
 * Falls back to sample data until DATABASE_URL is set, so the site runs
 * straight after a clone.
 */
export async function getPublicListings(): Promise<Listing[]> {
  "use cache";
  cacheTag(LISTINGS_TAG);
  cacheLife("hours");

  if (!isDatabaseConfigured()) return SAMPLE_LISTINGS;

  try {
    const rows = await db
      .select()
      .from(listings)
      .where(eq(listings.status, "approved"))
      .orderBy(desc(listings.featured), desc(listings.createdAt))
      .limit(500); // TODO: paginate once there are more listings.

    return rows.map(rowToListing);
  } catch (error) {
    // A database that is down must not take the whole site with it. An empty
    // list renders the "nothing matches" state instead of a crash.
    console.error(
      "Could not load listings from Postgres:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
