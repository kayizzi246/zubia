// Search filters. They live in the URL (/search?type=rent&beds=2) so a
// search can be refreshed, bookmarked or shared on WhatsApp.
// TODO(supabase): turn these filters into a Supabase query instead of
// filtering an in-memory array.

import type { Listing, ListingType, SellerType, Tenure } from "./types";

export type SortKey = "featured" | "price-asc" | "price-desc" | "size-desc";

export interface SearchFilters {
  type: ListingType;
  q: string;
  district: string;
  minPrice: number | null;
  maxPrice: number | null;
  beds: number | null;
  baths: number | null;
  seller: SellerType | null;
  tenure: Tenure | null;
  titleChecked: boolean;
  sort: SortKey;
}

export const DISTRICTS = ["Kampala", "Wakiso", "Entebbe", "Mukono"];

export const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "buy", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "land", label: "Land" },
];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "size-desc", label: "Biggest plot" },
];

/** Price steps for the min/max dropdowns. Rent is per month. */
export const PRICE_STEPS: Record<ListingType, number[]> = {
  buy: [50e6, 100e6, 200e6, 300e6, 500e6, 1e9, 2e9],
  land: [20e6, 50e6, 100e6, 200e6, 500e6, 1e9],
  rent: [300e3, 500e3, 1e6, 2e6, 3e6, 5e6],
};

export const SELLER_TYPES: { value: SellerType; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "broker", label: "Broker" },
  { value: "agency", label: "Agency" },
  { value: "developer", label: "Developer" },
];

const TENURES: Tenure[] = [
  "mailo",
  "freehold",
  "leasehold",
  "kibanja",
  "condominium",
];

export const DEFAULT_FILTERS: SearchFilters = {
  type: "buy",
  q: "",
  district: "",
  minPrice: null,
  maxPrice: null,
  beds: null,
  baths: null,
  seller: null,
  tenure: null,
  titleChecked: false,
  sort: "featured",
};

function toNumber(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Reads filters from URL params, ignoring anything invalid. */
export function parseFilters(params: {
  get(key: string): string | null;
}): SearchFilters {
  const type = params.get("type");
  const tenure = params.get("tenure");
  const sort = params.get("sort");
  const district = params.get("district") ?? "";
  const seller = params.get("seller");

  return {
    type: LISTING_TYPES.some((t) => t.value === type)
      ? (type as ListingType)
      : "buy",
    q: params.get("q") ?? "",
    district: DISTRICTS.includes(district) ? district : "",
    minPrice: toNumber(params.get("min")),
    maxPrice: toNumber(params.get("max")),
    beds: toNumber(params.get("beds")),
    baths: toNumber(params.get("baths")),
    seller: SELLER_TYPES.some((t) => t.value === seller) ? (seller as SellerType) : null,
    tenure: TENURES.includes(tenure as Tenure) ? (tenure as Tenure) : null,
    titleChecked: params.get("title") === "1",
    sort: SORT_OPTIONS.some((s) => s.value === sort)
      ? (sort as SortKey)
      : "featured",
  };
}

/** The inverse of parseFilters. Leaves out defaults to keep URLs short. */
export function filtersToQuery(f: SearchFilters): string {
  const params = new URLSearchParams();
  params.set("type", f.type);
  if (f.q.trim()) params.set("q", f.q.trim());
  if (f.district) params.set("district", f.district);
  if (f.minPrice) params.set("min", String(f.minPrice));
  if (f.maxPrice) params.set("max", String(f.maxPrice));
  if (f.beds && f.type !== "land") params.set("beds", String(f.beds));
  if (f.baths && f.type !== "land") params.set("baths", String(f.baths));
  if (f.seller) params.set("seller", f.seller);
  if (f.tenure) params.set("tenure", f.tenure);
  if (f.titleChecked) params.set("title", "1");
  if (f.sort !== "featured") params.set("sort", f.sort);
  return params.toString();
}

function matchesText(listing: Listing, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [listing.title, listing.area, listing.district]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

const SORTERS: Record<SortKey, (a: Listing, b: Listing) => number> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured),
  "price-asc": (a, b) => a.priceUGX - b.priceUGX,
  "price-desc": (a, b) => b.priceUGX - a.priceUGX,
  "size-desc": (a, b) => b.sizeDecimals - a.sizeDecimals,
};

export function applyFilters(
  listings: Listing[],
  f: SearchFilters,
): Listing[] {
  return listings
    .filter(
      (l) =>
        l.type === f.type &&
        matchesText(l, f.q) &&
        (!f.district || l.district === f.district) &&
        (f.minPrice === null || l.priceUGX >= f.minPrice) &&
        (f.maxPrice === null || l.priceUGX <= f.maxPrice) &&
        (f.beds === null || f.type === "land" || (l.bedrooms ?? 0) >= f.beds) &&
        (f.baths === null || f.type === "land" || (l.bathrooms ?? 0) >= f.baths) &&
        (f.seller === null || l.sellerType === f.seller) &&
        (f.tenure === null || l.tenure === f.tenure) &&
        (!f.titleChecked || l.titleChecked),
    )
    .sort(SORTERS[f.sort]);
}

const SEARCH_HEADINGS: Record<ListingType, string> = {
  buy: "Homes for sale",
  rent: "Homes for rent",
  land: "Land for sale",
};

/** "Homes for rent in Kampala", for headings and saved-search names. */
export function describeSearch(f: SearchFilters): string {
  const place = f.district || f.q.trim();
  return place ? `${SEARCH_HEADINGS[f.type]} in ${place}` : SEARCH_HEADINGS[f.type];
}

/** How many filters beyond type and text are switched on. */
export function countActiveFilters(f: SearchFilters): number {
  return [
    f.district,
    f.minPrice,
    f.maxPrice,
    f.type !== "land" && f.beds,
    f.type !== "land" && f.baths,
    f.seller,
    f.tenure,
    f.titleChecked,
  ].filter(Boolean).length;
}
