import { ALERT_COLORS } from "../../store/alertStore";

export default function AlertCard({ alert }) {
  if (!alert) return null;
  const c = ALERT_COLORS[alert.level] || ALERT_COLORS.WATCH;
  return (
    <div
      className="p-3 rounded-md border"
      style={{ borderColor: c.border, color: c.text, background: c.bg }}
    >
      <p className="text-xs font-semibold uppercase">Level {alert.level}</p>
      {alert.eta_minutes != null && (
        <p className="text-sm">ETA: ~{Number(alert.eta_minutes).toFixed(0)} min</p>
      )}
      {alert.wave_height_m != null && (
        <p className="text-sm">Est. height: {Number(alert.wave_height_m).toFixed(1)} m</p>
      )}
    </div>
  );
}
