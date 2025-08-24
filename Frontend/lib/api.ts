export type Match = {
  id: string; date?: string | null; season?: number | null; referee?: string | null;
  home?: string | null; away?: string | null;
  homeGoals: number; awayGoals: number;
  yellowHome: number; yellowAway: number;
  redHome: number; redAway: number;
  penaltiesHome: number; penaltiesAway: number;
};

export async function fetchIndex() {
  const res = await fetch(`/api/index`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch index");
  return res.json() as Promise<{ referees: string[]; teams: string[]; seasons: number[]; global: any; }>;
}

export async function fetchMatches(params: {
  season: number | string;
  referee?: string;
  team?: string;
  homeAway?: "home" | "away";
  limit?: number;
  cursor?: string;
}) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== ""))
  );
  const res = await fetch(`/api/matches?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json() as Promise<{ items: Match[]; nextCursor?: string }>;
}
