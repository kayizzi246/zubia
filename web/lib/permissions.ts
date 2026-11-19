/*
  Who can do what in the admin area.

  One table, used by both the server (lib/auth.ts, the Server Actions) and the
  UI (the sidebar, the users page).

  This table is now the ONLY thing enforcing admin permissions. Supabase's
  Row Level Security used to repeat these rules inside the database; plain
  Postgres cannot, because the app connects as a single database user and the
  database cannot tell one visitor from another. So hiding a button is not
  security, and neither is anything in the database: every page, Server
  Action and Route Handler must call requirePermission() from lib/auth.ts.
*/

import type { UserRole } from "@/lib/db/enums";

export const ADMIN_ROLES = ["works_admin", "broker_admin", "super_admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: UserRole): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/** Everything an admin might be allowed to do. */
export type Permission =
  /** See the dashboard and the listings table. */
  | "listings.view"
  /** Approve, reject, edit, add and delete listings and their photos. */
  | "listings.manage"
  /** Read and reply to enquiries from the public site. */
  | "messages.manage"
  /** Open the Users & admins page. */
  | "users.view"
  /** Move people between 'user' and 'agent'. */
  | "users.manage"
  /** Create admins and change anyone's role, including admin tiers. */
  | "admins.manage";

const PERMISSIONS: Record<AdminRole, Permission[]> = {
  works_admin: ["listings.view", "listings.manage", "messages.manage"],
  broker_admin: [
    "listings.view",
    "listings.manage",
    "messages.manage",
    "users.view",
    "users.manage",
  ],
  super_admin: [
    "listings.view",
    "listings.manage",
    "messages.manage",
    "users.view",
    "users.manage",
    "admins.manage",
  ],
};

export function can(role: UserRole, permission: Permission): boolean {
  return isAdminRole(role) && PERMISSIONS[role].includes(permission);
}

/** Roles this admin is allowed to hand out, for the role dropdown. */
export function assignableRoles(role: UserRole): UserRole[] {
  if (can(role, "admins.manage")) {
    return ["user", "agent", "works_admin", "broker_admin", "super_admin"];
  }
  if (can(role, "users.manage")) return ["user", "agent"];
  return [];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "User",
  agent: "Agent",
  works_admin: "Works admin",
  broker_admin: "Broker admin",
  super_admin: "Super admin",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  user: "Can save listings and send enquiries.",
  agent: "Can list properties for clients.",
  works_admin: "Reviews and approves listings, photos and messages.",
  broker_admin: "Manages broker and agent accounts, plus everything a works admin can do.",
  super_admin: "Full access, including creating admins and changing roles.",
};
