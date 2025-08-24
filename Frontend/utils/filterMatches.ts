export function filterMatches(matches: any[], filters: {
    referees: string[],
    teams: string[],
    seasons: string[],
    homeAway: string[],
  }) {
    return matches.filter(match => {
      const refereeOk = filters.referees.length === 0 || filters.referees.includes(match.referee);
      const seasonOk = filters.seasons.length === 0 || filters.seasons.includes(String(match.season));
      const teamOk =
        filters.teams.length === 0 ||
        filters.teams.includes(match.home) ||
        filters.teams.includes(match.away);
      const homeAwayOk =
        filters.homeAway.length === 0 ||
        (filters.homeAway.includes('Hemma') && match.is_home) ||
        (filters.homeAway.includes('Borta') && !match.is_home);
  
      return refereeOk && seasonOk && teamOk && homeAwayOk;
    });
  }
  