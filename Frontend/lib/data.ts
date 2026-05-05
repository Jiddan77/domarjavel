import path from 'path';
import fs from 'fs';

export interface Match {
  match_id: number;
  season: number;
  date?: string;
  referee?: string;
  home: string;
  away: string;
  score?: string;
  yellow?: string;
  red?: string;
  penalty?: string;
  status?: string;
  extendedStatus?: string;
}

let _cache: Match[] | null = null;

export function loadMatches(): Match[] {
  if (_cache) return _cache;
  const dataPath = path.join(process.cwd(), 'data', 'data.json');
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const matches: Match[] = Array.isArray(raw) ? raw : raw.matches ?? [];
  _cache = matches;
  return matches;
}

function parseScore(s: string | undefined): [number, number] {
  if (!s) return [0, 0];
  const parts = s.split('–');
  if (parts.length !== 2) return [0, 0];
  return [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0];
}

export function filterMatches(
  matches: Match[],
  {
    seasons,
    referees,
    teams,
    side,
    finishedOnly = false,
  }: {
    seasons?: number[];
    referees?: string[];
    teams?: string[];
    side?: string;
    finishedOnly?: boolean;
  }
): Match[] {
  return matches.filter(m => {
    if (seasons?.length && !seasons.includes(m.season)) return false;
    if (referees?.length && !referees.includes(m.referee ?? '')) return false;
    if (finishedOnly && m.status && m.status !== 'FINISHED') return false;
    if (finishedOnly && !m.referee) return false;
    if (teams?.length) {
      if (side === 'home') return teams.includes(m.home);
      if (side === 'away') return teams.includes(m.away);
      return teams.includes(m.home) || teams.includes(m.away);
    }
    return true;
  });
}

export function computeStats(matches: Match[]) {
  const finished = matches.filter(m => m.referee && m.yellow !== undefined);
  let totalYellow = 0, totalRed = 0, totalPenalty = 0;
  for (const m of finished) {
    const [yh, ya] = parseScore(m.yellow);
    const [rh, ra] = parseScore(m.red);
    const [ph, pa] = parseScore(m.penalty);
    totalYellow += yh + ya;
    totalRed += rh + ra;
    totalPenalty += ph + pa;
  }
  const n = finished.length || 1;
  return {
    totalMatches: finished.length,
    totalYellow,
    totalRed,
    totalPenalty,
    avgYellow: Math.round((totalYellow / n) * 100) / 100,
    avgRed: Math.round((totalRed / n) * 100) / 100,
    avgPenalty: Math.round((totalPenalty / n) * 100) / 100,
  };
}

export function computeRefereeStats(matches: Match[]) {
  const refs: Record<string, { matches: number; yellow: number; red: number; penalty: number }> = {};
  for (const m of matches) {
    if (!m.referee || !m.yellow) continue;
    if (!refs[m.referee]) refs[m.referee] = { matches: 0, yellow: 0, red: 0, penalty: 0 };
    const [yh, ya] = parseScore(m.yellow);
    const [rh, ra] = parseScore(m.red);
    const [ph, pa] = parseScore(m.penalty);
    refs[m.referee].matches++;
    refs[m.referee].yellow += yh + ya;
    refs[m.referee].red += rh + ra;
    refs[m.referee].penalty += ph + pa;
  }
  return refs;
}
