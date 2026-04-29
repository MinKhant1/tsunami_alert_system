import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AlertMap from "../components/Map/AlertMap";
import AlertBanner from "../components/Alert/AlertBanner";
import AlertCard from "../components/Alert/AlertCard";
import AlertHistory from "../components/Alert/AlertHistory";
import Sidebar from "../components/UI/Sidebar";
import { useGeolocation } from "../hooks/useGeolocation";
import { useEvacuationRoute } from "../hooks/useEvacuationRoute";
import { useAlerts } from "../hooks/useAlerts";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useAlertStore } from "../store/alertStore";
import { fetchAlertById } from "../services/alertService";
import { pointInGeoJSONGeometry } from "../lib/pointInGeoJSON";

export default function Home() {
  const activeAlerts = useAlerts();
  const { pos, error, consent, userIdRef } = useGeolocation();
  const { requestAndRegister, status: pushStatus } = usePushNotifications({ pos });
  const { lastPush } = useAlertStore();
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    if (activeAlerts?.length) {
      setHistory((h) => {
        const id = activeAlerts[0].id;
        if (h.find((x) => x.id === id)) return h;
        return [activeAlerts[0], ...h].slice(0, 10);
      });
    }
  }, [activeAlerts]);

  const hasLiveAlert =
    Array.isArray(activeAlerts) && activeAlerts.some((a) => a && a.is_active !== false);

  // Only draw the evacuation route when the tsunami impact zone includes the user's current position.
  // If we can't compute impact zones (missing polygons), fall back to the legacy behavior.
  const isAffected = useMemo(() => {
    if (!pos) return false;
    const alertsWithZones = Array.isArray(activeAlerts) ? activeAlerts.filter((a) => a?.impact_zone_geojson) : [];
    if (alertsWithZones.length === 0) return true;
    return alertsWithZones.some((a) => pointInGeoJSONGeometry([pos.lng, pos.lat], a.impact_zone_geojson));
  }, [pos, activeAlerts]);

  const route = useEvacuationRoute(pos, Boolean(pos && hasLiveAlert && isAffected));

  const banner = useMemo(() => {
    const top = activeAlerts?.[0];
    if (top) {
      return {
        level: top.level,
        text: `${top.level} — ETA ~${Number(top.eta_minutes || 0).toFixed(0)} min, wave est. ${
          top.wave_height_m != null ? Number(top.wave_height_m).toFixed(1) : "?"
        } m`,
      };
    }
    if (lastPush?.data?.level) {
      return { level: lastPush.data.level, text: lastPush.data.body || "Push alert" };
    }
    return null;
  }, [activeAlerts, lastPush]);

  return (
    <div className="flex h-full min-h-0">
      <div className="relative flex-1 min-w-0 min-h-0 p-2">
        {/* Full-height map (overlays render on top so they don't steal vertical space) */}
        <div className="absolute inset-0">
          <AlertMap
            pos={pos}
            activeAlerts={activeAlerts}
            impactGeojson={null}
            routeGeojson={selected ? null : route}
          />
        </div>

        {/* Top overlays */}
        <div className="absolute top-2 left-2 right-2 z-10 space-y-2">
          {banner && (
            <AlertBanner level={banner.level} text={banner.text} onOpen={() => nav("/evac")} />
          )}
          {error && <p className="text-amber-400/80 text-sm">{error}</p>}
        </div>

        {/* Bottom overlays */}
        <div className="absolute bottom-2 left-2 right-2 z-10 space-y-2">
          {consent === "denied" && (
            <p className="text-xs text-slate-500 pointer-events-auto">
              Location was denied. Enable location in the browser to appear on the map and receive targeted
              information.
            </p>
          )}

          <div className="flex gap-2 items-center text-xs text-slate-500 pointer-events-auto">
            <span>User id: {userIdRef.current || "—"}</span>
            <span>FCM: {pushStatus}</span>
            <button
              type="button"
              onClick={requestAndRegister}
              className="px-2 py-1 border border-slate-700 rounded text-slate-300"
            >
              Enable push
            </button>
          </div>
        </div>
      </div>

      <Sidebar title="Active alert">
        <div className="flex flex-col h-full min-h-0 space-y-3">
          <div className="shrink-0">
            {activeAlerts[0] ? (
              <AlertCard alert={activeAlerts[0]} />
            ) : (
              <p className="text-slate-500">None</p>
            )}
          </div>
          <h3 className="text-xs text-slate-500 shrink-0">Session history</h3>
          <div className="flex-1 min-h-0 overflow-auto pr-1">
            <AlertHistory
              alerts={history}
              onSelect={async (a) => {
                setSelected(a);
                const d = await fetchAlertById(a.id);
                /* prefer fresh geometry */
                console.log(d);
              }}
            />
          </div>
        </div>
      </Sidebar>
    </div>
  );
}
