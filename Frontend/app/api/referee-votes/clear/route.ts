import { NextResponse } from 'next/server';
import { clearVotes } from '@/lib/votes';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { referee } = await request.json();
    if (!referee) return NextResponse.json({ error: 'referee required' }, { status: 400 });
    clearVotes(referee);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to clear votes' }, { status: 500 });
  }
}
