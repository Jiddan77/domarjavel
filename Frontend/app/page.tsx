"use client";

import { useMemo, useState } from "react";
import { useSeasons } from "@/hooks/useSeasons";
import { useReferees } from "@/hooks/useReferees";
import { useTeams } from "@/hooks/useTeams";
import { useMatches } from "@/hooks/useMatches";
import { useStats } from "@/hooks/useStats";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import MultiSelect from "@/components/filters/MultiSelect";
import StatsPanel from "@/components/StatsPanel";
import FactsPanel from "@/components/FactsPanel";
import MatchTable from "@/components/MatchTable";
import Leaderboard from "@/components/Leaderboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import Pagination from "@/components/Pagination";

export default function Home() {
  const [seasonSel, setSeasonSel] = useState<number[]>([]);
  const [refSel, setRefSel] = useState<string[]>([]);
  const [teamSel, setTeamSel] = useState<string[]>([]);
  const [side, setSide] = useState<"" | "home" | "away">("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { seasons, error: seasonsError, isLoading: seasonsLoading } = useSeasons();
  const { referees, error: refereesError, isLoading: refereesLoading } = useReferees({ season: seasonSel, minMatches: 1 });
  const { teams, error: teamsError, isLoading: teamsLoading } = useTeams({ season: seasonSel, minMatches: 1 });

  const { matches, total, error: matchesError, isLoading: matchesLoading } = useMatches({
    season: seasonSel, 
    referee: refSel, 
    team: teamSel, 
    side: side || undefined, 
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    includeTotal: true
  });
  const { stats, error: statsError, isLoading: statsLoading } = useStats({ season: seasonSel, referee: refSel, team: teamSel, side: side || undefined });
  const { leaderboard, error: leaderboardError, isLoading: leaderboardLoading } = useLeaderboard({ season: seasonSel, team: teamSel, limit: 5, minMatches: 8, minTeamMatches: 5 });

  const seasonOpts = useMemo(() => seasons.map(s => ({ value: String(s.season), label: String(s.season) })), [seasons]);
  const refOpts = useMemo(() => referees.map(r => ({ value: r.name, label: r.name })), [referees]);
  const teamOpts = useMemo(() => teams.map(t => ({ value: t.name, label: t.name })), [teams]);
  
  const totalPages = Math.ceil((total || 0) / itemsPerPage);
  
  // Reset to page 1 when filters change
  const resetPage = () => setCurrentPage(1);

  // Show loading state for initial data
  if (seasonsLoading) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading application...</p>
          </div>
        </div>
      </main>
    );
  }

  // Show error for critical failures
  if (seasonsError) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <ErrorMessage error={seasonsError} />
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <header className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-bold">Dommarjävel</h1>
          <div className="text-sm opacity-70 flex items-center gap-2">
            Matcher: {matchesLoading ? <LoadingSpinner size="sm" /> : total}
          </div>
        </header>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MultiSelect 
            label="Säsong" 
            options={seasonOpts} 
            values={seasonSel.map(String)} 
            onChange={(vals) => {
              setSeasonSel(vals.map(v => Number(v)));
              resetPage();
            }} 
          />
          <div className="relative">
            <MultiSelect 
              label="Domare" 
              options={refOpts} 
              values={refSel} 
              onChange={(vals) => {
                setRefSel(vals);
                resetPage();
              }}
              disabled={refereesLoading}
            />
            {refereesLoading && (
              <div className="absolute right-2 top-8">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
          <div className="relative">
            <MultiSelect 
              label="Lag" 
              options={teamOpts} 
              values={teamSel} 
              onChange={(vals) => {
                setTeamSel(vals);
                resetPage();
              }}
              disabled={teamsLoading}
            />
            {teamsLoading && (
              <div className="absolute right-2 top-8">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-sm opacity-80">Hemma/Borta</div>
            <div className="flex flex-wrap gap-2">
              {["", "home", "away"].map(s => (
                <button
                  key={s || "all"}
                  onClick={() => {
                    setSide(s as any);
                    resetPage();
                  }}
                  className={`px-2 py-1 rounded border text-sm transition-colors ${
                    side === s 
                      ? "bg-white text-black dark:bg-white dark:text-black" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {s === "" ? "Alla" : s === "home" ? "Hemma" : "Borta"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Error messages for non-critical failures */}
        {refereesError && <ErrorMessage error={refereesError} className="mb-4" />}
        {teamsError && <ErrorMessage error={teamsError} className="mb-4" />}

        {/* Stats section with loading states */}
        <div className="space-y-6">
          {statsLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner size="md" className="mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Loading statistics...</span>
            </div>
          ) : statsError ? (
            <ErrorMessage error={statsError} />
          ) : (
            <>
              <StatsPanel stats={stats} />
              <FactsPanel stats={stats} />
            </>
          )}

          {leaderboardLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner size="md" className="mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Loading leaderboard...</span>
            </div>
          ) : leaderboardError ? (
            <ErrorMessage error={leaderboardError} />
          ) : (
            <Leaderboard data={leaderboard} />
          )}
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            Matcher
            {matchesLoading && <LoadingSpinner size="sm" />}
          </h2>
          {matchesError ? (
            <ErrorMessage error={matchesError} />
          ) : (
            <>
              <MatchTable items={matches} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={total}
                itemsPerPage={itemsPerPage}
              />
            </>
          )}
        </section>
      </main>
    </ErrorBoundary>
  );
}
