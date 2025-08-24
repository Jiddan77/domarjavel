export function getAllTeams(matches: { home: string; away: string }[]): string[] {
  const teamsSet: Record<string, boolean> = {};

  for (const match of matches) {
    teamsSet[match.home] = true;
    teamsSet[match.away] = true;
  }

  return Object.keys(teamsSet).sort((a, b) => a.localeCompare(b, "sv"));
}
