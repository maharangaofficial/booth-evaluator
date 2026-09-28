"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BOOTHS, CRITERIA } from "@/lib/data";

type Row = {
  booth: string;
  criterion: string;
  score: number;
  evaluator_name: string;
  created_at: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [expandedBooth, setExpandedBooth] = useState<string | null>(null);

  async function login() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setRows(data.rows);
      setAuthorized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    return BOOTHS.map((booth) => {
      const boothRows = rows.filter((r) => r.booth === booth);
      const evaluators = new Set(boothRows.map((r) => r.evaluator_name));
      const overall =
        boothRows.length > 0
          ? boothRows.reduce((acc, r) => acc + r.score, 0) / boothRows.length
          : null;
      const perCriterion = CRITERIA.map((c) => {
        const matching = boothRows.filter((r) => r.criterion === c.key);
        const avg =
          matching.length > 0
            ? matching.reduce((acc, r) => acc + r.score, 0) / matching.length
            : null;
        return { ...c, avg };
      });
      const perEvaluator = [...evaluators].map((name) => {
        const evalRows = boothRows.filter((r) => r.evaluator_name === name);
        const total = evalRows.reduce((acc, r) => acc + r.score, 0);
        const criteriaScores = CRITERIA.map((c) => ({
          key: c.key,
          score: evalRows.find((r) => r.criterion === c.key)?.score ?? null,
        }));
        return { name, total, average: total / (evalRows.length || 1), criteriaScores };
      }).sort((a, b) => b.total - a.total);

      return { booth, overall, perCriterion, perEvaluator, evaluatorCount: evaluators.size };
    }).sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  }, [rows]);

  if (!authorized) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 px-6 py-16">
        <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl">
          <h1 className="mb-1 text-lg font-semibold text-slate-900">Admin Access</h1>
          <p className="mb-5 text-sm text-slate-500">
            Enter the admin password to view consolidated scores.
          </p>
          <input
            autoFocus
            type="password"
            className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <button
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-40"
            disabled={loading || !password}
            onClick={login}
          >
            {loading ? "Checking…" : "View Dashboard"}
          </button>
          <Link
            href="/"
            className="mt-4 block text-center text-sm font-medium text-slate-400 hover:text-slate-600"
          >
            ← Back to evaluator app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <div className="bg-gradient-to-b from-slate-800 to-slate-700 px-5 pb-8 pt-8 text-white">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <h1 className="text-xl font-semibold">L&amp;D Admin Dashboard</h1>
          <Link
            href="/results"
            className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/25"
          >
            Public Results
          </Link>
        </div>
        <p className="mx-auto mt-1 w-full max-w-2xl text-sm text-slate-300">
          Consolidated and individual evaluator scores
        </p>
      </div>

      <div className="mx-auto -mt-4 w-full max-w-2xl flex-1 px-5 pb-10">
        <div className="flex flex-col gap-4">
          {summary.map(({ booth, overall, perCriterion, perEvaluator, evaluatorCount }, idx) => {
            const expanded = expandedBooth === booth;
            return (
              <div
                key={booth}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
              >
                <button
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  onClick={() => setExpandedBooth(expanded ? null : booth)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{booth}</div>
                      <div className="text-xs text-slate-400">
                        {evaluatorCount} evaluator{evaluatorCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">
                        {overall !== null ? overall.toFixed(2) : "—"}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">
                        Consolidated
                      </div>
                    </div>
                    <span
                      className={`text-slate-300 transition-transform ${expanded ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      ▾
                    </span>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-4">
                      {perCriterion.map((c) => (
                        <div key={c.key}>
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">
                            {c.label}
                          </div>
                          <div className="font-semibold text-slate-800">
                            {c.avg !== null ? c.avg.toFixed(2) : "—"}
                          </div>
                        </div>
                      ))}
                    </div>

                    {perEvaluator.length === 0 ? (
                      <p className="text-sm text-slate-400">No scores submitted yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                              <th className="py-2 pr-3 font-medium">Evaluator</th>
                              {CRITERIA.map((c) => (
                                <th key={c.key} className="py-2 pr-3 font-medium">
                                  {c.label}
                                </th>
                              ))}
                              <th className="py-2 pr-3 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {perEvaluator.map((ev) => (
                              <tr key={ev.name} className="border-b border-slate-50 last:border-0">
                                <td className="py-2 pr-3 font-medium text-slate-800">
                                  {ev.name}
                                </td>
                                {ev.criteriaScores.map((c) => (
                                  <td key={c.key} className="py-2 pr-3 text-slate-600">
                                    {c.score ?? "—"}
                                  </td>
                                ))}
                                <td className="py-2 pr-3 font-semibold text-indigo-600">
                                  {ev.total}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
