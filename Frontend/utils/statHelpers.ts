export function calculateRefereeStats(matches) {
    const stats = {};
  
    matches.forEach((match) => {
      const ref = match.referee;
      if (!ref) return;
  
      if (!stats[ref]) {
        stats[ref] = { name: ref, cards: 0, red: 0, penalties: 0, matches: 0 };
      }
  
      stats[ref].cards += (match.home_cards || 0) + (match.away_cards || 0);
      stats[ref].red += (match.home_red || 0) + (match.away_red || 0);
      stats[ref].penalties += (match.home_penalties || 0) + (match.away_penalties || 0);
      stats[ref].matches += 1;
    });
  
    const all = Object.values(stats).map((ref: any) => ({
      name: ref.name,
      avgCards: +(ref.cards / ref.matches).toFixed(2),
      penalties: ref.penalties,
      red: ref.red,
    }));
  
    return {
      all,
      kindest: [...all].sort((a, b) => a.avgCards - b.avgCards).slice(0, 5),
      strictest: [...all].sort((a, b) => b.avgCards - a.avgCards).slice(0, 5),
      homeWinners: [],
      awayWinners: [],
      penaltiesGiven: [...all].sort((a, b) => b.penalties - a.penalties).slice(0, 5),
      mostDramatic: [...all]
        .sort((a, b) => (b.avgCards + b.penalties) - (a.avgCards + a.penalties))
        .slice(0, 5)
    };
  }
  