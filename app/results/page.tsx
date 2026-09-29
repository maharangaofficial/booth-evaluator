"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BOOTHS, CRITERIA } from "@/lib/data";

type Row = { booth: string; criterion: string; score: number; evaluator_name: string };

export default function Results() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scores")
      .then((res) => res.json())
      .then((data) => setRows(data.rows || []))
      .finally(() => setLoading(false));
  }, []);

  function averageFor(code: string, criterion?: string) {
    const matching = rows.filter(
      (r) => r.booth === code && (criterion ? r.criterion === criterion : true)
    );
    if (matching.length === 0) return null;
    const sum = matching.reduce((acc, r) => acc + r.score, 0);
    return sum / matching.length;
  }

  function evaluatorCount(code: string) {
    return new Set(rows.filter((r) => r.booth === code).map((r) => r.evaluator_name)).size;
  }

  const ranked = [...BOOTHS].sort(
    (a, b) => (averageFor(b.code) ?? 0) - (averageFor(a.code) ?? 0)
  );

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <div className="bg-gradient-to-b from-indigo-600 to-indigo-500 px-5 pb-8 pt-8 text-white">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <h1 className="text-xl font-semibold">Live Results</h1>
          <Link
            href="/"
            className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/25"
          >
            Evaluate
          </Link>
        </div>
        <p className="mx-auto mt-1 w-full max-w-md text-sm text-indigo-100">
          Average scores across all evaluators
        </p>
      </div>

      <div className="mx-auto -mt-4 w-full max-w-md flex-1 px-5 pb-10">
        {loading ? (
          <p className="mt-6 text-center text-sm text-slate-400">Loading results…</p>
        ) : (
          <div className="flex flex-col gap-4">
            {ranked.map((booth, idx) => {
              const overall = averageFor(booth.code);
              return (
                <div
                  key={booth.code}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">
                          {booth.bu}
                        </p>
                        <span className="font-semibold text-slate-900">{booth.theme}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-400">
                      {evaluatorCount(booth.code)} evaluator
                      {evaluatorCount(booth.code) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mb-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-indigo-600">
                      {overall !== null ? overall.toFixed(2) : "—"}
                    </span>
                    <span className="text-sm text-slate-400">/ 5.00</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-sm">
                    {CRITERIA.map((c) => {
                      const avg = averageFor(booth.code, c.key);
                      return (
                        <div key={c.key} className="flex items-center justify-between">
                          <span className="text-slate-500">{c.label}</span>
                          <span className="font-medium text-slate-800">
                            {avg !== null ? avg.toFixed(2) : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
