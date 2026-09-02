"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TONES, CONTEXTS, type Tone, type ContextType } from "@/lib/constants";
import { KnowledgeBasePanel } from "@/components/KnowledgeBasePanel";

interface RewriteResult {
  output: string;
  explanation: string;
}

interface ToneResult extends RewriteResult {
  tone: Tone;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [contextType, setContextType] = useState<ContextType>("slack");
  const [compareAll, setCompareAll] = useState(false);
  const [selfCritique, setSelfCritique] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [compareResults, setCompareResults] = useState<ToneResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedTone, setCopiedTone] = useState<Tone | "single" | null>(null);
  const [slowHint, setSlowHint] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setSlowHint(true), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCompareResults(null);
    setCopiedTone(null);
    setSlowHint(false);

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          contextType,
          selfCritique,
          ...(compareAll ? { compareAll: true } : { tone }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      if (compareAll) setCompareResults(data.results);
      else setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string, key: Tone | "single") {
    await navigator.clipboard.writeText(text);
    setCopiedTone(key);
    setTimeout(() => setCopiedTone(null), 1500);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Englishly</h1>
          <p className="text-sm text-neutral-500">
            Paste a message you want to send. Get a natural, professional rewrite —
            and an explanation of what changed, so you actually learn from it.
          </p>
        </div>
        <Link
          href="/history"
          className="shrink-0 text-sm text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          History
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. hi team, sorry for late reply, i will finish the PR tmr morning..."
          rows={6}
          maxLength={4000}
          className="w-full resize-y rounded-lg border border-neutral-300 bg-transparent p-3 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
        />

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-500">Tone</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              disabled={compareAll}
              className="rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 disabled:opacity-40 dark:border-neutral-700"
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-500">Context</span>
            <select
              value={contextType}
              onChange={(e) => setContextType(e.target.value as ContextType)}
              className="rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
            >
              {CONTEXTS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 pb-1.5 text-sm text-neutral-500">
            <input
              type="checkbox"
              checked={compareAll}
              onChange={(e) => setCompareAll(e.target.checked)}
            />
            Compare all tones
          </label>

          <label className="flex items-center gap-2 pb-1.5 text-sm text-neutral-500" title="Runs a second pass where the AI reviews its own draft — slower, uses more of your daily quota">
            <input
              type="checkbox"
              checked={selfCritique}
              onChange={(e) => setSelfCritique(e.target.checked)}
            />
            Self-critique
          </label>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {loading
            ? selfCritique
              ? "Rewriting + reviewing… (~2x slower)"
              : "Rewriting…"
            : "Rewrite"}
        </button>

        {slowHint && (
          <p className="text-xs text-neutral-500">
            Still working — response time on the Gemini free tier varies,
            this can occasionally take 5-10s.
          </p>
        )}
      </form>

      {error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {result && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-500">Rewrite</h2>
              <button
                onClick={() => handleCopy(result.output, "single")}
                className="text-xs text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                {copiedTone === "single" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="whitespace-pre-wrap rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
              {result.output}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-neutral-500">
              Why it changed
            </h2>
            <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
              {result.explanation}
            </p>
          </div>
        </section>
      )}

      {compareResults && (
        <section className="flex flex-col gap-6">
          {compareResults.map((r) => (
            <div key={r.tone} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">
                  {TONES.find((t) => t.value === r.tone)?.label ?? r.tone}
                </h2>
                <button
                  onClick={() => handleCopy(r.output, r.tone)}
                  className="text-xs text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  {copiedTone === r.tone ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm">{r.output}</p>
              <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                {r.explanation}
              </p>
            </div>
          ))}
        </section>
      )}

      <KnowledgeBasePanel />
    </main>
  );
}
