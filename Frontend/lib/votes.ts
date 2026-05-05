// In-memory vote store — resets on cold start (no external DB available)
type TeamVote = { up: number; down: number; total: number };
type VoteEntry = { up: number; down: number; total: number; by_team: Record<string, TeamVote> };

const store: Record<string, VoteEntry> = {};

export function getVotes(referee?: string): VoteEntry | Record<string, VoteEntry> {
  if (referee) {
    return store[referee] ?? { up: 0, down: 0, total: 0, by_team: {} };
  }
  return store;
}

export function addVote(referee: string, vote: 'up' | 'down', team?: string) {
  if (!store[referee]) {
    store[referee] = { up: 0, down: 0, total: 0, by_team: {} };
  }
  const entry = store[referee];
  entry[vote]++;
  entry.total++;
  if (team) {
    if (!entry.by_team[team]) entry.by_team[team] = { up: 0, down: 0, total: 0 };
    entry.by_team[team][vote]++;
    entry.by_team[team].total++;
  }
}

export function clearVotes(referee: string) {
  delete store[referee];
}

export function clearAllVotes() {
  Object.keys(store).forEach(k => delete store[k]);
}
