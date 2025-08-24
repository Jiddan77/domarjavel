import { NextResponse } from "next/server";
import { loadMatches, parseCSV, Match } from "@/lib/loadData";

const toNumArr = (xs: string[]) => xs.map(n => Number(n)).filter(n => Number.isFinite(n));
const num = (...vals: any[]) => {
  for (const v of vals) {
    const n = typeof v === "string" ? Number(v) : v;
    if (Number.isFinite(n)) return Number(n);
  }
  return 0;
};

function getTeamNames(m: any) {
  const home =
    m.home_team ?? m.home ?? m.homeTeam ?? m.home_name ?? m.team_home ?? m.homeTeamName ?? m.home_club ?? "";
  const away =
    m.away_team ?? m.away ?? m.awayTeam ?? m.away_name ?? m.team_away ?? m.awayTeamName ?? m.away_club ?? "";
  return { home, away };
}

function parseScoreLike(m: any): { hg: number; ag: number } {
  let hg = num(m.home_goals, m.goals_home, m.homeGoals, m.score_home, m.home_score);
  let ag = num(m.away_goals, m.goals_away, m.awayGoals, m.score_away, m.away_score);
  if (hg === 0 && ag === 0) {
    const candidates = [m.score, m.result, m.final_score, m.full_time, m.ft, m.end_result];
    for (const s of candidates) {
      if (typeof s === "string") {
        const r = s.match(/(\d+)\D+(\d+)/);
        if (r) { hg = Number(r[1]); ag = Number(r[2]); break; }
      }
    }
  }
  return { hg, ag };
}

function cardTotal(m: any, side: "yellow" | "red"): number {
  const h = num(
    m[`${side}_cards_home`], m[`${side}CardsHome`],
    m?.cards?.[side]?.home, m?.[`${side}`]?.home,
    m?.stats?.cards?.[side]?.home
  );
  const a = num(
    m[`${side}_cards_away`], m[`${side}CardsAway`],
    m?.cards?.[side]?.away, m?.[`${side}`]?.away,
    m?.stats?.cards?.[side]?.away
  );
  let tot = h + a;
  if (tot === 0) {
    tot = num(
      m[`${side}_cards`], m[`${side}Cards`],
      m?.cards?.[side]?.total, m?.[`${side}`]?.total, m?.stats?.cards?.[side]?.total
    );
  }
  if (tot === 0) {
    const events = (m.events ?? m.timeline ?? []) as any[];
    if (Array.isArray(events)) {
      const key = side === "yellow" ? "yellow" : "red";
      tot = events.filter((e) => {
        const t = (e.type ?? e.event ?? e.kind ?? "").toString().toLowerCase();
        return t.includes(key) && !t.includes("second");
      }).length;
    }
  }
  return tot;
}

