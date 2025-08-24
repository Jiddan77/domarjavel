"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { parseSwedishDate } from "@/utils/parseSwedishDate";

type Match = {
  date: string;
  home_cards?: number;
  away_cards?: number;
};

type MonthlyStat = {
  cards: number;
};

type Props = {
  matches: Match[];
};

export function CardsPerMonthChart({ matches }: Props) {
  const monthlyStats: Record<string, MonthlyStat> = {};

  for (const match of matches) {
    if (!match.date) continue;

    const parsedDate = parseSwedishDate(match.date);
    if (!parsedDate) continue;

    const key = format(parsedDate, "yyyy-MM");

    if (!monthlyStats[key]) {
      monthlyStats[key] = { cards: 0 };
    }

    monthlyStats[key].cards += (match.home_cards || 0) + (match.away_cards || 0);
  }

  const data = Object.entries(monthlyStats)
    .map(([month, stats]: [string, MonthlyStat]) => ({
      month,
      cards: stats.cards,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow hover:shadow-xl transition col-span-full">
      <h2 className="text-lg font-semibold mb-4">📈 Gula kort per månad</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fill: "#fff" }} />
          <YAxis tick={{ fill: "#fff" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1E3A8A", borderColor: "#4b5563", color: "#fff" }}
            labelStyle={{ color: "#FCD34D" }}
            itemStyle={{ color: "#fff" }}
          />
          <Line type="monotone" dataKey="cards" stroke="#FCD34D" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}