import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Typ för matchdata
type Match = {
  home_team: string;
  away_team: string;
  home_cards?: number;
  away_cards?: number;
  home_red?: number;
  away_red?: number;
  home_penalties?: number;
  away_penalties?: number;
};

type TeamCardsStats = { totalCards: number; games: number };
type TeamRedStats = { red: number; games: number };
type TeamPenaltyStats = { penalties: number };

// 🟨 Flest kort per lag
export function TeamCardsChart({ matches }: { matches: Match[] }) {
  const teamStats: Record<string, TeamCardsStats> = {};

  matches.forEach((match) => {
    [match.home_team, match.away_team].forEach((teamKey) => {
      if (!teamStats[teamKey])
        teamStats[teamKey] = { totalCards: 0, games: 0 };
    });

    teamStats[match.home_team].totalCards += match.home_cards || 0;
    teamStats[match.away_team].totalCards += match.away_cards || 0;

    teamStats[match.home_team].games += 1;
    teamStats[match.away_team].games += 1;
  });

  const data = Object.entries(teamStats)
    .map(([team, stats]) => ({
      name: team,
      avgCards: +(stats.totalCards / stats.games).toFixed(2),
    }))
    .sort((a, b) => b.avgCards - a.avgCards)
    .slice(0, 10);

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow hover:shadow-xl transition col-span-full">
      <h2 className="text-lg font-semibold mb-4">
        🟨 Flest kort per lag (snitt/match)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "#fff" }} />
          <YAxis tick={{ fill: "#fff" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1E3A8A",
              borderColor: "#4b5563",
              color: "#fff",
            }}
            labelStyle={{ color: "#FCD34D" }}
            itemStyle={{ color: "#fff" }}
          />
          <Bar dataKey="avgCards" fill="#FCD34D" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 🟥 Flest röda kort per lag
export function TeamRedCardsChart({ matches }: { matches: Match[] }) {
  const teamStats: Record<string, TeamRedStats> = {};

  matches.forEach((match) => {
    [match.home_team, match.away_team].forEach((teamKey) => {
      if (!teamStats[teamKey]) teamStats[teamKey] = { red: 0, games: 0 };
    });

    teamStats[match.home_team].red += match.home_red || 0;
    teamStats[match.away_team].red += match.away_red || 0;

    teamStats[match.home_team].games += 1;
    teamStats[match.away_team].games += 1;
  });

  const data = Object.entries(teamStats)
    .map(([team, stats]) => ({
      name: team,
      avgRed: +(stats.red / stats.games).toFixed(2),
    }))
    .sort((a, b) => b.avgRed - a.avgRed)
    .slice(0, 10);

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow hover:shadow-xl transition col-span-full">
      <h2 className="text-lg font-semibold mb-4">
        🟥 Flest röda kort per lag (snitt/match)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "#fff" }} />
          <YAxis tick={{ fill: "#fff" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1E3A8A", borderColor: "#4b5563" }}
            labelStyle={{ color: "#FCD34D" }}
            itemStyle={{ color: "#fff" }}
          />
          <Bar dataKey="avgRed" fill="#FCD34D" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ⚽ Flest straffar per lag
export function TeamPenaltiesChart({ matches }: { matches: Match[] }) {
  const teamStats: Record<string, TeamPenaltyStats> = {};

  matches.forEach((match) => {
    [match.home_team, match.away_team].forEach((teamKey) => {
      if (!teamStats[teamKey]) teamStats[teamKey] = { penalties: 0 };
    });

    teamStats[match.home_team].penalties += match.home_penalties || 0;
    teamStats[match.away_team].penalties += match.away_penalties || 0;
  });

  const data = Object.entries(teamStats)
    .map(([team, stats]) => ({
      name: team,
      penalties: stats.penalties,
    }))
    .sort((a, b) => b.penalties - a.penalties)
    .slice(0, 10);

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow hover:shadow-xl transition col-span-full">
      <h2 className="text-lg font-semibold mb-4">⚽ Flest straffar per lag</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "#fff" }} />
          <YAxis tick={{ fill: "#fff" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1E3A8A", borderColor: "#4b5563" }}
            labelStyle={{ color: "#FCD34D" }}
            itemStyle={{ color: "#fff" }}
          />
          <Bar dataKey="penalties" fill="#FCD34D" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ✅ Wrapper-komponent för default export
function TeamCharts({ matches }: { matches: Match[] }) {
  return (
    <>
      <TeamCardsChart matches={matches} />
      <TeamRedCardsChart matches={matches} />
      <TeamPenaltiesChart matches={matches} />
    </>
  );
}

export default TeamCharts;