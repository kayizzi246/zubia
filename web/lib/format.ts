import type { Listing, Tenure } from "./types";

/** 450000000 -> "UGX 450M", 2500000 -> "UGX 2.5M", 850000 -> "UGX 850K" */
export function formatPriceUGX(amount: number): string {
  const short = (value: number, suffix: string) =>
    `UGX ${Number(value.toFixed(1)).toString()}${suffix}`;

  if (amount >= 1_000_000_000) return short(amount / 1_000_000_000, "B");
  if (amount >= 1_000_000) return short(amount / 1_000_000, "M");
  if (amount >= 1_000) return short(amount / 1_000, "K");
  return `UGX ${amount}`;
}

/** Short label for map pins and dropdowns: 450000000 -> "450M". */
export function formatPriceShort(amount: number): string {
  return formatPriceUGX(amount).replace("UGX ", "");
}

/** Adds "/month" for rentals. */
export function formatListingPrice(listing: Listing): string {
  const price = formatPriceUGX(listing.priceUGX);
  return listing.type === "rent" ? `${price}/month` : price;
}

export const TENURE_LABELS: Record<Tenure, string> = {
  mailo: "Mailo",
  freehold: "Freehold",
  leasehold: "Leasehold",
  kibanja: "Kibanja",
  condominium: "Condominium",
};

/** 50 -> "50 decimals", 100 -> "1 acre", 250 -> "2.5 acres" */
export function formatSize(decimals: number): string {
  if (decimals < 100) return `${decimals} decimals`;
  const acres = Number((decimals / 100).toFixed(2));
  return `${acres} ${acres === 1 ? "acre" : "acres"}`;
}

/**
 * Turns a Ugandan phone number into international digits for WhatsApp and
 * tel: links. "0772 123 456", "+256 772 123456" and "772123456" all become
 * "256772123456". Returns null if it doesn't look like a valid number.
 */
export function normalizeUgPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^256\d{9}$/.test(digits)) return digits;
  if (/^0\d{9}$/.test(digits)) return `256${digits.slice(1)}`;
  if (/^[37]\d{8}$/.test(digits)) return `256${digits}`;
  return null;
}

/** "256772123456" -> "+256 772 123 456" */
export function formatPhone(international: string): string {
  const m = international.match(/^256(\d{3})(\d{3})(\d{3})$/);
  return m ? `+256 ${m[1]} ${m[2]} ${m[3]}` : `+${international}`;
}

export const TENURE_NOTES: Record<Tenure, string> = {
  mailo: "Land owned in perpetuity, often with occupants (bibanja) on it. Check who lives on the land before you buy.",
  freehold: "Full ownership with no time limit.",
  leasehold: "Held for a set number of years. Check how many years remain on the lease.",
  kibanja: "A right to occupy mailo land. The landlord must consent to a sale.",
  condominium: "A title for one unit in a shared building, plus a share of the common areas.",
};
