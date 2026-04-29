/**
 * Point-in-GeoJSON polygon test (no external deps).
 *
 * Supports GeoJSON Polygon and MultiPolygon geometries, and Feature wrappers.
 * Coordinates are assumed in [lng, lat] (EPSG:4326), matching Mapbox GeoJSON.
 */

function pointInRing([px, py], ring) {
  // Ray-casting algorithm; toggles `inside` for each edge crossing.
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    // Does this edge cross the horizontal ray at `py`?
    const crossesRay = yi > py !== yj > py;
    if (!crossesRay) continue;

    // Compute x coordinate where the edge intersects the ray.
    const xAtY = ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    // Flip inside state if the intersection is to the right of the point.
    if (px < xAtY) inside = !inside;
  }
  return inside;
}

function pointInPolygon([px, py], polygonCoords) {
  // GeoJSON Polygon coordinates: [outerRing, holeRing1, holeRing2, ...]
  if (!Array.isArray(polygonCoords) || polygonCoords.length < 1) return false;
  const outer = polygonCoords[0];
  if (!outer || outer.length < 4) return false;

  if (!pointInRing([px, py], outer)) return false;
  // If inside outer ring, it must NOT be inside any hole ring.
  for (let i = 1; i < polygonCoords.length; i++) {
    const hole = polygonCoords[i];
    if (hole && hole.length >= 4 && pointInRing([px, py], hole)) return false;
  }
  return true;
}

function pointInMultiPolygon([px, py], multiCoords) {
  if (!Array.isArray(multiCoords)) return false;
  for (const poly of multiCoords) {
    if (pointInPolygon([px, py], poly)) return true;
  }
  return false;
}

export function pointInGeoJSONGeometry([lng, lat], gj) {
  if (!gj) return false;

  // Some APIs return a Geometry, others a Feature.
  const geom = gj.type === "Feature" && gj.geometry ? gj.geometry : gj;
  if (!geom || !geom.type) return false;

  if (geom.type === "Polygon") return pointInPolygon([lng, lat], geom.coordinates);
  if (geom.type === "MultiPolygon") return pointInMultiPolygon([lng, lat], geom.coordinates);

  return false;
}

