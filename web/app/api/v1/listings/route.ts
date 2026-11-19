import { getPublicListings } from "@/lib/data/listings";
import {
  applyFilters,
  DEFAULT_FILTERS,
  parseFilters,
  type SearchFilters,
} from "@/lib/search";
import { listingMoveInTotal, listingMoveInTerms } from "@/lib/uganda";
import type { Listing } from "@/lib/types";
import { intParam, ok } from "../_lib/respond";

/*
  GET /api/v1/listings

  The search, for the Flutter app. It takes exactly the same query
  parameters as the website's /search URL, so a link shared from the app and
  one shared from the web mean the same thing:

    ?type=rent&unit=single_room&sc=1&movein=500000&district=Kampala
    &min=100000&max=400000&q=kireka&sort=price-asc&limit=20&offset=0

  Filtering reuses lib/search.ts rather than rewriting the rules in SQL, so
  the app and the website can never disagree about what "self-contained"
  means. That reads from the same cached listing set the web pages use.
*/

/**
 * The listing as the API returns it.
 *
 * moveInTotalUGX is computed here on purpose: it is the number Ugandan
 * renters actually decide on, and working it out server-side means the
 * mobile app, the website and any future client all show the same figure.
 */
function toApiListing(listing: Listing) {
  const isRent = listing.type === "rent";
  const terms = listingMoveInTerms(listing);

  return {
    id: listing.id,
    type: listing.type,
    title: listing.title,
    priceUGX: listing.priceUGX,
    area: listing.area,
    district: listing.district,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sizeDecimals: listing.sizeDecimals,
    tenure: listing.tenure,
    titleChecked: listing.titleChecked,
    sellerType: listing.sellerType,
    sellerName: listing.sellerName ?? null,
    sellerPhone: listing.sellerPhone ?? null,
    featured: listing.featured,
    photos: listing.photos,
    lat: listing.lat,
    lng: listing.lng,
    description: listing.description,

    // Rental fields. Null on sale and land listings.
    unitType: listing.unitType ?? null,
    bathroom: listing.bathroom ?? null,
    selfContained: isRent ? listing.bathroom === "inside" : null,
    ownKitchen: listing.ownKitchen ?? null,
    water: listing.water ?? null,
    power: listing.power ?? null,
    fenced: listing.fenced ?? null,
    moveIn: isRent
      ? {
          advanceMonths: terms.advanceMonths,
          depositMonths: terms.depositMonths,
          brokerFeeMonths: terms.brokerFeeMonths,
          totalUGX: listingMoveInTotal(listing),
        }
      : null,
  };
}

export type ApiListing = ReturnType<typeof toApiListing>;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  // parseFilters ignores anything invalid and falls back to defaults, so a
  // malformed query returns sensible results rather than an error.
  const filters: SearchFilters = {
    ...DEFAULT_FILTERS,
    ...parseFilters(params),
  };

  const all = applyFilters(await getPublicListings(), filters);

  const limit = intParam(params, "limit", 20, 100);
  // offset is zero-based, so it needs its own parse: intParam treats 0 as
  // missing and would send every request back to page one.
  const rawOffset = Number(params.get("offset") ?? 0);
  const offset =
    Number.isInteger(rawOffset) && rawOffset >= 0
      ? Math.min(rawOffset, 10_000)
      : 0;

  const page = all.slice(offset, offset + limit);

  return ok({
    listings: page.map(toApiListing),
    total: all.length,
    limit,
    offset,
    hasMore: offset + page.length < all.length,
  });
}
