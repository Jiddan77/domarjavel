import { NextResponse } from 'next/server';

// Mock team data
const mockTeams = [
  { name: 'Malmö FF', matches: 30 },
  { name: 'AIK', matches: 30 },
  { name: 'Djurgården', matches: 30 },
  { name: 'Hammarby', matches: 30 },
  { name: 'IFK Göteborg', matches: 30 },
  { name: 'BK Häcken', matches: 30 },
  { name: 'IF Elfsborg', matches: 30 },
  { name: 'IFK Norrköping', matches: 30 },
  { name: 'Kalmar FF', matches: 30 },
  { name: 'Örebro SK', matches: 30 },
  { name: 'Varbergs BoIS', matches: 30 },
  { name: 'Helsingborg', matches: 30 },
  { name: 'GAIS', matches: 30 },
  { name: 'Halmstads BK', matches: 30 },
  { name: 'IK Sirius', matches: 30 },
  { name: 'Degerfors IF', matches: 30 }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minMatches = parseInt(searchParams.get('minMatches') || '1');
    
    // Filter teams by minimum matches
    const filteredTeams = mockTeams.filter(team => team.matches >= minMatches);
    
    return NextResponse.json(filteredTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}