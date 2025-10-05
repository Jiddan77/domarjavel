import type { LeaderboardItem } from "@/hooks/useLeaderboard";

const fmt = (n?: number, d=2) => (typeof n === "number" && isFinite(n)) ? n.toFixed(d).replace(".", ",") : "-";

function List({ title, items, valueKey, suffix }: { 
  title: string; 
  items: LeaderboardItem[]; 
  valueKey: keyof LeaderboardItem; 
  suffix: string; 
}) {
  return (
    <div className="p-4 rounded-2xl border">
      <div className="font-semibold mb-2">{title}</div>
      <ol className="space-y-1 list-decimal list-inside">
        {items.slice(0, 5).map((item, i) => (
          <li key={i}>
            <span className="font-medium">{item.name}</span>
            <span className="opacity-70 ml-2 text-sm">
              {fmt(item[valueKey] as number)} {suffix}
              <span className="opacity-50 ml-1">({item.matches} matcher)</span>
            </span>
          </li>
        ))}
        {items.length === 0 && <div className="opacity-60 text-sm">—</div>}
      </ol>
    </div>
  );
}

export default function Leaderboard({ data }: { data?: LeaderboardItem[] }) {
  if (!data || data.length === 0) return null;
  
  // Sort data for different categories
  const byTotalCards = [...data].sort((a, b) => b.avgTotal - a.avgTotal);
  const byYellow = [...data].sort((a, b) => b.avgYellow - a.avgYellow);
  const byRed = [...data].sort((a, b) => b.avgRed - a.avgRed);
  const byPenalties = [...data].sort((a, b) => b.avgPenalty - a.avgPenalty);
  const nicest = [...data].sort((a, b) => a.avgTotal - b.avgTotal);
  
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Domarstatistik</h2>
        <div className="opacity-80">Rankning baserat på snitt per match</div>
        <div className="text-sm opacity-70">
          {data.length} domare analyserade
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <List title="👨‍⚖️ Snällast domare" items={nicest} valueKey="avgTotal" suffix="kort/match" />
        <List title="🔥 Strängast domare" items={byTotalCards} valueKey="avgTotal" suffix="kort/match" />
        <List title="🟨 Flest gula kort" items={byYellow} valueKey="avgYellow" suffix="per match" />
        <List title="🟥 Flest röda kort" items={byRed} valueKey="avgRed" suffix="per match" />
        <List title="⚽ Flest straffar" items={byPenalties} valueKey="avgPenalty" suffix="per match" />
      </div>
    </section>
  );
}
