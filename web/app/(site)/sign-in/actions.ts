"use server";

import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkPasswordStrength,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import {
  createSession,
  setSessionCookie,
  signOutCurrent,
} from "@/lib/auth/session";
import { db, isDatabaseConfigured } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { normalizeUgPhone } from "@/lib/format";

/*
  Accounts for the public site: saving listings and sending enquiries.

  Supabase Auth used to handle this, including emailing a confirmation link.
  There is no email provider on plain Postgres, so an account works straight
  away and the email is simply unverified. Add a provider later and gate
  whatever needs a verified address on it.
*/

export interface AuthResult {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
}

const NOT_CONNECTED: AuthResult = {
  ok: false,
  message: "Accounts aren't switched on yet (the database isn't connected).",
};

async function requestMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent"),
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  };
}

export async function signInUser(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  if (!isDatabaseConfigured()) return NOT_CONNECTED;

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { ok: false, message: "Enter your email and password." };
  }

  const rows = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1);

  const user = rows[0];
  // Verified even when no account matched, so a wrong email and a wrong
  // password take the same time and cannot be told apart.
  const ok = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !ok) {
    return {
      ok: false,
      message: "That email and password don't match an account.",
    };
  }

  const { token, expiresAt } = await createSession(user.id, await requestMeta());
  await setSessionCookie(token, expiresAt);

  redirect("/account");
}

export async function signUpUser(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  if (!isDatabaseConfigured()) return NOT_CONNECTED;

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phoneInput = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const errors: Record<string, string> = {};
  if (!fullName) errors.fullName = "Enter your name.";
  if (fullName.length > 120) errors.fullName = "That name is too long.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  const phone = phoneInput ? normalizeUgPhone(phoneInput) : null;
  if (phoneInput && !phone) errors.phone = "Use a Ugandan number, e.g. 0772 123 456.";
  const weak = checkPasswordStrength(password);
  if (weak) errors.password = weak;
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
  if (existing.length > 0) {
    return {
      ok: false,
      message: "That email already has an account. Sign in instead.",
      errors: { email: "This email is already registered." },
    };
  }

  let userId: string;
  try {
    const [created] = await db
      .insert(users)
      .values({
        email,
        fullName,
        phone,
        passwordHash: await hashPassword(password),
        role: "user",
      })
      .returning({ id: users.id });
    userId = created.id;
  } catch {
    // Two people signing up with the same email at the same moment: the
    // unique index catches what the check above raced past.
    return {
      ok: false,
      message: "That email already has an account. Sign in instead.",
      errors: { email: "This email is already registered." },
    };
  }

  const { token, expiresAt } = await createSession(userId, await requestMeta());
  await setSessionCookie(token, expiresAt);

  redirect("/account");
}

export async function signOutUser() {
  if (isDatabaseConfigured()) await signOutCurrent();
  redirect("/");
}
