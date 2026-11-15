import "server-only";
import { requireAdmin } from "@/lib/auth";
import {
  rowToAdminListing,
  type AdminListing,
  type ListingRow,
  type ListingStatus,
  type ProfileRow,
} from "@/lib/supabase/rows";
import { createClient } from "@/lib/supabase/server";
import type { ListingType } from "@/lib/types";

// Every function here checks for an admin first, then reads as that admin,
// so the database rules (RLS) still apply.

export interface AdminStats {
  total: number;
  byStatus: Record<ListingStatus, number>;
  featured: number;
  titleChecked: number;
  users: number;
  agents: number;
  byDistrict: { district: string; buy: number; rent: number; land: number }[];
  pending: AdminListing[];
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: listings }, { data: profiles }] = await Promise.all([
    supabase.from("listings").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("role"),
  ]);

  const rows = (listings ?? []) as ListingRow[];
  const byStatus: Record<ListingStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
  };
  const districts = new Map<string, Record<ListingType, number>>();

  for (const row of rows) {
    byStatus[row.status] += 1;
    const d = districts.get(row.district) ?? { buy: 0, rent: 0, land: 0 };
    d[row.type] += 1;
    districts.set(row.district, d);
  }

  return {
    total: rows.length,
    byStatus,
    featured: rows.filter((r) => r.featured).length,
    titleChecked: rows.filter((r) => r.title_checked).length,
    users: profiles?.length ?? 0,
    agents: profiles?.filter((p) => p.role === "agent").length ?? 0,
    byDistrict: [...districts.entries()]
      .map(([district, counts]) => ({ district, ...counts }))
      .sort((a, b) => b.buy + b.rent + b.land - (a.buy + a.rent + a.land)),
    pending: rows
      .filter((r) => r.status === "pending")
      .slice(0, 5)
      .map(rowToAdminListing),
  };
}

export async function getAdminListings(filter: {
  status?: ListingStatus;
  q?: string;
}): Promise<AdminListing[]> {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500); // TODO: paginate once there are more listings.

  if (filter.status) query = query.eq("status", filter.status);
  if (filter.q) {
    // Strip characters that have meaning in Supabase filter strings.
    const q = filter.q.replace(/[,()%]/g, " ").trim();
    if (q) query = query.or(`title.ilike.%${q}%,area.ilike.%${q}%,district.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ListingRow[]).map(rowToAdminListing);
}

export async function getAdminListing(id: string): Promise<AdminListing | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  return data ? rowToAdminListing(data as ListingRow) : null;
}

export interface ContactMessage {
  id: string;
  topic: "general" | "report" | "advertise" | "plans" | "help";
  name: string;
  email: string | null;
  phone: string | null;
  listing_id: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("handled", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return data as ContactMessage[];
}

export async function getProfiles(): Promise<ProfileRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as ProfileRow[];
}
