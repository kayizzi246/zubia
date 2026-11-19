import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Inbox | Zubia" };

// TODO(db): in-app chat between buyers and sellers.
export default function InboxPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MessageSquare className="size-8" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-extrabold text-ink">Messages are coming soon</h1>
      <p className="mt-2 text-subtle">
        Soon you&apos;ll be able to chat with sellers here. For now, open any listing and tap WhatsApp or Call to
        reach the seller directly.
      </p>
      <Link
        href="/search"
        className="mt-6 flex h-12 items-center rounded-lg bg-primary px-6 font-semibold text-white hover:bg-primary-dark"
      >
        Browse listings
      </Link>
    </main>
  );
}
