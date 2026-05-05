"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface BiasScore {
  referee: string;
  matches: number;
  composite_score: number;
  card_rate_score: number;
  home_away_score: number;
  team_favoritism_score: number;
  cards_per_game: number;
  home_away_delta: number;
  flagged_teams: string[];
}

export function useBiasScores(params: { seasons?: number[]; minMatches?: number } = {}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const q = new URLSearchParams();
  if (params.seasons?.length) {
    params.seasons.forEach(s => q.append("season", s.toString()));
  }
  if (params.minMatches != null) {
    q.set("minMatches", params.minMatches.toString());
  }
  const key = `${apiUrl}/api/bias?${q.toString()}`;
  const { data, error, isLoading } = useSWR<BiasScore[]>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { biasScores: data, error, isLoading };
}
