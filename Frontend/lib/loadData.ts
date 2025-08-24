export type Match = {
  match_id: number;
  season: number;
  date: string;
  home_team: string;
  away_team: string;
  referee: string;
  home_away?: "home" | "away";
  home_goals?: number;
  away_goals?: number;
  yellow_cards_home?: number;
  yellow_cards_away?: number;
  red_cards_home?: number;
  red_cards_away?: number;
  penalties_home?: number;
  penalties_away?: number;
};

export async function loadMatches(): Promise<Match[]> {
  const dataUrl = process.env.DATA_URL;
  if (dataUrl) {
    const res = await fetch(dataUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch data.json from " + dataUrl);
    return res.json();
  } else {
    const data: Match[] = (await import("@/data/data.json")).default as any;
    return data;
  }
}

export function parseCSV(v: string | null): string[] {
  return v ? v.split(",").map(s => s.trim()).filter(Boolean) : [];
}
