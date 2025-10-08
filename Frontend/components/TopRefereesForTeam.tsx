import { Trophy } from "lucide-react";

type TeamRefereeStats = {
  name: string;
  matches: number;
  wins: number;
  winRate: number;
  avgYellow: number;
  avgRed: number;
  avgPenalty: number;
  totalCards: number;
};

const fmt = (n?: number, d = 2) => (typeof n === "number" && isFinite(n)) ? n.toFixed(d) : "-";
const pct = (n?: number) => (typeof n === "number" && isFinite(n)) ? `${(n * 100).toFixed(1)}%` : "-";

export default function TopRefereesForTeam({ 
  teamName, 
  matches = [] 
}: { 
  teamName: string; 
  matches: any[];
}) {
  // Calculate referee stats for the selected team
  const refereeStats: { [key: string]: TeamRefereeStats } = {};

  matches.forEach(match => {
    const referee = match.referee;
    if (!referee) return;

    const isHome = match.home === teamName;
    const isAway = match.away === teamName;
    if (!isHome && !isAway) return;

    if (!refereeStats[referee]) {
      refereeStats[referee] = {
        name: referee,
        matches: 0,
        wins: 0,
        winRate: 0,
        avgYellow: 0,
        avgRed: 0,
        avgPenalty: 0,
        totalCards: 0
      };
    }

    const stats = refereeStats[referee];
    stats.matches++;

    // Parse score to determine if team won
    const scoreStr = match.score || "0-0";
    const scoreParts = scoreStr.split(/[–-]/);
    if (scoreParts.length === 2) {
      const homeScore = parseInt(scoreParts[0]) || 0;
      const awayScore = parseInt(scoreParts[1]) || 0;
      
      if ((isHome && homeScore > awayScore) || (isAway && awayScore > homeScore)) {
        stats.wins++;
      }
    }

    // Parse cards for this team
    const yellowStr = match.yellow || "0-0";
    const redStr = match.red || "0-0";
    const penaltyStr = match.penalty || "0-0";

    const parseCardString = (cardStr: string, isHome: boolean) => {
      const parts = cardStr.split(/[–-]/);
      if (parts.length === 2) {
        return parseInt(parts[isHome ? 0 : 1]) || 0;
      }
      return 0;
    };

    const teamYellow = parseCardString(yellowStr, isHome);
    const teamRed = parseCardString(redStr, isHome);

    stats.totalCards += teamYellow + teamRed;
  });

  // Calculate averages and sort by win rate
  const sortedReferees = Object.values(refereeStats)
    .filter(ref => ref.matches >= 3) // Minimum 3 matches
    .map(ref => ({
      ...ref,
      winRate: ref.wins / ref.matches,
      avgYellow: ref.totalCards / ref.matches, // Simplified for now
      avgRed: 0, // Will be calculated properly later
      avgPenalty: 0
    }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3);

  if (sortedReferees.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Trophy className="w-5 h-5 text-emerald-600" />
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
          Top Referees for {teamName}
        </h3>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {sortedReferees.map((ref, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-emerald-200 dark:border-emerald-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                  i === 0 ? "bg-yellow-500 text-white" : 
                  i === 1 ? "bg-slate-400 text-white" : 
                  "bg-orange-500 text-white"
                }`}>
                  {i + 1}
                </div>
                <div>
                  <div className="font-medium text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {ref.name}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {ref.matches} matches officiated
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg sm:text-xl font-bold text-emerald-600">
                  {pct(ref.winRate)}
                </div>
                <div className="text-xs text-slate-500">win rate</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {ref.wins}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Wins</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {ref.matches - ref.wins}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Losses/Draws</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {fmt(ref.avgYellow, 1)}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Avg Cards</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-700">
        <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
          Showing referees with 3+ matches for {teamName}
        </div>
      </div>
    </div>
  );
}