import { NextResponse } from "next/server";
import { loadMatches, parseCSV, Match } from "@/lib/loadData";

const toNumArr = (xs: string[]) => xs.map(n => Number(n)).filter(Number.isFinite);
const norm = (s: any) => (s ?? "").toString().trim().replace(/\s+/g, " ").toUpperCase();
const num = (...vals: any[]) => { for (const v of vals) { const n = typeof v === "string" ? Number(v) : v; if (Number.isFinite(n)) return Number(n); } return 0; };

function names(m: any) {
  const home = m.home_team ?? m.home ?? m.homeTeam ?? m.home_name ?? m.team_home ?? m.homeTeamName ?? m.home_club ?? "";
  const away = m.away_team ?? m.away ?? m.awayTeam ?? m.away_name ?? m.team_away ?? m.awayTeamName ?? m.away_club ?? "";
  return { home, away, hN: norm(home), aN: norm(away) };
}

function parseScore(m: any) {
  let hg = num(m.home_goals, m.goals_home, m.homeGoals, m.score_home, m.home_score);
  let ag = num(m.away_goals, m.goals_away, m.awayGoals, m.score_away, m.away_score);
  if (hg === 0 && ag === 0) {
    const cand = [m.score, m.result, m.final_score, m.full_time, m.ft, m.end_result];
    for (const s of cand) if (typeof s === "string") { const r = s.match(/(\d+)\D+(\d+)/); if (r) { hg = +r[1]; ag = +r[2]; break; } }
  }
  return { hg, ag };
}

// generisk fallback: leta numeric på kända nycklar även i m.stats/cards/penalties
function cardTotal(m: any, kind: "yellow" | "red"): number {
  const h = num(m[`${kind}_cards_home`], m[`${kind}CardsHome`], m?.cards?.[kind]?.home, m?.[`${kind}`]?.home, m?.stats?.cards?.[kind]?.home);
  const a = num(m[`${kind}_cards_away`], m[`${kind}CardsAway`], m?.cards?.[kind]?.away, m?.[`${kind}`]?.away, m?.stats?.cards?.[kind]?.away);
  let tot = h + a;
  if (tot === 0) tot = num(m[`${kind}_cards`], m[`${kind}Cards`], m?.cards?.[kind]?.total, m?.[`${kind}`]?.total, m?.stats?.cards?.[kind]?.total);
  if (tot === 0) {
    const ev = (m.events ?? m.timeline ?? []) as any[];
    if (Array.isArray(ev)) {
      const key = kind === "yellow" ? "yellow" : "red";
      tot = ev.filter(e => (e.type ?? e.event ?? e.kind ?? "").toString().toLowerCase().includes(key) && !(e.type ?? "").toString().toLowerCase().includes("second")).length;
    }
  }
  return tot;
}

function pensTotal(m: any) {
  const h = num(m.penalties_home, m.penalty_home, m.penaltiesHome, m?.penalties?.home, m?.stats?.penalties?.home);
  const a = num(m.penalties_away, m.penalty_away, m.penaltiesAway, m?.penalties?.away, m?.stats?.penalties?.away);
  let tot = h + a;
  if (tot === 0) tot = num(m.penalties, m.penalty_total, m?.penalties?.total, m?.stats?.penalties?.total);
  if (tot === 0) {
    const ev = (m.events ?? m.timeline ?? []) as any[];
    if (Array.isArray(ev)) tot = ev.filter(e => (e.type ?? e.event ?? e.kind ?? "").toString().toLowerCase().match(/pen|straff/)).length;
  }
  return tot;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seasons = toNumArr(parseCSV(searchParams.get("season")));
  const referees = parseCSV(searchParams.get("referee")).map(norm);
  const teams = parseCSV(searchParams.get("team")).map(norm);
  const side = searchParams.get("side");

  const matches = (await loadMatches()).filter((m: Match & any) => {
    const ms = Number(m.season);
    const { hN, aN } = names(m);
    if (seasons.length && !seasons.includes(ms)) return false;
    if (referees.length && !referees.includes(norm(m.referee))) return false;
    if (teams.length && !(teams.includes(hN) || teams.includes(aN))) return false;
    if (side && m.home_away && m.home_away !== side) return false;
    return true;
  });

  const total = matches.length;
  let goalsHome = 0, goalsAway = 0, ycTot = 0, rcTot = 0, pensTot = 0;
  let anyYellow = 0, anyRed = 0, anyPen = 0;
  let homeW = 0, draws = 0, awayW = 0;

  // team-specifikt
  const oneTeam = teams.length === 1 ? teams[0] : null;
  let tWins = 0, tDraws = 0, tLosses = 0, tGF = 0, tGA = 0;
  let teamNamePretty: string | null = null;

  for (const m of matches) {
    const { home, away, hN, aN } = names(m);
    const { hg, ag } = parseScore(m);
    goalsHome += hg; goalsAway += ag;

    const y = cardTotal(m, "yellow");
    const r = cardTotal(m, "red");
    const p = pensTotal(m);
    ycTot += y; rcTot += r; pensTot += p;
    anyYellow += y > 0 ? 1 : 0;
    anyRed += r > 0 ? 1 : 0;
    anyPen += p > 0 ? 1 : 0;

    if (hg > ag) homeW++; else if (hg < ag) awayW++; else draws++;

    if (oneTeam) {
      if (hN === oneTeam || aN === oneTeam) {
        teamNamePretty = hN === oneTeam ? home : away;
        const gf = hN === oneTeam ? hg : ag;
        const ga = hN === oneTeam ? ag : hg;
        tGF += gf; tGA += ga;
        if (gf > ga) tWins++; else if (gf < ga) tLosses++; else tDraws++;
      }
    }
  }

  return NextResponse.json({
    total_matches: total,
    goals: { home: goalsHome, away: goalsAway, avg_per_match: (goalsHome + goalsAway) / (total || 1) },
    cards: { yellow_total: ycTot, red_total: rcTot, p_any_yellow: anyYellow / (total || 1), p_any_red: anyRed / (total || 1) },
    penalties: { total: pensTot, p_any_penalty: anyPen / (total || 1) },
    outcomes: {
      home_wins: homeW, draws, away_wins: awayW,
      ...(oneTeam && teamNamePretty ? { team: { name: teamNamePretty, wins: tWins, draws: tDraws, losses: tLosses, goals_for: tGF, goals_against: tGA } } : {})
    }
  }, { headers: { "Cache-Control": "no-store" } });
}
