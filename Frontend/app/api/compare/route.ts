import { NextResponse } from 'next/server';
import { loadMatches, filterMatches, Match } from '@/lib/data';

export const dynamic = 'force-dynamic';

function parseScore(s: string | undefined): [number, number] {
  if (!s) return [0, 0];
  const parts = s.split('–');
  return parts.length === 2 ? [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0] : [0, 0];
}

function computeRefStats(matches: Match[]) {
  const refs: Record<string, {
    matches: number; cards: number; penalties: number;
    homeWins: number; awayWins: number;
    homeCards: number; awayCards: number;
    teamWins: Record<string, { wins: number; matches: number }>;
  }> = {};

  for (const m of matches) {
    if (!m.referee || !m.score) continue;
    const ref = m.referee;
    if (!refs[ref]) {
      refs[ref] = { matches: 0, cards: 0, penalties: 0, homeWins: 0, awayWins: 0, homeCards: 0, awayCards: 0, teamWins: {} };
    }
    const r = refs[ref];
    r.matches++;

    const [hs, as_] = parseScore(m.score);
    if (hs > as_) r.homeWins++; else if (as_ > hs) r.awayWins++;

    const [yh, ya] = parseScore(m.yellow);
    const [rh, ra] = parseScore(m.red);
    const [ph, pa] = parseScore(m.penalty);
    r.homeCards += yh + rh;
    r.awayCards += ya + ra;
    r.cards += yh + ya + rh + ra;
    r.penalties += ph + pa;

    for (const [team, isHome] of [[m.home, true], [m.away, false]] as [string, boolean][]) {
      if (!r.teamWins[team]) r.teamWins[team] = { wins: 0, matches: 0 };
      r.teamWins[team].matches++;
      if ((isHome && hs > as_) || (!isHome && as_ > hs)) r.teamWins[team].wins++;
    }
  }
  return refs;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const referees = searchParams.getAll('referee').filter(Boolean);
    const seasons = searchParams.getAll('season').map(Number).filter(Boolean);

    if (referees.length < 2) {
      return NextResponse.json({ error: 'At least 2 referees required' }, { status: 400 });
    }

    const all = loadMatches();
    const filtered = filterMatches(all, { seasons, finishedOnly: true });
    const allStats = computeRefStats(filtered);

    // League averages (all refs)
    const allVals = Object.values(allStats);
    const totalN = allVals.reduce((s, r) => s + r.matches, 0) || 1;
    const leagueCards = allVals.reduce((s, r) => s + r.cards, 0);
    const leaguePenalties = allVals.reduce((s, r) => s + r.penalties, 0);
    const leagueHomeCards = allVals.reduce((s, r) => s + r.homeCards, 0);
    const leagueHomeCardAdv = leagueHomeCards / (leagueCards || 1) - 0.5;

    const leagueAvgCardsPG = leagueCards / totalN;
    const leagueAvgPenaltiesPG = leaguePenalties / totalN;

    const result = referees.map(name => {
      const r = allStats[name];
      if (!r) return null;
      const n = r.matches || 1;
      const cards_per_game = r.cards / n;
      const penalties_per_game = r.penalties / n;
      const home_card_advantage = r.homeCards / (r.cards || 1) - 0.5;
      const home_away_delta = r.homeWins / n - r.awayWins / n;

      // Bias scores
      const card_rate_score = Math.min(1, Math.max(0, cards_per_game / (2 * (leagueAvgCardsPG || 1))));
      const home_away_score = Math.min(1, Math.abs(home_away_delta) / 0.5);

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
        name,
        matches: r.matches,
        cards_per_game: Math.round(cards_per_game * 100) / 100,
        penalties_per_game: Math.round(penalties_per_game * 100) / 100,
        home_card_advantage: Math.round(home_card_advantage * 1000) / 1000,
        bias: {
          composite_score,
          card_rate_score: Math.round(card_rate_score * 1000) / 1000,
          home_away_score: Math.round(home_away_score * 1000) / 1000,
          team_favoritism_score: Math.round(team_favoritism_score * 1000) / 1000,
          flagged_teams,
        },
      };
    }).filter(Boolean);

    return NextResponse.json({
      referees: result,
      league_avg: {
        cards_per_game: Math.round(leagueAvgCardsPG * 100) / 100,
        penalties_per_game: Math.round(leagueAvgPenaltiesPG * 100) / 100,
        home_card_advantage: Math.round(leagueHomeCardAdv * 1000) / 1000,
      },
    });
  } catch (error) {
    console.error('Error fetching compare data:', error);
    return NextResponse.json({ error: 'Failed to fetch compare data' }, { status: 500 });
  }
}
