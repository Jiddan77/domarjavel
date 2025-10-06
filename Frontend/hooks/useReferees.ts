"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
export type RefItem = { name: string; matches: number };
export function useReferees(params?: { season?: number[]; minMatches?: number }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const q = new URLSearchParams();
  if (params?.season?.length) q.set("season", params.season.join(","));
  if (params?.minMatches) q.set("minMatches", String(params.minMatches));
  const key = `${apiUrl}/api/referees?${q.toString()}`;
  const { data, error, isLoading } = useSWR<RefItem[]>(key, fetcher, { revalidateOnFocus: false });
  return { referees: data ?? [], error, isLoading };
}