import { sql } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db, isDatabaseConfigured } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  badRequest,
  ok,
  tooManyRequests,
  unauthorized,
  unavailable,
} from "../../_lib/respond";

/*
  Two limits, because they stop different attacks:

    by IP    - one machine working through many accounts
    by email - many machines working on one account

  The per-email limit is the looser of the two so a stranger cannot lock
  a real user out of their own account cheaply; it only blunts sustained
  guessing. Both windows are 15 minutes.
*/
const WINDOW_MS = 15 * 60_000;
const MAX_PER_IP = 10;
const MAX_PER_EMAIL = 20;

/*
  POST /api/v1/auth/login
  { "email": "...", "password": "..." }

  Returns a bearer token for the Flutter app to keep and send back as
  `Authorization: Bearer <token>`. It is the same session row the website's
  cookie points at, so signing out works the same way for both and a stolen
  device can be revoked from one place.

  The app must store the token in secure storage (Keychain on iOS, Keystore
  on Android), not in plain shared preferences.
*/

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return unavailable("Accounts are not switched on yet.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Send a JSON body.");
  }

  const { email, password } =
    (body as { email?: unknown; password?: unknown }) ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return badRequest("Send an email and a password.");
  }
  if (!email.trim() || !password) {
    return badRequest("Send an email and a password.");
  }

  // Counted after validation, so a malformed body cannot burn the budget,
  // and before the password check, which is deliberately slow (scrypt).
  const ipLimit = rateLimit(`login:ip:${clientIp(request)}`, MAX_PER_IP, WINDOW_MS);
  if (!ipLimit.allowed) {
    return tooManyRequests(
      ipLimit.retryAfter,
      "Too many sign-in attempts. Please wait and try again.",
    );
  }

  const emailLimit = rateLimit(
    `login:email:${email.trim().toLowerCase()}`,
    MAX_PER_EMAIL,
    WINDOW_MS,
  );
  if (!emailLimit.allowed) {
    return tooManyRequests(
      emailLimit.retryAfter,
      "Too many sign-in attempts for this account. Please wait and try again.",
    );
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email.trim()})`)
    .limit(1);

  const user = rows[0];
  // Verified even when no account matched, so a wrong email and a wrong
  // password take the same time and cannot be told apart.
  const valid = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !valid) {
    return unauthorized("That email and password don't match an account.");
  }

  const { token, expiresAt } = await createSession(user.id, {
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  return ok({
    token,
    expiresAt: expiresAt.toISOString(),
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
}
