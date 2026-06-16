"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { teamsUrl } from "@/lib/api";

export type TeamItem = { name: string; matches: number };
export function useTeams(params?: { season?: number[]; minMatches?: number }) {
  const q = new URLSearchParams();
  if (params?.minMatches) q.set("minMatches", String(params.minMatches));
  const url = teamsUrl(params?.season);
  // Append minMatches only for dynamic API calls (multi-season)
  const key = params?.season?.length !== 1 && params?.minMatches ? `${url}&${q.toString()}` : url;
  const { data, error, isLoading } = useSWR<TeamItem[]>(key, fetcher, { revalidateOnFocus: false });
  return { teams: data ?? [], error, isLoading };
}