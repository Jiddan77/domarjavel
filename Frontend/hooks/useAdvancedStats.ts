"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type AdvancedRefereeStats = {
  name: string;
  matches: number;
  home_win_rate: number;
  away_win_rate: number;
  draw_rate: number;
  home_bias_score: number;
  home_card_rate: number;
  home_penalty_rate: number;
  avg_cards_per_match: number;
  avg_penalties_per_match: number;
  team_performance: {
    [teamName: string]: {
      matches: number;
      win_rate: number;
      avg_cards: number;
      avg_penalties: number;
    };
  };
};

export type AdvancedStatsResponse = {
  referees: AdvancedRefereeStats[];
  summary: {
    total_referees: number;
    total_matches: number;
    avg_home_win_rate: number;
    avg_away_win_rate: number;
  };
};

export function useAdvancedStats(params: { 
  season?: number[]; 
  team?: string[]; 
  minMatches?: number; 
  limit?: number; 
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const q = new URLSearchParams();
  
  if (params.season?.length) {
    params.season.forEach(s => q.append("season", s.toString()));
  }
  if (params.team?.length) {
    params.team.forEach(t => q.append("team", t));
  }
  if (params.minMatches) q.set("minMatches", String(params.minMatches));
  if (params.limit) q.set("limit", String(params.limit));
  
  const key = `${apiUrl}/api/advanced-stats?${q.toString()}`;
  const { data, error, isLoading } = useSWR<AdvancedStatsResponse>(key, fetcher, { 
    revalidateOnFocus: false 
  });
  
  return { advancedStats: data, error, isLoading };
}