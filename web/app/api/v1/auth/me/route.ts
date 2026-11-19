import { bearerToken, destroySession, getApiUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db";
import { can, isAdminRole } from "@/lib/permissions";
import { ok, unauthorized, unavailable } from "../../_lib/respond";

/*
  GET    /api/v1/auth/me      who the token belongs to
  DELETE /api/v1/auth/me      sign this device out

  The app calls GET on startup to find out whether its stored token is still
  good, and DELETE when someone signs out. DELETE removes the session row,
  so the token stops working at once rather than when it expires.
*/

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return unavailable("Accounts are not switched on yet.");
  }

  const user = await getApiUser(request);
  if (!user) return unauthorized("That session has expired. Sign in again.");

  return ok({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    // Told to the client so it can hide what it must not offer. The server
    // still re-checks on every request: this is for the interface only.
    isAdmin: isAdminRole(user.role),
    permissions: {
      listingsView: can(user.role, "listings.view"),
      listingsManage: can(user.role, "listings.manage"),
      messagesManage: can(user.role, "messages.manage"),
      usersView: can(user.role, "users.view"),
      usersManage: can(user.role, "users.manage"),
      adminsManage: can(user.role, "admins.manage"),
    },
  });
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) {
    return unavailable("Accounts are not switched on yet.");
  }

  // Only the token that was sent is revoked, so signing out on the phone
  // does not sign the person out of the website too.
  await destroySession(bearerToken(request));
  return ok({ signedOut: true });
}
