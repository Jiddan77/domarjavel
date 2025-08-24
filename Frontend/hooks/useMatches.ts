"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Match } from "@/lib/loadData";

type MatchesResponse = Match[] | { items: Match[]; total: number };

export function useMatches(params: {
  season?: number[]; referee?: string[]; team?: string[]; side?: "home" | "away"; limit?: number; includeTotal?: boolean;
}) {
  const q = new URLSearchParams();
  if (params.season?.length) q.set("season", params.season.join(","));
  if (params.referee?.length) q.set("referee", params.referee.join(","));
  if (params.team?.length) q.set("team", params.team.join(","));
  if (params.side) q.set("side", params.side);
  if (params.limit) q.set("limit", String(params.limit));
  if (params.includeTotal) q.set("includeTotal", "1");
  const key = `/api/matches?${q.toString()}`;
  const { data, error, isLoading } = useSWR<MatchesResponse>(key, fetcher, { revalidateOnFocus: false });
  const items = Array.isArray(data) ? data : (data?.items ?? []);
  const total = Array.isArray(data) ? items.length : (data?.total ?? items.length);
  return { matches: items, total, error, isLoading, key };
}
