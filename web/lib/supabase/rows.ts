// Converts between database rows (snake_case) and the app's Listing type.

import type { Listing, ListingType, SellerType, Tenure } from "@/lib/types";

export type ListingStatus = "pending" | "approved" | "rejected" | "archived";
export type UserRole = "user" | "agent" | "admin";

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
  };
}

export function rowToAdminListing(row: ListingRow): AdminListing {
  return { ...rowToListing(row), status: row.status, createdAt: row.created_at };
}
