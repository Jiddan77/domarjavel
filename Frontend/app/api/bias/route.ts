import { NextResponse } from 'next/server';
import { loadMatches, filterMatches, Match } from '@/lib/data';

export const dynamic = 'force-dynamic';

function parseScore(s: string | undefined): [number, number] {
  if (!s) return [0, 0];
  const parts = s.split('–');
  return parts.length === 2 ? [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0] : [0, 0];
}

function computeBiasScores(matches: Match[]) {
  const refs: Record<string, {
    matches: number;
    cards: number;
    homeWins: number; awayWins: number;
    homeCards: number; awayCards: number;
    teamWins: Record<string, { wins: number; matches: number }>;
  }> = {};

  for (const m of matches) {
    if (!m.referee || !m.score) continue;
    const ref = m.referee;
    if (!refs[ref]) {
      refs[ref] = { matches: 0, cards: 0, homeWins: 0, awayWins: 0, homeCards: 0, awayCards: 0, teamWins: {} };
    }
    const r = refs[ref];
    r.matches++;

    const [hs, as_] = parseScore(m.score);
    if (hs > as_) r.homeWins++; else if (as_ > hs) r.awayWins++;

    const [yh, ya] = parseScore(m.yellow);
    const [rh, ra] = parseScore(m.red);
    r.homeCards += yh + rh;
    r.awayCards += ya + ra;
    r.cards += yh + ya + rh + ra;

    for (const [team, isHome] of [[m.home, true], [m.away, false]] as [string, boolean][]) {
      if (!r.teamWins[team]) r.teamWins[team] = { wins: 0, matches: 0 };
      r.teamWins[team].matches++;
      if ((isHome && hs > as_) || (!isHome && as_ > hs)) r.teamWins[team].wins++;
    }
  }

  // League-wide averages
  const allRefs = Object.values(refs);
  const totalMatches = allRefs.reduce((s, r) => s + r.matches, 0) || 1;
  const totalCards = allRefs.reduce((s, r) => s + r.cards, 0);
  const leagueAvgCards = totalCards / totalMatches;

  return Object.entries(refs).map(([name, r]) => {
    const n = r.matches || 1;
    const cards_per_game = r.cards / n;
    const home_away_delta = r.homeWins / n - r.awayWins / n;

    // Normalize card rate score: 0.5 = league avg, 0 = no cards, 1 = 2x avg
    const card_rate_score = Math.min(1, Math.max(0, cards_per_game / (2 * (leagueAvgCards || 1))));

    // Home/away bias: abs delta normalized (0-1), max realistic delta ~0.5
    const home_away_score = Math.min(1, Math.abs(home_away_delta) / 0.5);

    // Team favoritism: std dev of win rates across teams with ≥3 matches
    const teamRates = Object.values(r.teamWins)
      .filter(t => t.matches >= 3)
      .map(t => t.wins / t.matches);
    let team_favoritism_score = 0;
    if (teamRates.length >= 2) {
      const mean = teamRates.reduce((a, b) => a + b, 0) / teamRates.length;
      const variance = teamRates.reduce((a, b) => a + (b - mean) ** 2, 0) / teamRates.length;
      team_favoritism_score = Math.min(1, Math.sqrt(variance) / 0.35);
    }

    const composite_score = Math.round(
      (0.25 * card_rate_score + 0.45 * home_away_score + 0.30 * team_favoritism_score) * 1000
    ) / 1000;

    const flagged_teams = Object.entries(r.teamWins)
      .filter(([, t]) => t.matches >= 5 && (t.wins / t.matches > 0.75 || t.wins / t.matches < 0.25))
      .map(([team]) => team);

    return {
      referee: name,
      matches: r.matches,
      composite_score,
      card_rate_score: Math.round(card_rate_score * 1000) / 1000,
      home_away_score: Math.round(home_away_score * 1000) / 1000,
      team_favoritism_score: Math.round(team_favoritism_score * 1000) / 1000,
      cards_per_game: Math.round(cards_per_game * 100) / 100,
      home_away_delta: Math.round(home_away_delta * 1000) / 1000,
      flagged_teams,
    };
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasons = searchParams.getAll('season').map(Number).filter(Boolean);
    const minMatches = parseInt(searchParams.get('minMatches') || '5');

    const all = loadMatches();
    const filtered = filterMatches(all, { seasons, finishedOnly: true });
    const scores = computeBiasScores(filtered).filter(r => r.matches >= minMatches);

    return NextResponse.json(scores);
  } catch (error) {
    console.error('Error fetching bias scores:', error);
    return NextResponse.json({ error: 'Failed to fetch bias scores' }, { status: 500 });
  }
}
