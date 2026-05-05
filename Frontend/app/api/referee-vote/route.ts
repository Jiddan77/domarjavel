import { NextResponse } from 'next/server';
import { addVote } from '@/lib/votes';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { referee, vote, teamPreference } = await request.json();
    if (!referee || (vote !== 'up' && vote !== 'down')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    addVote(referee, vote, teamPreference || undefined);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}
