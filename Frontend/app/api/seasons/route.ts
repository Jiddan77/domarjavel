import { NextResponse } from 'next/server';
import { loadMatches } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const matches = loadMatches();
    const seasonMap: Record<number, number> = {};
    for (const m of matches) {
      if (!m.referee && m.status === 'UPCOMING') continue;
      seasonMap[m.season] = (seasonMap[m.season] ?? 0) + 1;
    }
    const result = Object.entries(seasonMap)
      .map(([season, count]) => ({ season: parseInt(season), matches: count }))
      .sort((a, b) => b.season - a.season);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 });
  }
}