function penaltiesTotal(m: any): number {
  const h = num(m.penalties_home, m.penalty_home, m.penaltiesHome, m?.penalties?.home, m?.stats?.penalties?.home);
  const a = num(m.penalties_away, m.penalty_away, m.penaltiesAway, m?.penalties?.away, m?.stats?.penalties?.away);
  let tot = h + a;
  if (tot === 0) {
    tot = num(m.penalties, m.penalty_total, m?.penalties?.total, m?.stats?.penalties?.total);
  }
  if (tot === 0) {
    const events = (m.events ?? m.timeline ?? []) as any[];
    if (Array.isArray(events)) {
      tot = events.filter((e) => {
        const t = (e.type ?? e.event ?? e.kind ?? "").toString().toLowerCase();
        return t.includes("pen") || t.includes("straff");
      }).length;
    }
  }
  return tot;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seasons = toNumArr(parseCSV(searchParams.get("season")));
  const teams = parseCSV(searchParams.get("team"));
  const minMatches = Number(searchParams.get("minMatches") ?? "8");
  const minTeamMatches = Number(searchParams.get("minTeamMatches") ?? "5");
  const limit = Number(searchParams.get("limit") ?? "5");

  const all = await loadMatches();
  const overall_total = all.length;

  const filtered = all.filter((m: Match & Record<string, any>) => {
    const { home, away } = getTeamNames(m);
    if (seasons.length && !seasons.includes(m.season)) return false;
    if (teams.length && !(teams.includes(home) || teams.includes(away))) return false;
    return true;
  });
  const filtered_total = filtered.length;

  interface Acc { matches: number; y: number; r: number; p: number; teamMatches: number; teamWins: number; teamLosses: number; }
  const byRef = new Map<string, Acc>();

  for (const m of filtered) {
    const ref = (m as any).referee || "Unknown";
    const { home, away } = getTeamNames(m);
    const { hg, ag } = parseScoreLike(m);
    const y = cardTotal(m, "yellow");
    const r = cardTotal(m, "red");
    const p = penaltiesTotal(m);

    const acc = byRef.get(ref) ?? { matches: 0, y: 0, r: 0, p: 0, teamMatches: 0, teamWins: 0, teamLosses: 0 };
    acc.matches += 1;
    acc.y += y; acc.r += r; acc.p += p;

    if (teams.length) {
      if (teams.includes(home) || teams.includes(away)) {
        acc.teamMatches += 1;
        const selectedIsHome = teams.includes(home);
        const selectedIsAway = teams.includes(away);
        const win = (selectedIsHome && hg > ag) || (selectedIsAway && ag > hg);
        const loss = (selectedIsHome && hg < ag) || (selectedIsAway && ag < hg);
        if (win) acc.teamWins += 1;
        if (loss) acc.teamLosses += 1;
      }
    }
    byRef.set(ref, acc);
  }

  const nicest = [...byRef.entries()]
    .filter(([_, v]) => v.matches >= minMatches)
    .map(([name, v]) => ({ name, value: (v.y + v.r) / (v.matches || 1), matches: v.matches }))
    .sort((a, b) => a.value - b.value).slice(0, limit);

  const toughest = [...byRef.entries()]
    .filter(([_, v]) => v.matches >= minMatches)
    .map(([name, v]) => ({ name, value: (v.y + v.r) / (v.matches || 1), matches: v.matches }))
    .sort((a, b) => b.value - a.value).slice(0, limit);

  const mostPens = [...byRef.entries()]
    .filter(([_, v]) => v.matches >= minMatches)
    .map(([name, v]) => ({ name, value: v.p / (v.matches || 1), matches: v.matches }))
    .sort((a, b) => b.value - a.value).slice(0, limit);

  const mostInterventions = [...byRef.entries()]
    .filter(([_, v]) => v.matches >= minMatches)
    .map(([name, v]) => ({ name, value: (v.y + v.r + v.p) / (v.matches || 1), matches: v.matches }))
    .sort((a, b) => b.value - a.value).slice(0, limit);

  const bestForTeams = teams.length ? [...byRef.entries()]
    .filter(([_, v]) => v.teamMatches >= minTeamMatches)
    .map(([name, v]) => ({ name, valuePct: v.teamWins / (v.teamMatches || 1), matches: v.teamMatches }))
    .sort((a, b) => b.valuePct - a.valuePct).slice(0, limit) : [];

  const worstForTeams = teams.length ? [...byRef.entries()]
    .filter(([_, v]) => v.teamMatches >= minTeamMatches)
    .map(([name, v]) => ({ name, valuePct: v.teamLosses / (v.teamMatches || 1), matches: v.teamMatches }))
    .sort((a, b) => b.valuePct - a.valuePct).slice(0, limit) : [];

  return NextResponse.json({
    overall_total,
    filtered_total,
    nicest_refs: nicest,
    toughest_refs: toughest,
    best_for_selected_teams: bestForTeams,
    worst_for_selected_teams: worstForTeams,
    most_penalties: mostPens,
    most_interventions: mostInterventions,
  }, { headers: { "Cache-Control": "no-store" } });
}
