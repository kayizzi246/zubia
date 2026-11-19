// Converts between database rows (snake_case) and the app's Listing type.

import type {
  Bathroom,
  Listing,
  ListingType,
  Power,
  SellerType,
  Tenure,
  UnitType,
  Water,
} from "@/lib/types";
import { DEFAULT_MOVE_IN } from "@/lib/uganda";

export type ListingStatus = "pending" | "approved" | "rejected" | "archived";

/** Tiered admin roles: see lib/permissions.ts and migration 0004. */
export type UserRole =
  | "user"
  | "agent"
  | "works_admin"
  | "broker_admin"
  | "super_admin";

export interface ListingRow {
  id: string;
  type: ListingType;
  title: string;
  price_ugx: number;
  area: string;
  district: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size_decimals: number;
  tenure: Tenure;
  title_checked: boolean;
  seller_type: SellerType;
  featured: boolean;
  photos: string[];
  seller_name: string | null;
  seller_phone: string | null;
  lat: number | null;
  lng: number | null;
  description: string;
  status: ListingStatus;
  owner_id: string | null;
  created_at: string;
  updated_at: string;

  // Rental details. Null on sale and land listings: see migration 0005.
  unit_type: UnitType | null;
  bathroom: Bathroom | null;
  own_kitchen: boolean | null;
  water: Water | null;
  power: Power | null;
  fenced: boolean | null;
  advance_months: number | null;
  deposit_months: number | null;
  broker_fee_months: number | null;
}

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

/** A listing plus the fields only admins see. */
export interface AdminListing extends Listing {
  status: ListingStatus;
  createdAt: string;
}

export function rowToListing(row: ListingRow): Listing {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    priceUGX: Number(row.price_ugx),
    area: row.area,
    district: row.district,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sizeDecimals: Number(row.size_decimals),
    tenure: row.tenure,
    titleChecked: row.title_checked,
    sellerType: row.seller_type,
    featured: row.featured,
    photos: row.photos ?? [],
    sellerName: row.seller_name,
    sellerPhone: row.seller_phone,
    // TODO(mapbox): listings without coordinates are left off the map.
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    description: row.description,
    unitType: row.unit_type,
    bathroom: row.bathroom,
    ownKitchen: row.own_kitchen,
    water: row.water,
    power: row.power,
    fenced: row.fenced,
    moveIn: rowToMoveIn(row),
  };
}

/**
 * The move-in terms, or null when the row says nothing about them. A
 * rental with nothing recorded falls back to the normal Ugandan terms
 * (one month in advance, one month deposit) when it is displayed, so a
 * listing never shows a move-in cost of zero.
 */
function rowToMoveIn(row: ListingRow): Listing["moveIn"] {
  const { advance_months, deposit_months, broker_fee_months } = row;
  if (
    advance_months === null &&
    deposit_months === null &&
    broker_fee_months === null
  ) {
    return null;
  }
  return {
    advanceMonths: advance_months ?? DEFAULT_MOVE_IN.advanceMonths,
    depositMonths: deposit_months ?? DEFAULT_MOVE_IN.depositMonths,
    brokerFeeMonths: broker_fee_months ?? DEFAULT_MOVE_IN.brokerFeeMonths,
  };
}

export function rowToAdminListing(row: ListingRow): AdminListing {
  return { ...rowToListing(row), status: row.status, createdAt: row.created_at };
}
