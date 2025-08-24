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
