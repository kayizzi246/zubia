import { Heart, LogOut, PlusSquare, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signOutUser } from "@/app/(site)/sign-in/actions";
import { formatPhone } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My account | Zubia" };

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold text-ink">My account</h1>
      <Suspense fallback={<div className="mt-6 h-40 animate-pulse rounded-card bg-surface" />}>
        <AccountDetails />
      </Suspense>
    </main>
  );
}

async function AccountDetails() {
  if (!isSupabaseConfigured()) redirect("/sign-in");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .single();

  const link = "flex min-h-12 items-center gap-3 rounded-lg px-3 font-medium text-ink hover:bg-surface";

  return (
    <>
      <div className="mt-6 rounded-card border border-line bg-white p-6">
        <p className="font-display text-xl font-bold text-ink">{profile?.full_name || "No name yet"}</p>
        <p className="text-subtle">{user.email}</p>
        {profile?.phone && <p className="text-subtle">{formatPhone(profile.phone)}</p>}
        <p className="mt-2 inline-block rounded-md bg-surface px-2 py-1 text-xs font-semibold capitalize text-ink">
          {profile?.role ?? "user"}
        </p>
      </div>

      <nav className="mt-4 rounded-card border border-line bg-white p-2">
        <Link href="/saved" className={link}>
          <Heart className="size-5 text-primary" /> Saved homes and searches
        </Link>
        {/* TODO: "My listings" where users add and manage their own listings. */}
        <Link href="/pricing" className={link}>
          <PlusSquare className="size-5 text-primary" /> List a property
        </Link>
        {profile?.role === "admin" && (
          <Link href="/admin" className={link}>
            <ShieldCheck className="size-5 text-primary" /> Admin dashboard
          </Link>
        )}
        <form action={signOutUser}>
          <button type="submit" className={`${link} w-full text-left`}>
            <LogOut className="size-5 text-primary" /> Sign out
          </button>
        </form>
      </nav>
    </>
  );
}
