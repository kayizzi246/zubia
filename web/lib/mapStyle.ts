/*
  How the maps look — and deliberately free of any Leaflet import.

  Leaflet touches `window` the moment it is imported, so anything that
  pulls it in cannot be rendered on the server. The map component itself
  is loaded with `ssr: false` for that reason, but its loading fallback
  and the page around it are ordinary server-rendered React, and they
  still need the backdrop colour.

  So the plain values live here and lib/map.ts, which does import
  Leaflet, reads them from this file.

  Kept in step with the phone app's search.dart, which offers the same
  three styles and defaults to the same one. A basemap is only a URL
  serving PNG tiles, so matching the two is a matter of using the same
  address — no library involved.

  TODO(maps): both sources below are free, need no key, and are aimed at
  modest traffic. Before launch, move to a provider with a production
  free tier (MapTiler, Mapbox) or self-host, or the tiles will be cut
  off.
*/

export type MapStyle = "dark" | "light" | "standard";

/**
 * The one line to change.
 *
 * `dark` is the default because a near-black basemap is what makes the
 * price pins carry the only strong colour on screen. On OpenStreetMap's
 * own palette — green parks, yellow trunk roads — a blue pin lands
 * almost invisibly.
 */
export const MAP_STYLE: MapStyle = "dark";

export const MAP_TILES: Record<MapStyle, string> = {
  dark: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  light: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  standard: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
};

/*
  Credit for whoever drew the tiles — a licence requirement, not
  decoration. The data is OpenStreetMap's; the dark and light styles are
  CARTO's work on top of it, so both have to be named.

  If you change MAP_STYLE, the credit changes with it. Do not hard-code
  one.
*/
const OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const CARTO = `${OSM}, &copy; <a href="https://carto.com/attributions">CARTO</a>`;

export const MAP_ATTRIBUTION: Record<MapStyle, string> = {
  dark: CARTO,
  light: CARTO,
  standard: OSM,
};

/**
 * What shows behind the tiles before they arrive.
 *
 * A white flash under a dark map is the most obvious way to make
 * loading look broken, so the container is painted to match the style
 * rather than left at the page background.
 */
export const MAP_BACKDROP = MAP_STYLE === "dark" ? "#0f1b26" : "#eef2f8";
