"use client";

import { MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LISTING_TYPES } from "@/lib/search";
import type { ListingType, UnitType } from "@/lib/types";
import { UNIT_LABELS } from "@/lib/uganda";

const PLACEHOLDERS: Record<ListingType, string> = {
  buy: "Area or district, e.g. Ntinda",
  rent: "Where do you want to stay? e.g. Kireka",
  land: "Where do you want land? e.g. Mukono",
};

const POPULAR = ["Kololo", "Ntinda", "Kira", "Entebbe", "Mukono"];

/**
 * The room types to offer straight away, so the commonest searches are one
 * tap from the home page instead of buried in a filter menu. These are the
 * cheap end of the market, which is where most people are looking.
 */
const QUICK_UNITS: UnitType[] = [
  "single_room",
  "double_room",
  "bedsitter",
  "one_bedroom",
];

/**
 * How the search sits in whichever hero is using it.
 *
 * `card` floats it on a dark or photographic background; `bare` drops the
 * white panel so it can sit directly on a light one.
 */
const WRAPPERS = {
  card: "w-full max-w-2xl rounded-2xl border border-line bg-white p-2 sm:p-3",
  bare: "w-full max-w-2xl",
} as const;

/**
 * Search card in the home page hero. A plain GET form to /search, so it
 * still works before JavaScript has loaded on a slow connection.
 */
export function HeroSearch({
  variant = "card",
}: {
  variant?: keyof typeof WRAPPERS;
}) {
  // Renting is what most people come here for, so it is the open tab.
  const [type, setType] = useState<ListingType>("rent");

  return (
    <div className={WRAPPERS[variant]}>
      <Tabs value={type} onValueChange={(v) => setType(v as ListingType)}>
        <TabsList variant="line" className="h-10 w-full justify-start gap-1 px-1 sm:w-fit">
          {LISTING_TYPES.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="h-9 flex-none px-3 text-[13px] font-semibold text-subtle data-active:text-primary after:bg-primary"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <form action="/search" role="search" className="mt-2 flex gap-2">
        <input type="hidden" name="type" value={type} />
        <div className="relative min-w-0 flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <label htmlFor="hero-q" className="sr-only">
            Area, district or keyword
          </label>
          <Input
            id="hero-q"
            name="q"
            type="search"
            placeholder={PLACEHOLDERS[type]}
            className="h-11 rounded-xl border-line bg-surface pl-9 text-[13px] shadow-none focus-visible:bg-white md:text-[13px]"
          />
        </div>
        <Button type="submit" className="h-11 rounded-xl px-4 text-[13px] font-semibold sm:px-5" aria-label="Search">
          <Search className="size-4" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </form>

      {/*
        One tap to the kind of place you want. A single room and a
        1-bedroom flat are different products at very different prices, so
        asking this first saves people scrolling past homes they can't
        afford. Plain links, so they work before JavaScript loads.
      */}
      {type === "rent" && (
        <div className="mt-2.5 px-1">
          {/*
            The label and the self-contained shortcut share a row: in a
            400px hero that one line is the difference between the popular
            areas being visible and being cut off.
          */}
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
              What kind of place do you need?
            </p>
            <Link
              href="/search?type=rent&sc=1"
              className="text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
            >
              Self-contained only
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {QUICK_UNITS.map((unit) => (
              <Link
                key={unit}
                href={`/search?type=rent&unit=${unit}`}
                className="flex min-h-9 items-center justify-center rounded-lg border border-line bg-surface px-2 text-center text-[12px] font-semibold text-ink hover:border-primary hover:bg-white hover:text-primary"
              >
                {UNIT_LABELS[unit]}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 px-1 pb-1">
        <span className="mr-1 text-[11px] uppercase tracking-wide text-subtle">Popular</span>
        {POPULAR.map((area) => (
          <Badge key={area} asChild variant="outline" className="h-7 rounded-full border-line px-2.5 text-[11px] font-medium text-ink hover:border-primary hover:text-primary">
            <Link href={`/search?type=${type}&q=${area}`}>{area}</Link>
          </Badge>
        ))}
      </div>
    </div>
  );
}
