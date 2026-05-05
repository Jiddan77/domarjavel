import { NextResponse } from 'next/server';
import { clearAllVotes } from '@/lib/votes';

export const dynamic = 'force-dynamic';

export async function POST() {
  clearAllVotes();
  return NextResponse.json({ ok: true });
}
