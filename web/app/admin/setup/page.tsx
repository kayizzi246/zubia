import { CheckCircle2, Database } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ZubiaMark } from "@/components/admin/ZubiaMark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Connect the database" };

const STEPS = [
  {
    title: "Create a free Supabase project",
    body: "Go to supabase.com, sign up (no card needed) and click New project. Pick the region closest to Uganda and save the database password somewhere safe.",
  },
  {
    title: "Create the tables",
    body: "In your project open SQL Editor → New query. Paste everything from supabase/migrations/0001_init.sql and click Run. Do the same, in order, with 0002_contact_and_messages.sql, 0003_photo_storage.sql and then supabase/seed.sql (the 12 sample listings).",
  },
  {
    title: "Add your keys",
    body: "Open Project Settings → API Keys. In the web folder, copy .env.example to .env.local and paste the Project URL, the Publishable key and the Secret key.",
  },
  {
    title: "Create your admin account",
    body: "Open Authentication → Users → Add user → Create new user. Enter your email and a strong password and tick Auto Confirm. Then in SQL Editor run: update public.profiles set role = 'admin' where email = 'you@example.com';",
  },
  {
    title: "Restart and sign in",
    body: "Stop the dev server (Ctrl+C), run npm run dev again, and open /admin/login.",
  },
];

export default function SetupPage() {
  const connected = isSupabaseConfigured();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <div className="mb-6 flex items-center gap-2">
        <ZubiaMark />
        <span className="font-display text-2xl font-extrabold text-primary">zubia admin</span>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-2xl font-bold">
            <Database className="text-primary" />
            Connect the database
          </CardTitle>
          <CardDescription>
            {connected
              ? "Your keys are set. If you haven't yet, finish steps 2 and 4, then sign in."
              : "The admin needs a Supabase database. Until it's connected, the public site keeps showing sample listings."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-5">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          {connected && (
            <Link
              href="/admin/login"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground"
            >
              <CheckCircle2 className="size-5" />
              Go to sign in
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
