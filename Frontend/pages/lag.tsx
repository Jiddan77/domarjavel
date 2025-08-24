import { useState } from "react";
import data from "../data/data.json";
import MatchList from "@/components/MatchList";
import { getAllTeams } from "../utils/getAllTeams";
import { getAllSeasons } from "../utils/getAllSeasons";
import { getHomeAwayOptions } from "../utils/getHomeAwayOptions";
import { filterMatches } from "../utils/filterMatches";
import FancyMultiSelect from "@/components/FancyMultiSelect";
import TeamCharts from "@/components/charts/TeamCharts"; // ✅ Default-import

export default function LagPage() {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedHomeAway, setSelectedHomeAway] = useState<string[]>([]);

  const teamOptions = getAllTeams(data).map((t) => ({
    label: `🏟️ ${t}`,
    value: t,
  }));

  const seasonOptions = getAllSeasons(data).map((s) => ({
    label: "📅 " + s,
    value: s,
  }));

  const homeAwayOptions = getHomeAwayOptions().map((h) => ({
    label: h,
    value: h,
  }));

  const filteredMatches = filterMatches(data, {
    referees: [],
    teams: selectedTeams,
    seasons: selectedSeasons,
    homeAway: selectedHomeAway,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Lag</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FancyMultiSelect
          options={teamOptions}
          selected={selectedTeams}
          onChange={setSelectedTeams}
          label="Lag"
        />
        <FancyMultiSelect
          options={seasonOptions}
          selected={selectedSeasons}
          onChange={setSelectedSeasons}
          label="Säsong"
        />
        <FancyMultiSelect
          options={homeAwayOptions}
          selected={selectedHomeAway}
          onChange={setSelectedHomeAway}
          label="Hemma/Borta"
        />
      </div>

      <TeamCharts matches={filteredMatches} />
      <MatchList matches={filteredMatches} />
    </div>
  );
}