"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { seasonsUrl } from "@/lib/api";

export type SeasonItem = { season: number; matches: number };
export function useSeasons() {
  const { data, error, isLoading } = useSWR<SeasonItem[]>(seasonsUrl(), fetcher);
  return { seasons: data ?? [], error, isLoading };
}