'use client';

import { useMemo } from 'react';

type Match = {
  match_id: number;
  referee: string;
  home: string;
  away: string;
  score: string;
  yellow: string;
  red: string;
  penalty: string;
};

type RefStats = {
  referee: string;
  matches: number;
  yellow: number;
  red: number;
  penalty: number;
  wins: number;
  losses: number;
};

function parseStat(stat: string): [number, number] {
  const parts = stat.split('–').map(Number);
  return [parts[0], parts[1]];
}

function buildStats(matches: Match[], selectedTeams: string[]): RefStats[] {
  const stats: Record<string, RefStats> = {};

  for (const match of matches) {
    if (!match.referee) continue;

    const [gH, gA] = parseStat(match.score);
    const [yH, yA] = parseStat(match.yellow);
    const [rH, rA] = parseStat(match.red);
    const [pH, pA] = parseStat(match.penalty);

    const teamsToCheck = selectedTeams.length > 0 ? selectedTeams : [match.home, match.away];

    for (const team of teamsToCheck) {
      const isHome = match.home === team;
      const isAway = match.away === team;
      if (!isHome && !isAway) continue;

      const ref = stats[match.referee] ?? {
        referee: match.referee,
        matches: 0,
        yellow: 0,
        red: 0,
        penalty: 0,
        wins: 0,
        losses: 0,
      };

      const teamGoals = isHome ? gH : gA;
      const oppGoals = isHome ? gA : gH;
      const teamY = isHome ? yH : yA;
      const teamR = isHome ? rH : rA;
      const teamP = isHome ? pH : pA;

      ref.matches += 1;
      ref.yellow += teamY;
      ref.red += teamR;
      ref.penalty += teamP;
      if (teamGoals > oppGoals) ref.wins += 1;
      if (teamGoals < oppGoals) ref.losses += 1;

      stats[match.referee] = ref;
    }
  }

  return Object.values(stats).filter(r => r.matches >= 3);
}

function top<T>(list: T[], count = 5) {
  return list.slice(0, count);
}

export default function RefereeOverview({
  allMatches,
  selectedTeams,
}: {
  allMatches: Match[];
  selectedTeams: string[];
}) {
  const stats = useMemo(() => buildStats(allMatches, selectedTeams), [allMatches, selectedTeams]);

  const mostCards = top([...stats].sort((a, b) => (b.yellow + b.red) / b.matches - (a.yellow + a.red) / a.matches));
  const leastCards = top([...stats].sort((a, b) => (a.yellow + a.red) / a.matches - (b.yellow + b.red) / b.matches));
  const mostPenalties = top([...stats].sort((a, b) => b.penalty / b.matches - a.penalty / a.matches));
  const bestForTeam = top([...stats].sort((a, b) => b.wins / b.matches - a.wins / a.matches));
  const worstForTeam = top([...stats].sort((a, b) => b.losses / b.matches - a.losses / a.matches));
  const spotlight = top([...stats].sort((a, b) =>
    (b.yellow + b.red + b.penalty) / b.matches - (a.yellow + a.red + a.penalty) / a.matches
  ));

  const renderList = (title: string, data: RefStats[], valueFn: (r: RefStats) => string) => (
    <div className="bg-white/5 rounded-xl p-4 space-y-2">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <ul className="space-y-1">
        {data.map(ref => (
          <li key={ref.referee} className="flex justify-between text-sm">
            <span>{ref.referee}</span>
            <span>{valueFn(ref)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  const formatTeamList = (teams: string[]) =>
    teams.length === 1
      ? teams[0]
      : teams.slice(0, -1).join(', ') + ' och ' + teams.slice(-1);
  
      return (
        <section className="mt-8 space-y-4">
          <div>
            {selectedTeams.length > 0 ? (
              <h2 className="text-xl font-bold">
                Statistik för {formatTeamList(selectedTeams)}
              </h2>
            ) : (
              <h2 className="text-xl font-bold">Statistik för alla matcher</h2>
            )}
            <p className="text-sm text-gray-400">
              Totalt {stats.reduce((sum, r) => sum + r.matches, 0)} domar-matcher analyserade
            </p>
          </div>
      
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderList("👨‍⚖️ Snällast domare", leastCards, r => `${((r.yellow + r.red) / r.matches).toFixed(1)} kort/match`)}
            {renderList("🔥 Elakast domare", mostCards, r => `${((r.yellow + r.red) / r.matches).toFixed(1)} kort/match`)}
            {renderList("✅ Bäst för valda lag", bestForTeam, r => `${Math.round((r.wins / r.matches) * 100)} % vinst`)}
            {renderList("❌ Sämst för valda lag", worstForTeam, r => `${Math.round((r.losses / r.matches) * 100)} % förlust`)}
            {renderList("⚖️ Flest straffar", mostPenalties, r => `${(r.penalty / r.matches).toFixed(2)} per match`)}
            {renderList("🎯 Gillar att vara i centrum", spotlight, r =>
              `${((r.yellow + r.red + r.penalty) / r.matches).toFixed(2)} ingripanden/match`)}
          </div>
        </section>
      );
      
}
