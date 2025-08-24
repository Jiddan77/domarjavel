"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
export type TeamItem = { name: string; matches: number };
export function useTeams(params?: { season?: number[]; minMatches?: number }) {
  const q = new URLSearchParams();
  if (params?.season?.length) q.set("season", params.season.join(","));
  if (params?.minMatches) q.set("minMatches", String(params.minMatches));
  const key = `/api/teams?${q.toString()}`;
  const { data, error, isLoading } = useSWR<TeamItem[]>(key, fetcher, { revalidateOnFocus: false });
  return { teams: data ?? [], error, isLoading };
}