"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { LISTINGS_TAG } from "@/lib/data/listings";
import type { ListingStatus, UserRole } from "@/lib/supabase/rows";
import { createClient, createSecretClient } from "@/lib/supabase/server";
import { normalizeUgPhone } from "@/lib/format";
import type { ListingType, SellerType, Tenure } from "@/lib/types";

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

// ---------------------------------------------------------------------------
// Sign in / out
// ---------------------------------------------------------------------------

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return fail("Enter your email and password.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return fail("That email and password don't match an account.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return fail("This account is not an admin. Ask an existing admin to give you access.");
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

const STATUSES: ListingStatus[] = ["pending", "approved", "rejected", "archived"];

export async function setListingStatus(id: string, status: ListingStatus): Promise<ActionResult> {
  await requireAdmin();
  if (!STATUSES.includes(status)) return fail("Unknown status.");

  const supabase = await createClient();
  const { error } = await supabase.from("listings").update({ status }).eq("id", id);
  if (error) return fail(error.message);

  refreshListings();
  return { ok: true, message: `Listing ${status}.` };
}

export async function setListingFlag(
  id: string,
  flag: "featured" | "title_checked",
  value: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  if (flag !== "featured" && flag !== "title_checked") return fail("Unknown setting.");

  const supabase = await createClient();
  const { error } = await supabase.from("listings").update({ [flag]: value }).eq("id", id);
  if (error) return fail(error.message);

  refreshListings();
  const label = flag === "featured" ? "Featured" : "Title checked";
  return { ok: true, message: `${label} ${value ? "on" : "off"}.` };
}

export async function deleteListing(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) return fail(error.message);

  refreshListings();
  return { ok: true, message: "Listing deleted." };
}

const TYPES: ListingType[] = ["buy", "rent", "land"];
const TENURES: Tenure[] = ["mailo", "freehold", "leasehold", "kibanja", "condominium"];
const SELLERS: SellerType[] = ["owner", "broker", "agency", "developer"];

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : NaN;
}

/** Creates a listing (no id in the form) or updates one (with id). */
export async function saveListing(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();

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
  // TODO(supabase-storage): replace pasted URLs with photo uploads.
  const photos = String(formData.get("photos") ?? "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

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
  if (Object.keys(errors).length > 0) return fail("Please fix the highlighted fields.", errors);

  const row = {
    type,
    title,
    price_ugx: Math.round(price!),
    area,
    district,
    bedrooms,
    bathrooms,
    size_decimals: size,
    tenure,
    seller_type: sellerType,
    status,
    title_checked: formData.get("titleChecked") === "on",
    featured: formData.get("featured") === "on",
    photos,
    seller_name: sellerName || null,
    seller_phone: sellerPhone,
    lat,
    lng,
    description,
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("listings").update(row).eq("id", id)
    : await supabase.from("listings").insert({ ...row, owner_id: admin.id });
  if (error) return fail(error.message);

  refreshListings();
  redirect(`/admin/listings?saved=${id ? "updated" : "created"}`);
}

// ---------------------------------------------------------------------------
// Users and admins
// ---------------------------------------------------------------------------

const ROLES: UserRole[] = ["user", "agent", "admin"];

export async function setUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!ROLES.includes(role)) return fail("Unknown role.");
  if (userId === admin.id && role !== "admin") {
    return fail("You can't remove your own admin access. Ask another admin to do it.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return fail(error.message);

  revalidatePath("/admin/users");
  return { ok: true, message: `Role changed to ${role}.` };
}

/** Creates a brand-new account that is an admin from the start. */
export async function createAdmin(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  if (password.length < 10) errors.password = "Use at least 10 characters.";
  if (Object.keys(errors).length > 0) return fail("Please fix the highlighted fields.", errors);

  let secret;
  try {
    secret = createSecretClient();
  } catch (e) {
    return fail((e as Error).message);
  }

  const { data, error } = await secret.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    const exists = error?.message.toLowerCase().includes("already");
    return fail(
      exists
        ? "That email already has an account. Find it in the table below and change its role to admin."
        : (error?.message ?? "Could not create the account."),
    );
  }

  // The sign-up trigger created a 'user' profile; promote it.
  const { error: roleError } = await secret
    .from("profiles")
    .update({ role: "admin", full_name: fullName || null })
    .eq("id", data.user.id);
  if (roleError) return fail(roleError.message);

  revalidatePath("/admin/users");
  return { ok: true, message: `Admin account created for ${email}. Share the password with them privately.` };
}

// ---------------------------------------------------------------------------
// Contact form messages
// ---------------------------------------------------------------------------

export async function setMessageHandled(id: string, handled: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").update({ handled }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/admin/messages");
  return { ok: true, message: handled ? "Marked as done." : "Marked as open." };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/admin/messages");
  return { ok: true, message: "Message deleted." };
}
