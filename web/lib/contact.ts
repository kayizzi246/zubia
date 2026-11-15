import { formatListingPrice } from "./format";
import type { Listing } from "./types";

// Links that start a WhatsApp chat or a phone call with a listing's seller.
// Used by the buttons and by the QR codes, so both always open the same thing.

/** WhatsApp chat with a ready-made first message, or null without a phone. */
export function whatsappLink(listing: Listing): string | null {
  if (!listing.sellerPhone) return null;
  const message = `Hello, I saw "${listing.title}" (${formatListingPrice(listing)}) on Zubia. Is it still available?`;
  return `https://wa.me/${listing.sellerPhone}?text=${encodeURIComponent(message)}`;
}

/** tel: link for calling the seller, or null without a phone. */
export function callLink(listing: Listing): string | null {
  return listing.sellerPhone ? `tel:+${listing.sellerPhone}` : null;
}
