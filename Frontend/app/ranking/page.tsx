"use client";

import { useState, useEffect } from "react";
import { useAdvancedStats } from "@/hooks/useAdvancedStats";
import { Trophy, Users, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import RefereeVoting from "@/components/RefereeVoting";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

type RankingType = "audience" | "cards" | "penalties" | "bias";
type SortOrder = "asc" | "desc";

const fmt = (n?: number, d = 2) => (typeof n === "number" && isFinite(n)) ? n.toFixed(d) : "-";
const pct = (n?: number) => (typeof n === "number" && isFinite(n)) ? `${(n * 100).toFixed(1)}%` : "-";

export default function RankingPage() {
  const [rankingType, setRankingType] = useState<RankingType>("audience");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [userTeamPreference, setUserTeamPreference] = useState<string | null>(null);
  const [audienceVotes, setAudienceVotes] = useState<any>({});

  const { advancedStats, error, isLoading } = useAdvancedStats({ minMatches: 5, limit: 50 });

  // Load team preference and audience votes
  useEffect(() => {
    const saved = localStorage.getItem("dommarjavel_team_preference");
    if (saved) setUserTeamPreference(saved);
    
    fetchAudienceVotes();
  }, []);

  const fetchAudienceVotes = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/referee-votes`);
      if (response.ok) {
        const data = await response.json();
        setAudienceVotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch audience votes:", error);
    }
  };

  const getRankedReferees = () => {
    if (!advancedStats?.referees) return [];

    const referees = advancedStats.referees.map(ref => ({
      ...ref,
      audienceScore: audienceVotes[ref.name] ? 
        (audienceVotes[ref.name].up / Math.max(audienceVotes[ref.name].total, 1)) * 100 : 0,
      audienceVotes: audienceVotes[ref.name]?.total || 0
    }));

    return referees.sort((a, b) => {
      let aValue, bValue;
      
      switch (rankingType) {
        case "audience":
          aValue = a.audienceScore;
          bValue = b.audienceScore;
          break;
        case "cards":
          aValue = a.avg_cards_per_match;
          bValue = b.avg_cards_per_match;
          break;
        case "penalties":
          aValue = a.avg_penalties_per_match;
          bValue = b.avg_penalties_per_match;
          break;
        case "bias":
          aValue = Math.abs(a.home_bias_score - 0.5); // Distance from neutral
          bValue = Math.abs(b.home_bias_score - 0.5);
          break;
        default:
          return 0;
      }

      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });
  };

  const rankingOptions = [
    { 
      id: "audience" as const, 
      label: "Audience Rating", 
      icon: Users,
      description: "Community votes (👍/👎)"
    },
    { 
      id: "cards" as const, 
      label: "Card Activity", 
      icon: TrendingUp,
      description: "Cards per match"
    },
    { 
      id: "penalties" as const, 
      label: "Penalty Frequency", 
      icon: Trophy,
      description: "Penalties per match"
    },
    { 
      id: "bias" as const, 
      label: "Neutrality", 
      icon: TrendingDown,
      description: "Home/away bias"
    }
  ];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Loading referee rankings...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <ErrorMessage error={error} />
        </div>
      </main>
    );
  }

  const rankedReferees = getRankedReferees();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Referee Rankings
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Community and statistical rankings for Swedish football referees
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Ranking Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Ranking Categories
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {rankingOptions.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setRankingType(option.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    rankingType === option.id
                      ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-600"
                  }`}
                >
                  <Icon className="w-5 h-5 mb-2" />
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs opacity-70">{option.description}</div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sort:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder("desc")}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  sortOrder === "desc"
                    ? "bg-slate-200 text-slate-900 dark:bg-slate-600 dark:text-slate-100"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                Highest First
              </button>
              <button
                onClick={() => setSortOrder("asc")}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  sortOrder === "asc"
                    ? "bg-slate-200 text-slate-900 dark:bg-slate-600 dark:text-slate-100"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                Lowest First
              </button>
            </div>
          </div>
        </div>

        {/* Rankings List */}
        <div className="space-y-4">
          {rankedReferees.map((referee, index) => (
            <div 
              key={referee.name}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    index === 0 ? "bg-yellow-500 text-white" :
                    index === 1 ? "bg-slate-400 text-white" :
                    index === 2 ? "bg-orange-500 text-white" :
                    "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300"
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {referee.name}
                    </h3>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {referee.matches} matches officiated
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {rankingType === "audience" && (
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {referee.audienceScore.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">
                        {referee.audienceVotes} votes
                      </div>
                    </div>
                  )}
                  {rankingType === "cards" && (
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {fmt(referee.avg_cards_per_match)}
                      </div>
                      <div className="text-xs text-slate-500">cards/match</div>
                    </div>
                  )}
                  {rankingType === "penalties" && (
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {fmt(referee.avg_penalties_per_match)}
                      </div>
                      <div className="text-xs text-slate-500">penalties/match</div>
                    </div>
                  )}
                  {rankingType === "bias" && (
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {fmt(Math.abs(referee.home_bias_score - 0.5), 3)}
                      </div>
                      <div className="text-xs text-slate-500">bias score</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact voting component */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500">Win Rate</div>
                    <div className="font-medium">{pct((referee.home_win_rate + referee.away_win_rate) / 2)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Home Bias</div>
                    <div className="font-medium">{fmt(referee.home_bias_score, 2)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Cards/Match</div>
                    <div className="font-medium">{fmt(referee.avg_cards_per_match)}</div>
                  </div>
                </div>

                <RefereeVoting 
                  refereeName={referee.name}
                  userTeamPreference={userTeamPreference || undefined}
                  compact={true}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}