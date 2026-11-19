import L from "leaflet";
import { MAP_ATTRIBUTION, MAP_TILE_URL } from "@/lib/mapStyle";

/*
  Shared Leaflet settings for every map on the site.

  This module imports Leaflet, which touches `window`, so it can only be
  reached from code that runs in the browser. Anything server-rendered
  that needs the look — the loading fallback, the container's backdrop —
  imports from lib/mapStyle.ts instead, which has no Leaflet in it.
*/

export function addBaseTiles(map: L.Map) {
  L.tileLayer(MAP_TILE_URL, {
    attribution: MAP_ATTRIBUTION,
    maxZoom: 19,
  }).addTo(map);
}
