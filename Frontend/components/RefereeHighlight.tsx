'use client';

import { useMemo } from 'react';

type Match = {
  referee: string;
  score: string;
  yellow: string;
  red: string;
  penalty: string;
  home: string;
  away: string;
};

type RefStats = {
  referee: string;
  matches: number;
  wins: number;
  yellow: number;
  red: number;
  penalty: number;
};

export default function RefereeHighlight({
  filteredMatches,
  selectedTeams,
}: {
  filteredMatches: Match[];
  selectedTeams: string[];
}) {
  const stats = useMemo(() => {
    const result: Record<string, RefStats> = {};

    for (const match of filteredMatches) {
      const { referee, home, away } = match;
      if (!referee) continue;

      const [gH, gA] = match.score.split('–').map(Number);
      const [yH, yA] = match.yellow.split('–').map(Number);
      const [rH, rA] = match.red.split('–').map(Number);
      const [pH, pA] = match.penalty.split('–').map(Number);

      for (const team of selectedTeams) {
        const isHome = home === team;
        const isAway = away === team;
        if (!isHome && !isAway) continue;

        const won = (isHome && gH > gA) || (isAway && gA > gH);
        const y = isHome ? yH : yA;
        const r = isHome ? rH : rA;
        const p = isHome ? pH : pA;

        if (!result[referee]) {
          result[referee] = {
            referee,
            matches: 0,
            wins: 0,
            yellow: 0,
            red: 0,
            penalty: 0,
          };
        }

        const ref = result[referee];
        ref.matches++;
        if (won) ref.wins++;
        ref.yellow += y;
        ref.red += r;
        ref.penalty += p;
      }
    }

    return Object.values(result).filter(r => r.matches >= 2);
  }, [filteredMatches, selectedTeams]);

  if (stats.length === 0) return null;

  const hero = [...stats].sort((a, b) => b.wins / b.matches - a.wins / a.matches)[0];
  const villain = [...stats].sort(
    (a, b) =>
      (b.yellow + b.red + b.penalty) / b.matches -
      (a.yellow + a.red + a.penalty) / a.matches
  )[0];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <HighlightCard
        title="💚 Domarhjälte"
        subtitle="Bäst vinstandel för valda lag"
        refName={hero.referee}
        stat={`${Math.round((hero.wins / hero.matches) * 100)} % vinst`}
        glow="green"
      />
      <HighlightCard
        title="💀 Domarjävel"
        subtitle="Flest kort & straffar mot valda lag"
        refName={villain.referee}
        stat={`${((villain.yellow + villain.red + villain.penalty) / villain.matches).toFixed(2)} ingripanden/match`}
        glow="red"
      />
    </section>
  );
}

function HighlightCard({
  title,
  subtitle,
  refName,
  stat,
  glow,
}: {
  title: string;
  subtitle: string;
  refName: string;
  stat: string;
  glow: 'green' | 'red';
}) {
  const glowClass =
    glow === 'green'
      ? 'shadow-green-500/30 border-green-400'
      : 'shadow-red-500/30 border-red-400';

  return (
    <div
      className={`rounded-xl border bg-white/5 p-5 shadow-lg hover:scale-105 transition-transform duration-200 ${glowClass}`}
    >
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>
      <div className="mt-4 text-2xl font-semibold text-white">{refName}</div>
      <div className="text-sm text-gray-300">{stat}</div>
    </div>
  );
}
