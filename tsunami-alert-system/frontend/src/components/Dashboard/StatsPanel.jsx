export default function StatsPanel({ usersTargeted, coveragePct, activeCount }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
      <div className="rounded border border-slate-800/80 p-3">
        <p className="text-slate-500">Active alerts</p>
        <p className="text-2xl text-sky-300/90 font-semibold">{activeCount}</p>
      </div>
      <div className="rounded border border-slate-800/80 p-3">
        <p className="text-slate-500">Last sim — users in zone</p>
        <p className="text-2xl text-amber-300/90 font-semibold">{usersTargeted}</p>
      </div>
      <div className="rounded border border-slate-800/80 p-3">
        <p className="text-slate-500">Notional coverage</p>
        <p className="text-2xl text-emerald-300/90 font-semibold">{coveragePct ?? "—"}%</p>
      </div>
    </div>
  );
}
