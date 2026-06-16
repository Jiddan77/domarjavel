"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { statsUrl } from "@/lib/api";

export function useStats(params: { season?: number[]; referee?: string[]; team?: string[]; side?: "home" | "away" }) {
  const hasOtherFilters = (params.referee?.length ?? 0) > 0 || (params.team?.length ?? 0) > 0 || !!params.side;
  const q = new URLSearchParams();

  // For dynamic API, add all parameters
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

  const url = statsUrl(params.season, hasOtherFilters);
  // For dynamic API, append the extra query params to the key
  const key = hasOtherFilters && params.season?.length ? `${url}&${q.toString()}` : url;
  const { data, error, isLoading } = useSWR<any>(key, fetcher, { revalidateOnFocus: false });
  return { stats: data, error, isLoading, key };
}
