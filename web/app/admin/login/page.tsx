import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { ZubiaLogo } from "@/components/brand/ZubiaLogo";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  if (!isDatabaseConfigured()) redirect("/admin/setup");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Zubia home" className="mb-6 flex justify-center">
          <ZubiaLogo markClassName="size-10" wordClassName="text-3xl" tagline />
        </Link>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Only admin accounts can sign in here.
        </p>
      </div>
    </main>
  );
}
