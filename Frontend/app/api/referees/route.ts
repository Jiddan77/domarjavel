import { NextResponse } from 'next/server';

// Mock referee data
const mockReferees = [
  { name: 'MOHAMMED AL-HAKIM', matches: 20 },
  { name: 'FREDRIK KLITTE', matches: 18 },
  { name: 'ADAM LADEBÄCK', matches: 18 },
  { name: 'KRISTOFFER KARLSSON', matches: 18 },
  { name: 'VICTOR WOLF', matches: 18 },
  { name: 'GRANIT MAQEDONCI', matches: 16 },
  { name: 'OSCAR JOHNSON', matches: 15 },
  { name: 'TESS OLOFSSON', matches: 14 },
  { name: 'RICHARD SUNDELL', matches: 12 },
  { name: 'ADI AGANOVIC', matches: 12 }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minMatches = parseInt(searchParams.get('minMatches') || '1');
    
    // Filter referees by minimum matches
    const filteredReferees = mockReferees.filter(ref => ref.matches >= minMatches);
    
    return NextResponse.json(filteredReferees);
  } catch (error) {
    console.error('Error fetching referees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referees' },
      { status: 500 }
    );
  }
}