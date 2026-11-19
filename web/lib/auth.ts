import "server-only";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/db";
import type { UserRole } from "@/lib/db/enums";
import { can, isAdminRole, type Permission } from "@/lib/permissions";
import { getApiUser, getSessionUser } from "@/lib/auth/session";

/*
  The admin gate.

  IMPORTANT, AND DIFFERENT FROM BEFORE: with Supabase gone there is no Row
  Level Security behind these checks. Postgres sees one database user and
  cannot tell visitors apart, so this file is the only thing deciding who
  may read or change what.

  Every admin page, Server Action and Route Handler must call requireAdmin()
  or requirePermission() before touching data. Hiding a button is not
  security, and there is no longer a second line of defence in the database.
*/

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Convenience for the UI: admin.can("users.view"). */
  can: (permission: Permission) => boolean;
}

function toAdminUser(
  id: string,
  email: string,
  fullName: string | null,
  role: UserRole,
): AdminUser {
  return {
    id,
    email,
    name: fullName || email || "Admin",
    role,
    can: (permission: Permission) => can(role, permission),
  };
}

/**
 * The signed-in admin, or null. For Route Handlers, which answer with 401
 * instead of redirecting.
 */
export async function getAdminOrNull(): Promise<AdminUser | null> {
  if (!isDatabaseConfigured()) return null;
  const user = await getSessionUser();
  if (!user || !isAdminRole(user.role)) return null;
  return toAdminUser(user.id, user.email, user.fullName, user.role);
}

/**
 * Same, for an API request that may carry a Bearer token instead of a
 * cookie. Used by the /api/v1 endpoints the Flutter app calls.
 */
export async function getApiAdminOrNull(
  request: Request,
): Promise<AdminUser | null> {
  if (!isDatabaseConfigured()) return null;
  const user = await getApiUser(request);
  if (!user || !isAdminRole(user.role)) return null;
  return toAdminUser(user.id, user.email, user.fullName, user.role);
}

/**
 * The signed-in admin, whatever their tier, or a redirect to the login page.
 * Call this at the top of every admin page AND every admin Server Action.
 */
export async function requireAdmin(): Promise<AdminUser> {
  if (!isDatabaseConfigured()) redirect("/admin/setup");

  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!isAdminRole(user.role)) redirect("/admin/login?error=not-admin");

  return toAdminUser(user.id, user.email, user.fullName, user.role);
}

/**
 * The signed-in admin, but only if their tier allows `permission`.
 * Server Actions must use this too, so a works admin cannot reach an action
 * by crafting the request by hand.
 */
export async function requirePermission(
  permission: Permission,
): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (!admin.can(permission)) redirect("/admin?error=not-allowed");
  return admin;
}

/** Like requirePermission, but returns an error instead of redirecting. */
export async function checkPermission(
  permission: Permission,
): Promise<{ admin: AdminUser; allowed: boolean }> {
  const admin = await requireAdmin();
  return { admin, allowed: admin.can(permission) };
}
