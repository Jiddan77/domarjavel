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
  const q = new URLSearchParams();

  // For dynamic API, add all parameters
  if (params.season?.length) {
    params.season.forEach(s => q.append("season", s.toString()));
  }
  if (params.team?.length) {
    params.team.forEach(t => q.append("team", t));
  }
  if (params.minMatches) q.set("minMatches", String(params.minMatches));
  if (params.minTeamMatches) q.set("minTeamMatches", String(params.minTeamMatches));
  if (params.limit) q.set("limit", String(params.limit));

  const url = leaderboardUrl(params.season, hasOtherFilters);
  // For dynamic API, append the extra query params to the key
  const key = hasOtherFilters && params.season?.length ? `${url}&${q.toString()}` : url;

  const { data, error, isLoading } = useSWR<any>(key, fetcher, { revalidateOnFocus: false });

  // Transform chunk data (dict) to LeaderboardItem[] format if needed
  const leaderboard = data ? (Array.isArray(data) ? data : transformChunkToLeaderboard(data)) : undefined;

  return { leaderboard, error, isLoading };
}
