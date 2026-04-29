/**
 * Shared evacuation path: one inland rally point + driving directions (roads).
 * Mapbox Directions when VITE_MAPBOX_TOKEN is set; otherwise public OSRM demo.
 */

/** Land demo near default sim lat/lng — used on /evac when GPS is unavailable. */
export const DEMO_EVAC_FROM = { lat: 8.08, lng: 98.98 };
export const DEMO_EVAC_TO = { lat: 8.2, lng: 99.12 };

/**
 * Approximate inland rally point (same formula everywhere: Home, Admin preview, /evac).
 */
export function evacuationRallyPoint(lat, lng) {
  const km = 14;
  const latRad = (lat * Math.PI) / 180;
  const cosLat = Math.max(0.2, Math.cos(latRad));
  const dLat = (km / 111) * 0.82;
  const dLng = ((km / 111) * 0.58) / cosLat;
  return { lat: lat + dLat, lng: lng + dLng };
}

export function straightLineFallback(from, to) {
  return {
    type: "LineString",
    coordinates: [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ],
  };
}

/**
 * @param {{ lat: number; lng: number }} from
 * @param {{ lat: number; lng: number }} to
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ type: 'LineString'; coordinates: number[][] }>}
 */
export async function fetchRoadLineString(from, to, signal) {
  const a = `${from.lng},${from.lat}`;
  const b = `${to.lng},${to.lat}`;
  const token = import.meta.env.VITE_MAPBOX_TOKEN?.trim?.() ?? "";
  const url = token
    ? `https://api.mapbox.com/directions/v5/mapbox/walking/${a};${b}?geometries=geojson&overview=full&access_token=${encodeURIComponent(token)}`
    : `https://router.project-osrm.org/route/v1/foot/${a};${b}?overview=full&geometries=geojson`;

  const res = await fetch(url, { signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.code || res.statusText || String(res.status);
    throw new Error(typeof msg === "string" ? msg : "directions failed");
  }
  const geom = data?.routes?.[0]?.geometry;
  if (geom?.type === "LineString" && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
    return geom;
  }
  throw new Error("no route geometry");
}
