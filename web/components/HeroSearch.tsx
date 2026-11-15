"use client";

import { MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LISTING_TYPES } from "@/lib/search";
import type { ListingType } from "@/lib/types";

const PLACEHOLDERS: Record<ListingType, string> = {
  buy: "Area or district, e.g. Ntinda",
  rent: "Where do you want to rent? e.g. Kira",
  land: "Where do you want land? e.g. Mukono",
};

const POPULAR = ["Kololo", "Ntinda", "Kira", "Entebbe", "Mukono"];

/**
 * Search card in the home page hero. A plain GET form to /search, so it
 * still works before JavaScript has loaded on a slow connection.
 */
export function HeroSearch() {
  const [type, setType] = useState<ListingType>("buy");

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:p-3">
      <Tabs value={type} onValueChange={(v) => setType(v as ListingType)}>
        <TabsList variant="line" className="h-11 w-full justify-start gap-1 px-1 sm:w-fit">
          {LISTING_TYPES.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="h-10 flex-none px-4 text-[15px] font-semibold text-subtle data-active:text-primary after:bg-primary"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <form action="/search" role="search" className="mt-2 flex gap-2">
        <input type="hidden" name="type" value={type} />
        <div className="relative min-w-0 flex-1">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-subtle" />
          <label htmlFor="hero-q" className="sr-only">
            Area, district or keyword
          </label>
          <Input
            id="hero-q"
            name="q"
            type="search"
            placeholder={PLACEHOLDERS[type]}
            className="h-12 rounded-xl border-line bg-surface pl-11 text-base shadow-none focus-visible:bg-white md:text-base"
          />
        </div>
        <Button type="submit" className="h-12 rounded-xl px-4 text-base font-semibold sm:px-6" aria-label="Search">
          <Search className="size-5" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 px-1 pb-1">
        <span className="mr-1 text-sm text-subtle">Popular:</span>
        {POPULAR.map((area) => (
          <Badge key={area} asChild variant="outline" className="h-8 rounded-full border-line px-3 text-sm font-medium text-ink hover:border-primary hover:text-primary">
            <Link href={`/search?type=${type}&q=${area}`}>{area}</Link>
          </Badge>
        ))}
      </div>
    </div>
  );
}
