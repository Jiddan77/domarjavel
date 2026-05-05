import { NextResponse } from 'next/server';
import { loadMatches, filterMatches, computeRefereeStats } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasons = searchParams.getAll('season').map(Number).filter(Boolean);
    const teams = searchParams.getAll('team').filter(Boolean);
    const minMatches = parseInt(searchParams.get('minMatches') || '8');
    const limit = parseInt(searchParams.get('limit') || '10');

    const all = loadMatches();
    const filtered = filterMatches(all, { seasons, teams, finishedOnly: true });
    const refs = computeRefereeStats(filtered);

    const result = Object.entries(refs)
      .filter(([, s]) => s.matches >= minMatches)
      .map(([name, s]) => ({
        name,
        matches: s.matches,
        totalYellow: s.yellow,
        totalRed: s.red,
        totalPenalty: s.penalty,
        avgYellow: Math.round((s.yellow / s.matches) * 100) / 100,
        avgRed: Math.round((s.red / s.matches) * 100) / 100,
        avgPenalty: Math.round((s.penalty / s.matches) * 100) / 100,
        avgTotal: Math.round(((s.yellow + s.red + s.penalty) / s.matches) * 100) / 100,
      }))
      .sort((a, b) => b.avgTotal - a.avgTotal)
      .slice(0, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
