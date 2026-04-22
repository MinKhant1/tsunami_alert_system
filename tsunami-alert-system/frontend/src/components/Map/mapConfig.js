import mapboxgl from "mapbox-gl";
import maplibregl from "maplibre-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import "maplibre-gl/dist/maplibre-gl.css";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Use Mapbox when a token is set; otherwise MapLibre + public Carto GL (dark) so / works with no .env.
 */
export function getMapContext() {
  if (TOKEN && String(TOKEN).trim() !== "") {
    mapboxgl.accessToken = TOKEN.trim();
    return {
      lib: mapboxgl,
      style: "mapbox://styles/mapbox/dark-v11",
      fallbackStyle: null,
      label: "mapbox",
    };
  }
  return {
    lib: maplibregl,
    // No key: official MapLibre demo (reliable), then see AlertMap for Carto fallback on error
    style: "https://demotiles.maplibre.org/style.json",
    fallbackStyle: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    label: "maplibre",
  };
}
