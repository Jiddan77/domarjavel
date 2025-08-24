"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useStats(params: { season?: number[]; referee?: string[]; team?: string[]; side?: "home" | "away" }) {
  const q = new URLSearchParams();
  if (params.season?.length) q.set("season", params.season.join(","));
  if (params.referee?.length) q.set("referee", params.referee.join(","));
  if (params.team?.length) q.set("team", params.team.join(","));
  if (params.side) q.set("side", params.side);
  const key = `/api/stats?${q.toString()}`;
  const { data, error, isLoading } = useSWR<any>(key, fetcher, { revalidateOnFocus: false });
  return { stats: data, error, isLoading, key };
}
