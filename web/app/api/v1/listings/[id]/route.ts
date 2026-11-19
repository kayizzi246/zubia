import { getPublicListing } from "@/lib/data/listings";
import {
  listingMoveInTerms,
  listingMoveInTotal,
  moveInBreakdown,
  moveInWarnings,
  rentVersusTypical,
  UNIT_LABELS,
  UNIT_NOTES,
  BATHROOM_LABELS,
  BATHROOM_NOTES,
  VIEWING_FEE_WARNING,
} from "@/lib/uganda";
import { notFound, ok } from "../../_lib/respond";

/*
  GET /api/v1/listings/:id

  One listing, with everything the detail screen needs already worked out:
  the move-in cost itemised, the warnings about unusual terms, and the
  plain-language explanations of the room type and the bathroom.

  Those are computed server-side rather than left to the client so the
  Flutter app does not have to reimplement the rules in Dart, where they
  would drift away from the website's.
*/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await getPublicListing(id);
  if (!listing) return notFound("That listing is not available.");

  const isRent = listing.type === "rent";
  const terms = listingMoveInTerms(listing);
  const typical = rentVersusTypical(listing.unitType, listing.priceUGX);

  return ok({
    listing: {
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

      unitType: listing.unitType ?? null,
      unitLabel: listing.unitType ? UNIT_LABELS[listing.unitType] : null,
      unitNote: listing.unitType ? UNIT_NOTES[listing.unitType] : null,
      bathroom: listing.bathroom ?? null,
      bathroomLabel: listing.bathroom ? BATHROOM_LABELS[listing.bathroom] : null,
      bathroomNote: listing.bathroom ? BATHROOM_NOTES[listing.bathroom] : null,
      selfContained: isRent ? listing.bathroom === "inside" : null,
      ownKitchen: listing.ownKitchen ?? null,
      water: listing.water ?? null,
      power: listing.power ?? null,
      fenced: listing.fenced ?? null,
    },

    moveIn: isRent
      ? {
          advanceMonths: terms.advanceMonths,
          depositMonths: terms.depositMonths,
          brokerFeeMonths: terms.brokerFeeMonths,
          totalUGX: listingMoveInTotal(listing),
          breakdown: moveInBreakdown(listing.priceUGX, terms),
          warnings: moveInWarnings(terms),
        }
      : null,

    /** The usual rent for this kind of unit, so a first-timer has a yardstick. */
    typicalRent: typical
      ? { lowUGX: typical.low, highUGX: typical.high, verdict: typical.verdict }
      : null,

    safety: isRent
      ? [
          "See the actual room before you pay anything, and meet the landlord.",
          VIEWING_FEE_WARNING,
          "Get a written tenancy agreement saying the rent, the deposit and how you get the deposit back.",
          "Ask for a receipt for every payment, including the deposit.",
        ]
      : [
          "Visit the property before paying anything.",
          "Search the title at the land registry.",
          'Never send a "booking fee" by Mobile Money to a stranger.',
        ],
  });
}
