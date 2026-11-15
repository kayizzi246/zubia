import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { SAMPLE_LISTINGS } from "@/lib/sample-listings";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rowToListing, type ListingRow } from "@/lib/supabase/rows";
import { createPublicClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

/** Tag the admin uses to refresh public pages after a change. */
export const LISTINGS_TAG = "listings";

/** One approved listing, or undefined if it doesn't exist or isn't live. */
export async function getPublicListing(id: string): Promise<Listing | undefined> {
  return (await getPublicListings()).find((l) => l.id === id);
}

/**
 * Approved listings for the public site. Cached so pages stay static and
 * fast; the admin refreshes the cache whenever a listing changes.
 * Falls back to sample data until Supabase is connected.
 */
export async function getPublicListings(): Promise<Listing[]> {
  "use cache";
  cacheTag(LISTINGS_TAG);
  cacheLife("hours");

  if (!isSupabaseConfigured()) return SAMPLE_LISTINGS;

  const { data, error } = await createPublicClient()
    .from("listings")
    .select("*")
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500); // TODO: paginate once there are more listings.

  if (error) {
    console.error("Could not load listings from Supabase:", error.message);
    return [];
  }
  return (data as ListingRow[]).map(rowToListing);
}
