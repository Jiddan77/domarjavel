import { NextResponse } from 'next/server';
import { loadMatches, filterMatches } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasons = searchParams.getAll('season').map(Number).filter(Boolean);
    const referees = searchParams.getAll('referee').filter(Boolean);
    const teams = searchParams.getAll('team').filter(Boolean);
    const side = searchParams.get('side') ?? undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeTotal = searchParams.get('includeTotal') === 'true';

    const all = loadMatches();
    const filtered = filterMatches(all, { seasons, referees, teams, side });
    // Sort: finished (with referee) first, then by match_id desc
    filtered.sort((a, b) => {
      const af = a.referee ? 1 : 0;
      const bf = b.referee ? 1 : 0;
      if (af !== bf) return bf - af;
      return b.match_id - a.match_id;
    });

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    if (includeTotal) {
      return NextResponse.json({ matches: page, total });
    }
    return NextResponse.json(page);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
