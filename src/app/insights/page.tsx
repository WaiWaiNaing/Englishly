"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Tip {
  title: string;
  detail: string;
  example?: string;
}

interface InsightsData {
  tips: Tip[];
  messageCount: number;
  createdAt: string | null;
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/insights")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: InsightsData | null) => {
        if (!cancelled && body) setData(body);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRegenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong");
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Writing insights</h1>
          <p className="text-sm text-neutral-500">
            AI-spotted patterns from your own rewrite history — the mistakes
            you make more than once, not one-off typos.
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 text-sm text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          ← New rewrite
        </Link>
      </header>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
            >
              {regenerating
                ? "Analyzing…"
                : data && data.tips.length > 0
                  ? "Refresh analysis"
                  : "Analyze my writing"}
            </button>
            {data?.createdAt && (
              <span className="text-xs text-neutral-500">
                Last updated{" "}
                {new Date(data.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                · based on your last {data.messageCount} rewrite
                {data.messageCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {error && (
            <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {!error && data && data.tips.length === 0 && (
            <p className="text-sm text-neutral-500">
              No analysis yet — click the button above once you have a few
              rewrites in your history.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {data?.tips.map((tip, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
              >
                <h2 className="text-sm font-medium">{tip.title}</h2>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {tip.detail}
                </p>
                {tip.example && (
                  <p className="whitespace-pre-wrap rounded-md bg-neutral-100 p-2 text-xs italic text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                    &ldquo;{tip.example}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
