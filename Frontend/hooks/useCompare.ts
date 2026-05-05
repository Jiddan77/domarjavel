"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { BiasScore } from "./useBiasScores";

export interface CompareReferee {
  name: string;
  matches: number;
  cards_per_game: number;
  penalties_per_game: number;
  home_card_advantage: number;
  bias: Pick<
    BiasScore,
    | "composite_score"
    | "card_rate_score"
    | "home_away_score"
    | "team_favoritism_score"
    | "flagged_teams"
  >;
}

export interface LeagueAvg {
  cards_per_game: number;
  penalties_per_game: number;
  home_card_advantage: number;
}

export interface CompareResult {
  referees: CompareReferee[];
  league_avg: LeagueAvg;
}

export function useCompare(referees: string[], seasons?: number[]) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const enabled = referees.length >= 2;

  const q = new URLSearchParams();
  referees.forEach(r => q.append("referee", r));
  if (seasons?.length) {
    seasons.forEach(s => q.append("season", s.toString()));
  }

  const key = enabled ? `${apiUrl}/api/compare?${q.toString()}` : null;
  const { data, error, isLoading } = useSWR<CompareResult>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { compareData: data, error, isLoading };
}
