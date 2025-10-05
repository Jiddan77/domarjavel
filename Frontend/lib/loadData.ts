export type Match = {
  match_id: number;
  season: number;
  date: string;
  referee: string;
  home: string;
  away: string;
  score: string;
  yellow: string;
  red: string;
  penalty: string;
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
