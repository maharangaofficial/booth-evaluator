"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BOOTHS, CRITERIA } from "@/lib/data";

export default function Home() {
  const [evaluatorName, setEvaluatorName] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [submittedBooths, setSubmittedBooths] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("evaluatorName");
    if (savedName) {
      setEvaluatorName(savedName);
      setNameConfirmed(true);
    }
    const savedSubmitted = localStorage.getItem("submittedBooths");
    if (savedSubmitted) {
      setSubmittedBooths(new Set(JSON.parse(savedSubmitted)));
    }
  }, []);

  function confirmName() {
    const trimmed = evaluatorName.trim();
    if (!trimmed) return;
    localStorage.setItem("evaluatorName", trimmed);
    setEvaluatorName(trimmed);
    setNameConfirmed(true);
  }

  function openBooth(code: string) {
    setSelectedCode(code);
    setScores({});
    setComment("");
    setStatus("idle");
    setErrorMessage("");
  }

  function setScore(criterion: string, value: number) {
    setScores((prev) => ({ ...prev, [criterion]: value }));
  }

  const selectedBooth = useMemo(
    () => BOOTHS.find((b) => b.code === selectedCode) ?? null,
    [selectedCode]
  );

  const groupedByRoom = useMemo(() => {
    const groups = new Map<string, typeof BOOTHS>();
    for (const booth of BOOTHS) {
      const list = groups.get(booth.room) ?? [];
      list.push(booth);
      groups.set(booth.room, list);
    }
    return [...groups.entries()];
  }, []);

  async function submitScores() {
    if (!selectedBooth) return;
    if (Object.keys(scores).length < CRITERIA.length) {
      setErrorMessage("Please rate every criterion before submitting.");
      return;
    }

    setStatus("saving");
    setErrorMessage("");

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluatorName,
          booth: selectedBooth.code,
          scores,
          comment,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit scores");
      }

      const updated = new Set(submittedBooths);
      updated.add(selectedBooth.code);
      setSubmittedBooths(updated);
      localStorage.setItem("submittedBooths", JSON.stringify([...updated]));

      setStatus("saved");
      setSelectedCode(null);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!nameConfirmed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-indigo-600 via-indigo-500 to-slate-100 px-6 py-16">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
            🏆
          </div>
          <h1 className="text-2xl font-semibold text-white">Booth Evaluator</h1>
          <p className="mt-1 text-sm text-indigo-100">Cross The Floor — Judging Console</p>
        </div>
        <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl shadow-indigo-900/10 ring-1 ring-black/5">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Welcome, Evaluator</h2>
          <p className="mb-5 text-sm text-slate-500">
            Enter your name to start rating booths.
          </p>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
            Your name
          </label>
          <input
            autoFocus
            className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            placeholder="e.g. Priya Sharma"
            value={evaluatorName}
            onChange={(e) => setEvaluatorName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmName()}
          />
          <button
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!evaluatorName.trim()}
            onClick={confirmName}
          >
            Start Evaluating
          </button>
        </div>
      </div>
    );
  }

  if (selectedBooth) {
    const ratedCount = Object.keys(scores).length;
    return (
      <div className="flex flex-1 flex-col bg-slate-50">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
          <button
            className="mb-2 flex items-center gap-1 text-sm font-medium text-indigo-600"
            onClick={() => setSelectedCode(null)}
          >
            <span aria-hidden>←</span> Back to booths
          </button>
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-500">
            {selectedBooth.bu} · {selectedBooth.room}
          </p>
          <h1 className="text-xl font-semibold text-slate-900">{selectedBooth.theme}</h1>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${(ratedCount / CRITERIA.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md flex-1 px-5 py-6">
          <div className="flex flex-col gap-4">
            {CRITERIA.map((criterion) => (
              <div
                key={criterion.key}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
              >
                <div className="mb-3 text-sm font-semibold text-slate-800">
                  {criterion.label}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setScore(criterion.key, value)}
                      className={`h-12 flex-1 rounded-xl border text-base font-semibold transition-all ${
                        scores[criterion.key] === value
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="mb-2 text-sm font-semibold text-slate-800">
                Comments <span className="font-normal text-slate-400">(optional)</span>
              </div>
              <textarea
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                rows={3}
                placeholder="Any feedback for this booth…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4">
          <button
            className="mx-auto flex w-full max-w-md items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 font-medium text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={status === "saving"}
            onClick={submitScores}
          >
            {status === "saving" ? "Submitting…" : "Submit Scores"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <div className="bg-gradient-to-b from-indigo-600 to-indigo-500 px-5 pb-8 pt-8 text-white">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-100">
              Evaluator
            </p>
            <h1 className="text-xl font-semibold">{evaluatorName}</h1>
          </div>
          <Link
            href="/results"
            className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/25"
          >
            View Results
          </Link>
        </div>
        <div className="mx-auto mt-4 w-full max-w-md text-sm text-indigo-100">
          {submittedBooths.size} of {BOOTHS.length} booths rated
        </div>
      </div>

      <div className="mx-auto -mt-4 w-full max-w-md flex-1 px-5 pb-8">
        {status === "saved" && (
          <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-100">
            ✓ Scores saved successfully
          </p>
        )}

        <div className="flex flex-col gap-6">
          {groupedByRoom.map(([room, booths]) => (
            <div key={room}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {room}
              </h2>
              <div className="flex flex-col gap-3">
                {booths.map((booth) => {
                  const done = submittedBooths.has(booth.code);
                  return (
                    <button
                      key={booth.code}
                      onClick={() => openBooth(booth.code)}
                      className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">
                          {booth.bu}
                        </p>
                        <span className="font-semibold text-slate-900">{booth.theme}</span>
                        {!done && <p className="mt-0.5 text-xs text-slate-400">Tap to rate</p>}
                      </div>
                      {done ? (
                        <span className="ml-3 flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          ✓ Rated
                        </span>
                      ) : (
                        <span className="ml-3 shrink-0 text-slate-300" aria-hidden>
                          →
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
