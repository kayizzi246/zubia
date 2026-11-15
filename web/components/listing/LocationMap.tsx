"use client";

// Small map with one pin for the listing page.
// Uses Leaflet directly (not react-leaflet): the map is created in an effect and
// fully removed on cleanup, so React re-mounting it (dev mode, the listing
// pop-up) can never leave a half-removed map behind.
// TODO(maps): same tile provider note as components/search/ListingsMap.tsx.

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { addBaseTiles } from "@/lib/map";

export default function LocationMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const map = L.map(el, { center: [lat, lng], zoom: 14, scrollWheelZoom: false });
    addBaseTiles(map);
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: "zb-pin-anchor",
        iconSize: [0, 0],
        html: '<div class="zb-pin zb-pin--active">Here</div>',
      }),
      keyboard: false,
    }).addTo(map);

    // The pop-up animates open; re-measure so tiles fill the box.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);

    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [lat, lng]);

  return (
    <div className="relative isolate h-64 overflow-hidden rounded-card bg-[#e5ebe8] md:h-80">
      <div ref={ref} className="h-full w-full" />
    </div>
  );
}
