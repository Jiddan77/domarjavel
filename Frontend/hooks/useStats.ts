"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { statsUrl } from "@/lib/api";

export function useStats(params: { season?: number[]; referee?: string[]; team?: string[]; side?: "home" | "away" }) {
  const hasOtherFilters = (params.referee?.length ?? 0) > 0 || (params.team?.length ?? 0) > 0 || !!params.side;

  const url = statsUrl(params.season, hasOtherFilters);

  // Only append non-season params since statsUrl() already includes season
  const extraParams = new URLSearchParams();
  if (params.referee?.length) {
    params.referee.forEach(r => extraParams.append("referee", r));
  }
  if (params.team?.length) {
    params.team.forEach(t => extraParams.append("team", t));
  }
  if (params.side) extraParams.set("side", params.side);

  const key = hasOtherFilters && extraParams.size > 0 ? `${url}&${extraParams}` : url;
  const { data, error, isLoading } = useSWR<any>(key, fetcher, { revalidateOnFocus: false });
  return { stats: data, error, isLoading, key };
}
