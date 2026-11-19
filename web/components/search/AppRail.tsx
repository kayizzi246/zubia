"use client";

import { Heart, Home, MessageSquare, PlusSquare, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ZubiaLogo, ZubiaMark } from "@/components/brand/ZubiaLogo";

const ITEMS = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/pricing", label: "List", icon: PlusSquare },
  { href: "/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/sign-in", label: "Sign in", icon: UserRound },
];

/** Left icon rail on desktop, slim top bar on phones. */
export function AppRail() {
  const pathname = usePathname();

  return (
    <>
      <nav
        aria-label="Main"
        className="hidden w-[76px] shrink-0 flex-col items-center gap-1 border-r border-line bg-white py-3 md:flex"
      >
        <Link href="/" aria-label="Zubia home" className="mb-3 flex size-12 items-center justify-center rounded-xl hover:bg-surface">
          <ZubiaMark className="size-8" />
        </Link>
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="group flex w-full flex-col items-center gap-1 py-2 text-[11px] font-medium text-ink"
            >
              <span
                className={`flex size-10 items-center justify-center rounded-xl transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-ink group-hover:bg-surface"
                }`}
              >
                <item.icon className="size-[22px]" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={active ? "text-primary" : ""}>{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/"
          aria-label="Home page"
          className="mt-auto flex size-10 items-center justify-center rounded-xl text-subtle hover:bg-surface hover:text-ink"
        >
          <Home className="size-5" />
        </Link>
      </nav>

      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-white px-3 md:hidden">
        <Link href="/" aria-label="Zubia home" className="flex items-center">
          <ZubiaLogo markClassName="size-7" wordClassName="text-2xl" />
        </Link>
        <Link
          href="/saved"
          aria-label="Saved homes"
          className="ml-auto flex size-11 items-center justify-center rounded-lg text-ink hover:bg-surface"
        >
          <Heart className="size-5" />
        </Link>
        <Link href="/pricing" className="flex h-10 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-white">
          List
        </Link>
      </header>
    </>
  );
}
