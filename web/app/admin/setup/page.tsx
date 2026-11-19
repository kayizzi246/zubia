import { CheckCircle2, Database } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ZubiaLogo } from "@/components/brand/ZubiaLogo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = { title: "Connect the database" };

const STEPS = [
  {
    title: "Start Postgres",
    body: "In the repo root run: docker compose up -d. That starts Postgres on port 5433 and creates all the tables from db/migrations/001_schema.sql the first time. If you already have your own Postgres, skip this and point DATABASE_URL at it, then run that SQL file by hand.",
  },
  {
    title: "Point the app at it",
    body: "In the web folder, copy .env.example to .env.local. The DATABASE_URL already in there matches docker-compose.yml, so for local development there is nothing to change.",
  },
  {
    title: "Add the sample listings (optional)",
    body: "Run: npm run db:seed. That loads the 40 sample listings, including single rooms, double rooms and bedsitters, so you have something to look at. Safe to run again later.",
  },
  {
    title: "Create your admin account",
    body: 'Run: npm run db:create-admin -- you@example.com "Your Name". It prints a password once. That account is a super admin, so afterwards you can invite the rest of the team from Users & admins instead of using the command line again.',
  },
  {
    title: "Set up photo storage",
    body: "Listing photos go to Cloudflare R2 (or any S3-compatible storage). Create a bucket and an API token with Object Read & Write, then fill in the R2_ values in .env.local. Until you do, everything works except uploading photos.",
  },
  {
    title: "Restart and sign in",
    body: "Stop the dev server (Ctrl+C), run npm run dev again, and open /admin/login.",
  },
];

export default function SetupPage() {
  const connected = isDatabaseConfigured();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <div className="mb-6 flex items-center gap-2">
        <ZubiaLogo markClassName="size-8" wordClassName="text-2xl" />
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-primary">
          Admin
        </span>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-2xl font-bold">
            <Database className="text-primary" />
            Connect the database
          </CardTitle>
          <CardDescription>
            {connected
              ? "DATABASE_URL is set. If you haven't yet, run the seed and create your admin account, then sign in."
              : "The admin needs a Postgres database. Until DATABASE_URL is set, the public site keeps showing sample listings."}
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
