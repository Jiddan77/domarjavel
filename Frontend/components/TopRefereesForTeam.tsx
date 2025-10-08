import { useState } from "react";
import { Trophy, Eye } from "lucide-react";
import MatchDetailsModal from "./MatchDetailsModal";

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
  const [selectedReferee, setSelectedReferee] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleRefereeClick = (refereeName: string) => {
    setSelectedReferee(refereeName);
    setShowModal(true);
  };

  const getMatchesForReferee = (refereeName: string) => {
    return matches.filter(match => 
      match.referee === refereeName && 
      (match.home === teamName || match.away === teamName)
    );
  };
  // Calculate referee stats for the selected team
  const refereeStats: { [key: string]: TeamRefereeStats & { 
    totalYellow: number; 
    totalRed: number; 
    totalPenalties: number;
    matchDetails: any[];
  } } = {};

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
        totalCards: 0,
        totalYellow: 0,
        totalRed: 0,
        totalPenalties: 0,
        matchDetails: []
      };
    }

    const stats = refereeStats[referee];
    stats.matches++;

    // Parse score to determine if team won
    const scoreStr = match.score || "0-0";
    const scoreParts = scoreStr.split(/[–-]/);
    let teamWon = false;
    if (scoreParts.length === 2) {
      const homeScore = parseInt(scoreParts[0]) || 0;
      const awayScore = parseInt(scoreParts[1]) || 0;
      
      if ((isHome && homeScore > awayScore) || (isAway && awayScore > homeScore)) {
        stats.wins++;
        teamWon = true;
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
    const teamPenalties = parseCardString(penaltyStr, isHome);

    stats.totalYellow += teamYellow;
    stats.totalRed += teamRed;
    stats.totalPenalties += teamPenalties;
    stats.totalCards += teamYellow + teamRed;

    // Store match details for drill-down
    stats.matchDetails.push({
      ...match,
      teamWon,
      teamYellow,
      teamRed,
      teamPenalties,
      isHome
    });
  });

  // Calculate averages and sort by win rate
  const sortedReferees = Object.values(refereeStats)
    .filter(ref => ref.matches >= 3) // Minimum 3 matches
    .map(ref => ({
      ...ref,
      winRate: ref.wins / ref.matches,
      avgYellow: ref.totalYellow / ref.matches,
      avgRed: ref.totalRed / ref.matches,
      avgPenalty: ref.totalPenalties / ref.matches
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
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-emerald-200 dark:border-emerald-700 hover:shadow-md transition-all cursor-pointer group">
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
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg sm:text-xl font-bold text-emerald-600">
                    {pct(ref.winRate)}
                  </div>
                  <div className="text-xs text-slate-500">win rate</div>
                </div>
                <button
                  onClick={() => handleRefereeClick(ref.name)}
                  className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-4 gap-4 text-center">
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
                  <div className="text-xs text-slate-600 dark:text-slate-400">L/D</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-yellow-600">
                    {fmt(ref.avgYellow, 1)}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Yellow</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-red-600">
                    {fmt(ref.avgRed, 1)}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Red</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Match Details Modal */}
      {selectedReferee && (
        <MatchDetailsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          matches={getMatchesForReferee(selectedReferee)}
          referee={selectedReferee}
          teamName={teamName}
        />
      )}

      <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-700">
        <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
          Showing referees with 3+ matches for {teamName}
        </div>
      </div>
    </div>
  );
}