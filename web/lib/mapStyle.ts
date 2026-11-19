/*
  How the maps look — and deliberately free of any Leaflet import.

  Leaflet touches `window` the moment it is imported, so anything that
  pulls it in cannot be rendered on the server. The map component itself
  is loaded with `ssr: false` for that reason, but its loading fallback
  and the page around it are ordinary server-rendered React, and they
  still need the backdrop colour.

  So the plain values live here and lib/map.ts, which does import
  Leaflet, reads them from this file.

  Kept in step with the phone app's search.dart, which darkens the same
  tiles the same way.
*/

export type MapStyle = "dark" | "standard";

/**
 * The one line to change.
 *
 * `dark` is the default because a near-black basemap is what makes the
 * price pins carry the only strong colour on screen. On OpenStreetMap's
 * own palette — green parks, yellow trunk roads — a pin lands almost
 * invisibly.
 */
export const MAP_STYLE: MapStyle = "dark";

/*
  OpenStreetMap's own tiles, for both styles.

  There is no second URL here any more. CARTO's dark and light basemaps
  were used until they began returning a single "API KEY REQUIRED"
  placeholder for every tile — the request still answers 200 with a
  valid PNG, which is exactly why a status check did not catch it. Every
  coordinate came back byte-identical.

  So the dark look is made here instead of fetched: the same OSM tiles,
  inverted and desaturated in the browser. No key, no second provider,
  and nothing to expire.

  TODO(maps): OSM's tiles are free and aimed at modest traffic. Before
  launch, move to a provider with a production free tier (MapTiler,
  Mapbox) or self-host, or they will be cut off.
*/
export const MAP_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/**
 * Credit for the tiles — a licence requirement, not decoration.
 *
 * OpenStreetMap only, now that no second party draws them. Inverting
 * someone's tiles in a browser does not make them a new work.
 */
export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * What turns the pale OSM tiles into a dark map.
 *
 * Invert first, then pull most of the colour out: inverting alone gives
 * a lurid negative where grass is magenta, and the desaturation is what
 * leaves a quiet near-neutral canvas for the pins to sit on.
 *
 * Applied to Leaflet's tile pane only — see .zb-map--dark in
 * globals.css. Filtering the whole map would inverted the price pins
 * too, turning the blue ones orange.
 */
export const MAP_DARK_CLASS = MAP_STYLE === "dark" ? "zb-map--dark" : "";

/**
 * What shows behind the tiles before they arrive.
 *
 * A white flash under a dark map is the most obvious way to make
 * loading look broken, so the container is painted to match the style
 * rather than left at the page background.
 */
export const MAP_BACKDROP = MAP_STYLE === "dark" ? "#1f2426" : "#eef2f8";
