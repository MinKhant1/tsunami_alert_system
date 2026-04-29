import { useEffect, useState } from "react";
import {
  DEMO_EVAC_FROM,
  DEMO_EVAC_TO,
  evacuationRallyPoint,
  fetchRoadLineString,
  straightLineFallback,
} from "../lib/evacuationRouting";

/**
 * One consistent road-following LineString for Home, Admin map preview, and /evac.
 *
 * @param {{ lat: number; lng: number } | null} pos User location; null uses demo endpoints only when useDemoFallback.
 * @param {boolean} enabled When false, route is cleared (e.g. no active alert on Home).
 * @param {{ useDemoFallback?: boolean }} opts If true and pos is null, uses DEMO_EVAC_FROM → DEMO_EVAC_TO (roads when API works).
 */
export function useEvacuationRoute(pos, enabled, opts = {}) {
  const { useDemoFallback = false } = opts;
  const [route, setRoute] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setRoute(null);
      return;
    }

    const from = pos ?? (useDemoFallback ? DEMO_EVAC_FROM : null);
    const to = pos ? evacuationRallyPoint(pos.lat, pos.lng) : useDemoFallback ? DEMO_EVAC_TO : null;

    if (!from || !to) {
      setRoute(null);
      return;
    }

    const ac = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const line = await fetchRoadLineString(from, to, ac.signal);
        if (!cancelled) setRoute(line);
      } catch {
        if (!cancelled) setRoute(straightLineFallback(from, to));
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [enabled, useDemoFallback, pos?.lat, pos?.lng]);

  return route;
}
