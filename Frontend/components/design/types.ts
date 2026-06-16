export interface TeamBiasEntry {
  wins: number;
  matches: number;
  winRate: number;
  delta: number;
}

export interface Referee {
  name: string;
  matches: number;
  avgYellow: number;
  avgRed: number;
  avgPen: number;
  avgCards: number;
  homeWinRate: number;
  awayWinRate: number;
  drawRate: number;
  homeBiasScore: number;
  seasons: number[];
  teamBias: Record<string, TeamBiasEntry>;
}

export interface LeagueTrend {
  season: number;
  avgYellow: number;
  avgRed: number;
  avgPen: number;
  matches: number;
}

export interface RecentMatch {
  match_id: number;
  season: number;
  date: string;
  referee: string;
  home: string;
  away: string;
  score: string;
  yellow: string;
  red: string;
  penalty: string;
}

export interface RefTrend {
  season: number;
  avgCards: number;
  matches: number;
}

export interface Editorial {
  headline: string;
  lede: string;
  trend_analysis: string;
  generated_at: string;
  season: number;
}

export interface DesignData {
  referees: Referee[];
  leagueTrends: LeagueTrend[];
  recent: RecentMatch[];
  trends: Record<string, RefTrend[]>;
  teams: string[];
  seasons: number[];
  totalMatches: number;
  editorial?: Editorial;
}

export interface Filters {
  season: number | null;
  side: string | null;
  team: string | null;
  referee: string | null;
}

export interface Tweaks {
  theme: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  accent: 'terracotta' | 'forest' | 'cobalt' | 'rust';
  displayFont: 'source' | 'playfair' | 'fraunces' | 'dm';
  showSparklines: boolean;
  showLede: boolean;
}
