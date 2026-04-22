import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState, useMemo } from "react";

const DEMO = "demo";

export default function TideGauge() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const t = new Date();
    setData(
      Array.from({ length: 12 }, (_, i) => ({
        t: `${(t.getTime() - (11 - i) * 3_000_000) / 1_000_000}`,
        m: 0.5 + Math.sin(i / 2) * 0.4 + (Math.random() * 0.05 - 0.02),
        station: DEMO,
      }))
    );
  }, []);

  const d = useMemo(
    () =>
      (data || []).map((p, i) => ({
        ...p,
        label: `T+${i * 5}m`,
      })),
    [data]
  );

  return (
    <div className="h-48 w-full">
      <p className="text-xs text-slate-500 mb-1">Tide (demo) — connect IOC/NOAA in backend</p>
      <ResponsiveContainer>
        <LineChart data={d} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" fontSize={10} stroke="#64748b" />
          <YAxis
            dataKey="m"
            width={32}
            fontSize={10}
            stroke="#64748b"
            label={{ value: "m", angle: -90, position: "insideLeft", fontSize: 9 }}
          />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
          <Line type="monotone" dataKey="m" stroke="#38bdf8" dot={false} strokeWidth={1.4} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
