import type { Metadata } from "next";
import Link from "next/link";
import { AuthForms } from "@/components/AuthForms";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in | Zubia" };

export default function SignInPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="text-center font-display text-3xl font-extrabold text-ink">Welcome to Zubia</h1>
      <p className="mb-8 mt-2 text-center text-subtle">Sign in to list a property and keep your saved homes.</p>
      {!isSupabaseConfigured() && (
        <p className="mb-6 rounded-lg border border-sun/50 bg-sun/10 px-4 py-3 text-sm text-ink">
          Accounts aren&apos;t switched on yet because the database isn&apos;t connected. You can still browse and save
          homes on this device.
        </p>
      )}
      <div className="rounded-card border border-line bg-white p-6 shadow-sm">
        <AuthForms />
      </div>
      <p className="mt-6 text-center text-sm text-subtle">
        By creating an account you agree to our <Link href="/terms" className="text-primary underline">terms</Link> and{" "}
        <Link href="/privacy" className="text-primary underline">privacy notice</Link>.
      </p>
    </main>
  );
}
