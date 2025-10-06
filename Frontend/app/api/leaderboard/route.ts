import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Mock leaderboard data
const mockLeaderboard = [
  {
    name: 'MOHAMMED AL-HAKIM',
    referee: 'MOHAMMED AL-HAKIM',
    matches: 20,
    avgYellow: 4.2,
    avgRed: 0.15,
    avgPenalty: 0.20,
    avgTotal: 4.35,
    totalYellow: 84,
    totalRed: 3,
    totalPenalty: 4
  },
  {
    name: 'FREDRIK KLITTE',
    referee: 'FREDRIK KLITTE',
    matches: 18,
    avgYellow: 3.8,
    avgRed: 0.11,
    avgPenalty: 0.17,
    avgTotal: 3.97,
    totalYellow: 68,
    totalRed: 2,
    totalPenalty: 3
  },
  {
    name: 'ADAM LADEBÄCK',
    referee: 'ADAM LADEBÄCK',
    matches: 18,
    avgYellow: 3.9,
    avgRed: 0.06,
    avgPenalty: 0.22,
    avgTotal: 4.16,
    totalYellow: 70,
    totalRed: 1,
    totalPenalty: 4
  },
  {
    name: 'KRISTOFFER KARLSSON',
    referee: 'KRISTOFFER KARLSSON',
    matches: 18,
    avgYellow: 3.7,
    avgRed: 0.17,
    avgPenalty: 0.11,
    avgTotal: 3.87,
    totalYellow: 67,
    totalRed: 3,
    totalPenalty: 2
  },
  {
    name: 'VICTOR WOLF',
    referee: 'VICTOR WOLF',
    matches: 18,
    avgYellow: 4.1,
    avgRed: 0.06,
    avgPenalty: 0.17,
    avgTotal: 4.27,
    totalYellow: 74,
    totalRed: 1,
    totalPenalty: 3
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const minMatches = parseInt(searchParams.get('minMatches') || '8');
    
    // Filter leaderboard based on parameters
    let filteredLeaderboard = mockLeaderboard.filter(ref => ref.matches >= minMatches);
    
    // Limit results
    filteredLeaderboard = filteredLeaderboard.slice(0, limit);
    
    return NextResponse.json(filteredLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}