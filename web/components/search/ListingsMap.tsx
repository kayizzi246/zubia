"use client";

// Interactive map of listings: Leaflet + OpenStreetMap tiles (free, no key).
// Uses Leaflet directly (not react-leaflet): the map is created once in an
// effect and fully removed on cleanup, which is safe when React mounts it
// twice (dev mode) or moves it. Pins are updated in place, not re-created.

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { LocateFixed, Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { formatListingPrice, formatPriceShort, formatSize } from "@/lib/format";
import { addBaseTiles } from "@/lib/map";
import type { Listing } from "@/lib/types";

export interface ListingsMapProps {
  listings: Listing[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
}

const KAMPALA: L.LatLngTuple = [0.3476, 32.5825];

function pinIcon(listing: Listing, active: boolean) {
  return L.divIcon({
    className: "zb-pin-anchor", // replaces Leaflet's default white box
    iconSize: [0, 0],
    html: `<div class="zb-pin${active ? " zb-pin--active" : ""}${listing.featured ? " zb-pin--featured" : ""}">${formatPriceShort(listing.priceUGX)}</div>`,
  });
}

function fitTo(map: L.Map, listings: Listing[]) {
  if (listings.length === 0) return;
  const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng] as L.LatLngTuple));
  map.fitBounds(bounds, { padding: [56, 56], maxZoom: 14 });
}

export default function ListingsMap({ listings, selectedId, hoveredId, onSelect }: ListingsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef(new Map<string, { marker: L.Marker; listing: Listing }>());
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Listings without coordinates can't be shown on the map.
  const mappable = useMemo(() => listings.filter((l) => l.lat !== 0 || l.lng !== 0), [listings]);
  const selected = mappable.find((l) => l.id === selectedId);
  // Changes only when the set of results changes (not on every hover).
  const resultsKey = mappable.map((l) => l.id).join(",");
  const mappableRef = useRef(mappable);
  useEffect(() => {
    mappableRef.current = mappable;
  }, [mappable]);

  // 1. Create the map once; remove it completely on unmount.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const map = L.map(el, { center: KAMPALA, zoom: 11, zoomControl: false });
    addBaseTiles(map);
    map.on("click", () => onSelectRef.current(null)); // empty map closes the mini card
    mapRef.current = map;

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);
    const markers = markersRef.current;
    return () => {
      observer.disconnect();
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Rebuild the pins and zoom to fit whenever the results change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    markers.forEach(({ marker }) => marker.remove());
    markers.clear();

    const current = mappableRef.current;
    for (const l of current) {
      const marker = L.marker([l.lat, l.lng], {
        icon: pinIcon(l, false),
        title: `${formatListingPrice(l)}, ${l.title}`,
        zIndexOffset: l.featured ? 100 : 0,
      })
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectRef.current(l.id);
          document.getElementById(`listing-${l.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        })
        .addTo(map);
      markers.set(l.id, { marker, listing: l });
    }
    fitTo(map, current);
  }, [resultsKey]);

  // 3. Highlight the hovered or selected pin.
  useEffect(() => {
    markersRef.current.forEach(({ marker, listing }, id) => {
      const active = id === selectedId || id === hoveredId;
      marker.setIcon(pinIcon(listing, active));
      marker.setZIndexOffset(active ? 1000 : listing.featured ? 100 : 0);
    });
  }, [selectedId, hoveredId, resultsKey]);

  const overlayButton =
    "flex items-center justify-center rounded-full bg-white text-ink shadow-md ring-1 ring-black/10 hover:bg-surface";

  return (
    // `isolate` keeps Leaflet's high z-indexes (400–1000) inside the map, so
    // filter dropdowns and menus can open on top of it.
    <div className="relative isolate h-full w-full">
      <div ref={containerRef} className="h-full w-full bg-[#e5ebe8]" />

      {/* Overlays sit above Leaflet's layers (z-index 400+). */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex items-start justify-between gap-2">
        <span className="pointer-events-auto rounded-full bg-ink/85 px-4 py-2 text-sm font-semibold text-white shadow-md">
          {mappable.length} {mappable.length === 1 ? "listing" : "listings"}
        </span>
        <button
          type="button"
          onClick={() => mapRef.current && fitTo(mapRef.current, mappable)}
          className="pointer-events-auto flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-md hover:bg-primary-dark"
        >
          <LocateFixed className="size-4" />
          Re-center
        </button>
      </div>

      <div className="absolute bottom-24 right-3 z-[500] flex flex-col gap-2 lg:bottom-8">
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className={`${overlayButton} size-11`}>
          <Plus className="size-5" />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className={`${overlayButton} size-11`}>
          <Minus className="size-5" />
        </button>
      </div>

      {selected && (
        <div className="absolute inset-x-3 bottom-20 z-[600] mx-auto flex max-w-md overflow-hidden rounded-card bg-white shadow-xl lg:bottom-6">
          <div className="relative w-28 shrink-0 bg-surface">
            {selected.photos[0] && <Image src={selected.photos[0]} alt="" fill sizes="112px" className="object-cover" />}
          </div>
          <div className="min-w-0 flex-1 p-3">
            <p className="font-display text-lg font-extrabold text-ink">{formatListingPrice(selected)}</p>
            <p className="text-sm text-subtle">
              {[
                selected.bedrooms !== null && `${selected.bedrooms} bd`,
                selected.bathrooms !== null && `${selected.bathrooms} ba`,
                formatSize(selected.sizeDecimals),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <Link href={`/listing/${selected.id}`} className="block truncate text-sm font-medium text-primary hover:underline">
              {selected.title}, {selected.area}
            </Link>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onSelect(null)}
            className="flex size-11 shrink-0 items-center justify-center text-subtle hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
