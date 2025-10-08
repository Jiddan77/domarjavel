import type { LeaderboardItem } from "@/hooks/useLeaderboard";
import { TrendingUp, TrendingDown } from "lucide-react";

const fmt = (n?: number, d=2) => (typeof n === "number" && isFinite(n)) ? n.toFixed(d) : "-";

export default function Leaderboard({ data }: { data?: LeaderboardItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <div className="text-sm">No referee data available</div>
      </div>
    );
  }
  
  // Sort data for different categories
  const byTotalCards = [...data].sort((a, b) => b.avgTotal - a.avgTotal);
  const nicest = [...data].sort((a, b) => a.avgTotal - b.avgTotal);
  
  return (
    <div className="space-y-6">
      {/* Strictest Referees */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Most Cards</h3>
        </div>
        <div className="space-y-3">
          {byTotalCards.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? "bg-yellow-500 text-white" : 
                i === 1 ? "bg-slate-400 text-white" : 
                "bg-orange-500 text-white"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                  {item.name}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {fmt(item.avgTotal)} cards/match • {item.matches} games
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lenient Referees */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-green-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Fewest Cards</h3>
        </div>
        <div className="space-y-3">
          {nicest.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                  {item.name}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {fmt(item.avgTotal)} cards/match • {item.matches} games
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
          Analyzing {data.length} referees
        </div>
      </div>
    </div>
  );
}
