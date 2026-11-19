// Search filters. They live in the URL (/search?type=rent&beds=2) so a
// search can be refreshed, bookmarked or shared on WhatsApp.
// TODO(db): push these filters into SQL instead of
// filtering an in-memory array.

import type { Listing, ListingType, SellerType, Tenure } from "./types";
import {
  isSelfContained,
  listingMoveInTotal,
  UNIT_LABELS,
  UNIT_LOCAL_NAMES,
  UNIT_TYPES,
  type UnitType,
} from "./uganda";

export type SortKey =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "size-desc"
  | "movein-asc";

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
  /** Ugandan unit type: single room, double room, bedsitter, 1 bedroom... */
  unit: UnitType | null;
  /** Only show units whose toilet and shower are inside the unit. */
  selfContained: boolean;
  /** Most cash the tenant can raise to move in (advance + deposit + fees). */
  maxMoveIn: number | null;
}

export const DISTRICTS = ["Kampala", "Wakiso", "Entebbe", "Mukono"];

// Renting comes first: far more people are looking for a room to live in
// than are buying a house or a plot.
export const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "rent", label: "Rent" },
  { value: "buy", label: "Buy" },
  { value: "land", label: "Land" },
];

/** Every sort key, used to validate what comes out of the URL. */
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "size-desc", label: "Biggest plot" },
  { value: "movein-asc", label: "Least money to move in" },
];

/**
 * The sorts worth offering for one kind of search, with wording that fits.
 * "Biggest plot" means nothing when you are renting a room, and "least
 * money to move in" means nothing when you are buying, so neither is shown
 * where it doesn't apply.
 */
export function sortOptionsFor(
  type: ListingType,
): { value: SortKey; label: string }[] {
  if (type === "rent") {
    return [
      { value: "featured", label: "Featured first" },
      { value: "price-asc", label: "Cheapest rent first" },
      { value: "movein-asc", label: "Least money to move in" },
      { value: "price-desc", label: "Highest rent first" },
    ];
  }
  return [
    { value: "featured", label: "Featured first" },
    { value: "price-asc", label: "Price: low to high" },
    { value: "price-desc", label: "Price: high to low" },
    { value: "size-desc", label: "Biggest plot" },
  ];
}

/**
 * Price steps for the min/max dropdowns. Rent is per month, and the rent
 * steps start at 100,000 because that is where real single rooms start.
 * The old 300,000 floor hid the cheapest half of the market.
 */
export const PRICE_STEPS: Record<ListingType, number[]> = {
  buy: [50e6, 100e6, 200e6, 300e6, 500e6, 1e9, 2e9],
  land: [20e6, 50e6, 100e6, 200e6, 500e6, 1e9],
  rent: [100e3, 150e3, 200e3, 300e3, 500e3, 800e3, 1.5e6, 3e6, 5e6],
};

/** Budget steps for "how much can you raise to move in?". */
export const MOVE_IN_STEPS = [300e3, 500e3, 800e3, 1.2e6, 2e6, 4e6, 8e6];

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
  type: "rent",
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
  unit: null,
  selfContained: false,
  maxMoveIn: null,
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
  const unit = params.get("unit");

  return {
    type: LISTING_TYPES.some((t) => t.value === type)
      ? (type as ListingType)
      : "rent",
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
    unit: UNIT_TYPES.includes(unit as UnitType) ? (unit as UnitType) : null,
    selfContained: params.get("sc") === "1",
    maxMoveIn: toNumber(params.get("movein")),
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
  if (f.unit && f.type === "rent") params.set("unit", f.unit);
  if (f.selfContained && f.type === "rent") params.set("sc", "1");
  if (f.maxMoveIn && f.type === "rent")
    params.set("movein", String(f.maxMoveIn));
  return params.toString();
}

/**
 * Words people type that mean the same thing as one of our labels, so the
 * box finds the right homes whether someone writes "self contained",
 * "selfcontained", "muzigo" or "studio".
 */
