import { NextResponse } from 'next/server';

// Mock statistics data
const mockStats = {
  totalMatches: 208,
  totalYellow: 805,
  totalRed: 21,
  totalPenalty: 36,
  avgYellow: 3.87,
  avgRed: 0.10,
  avgPenalty: 0.17
};

export async function GET() {
  try {
    // Parameters available for future filtering implementation
    // const { searchParams } = new URL(request.url);
    // const season = searchParams.getAll('season');
    // const referee = searchParams.getAll('referee');
    // const team = searchParams.getAll('team');
    // const side = searchParams.get('side');
    
    // In a real implementation, you would filter the stats based on these parameters
    // For now, return mock data
    
    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}