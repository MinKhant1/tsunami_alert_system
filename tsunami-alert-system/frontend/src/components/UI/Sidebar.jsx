export default function Sidebar({ children, title = "Info", className = "" }) {
  return (
    <aside
      className={`w-72 shrink-0 h-full min-h-0 space-y-3 p-3 rounded-lg border border-slate-800/60 bg-slate-900/40 flex flex-col overflow-hidden ${className}`}
    >
      {title && <h2 className="text-sm font-medium text-slate-300/90 border-b border-slate-800/50 pb-1">
        {title}
      </h2>}
      {children}
    </aside>
  );
}
