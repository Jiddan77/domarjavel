import type { Match } from "@/lib/loadData";

function teamName(m: any, side: "home" | "away") {
  return (side === "home"
    ? (m.home_team ?? m.home ?? m.homeTeam ?? m.home_name ?? m.team_home ?? m.homeTeamName ?? m.home_club)
    : (m.away_team ?? m.away ?? m.awayTeam ?? m.away_name ?? m.team_away ?? m.awayTeamName ?? m.away_club)
  ) || "–";
}

export default function MatchList({ items }: { items: Match[] }) {
  return (
    <div className="mt-4 rounded-2xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-black/5 dark:bg-white/5">
          <tr>
            <th className="text-left p-2">Datum</th>
            <th className="text-left p-2">Match</th>
            <th className="text-left p-2">Domare</th>
            <th className="text-left p-2">Säsong</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m: any) => (
            <tr key={m.match_id} className="border-t">
              <td className="p-2">{m.date}</td>
              <td className="p-2">{teamName(m, "home")} – {teamName(m, "away")}</td>
              <td className="p-2">{m.referee}</td>
              <td className="p-2">{m.season}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={4} className="p-4 opacity-70">Inga matcher för filtret.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
