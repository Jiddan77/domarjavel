import { NextResponse } from "next/server";
import { loadMatches, parseCSV, Match } from "@/lib/loadData";

const toNumArr = (xs: string[]) => xs.map(n => Number(n)).filter(Number.isFinite);
const norm = (s: any) => (s ?? "").toString().trim().replace(/\s+/g, " ").toUpperCase();

function getTeamNamesRaw(m: any) {
  const home = m.home_team ?? m.home ?? m.homeTeam ?? m.home_name ?? m.team_home ?? m.homeTeamName ?? m.home_club ?? "";
  const away = m.away_team ?? m.away ?? m.awayTeam ?? m.away_name ?? m.team_away ?? m.awayTeamName ?? m.away_club ?? "";
  return { home, away };
}

// svensk datumparser: "6 juli 2025" m.m.
function parseDate(val: any): number {
  const s = (val ?? "").toString().trim();
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return t;
  const mapp: Record<string, number> = {
    januari:0, februari:1, mars:2, april:3, maj:4, juni:5,
    juli:6, augusti:7, september:8, oktober:9, november:10, december:11
  };
  const r = s.match(/^(\d{1,2})\s+([A-Za-zåäöÅÄÖ]+)\s+(\d{4})$/);
  if (r) {
    const d = Number(r[1]), mm = mapp[r[2].toLowerCase()], y = Number(r[3]);
    if (Number.isFinite(d) && mm != null && Number.isFinite(y)) return new Date(y, mm, d).getTime();
  }
  return 0; // sist
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seasons = toNumArr(parseCSV(searchParams.get("season")));
  const referees = parseCSV(searchParams.get("referee")).map(norm);
  const teams = parseCSV(searchParams.get("team")).map(norm);
  const side = searchParams.get("side");
  const limit = Number(searchParams.get("limit") ?? "0");
  const includeTotal = searchParams.get("includeTotal") === "1";

  const all = await loadMatches();

  let out = all.filter((mm: Match & any) => {
    const ms = Number(mm.season); // <- funkar även om säsong är "2025"
    const { home, away } = getTeamNamesRaw(mm);
    const hN = norm(home), aN = norm(away);

    if (seasons.length && !seasons.includes(ms)) return false;
    if (referees.length && !referees.includes(norm(mm.referee))) return false;
    if (teams.length && !(teams.includes(hN) || teams.includes(aN))) return false;
    if (side && mm.home_away && mm.home_away !== side) return false;
    return true;
  });

  // sortera datum (nyast först)
  out.sort((a: any, b: any) => parseDate(b.date) - parseDate(a.date));

  const total = out.length;
  if (limit > 0) out = out.slice(0, limit);

  return NextResponse.json(includeTotal ? { items: out, total } : out, { headers: { "Cache-Control": "no-store" } });
}
