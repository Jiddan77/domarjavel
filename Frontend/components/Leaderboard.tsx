import type { LeaderboardData } from "@/hooks/useLeaderboard";

const fmt = (n?: number, d=2) => (typeof n === "number" && isFinite(n)) ? n.toFixed(d).replace(".", ",") : "-";
const pct = (n?: number) => (typeof n === "number" && isFinite(n)) ? Math.round(n * 100) + " %" : "-";

function List({ title, rows, suffix, isPct=false }: { title: string; rows: any[]; suffix: string; isPct?: boolean }) {
  return (
    <div className="p-4 rounded-2xl border">
      <div className="font-semibold mb-2">{title}</div>
      <ol className="space-y-1 list-decimal list-inside">
        {rows.map((r, i) => (
          <li key={i}>
            <span className="font-medium">{r.name}</span>
            <span className="opacity-70 ml-2 text-sm">{isPct ? pct(r.valuePct) : fmt(r.value)} {suffix}</span>
          </li>
        ))}
        {rows.length === 0 && <div className="opacity-60 text-sm">—</div>}
      </ol>
    </div>
  );
}

export default function Leaderboard({ data }: { data?: LeaderboardData }) {
  if (!data) return null;
  const filtered = data.filtered_total !== data.overall_total;
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Statistik</h2>
        <div className="opacity-80">{filtered ? "Statistik för filtrerade matcher" : "Statistik för alla matcher"}</div>
        <div className="text-sm opacity-70">
          Totalt {(filtered ? data.filtered_total : data.overall_total).toLocaleString("sv-SE")} domar-matcher analyserade
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <List title="👨‍⚖️ Snällast domare" rows={data.nicest_refs} suffix="kort/match" />
        <List title="🔥 Elakast domare" rows={data.toughest_refs} suffix="kort/match" />
        <List title="⚖️ Flest straffar" rows={data.most_penalties} suffix="per match" />
        <List title="🎯 Gillar att vara i centrum" rows={data.most_interventions} suffix="ingripanden/match" />
        <List title="✅ Bäst för valda lag" rows={data.best_for_selected_teams} suffix="vinst" isPct />
        <List title="❌ Sämst för valda lag" rows={data.worst_for_selected_teams} suffix="förlust" isPct />
      </div>
    </section>
  );
}
