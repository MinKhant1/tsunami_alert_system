import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AlertMap from "../components/Map/AlertMap";
import AlertBanner from "../components/Alert/AlertBanner";
import AlertCard from "../components/Alert/AlertCard";
import AlertHistory from "../components/Alert/AlertHistory";
import Sidebar from "../components/UI/Sidebar";
import { useGeolocation } from "../hooks/useGeolocation";
import { useAlerts } from "../hooks/useAlerts";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useAlertStore } from "../store/alertStore";
import { fetchAlertById } from "../services/alertService";

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

  const route = useMemo(() => {
    if (!pos || !hasLiveAlert) return null;
    return buildHeuristicRoute(pos, { lat: pos.lat + 0.1, lng: pos.lng + 0.05 });
  }, [pos, hasLiveAlert]);

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
    <div className="flex flex-1 min-h-0 h-[calc(100vh-48px)]">
      <div className="flex-1 min-w-0 min-h-0 flex flex-col p-2 gap-2">
        {banner && (
          <AlertBanner
            level={banner.level}
            text={banner.text}
            onOpen={() => nav("/evac")}
          />
        )}
        {error && <p className="text-amber-400/80 text-sm">{error}</p>}
        <div className="flex-1 min-h-0 w-full">
          <AlertMap
            pos={pos}
            activeAlerts={activeAlerts}
            impactGeojson={null}
            routeGeojson={selected ? null : route}
          />
        </div>
        {consent === "denied" && (
          <p className="text-xs text-slate-500">
            Location was denied. Enable location in the browser to appear on the map and receive
            targeted information.
          </p>
        )}
        <div className="flex gap-2 items-center text-xs text-slate-500">
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
      <Sidebar title="Active alert">
        {activeAlerts[0] ? <AlertCard alert={activeAlerts[0]} /> : <p className="text-slate-500">None</p>}
        <h3 className="text-xs text-slate-500 pt-2">Session history</h3>
        <AlertHistory
          alerts={history}
          onSelect={async (a) => {
            setSelected(a);
            const d = await fetchAlertById(a.id);
            /* prefer fresh geometry */
            console.log(d);
          }}
        />
      </Sidebar>
    </div>
  );
}

/**
 * Simplified A*: straight-line to safe point; expand to grid graph in production.
 */
function buildHeuristicRoute(a, b) {
  return {
    type: "LineString",
    coordinates: [
      [a.lng, a.lat],
      [(a.lng + b.lng) / 2, (a.lat + b.lat) / 2 + 0.01],
      [b.lng, b.lat],
    ],
  };
}
