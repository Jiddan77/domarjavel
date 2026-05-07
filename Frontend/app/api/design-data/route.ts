import { NextResponse } from 'next/server';
import { loadMatches } from '@/lib/data';

const SWEDISH_MONTHS: Record<string, string> = {
  januari: '01', februari: '02', mars: '03', april: '04',
  maj: '05', juni: '06', juli: '07', augusti: '08',
  september: '09', oktober: '10', november: '11', december: '12',
};

function toIso(date: string): string {
  const parts = date.trim().split(' ');
  if (parts.length !== 3) return date;
  const [day, month, year] = parts;
  const m = SWEDISH_MONTHS[month.toLowerCase()];
  if (!m) return date;
  return `${year}-${m}-${day.padStart(2, '0')}`;
}

function toTitleCase(name: string): string {
  return name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function parsePair(s: string | undefined): [number, number] {
  if (!s) return [0, 0];
  const parts = s.split('–');
  if (parts.length !== 2) return [0, 0];
  return [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0];
}

let _cache: ReturnType<typeof buildData> | null = null;

function buildData() {
  const raw = loadMatches();

  // Only finished matches with a referee
  const matches = raw
    .filter(m => m.referee && m.score)
    .map(m => ({
      ...m,
      referee: toTitleCase(m.referee!),
      isoDate: m.date ? toIso(m.date) : '',
    }));

  // Seasons list
  const seasonsSet = new Set<number>();
  matches.forEach(m => seasonsSet.add(m.season));
  const seasons = Array.from(seasonsSet).sort();

  // Teams list
  const teamsSet = new Set<string>();
  matches.forEach(m => { teamsSet.add(m.home); teamsSet.add(m.away); });
  const teams = Array.from(teamsSet).sort();

  // Per-referee aggregation
  type RefData = {
    name: string;
    matchCount: number;
    yellowTotal: number;
    redTotal: number;
    penTotal: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    seasonsSet: Set<number>;
    seasonStats: Map<number, { matches: number; yellowTotal: number }>;
    teamStats: Map<string, { wins: number; matches: number }>;
  };

  const refMap = new Map<string, RefData>();
  const teamOverall = new Map<string, { wins: number; matches: number }>();

  matches.forEach(m => {
    const ref = m.referee!;
    if (!refMap.has(ref)) {
      refMap.set(ref, {
        name: ref,
        matchCount: 0,
        yellowTotal: 0,
        redTotal: 0,
        penTotal: 0,
        homeWins: 0,
        awayWins: 0,
        draws: 0,
        seasonsSet: new Set(),
        seasonStats: new Map(),
        teamStats: new Map(),
      });
    }
    const r = refMap.get(ref)!;
    r.matchCount++;
    const [yh, ya] = parsePair(m.yellow);
    const [rh, ra] = parsePair(m.red);
    const [ph, pa] = parsePair(m.penalty);
    r.yellowTotal += yh + ya;
    r.redTotal += rh + ra;
    r.penTotal += ph + pa;

    const [sh, sa] = parsePair(m.score);
    const homeWon = sh > sa;
    const awayWon = sa > sh;
    if (homeWon) r.homeWins++;
    else if (awayWon) r.awayWins++;
    else r.draws++;

    for (const [team, won] of [[m.home, homeWon], [m.away, awayWon]] as [string, boolean][]) {
      const ts = r.teamStats.get(team) || { wins: 0, matches: 0 };
      ts.matches++;
      if (won) ts.wins++;
      r.teamStats.set(team, ts);

      const tot = teamOverall.get(team) || { wins: 0, matches: 0 };
      tot.matches++;
      if (won) tot.wins++;
      teamOverall.set(team, tot);
    }

    r.seasonsSet.add(m.season);

    const ss = r.seasonStats.get(m.season) || { matches: 0, yellowTotal: 0 };
    ss.matches++;
    ss.yellowTotal += yh + ya;
    r.seasonStats.set(m.season, ss);
  });

  const referees = Array.from(refMap.values()).map(r => {
    const n = r.matchCount || 1;
    const avgYellow = r.yellowTotal / n;
    const avgRed = r.redTotal / n;
    const avgPen = r.penTotal / n;
    const homeWinRate = r.homeWins / n;
    const awayWinRate = r.awayWins / n;
    const drawRate = r.draws / n;
    const homeBiasScore = homeWinRate - 0.435;

    const teamBias: Record<string, { wins: number; matches: number; winRate: number; delta: number }> = {};
    r.teamStats.forEach((ts, team) => {
      if (ts.matches < 3) return;
      const tot = teamOverall.get(team);
      if (!tot || tot.matches === 0) return;
      const winRate = ts.wins / ts.matches;
      const overallRate = tot.wins / tot.matches;
      teamBias[team] = { wins: ts.wins, matches: ts.matches, winRate, delta: winRate - overallRate };
    });

    return {
      name: r.name,
      matches: r.matchCount,
      avgYellow,
      avgRed,
      avgPen,
      avgCards: avgYellow + avgRed,
      homeWinRate,
      awayWinRate,
      drawRate,
      homeBiasScore,
      seasons: Array.from(r.seasonsSet).sort(),
      teamBias,
    };
  });

  // Per-season league trends
  type SeasonTrend = {
    yellowTotal: number; redTotal: number; penTotal: number; matchCount: number;
  };
  const seasonTrendMap = new Map<number, SeasonTrend>();
  matches.forEach(m => {
    const st = seasonTrendMap.get(m.season) || { yellowTotal: 0, redTotal: 0, penTotal: 0, matchCount: 0 };
    const [yh, ya] = parsePair(m.yellow);
    const [rh, ra] = parsePair(m.red);
    const [ph, pa] = parsePair(m.penalty);
    st.yellowTotal += yh + ya;
    st.redTotal += rh + ra;
    st.penTotal += ph + pa;
    st.matchCount++;
    seasonTrendMap.set(m.season, st);
  });
  const leagueTrends = seasons.map(s => {
    const st = seasonTrendMap.get(s)!;
    const n = st.matchCount || 1;
    return {
      season: s,
      avgYellow: st.yellowTotal / n,
      avgRed: st.redTotal / n,
      avgPen: st.penTotal / n,
      matches: st.matchCount,
    };
  });

  // Per-referee per-season trends
  const trends: Record<string, Array<{ season: number; avgCards: number; matches: number }>> = {};
  refMap.forEach((r, name) => {
    trends[name] = seasons
      .filter(s => r.seasonStats.has(s))
      .map(s => {
        const ss = r.seasonStats.get(s)!;
        return { season: s, avgCards: ss.yellowTotal / ss.matches, matches: ss.matches };
      });
  });

  // 100 most recent matches
  const sorted = [...matches].sort((a, b) => {
    if (a.isoDate > b.isoDate) return -1;
    if (a.isoDate < b.isoDate) return 1;
    return 0;
  });
  const recent = sorted.slice(0, 100).map(m => ({
    match_id: m.match_id,
    season: m.season,
    date: m.isoDate || m.date || '',
    referee: m.referee!,
    home: m.home,
    away: m.away,
    score: m.score || '',
    yellow: m.yellow || '0–0',
    red: m.red || '0–0',
    penalty: m.penalty || '0–0',
  }));

  return {
    referees,
    leagueTrends,
    recent,
    trends,
    teams,
    seasons,
    totalMatches: matches.length,
  };
}

export async function GET() {
  if (!_cache) _cache = buildData();
  return NextResponse.json(_cache);
}
