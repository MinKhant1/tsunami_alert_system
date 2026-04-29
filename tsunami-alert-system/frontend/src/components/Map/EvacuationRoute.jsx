import { useEffect } from "react";
import { removeEvacuationRouteFromMap, EVAC_SRC as SRC, EVAC_LAYER as LAYER } from "./mapEvacuationUtils";

/** Renders a GeoJSON LineString (driving/walking directions polyline) on the map. */
function isValidLineString(geo) {
  return (
    geo &&
    geo.type === "LineString" &&
    Array.isArray(geo.coordinates) &&
    geo.coordinates.length >= 2
  );
}

export default function EvacuationRoute({ map, routeGeojson }) {
  useEffect(() => {
    if (!map) return;
    if (!isValidLineString(routeGeojson)) {
      removeEvacuationRouteFromMap(map);
      return;
    }
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
    return () => {
      removeEvacuationRouteFromMap(map);
    };
  }, [map, routeGeojson]);
  return null;
}
