import type { WeekTrendPoint } from "@/lib/stats";

/** Inline SVG sparkline of points per week — no chart lib, CSP-clean. */
export function SeasonTrend({ trend }: { trend: WeekTrendPoint[] }) {
  if (trend.length === 0) {
    return <p className="text-sm text-thg-slate-light">No games played yet.</p>;
  }

  const W = 280;
  const H = 64;
  const pad = 6;
  const max = Math.max(...trend.map((t) => t.points), 1);
  const n = trend.length;
  const x = (i: number) => (n === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1));
  const y = (v: number) => H - pad - (v / max) * (H - 2 * pad);

  const points = trend.map((t, i) => `${x(i)},${y(t.points)}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Points per week">
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-thg-slate)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {trend.map((t, i) => (
          <circle key={t.weekNumber} cx={x(i)} cy={y(t.points)} r={3} fill="var(--color-thg-yellow)" stroke="var(--color-thg-slate)" strokeWidth={1.5} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-thg-slate-light">
        {trend.map((t) => (
          <span key={t.weekNumber}>W{t.weekNumber}</span>
        ))}
      </div>
    </div>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return <span className="text-thg-slate-light">—</span>;
  const win = streak > 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold ${
        win ? "bg-thg-success/15 text-thg-success" : "bg-thg-danger/15 text-thg-danger"
      }`}
    >
      {win ? "W" : "L"}
      {Math.abs(streak)}
    </span>
  );
}
