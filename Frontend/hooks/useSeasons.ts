"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
export type SeasonItem = { season: number; matches: number };
export function useSeasons() {
  const { data, error, isLoading } = useSWR<SeasonItem[]>("/api/seasons", fetcher);
  return { seasons: data ?? [], error, isLoading };
}