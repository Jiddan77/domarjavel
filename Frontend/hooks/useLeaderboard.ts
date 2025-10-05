"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

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

export function useLeaderboard(params: { season?: number[]; team?: string[]; minMatches?: number; minTeamMatches?: number; limit?: number }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const q = new URLSearchParams();
  if (params.season?.length) q.set("season", params.season.join(","));
  if (params.team?.length) q.set("team", params.team.join(","));
  if (params.minMatches) q.set("minMatches", String(params.minMatches));
  if (params.minTeamMatches) q.set("minTeamMatches", String(params.minTeamMatches));
  if (params.limit) q.set("limit", String(params.limit));
  const key = `${apiUrl}/leaderboard?${q.toString()}`;
  const { data, error, isLoading } = useSWR<LeaderboardItem[]>(key, fetcher, { revalidateOnFocus: false });
  return { leaderboard: data, error, isLoading };
}
