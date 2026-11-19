import "server-only";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ListingStatus, MessageTopic } from "@/lib/db/enums";
import {
  rowToAdminListing,
  rowToAdminProfile,
  type AdminListing,
  type AdminProfile,
} from "@/lib/db/rows";
import { contactMessages, listings, users } from "@/lib/db/schema";

/*
  Admin reads.

  Every function checks permission FIRST and then queries. With Supabase gone
  there is no Row Level Security to fall back on, so that check is the whole
  of the protection: a missing requireAdmin() here would expose data to
  anyone who knew the URL.
*/

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

  // Counting in the database rather than pulling every row into Node, so the
  // dashboard stays fast as the table grows.
  const [statusCounts, badgeCounts, userCounts, districtCounts, pendingRows] =
    await Promise.all([
      db
        .select({ status: listings.status, count: sql<number>`count(*)::int` })
        .from(listings)
        .groupBy(listings.status),

      db
        .select({
          featured: sql<number>`count(*) filter (where ${listings.featured})::int`,
          titleChecked: sql<number>`count(*) filter (where ${listings.titleChecked})::int`,
          total: sql<number>`count(*)::int`,
        })
        .from(listings),

      db
        .select({
          total: sql<number>`count(*)::int`,
          agents: sql<number>`count(*) filter (where ${users.role} = 'agent')::int`,
        })
        .from(users),

      db
        .select({
          district: listings.district,
          buy: sql<number>`count(*) filter (where ${listings.type} = 'buy')::int`,
          rent: sql<number>`count(*) filter (where ${listings.type} = 'rent')::int`,
          land: sql<number>`count(*) filter (where ${listings.type} = 'land')::int`,
        })
        .from(listings)
        .groupBy(listings.district),

      db
        .select()
        .from(listings)
        .where(eq(listings.status, "pending"))
        .orderBy(desc(listings.createdAt))
        .limit(5),
    ]);

  const byStatus: Record<ListingStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
  };
  for (const row of statusCounts) byStatus[row.status] = row.count;

  const badges = badgeCounts[0] ?? { featured: 0, titleChecked: 0, total: 0 };
  const people = userCounts[0] ?? { total: 0, agents: 0 };

  return {
    total: badges.total,
    byStatus,
    featured: badges.featured,
    titleChecked: badges.titleChecked,
    users: people.total,
    agents: people.agents,
    byDistrict: districtCounts
      .map((d) => ({
        district: d.district,
        buy: d.buy,
        rent: d.rent,
        land: d.land,
      }))
      // Busiest district first, as the dashboard chart expects.
      .sort((a, b) => b.buy + b.rent + b.land - (a.buy + a.rent + a.land)),
    pending: pendingRows.map(rowToAdminListing),
  };
}

export async function getAdminListings(filter: {
  status?: ListingStatus;
  q?: string;
}): Promise<AdminListing[]> {
  await requireAdmin();

  const where: SQL[] = [];
  if (filter.status) where.push(eq(listings.status, filter.status));

  if (filter.q?.trim()) {
    // Drizzle sends this as a bound parameter, so the only escaping needed
    // is for LIKE's own wildcards.
    const needle = `%${filter.q.trim().replace(/[\\%_]/g, "\\$&")}%`;
    const match = or(
      ilike(listings.title, needle),
      ilike(listings.area, needle),
      ilike(listings.district, needle),
    );
    if (match) where.push(match);
  }

  const rows = await db
    .select()
    .from(listings)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(listings.createdAt))
    .limit(500); // TODO: paginate once there are more listings.

  return rows.map(rowToAdminListing);
}

export async function getAdminListing(id: string): Promise<AdminListing | null> {
  await requireAdmin();
  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  return rows[0] ? rowToAdminListing(rows[0]) : null;
}

export interface ContactMessage {
  id: string;
  topic: MessageTopic;
  name: string;
  email: string | null;
  phone: string | null;
  listing_id: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  await requirePermission("messages.manage");

  const rows = await db
    .select()
    .from(contactMessages)
    // Unhandled first, newest within each group: the inbox opens on what
    // still needs an answer.
    .orderBy(asc(contactMessages.handled), desc(contactMessages.createdAt))
    .limit(300);

  return rows.map((row) => ({
    id: row.id,
    topic: row.topic,
    name: row.name,
    email: row.email,
    phone: row.phone,
    listing_id: row.listingId,
    message: row.message,
    handled: row.handled,
    created_at: row.createdAt.toISOString(),
  }));
}

export async function getProfiles(): Promise<AdminProfile[]> {
  await requirePermission("users.view");
  const rows = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(500);
  return rows.map(rowToAdminProfile);
}
