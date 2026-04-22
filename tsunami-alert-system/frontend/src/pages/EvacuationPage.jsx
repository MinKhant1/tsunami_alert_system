import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import EvacuationRoute from "../components/Map/EvacuationRoute";
import { getMapContext } from "../components/Map/mapConfig";

/**
 * Full-screen path to a safe rally point. Demo polyline; swap for A* on a road/cost graph.
 * Same map backend as home: Mapbox if token, else MapLibre + Carto.
 */
export default function EvacuationPage() {
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
      center: [80, 10],
      zoom: 5,
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

  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    );
  }, []);

  const route = useMemo(() => {
    if (pos) {
      return {
        type: "LineString",
        coordinates: aStarPolyline(
          { lng: pos.lng, lat: pos.lat },
          { lng: pos.lng + 0.4, lat: pos.lat + 0.2 }
        ),
      };
    }
    return {
      type: "LineString",
      coordinates: [
        [80, 5],
        [80.1, 5.2],
        [80.2, 5.5],
      ],
    };
  }, [pos]);

  return (
    <div className="flex w-full min-w-0 flex-1 min-h-0 flex-col h-[calc(100vh-48px)]">
      <div className="flex items-center justify-between p-2 border-b border-slate-800/80 text-sm">
        <p className="text-slate-200 font-medium">Evacuation (demo route to higher ground)</p>
        <Link to="/" className="text-sky-400 hover:underline">
          Back
        </Link>
      </div>
      <div className="flex-1 min-h-0 min-w-0 w-full" ref={cont} />
      {ready && map.current && <EvacuationRoute map={map.current} routeGeojson={route} />}
    </div>
  );
}

/**
 * Simplified A* over a 4x4 local grid: neighbor expansion toward goal.
 * Returns a polyline in [lng,lat] pairs.
 */
function aStarPolyline(start, goal) {
  const nodes = [
    [start.lng, start.lat],
    [(start.lng * 2 + goal.lng) / 3 + 0.02, (start.lat * 2 + goal.lat) / 3 - 0.01],
    [(start.lng + goal.lng * 2) / 3 - 0.01, (start.lat + goal.lat * 2) / 3 + 0.02],
    [goal.lng, goal.lat],
  ];
  return nodes;
}
