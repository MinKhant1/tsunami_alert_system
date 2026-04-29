import { useMemo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import EvacuationRoute from "../components/Map/EvacuationRoute";
import { getMapContext } from "../components/Map/mapConfig";
import { useGeolocation } from "../hooks/useGeolocation";
import { useEvacuationRoute } from "../hooks/useEvacuationRoute";
import { useAlerts } from "../hooks/useAlerts";
import { DEMO_EVAC_FROM } from "../lib/evacuationRouting";
import { pointInGeoJSONGeometry } from "../lib/pointInGeoJSON";

/**
 * Full-screen driving route to inland rally (same engine as Home / Admin preview).
 * Mapbox walking Directions with token, else OSRM foot profile (snap to paths/roads).
 */
export default function EvacuationPage() {
  const { pos } = useGeolocation();
  const activeAlerts = useAlerts();

  const hasLiveAlert = Array.isArray(activeAlerts) && activeAlerts.some((a) => a && a.is_active !== false);

  const isAffected = useMemo(() => {
    if (!pos) return false;
    const alertsWithZones = Array.isArray(activeAlerts) ? activeAlerts.filter((a) => a?.impact_zone_geojson) : [];
    if (alertsWithZones.length === 0) return true;
    return alertsWithZones.some((a) => pointInGeoJSONGeometry([pos.lng, pos.lat], a.impact_zone_geojson));
  }, [pos, activeAlerts]);

  // If we have GPS, only draw when inside impact zone. If GPS is missing, keep demo route behavior.
  const shouldDrawRoute = Boolean(hasLiveAlert && (pos ? isAffected : true));

  const route = useEvacuationRoute(pos, shouldDrawRoute, { useDemoFallback: true });

  const ctx = useMemo(() => getMapContext(), []);
  const { lib: M, style } = ctx;
  const cont = useRef(null);
  const map = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!cont.current) return;
    const m = new M.Map({
      container: cont.current,
      style,
      center: [DEMO_EVAC_FROM.lng, DEMO_EVAC_FROM.lat],
      zoom: 10,
    });
    m.addControl(new M.NavigationControl());
    m.on("load", () => {
      m.resize();
      setReady(true);
    });
    requestAnimationFrame(() => m.resize());
    const onResize = () => m.resize();
    window.addEventListener("resize", onResize);
    map.current = m;
    return () => {
      window.removeEventListener("resize", onResize);
      m.remove();
    };
  }, [M, style]);

  useEffect(() => {
    if (!ready || !map.current) return;
    if (pos) {
      map.current.easeTo({ center: [pos.lng, pos.lat], zoom: 12, duration: 900, essential: true });
    } else {
      map.current.easeTo({
        center: [DEMO_EVAC_FROM.lng, DEMO_EVAC_FROM.lat],
        zoom: 10,
        duration: 0,
        essential: true,
      });
    }
  }, [ready, pos]);

  return (
    <div className="flex w-full min-w-0 flex-1 min-h-0 flex-col h-[calc(100vh-48px)]">
      <div className="flex items-center justify-between p-2 border-b border-slate-800/80 text-sm">
        <p className="text-slate-200 font-medium">Evacuation — road route to inland rally</p>
        <Link to="/" className="text-sky-400 hover:underline">
          Back
        </Link>
      </div>
      <div className="flex-1 min-h-0 min-w-0 w-full" ref={cont} />
      {ready && map.current && <EvacuationRoute map={map.current} routeGeojson={route} />}
    </div>
  );
}
