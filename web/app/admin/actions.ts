"use server";

import { randomBytes, createHash } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import {
  createSession,
  destroyAllSessionsFor,
  setSessionCookie,
  signOutCurrent,
} from "@/lib/auth/session";
import {
  checkPasswordStrength,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import { LISTINGS_TAG } from "@/lib/data/listings";
import { deletePhotos } from "@/lib/storage/r2";
import { db } from "@/lib/db";
import type { ListingStatus, UserRole } from "@/lib/db/enums";
import { USER_ROLES } from "@/lib/db/enums";
import { contactMessages, listings, users } from "@/lib/db/schema";
import { normalizeUgPhone } from "@/lib/format";
import { assignableRoles, isAdminRole, ROLE_LABELS } from "@/lib/permissions";
import type {
  Bathroom,
  ListingType,
  Power,
  SellerType,
  Tenure,
  UnitType,
  Water,
} from "@/lib/types";
import { UNIT_TYPES } from "@/lib/uganda";

export interface ActionResult {
  ok: boolean;
  message: string;
  /** Field name -> error, for forms. */
  errors?: Record<string, string>;
}

const fail = (message: string, errors?: Record<string, string>): ActionResult => ({
  ok: false,
  message,
  errors,
});

/** Refresh the admin pages and the cached public listing pages. */
function refreshListings() {
  updateTag(LISTINGS_TAG);
  revalidatePath("/admin", "layout");
}

/** Who is making the request, recorded against the session. */
async function requestMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent"),
    // Behind a reverse proxy the first entry is the real client.
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  };
}

// ---------------------------------------------------------------------------
// Sign in / out
// ---------------------------------------------------------------------------

export async function signIn(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return fail("Enter your email and password.");

  const rows = await db
    .select({
      id: users.id,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    // Email is matched case-insensitively, backed by the unique index on
    // lower(email), so "Me@x.com" and "me@x.com" are the same account.
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1);

  const user = rows[0];

  // The password is verified even when no account matched, so a wrong email
  // and a wrong password take the same time and cannot be told apart.
  const ok = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !ok) return fail("That email and password don't match an account.");

  if (!isAdminRole(user.role)) {
    return fail("This account is not an admin. Ask an existing admin to give you access.");
  }

  const { token, expiresAt } = await createSession(user.id, await requestMeta());
  await setSessionCookie(token, expiresAt);

  redirect("/admin");
}

export async function signOut() {
  await signOutCurrent();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

const STATUSES: ListingStatus[] = ["pending", "approved", "rejected", "archived"];

export async function setListingStatus(
  id: string,
  status: ListingStatus,
): Promise<ActionResult> {
  await requirePermission("listings.manage");
  if (!STATUSES.includes(status)) return fail("Unknown status.");

  const done = await db
    .update(listings)
    .set({ status })
    .where(eq(listings.id, id))
    .returning({ id: listings.id });
  if (done.length === 0) return fail("That listing no longer exists.");

  refreshListings();
  return { ok: true, message: `Listing ${status}.` };
}

export async function setListingFlag(
  id: string,
  flag: "featured" | "title_checked",
  value: boolean,
): Promise<ActionResult> {
  await requirePermission("listings.manage");
  // An allow-list, not a dynamic column name, so this can never be used to
  // write to some other column.
  if (flag !== "featured" && flag !== "title_checked") return fail("Unknown setting.");

  const patch =
    flag === "featured" ? { featured: value } : { titleChecked: value };

  const done = await db
    .update(listings)
    .set(patch)
    .where(eq(listings.id, id))
    .returning({ id: listings.id });
  if (done.length === 0) return fail("That listing no longer exists.");

  refreshListings();
  const label = flag === "featured" ? "Featured" : "Title checked";
  return { ok: true, message: `${label} ${value ? "on" : "off"}.` };
}

export async function deleteListing(id: string): Promise<ActionResult> {
  await requirePermission("listings.manage");

  // Returning the photos means the delete and the list of files to clean
  // up come from the same statement: no second read that could race with
  // another admin editing the listing in between.
  const done = await db
    .delete(listings)
    .where(eq(listings.id, id))
    .returning({ id: listings.id, photos: listings.photos });
  if (done.length === 0) return fail("That listing no longer exists.");

  // Best effort, and deliberately not awaited into the result: the row is
  // already gone, so a storage failure must not report the delete as
  // having failed. deletePhotos swallows and logs its own errors.
  const photos = done[0].photos ?? [];
  if (photos.length > 0) {
    const count = await deletePhotos(photos);
    if (count > 0) {
      console.log(`Deleted listing ${id}: removed ${count} photo(s) from storage.`);
    }
  }

  refreshListings();
  return { ok: true, message: "Listing deleted." };
}

const TYPES: ListingType[] = ["buy", "rent", "land"];
const TENURES: Tenure[] = ["mailo", "freehold", "leasehold", "kibanja", "condominium"];
const SELLERS: SellerType[] = ["owner", "broker", "agency", "developer"];
const BATHROOMS: Bathroom[] = ["inside", "outside_private", "shared"];
const WATERS: Water[] = ["piped_inside", "piped_yard", "shared_tap", "borehole"];
const POWERS: Power[] = ["own_yaka", "shared_meter", "included", "none"];

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Reads one of a fixed set of values from the form, or null when the admin
 * left it blank. Anything unrecognised becomes null rather than an error:
 * the database enums are the real guard.
 */
function optionalEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
): T | null {
  const s = String(value ?? "").trim();
  return allowed.includes(s as T) ? (s as T) : null;
}

