import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ImpactZoneLayer from "./ImpactZoneLayer";
import UserMarker from "./UserMarker";
import EvacuationRoute from "./EvacuationRoute";
import { removeEvacuationRouteFromMap } from "./mapEvacuationUtils";
import { getMapContext } from "./mapConfig";

const CENTER = [80, 10];
const ZOOM = 4;

/**
 * Mapbox when VITE_MAPBOX_TOKEN is set; else MapLibre + Carto dark (no key).
 */
export default function AlertMap({ pos, activeAlerts, routeGeojson, impactGeojson }) {
  const ctx = useMemo(() => getMapContext(), []);
  const { lib: M, style, label, fallbackStyle } = ctx;
  const container = useRef(null);
  const map = useRef(null);
  const triedStyleFallback = useRef(false);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    const m = new M.Map({
      container: container.current,
      style,
      center: CENTER,
      zoom: ZOOM,
    });
    m.addControl(new M.NavigationControl());
    m.on("load", () => {
      setMapError(null);
      m.resize();
      setReady(true);
    });
    m.on("error", (e) => {
      const fe = e?.error;
      if (label === "maplibre" && fallbackStyle && !triedStyleFallback.current) {
        triedStyleFallback.current = true;
        m.setStyle(fallbackStyle);
        return;
      }
      setMapError(
        (fe && (fe.message || String(fe))) || "Map failed to load. Check the browser network tab."
      );
    });
    const onResize = () => m.resize();
    window.addEventListener("resize", onResize);
    const raf = requestAnimationFrame(() => m.resize());
    map.current = m;
    return () => {
      triedStyleFallback.current = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      m.remove();
      map.current = null;
    };
  }, [M, style, label, fallbackStyle]);

  useEffect(() => {
    if (!ready || !map.current || !pos) return;
    map.current.easeTo({ center: [pos.lng, pos.lat], duration: 1200, essential: true });
  }, [ready, pos]);

  useLayoutEffect(() => {
    if (!ready || !map.current) return;
    if (routeGeojson) return;
    removeEvacuationRouteFromMap(map.current);
  }, [ready, routeGeojson]);

  return (
    <div className="relative w-full h-[50vh] min-h-[400px] max-h-[720px] rounded-lg overflow-hidden border border-slate-800 bg-slate-900/50">
      {mapError && (
        <div className="absolute bottom-2 left-2 right-2 z-20 rounded border border-amber-500/50 bg-slate-950/95 p-2 text-xs text-amber-200">
          <p className="font-medium text-amber-100">Map error</p>
          <p className="text-slate-300 mt-1 break-words">{mapError}</p>
        </div>
      )}
      <div ref={container} className="absolute inset-0 w-full h-full" />
      {ready && map.current && (
        <ImpactZoneLayer
          map={map.current}
          alerts={activeAlerts}
          impactGeojson={impactGeojson}
        />
      )}
      {ready && pos && <UserMarker map={map.current} pos={pos} mapLib={M} />}
      {ready && map.current && (
        <EvacuationRoute map={map.current} routeGeojson={routeGeojson ?? null} />
      )}
    </div>
  );
}