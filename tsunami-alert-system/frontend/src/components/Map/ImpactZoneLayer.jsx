import { useEffect } from "react";
const SOURCE = "impact-zones";

export default function ImpactZoneLayer({ map, alerts, impactGeojson }) {
  useEffect(() => {
    if (!map) return;
    if (!map.getSource(SOURCE)) {
      map.addSource(SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      // No layer `filter`: Mapbox GL v3 rejects $type == "MultiPolygon" in fill layer filters
      // (see style-spec validation). We only add Polygon/MultiPolygon in buildFeatures().
      map.addLayer({
        id: `${SOURCE}-fill`,
        type: "fill",
        source: SOURCE,
        paint: {
          "fill-color": [
            "match",
            ["get", "level"],
            "WATCH",
            "#EAB308",
            "ADVISORY",
            "#F97316",
            "WARNING",
            "#EF4444",
            "#888888",
          ],
          "fill-opacity": 0.35,
          "fill-outline-color": "rgba(248, 250, 252, 0.7)",
        },
      });
    }
  }, [map]);

  useEffect(() => {
    if (!map || !map.getSource(SOURCE)) return;
    const feats = buildFeatures(alerts, impactGeojson);
    map.getSource(SOURCE).setData({ type: "FeatureCollection", features: feats });
  }, [map, alerts, impactGeojson]);

  return null;
}

function buildFeatures(alerts, fileGeojson) {
  const fromAlerts =
    (alerts || [])
      .filter((a) => a.impact_zone_geojson)
      .map((a) => ({
        type: "Feature",
        properties: { level: a.level },
        geometry: alertGeometry(a.impact_zone_geojson),
      })) || [];
  const fileFeats =
    fileGeojson && fileGeojson.features && fileGeojson.type === "FeatureCollection"
      ? fileGeojson.features
      : [];
  return [...fileFeats, ...fromAlerts]
    .filter(isPolygonalFeature)
    .flatMap(expandMultiPolygonToPolygons);
}

/** API may return a Geometry or a nested GeoJSON Feature. */
function alertGeometry(gj) {
  if (!gj) return null;
  if (gj.type === "Feature" && gj.geometry) return gj.geometry;
  if (gj.type === "Polygon" || gj.type === "MultiPolygon") return gj;
  return null;
}

/** Mapbox GL v3 is picky about `MultiPolygon` in some style paths; one Polygon per feature is fine for fill. */
function expandMultiPolygonToPolygons(f) {
  if (!f || !f.geometry) return [];
  if (f.geometry.type !== "MultiPolygon") return [f];
  return f.geometry.coordinates.map((polyCoords) => ({
    type: "Feature",
    properties: f.properties || {},
    geometry: { type: "Polygon", coordinates: polyCoords },
  }));
}

function isPolygonalFeature(f) {
  if (!f || !f.geometry) return false;
  const t = f.geometry.type;
  return t === "Polygon" || t === "MultiPolygon";
}
