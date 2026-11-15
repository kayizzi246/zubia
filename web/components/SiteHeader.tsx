import Link from "next/link";

const LEFT_LINKS = [
  { href: "/search?type=buy", label: "Buy" },
  { href: "/search?type=rent", label: "Rent" },
  { href: "/search?type=land", label: "Land" },
];

const RIGHT_LINKS = [
  { href: "/pricing", label: "For agents" },
  { href: "/saved", label: "Saved homes" },
  { href: "/sign-in", label: "Sign in" },
];

const linkClass =
  "flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium text-ink hover:text-primary";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4">
        {/* Left: main links on desktop, menu button on phones. */}
        <div className="flex items-center">
          <nav aria-label="Browse" className="hidden items-center lg:flex">
            {LEFT_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* <details> opens without JavaScript, so it works on slow phones. */}
          <details className="group relative lg:hidden">
            <summary
              aria-label="Menu"
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-lg hover:bg-surface [&::-webkit-details-marker]:hidden"
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>
            <nav
              aria-label="Menu"
              className="absolute left-0 top-12 w-64 rounded-card border border-line bg-white p-2 shadow-xl"
            >
              {[...LEFT_LINKS, ...RIGHT_LINKS].map((link) => (
                <Link key={link.label} href={link.href} className={`${linkClass} w-full`}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>

        <Link
          href="/"
          aria-label="Zubia home"
          className="flex items-center gap-1.5 font-display text-[28px] font-bold tracking-tight text-primary"
        >
          <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
            <path d="M4 15 16 5l12 10v13H4z" fill="#0B6B4F" />
            <path d="M11 28v-8h10v8" fill="#F2B705" />
          </svg>
          zubia
        </Link>

        <div className="flex items-center justify-end gap-1">
          <nav aria-label="Account" className="hidden items-center lg:flex">
            {RIGHT_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/pricing"
            className="ml-1 flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <span className="hidden sm:inline">List a property</span>
            <span className="sm:hidden">List</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
