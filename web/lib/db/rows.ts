// Converts database rows into the app's Listing type.
//
// Drizzle already maps snake_case columns to camelCase fields, so this is
// thinner than the old Supabase version. What it still does is the part
// Drizzle cannot: turning Postgres numerics into numbers, nulls into the
// shapes the UI expects, and the three month columns into one MoveInTerms.

import type { ListingStatus, UserRole } from "./enums";
import type { ListingDbRow, UserRow } from "./schema";
import { DEFAULT_MOVE_IN } from "@/lib/uganda";
import type { Listing } from "@/lib/types";

export type { ListingStatus, UserRole };
export type { ListingDbRow, UserRow };

/** A listing plus the fields only admins see. */
export interface AdminListing extends Listing {
  status: ListingStatus;
  createdAt: string;
}

/** One row of the Users & admins table. */
export interface AdminProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  createdAt: string;
  /** True while an invite is outstanding and no password has been set. */
  pendingInvite: boolean;
}

export function rowToListing(row: ListingDbRow): Listing {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    priceUGX: Number(row.priceUgx),
    area: row.area,
    district: row.district,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    // numeric comes back as a string, because Postgres numerics can exceed
    // what a JS number holds. Plot sizes cannot, so this is safe.
    sizeDecimals: Number(row.sizeDecimals),
    tenure: row.tenure,
    titleChecked: row.titleChecked,
    sellerType: row.sellerType,
    featured: row.featured,
    photos: row.photos ?? [],
    sellerName: row.sellerName,
    sellerPhone: row.sellerPhone,
    // Listings without coordinates are left off the map rather than dropped.
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    description: row.description,
    unitType: row.unitType,
    bathroom: row.bathroom,
    ownKitchen: row.ownKitchen,
    water: row.water,
    power: row.power,
    fenced: row.fenced,
    moveIn: rowToMoveIn(row),
  };
}

/**
 * The move-in terms, or null when the row says nothing about them. A rental
 * with nothing recorded falls back to the normal Ugandan terms when it is
 * displayed, so a listing never shows a move-in cost of zero.
 */
function rowToMoveIn(row: ListingDbRow): Listing["moveIn"] {
  const { advanceMonths, depositMonths, brokerFeeMonths } = row;
  if (
    advanceMonths === null &&
    depositMonths === null &&
    brokerFeeMonths === null
  ) {
    return null;
  }
  return {
    advanceMonths: advanceMonths ?? DEFAULT_MOVE_IN.advanceMonths,
    depositMonths: depositMonths ?? DEFAULT_MOVE_IN.depositMonths,
    brokerFeeMonths: brokerFeeMonths ?? DEFAULT_MOVE_IN.brokerFeeMonths,
  };
}

export function rowToAdminListing(row: ListingDbRow): AdminListing {
  return {
    ...rowToListing(row),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function rowToAdminProfile(row: UserRow): AdminProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    pendingInvite: row.passwordHash === null && row.inviteTokenHash !== null,
  };
}
