import Link from "next/link";
import { ZubiaLogo } from "@/components/brand/ZubiaLogo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <Link href="/" aria-label="Zubia home" className="mb-8 flex items-center">
        <ZubiaLogo markClassName="size-10" wordClassName="text-3xl" />
      </Link>
      <p className="font-display text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-subtle">
        The listing may have been sold, rented or removed, or the link may be wrong.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/search" className="flex h-12 items-center rounded-lg bg-primary px-6 font-semibold text-white hover:bg-primary-dark">
          Search listings
        </Link>
        <Link href="/" className="flex h-12 items-center rounded-lg border-2 border-primary px-6 font-semibold text-primary">
          Go home
        </Link>
      </div>
    </main>
  );
}
