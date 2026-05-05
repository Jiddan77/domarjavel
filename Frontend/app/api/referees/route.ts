import { NextResponse } from 'next/server';
import { loadMatches } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasons = searchParams.getAll('season').map(Number).filter(Boolean);
    const minMatches = parseInt(searchParams.get('minMatches') || '1');

    const matches = loadMatches();
    const refMap: Record<string, number> = {};
    for (const m of matches) {
      if (!m.referee) continue;
      if (seasons.length && !seasons.includes(m.season)) continue;
      refMap[m.referee] = (refMap[m.referee] ?? 0) + 1;
    }
    const result = Object.entries(refMap)
      .map(([name, count]) => ({ name, matches: count }))
      .filter(r => r.matches >= minMatches)
      .sort((a, b) => b.matches - a.matches);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching referees:', error);
    return NextResponse.json({ error: 'Failed to fetch referees' }, { status: 500 });
  }
}
