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
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      q.set(key, String(value));
    }
  });
  const res = await fetch(`/api/matches?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json() as Promise<{ items: Match[]; nextCursor?: string }>;
}

const API = process.env.NEXT_PUBLIC_API_URL || '';

/** Returns chunk URL for seasons summary. */
export function seasonsUrl(): string {
  return `${API}/api/chunks/seasons`;
}

/** Returns chunk URL for single-season stats, or dynamic API URL for multi-filter queries. */
export function statsUrl(seasons: number[] | undefined, hasOtherFilters: boolean): string {
  if (seasons?.length === 1 && !hasOtherFilters) {
    return `${API}/api/chunks/season/${seasons[0]}/stats`;
  }
  const q = new URLSearchParams();
  seasons?.forEach(s => q.append('season', String(s)));
  return `${API}/api/stats?${q}`;
}

/** Returns chunk URL for single-season referee leaderboard, or dynamic API URL for multi-filter queries. */
export function leaderboardUrl(seasons: number[] | undefined, hasOtherFilters: boolean): string {
  if (seasons?.length === 1 && !hasOtherFilters) {
    return `${API}/api/chunks/season/${seasons[0]}/referees`;
  }
  const q = new URLSearchParams();
  seasons?.forEach(s => q.append('season', String(s)));
  return `${API}/api/leaderboard?${q}`;
}

/** Returns chunk URL for single-season teams, or dynamic API URL otherwise. */
export function teamsUrl(seasons: number[] | undefined): string {
  if (seasons?.length === 1) {
    return `${API}/api/chunks/season/${seasons[0]}/teams`;
  }
  const q = new URLSearchParams();
  seasons?.forEach(s => q.append('season', String(s)));
  return `${API}/api/teams?${q}`;
}
