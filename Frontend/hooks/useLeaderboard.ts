"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { leaderboardUrl } from "@/lib/api";

export type LeaderboardItem = {
  name: string;
  matches: number;
  totalYellow: number;
  totalRed: number;
  totalPenalty: number;
  avgYellow: number;
  avgRed: number;
  avgPenalty: number;
  avgTotal: number;
};

type ChunkRefereeStats = {
  matches: number;
  total_yellow: number;
  total_red: number;
  total_penalties: number;
  avg_yellow: number;
  avg_red: number;
  avg_penalties: number;
};

function transformChunkToLeaderboard(data: Record<string, ChunkRefereeStats>): LeaderboardItem[] {
  return Object.entries(data).map(([name, stats]) => ({
    name,
    matches: stats.matches,
    totalYellow: stats.total_yellow,
    totalRed: stats.total_red,
    totalPenalty: stats.total_penalties,
    avgYellow: stats.avg_yellow,
    avgRed: stats.avg_red,
    avgPenalty: stats.avg_penalties,
    avgTotal: stats.avg_yellow + stats.avg_red + stats.avg_penalties,
  }));
}

export function useLeaderboard(params: { season?: number[]; team?: string[]; minMatches?: number; minTeamMatches?: number; limit?: number }) {
  const hasOtherFilters = params.team?.length ? true : false;

  const url = leaderboardUrl(params.season, hasOtherFilters);

  // Only append non-season params since leaderboardUrl() already includes season
  const extraParams = new URLSearchParams();
  if (params.team?.length) {
    params.team.forEach(t => extraParams.append("team", t));
  }
  if (params.minMatches) extraParams.set("minMatches", String(params.minMatches));
  if (params.minTeamMatches) extraParams.set("minTeamMatches", String(params.minTeamMatches));
  if (params.limit) extraParams.set("limit", String(params.limit));

  const key = hasOtherFilters && extraParams.size > 0 ? `${url}&${extraParams}` : url;

  const { data, error, isLoading } = useSWR<any>(key, fetcher, { revalidateOnFocus: false });

  // Transform chunk data (dict) to LeaderboardItem[] format if needed
  const leaderboard = data ? (Array.isArray(data) ? data : transformChunkToLeaderboard(data)) : undefined;

  return { leaderboard, error, isLoading };
}
