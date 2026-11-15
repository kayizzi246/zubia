import Link from "next/link";
import { getPublicListings } from "@/lib/data/listings";
import { DISTRICTS } from "@/lib/search";

function linkGroups(areas: string[]) {
  return [
  {
    title: "Homes for sale",
    links: DISTRICTS.map((d) => ({
      label: `Homes for sale in ${d}`,
      href: `/search?type=buy&district=${d}`,
    })),
  },
  {
    title: "Rentals",
    links: DISTRICTS.map((d) => ({
      label: `Houses for rent in ${d}`,
      href: `/search?type=rent&district=${d}`,
    })),
  },
  {
    title: "Land",
    links: DISTRICTS.map((d) => ({
      label: `Land for sale in ${d}`,
      href: `/search?type=land&district=${d}`,
    })),
  },
  {
    title: "Browse areas",
    links: areas.map((a) => ({
      label: a,
      href: `/search?type=buy&q=${encodeURIComponent(a)}`,
    })),
  },
  ];
}

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Help", href: "/help" },
  { label: "For agents", href: "/pricing" },
  { label: "Pricing", href: "/pricing" },
  { label: "Title checks", href: "/pricing" },
  { label: "Advertise", href: "/contact?topic=advertise" },
  { label: "Saved homes", href: "/saved" },
  { label: "Terms of use", href: "/terms" },
  { label: "Privacy notice", href: "/privacy" },
  { label: "Cookies", href: "/privacy#cookies" },
  { label: "Contact us", href: "/contact" },
];

// TODO(owner): replace each "#" with your real page, e.g.
// "https://www.facebook.com/zubiaug". Icons stay hidden until they have a real link.
const ALL_SOCIALS = [
  {
    label: "Facebook",
    href: "#",
    path: "M14 8h3V4h-3c-2.8 0-4 1.7-4 4.3V10H7v4h3v8h4v-8h3l.5-4H14V8.6c0-.4.2-.6.6-.6z",
  },
  {
    label: "Instagram",
    href: "#",
    path: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.5-2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
    outline: true,
  },
  {
    label: "TikTok",
    href: "#",
    path: "M15 3c.3 2.4 1.8 4 4 4.2v3.2c-1.5 0-2.8-.4-4-1.2v6.3A5.5 5.5 0 1 1 9.5 10v3.3a2.3 2.3 0 1 0 2.3 2.2V3z",
  },
  {
    label: "WhatsApp",
    href: "#",
    path: "M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm4.4 12.4c-.2.6-1.1 1.1-1.6 1.1-.4.1-1 .1-3.1-.8-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.6s.6-1.9.9-2.1c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3z",
  },
];
const SOCIALS = ALL_SOCIALS.filter((s) => s.href !== "#");

// Cached at build time, so the footer stays static. Updates on each deploy.
async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 text-primary transition-transform group-open:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function StoreBadge({ store }: { store: "Google Play" | "App Store" }) {
  return (
    <span
      className="flex h-11 items-center gap-2 rounded-lg border border-ink/70 px-3 text-ink"
      aria-label={`${store}: coming soon`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
        {store === "Google Play" ? (
          <path d="M4 3.5v17l9-8.5zm10.4 7.2L6.5 2.4l10.3 5.9zm0 2.6-7.9 8.3 10.3-5.9zm1.4-1.3 3.4-1.9c.9.5.9 1.3 0 1.8l-3.4 2z" />
        ) : (
          <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5a4.3 4.3 0 0 0-3.4-1.8c-1.4-.2-2.8.8-3.5.8s-1.8-.8-3-.8a4.5 4.5 0 0 0-3.8 2.3c-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.3 2.8 2.3 1.2-.1 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2a10 10 0 0 0 1.3-2.6 4 4 0 0 1-2.4-3.7zM14.2 5.8A4 4 0 0 0 15.1 3a4.1 4.1 0 0 0-2.7 1.4 3.8 3.8 0 0 0-1 2.7 3.4 3.4 0 0 0 2.8-1.3z" />
        )}
      </svg>
      <span className="text-left leading-none">
        <span className="block text-[10px] uppercase tracking-wide text-subtle">
          Coming soon to
        </span>
        <span className="text-sm font-semibold">{store}</span>
      </span>
    </span>
  );
}

export async function SiteFooter() {
  // Unique areas from approved listings, for the "Browse areas" panel.
  const areas = [...new Set((await getPublicListings()).map((l) => l.area))].sort();
  const groups = linkGroups(areas);

  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 pt-10">
        {/* About blurb */}
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-semibold text-ink">About Zubia&apos;s listings</h2>
          <p className="mt-1 text-subtle">
            Every listing shows its tenure and whether its land title has been
            checked, so you know what you are paying for. Always confirm a title
            at the land registry before you send any money.
          </p>
        </div>

        {/* Expandable link groups. <details> opens without JavaScript. */}
        <div className="mt-8 grid border-b border-line pb-6 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
          {groups.map((group) => (
            <details key={group.title} className="group px-4">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 text-lg text-ink [&::-webkit-details-marker]:hidden">
                {group.title}
                <Chevron />
              </summary>
              <ul className="pb-2 text-center">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-sm text-subtle hover:text-primary hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        {/* Company links */}
        <nav aria-label="Company" className="border-b border-line py-6 text-center">
          <ul className="flex flex-wrap justify-center gap-x-5">
            {COMPANY_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-[15px] text-ink hover:text-primary hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* TODO: connect to a report form that alerts the Zubia team. */}
          <Link
            href="/contact?topic=report"
            className="mt-2 inline-flex min-h-11 items-center font-medium text-primary hover:underline"
          >
            Report a suspicious listing →
          </Link>
        </nav>

        {/* Small print */}
        <div className="mx-auto max-w-3xl space-y-3 py-8 text-center text-xs leading-relaxed text-subtle">
          <p>
            Zubia is a property listing platform. Sellers, brokers, agencies and
            developers are responsible for their own listings. A &quot;Title
            checked&quot; badge means the title was searched at the land registry
            on the date shown on the listing. It is not a guarantee of
            ownership.
          </p>
          <p>
            Never pay a deposit before you have seen the property and the title
            in person. If a listing looks wrong, please{" "}
            <Link href="/contact?topic=report" className="text-primary underline">
              let us know
            </Link>
            .
          </p>
          <p className="font-medium text-ink">
            All listings currently shown are sample data for development.
          </p>
        </div>

        {/* App badges */}
        <div className="flex justify-center gap-3">
          <StoreBadge store="Google Play" />
          <StoreBadge store="App Store" />
        </div>

        {/* Logo, socials, copyright */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-8">
          <Link
            href="/"
            className="flex items-center gap-1 font-display text-2xl font-bold text-primary"
          >
            <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
              <path d="M4 15 16 5l12 10v13H4z" fill="#0B6B4F" />
              <path d="M11 28v-8h10v8" fill="#F2B705" />
            </svg>
            zubia
          </Link>
          {SOCIALS.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="mr-1 text-sm italic text-subtle">Follow us:</span>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex size-11 items-center justify-center rounded-full text-primary hover:bg-surface"
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" fillRule="evenodd" aria-hidden="true">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
          )}
          <span className="text-sm italic text-subtle">
            © <CopyrightYear /> Zubia
          </span>
        </div>
      </div>
    </footer>
  );
}
