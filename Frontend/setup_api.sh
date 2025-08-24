# === Gå till frontend-roten (omedvetet om var du står, avbryt om ej finns) ===
if [ ! -f "package.json" ]; then
  echo "✋ Kör detta i frontend-katalogen (där package.json finns)."
  exit 1
fi

echo "🚀 Startar Dommarjävel-frontend migration…"

# === Mappar ===
mkdir -p app/api/matches app/api/stats app/api/referees app/api/teams app/api/seasons
mkdir -p lib
mkdir -p data
mkdir -p components

# === 0) Gemensam dataladdare ===
cat > lib/loadData.ts <<'EOF'
export type Match = {
  match_id: number;
  season: number;
  date: string; // ISO eller valfritt format
  home_team: string;
  away_team: string;
  referee: string;
  home_away?: "home" | "away";
  home_goals?: number;
  away_goals?: number;
  yellow_cards_home?: number;
  yellow_cards_away?: number;
  red_cards_home?: number;
  red_cards_away?: number;
  penalties_home?: number;
  penalties_away?: number;
};

export async function loadMatches(): Promise<Match[]> {
  const dataUrl = process.env.DATA_URL;
  if (dataUrl) {
    const res = await fetch(dataUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch data.json from " + dataUrl);
    return res.json();
  } else {
    // DEV-fallback: läs lokal data/data.json
    // OBS: Detta kräver att tsconfig har baseUrl/paths för "@/*".
    // Om inte: ändra till relativ import: (await import("../data/data.json")).default
    const data: Match[] = (await import("@/data/data.json")).default as any;
    return data;
  }
}

export function parseCSV(v: string | null): string[] {
  return v ? v.split(",").map(s => s.trim()).filter(Boolean) : [];
}
EOF

# Liten README för data/
if [ ! -f "data/README.md" ]; then
cat > data/README.md <<'EOF'
Lägg en lokal datafil här i dev:
- data.json  (samma schema som backend genererar)

Prod: sätt ENV `DATA_URL` i Vercel som pekar på din publika JSON (S3/Blob/API/etc).
EOF
fi

# === 1) /api/matches ===
cat > app/api/matches/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { loadMatches, parseCSV, Match } from "@/lib/loadData";

const toNumArr = (xs: string[]) => xs.map(n => Number(n)).filter(n => Number.isFinite(n));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seasons = toNumArr(parseCSV(searchParams.get("season")));
  const referees = parseCSV(searchParams.get("referee"));
  const teams = parseCSV(searchParams.get("team"));
  const side = searchParams.get("side"); // "home" | "away"
  const limit = Number(searchParams.get("limit") ?? "0");

  const all = await loadMatches();

  let out = all.filter((m: Match) => {
    if (seasons.length && !seasons.includes(m.season)) return false;
    if (referees.length && !referees.includes(m.referee)) return false;
    if (teams.length && !(teams.includes(m.home_team) || teams.includes(m.away_team))) return false;
    if (side && m.home_away && m.home_away !== side) return false;
    return true;
  });

  // senaste först om datum är jämförbart
  out.sort((a, b) => (a.date < b.date ? 1 : -1));
  if (limit > 0) out = out.slice(0, limit);

  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
EOF

# === 2) /api/stats ===
cat > app/api/stats/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { loadMatches, parseCSV, Match } from "@/lib/loadData";

const toNumArr = (xs: string[]) => xs.map(n => Number(n)).filter(n => Number.isFinite(n));
const sum = (arr: number[]) => arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
const any = (v: number | undefined) => (v ?? 0) > 0 ? 1 : 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seasons = toNumArr(parseCSV(searchParams.get("season")));
  const referees = parseCSV(searchParams.get("referee"));
  const teams = parseCSV(searchParams.get("team"));

  const matches = (await loadMatches()).filter((m: Match) => {
    if (seasons.length && !seasons.includes(m.season)) return false;
    if (referees.length && !referees.includes(m.referee)) return false;
    if (teams.length && !(teams.includes(m.home_team) || teams.includes(m.away_team))) return false;
    return true;
  });

  const total = matches.length;
  const goalsHome = sum(matches.map(m => m.home_goals ?? 0));
  const goalsAway = sum(matches.map(m => m.away_goals ?? 0));
  const yc = sum(matches.map(m => (m.yellow_cards_home ?? 0) + (m.yellow_cards_away ?? 0)));
  const rc = sum(matches.map(m => (m.red_cards_home ?? 0) + (m.red_cards_away ?? 0)));
  const pens = sum(matches.map(m => (m.penalties_home ?? 0) + (m.penalties_away ?? 0)));

  const pYellow = sum(matches.map(m => (any(m.yellow_cards_home) || any(m.yellow_cards_away)) ? 1 : 0)) / (total || 1);
  const pRed = sum(matches.map(m => (any(m.red_cards_home) || any(m.red_cards_away)) ? 1 : 0)) / (total || 1);
  const pPenalty = sum(matches.map(m => (any(m.penalties_home) || any(m.penalties_away)) ? 1 : 0)) / (total || 1);

  return NextResponse.json({
    total_matches: total,
    goals: { home: goalsHome, away: goalsAway, avg_per_match: (goalsHome + goalsAway) / (total || 1) },
    cards: { yellow_total: yc, red_total: rc, p_any_yellow: pYellow },
    penalties: { total: pens, p_any_penalty: pPenalty },
  }, { headers: { "Cache-Control": "no-store" } });
}
EOF

# === 3) /api/referees ===
cat > app/api/referees/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { loadMatches, parseCSV } from "@/lib/loadData";

