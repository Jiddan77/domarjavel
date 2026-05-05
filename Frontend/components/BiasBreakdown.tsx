import type { CompareReferee } from "@/hooks/useCompare";

const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#f59e0b"];

function biasColor(score: number): string {
  if (score >= 7) return "#ef4444";
  if (score >= 4) return "#f59e0b";
  return "#22c55e";
}

function BarRow({
  label,
  value,
  score,
}: {
  label: string;
  value: string;
  score: number;
}) {
  const color = biasColor(score);
  const width = `${(score / 10) * 100}%`;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className="bg-slate-900 rounded h-1.5">
        <div
          className="h-1.5 rounded transition-all"
          style={{ background: color, width }}
        />
      </div>
    </div>
  );
}

interface Props {
  referees: CompareReferee[];
}

export default function BiasBreakdown({ referees }: Props) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="text-xs font-semibold text-slate-500 tracking-widest mb-3 uppercase">
        Bias Breakdown
      </div>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${referees.length}, 1fr)` }}
      >
        {referees.map((ref, i) => {
          const color = COLORS[i] ?? "#94a3b8";
          const { bias } = ref;
          const compositeColor = biasColor(bias.composite_score);
          return (
            <div key={ref.name}>
              <div
                className="text-sm font-semibold mb-3"
                style={{ color }}
              >
                {ref.name
                  .toLowerCase()
                  .replace(/\b\w/g, c => c.toUpperCase())}
              </div>

              <BarRow
                label="Card rate"
                value={`${bias.card_rate_score.toFixed(1)} / 10`}
                score={bias.card_rate_score}
              />
              <BarRow
                label="Home/away gap"
                value={`${ref.home_card_advantage >= 0 ? "+" : ""}${ref.home_card_advantage.toFixed(2)} cards`}
                score={bias.home_away_score}
              />
              <BarRow
                label="Team patterns"
                value={
                  bias.flagged_teams.length > 0
                    ? bias.flagged_teams.slice(0, 2).join(", ")
                    : "None flagged"
                }
                score={bias.team_favoritism_score}
              />

              <div
                className="mt-3 inline-block text-xs font-semibold px-2 py-1 rounded"
                style={{
                  background: `${compositeColor}15`,
                  border: `1px solid ${compositeColor}30`,
                  color: compositeColor,
                }}
              >
                Bias score: {bias.composite_score} / 10
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
