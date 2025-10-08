"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
export type TeamItem = { name: string; matches: number };
export function useTeams(params?: { season?: number[]; minMatches?: number }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const q = new URLSearchParams();
  if (params?.season?.length) {
    params.season.forEach(s => q.append("season", s.toString()));
  }
  if (params?.minMatches) q.set("minMatches", String(params.minMatches));
  const key = `${apiUrl}/api/teams?${q.toString()}`;
  const { data, error, isLoading } = useSWR<TeamItem[]>(key, fetcher, { revalidateOnFocus: false });
  return { teams: data ?? [], error, isLoading };
}