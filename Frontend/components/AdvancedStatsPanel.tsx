import { useState } from "react";
import { Home, Plane, Trophy, Users, TrendingUp, TrendingDown, Target, Award } from "lucide-react";
import type { AdvancedStatsResponse, AdvancedRefereeStats } from "@/hooks/useAdvancedStats";

const fmt = (n?: number, d = 2) => (typeof n === "number" && isFinite(n)) ? n.toFixed(d) : "-";
const pct = (n?: number) => (typeof n === "number" && isFinite(n)) ? `${(n * 100).toFixed(1)}%` : "-";

function HomeBiasCard({ referees }: { referees: AdvancedRefereeStats[] }) {
  const homeFavorable = [...referees]
    .filter(r => r.home_bias_score > 0.55)
    .sort((a, b) => b.home_bias_score - a.home_bias_score)
    .slice(0, 3);

  const awayFavorable = [...referees]
    .filter(r => r.home_bias_score < 0.45)
    .sort((a, b) => a.home_bias_score - b.home_bias_score)
    .slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Home className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Home/Away Bias Analysis</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Home Favorable */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-4 h-4 text-green-600" />
            <h4 className="font-semibold text-green-700 dark:text-green-300">Most Home-Favorable</h4>
          </div>
          <div className="space-y-3">
            {homeFavorable.map((ref, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{ref.name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Home wins: {pct(ref.home_win_rate)} • {ref.matches} games
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">
                    {fmt(ref.home_bias_score, 3)}
                  </div>
                  <div className="text-xs text-slate-500">bias score</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Away Favorable */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Plane className="w-4 h-4 text-blue-600" />
            <h4 className="font-semibold text-blue-700 dark:text-blue-300">Most Away-Favorable</h4>
          </div>
          <div className="space-y-3">
            {awayFavorable.map((ref, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{ref.name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Away wins: {pct(ref.away_win_rate)} • {ref.matches} games
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-600">
                    {fmt(ref.home_bias_score, 3)}
                  </div>
                  <div className="text-xs text-slate-500">bias score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamSpecificStats({ referees, selectedTeam }: { referees: AdvancedRefereeStats[]; selectedTeam?: string }) {
  if (!selectedTeam) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Team-Specific Performance</h3>
        </div>
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a team in the filters to see referee performance for that specific team</p>
        </div>
      </div>
    );
  }

  const teamStats = referees
    .map(ref => ({
      ...ref,
      teamPerf: ref.team_performance[selectedTeam]
    }))
    .filter(ref => ref.teamPerf && ref.teamPerf.matches >= 3)
    .sort((a, b) => b.teamPerf.win_rate - a.teamPerf.win_rate);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Best Referees for {selectedTeam}
        </h3>
      </div>

      <div className="space-y-3">
        {teamStats.slice(0, 5).map((ref, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i === 0 ? "bg-yellow-500 text-white" : 
                i === 1 ? "bg-slate-400 text-white" : 
                i === 2 ? "bg-orange-500 text-white" :
                "bg-slate-300 text-slate-700"
              }`}>
                {i + 1}
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{ref.name}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {ref.teamPerf.matches} matches with {selectedTeam}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-purple-600">
                {pct(ref.teamPerf.win_rate)}
              </div>
              <div className="text-xs text-slate-500">win rate</div>
              <div className="text-xs text-slate-500">
                {fmt(ref.teamPerf.avg_cards)} cards/game
              </div>
            </div>
          </div>
        ))}
        {teamStats.length === 0 && (
          <div className="text-center py-4 text-slate-500 dark:text-slate-400">
            No sufficient data for {selectedTeam} (need 3+ matches per referee)
          </div>
        )}
      </div>
    </div>
  );
}

function WinRateAnalysis({ referees }: { referees: AdvancedRefereeStats[] }) {
  const highDrawRate = [...referees]
    .sort((a, b) => b.draw_rate - a.draw_rate)
    .slice(0, 3);

  const lowDrawRate = [...referees]
    .sort((a, b) => a.draw_rate - b.draw_rate)
    .slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Match Outcome Patterns</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-yellow-600" />
            <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">Most Draws</h4>
          </div>
          <div className="space-y-3">
            {highDrawRate.map((ref, i) => (
              <div key={i} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{ref.name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Draws: {pct(ref.draw_rate)} • Wins: {pct(ref.home_win_rate)} H / {pct(ref.away_win_rate)} A
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <h4 className="font-semibold text-red-700 dark:text-red-300">Fewest Draws</h4>
          </div>
          <div className="space-y-3">
            {lowDrawRate.map((ref, i) => (
              <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{ref.name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Draws: {pct(ref.draw_rate)} • Wins: {pct(ref.home_win_rate)} H / {pct(ref.away_win_rate)} A
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdvancedStatsPanel({ data, selectedTeam }: { 
  data?: AdvancedStatsResponse; 
  selectedTeam?: string;
}) {
  const [activeTab, setActiveTab] = useState<"bias" | "teams" | "outcomes">("bias");

  if (!data || !data.referees.length) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No advanced statistics available for the current filters</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "bias" as const, label: "Home/Away Bias", icon: Home },
    { id: "teams" as const, label: "Team Performance", icon: Users },
    { id: "outcomes" as const, label: "Match Outcomes", icon: Trophy }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Advanced Analytics Summary</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{data.summary.total_referees}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Referees Analyzed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.summary.total_matches}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Matches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{pct(data.summary.avg_home_win_rate)}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Avg Home Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{pct(data.summary.avg_away_win_rate)}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Avg Away Win Rate</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "bias" && <HomeBiasCard referees={data.referees} />}
      {activeTab === "teams" && <TeamSpecificStats referees={data.referees} selectedTeam={selectedTeam} />}
      {activeTab === "outcomes" && <WinRateAnalysis referees={data.referees} />}
    </div>
  );
}