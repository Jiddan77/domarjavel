"use client";

import { useEffect, useMemo, useState } from "react";

type IndexData = {
  referees: string[];
  teams: string[];
  seasons: number[];
  global: Record<string, { matches: number }>;
};

type Match = {
  id?: string;
  date?: string;
  season?: number;
  referee?: string;
  home?: string;
  away?: string;
  // normaliserade fält
  homeGoals?: number;
  awayGoals?: number;
  yellowHome?: number;
  yellowAway?: number;
  redHome?: number;
  redAway?: number;
  penaltiesHome?: number;
  penaltiesAway?: number;
  // ev. legacy
  score?: string;
  yellow?: string;
  red?: string;
  penalty?: string;
};

export default function Explorer({ apiBase }: { apiBase: string }) {
  const [index, setIndex] = useState<IndexData | null>(null);
  const [season, setSeason] = useState<string>("");
  const [referee, setReferee] = useState<string>("");
  const [team, setTeam] = useState<string>("");
  const [homeAway, setHomeAway] = useState<string>("all");
  const [items, setItems] = useState<Match[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load index
  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const res = await fetch(`${apiBase}/index`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as IndexData;
        setIndex(data);
      } catch (e: any) {
        setError(e.message || "Kunde inte ladda index.");
      }
    })();
  }, [apiBase]);

  const seasons = useMemo(() => index?.seasons ?? [], [index]);
  const referees = useMemo(() => index?.referees ?? [], [index]);
  const teams = useMemo(() => index?.teams ?? [], [index]);
  const global = useMemo(() => index?.global ?? {}, [index]);

  async function load(reset = false) {
    if (!season) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        season,
        limit: "50",
      });
      if (referee) params.set("referee", referee);
      if (team) params.set("team", team);
      if (homeAway !== "all" && team) params.set("homeAway", homeAway);
      if (cursor && !reset) params.set("cursor", cursor);
      const res = await fetch(`${apiBase}/matches?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || JSON.stringify(data));
      const next: Match[] = data?.items ?? [];
      setItems(prev => (reset ? next : [...prev, ...next]));
      setCursor(data?.nextCursor ?? null);
    } catch (e: any) {
      setError(e.message || "Kunde inte ladda matcher.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setItems([]);
    setCursor(null);
    if (season) load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, referee, team, homeAway]);

  // Hjälpare för robust visning (om legacy-strängar skulle dyka upp)
  const splitPair = (s?: string) => {
    if (!s) return [0, 0];
    const ss = s.replace("–", "-").replace("—", "-").replace(":", "-");
    const [a, b] = ss.split("-").map(x => parseInt(x.trim(), 10));
    return [isNaN(a) ? 0 : a, isNaN(b) ? 0 : b];
  };

  const goalsText = (m: Match) => {
    if (typeof m.score === "string") {
      return m.score;
    }
    return `${m.homeGoals ?? 0}-${m.awayGoals ?? 0}`;
  };

  const yellowPair = (m: Match) =>
    typeof m.yellow === "string" ? splitPair(m.yellow) : [m.yellowHome ?? 0, m.yellowAway ?? 0];
  const redPair = (m: Match) =>
    typeof m.red === "string" ? splitPair(m.red) : [m.redHome ?? 0, m.redAway ?? 0];
  const penPair = (m: Match) =>
    typeof m.penalty === "string" ? splitPair(m.penalty) : [m.penaltiesHome ?? 0, m.penaltiesAway ?? 0];

  return (
    <main className="space-y-6">
      <section className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm mb-1">Säsong</label>
          <select className="w-full bg-white/10 rounded p-2" value={season} onChange={(e) => setSeason(e.target.value)}>
            <option value="">Välj…</option>
            {seasons.map((s) => (
              <option key={s} value={String(s)}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Domare</label>
          <select className="w-full bg-white/10 rounded p-2" value={referee} onChange={(e) => setReferee(e.target.value)}>
            <option value="">Alla</option>
            {referees.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Lag</label>
          <select className="w-full bg-white/10 rounded p-2" value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">Alla</option>
            {teams.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Hemma/Borta</label>
          <select className="w-full bg-white/10 rounded p-2" value={homeAway} onChange={(e) => setHomeAway(e.target.value)}>
            <option value="all">Alla</option>
            <option value="home">Hemma</option>
            <option value="away">Borta</option>
          </select>
        </div>
      </section>

      {index && (
        <section className="bg-white/5 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">Översikt</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(global).map(([s, g]) => (
              <div key={s} className="px-3 py-2 rounded bg-white/10">
                <div className="text-xs opacity-80">Säsong {s}</div>
                <div className="text-xl font-bold">{g.matches} matcher</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && <div className="bg-red-500/20 border border-red-500/40 text-red-200 p-3 rounded">{String(error)}</div>}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Matcher</h2>
        <ul className="divide-y divide-white/10 rounded overflow-hidden">
          {items.map((m, idx) => {
            const [yH, yA] = yellowPair(m);
            const [rH, rA] = redPair(m);
            const [pH, pA] = penPair(m);
            const key = m.id ?? `${m.home}-${m.away}-${m.date}-${idx}`;
            return (
              <li key={key} className="p-3 bg-white/5">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">
                      {m.home} {goalsText(m)} {m.away}
                    </div>
                    <div className="text-sm opacity-80">{m.date} · {m.referee}</div>
                  </div>
                  <div className="text-sm opacity-80 text-right">
                    <div>Gula: {yH} / {yA}</div>
                    <div>Röda: {rH} / {rA}</div>
                    <div>Straffar: {pH} / {pA}</div>
                  </div>
                </div>
              </li>
            );
          })}
          {!loading && items.length === 0 && <li className="p-3 bg-white/5">Inga matcher – justera filter.</li>}
        </ul>
        {cursor && (
          <button disabled={loading} onClick={() => load(false)} className="px-4 py-2 bg-white/10 rounded hover:bg-white/20">
            {loading ? "Laddar…" : "Visa fler"}
          </button>
        )}
      </section>
    </main>
  );
}
