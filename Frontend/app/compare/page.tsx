"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";
import RefereeSelector from "@/components/RefereeSelector";
import CompareStatsTable from "@/components/CompareStatsTable";
import BiasBreakdown from "@/components/BiasBreakdown";

function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialRefs = searchParams.get("referees")
    ? searchParams
        .get("referees")!
        .split(",")
        .map((r) => decodeURIComponent(r.trim()))
        .filter(Boolean)
    : [];

  const [selected, setSelected] = useState<string[]>(initialRefs);
  const [allReferees, setAllReferees] = useState<string[]>([]);

  const { compareData, error, isLoading } = useCompare(selected);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiUrl}/api/referees`)
      .then((r) => r.json())
      .then((data: { name: string }[]) =>
        setAllReferees(data.map((r) => r.name).sort())
      )
      .catch(() => {});
  }, []);

  const handleChange = (refs: string[]) => {
    setSelected(refs);
    const params = new URLSearchParams();
    if (refs.length) {
      params.set("referees", refs.map(encodeURIComponent).join(","));
    }
    router.replace(
      `/compare${refs.length ? `?${params.toString()}` : ""}`,
      { scroll: false }
    );
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-3 mb-6">
          <Link
            href="/ranking"
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Compare Referees</h1>
            <p className="text-sm text-slate-500">
              Pick 2–4 referees to compare side-by-side
            </p>
          </div>
        </header>

        <div className="mb-6">
          <RefereeSelector
            selected={selected}
            allReferees={allReferees}
            onChange={handleChange}
          />
        </div>

        {selected.length < 2 && (
          <div className="text-center py-16 text-slate-500">
            Add at least 2 referees to start comparing.
          </div>
        )}

        {selected.length >= 2 && isLoading && (
          <div className="flex justify-center py-16 text-slate-400">
            Loading...
          </div>
        )}

        {selected.length >= 2 && error && (
          <div className="py-8 text-center text-red-400 text-sm">
            Could not load comparison data.
          </div>
        )}

        {compareData && !isLoading && (
          <>
            <CompareStatsTable
              referees={compareData.referees}
              leagueAvg={compareData.league_avg}
            />
            <BiasBreakdown referees={compareData.referees} />
          </>
        )}
      </div>
    </main>
  );
}

export default function ComparePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <ComparePage />
    </Suspense>
  );
}
