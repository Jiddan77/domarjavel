type Stats = {
  totalMatches: number;
  totalYellow: number;
  totalRed: number;
  totalPenalty: number;
  avgYellow: number;
  avgRed: number;
  avgPenalty: number;
};

const fmt = (n?: number, d=2) => (typeof n === "number" && isFinite(n)) ? n.toFixed(d) : "-";

export default function FactsPanel({ stats }: { stats: Stats | null | undefined }) {
  if (!stats) return null;
  
  // Component renders stats directly without probability calculations

  return (
    <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Totaler */}
      <div className="p-4 rounded-2xl border space-y-2">
        <div className="text-xs opacity-70">Totaler i filtret</div>
        <div className="space-y-1">
          <div className="text-sm">Gula kort: {stats.totalYellow}</div>
          <div className="text-sm">Röda kort: {stats.totalRed}</div>
          <div className="text-sm">Straffar: {stats.totalPenalty}</div>
        </div>
      </div>

      {/* Snitt per match */}
      <div className="p-4 rounded-2xl border space-y-1">
        <div className="text-xs opacity-70">Snitt per match</div>
        <div className="text-sm">Gula kort: {fmt(stats.avgYellow)}</div>
        <div className="text-sm">Röda kort: {fmt(stats.avgRed)}</div>
        <div className="text-sm">Straffar: {fmt(stats.avgPenalty)}</div>
      </div>

      {/* Aktivitet */}
      <div className="p-4 rounded-2xl border space-y-1">
        <div className="text-xs opacity-70">Aktivitetsnivå</div>
        <div className="text-sm">
          {stats.avgYellow > 4 ? "Hög kortaktivitet" : 
           stats.avgYellow > 2.5 ? "Medel kortaktivitet" : 
           "Låg kortaktivitet"}
        </div>
        <div className="text-xs opacity-70">
          {stats.avgRed > 0.2 ? "Många röda kort" :
           stats.avgRed > 0.05 ? "Normalt antal röda" :
           "Få röda kort"}
        </div>
      </div>
    </section>
  );
}
