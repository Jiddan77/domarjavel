"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
export type SeasonItem = { season: number; matches: number };
export function useSeasons() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const { data, error, isLoading } = useSWR<SeasonItem[]>(`${apiUrl}/api/seasons`, fetcher);
  return { seasons: data ?? [], error, isLoading };
}