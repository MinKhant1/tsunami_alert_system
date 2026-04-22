export default function AlertHistory({ alerts, onSelect }) {
  if (!alerts.length) {
    return <p className="text-slate-500 text-sm">No prior alerts in this session.</p>;
  }
  return (
    <ul className="space-y-1 text-sm">
      {alerts.map((a) => (
        <li key={a.id}>
          <button
            type="button"
            onClick={() => onSelect && onSelect(a)}
            className="w-full text-left p-1 rounded hover:bg-slate-800/80"
          >
            <span className="text-amber-300/90 font-medium">{a.level}</span>{" "}
            <span className="text-slate-500">
              {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
