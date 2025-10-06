import { NextResponse } from 'next/server';

// Mock match data
const mockMatches = [
  {
    match_id: 6143281,
    season: 2025,
    date: "26 juli 2025",
    referee: "ADAM LADEBÄCK",
    home: "IF Brommapojkarna",
    away: "Malmö FF",
    score: "2–3",
    yellow: "2–2",
    red: "0–0",
    penalty: "0–0",
    status: "FINISHED",
    extendedStatus: "FINISHED_RECENTLY",
    date_iso: "2025-07-26T13:00:00.000Z",
    datetime: "2025-07-26 13:00"
  },
  {
    match_id: 6143283,
    season: 2025,
    date: "26 juli 2025",
    referee: "KRISTOFFER KARLSSON",
    home: "GAIS",
    away: "Halmstads BK",
    score: "1–2",
    yellow: "2–2",
    red: "0–0",
    penalty: "0–0",
    status: "FINISHED",
    extendedStatus: "FINISHED_RECENTLY",
    date_iso: "2025-07-26T15:00:00.000Z",
    datetime: "2025-07-26 15:00"
  },
  {
    match_id: 6143284,
    season: 2025,
    date: "27 juli 2025",
    referee: "RICHARD SUNDELL",
    home: "AIK",
    away: "Djurgården",
    score: "1–1",
    yellow: "3–1",
    red: "2–0",
    penalty: "0–0",
    status: "FINISHED",
    extendedStatus: "FINISHED",
    date_iso: "2025-07-27T17:00:00.000Z",
    datetime: "2025-07-27 17:00"
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.getAll('season');
    const referee = searchParams.getAll('referee');
    const team = searchParams.getAll('team');
    const side = searchParams.get('side');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeTotal = searchParams.get('includeTotal') === 'true';
    
    // Filter matches based on parameters
    let filteredMatches = [...mockMatches];
    
    if (season.length > 0) {
      const seasonNumbers = season.map(s => parseInt(s));
      filteredMatches = filteredMatches.filter(m => seasonNumbers.includes(m.season));
    }
    
    if (referee.length > 0) {
      filteredMatches = filteredMatches.filter(m => referee.includes(m.referee));
    }
    
    if (team.length > 0) {
      if (side === 'home') {
        filteredMatches = filteredMatches.filter(m => team.includes(m.home));
      } else if (side === 'away') {
        filteredMatches = filteredMatches.filter(m => team.includes(m.away));
      } else {
        filteredMatches = filteredMatches.filter(m => 
          team.includes(m.home) || team.includes(m.away)
        );
      }
    }
    
    const total = filteredMatches.length;
    const paginatedMatches = filteredMatches.slice(offset, offset + limit);
    
    if (includeTotal) {
      return NextResponse.json({
        matches: paginatedMatches,
        total: total
      });
    }
    
    return NextResponse.json(paginatedMatches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}