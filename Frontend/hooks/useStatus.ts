"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type StatusData = {
  status: string;
  last_updated: string;
  total_matches: number;
  seasons: Record<string, { total: number; finished: number }>;
};

export function useStatus() {
  const API = process.env.NEXT_PUBLIC_API_URL || "";
  const { data } = useSWR<StatusData>(`${API}/api/status`, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60 * 60 * 1000,
  });
  return data ?? null;
}
