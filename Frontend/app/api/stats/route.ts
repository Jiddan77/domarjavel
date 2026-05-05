import { NextResponse } from 'next/server';
import { loadMatches, filterMatches, computeStats } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasons = searchParams.getAll('season').map(Number).filter(Boolean);
    const referees = searchParams.getAll('referee').filter(Boolean);
    const teams = searchParams.getAll('team').filter(Boolean);
    const side = searchParams.get('side') ?? undefined;

    const all = loadMatches();
    const filtered = filterMatches(all, { seasons, referees, teams, side, finishedOnly: true });
    return NextResponse.json(computeStats(filtered));
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
