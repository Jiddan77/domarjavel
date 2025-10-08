import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Users, Trophy, AlertTriangle } from "lucide-react";

type TeamStats = {
  teamName: string;
  totalMatches: number;
  homeMatches: number;
  awayMatches: number;
  wins: number;
  draws: number;
  losses: number;
  homeWins: number;
  awayWins: number;
  goalsFor: number;
  goalsAgainst: number;
  yellowCards: number;
  redCards: number;
  penalties: number;
  penaltiesAgainst: number;
  avgYellowPerMatch: number;
  avgRedPerMatch: number;
  winRate: number;
  homeWinRate: number;
  awayWinRate: number;
};

const fmt = (n?: number, d = 2) => (typeof n === "number" && isFinite(n)) ? n.toFixed(d) : "-";
const pct = (n?: number) => (typeof n === "number" && isFinite(n)) ? `${(n * 100).toFixed(1)}%` : "-";

function calculateTeamStats(matches: any[], teamName: string): TeamStats {
  const teamMatches = matches.filter(m => m.home === teamName || m.away === teamName);
  
  let stats: TeamStats = {
    teamName,
    totalMatches: teamMatches.length,
    homeMatches: 0,
    awayMatches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    homeWins: 0,
    awayWins: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    yellowCards: 0,
    redCards: 0,
    penalties: 0,
    penaltiesAgainst: 0,
    avgYellowPerMatch: 0,
    avgRedPerMatch: 0,
    winRate: 0,
    homeWinRate: 0,
    awayWinRate: 0
  };

  teamMatches.forEach(match => {
    const isHome = match.home === teamName;
    const isAway = match.away === teamName;
    
    if (isHome) stats.homeMatches++;
    if (isAway) stats.awayMatches++;

    // Parse score
    const scoreStr = match.score || "0-0";
    const scoreParts = scoreStr.split(/[–-]/);
    if (scoreParts.length === 2) {
      const homeScore = parseInt(scoreParts[0]) || 0;
      const awayScore = parseInt(scoreParts[1]) || 0;
      
      if (isHome) {
        stats.goalsFor += homeScore;
        stats.goalsAgainst += awayScore;
        if (homeScore > awayScore) {
          stats.wins++;
          stats.homeWins++;
        } else if (homeScore === awayScore) {
          stats.draws++;
        } else {
          stats.losses++;
        }
      } else if (isAway) {
        stats.goalsFor += awayScore;
        stats.goalsAgainst += homeScore;
        if (awayScore > homeScore) {
          stats.wins++;
          stats.awayWins++;
        } else if (awayScore === homeScore) {
          stats.draws++;
        } else {
          stats.losses++;
        }
      }
    }

    // Parse cards
    const parseCardString = (cardStr: string, isHome: boolean) => {
      const parts = cardStr.split(/[–-]/);
      if (parts.length === 2) {
        return parseInt(parts[isHome ? 0 : 1]) || 0;
      }
      return 0;
    };

    const yellowStr = match.yellow || "0-0";
    const redStr = match.red || "0-0";
    const penaltyStr = match.penalty || "0-0";

    stats.yellowCards += parseCardString(yellowStr, isHome);
    stats.redCards += parseCardString(redStr, isHome);
    stats.penalties += parseCardString(penaltyStr, isHome);
    stats.penaltiesAgainst += parseCardString(penaltyStr, !isHome);
  });

  // Calculate averages and rates
  if (stats.totalMatches > 0) {
    stats.avgYellowPerMatch = stats.yellowCards / stats.totalMatches;
    stats.avgRedPerMatch = stats.redCards / stats.totalMatches;
    stats.winRate = stats.wins / stats.totalMatches;
    stats.homeWinRate = stats.homeWins / stats.homeMatches;
    stats.awayWinRate = stats.awayWins / stats.awayMatches;
  }

  return stats;
}

export default function EnhancedTeamStats({ 
  teamName, 
  matches = [],
  season 
}: { 
  teamName: string; 
  matches: any[];
  season?: number[];
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "performance" | "discipline">("overview");
  
  const stats = calculateTeamStats(matches, teamName);

  if (stats.totalMatches === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No match data available for {teamName}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "performance" as const, label: "Performance", icon: Trophy },
    { id: "discipline" as const, label: "Discipline", icon: AlertTriangle }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {teamName} Deep Statistics
        </h3>
        {season && season.length > 0 && (
          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs dark:bg-indigo-900/30 dark:text-indigo-300">
            {season.join(", ")}
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm"
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
      {activeTab === "overview" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600">{stats.totalMatches}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Matches</div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.homeMatches}H • {stats.awayMatches}A
            </div>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600">{pct(stats.winRate)}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Win Rate</div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.wins}W • {stats.draws}D • {stats.losses}L
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-600">{stats.goalsFor}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Goals For</div>
            <div className="text-xs text-slate-500 mt-1">
              {fmt(stats.goalsFor / stats.totalMatches, 1)} per match
            </div>
          </div>
          
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600">{stats.goalsAgainst}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Goals Against</div>
            <div className="text-xs text-slate-500 mt-1">
              {fmt(stats.goalsAgainst / stats.totalMatches, 1)} per match
            </div>
          </div>
        </div>
      )}

      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-700 dark:text-green-300">Home Performance</h4>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">{pct(stats.homeWinRate)}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {stats.homeWins} wins in {stats.homeMatches} home matches
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">Away Performance</h4>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{pct(stats.awayWinRate)}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {stats.awayWins} wins in {stats.awayMatches} away matches
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-3">Goal Difference Analysis</h4>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.goalsFor - stats.goalsAgainst}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Goal Difference</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{fmt((stats.goalsFor - stats.goalsAgainst) / stats.totalMatches, 1)}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Per Match</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{fmt(stats.goalsFor / Math.max(stats.goalsAgainst, 1), 2)}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Attack/Defense Ratio</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "discipline" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-600">{stats.yellowCards}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Yellow Cards</div>
              <div className="text-xs text-slate-500 mt-1">
                {fmt(stats.avgYellowPerMatch)} per match
              </div>
            </div>
            
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-600">{stats.redCards}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Red Cards</div>
              <div className="text-xs text-slate-500 mt-1">
                {fmt(stats.avgRedPerMatch)} per match
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600">{stats.penalties}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Penalties For</div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.penaltiesAgainst} against
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
            <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-3">Discipline Analysis</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-semibold text-orange-600">
                  {fmt((stats.yellowCards + stats.redCards) / stats.totalMatches)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Cards per Match</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">
                  {stats.redCards > 0 ? fmt(stats.yellowCards / stats.redCards) : "∞"}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Yellow to Red Ratio</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}