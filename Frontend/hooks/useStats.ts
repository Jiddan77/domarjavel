"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useStats(params: { season?: number[]; referee?: string[]; team?: string[]; side?: "home" | "away" }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const q = new URLSearchParams();
  
  // Add multiple parameters with the same name for arrays (FastAPI expects this)
  if (params.season?.length) {
    params.season.forEach(s => q.append("season", s.toString()));
  }
  if (params.referee?.length) {
    params.referee.forEach(r => q.append("referee", r));
  }
  if (params.team?.length) {
    params.team.forEach(t => q.append("team", t));
  }
  if (params.side) q.set("side", params.side);
  
  const key = `${apiUrl}/api/stats?${q.toString()}`;
  const { data, error, isLoading } = useSWR<any>(key, fetcher, { revalidateOnFocus: false });
  return { stats: data, error, isLoading, key };
}