/** A select that can also be "not stated", which differs from "no". */
function optionalBoolean(value: FormDataEntryValue | null): boolean | null {
  const s = String(value ?? "").trim();
  if (s === "yes") return true;
  if (s === "no") return false;
  return null;
}

export async function saveListing(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requirePermission("listings.manage");

  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "") as ListingType;
  const tenure = String(formData.get("tenure") ?? "") as Tenure;
  const sellerType = String(formData.get("sellerType") ?? "") as SellerType;
  const status = String(formData.get("status") ?? "pending") as ListingStatus;
  const title = String(formData.get("title") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sellerName = String(formData.get("sellerName") ?? "").trim();
  const sellerPhoneInput = String(formData.get("sellerPhone") ?? "").trim();
  const sellerPhone = sellerPhoneInput ? normalizeUgPhone(sellerPhoneInput) : null;
  const price = optionalNumber(formData.get("priceUGX"));
  const size = optionalNumber(formData.get("sizeDecimals"));
  const bedrooms = type === "land" ? null : optionalNumber(formData.get("bedrooms"));
  const bathrooms = type === "land" ? null : optionalNumber(formData.get("bathrooms"));
  const lat = optionalNumber(formData.get("lat"));
  const lng = optionalNumber(formData.get("lng"));
  // Filled in by the PhotoUploader (one URL per line, cover first).
  const photos = String(formData.get("photos") ?? "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  // Rental details. The database only allows these on a rental, so they are
  // forced to null for anything else. That also means switching a listing
  // from rent to buy clears them instead of failing the constraint.
  const isRent = type === "rent";
  const rental = {
    unitType: isRent ? optionalEnum<UnitType>(formData.get("unitType"), UNIT_TYPES) : null,
    bathroom: isRent ? optionalEnum<Bathroom>(formData.get("bathroom"), BATHROOMS) : null,
    ownKitchen: isRent ? optionalBoolean(formData.get("ownKitchen")) : null,
    water: isRent ? optionalEnum<Water>(formData.get("water"), WATERS) : null,
    power: isRent ? optionalEnum<Power>(formData.get("power"), POWERS) : null,
    fenced: isRent ? optionalBoolean(formData.get("fenced")) : null,
    advanceMonths: isRent ? optionalNumber(formData.get("advanceMonths")) : null,
    depositMonths: isRent ? optionalNumber(formData.get("depositMonths")) : null,
    brokerFeeMonths: isRent ? optionalNumber(formData.get("brokerFeeMonths")) : null,
  };

  const errors: Record<string, string> = {};
  if (!TYPES.includes(type)) errors.type = "Choose a type.";
  if (!TENURES.includes(tenure)) errors.tenure = "Choose a tenure.";
  if (!SELLERS.includes(sellerType)) errors.sellerType = "Choose who is selling.";
  if (!STATUSES.includes(status)) errors.status = "Choose a status.";
  if (title.length < 3 || title.length > 140) errors.title = "Use 3 to 140 characters.";
  if (!area) errors.area = "Enter the area, e.g. Ntinda.";
  if (!district) errors.district = "Choose a district.";
  if (!price || price <= 0 || Number.isNaN(price)) errors.priceUGX = "Enter a price in UGX, e.g. 450000000.";
  if (!size || size <= 0 || Number.isNaN(size)) errors.sizeDecimals = "Enter the plot size in decimals.";
  if (sellerPhoneInput && !sellerPhone) errors.sellerPhone = "Use a Ugandan number, e.g. 0772 123 456.";
  for (const [key, value] of Object.entries({ bedrooms, bathrooms, lat, lng })) {
    if (Number.isNaN(value)) errors[key] = "Enter a number or leave it empty.";
  }

  // Keep these in step with the CHECK constraints in db/migrations/001_schema.sql,
  // so an admin gets a field-level message instead of a database error.
  const monthLimits: Record<string, [number | null, number]> = {
    advanceMonths: [rental.advanceMonths, 12],
    depositMonths: [rental.depositMonths, 6],
    brokerFeeMonths: [rental.brokerFeeMonths, 3],
  };
  for (const [key, [value, max]] of Object.entries(monthLimits)) {
    if (value === null) continue;
    if (Number.isNaN(value) || !Number.isInteger(value) || value < 0 || value > max) {
      errors[key] = `Enter a whole number of months from 0 to ${max}, or leave it empty.`;
    }
  }
  if (Number(formData.get("photosUploading") ?? 0) > 0) {
    errors.photos = "Wait for the photos to finish uploading, then save.";
  }
  if (Object.keys(errors).length > 0) return fail("Please fix the highlighted fields.", errors);

  const row = {
    type,
    title,
    priceUgx: Math.round(price!),
    area,
    district,
    bedrooms,
    bathrooms,
    // numeric columns take a string in Drizzle.
    sizeDecimals: String(size),
    tenure,
    sellerType,
    status,
    titleChecked: formData.get("titleChecked") === "on",
    featured: formData.get("featured") === "on",
    photos,
    sellerName: sellerName || null,
    sellerPhone,
    lat,
    lng,
    description,
    ...rental,
  };

  try {
    if (id) {
      const done = await db
        .update(listings)
        .set(row)
        .where(eq(listings.id, id))
        .returning({ id: listings.id });
      if (done.length === 0) return fail("That listing no longer exists.");
    } else {
      // Postgres generates the id; readable ids like zb-001 come from the seed.
      await db.insert(listings).values({
        ...row,
        id: sql`gen_random_uuid()::text`,
        ownerId: admin.id,
      });
    }
  } catch (error) {
    // A constraint we failed to mirror above, or the database being down.
    return fail(error instanceof Error ? error.message : "Could not save the listing.");
  }

  refreshListings();
  redirect(`/admin/listings?saved=${id ? "updated" : "created"}`);
}

// ---------------------------------------------------------------------------
// Users and admins
// ---------------------------------------------------------------------------

export async function setUserRole(
  userId: string,
  role: UserRole,
): Promise<ActionResult> {
  const admin = await requirePermission("users.manage");
  if (!USER_ROLES.includes(role)) return fail("Unknown role.");

  if (userId === admin.id) {
    return fail("You can't change your own role. Ask another admin to do it.");
  }

  // A broker admin may only move people between 'user' and 'agent'; only a
  // super admin hands out admin tiers.
  const allowed = assignableRoles(admin.role);
  if (!allowed.includes(role)) {
    return fail(`You can't give someone the ${ROLE_LABELS[role]} role.`);
  }

  const targetRows = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const target = targetRows[0];
  if (!target) return fail("That account no longer exists.");

  // Check the role they hold now, so a broker admin cannot demote an admin.
  if (!allowed.includes(target.role)) {
    return fail(`You can't change a ${ROLE_LABELS[target.role]}'s role.`);
  }

  // The last super admin must not be demoted, or nobody can get back in.
  // This used to be a database trigger; without RLS it lives here.
  if (target.role === "super_admin" && role !== "super_admin") {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, "super_admin"));
    if (count <= 1) {
      return fail(
        "This is the only super admin. Make someone else a super admin first.",
      );
    }
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));

  // Losing admin rights must take effect at once, not when their session
  // happens to expire.
  if (isAdminRole(target.role) && !isAdminRole(role)) {
    await destroyAllSessionsFor(userId);
  }

  revalidatePath("/admin/users");
  return { ok: true, message: `Role changed to ${ROLE_LABELS[role]}.` };
}

