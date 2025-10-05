"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
export type SeasonItem = { season: number; matches: number };
export function useSeasons() {
  const apiUrl = "http://localhost:8000"; // Hardcoded for testing
  const { data, error, isLoading } = useSWR<SeasonItem[]>(`${apiUrl}/seasons`, fetcher);
  return { seasons: data ?? [], error, isLoading };
}