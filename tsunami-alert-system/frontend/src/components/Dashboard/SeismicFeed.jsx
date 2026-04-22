import { useEffect, useState } from "react";
import { fetchRecentEvents } from "../../services/alertService";

export default function SeismicFeed() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let t;
    const go = () =>
      fetchRecentEvents()
        .then(setRows)
        .catch(() => {});
    go();
    t = setInterval(go, 45_000);
    return () => clearInterval(t);
  }, []);

  if (!rows.length) {
    return <p className="text-slate-500 text-sm">No events yet (or backend offline).</p>;
  }
  return (
    <ul className="text-xs max-h-48 overflow-auto space-y-1">
      {rows.slice(0, 8).map((e) => (
        <li key={e.id} className="border-b border-slate-800/60 py-0.5">
          <span className="text-sky-300/90">M{Number(e.magnitude || 0).toFixed(1)}</span> @{" "}
          {e.epicenter?.coordinates
            ? `${e.epicenter.coordinates[1].toFixed(1)}°,${e.epicenter.coordinates[0].toFixed(1)}°`
            : "—"}
        </li>
      ))}
    </ul>
  );
}