const SYNONYMS: Record<string, string> = {
  selfcontained: "self-contained",
  "self contained": "self-contained",
  "self contain": "self-contained",
  sc: "self-contained",
  studio: "bedsitter",
  "bed sitter": "bedsitter",
  "bed-sitter": "bedsitter",
  muzigo: "single room",
  mizigo: "single room",
  "single roomed": "single room",
  "double roomed": "double room",
  bq: "boys' quarters",
  quarters: "boys' quarters",
  "servants quarters": "boys' quarters",
  "1 bed": "1 bedroom",
  "2 bed": "2 bedrooms",
  "3 bed": "3+ bedrooms",
};

/** Everything about a listing that free text should be able to match. */
function searchableText(listing: Listing): string {
  const unit = listing.unitType;
  return [
    listing.title,
    listing.area,
    listing.district,
    unit ? UNIT_LABELS[unit] : "",
    unit ? (UNIT_LOCAL_NAMES[unit] ?? "") : "",
    isSelfContained(listing.bathroom) ? "self-contained" : "",
  ]
    .join(" ")
    .toLowerCase();
}

function matchesText(listing: Listing, q: string): boolean {
  const raw = q.trim().toLowerCase();
  if (!raw) return true;
  const needle = SYNONYMS[raw] ?? raw;
  return searchableText(listing).includes(needle);
}

const SORTERS: Record<SortKey, (a: Listing, b: Listing) => number> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured),
  "price-asc": (a, b) => a.priceUGX - b.priceUGX,
  "price-desc": (a, b) => b.priceUGX - a.priceUGX,
  "size-desc": (a, b) => b.sizeDecimals - a.sizeDecimals,
  "movein-asc": (a, b) => listingMoveInTotal(a) - listingMoveInTotal(b),
};

export function applyFilters(
  listings: Listing[],
  f: SearchFilters,
): Listing[] {
  const isRent = f.type === "rent";

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
        (!f.titleChecked || l.titleChecked) &&
        // Rental-only filters. A listing that hasn't said what it is or
        // where its bathroom is gets filtered out when someone asks for
        // something specific, rather than shown and wasting their trip.
        (!isRent || f.unit === null || l.unitType === f.unit) &&
        (!isRent || !f.selfContained || isSelfContained(l.bathroom)) &&
        (!isRent ||
          f.maxMoveIn === null ||
          listingMoveInTotal(l) <= f.maxMoveIn),
    )
    .sort(SORTERS[f.sort]);
}

const SEARCH_HEADINGS: Record<ListingType, string> = {
  buy: "Homes for sale",
  rent: "Places to rent",
  land: "Land for sale",
};

/**
 * "Single rooms, self-contained, to rent in Kampala". Used for headings and
 * saved-search names, so it reads back the way someone would say it.
 */
export function describeSearch(f: SearchFilters): string {
  const place = f.district || f.q.trim();

  if (f.type === "rent" && f.unit) {
    const unit = UNIT_LABELS[f.unit].toLowerCase();
    const sc = f.selfContained ? ", self-contained" : "";
    return place
      ? `${unit}${sc} to rent in ${place}`
      : `${unit}${sc} to rent`;
  }

  const head = SEARCH_HEADINGS[f.type];
  if (f.type === "rent" && f.selfContained) {
    return place
      ? `Self-contained places to rent in ${place}`
      : "Self-contained places to rent";
  }
  return place ? `${head} in ${place}` : head;
}

/** How many filters beyond type and text are switched on. */
export function countActiveFilters(f: SearchFilters): number {
  const isRent = f.type === "rent";
  return [
    f.district,
    f.minPrice,
    f.maxPrice,
    f.type !== "land" && f.beds,
    f.type !== "land" && f.baths,
    f.seller,
    f.tenure,
    f.titleChecked,
    isRent && f.unit,
    isRent && f.selfContained,
    isRent && f.maxMoveIn,
  ].filter(Boolean).length;
}
