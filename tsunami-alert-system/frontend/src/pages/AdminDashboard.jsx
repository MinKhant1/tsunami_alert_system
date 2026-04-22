import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { postSimulateEvent, fetchActiveAlerts, deleteActiveAlert } from "../services/alertService";
import StatsPanel from "../components/Dashboard/StatsPanel";
import SeismicFeed from "../components/Dashboard/SeismicFeed";
import TideGauge from "../components/Dashboard/TideGauge";

function simErrorShape(err) {
  if (!axios.isAxiosError(err)) {
    return { message: err?.message || "Request failed" };
  }
  const status = err.response?.status;
  const data = err.response?.data;
  const detail = typeof data === "string" ? data : data?.detail ?? data;
  return {
    message: err.message,
    ...(status != null ? { status } : {}),
    ...(detail != null
      ? { detail: typeof detail === "string" ? detail : JSON.stringify(detail, null, 2) }
      : {}),
  };
}

export default function AdminDashboard() {
  const [magnitude, setMag] = useState(7.5);
  const [depth, setDepth] = useState(25);
  const [lat, setLat] = useState(8.0);
  const [lng, setLng] = useState(95.0);
  const [force, setForce] = useState(true);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actives, setActives] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [alertsError, setAlertsError] = useState(null);

  const loadAlerts = useCallback(() => {
    setAlertsError(null);
    fetchActiveAlerts()
      .then((a) => {
        setActives(a);
      })
      .catch((e) => {
        setActives([]);
        setAlertsError(simErrorShape(e));
      });
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts, res]);

  const run = async () => {
    setLoading(true);
    setRes(null);
    try {
      const out = await postSimulateEvent({
        magnitude: magnitude,
        depth_km: depth,
        lat,
        lng,
        force_trigger: force,
        near_subduction_zone: true,
      });
      setRes(out);
    } catch (e) {
      setRes(simErrorShape(e));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!id || deleting) return;
    if (!window.confirm("Deactivate this alert? It will disappear from the home map and active list.")) return;
    setDeleting(String(id));
    setAlertsError(null);
    try {
      await deleteActiveAlert(id);
      if (expanded === id) setExpanded(null);
      await loadAlerts();
    } catch (e) {
      setAlertsError(simErrorShape(e));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl w-full min-w-0">
      <h1 className="text-lg font-semibold text-slate-100">Admin — simulation & feeds</h1>
      <StatsPanel
        activeCount={actives.length}
        usersTargeted={res?.users_targeted}
        coveragePct={res != null && res?.users_targeted != null ? Math.min(100, (res.users_targeted || 0) * 5) : null}
      />
      <div className="rounded border border-slate-800/70 p-3 space-y-2 text-sm">
        <h2 className="text-slate-300 font-medium">Active alerts</h2>
        {alertsError && (
          <pre className="text-xs text-amber-300/90 whitespace-pre-wrap break-words">
            {JSON.stringify(alertsError, null, 2)}
          </pre>
        )}
        {actives.length === 0 && !alertsError && (
          <p className="text-slate-500 text-sm">No active alerts.</p>
        )}
        {actives.length > 0 && (
          <ul className="space-y-2 text-slate-200 text-xs">
            {actives.map((a) => (
              <li key={a.id} className="rounded border border-slate-800/60 p-2 bg-slate-900/40">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-slate-300">{a.level}</span>{" "}
                    <span className="text-slate-500">id {a.id}</span>
                    {a.eta_minutes != null && (
                      <span className="text-slate-500 ml-2">ETA {Number(a.eta_minutes).toFixed(0)} min</span>
                    )}
                    {a.created_at && <span className="text-slate-500 block">{String(a.created_at)}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-xs"
                      onClick={() => setExpanded((e) => (e === a.id ? null : a.id))}
                    >
                      {expanded === a.id ? "Hide" : "View JSON"}
                    </button>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded bg-red-900/70 text-red-100 text-xs disabled:opacity-50"
                      disabled={deleting === String(a.id)}
                      onClick={() => onDelete(a.id)}
                    >
                      {deleting === String(a.id) ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
                {expanded === a.id && (
                  <pre className="mt-2 p-2 rounded bg-slate-950/80 text-[11px] text-slate-300 overflow-x-auto max-h-64">
                    {JSON.stringify(a, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded border border-slate-800/70 p-3 space-y-3 text-sm">
          <p className="text-slate-400">Simulate tsunami-sourcing quake (POST /admin/simulate-event)</p>
          <label className="block">
            <span className="text-slate-500">Magnitude</span>
            <input
              className="w-full bg-slate-900/80 border border-slate-700 rounded px-2"
              type="range"
              min="5"
              max="9.5"
              step="0.1"
              value={magnitude}
              onChange={(e) => setMag(Number(e.target.value))}
            />
            <span className="ml-1">{magnitude.toFixed(1)}</span>
          </label>
          <label className="block">
            <span className="text-slate-500">Depth (km)</span>
            <input
              className="w-full"
              type="range"
              min="5"
              max="400"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
            />
            <span className="ml-1">{depth}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label>
              Lat
              <input
                className="w-full bg-slate-900/80 border border-slate-700 rounded px-2"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                type="number"
                step="0.01"
              />
            </label>
            <label>
              Lng
              <input
                className="w-full bg-slate-900/80 border border-slate-700 rounded px-2"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                type="number"
                step="0.01"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-slate-400 text-xs">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
            />
            force_trigger (demo: bypasses strict DART gate)
          </label>
          <button
            type="button"
            onClick={run}
            className="px-3 py-1.5 rounded bg-amber-600/90 text-slate-900 font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Running…" : "Simulate Tsunami Event"}
          </button>
        </div>
        <div className="space-y-3 text-sm text-slate-200">
          <TideGauge />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded border border-slate-800/60 p-3 text-xs text-slate-200">
          <h3 className="text-slate-400 text-sm mb-1">Sim response</h3>
          {res ? <pre className="whitespace-pre-wrap break-words">{JSON.stringify(res, null, 2)}</pre> : "—"}
        </div>
        <div>
          <h3 className="text-slate-400 text-sm mb-1">Recent quakes (API)</h3>
          <SeismicFeed />
        </div>
      </div>
    </div>
  );
}
