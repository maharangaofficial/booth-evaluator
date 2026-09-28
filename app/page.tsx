"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BOOTHS, CRITERIA } from "@/lib/data";

export default function Home() {
  const [evaluatorName, setEvaluatorName] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
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

  function openBooth(booth: string) {
    setSelectedBooth(booth);
    setScores({});
    setStatus("idle");
    setErrorMessage("");
  }

  function setScore(criterion: string, value: number) {
    setScores((prev) => ({ ...prev, [criterion]: value }));
  }

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
        body: JSON.stringify({ evaluatorName, booth: selectedBooth, scores }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit scores");
      }

      const updated = new Set(submittedBooths);
      updated.add(selectedBooth);
      setSubmittedBooths(updated);
      localStorage.setItem("submittedBooths", JSON.stringify([...updated]));

      setStatus("saved");
      setSelectedBooth(null);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!nameConfirmed) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Booth Evaluator
          </h1>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Enter your name to begin evaluating booths.
          </p>
          <input
            autoFocus
            className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            placeholder="Your name"
            value={evaluatorName}
            onChange={(e) => setEvaluatorName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmName()}
          />
          <button
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
            disabled={!evaluatorName.trim()}
            onClick={confirmName}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (selectedBooth) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-50 px-4 py-6 dark:bg-black">
        <div className="mx-auto w-full max-w-md">
          <button
            className="mb-4 text-sm text-zinc-500 dark:text-zinc-400"
            onClick={() => setSelectedBooth(null)}
          >
            ← Back to booths
          </button>
          <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {selectedBooth}
          </h1>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Rate each criterion from 1 (low) to 5 (high).
          </p>

          <div className="flex flex-col gap-5">
            {CRITERIA.map((criterion) => (
              <div key={criterion.key}>
                <div className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {criterion.label}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setScore(criterion.key, value)}
                      className={`h-12 flex-1 rounded-lg border text-base font-semibold transition-colors ${
                        scores[criterion.key] === value
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                          : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {errorMessage && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          )}

          <button
            className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
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
    <div className="flex flex-1 flex-col bg-zinc-50 px-4 py-6 dark:bg-black">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Hi, {evaluatorName}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Select a booth to rate</p>
          </div>
          <Link href="/results" className="text-sm font-medium text-zinc-500 underline dark:text-zinc-400">
            Results
          </Link>
        </div>

        {status === "saved" && (
          <p className="mb-4 text-sm text-green-600 dark:text-green-400">Scores saved!</p>
        )}

        <div className="flex flex-col gap-3">
          {BOOTHS.map((booth) => (
            <button
              key={booth}
              onClick={() => openBooth(booth)}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-4 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{booth}</span>
              {submittedBooths.has(booth) && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  ✓ Rated
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
