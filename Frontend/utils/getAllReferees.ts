export function getAllReferees(matches: any[]): string[] {
    const all = matches
      .map(match => match.referee)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);
    return all.sort((a, b) => a.localeCompare(b, 'sv'));
  }
  