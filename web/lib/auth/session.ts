import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import type { UserRole } from "@/lib/db/enums";

/*
  Sessions, replacing Supabase Auth's JWTs.

  One opaque random token per signed-in device. Only its SHA-256 hash is
  stored, so a database dump cannot be replayed as a login. The same token
  works two ways, which is what lets one backend serve both clients:

    web     httpOnly cookie, set by the server, invisible to JavaScript
    Flutter Authorization: Bearer <token>

  An opaque token is used rather than a JWT on purpose: signing out and
  revoking a stolen device have to work immediately, and a stateless JWT
  cannot be revoked before it expires.
*/

export const SESSION_COOKIE = "zubia_session";
const TOKEN_BYTES = 32;
const SESSION_DAYS = 30;

/** The signed-in person, as the app needs them. */
export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a session and returns the raw token. The caller stores it: in a
 * cookie for the web, or hands it to the client for the Flutter app. This is
 * the only moment the raw token exists on the server.
 */
export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    userAgent: meta.userAgent?.slice(0, 500) ?? null,
    ip: meta.ip?.slice(0, 100) ?? null,
    expiresAt,
  });

  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));

  return { token, expiresAt };
}

/**
 * Looks up the user behind a token, or null if it is unknown or expired.
 *
 * The expiry is checked in the query rather than in JavaScript, so an
 * expired row can never be treated as valid.
 */
export async function getUserByToken(
  token: string | undefined | null,
): Promise<SessionUser | null> {
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      sessionId: sessions.id,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Best-effort activity stamp, so someone can see which devices are live.
  // A failure here must not break the request.
  void db
    .update(sessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(sessions.id, row.sessionId))
    .catch(() => {});

  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
  };
}

// ---------------------------------------------------------------------------
// Web: the session cookie
// ---------------------------------------------------------------------------

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Lax still sends the cookie when returning from an external link, which
    // Strict would block, while keeping cross-site POSTs out.
    sameSite: "lax",
    // Plain HTTP on localhost would drop a Secure cookie.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** The signed-in user for a Server Component or Server Action. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return getUserByToken(store.get(SESSION_COOKIE)?.value);
}

/** Signs out one device, by its own token. */
export async function destroySession(token: string | undefined | null) {
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
}

/** Signs out the current browser and removes the cookie. */
export async function signOutCurrent() {
  const store = await cookies();
  await destroySession(store.get(SESSION_COOKIE)?.value);
  await clearSessionCookie();
}

/**
 * Signs out every device for one person. Used when a password changes or a
 * role is taken away, so an open session cannot keep the old access.
 */
export async function destroyAllSessionsFor(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** Clears expired rows. Safe to call often; cheap thanks to the index. */
export async function deleteExpiredSessions(): Promise<number> {
  const deleted = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date()))
    .returning({ id: sessions.id });
  return deleted.length;
}

// ---------------------------------------------------------------------------
// Flutter and other API clients: the Authorization header
// ---------------------------------------------------------------------------

/** Pulls the token out of `Authorization: Bearer <token>`. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (!value || scheme.toLowerCase() !== "bearer") return null;
  return value.trim() || null;
}

/**
 * The user behind an API request. Prefers the Bearer header (mobile) and
 * falls back to the cookie, so the same endpoints serve the website.
 */
export async function getApiUser(request: Request): Promise<SessionUser | null> {
  const token = bearerToken(request);
  if (token) return getUserByToken(token);
  return getSessionUser();
}
