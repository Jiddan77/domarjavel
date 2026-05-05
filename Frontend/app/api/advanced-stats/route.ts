import { NextResponse } from 'next/server';
import { loadMatches, filterMatches, Match } from '@/lib/data';

export const dynamic = 'force-dynamic';

function parseScore(s: string | undefined): [number, number] {
  if (!s) return [0, 0];
  const parts = s.split('–');
  return parts.length === 2 ? [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0] : [0, 0];
}

function computeAdvanced(matches: Match[]) {
  const refs: Record<string, {
    matches: number;
    homeWins: number; awayWins: number; draws: number;
    homeCards: number; awayCards: number;
    homePenalties: number; awayPenalties: number;
    teamStats: Record<string, { matches: number; wins: number; cards: number; penalties: number }>;
  }> = {};

  for (const m of matches) {
    if (!m.referee || !m.score) continue;
    const ref = m.referee;
    if (!refs[ref]) {
      refs[ref] = { matches: 0, homeWins: 0, awayWins: 0, draws: 0, homeCards: 0, awayCards: 0, homePenalties: 0, awayPenalties: 0, teamStats: {} };
    }
    const r = refs[ref];
    r.matches++;

    const [hs, as] = parseScore(m.score);
    if (hs > as) r.homeWins++;
    else if (as > hs) r.awayWins++;
    else r.draws++;

    const [yh, ya] = parseScore(m.yellow);
    const [rh, ra] = parseScore(m.red);
    const [ph, pa] = parseScore(m.penalty);
    r.homeCards += yh + rh;
    r.awayCards += ya + ra;
    r.homePenalties += ph;
    r.awayPenalties += pa;

    for (const [team, isHome] of [[m.home, true], [m.away, false]] as [string, boolean][]) {
      if (!r.teamStats[team]) r.teamStats[team] = { matches: 0, wins: 0, cards: 0, penalties: 0 };
      const ts = r.teamStats[team];
      ts.matches++;
      if (isHome && hs > as) ts.wins++;
      else if (!isHome && as > hs) ts.wins++;
      ts.cards += isHome ? yh + rh : ya + ra;
      ts.penalties += isHome ? ph : pa;
    }
  }

  return Object.entries(refs).map(([name, s]) => {
    const n = s.matches || 1;
    const totalCards = s.homeCards + s.awayCards;
    const totalPenalties = s.homePenalties + s.awayPenalties;
    const homeWinRate = s.homeWins / n;
    const awayWinRate = s.awayWins / n;

    const teamPerf: Record<string, { matches: number; win_rate: number; avg_cards: number; avg_penalties: number }> = {};
    for (const [team, ts] of Object.entries(s.teamStats)) {
      teamPerf[team] = {
        matches: ts.matches,
        win_rate: Math.round((ts.wins / (ts.matches || 1)) * 1000) / 1000,
        avg_cards: Math.round((ts.cards / (ts.matches || 1)) * 100) / 100,
        avg_penalties: Math.round((ts.penalties / (ts.matches || 1)) * 100) / 100,
      };
    }

    return {
      name,
      matches: s.matches,
      home_win_rate: Math.round(homeWinRate * 1000) / 1000,
      away_win_rate: Math.round(awayWinRate * 1000) / 1000,
      draw_rate: Math.round((s.draws / n) * 1000) / 1000,
      home_bias_score: Math.round((homeWinRate - awayWinRate) * 1000) / 1000,
      home_card_rate: Math.round((s.homeCards / (totalCards || 1)) * 1000) / 1000,
      home_penalty_rate: Math.round((s.homePenalties / (totalPenalties || 1)) * 1000) / 1000,
      avg_cards_per_match: Math.round((totalCards / n) * 100) / 100,
      avg_penalties_per_match: Math.round((totalPenalties / n) * 100) / 100,
      team_performance: teamPerf,
    };
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasons = searchParams.getAll('season').map(Number).filter(Boolean);
    const teams = searchParams.getAll('team').filter(Boolean);
    const minMatches = parseInt(searchParams.get('minMatches') || '5');
    const limit = parseInt(searchParams.get('limit') || '20');

    const all = loadMatches();
    const filtered = filterMatches(all, { seasons, teams, finishedOnly: true });
    const referees = computeAdvanced(filtered)
      .filter(r => r.matches >= minMatches)
      .sort((a, b) => b.matches - a.matches)
      .slice(0, limit);

    const summary = {
      total_referees: referees.length,
      total_matches: filtered.filter(m => m.referee && m.score).length,
      avg_home_win_rate: referees.length
        ? Math.round((referees.reduce((s, r) => s + r.home_win_rate, 0) / referees.length) * 1000) / 1000
        : 0,
      avg_away_win_rate: referees.length
        ? Math.round((referees.reduce((s, r) => s + r.away_win_rate, 0) / referees.length) * 1000) / 1000
        : 0,
    };

    return NextResponse.json({ referees, summary });
  } catch (error) {
    console.error('Error fetching advanced stats:', error);
    return NextResponse.json({ error: 'Failed to fetch advanced stats' }, { status: 500 });
  }
}
