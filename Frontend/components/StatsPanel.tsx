export default function StatsPanel({ stats }: { stats: any }) {
  if (!stats) return null;
  const { total_matches, goals, cards, penalties } = stats;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="p-4 rounded-2xl border">
        <div className="text-xs opacity-70">Matcher</div>
        <div className="text-2xl font-semibold">{total_matches}</div>
      </div>
      <div className="p-4 rounded-2xl border">
        <div className="text-xs opacity-70">Mål (totalt)</div>
        <div className="text-2xl font-semibold">{(goals?.home ?? 0) + (goals?.away ?? 0)}</div>
        <div className="text-xs opacity-70 mt-1">Snitt/match: {goals?.avg_per_match?.toFixed?.(2) ?? "-"}</div>
      </div>
      <div className="p-4 rounded-2xl border">
        <div className="text-xs opacity-70">Gula kort (totalt)</div>
        <div className="text-2xl font-semibold">{cards?.yellow_total ?? 0}</div>
      </div>
      <div className="p-4 rounded-2xl border">
        <div className="text-xs opacity-70">Straffar (totalt)</div>
        <div className="text-2xl font-semibold">{penalties?.total ?? 0}</div>
      </div>
    </div>
  );
}