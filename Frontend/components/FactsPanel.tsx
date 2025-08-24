type Stats = {
  total_matches: number;
  goals?: { home: number; away: number; avg_per_match: number };
  cards?: { yellow_total: number; red_total: number; p_any_yellow?: number; p_any_red?: number };
  penalties?: { total: number; p_any_penalty?: number };
  outcomes?: {
    home_wins: number; draws: number; away_wins: number;
    team?: { name: string; wins: number; draws: number; losses: number; goals_for?: number; goals_against?: number };
  };
};

const pct = (x: number, tot: number) => !tot ? "0%" : `${Math.round((x / tot) * 100)}%`;
const fmt = (n?: number, d=2) => (typeof n === "number" && isFinite(n)) ? n.toFixed(d) : "-";

export default function FactsPanel({ stats }: { stats: Stats | null | undefined }) {
  if (!stats) return null;
  const t = stats.total_matches || 0;
  const team = stats.outcomes?.team;

  return (
    <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Resultat i filtret (H/O/B) */}
      <div className="p-4 rounded-2xl border space-y-2">
        <div className="text-xs opacity-70">Resultat i filtret</div>
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 rounded bg-white text-black dark:bg-white dark:text-black text-xs">H: {stats.outcomes?.home_wins ?? 0} ({pct(stats.outcomes?.home_wins ?? 0, t)})</span>
          <span className="px-2 py-1 rounded border text-xs">O: {stats.outcomes?.draws ?? 0} ({pct(stats.outcomes?.draws ?? 0, t)})</span>
          <span className="px-2 py-1 rounded border text-xs">B: {stats.outcomes?.away_wins ?? 0} ({pct(stats.outcomes?.away_wins ?? 0, t)})</span>
        </div>
      </div>

      {/* För valt lag (V/O/F + GF/GA) */}
      <div className="p-4 rounded-2xl border space-y-2">
        <div className="text-xs opacity-70">{team ? `För valt lag: ${team.name}` : "Välj exakt ett lag för lagresultat"}</div>
        {team ? (
          <div className="space-y-1">
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 rounded bg-white text-black dark:bg-white dark:text-black text-xs">V: {team.wins}</span>
              <span className="px-2 py-1 rounded border text-xs">O: {team.draws}</span>
              <span className="px-2 py-1 rounded border text-xs">F: {team.losses}</span>
            </div>
            <div className="text-xs opacity-80">Mål för: {team.goals_for ?? "-"} • Mål mot: {team.goals_against ?? "-"}</div>
          </div>
        ) : <div className="text-xs opacity-70">—</div>}
      </div>

      {/* Sannolikheter */}
      <div className="p-4 rounded-2xl border space-y-1">
        <div className="text-xs opacity-70">Sannolikheter (minst ett i matchen)</div>
        <div className="text-sm">Gult kort: {pct(Math.round((stats.cards?.p_any_yellow ?? 0) * t), t)}</div>
        <div className="text-sm">Rött kort: {pct(Math.round((stats.cards?.p_any_red ?? 0) * t), t)}</div>
        <div className="text-sm">Straff: {pct(Math.round((stats.penalties?.p_any_penalty ?? 0) * t), t)}</div>
      </div>

      {/* Snitt per match */}
      <div className="p-4 rounded-2xl border space-y-1">
        <div className="text-xs opacity-70">Snitt per match</div>
        <div className="text-sm">Mål (totalt): {fmt(stats.goals?.avg_per_match)}</div>
        <div className="text-sm">Gula: {fmt((stats.cards?.yellow_total ?? 0) / (t || 1))}</div>
        <div className="text-sm">Röda: {fmt((stats.cards?.red_total ?? 0) / (t || 1))}</div>
        <div className="text-sm">Straffar: {fmt((stats.penalties?.total ?? 0) / (t || 1))}</div>
      </div>
    </section>
  );
}
