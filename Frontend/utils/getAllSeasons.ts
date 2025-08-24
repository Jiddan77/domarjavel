export function getAllSeasons(matches: { season: number }[]): string[] {
  const seasonsSet: Record<string, boolean> = {};

  for (const match of matches) {
    seasonsSet[String(match.season)] = true;
  }

  return Object.keys(seasonsSet).sort((a, b) => b.localeCompare(a));
}
