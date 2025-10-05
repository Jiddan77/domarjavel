/**
 * Hooks for using the optimized chunk system.
 * These hooks provide faster data access for common queries.
 */

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

// Types
interface SeasonStats {
  total_matches: number;
  upcoming_matches: number;
  total_yellow_cards: number;
  total_red_cards: number;
  total_penalties: number;
  avg_yellow_per_match: number;
  avg_red_per_match: number;
  avg_penalties_per_match: number;
  unique_referees: number;
  most_active_referee: [string, number];
  last_updated: string;
}

interface TeamStats {
  [teamName: string]: {
    total_matches: number;
    home_matches: number;
    away_matches: number;
    finished_matches: number;
    yellow_cards_for: number;
    yellow_cards_against: number;
    red_cards_for: number;
    red_cards_against: number;
    penalties_for: number;
    penalties_against: number;
    avg_yellow_for?: number;
    avg_yellow_against?: number;
    avg_red_for?: number;
    avg_red_against?: number;
  };
}

interface RefereeStats {
  [refereeName: string]: {
    matches: number;
    total_yellow: number;
    total_red: number;
    total_penalties: number;
    avg_yellow: number;
    avg_red: number;
    avg_penalties: number;
  };
}

interface ChunkMatches {
  matches: any[];
  total: number;
  [key: string]: any;
}

interface GlobalIndex {
  seasons: number[];
  teams: Array<{ name: string; slug: string }>;
  referees: Array<{ name: string; slug: string }>;
  last_updated: string;
  total_matches: number;
}

// Hooks

/**
 * Get pre-computed season statistics (much faster than calculating on-demand)
 */
export function useSeasonStats(season: number) {
  const { data, error, isLoading } = useSWR<SeasonStats>(
    season ? `/api/chunks/season/${season}/stats` : null,
    fetcher
  );

  return {
    stats: data,
    error,
    isLoading
  };
}

/**
 * Get pre-computed team statistics for a season
 */
export function useSeasonTeamStats(season: number) {
  const { data, error, isLoading } = useSWR<TeamStats>(
    season ? `/api/chunks/season/${season}/teams` : null,
    fetcher
  );

  return {
    teamStats: data,
    error,
    isLoading
  };
}

/**
 * Get pre-computed referee statistics for a season
 */
export function useSeasonRefereeStats(season: number) {
  const { data, error, isLoading } = useSWR<RefereeStats>(
    season ? `/api/chunks/season/${season}/referees` : null,
    fetcher
  );

  return {
    refereeStats: data,
    error,
    isLoading
  };
}

/**
 * Get matches for a specific team (from pre-computed chunks)
 */
export function useTeamMatches(
  season: number,
  teamName: string,
  options: {
    side?: 'home' | 'away';
    limit?: number;
    offset?: number;
  } = {}
) {
  const { side, limit = 100, offset = 0 } = options;
  
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  
  if (side) {
    params.append('side', side);
  }

  const { data, error, isLoading } = useSWR<ChunkMatches>(
    season && teamName 
      ? `/api/chunks/season/${season}/team/${encodeURIComponent(teamName)}?${params}`
      : null,
    fetcher
  );

  return {
    matches: data?.matches || [],
    total: data?.total || 0,
    error,
    isLoading
  };
}

/**
 * Get matches for a specific referee (from pre-computed chunks)
 */
export function useRefereeMatches(
  season: number,
  refereeName: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
) {
  const { limit = 100, offset = 0 } = options;
  
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const { data, error, isLoading } = useSWR<ChunkMatches>(
    season && refereeName 
      ? `/api/chunks/season/${season}/referee/${encodeURIComponent(refereeName)}?${params}`
      : null,
    fetcher
  );

  return {
    matches: data?.matches || [],
    total: data?.total || 0,
    error,
    isLoading
  };
}

/**
 * Get season matches with status filter (from pre-computed chunks)
 */
export function useSeasonMatches(
  season: number,
  options: {
    status?: 'finished' | 'upcoming' | 'all';
    limit?: number;
    offset?: number;
  } = {}
) {
  const { status = 'all', limit = 100, offset = 0 } = options;
  
  const params = new URLSearchParams({
    status,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const { data, error, isLoading } = useSWR<ChunkMatches>(
    season 
      ? `/api/chunks/season/${season}/matches?${params}`
      : null,
    fetcher
  );

  return {
    matches: data?.matches || [],
    total: data?.total || 0,
    error,
    isLoading
  };
}

/**
 * Get global index with all available data
 */
export function useGlobalIndex() {
  const { data, error, isLoading } = useSWR<GlobalIndex>(
    '/api/chunks/index',
    fetcher
  );

  return {
    index: data,
    seasons: data?.seasons || [],
    teams: data?.teams || [],
    referees: data?.referees || [],
    error,
    isLoading
  };
}

/**
 * Get quick summary of all seasons
 */
export function useSeasonsSummary() {
  const { data, error, isLoading } = useSWR(
    '/api/chunks/seasons',
    fetcher
  );

  return {
    seasonsSummary: data,
    error,
    isLoading
  };
}

/**
 * Check chunk system health
 */
export function useChunksHealth() {
  const { data, error, isLoading } = useSWR(
    '/api/chunks/health',
    fetcher,
    {
      refreshInterval: 30000, // Check every 30 seconds
    }
  );

  return {
    health: data,
    isHealthy: data?.status === 'healthy',
    error,
    isLoading
  };
}