const toNumArr = (xs: string[]) => xs.map(n => Number(n)).filter(n => Number.isFinite(n));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seasons = toNumArr(parseCSV(searchParams.get("season")));
  const flat = searchParams.get("flat") === "1";
  const minMatches = Number(searchParams.get("minMatches") ?? "0");

  const matches = (await loadMatches()).filter(m =>
    seasons.length ? seasons.includes(m.season) : true
  );

  const counts = new Map<string, number>();
  for (const m of matches) {
    if (!m.referee) continue;
    counts.set(m.referee, (counts.get(m.referee) ?? 0) + 1);
  }

  const entries = [...counts.entries()]
    .filter(([_, c]) => c >= minMatches)
    .sort((a, b) => a[0].localeCompare(b[0], "sv"));

  const data = flat
    ? entries.map(([name]) => name)
    : entries.map(([name, matches]) => ({ name, matches }));

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
EOF

# === 4) /api/teams ===
cat > app/api/teams/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { loadMatches, parseCSV } from "@/lib/loadData";

const toNumArr = (xs: string[]) => xs.map(n => Number(n)).filter(n => Number.isFinite(n));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seasons = toNumArr(parseCSV(searchParams.get("season")));
  const flat = searchParams.get("flat") === "1";
  const minMatches = Number(searchParams.get("minMatches") ?? "0");

  const matches = (await loadMatches()).filter(m =>
    seasons.length ? seasons.includes(m.season) : true
  );

  const counts = new Map<string, number>();
  for (const m of matches) {
    if (m.home_team) counts.set(m.home_team, (counts.get(m.home_team) ?? 0) + 1);
    if (m.away_team) counts.set(m.away_team, (counts.get(m.away_team) ?? 0) + 1);
  }

  const entries = [...counts.entries()]
    .filter(([_, c]) => c >= minMatches)
    .sort((a, b) => a[0].localeCompare(b[0], "sv"));

  const data = flat
    ? entries.map(([name]) => name)
    : entries.map(([name, matches]) => ({ name, matches }));

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
EOF

# === 5) /api/seasons ===
cat > app/api/seasons/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { loadMatches } from "@/lib/loadData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const flat = searchParams.get("flat") === "1";

  const matches = await loadMatches();
  const counts = new Map<number, number>();
  for (const m of matches) {
    counts.set(m.season, (counts.get(m.season) ?? 0) + 1);
  }
  const entries = [...counts.entries()].sort((a, b) => b[0] - a[0]); // nyaste först

  if (flat) {
    return NextResponse.json(entries.map(([season]) => season), {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const data = entries.map(([season, matches]) => ({ season, matches }));
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
EOF

# === 6) Migrera pages/index.tsx -> app/page.tsx om möjligt ===
if [ -f "pages/index.tsx" ] && [ ! -f "app/page.tsx" ]; then
  echo "↪️  Flyttar pages/index.tsx till app/page.tsx (backup behålls ej)…"
  mkdir -p app
  mv pages/index.tsx app/page.tsx
fi

# === 7) Skapa enkel test-startsida om saknas ===
if [ ! -f "app/page.tsx" ]; then
cat > app/page.tsx <<'EOF'
"use client";

import { useEffect, useState } from "react";

type SeasonItem = { season: number; matches: number };
type RefItem = { name: string; matches: number };
type TeamItem = { name: string; matches: number };

export default function Home() {
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [refs, setRefs] = useState<RefItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, r, t, st] = await Promise.all([
        fetch("/api/seasons").then(r => r.json()),
        fetch("/api/referees").then(r => r.json()),
        fetch("/api/teams").then(r => r.json()),
        fetch("/api/stats").then(r => r.json()),
      ]);
      setSeasons(s);
      setRefs(r.slice(0, 10));  // topp 10 för prov
      setTeams(t.slice(0, 10));
      setStats(st);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dommarjävel – API smoke test</h1>

      {loading && <div>Laddar…</div>}

      {!loading && (
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">Säsonger</h2>
            <div className="flex flex-wrap gap-2">
              {seasons.map((s) => (
                <span key={s.season} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-sm">
                  {s.season} <span className="opacity-60">({s.matches})</span>
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Domare (exempel)</h2>
            <ul className="list-disc pl-5">
              {refs.map((r) => (
                <li key={r.name}>{r.name} <span className="opacity-60">({r.matches})</span></li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Lag (exempel)</h2>
            <ul className="list-disc pl-5">
              {teams.map((t) => (
                <li key={t.name}>{t.name} <span className="opacity-60">({t.matches})</span></li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Snabbstatistik</h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(stats, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </main>
  );
}
EOF
fi

# === 8) Säkerställ Tailwind "content" paths ===
if [ -f "tailwind.config.js" ]; then
  # Lägg in vanliga content-globbar om de saknas
  if ! grep -q "app/\\*\\*/\\*\\.{js,ts,jsx,tsx,mdx}" tailwind.config.js; then
    sed -i.bak 's/content: \\[/content: [\n    ".\/app/**/*.{js,ts,jsx,tsx,mdx}",\n    ".\/components/**/*.{js,ts,jsx,tsx,mdx}",\n    ".\/pages/**/*.{js,ts,jsx,tsx,mdx}",/g' tailwind.config.js || true
  fi
fi

echo "✅ Klart! Kör:
  npm run dev
…och testa:
  http://localhost:3000/api/seasons
  http://localhost:3000/api/referees?flat=1
  http://localhost:3000/api/teams?flat=1
  http://localhost:3000/api/matches?limit=5
  http://localhost:3000/api/stats
"

echo "ℹ️ DEV-fallback: lägg data/data.json lokalt om du inte satt ENV DATA_URL ännu."

