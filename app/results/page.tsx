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

  function averageFor(booth: string, criterion?: string) {
    const matching = rows.filter(
      (r) => r.booth === booth && (criterion ? r.criterion === criterion : true)
    );
    if (matching.length === 0) return null;
    const sum = matching.reduce((acc, r) => acc + r.score, 0);
    return sum / matching.length;
  }

  function evaluatorCount(booth: string) {
    return new Set(rows.filter((r) => r.booth === booth).map((r) => r.evaluator_name)).size;
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-4 py-6 dark:bg-black">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Results</h1>
          <Link href="/" className="text-sm font-medium text-zinc-500 underline dark:text-zinc-400">
            Back to evaluate
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ) : (
          <div className="flex flex-col gap-4">
            {BOOTHS.map((booth) => {
              const overall = averageFor(booth);
              return (
                <div
                  key={booth}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{booth}</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {evaluatorCount(booth)} evaluator{evaluatorCount(booth) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {overall !== null ? overall.toFixed(2) : "—"}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {CRITERIA.map((c) => {
                      const avg = averageFor(booth, c.key);
                      return (
                        <div key={c.key} className="flex justify-between">
                          <span>{c.label}</span>
                          <span>{avg !== null ? avg.toFixed(2) : "—"}</span>
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
