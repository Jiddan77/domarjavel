import data from "../data/data.json";
import { useMemo } from "react";
import { calculateRefereeStats } from "@/utils/statHelpers";
import RefereeOverview from "@/components/RefereeOverview";
import { CardsPerMonthChart } from "@/components/charts/TrendCharts";
import TeamCharts from "@/components/charts/TeamCharts";

export default function StatistikPage() {
  const stats = useMemo(() => calculateRefereeStats(data), []);

  // ✅ Konvertera data till rätt struktur för TeamCharts
  const chartMatches = data.map((m) => ({
    home_team: m.home,
    away_team: m.away,
    home_cards: parseInt(m.yellow || "0"),
    away_cards: parseInt(m.yellow || "0"),
    home_red: parseInt(m.red || "0"),
    away_red: parseInt(m.red || "0"),
    home_penalties: parseInt(m.penalty || "0"),
    away_penalties: 0,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Statistik</h1>

      <RefereeOverview allMatches={data} selectedTeams={[]} />

      <div className="mt-8">
        <TeamCharts matches={chartMatches} />
      </div>

      <div className="mt-8">
        <CardsPerMonthChart matches={data} />
      </div>
    </div>
  );
}