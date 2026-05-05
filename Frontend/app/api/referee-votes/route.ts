import { NextResponse } from 'next/server';
import { getVotes } from '@/lib/votes';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const referee = searchParams.get('referee') || undefined;
  return NextResponse.json(getVotes(referee));
}
