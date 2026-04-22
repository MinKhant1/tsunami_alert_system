import { useEffect } from "react";

const SRC = "evac-route";
const LAYER = "evac-route-line";

/**
 * Renders a GeoJSON LineString (A* or heuristic) on the map.
 */
export default function EvacuationRoute({ map, routeGeojson }) {
  useEffect(() => {
    if (!map || !routeGeojson) return;
    if (!map.getSource(SRC)) {
      map.addSource(SRC, { type: "geojson", data: routeGeojson });
      map.addLayer({
        id: LAYER,
        type: "line",
        source: SRC,
        paint: { "line-color": "#22d3ee", "line-width": 4, "line-opacity": 0.9 },
        layout: { "line-cap": "round" },
      });
    } else {
      map.getSource(SRC).setData(routeGeojson);
    }
  }, [map, routeGeojson]);
  return null;
}
