// Listing shape. Field names are chosen so they map 1:1 to a Supabase
// `listings` table later (camelCase here, snake_case columns there).

export type ListingType = "buy" | "rent" | "land";

export type Tenure =
  | "mailo"
  | "freehold"
  | "leasehold"
  | "kibanja"
  | "condominium";

export type SellerType = "owner" | "broker" | "agency" | "developer";

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
}
