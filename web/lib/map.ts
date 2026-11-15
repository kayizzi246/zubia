import L from "leaflet";

// Shared Leaflet settings for every map on the site.
// TODO(maps): before launch, switch to a tile provider with a free tier meant
// for production apps (e.g. MapTiler or Mapbox). OpenStreetMap's own tiles are
// fine for development but not for heavy public traffic.
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function addBaseTiles(map: L.Map) {
  L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
}
