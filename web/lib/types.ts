// Listing shape. Field names are chosen so they map 1:1 to a Supabase
// `listings` table later (camelCase here, snake_case columns there).

import type {
  Bathroom,
  MoveInTerms,
  Power,
  UnitType,
  Water,
} from "./uganda";

export type ListingType = "buy" | "rent" | "land";

export type Tenure =
  | "mailo"
  | "freehold"
  | "leasehold"
  | "kibanja"
  | "condominium";

export type SellerType = "owner" | "broker" | "agency" | "developer";

// The Uganda-specific rental vocabulary lives in ./uganda. It is re-exported
// here so callers can keep importing every listing type from one place.
export type { Bathroom, MoveInTerms, Power, UnitType, Water };

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  /** Sale price, or monthly rent when type is "rent". */
  priceUGX: number;
  area: string;
  district: string;
  /** null for land. */
  bedrooms: number | null;
  /** null for land. */
  bathrooms: number | null;
  /** Plot size in decimals (100 decimals = 1 acre). */
  sizeDecimals: number;
  tenure: Tenure;
  titleChecked: boolean;
  sellerType: SellerType;
  featured: boolean;
  photos: string[];
  /** Name shown on the seller card, e.g. "Sarah N." or "Kampala Homes Ltd". */
  sellerName?: string | null;
  /** Phone in international form without "+", e.g. "256772123456". Used for WhatsApp and Call. */
  sellerPhone?: string | null;
  lat: number;
  lng: number;
  description: string;

  // --- Rentals -----------------------------------------------------------
  // All optional, so sale and land listings stay valid without them. On a
  // "rent" listing these are what people actually search and decide on.

  /**
   * What kind of unit it is in Ugandan terms: single room, double room,
   * bedsitter, 1 bedroom and so on. This matters more than the bedroom
   * count, because a "single room" and a "1 bedroom" are different
   * products at different prices even though both have one room to sleep in.
   */
  unitType?: UnitType | null;
  /** Where the toilet and shower are. Drives the "Self-contained" badge. */
  bathroom?: Bathroom | null;
  /** Whether the unit has its own kitchen rather than cooking in the room. */
  ownKitchen?: boolean | null;
  water?: Water | null;
  power?: Power | null;
  /** Walled or fenced compound with a gate. */
  fenced?: boolean | null;
  /** How many months of rent a tenant must pay before getting the keys. */
  moveIn?: MoveInTerms | null;
}
