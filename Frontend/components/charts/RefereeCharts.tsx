import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type Match = {
  referee: string;
  home_cards?: number;
  away_cards?: number;
  home_penalties?: number;
  away_penalties?: number;
};

type RefStats = {
  name: string;
  avgCards: number;
  penalties: number;
};

function calculateRefereeStats(matches: Match[]): RefStats[] {
  const stats: Record<string, { totalCards: number; totalPenalties: number; games: number }> = {};

  matches.forEach((m) => {
    if (!m.referee) return;
    if (!stats[m.referee]) {
      stats[m.referee] = { totalCards: 0, totalPenalties: 0, games: 0 };
    }
    stats[m.referee].totalCards += (m.home_cards || 0) + (m.away_cards || 0);
    stats[m.referee].totalPenalties += (m.home_penalties || 0) + (m.away_penalties || 0);
    stats[m.referee].games += 1;
  });

  return Object.entries(stats).map(([name, s]) => ({
    name,
    avgCards: s.totalCards / s.games,
    penalties: s.totalPenalties,
  }));
}

export function RefereeCardsBarChart({ data }: { data: Match[] }) {
  const sorted = calculateRefereeStats(data)
    .sort((a, b) => b.avgCards - a.avgCards)
    .slice(0, 10);

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow hover:shadow-xl transition">
      <h2 className="text-lg font-semibold mb-4">📈 Flest kort per match (Topp 10)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sorted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "#fff" }} />
          <YAxis tick={{ fill: "#fff" }} />
          <Tooltip contentStyle={{ backgroundColor: "#1E3A8A", borderColor: "#4b5563" }} />
          <Bar dataKey="avgCards" fill="#FCD34D" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RefereePenaltiesChart({ data }: { data: Match[] }) {
  const sorted = calculateRefereeStats(data)
    .sort((a, b) => b.penalties - a.penalties)
    .slice(0, 10);

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow hover:shadow-xl transition">
      <h2 className="text-lg font-semibold mb-4">⚽ Flest straffar utdelade (Topp 10)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sorted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "#fff" }} />
          <YAxis tick={{ fill: "#fff" }} />
          <Tooltip contentStyle={{ backgroundColor: "#1E3A8A", borderColor: "#4b5563" }} />
          <Bar dataKey="penalties" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CardsVsPenaltiesChart({ data }: { data: Match[] }) {
  const sorted = calculateRefereeStats(data)
    .sort((a, b) => b.avgCards + b.penalties - (a.avgCards + a.penalties))
    .slice(0, 10);

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow hover:shadow-xl transition">
      <h2 className="text-lg font-semibold mb-4">⚖️ Kort vs Straffar per domare (Topp 10)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sorted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "#fff" }} />
          <YAxis tick={{ fill: "#fff" }} />
          <Tooltip contentStyle={{ backgroundColor: "#1E3A8A", borderColor: "#4b5563" }} />
          <Legend />
          <Bar dataKey="avgCards" fill="#FCD34D" name="Kort/match" />
          <Bar dataKey="penalties" fill="#3B82F6" name="Straffar" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}