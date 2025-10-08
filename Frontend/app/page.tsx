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
import { BarChart3, TrendingUp, Users, Calendar, Filter, Search } from "lucide-react";

export default function Home() {
  const [seasonSel, setSeasonSel] = useState<number[]>([]);
  const [refSel, setRefSel] = useState<string[]>([]);
  const [teamSel, setTeamSel] = useState<string[]>([]);
  const [side, setSide] = useState<"" | "home" | "away">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
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
  
  // Check if any filters are active
  const hasActiveFilters = seasonSel.length > 0 || refSel.length > 0 || teamSel.length > 0 || side !== "";
  
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Professional Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Dommarjävel
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Swedish Football Referee Analytics</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>Seasons 2020-2025</span>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    showFilters || hasActiveFilters
                      ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Advanced Filters Panel */}
          {showFilters && (
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Search className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Advanced Filters</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <MultiSelect 
                    label="Säsong" 
                    options={seasonOpts} 
                    values={seasonSel.map(String)} 
                    onChange={(vals) => {
                      setSeasonSel(vals.map(v => Number(v)));
                      resetPage();
                    }} 
                  />
                </div>
                
                <div className="relative space-y-2">
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
                
                <div className="relative space-y-2">
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
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hemma/Borta</label>
                  <div className="flex gap-2">
                    {[
                      { value: "", label: "Alla" },
                      { value: "home", label: "Hemma" },
                      { value: "away", label: "Borta" }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSide(option.value as any);
                          resetPage();
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          side === option.value
                            ? "bg-blue-100 text-blue-700 border-2 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                            : "bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {hasActiveFilters && (
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setSeasonSel([]);
                      setRefSel([]);
                      setTeamSel([]);
                      setSide("");
                      resetPage();
                    }}
                    className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Error messages */}
          {refereesError && <ErrorMessage error={refereesError} />}
          {teamsError && <ErrorMessage error={teamsError} />}

          {/* Professional Stats Dashboard */}
          <section className="grid lg:grid-cols-3 gap-8">
            {/* Main Stats Panel */}
            <div className="lg:col-span-2 space-y-6">
              {statsLoading ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="md" className="mr-3" />
                    <span className="text-slate-600 dark:text-slate-400">Loading statistics...</span>
                  </div>
                </div>
              ) : statsError ? (
                <ErrorMessage error={statsError} />
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {hasActiveFilters ? "Filtered Statistics" : "Overall Statistics"}
                    </h2>
                  </div>
                  <StatsPanel stats={stats} />
                </div>
              )}

              {/* Facts Panel */}
              {stats && !statsLoading && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
                  <FactsPanel stats={stats} />
                </div>
              )}
            </div>

            {/* Leaderboard Sidebar */}
            <div className="space-y-6">
              {leaderboardLoading ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="md" className="mr-3" />
                    <span className="text-slate-600 dark:text-slate-400">Loading leaderboard...</span>
                  </div>
                </div>
              ) : leaderboardError ? (
                <ErrorMessage error={leaderboardError} />
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Top Referees</h2>
                  </div>
                  <Leaderboard data={leaderboard} />
                </div>
              )}
            </div>
          </section>

          {/* Professional Matches Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {showUpcoming ? "Upcoming Matches" : "Match Results"}
                  </h2>
                  {matchesLoading && <LoadingSpinner size="sm" />}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowUpcoming(!showUpcoming)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      showUpcoming
                        ? "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
                        : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    {showUpcoming ? "Show Results" : "Show Upcoming"}
                  </button>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span>Total: {total || 0} matches</span>
                    {hasActiveFilters && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs dark:bg-blue-900/30 dark:text-blue-300">
                        Filtered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {matchesError ? (
                <ErrorMessage error={matchesError} />
              ) : (
                <>
                  <MatchTable items={matches} showUpcoming={showUpcoming} />
                  {totalPages > 1 && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={total}
                        itemsPerPage={itemsPerPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

        </main>
      </div>
    </ErrorBoundary>
  );
}
