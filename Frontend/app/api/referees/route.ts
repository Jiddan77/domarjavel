import { NextResponse } from "next/server";
import { loadMatches, parseCSV } from "@/lib/loadData";

const toNumArr = (xs: string[]) => xs.map(n => Number(n)).filter(n => Number.isFinite(n));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seasons = toNumArr(parseCSV(searchParams.get("season")));
  const flat = searchParams.get("flat") === "1";
  const minMatches = Number(searchParams.get("minMatches") ?? "0");

  const matches = (await loadMatches()).filter(m =>
    seasons.length ? seasons.includes(m.season) : true
  );

  const counts = new Map<string, number>();
  for (const m of matches) {
    if (!m.referee) continue;
    counts.set(m.referee, (counts.get(m.referee) ?? 0) + 1);
  }

  const entries = [...counts.entries()]
    .filter(([_, c]) => c >= minMatches)
    .sort((a, b) => a[0].localeCompare(b[0], "sv"));

  const data = flat
    ? entries.map(([name]) => name)
    : entries.map(([name, matches]) => ({ name, matches }));

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
