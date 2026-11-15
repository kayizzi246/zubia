"use client";

import dynamic from "next/dynamic";

// Leaflet needs the browser's window, so the map loads only in the browser.
export const LocationMapLoader = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-card bg-surface md:h-80" />,
});
