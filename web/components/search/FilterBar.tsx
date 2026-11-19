"use client";

import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatPriceShort, TENURE_LABELS } from "@/lib/format";
import { saveSearch } from "@/lib/saved-searches";
import {
  describeSearch,
  DISTRICTS,
  filtersToQuery,
  LISTING_TYPES,
  MOVE_IN_STEPS,
  PRICE_STEPS,
  SELLER_TYPES,
  type SearchFilters,
} from "@/lib/search";
import type { ListingType, SellerType, Tenure, UnitType } from "@/lib/types";
import { UNIT_LABELS, UNIT_LOCAL_NAMES, UNIT_NOTES, UNIT_TYPES } from "@/lib/uganda";

interface FilterBarProps {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  onClear: () => void;
}

const TYPE_BUTTON_LABELS: Record<ListingType, string> = {
  buy: "For sale",
  rent: "For rent",
  land: "Land",
};

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function FilterButton({
  label,
  active,
  icon,
  children,
  width = "w-80",
}: {
  label: string;
  active: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={`flex h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold transition-colors data-[state=open]:border-primary ${
          active
            ? "border-primary bg-primary/10 text-primary"
            : "border-line bg-white text-ink hover:border-ink/40"
        }`}
      >
        {icon}
        {label}
        <ChevronDown className="size-4 opacity-70" />
      </PopoverTrigger>
      <PopoverContent align="start" className={`${width} p-4`}>
        {children}
      </PopoverContent>
    </Popover>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2 [&+&]:mt-5">
      <legend className="mb-2 text-sm font-semibold text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

/** A row of joined buttons where one is picked, e.g. Any | 1+ | 2+ | 3+. */
function Segmented<T extends string | number | null>({
  options,
  value,
  onPick,
}: {
  options: { value: T; label: string }[];
  value: T;
  onPick: (v: T) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-line">
      {options.map((o, i) => (
        <button
          key={o.label}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onPick(o.value)}
          className={`h-11 flex-1 text-sm font-medium ${i > 0 ? "border-l border-line" : ""} ${
            value === o.value ? "bg-primary text-white" : "bg-white text-ink hover:bg-surface"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * A list of choices shown as stacked radio-style buttons. An option can
 * carry a `hint`, used to show the local word for a room type ("muzigo")
 * under its English label.
 */
function ChoiceList<T extends string | null>({
  options,
  value,
  onPick,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onPick: (v: T) => void;
}) {
  return (
    <div className="space-y-1">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onPick(o.value)}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm text-ink hover:bg-surface"
        >
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
              value === o.value ? "border-primary" : "border-line"
            }`}
          >
            {value === o.value && <span className="size-2.5 rounded-full bg-primary" />}
          </span>
          <span className="min-w-0">
            <span className="block font-medium">{o.label}</span>
            {o.hint && (
              <span className="block text-xs text-subtle">{o.hint}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

const selectClass =
  "h-11 w-full cursor-pointer rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-primary";

const COUNT_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Any" },
  ...[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}+` })),
];

// ---------------------------------------------------------------------------
// The bar
// ---------------------------------------------------------------------------

export function FilterBar({ filters, onChange, onClear }: FilterBarProps) {
  const [draft, setDraft] = useState(filters.q);
  const steps = PRICE_STEPS[filters.type];
  const isLand = filters.type === "land";
  const isRent = filters.type === "rent";

  // What the "Room type" button says once something is picked, e.g.
  // "Single room · Self-contained".
  const roomLabel = filters.unit
    ? [UNIT_LABELS[filters.unit], filters.selfContained && "Self-contained"]
        .filter(Boolean)
        .join(" · ")
    : filters.selfContained
      ? "Self-contained"
      : "Room type";

  const priceLabel =
    filters.minPrice && filters.maxPrice
      ? `UGX ${formatPriceShort(filters.minPrice)}–${formatPriceShort(filters.maxPrice)}`
      : filters.minPrice
        ? `UGX ${formatPriceShort(filters.minPrice)}+`
        : filters.maxPrice
          ? `Up to UGX ${formatPriceShort(filters.maxPrice)}`
          : "Price";

  const bedsLabel =
    filters.beds || filters.baths
      ? [filters.beds && `${filters.beds}+ bd`, filters.baths && `${filters.baths}+ ba`].filter(Boolean).join(", ")
      : "Beds & baths";

  const moreCount = [
    filters.district,
    filters.seller,
    !isRent && filters.titleChecked,
  ].filter(Boolean).length;
  const hasAnyFilter =
    moreCount > 0 ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.beds ||
    filters.baths ||
    filters.tenure ||
    filters.unit ||
    filters.selfContained ||
    filters.maxMoveIn ||
    filters.q;

  function handleSave() {
    const query = filtersToQuery(filters);
    // For a rental the room type is already in describeSearch, so the
    // extra detail worth keeping is the price, not the bed count.
    const detail = isRent
      ? [priceLabel !== "Price" && priceLabel]
      : [priceLabel !== "Price" && priceLabel, bedsLabel !== "Beds & baths" && bedsLabel];
    const label = [describeSearch(filters), ...detail].filter(Boolean).join(" · ");
    if (saveSearch(query, label)) {
      toast.success("Search saved", { description: "Find it any time under Saved homes." });
    } else {
      toast.info("You've already saved this search.");
    }
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 md:px-4">
      {/* Location search */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onChange({ q: draft });
        }}
        className="relative w-60 shrink-0 md:w-80"
      >
        <label htmlFor="search-q" className="sr-only">
          Area, district or keyword
        </label>
        <input
          id="search-q"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Area, district or keyword"
          className="h-11 w-full rounded-lg border border-line bg-white pl-3.5 pr-20 text-[15px] text-ink placeholder:text-subtle focus:border-primary focus:outline-none"
        />
        {draft && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setDraft("");
              onChange({ q: "" });
            }}
            className="absolute right-10 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-subtle hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-ink hover:bg-surface"
        >
          <Search className="size-5" />
        </button>
      </form>

      {/* For sale / For rent / Land */}
      <FilterButton label={TYPE_BUTTON_LABELS[filters.type]} active width="w-64">
        <ChoiceList
          options={LISTING_TYPES.map((t) => ({ value: t.value, label: TYPE_BUTTON_LABELS[t.value] }))}
          value={filters.type}
          // Price steps differ by type, and the room-type filters only
          // apply to rentals, so clear all of them when the type changes.
          onPick={(type) =>
            onChange({
              type,
              minPrice: null,
              maxPrice: null,
              unit: null,
              selfContained: false,
              maxMoveIn: null,
            })
          }
        />
      </FilterButton>

      {/* Price */}
      <FilterButton label={priceLabel} active={priceLabel !== "Price"}>
        <Section title={filters.type === "rent" ? "Rent per month" : "Price range"}>
          <div className="flex items-center gap-2">
            <select
              aria-label="Minimum price"
              value={filters.minPrice ?? ""}
              onChange={(e) => onChange({ minPrice: Number(e.target.value) || null })}
              className={selectClass}
            >
              <option value="">No min</option>
              {steps.map((p) => (
                <option key={p} value={p}>
                  UGX {formatPriceShort(p)}
                </option>
              ))}
            </select>
            <span className="text-subtle">–</span>
            <select
              aria-label="Maximum price"
              value={filters.maxPrice ?? ""}
              onChange={(e) => onChange({ maxPrice: Number(e.target.value) || null })}
              className={selectClass}
            >
              <option value="">No max</option>
              {steps.map((p) => (
                <option key={p} value={p}>
                  UGX {formatPriceShort(p)}
                </option>
              ))}
            </select>
          </div>
        </Section>

        {/*
          The monthly rent is not what stops people moving. The lump sum
          does: advance plus deposit plus any broker fee is commonly three
          to four months' rent in Kampala. Letting people filter on the
          money they can actually raise is the point of this filter.
        */}
        {isRent && (
          <Section title="Money you can raise to move in">
            <select
              aria-label="Maximum move-in cost"
              value={filters.maxMoveIn ?? ""}
              onChange={(e) =>
                onChange({ maxMoveIn: Number(e.target.value) || null })
              }
              className={selectClass}
            >
              <option value="">Any amount</option>
              {MOVE_IN_STEPS.map((p) => (
                <option key={p} value={p}>
                  Up to UGX {formatPriceShort(p)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-relaxed text-subtle">
              Advance rent, the security deposit and any broker fee added
              together. This is the cash you need before you get the keys.
            </p>
          </Section>
        )}
      </FilterButton>

      {/*
        Room type. This replaces beds-and-baths for rentals, because
        someone renting in Uganda asks "single room or double room, and is
        it self-contained?" rather than counting bathrooms.
      */}
      {isRent && (
        <FilterButton label={roomLabel} active={roomLabel !== "Room type"} width="w-80">
          <Section title="What kind of place?">
            <ChoiceList<UnitType | null>
              options={[
                { value: null, label: "Any kind" },
                ...UNIT_TYPES.map((u) => ({
                  value: u,
                  label: UNIT_LABELS[u],
                  hint: UNIT_LOCAL_NAMES[u],
                })),
              ]}
              value={filters.unit}
              onPick={(unit) => onChange({ unit })}
            />
          </Section>

          {filters.unit && (
            <p className="mt-3 rounded-lg bg-surface p-3 text-xs leading-relaxed text-subtle">
              {UNIT_NOTES[filters.unit]}
            </p>
          )}

          <Section title="Toilet and shower">
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-1 text-sm text-ink">
              <input
                type="checkbox"
                checked={filters.selfContained}
                onChange={(e) => onChange({ selfContained: e.target.checked })}
                className="mt-0.5 size-5 accent-primary"
              />
              <span>
                <span className="block font-medium">Self-contained only</span>
                <span className="block text-xs text-subtle">
                  The toilet and shower are inside your own unit, not shared
                  with the yard.
                </span>
              </span>
            </label>
          </Section>
        </FilterButton>
      )}

      {/* Beds & baths stays for buying, where room counts are how people shop. */}
      {!isLand && !isRent && (
        <FilterButton label={bedsLabel} active={bedsLabel !== "Beds & baths"} width="w-96">
          <Section title="Bedrooms">
            <Segmented options={COUNT_OPTIONS} value={filters.beds} onPick={(beds) => onChange({ beds })} />
          </Section>
          <Section title="Bathrooms">
            <Segmented options={COUNT_OPTIONS} value={filters.baths} onPick={(baths) => onChange({ baths })} />
          </Section>
        </FilterButton>
      )}

      {/*
        Tenure is what you check before buying land. A tenant renting a
        room does not care whether the plot is mailo or freehold, so this
        is left out of the rental search to keep it short.
      */}
      {!isRent && (
        <FilterButton label={filters.tenure ? TENURE_LABELS[filters.tenure] : "Tenure"} active={!!filters.tenure} width="w-64">
          <ChoiceList<Tenure | null>
            options={[
              { value: null, label: "Any tenure" },
              ...(Object.keys(TENURE_LABELS) as Tenure[]).map((t) => ({ value: t, label: TENURE_LABELS[t] })),
            ]}
            value={filters.tenure}
            onPick={(tenure) => onChange({ tenure })}
          />
        </FilterButton>
      )}

      {/* More filters */}
      <FilterButton
        label={moreCount ? `Filters (${moreCount})` : "Filters"}
        active={moreCount > 0}
        icon={<SlidersHorizontal className="size-4" />}
      >
        <Section title="District">
          <select
            aria-label="District"
            value={filters.district}
            onChange={(e) => onChange({ district: e.target.value })}
            className={selectClass}
          >
            <option value="">All districts</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Section>
        <Section title="Listed by">
          <select
            aria-label="Listed by"
            value={filters.seller ?? ""}
            onChange={(e) => onChange({ seller: (e.target.value || null) as SellerType | null })}
            className={selectClass}
          >
            <option value="">Anyone</option>
            {SELLER_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {/* On a rental the owner is the landlord. */}
                {isRent && s.value === "owner" ? "Landlord" : s.label}
              </option>
            ))}
          </select>
        </Section>
        {!isRent && (
          <Section title="Land title">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm text-ink">
              <input
                type="checkbox"
                checked={filters.titleChecked}
                onChange={(e) => onChange({ titleChecked: e.target.checked })}
                className="size-5 accent-primary"
              />
              Only show listings with a checked title
            </label>
          </Section>
        )}
        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              onClear();
            }}
            className="mt-4 h-11 w-full rounded-lg border border-line text-sm font-semibold text-primary hover:bg-surface"
          >
            Clear all filters
          </button>
        )}
      </FilterButton>

      <button
        type="button"
        onClick={handleSave}
        className="flex h-11 shrink-0 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        Save search
      </button>
    </div>
  );
}
