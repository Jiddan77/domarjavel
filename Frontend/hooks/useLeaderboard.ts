"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

type RowValue = { name: string; value?: number; valuePct?: number; matches: number };
export type LeaderboardData = {
  overall_total: number;
  filtered_total: number;
  nicest_refs: RowValue[];
  toughest_refs: RowValue[];
  best_for_selected_teams: RowValue[];
  worst_for_selected_teams: RowValue[];
  most_penalties: RowValue[];
  most_interventions: RowValue[];
};

export function useLeaderboard(params: { season?: number[]; team?: string[]; minMatches?: number; minTeamMatches?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params.season?.length) q.set("season", params.season.join(","));
  if (params.team?.length) q.set("team", params.team.join(","));
  if (params.minMatches) q.set("minMatches", String(params.minMatches));
  if (params.minTeamMatches) q.set("minTeamMatches", String(params.minTeamMatches));
  if (params.limit) q.set("limit", String(params.limit));
  const key = `/api/leaderboard?${q.toString()}`;
  const { data, error, isLoading } = useSWR<LeaderboardData>(key, fetcher, { revalidateOnFocus: false });
  return { leaderboard: data, error, isLoading };
}
