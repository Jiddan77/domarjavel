import type { CompareReferee, LeagueAvg } from "@/hooks/useCompare";

const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#f59e0b"];
const AVG_COLOR = "#475569";

function fmt(n: number, decimals = 2): string {
  return isFinite(n) ? n.toFixed(decimals) : "-";
}

interface Props {
  referees: CompareReferee[];
  leagueAvg: LeagueAvg;
}

export default function CompareStatsTable({ referees, leagueAvg }: Props) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-4">
      <div className="text-xs font-semibold text-slate-500 tracking-widest mb-3 uppercase">
        Stats Comparison
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-xs text-slate-500">
              <th className="text-left py-1 px-3 w-2/5">Metric</th>
              {referees.map((ref, i) => (
                <th key={ref.name} className="text-right py-1 px-3" style={{ color: COLORS[i] }}>
                  {ref.name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </th>
              ))}
              <th className="text-right py-1 px-3" style={{ color: AVG_COLOR }}>
                League avg
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Matches row — no league average */}
            <tr className="border-t border-slate-700 text-slate-100">
              <td className="py-2 px-3 text-sm text-slate-400">Matches</td>
              {referees.map((ref, i) => (
                <td key={i} className="py-2 px-3 text-right text-sm font-semibold" style={{ color: COLORS[i] }}>
                  {ref.matches}
                </td>
              ))}
              <td className="py-2 px-3 text-right text-sm" style={{ color: AVG_COLOR }}>—</td>
            </tr>

            {/* Cards / game — lower is better (highlight lowest) */}
            <tr className="border-t border-slate-700 text-slate-100">
              <td className="py-2 px-3 text-sm text-slate-400">Cards / game</td>
              {referees.map((ref, i) => {
                const values = referees.map(r => r.cards_per_game);
                const best = Math.min(...values);
                const isBest = ref.cards_per_game === best && values.filter(v => v === best).length < values.length;
                return (
                  <td key={i} className="py-2 px-3 text-right text-sm font-semibold" style={{ color: COLORS[i] }}>
                    {isBest
                      ? <span className="underline decoration-dotted">{fmt(ref.cards_per_game)}</span>
                      : fmt(ref.cards_per_game)}
                  </td>
                );
              })}
              <td className="py-2 px-3 text-right text-sm" style={{ color: AVG_COLOR }}>
                {fmt(leagueAvg.cards_per_game)}
              </td>
            </tr>

            {/* Penalties / game — lower is better */}
            <tr className="border-t border-slate-700 text-slate-100">
              <td className="py-2 px-3 text-sm text-slate-400">Penalties / game</td>
              {referees.map((ref, i) => {
                const values = referees.map(r => r.penalties_per_game);
                const best = Math.min(...values);
                const isBest = ref.penalties_per_game === best && values.filter(v => v === best).length < values.length;
                return (
                  <td key={i} className="py-2 px-3 text-right text-sm font-semibold" style={{ color: COLORS[i] }}>
                    {isBest
                      ? <span className="underline decoration-dotted">{fmt(ref.penalties_per_game)}</span>
                      : fmt(ref.penalties_per_game)}
                  </td>
                );
              })}
              <td className="py-2 px-3 text-right text-sm" style={{ color: AVG_COLOR }}>
                {fmt(leagueAvg.penalties_per_game)}
              </td>
            </tr>

            {/* Home card advantage — lower absolute value is better */}
            <tr className="border-t border-slate-700 text-slate-100">
              <td className="py-2 px-3 text-sm text-slate-400">Home card advantage</td>
              {referees.map((ref, i) => {
                const values = referees.map(r => Math.abs(r.home_card_advantage));
                const best = Math.min(...values);
                const isBest = Math.abs(ref.home_card_advantage) === best && values.filter(v => v === best).length < values.length;
                const prefix = ref.home_card_advantage >= 0 ? "+" : "";
                return (
                  <td key={i} className="py-2 px-3 text-right text-sm font-semibold" style={{ color: COLORS[i] }}>
                    {isBest
                      ? <span className="underline decoration-dotted">{prefix}{fmt(ref.home_card_advantage)}</span>
                      : `${prefix}${fmt(ref.home_card_advantage)}`}
                  </td>
                );
              })}
              <td className="py-2 px-3 text-right text-sm" style={{ color: AVG_COLOR }}>
                {leagueAvg.home_card_advantage >= 0 ? "+" : ""}{fmt(leagueAvg.home_card_advantage)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
