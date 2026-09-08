"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CARD_ACCENTS } from "@/lib/theme";
import { SparklesIcon, ChevronRightIcon } from "@/components/icons";

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

function FlashCard({ tip, index }: { tip: Tip; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const Icon = accent.icon;

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      className={`flip-card min-h-[180px] w-full text-left ${flipped ? "is-flipped" : ""}`}
    >
      <div className="flip-card-inner min-h-[180px]">
        <div
          className={`flip-card-face flex min-h-[180px] flex-col gap-3 overflow-hidden rounded-xl border border-t-4 border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 ${accent.borderTop}`}
        >
          <div className="flex items-center justify-between">
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${accent.badge}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-xs text-neutral-400">#{index + 1}</span>
          </div>
          <h2 className="text-base font-semibold leading-snug">{tip.title}</h2>
          <div className="mt-auto flex items-center gap-1 text-xs font-medium text-neutral-500">
            Tap to see the tip
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </div>
        </div>

        <div
          className={`flip-card-face flip-card-back flex min-h-[180px] flex-col gap-2 overflow-y-auto rounded-xl border border-t-4 border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${accent.borderTop}`}
        >
          <p className="text-sm text-neutral-700 dark:text-neutral-300">{tip.detail}</p>
          {tip.example && (
            <p className="mt-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-2 text-xs italic text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              &ldquo;{tip.example}&rdquo;
            </p>
          )}
        </div>
      </div>
    </button>
  );
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Writing insights</h1>
            <p className="text-sm text-neutral-500">
              AI-spotted patterns from your own rewrite history — the mistakes
              you make more than once, not one-off typos.
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="shrink-0 text-sm text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          ← New rewrite
        </Link>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-[180px] animate-pulse rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
            >
              <SparklesIcon className="h-4 w-4" />
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
            <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {!error && data && data.tips.length === 0 && (
            <p className="text-sm text-neutral-500">
              No analysis yet — click the button above once you have a few
              rewrites in your history.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data?.tips.map((tip, i) => (
              <FlashCard key={i} tip={tip} index={i} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
