import { NextResponse } from 'next/server';
import { loadMatches } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasons = searchParams.getAll('season').map(Number).filter(Boolean);
    const minMatches = parseInt(searchParams.get('minMatches') || '1');

    const matches = loadMatches();
    const teamMap: Record<string, number> = {};
    for (const m of matches) {
      if (seasons.length && !seasons.includes(m.season)) continue;
      teamMap[m.home] = (teamMap[m.home] ?? 0) + 1;
      teamMap[m.away] = (teamMap[m.away] ?? 0) + 1;
    }
    const result = Object.entries(teamMap)
      .map(([name, count]) => ({ name, matches: count }))
      .filter(t => t.matches >= minMatches)
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}
