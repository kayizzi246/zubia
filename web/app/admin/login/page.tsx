import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { ZubiaMark } from "@/components/admin/ZubiaMark";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  if (!isSupabaseConfigured()) redirect("/admin/setup");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <ZubiaMark className="size-9" />
          <span className="font-display text-3xl font-extrabold text-primary">zubia</span>
        </Link>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Only admin accounts can sign in here.
        </p>
      </div>
    </main>
  );
}
