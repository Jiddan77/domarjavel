"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Match } from "@/lib/loadData";

type MatchesResponse = Match[] | { matches: Match[]; total: number };

export function useMatches(params: {
  season?: number[]; referee?: string[]; team?: string[]; side?: "home" | "away"; limit?: number; offset?: number; includeTotal?: boolean;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const q = new URLSearchParams();
  
  // Add multiple parameters with the same name for arrays (FastAPI expects this)
  if (params.season?.length) {
    params.season.forEach(s => q.append("season", s.toString()));
  }
  if (params.referee?.length) {
    params.referee.forEach(r => q.append("referee", r));
  }
  if (params.team?.length) {
    params.team.forEach(t => q.append("team", t));
  }
  if (params.side) q.set("side", params.side);
  if (params.limit) q.set("limit", String(params.limit));
  if (params.offset) q.set("offset", String(params.offset));
  if (params.includeTotal) q.set("includeTotal", "1");
  const key = `${apiUrl}/api/matches?${q.toString()}`;
  const { data, error, isLoading } = useSWR<MatchesResponse>(key, fetcher, { revalidateOnFocus: false });
  const items = Array.isArray(data) ? data : (data?.matches ?? []);
  const total = Array.isArray(data) ? items.length : (data?.total ?? items.length);
  return { matches: items, total, error, isLoading, key };
}
