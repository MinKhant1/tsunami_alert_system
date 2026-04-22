import { ALERT_COLORS } from "../../store/alertStore";

export default function AlertBanner({ level, text, onOpen }) {
  if (!level) return null;
  const c = ALERT_COLORS[level] || ALERT_COLORS.WATCH;
  return (
    <div
      className="w-full px-4 py-3 text-sm font-medium border-b flex items-center justify-between"
      style={{
        background: c.bg,
        borderColor: c.border,
        color: c.text,
        borderWidth: 1,
      }}
    >
      <span>{text || `Active ${level} — follow official instructions`}</span>
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="ml-2 px-2 py-1 rounded border text-xs"
          style={{ borderColor: c.border, color: c.text }}
        >
          Evacuation
        </button>
      )}
    </div>
  );
}
