import { NextResponse } from 'next/server';

// Mock data for now - replace with actual data source
const mockSeasons = [
  { season: 2025, matches: 240 },
  { season: 2024, matches: 240 },
  { season: 2023, matches: 240 },
  { season: 2022, matches: 240 },
  { season: 2021, matches: 240 },
  { season: 2020, matches: 240 }
];

export async function GET() {
  try {
    return NextResponse.json(mockSeasons);
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seasons' },
      { status: 500 }
    );
  }
}