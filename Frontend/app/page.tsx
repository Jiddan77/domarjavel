"use client";

import { useMemo, useState } from "react";
import { useSeasons } from "@/hooks/useSeasons";
import { useReferees } from "@/hooks/useReferees";
import { useTeams } from "@/hooks/useTeams";
import { useMatches } from "@/hooks/useMatches";
import { useStats } from "@/hooks/useStats";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import MultiSelect from "@/components/filters/MultiSelect";
import StatsPanel from "@/components/StatsPanel";
import FactsPanel from "@/components/FactsPanel";
import MatchTable from "@/components/MatchTable";
import Leaderboard from "@/components/Leaderboard";

export default function Home() {
  const [seasonSel, setSeasonSel] = useState<number[]>([]);
  const [refSel, setRefSel] = useState<string[]>([]);
  const [teamSel, setTeamSel] = useState<string[]>([]);
  const [side, setSide] = useState<"" | "home" | "away">("");

  const { seasons } = useSeasons();
  const { referees } = useReferees({ season: seasonSel, minMatches: 1 });
  const { teams } = useTeams({ season: seasonSel, minMatches: 1 });

  const { matches, total } = useMatches({
    season: seasonSel, referee: refSel, team: teamSel, side: side || undefined, limit: 200, includeTotal: true
  });
  const { stats } = useStats({ season: seasonSel, referee: refSel, team: teamSel, side: side || undefined });
  const { leaderboard } = useLeaderboard({ season: seasonSel, team: teamSel, limit: 5, minMatches: 8, minTeamMatches: 5 });

  const seasonOpts = useMemo(() => seasons.map(s => ({ value: String(s.season), label: String(s.season) })), [seasons]);
  const refOpts = useMemo(() => referees.map(r => ({ value: r.name, label: r.name })), [referees]);
  const teamOpts = useMemo(() => teams.map(t => ({ value: t.name, label: t.name })), [teams]);

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold">Dommarjävel</h1>
        <div className="text-sm opacity-70">Matcher: {total}</div>
      </header>

      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MultiSelect label="Säsong" options={seasonOpts} values={seasonSel.map(String)} onChange={(vals) => setSeasonSel(vals.map(v => Number(v)))} />
        <MultiSelect label="Domare" options={refOpts} values={refSel} onChange={setRefSel} />
        <MultiSelect label="Lag" options={teamOpts} values={teamSel} onChange={setTeamSel} />
        <div className="space-y-1">
          <div className="text-sm opacity-80">Hemma/Borta</div>
          <div className="flex flex-wrap gap-2">
            {["", "home", "away"].map(s => (
              <button
                key={s || "all"}
                onClick={() => setSide(s as any)}
                className={`px-2 py-1 rounded border text-sm ${side===s ? "bg-white text-black dark:bg-white dark:text-black" : ""}`}
              >
                {s === "" ? "Alla" : s === "home" ? "Hemma" : "Borta"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <StatsPanel stats={stats} />
      <FactsPanel stats={stats} />
      <Leaderboard data={leaderboard} />

      <section>
        <h2 className="text-lg font-semibold mb-2">Matcher</h2>
        <MatchTable items={matches} />
      </section>
    </main>
  );
}