const INVITE_HOURS = 72;

/**
 * Invites someone to the admin area.
 *
 * Supabase used to email the invite. With Postgres alone there is no email
 * provider, so this creates the account with no password and returns a
 * one-time link for the super admin to pass on themselves. Only a hash of
 * the token is stored, and it expires after three days.
 *
 * To send these by email later, plug an SMTP or API provider in here; the
 * link is already generated.
 */
export async function inviteAdmin(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requirePermission("admins.manage");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "") as UserRole;

  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  if (!isAdminRole(role)) errors.role = "Pick which kind of admin they should be.";
  if (Object.keys(errors).length > 0) return fail("Please fix the highlighted fields.", errors);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
  if (existing.length > 0) {
    return fail(
      "That email already has an account. Find it in the table below and change its role instead.",
    );
  }

  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + INVITE_HOURS * 60 * 60 * 1000);

  await db.insert(users).values({
    email,
    fullName: fullName || null,
    role,
    // No password: the account cannot be signed into until they set one.
    passwordHash: null,
    inviteTokenHash: createHash("sha256").update(token).digest("hex"),
    inviteExpiresAt: expires,
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const link = `${base}/admin/accept-invite?token=${token}`;

  revalidatePath("/admin/users");
  return {
    ok: true,
    message: `Account created for ${email}. Send them this link, which works once and expires in ${INVITE_HOURS} hours: ${link}`,
  };
}

/** Sets a password from an invite link and signs the person in. */
export async function acceptInvite(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return fail("That invite link is not valid.");
  if (password !== confirm) {
    return fail("Those passwords don't match.", { confirm: "Passwords don't match." });
  }

  const weak = checkPasswordStrength(password);
  if (weak) return fail(weak, { password: weak });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const rows = await db
    .select({ id: users.id, expires: users.inviteExpiresAt })
    .from(users)
    .where(
      and(
        eq(users.inviteTokenHash, tokenHash),
        // An account that already has a password cannot be taken over with
        // an old invite link.
        isNull(users.passwordHash),
      ),
    )
    .limit(1);

  const invited = rows[0];
  if (!invited) return fail("That invite link has already been used, or is not valid.");
  if (!invited.expires || invited.expires < new Date()) {
    return fail("That invite link has expired. Ask an admin to invite you again.");
  }

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(password),
      // Burn the token so the link cannot be reused.
      inviteTokenHash: null,
      inviteExpiresAt: null,
    })
    .where(eq(users.id, invited.id));

  const { token: session, expiresAt } = await createSession(
    invited.id,
    await requestMeta(),
  );
  await setSessionCookie(session, expiresAt);

  redirect("/admin");
}

// ---------------------------------------------------------------------------
// Contact form messages
// ---------------------------------------------------------------------------

export async function setMessageHandled(
  id: string,
  handled: boolean,
): Promise<ActionResult> {
  await requirePermission("messages.manage");
  const done = await db
    .update(contactMessages)
    .set({ handled })
    .where(eq(contactMessages.id, id))
    .returning({ id: contactMessages.id });
  if (done.length === 0) return fail("That message no longer exists.");

  revalidatePath("/admin/messages");
  return { ok: true, message: handled ? "Marked as done." : "Marked as open." };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  await requirePermission("messages.manage");
  const done = await db
    .delete(contactMessages)
    .where(eq(contactMessages.id, id))
    .returning({ id: contactMessages.id });
  if (done.length === 0) return fail("That message no longer exists.");

  revalidatePath("/admin/messages");
  return { ok: true, message: "Message deleted." };
}
