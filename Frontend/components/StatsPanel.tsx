export default function StatsPanel({ stats }: { stats: any }) {
  if (!stats) return null;
  
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="p-4 rounded-2xl border">
        <div className="text-xs opacity-70">Matcher</div>
        <div className="text-2xl font-semibold">{stats.totalMatches ?? 0}</div>
      </div>
      <div className="p-4 rounded-2xl border">
        <div className="text-xs opacity-70">Gula kort (totalt)</div>
        <div className="text-2xl font-semibold">{stats.totalYellow ?? 0}</div>
        <div className="text-xs opacity-70 mt-1">Snitt/match: {stats.avgYellow ?? "-"}</div>
      </div>
      <div className="p-4 rounded-2xl border">
        <div className="text-xs opacity-70">Röda kort (totalt)</div>
        <div className="text-2xl font-semibold">{stats.totalRed ?? 0}</div>
        <div className="text-xs opacity-70 mt-1">Snitt/match: {stats.avgRed ?? "-"}</div>
      </div>
      <div className="p-4 rounded-2xl border">
        <div className="text-xs opacity-70">Straffar (totalt)</div>
        <div className="text-2xl font-semibold">{stats.totalPenalty ?? 0}</div>
        <div className="text-xs opacity-70 mt-1">Snitt/match: {stats.avgPenalty ?? "-"}</div>
      </div>
    </div>
  );
}