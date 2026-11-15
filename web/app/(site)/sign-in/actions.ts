"use server";

import { redirect } from "next/navigation";
import { normalizeUgPhone } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface AuthResult {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
}

const NOT_CONNECTED: AuthResult = {
  ok: false,
  message: "Accounts aren't switched on yet (the database isn't connected).",
};

export async function signInUser(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONNECTED;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      ok: false,
      message: error.message.toLowerCase().includes("confirm")
        ? "Please confirm your email first. Check your inbox for the link."
        : "That email and password don't match an account.",
    };
  }
  redirect("/account");
}

export async function signUpUser(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONNECTED;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phoneInput = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const errors: Record<string, string> = {};
  if (!fullName) errors.fullName = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  const phone = phoneInput ? normalizeUgPhone(phoneInput) : null;
  if (phoneInput && !phone) errors.phone = "Use a Ugandan number, e.g. 0772 123 456.";
  if (password.length < 8) errors.password = "Use at least 8 characters.";
  if (Object.keys(errors).length > 0) return { ok: false, message: "Please fix the highlighted fields.", errors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) {
    return {
      ok: false,
      message: error.message.toLowerCase().includes("registered")
        ? "That email already has an account. Sign in instead."
        : error.message,
    };
  }

  // Save the phone on the new profile (the sign-up trigger created it).
  if (phone && data.user && data.session) {
    await supabase.from("profiles").update({ phone }).eq("id", data.user.id);
  }

  // If email confirmation is on in Supabase there is no session yet.
  if (!data.session) {
    return { ok: true, message: `Almost done! We sent a link to ${email}. Open it to confirm your account, then sign in.` };
  }
  redirect("/account");
}

export async function signOutUser() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
