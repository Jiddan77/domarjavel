import type { Match } from "@/lib/loadData";

const month: Record<string, number> = { januari:0,februari:1,mars:2,april:3,maj:4,juni:5,juli:6,augusti:7,september:8,oktober:9,november:10,december:11 };
const pDate = (s: any) => {
  const t = Date.parse((s ?? "").toString()); if (!Number.isNaN(t)) return t;
  const r = (s ?? "").toString().match(/^(\d{1,2})\s+([A-Za-zåäöÅÄÖ]+)\s+(\d{4})$/);
  if (r && month[r[2].toLowerCase()]!=null) return new Date(+r[3], month[r[2].toLowerCase()], +r[1]).getTime();
  return 0;
};

function team(m: any, side: "home"|"away") {
  return (side==="home"
    ? (m.home_team ?? m.home ?? m.homeTeam ?? m.home_name ?? m.team_home ?? m.homeTeamName ?? m.home_club)
    : (m.away_team ?? m.away ?? m.awayTeam ?? m.away_name ?? m.team_away ?? m.awayTeamName ?? m.away_club)
  ) || "–";
}

function score(m: any) {
  const h = Number(m.home_goals ?? m.goals_home ?? m.homeGoals ?? m.score_home ?? m.home_score);
  const a = Number(m.away_goals ?? m.goals_away ?? m.awayGoals ?? m.score_away ?? m.away_score);
  if (Number.isFinite(h) && Number.isFinite(a)) return `${h}–${a}`;
  const cand = [m.score, m.result, m.final_score, m.full_time, m.ft, m.end_result];
  for (const s of cand) if (typeof s === "string") { const r = s.match(/(\d+)\D+(\d+)/); if (r) return `${r[1]}–${r[2]}`; }
  return "–";
}

function cardTot(m: any, kind: "yellow"|"red") {
  const h = Number(m[`${kind}_cards_home`] ?? m[`${kind}CardsHome`] ?? m?.cards?.[kind]?.home ?? m?.[`${kind}`]?.home ?? m?.stats?.cards?.[kind]?.home ?? 0);
  const a = Number(m[`${kind}_cards_away`] ?? m[`${kind}CardsAway`] ?? m?.cards?.[kind]?.away ?? m?.[`${kind}`]?.away ?? m?.stats?.cards?.[kind]?.away ?? 0);
  const tot = (Number.isFinite(h)?h:0) + (Number.isFinite(a)?a:0);
  if (tot) return tot;
  const ev = (m.events ?? m.timeline ?? []) as any[];
  if (Array.isArray(ev)) {
    const key = kind === "yellow" ? "yellow" : "red";
    return ev.filter(e => (e.type ?? e.event ?? e.kind ?? "").toString().toLowerCase().includes(key)).length;
  }
  return 0;
}
function pens(m: any) {
  const h = Number(m.penalties_home ?? m.penalty_home ?? m.penaltiesHome ?? m?.penalties?.home ?? m?.stats?.penalties?.home ?? 0);
  const a = Number(m.penalties_away ?? m.penalty_away ?? m.penaltiesAway ?? m?.penalties?.away ?? m?.stats?.penalties?.away ?? 0);
  const tot = (Number.isFinite(h)?h:0) + (Number.isFinite(a)?a:0);
  if (tot) return tot;
  const ev = (m.events ?? m.timeline ?? []) as any[];
  if (Array.isArray(ev)) return ev.filter(e => (e.type ?? e.event ?? e.kind ?? "").toString().toLowerCase().match(/pen|straff/)).length;
  return 0;
}

export default function MatchTable({ items }: { items: Match[] }) {
  const ordered = [...items].sort((a: any, b: any) => pDate(b.date) - pDate(a.date));
  return (
    <div className="mt-4 rounded-2xl border overflow-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead className="bg-black/5 dark:bg-white/5">
          <tr>
            <th className="text-left p-2">Datum</th>
            <th className="text-left p-2">Match</th>
            <th className="text-left p-2">Resultat</th>
            <th className="text-left p-2">Gula</th>
            <th className="text-left p-2">Röda</th>
            <th className="text-left p-2">Straffar</th>
            <th className="text-left p-2">Domare</th>
            <th className="text-left p-2">Säsong</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((m: any) => (
            <tr key={m.match_id} className="border-t">
              <td className="p-2 whitespace-nowrap">{m.date}</td>
              <td className="p-2">{team(m, "home")} – {team(m, "away")}</td>
              <td className="p-2">{score(m)}</td>
              <td className="p-2">{cardTot(m, "yellow")}</td>
              <td className="p-2">{cardTot(m, "red")}</td>
              <td className="p-2">{pens(m)}</td>
              <td className="p-2">{m.referee}</td>
              <td className="p-2">{m.season}</td>
            </tr>
          ))}
          {ordered.length === 0 && <tr><td colSpan={8} className="p-4 opacity-70">Inga matcher för filtret.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
