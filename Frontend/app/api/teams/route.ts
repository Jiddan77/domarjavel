import { NextResponse } from "next/server";
import { loadMatches, parseCSV } from "@/lib/loadData";

const toNumArr = (xs: string[]) => xs.map(n => Number(n)).filter(n => Number.isFinite(n));

function getTeamsFromMatch(m: any) {
  const home =
    m.home_team ?? m.home ?? m.homeTeam ?? m.home_name ?? m.team_home ?? m.homeTeamName ?? m.home_club ?? null;
  const away =
    m.away_team ?? m.away ?? m.awayTeam ?? m.away_name ?? m.team_away ?? m.awayTeamName ?? m.away_club ?? null;
  return [home, away].filter(Boolean) as string[];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seasons = toNumArr(parseCSV(searchParams.get("season")));
  const flat = searchParams.get("flat") === "1";
  const minMatches = Number(searchParams.get("minMatches") ?? "0");

  const matches = (await loadMatches()).filter((m: any) =>
    seasons.length ? seasons.includes(m.season) : true
  );

  const counts = new Map<string, number>();
  for (const m of matches) {
    const [h, a] = getTeamsFromMatch(m);
    if (h) counts.set(h, (counts.get(h) ?? 0) + 1);
    if (a) counts.set(a, (counts.get(a) ?? 0) + 1);
  }

  const entries = [...counts.entries()]
    .filter(([_, c]) => c >= minMatches)
    .sort((a, b) => a[0].localeCompare(b[0], "sv"));

  const data = flat
    ? entries.map(([name]) => name)
    : entries.map(([name, matches]) => ({ name, matches }));

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
