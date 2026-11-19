import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AcceptInviteForm } from "@/components/admin/AcceptInviteForm";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = {
  title: "Set your password | Zubia admin",
  // An invite link must never be followed by a crawler.
  robots: { index: false, follow: false },
};

/**
 * Where an invited admin lands. They arrive with a one-time token in the
 * URL, choose a password, and are signed in.
 *
 * The token is NOT checked here, only when the form is submitted. Telling
 * someone on arrival whether a token is valid would turn this page into a
 * way to test guessed tokens.
 */
export default function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold text-ink">
        Set your password
      </h1>
      <p className="mt-2 text-subtle">
        You have been invited to the Zubia admin area. Choose a password and
        you are in.
      </p>

      {/*
        Reading the token from the URL makes this part dynamic, so it sits
        inside Suspense and the rest of the page is still prerendered.
      */}
      <Suspense
        fallback={<div className="mt-6 h-56 animate-pulse rounded-card bg-surface" />}
      >
        {/* The promise is passed down unawaited, so only the child is dynamic. */}
        <InviteBody searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function InviteBody({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  if (!isDatabaseConfigured()) redirect("/admin/setup");

  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mt-6 rounded-card border border-warning/40 bg-warning-tint p-4 text-sm text-ink">
        This link is missing its invite code. Open the full link you were
        sent, or ask an admin to invite you again.
      </div>
    );
  }

  return <AcceptInviteForm token={token} />;
}
