import Link from "next/link";
import { ZubiaLogo } from "@/components/brand/ZubiaLogo";

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

/*
  Bolder and tighter than before, with the hover drawn as a filled pill
  rather than a colour change on the word.

  At medium weight these read as body copy that happens to be clickable;
  the eye skims past them to the logo. Semibold with tightened tracking
  makes them register as the navigation, and the pill gives the pointer
  a target with edges instead of three letters to aim at.
*/
const linkClass =
  "flex min-h-11 items-center rounded-lg px-3.5 text-[15px] font-semibold tracking-[-0.01em] text-ink transition-colors hover:bg-primary-tint hover:text-primary";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="mx-auto grid h-16 max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center px-4">
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

        <Link href="/" aria-label="Zubia home" className="flex items-center">
          <ZubiaLogo markClassName="size-8" wordClassName="text-[28px]" />
        </Link>

        <div className="flex items-center justify-end gap-1">
          <nav aria-label="Account" className="hidden items-center lg:flex">
            {RIGHT_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </nav>
          {/*
            Amber, not blue. This is the only action in the header, and
            the rule for the whole palette is that amber means "press
            this". In blue it was the same colour as the three links
            beside it and read as a fourth link.

            Ink text, not white: white on this amber measures 3.46:1 and
            fails.
          */}
          <Link
            href="/pricing"
            className="ml-2 flex min-h-11 items-center rounded-lg bg-action px-4 text-sm font-bold text-ink transition-colors hover:bg-action-dark hover:text-white"
          >
            <span className="hidden sm:inline">List a property</span>
            <span className="sm:hidden">List</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
