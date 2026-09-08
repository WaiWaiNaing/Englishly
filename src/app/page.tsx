"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TONES, CONTEXTS, type Tone, type ContextType } from "@/lib/constants";
import { TONE_ICONS, CONTEXT_ICONS, TONE_ACCENT } from "@/lib/theme";
import { Chip } from "@/components/Chip";
import { SparklesIcon, ClockIcon, CopyIcon, CheckIcon, XIcon } from "@/components/icons";

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

  function handleClear() {
    setInput("");
    setResult(null);
    setCompareResults(null);
    setError(null);
    setCopiedTone(null);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Englishly</h1>
            <p className="text-sm text-neutral-500">
              Paste a message you want to send. Get a natural, professional rewrite —
              and an explanation of what changed, so you actually learn from it.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/insights"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-100"
          >
            <SparklesIcon className="h-4 w-4" />
            Insights
          </Link>
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-100"
          >
            <ClockIcon className="h-4 w-4" />
            History
          </Link>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. hi team, sorry for late reply, i will finish the PR tmr morning..."
          rows={6}
          maxLength={4000}
          className="w-full resize-y rounded-xl border border-neutral-300 bg-transparent p-3.5 text-sm shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700"
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-neutral-500">Tone</span>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Chip
                  key={t.value}
                  icon={TONE_ICONS[t.value]}
                  label={t.label}
                  selected={tone === t.value}
                  onClick={() => setTone(t.value)}
                  disabled={compareAll}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-neutral-500">Context</span>
            <div className="flex flex-wrap gap-2">
              {CONTEXTS.map((c) => (
                <Chip
                  key={c.value}
                  icon={CONTEXT_ICONS[c.value]}
                  label={c.label}
                  selected={contextType === c.value}
                  onClick={() => setContextType(c.value)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <input
                type="checkbox"
                checked={compareAll}
                onChange={(e) => setCompareAll(e.target.checked)}
                className="accent-indigo-600"
              />
              Compare all tones
            </label>

            <label
              className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
              title="Runs a second pass where the AI reviews its own draft — slower, uses more of your daily quota"
            >
              <input
                type="checkbox"
                checked={selfCritique}
                onChange={(e) => setSelfCritique(e.target.checked)}
                className="accent-indigo-600"
              />
              Self-critique
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
          >
            <SparklesIcon className="h-4 w-4" />
            {loading
              ? selfCritique
                ? "Rewriting + reviewing… (~2x slower)"
                : "Rewriting…"
              : "Rewrite"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!input && !result && !compareResults && !error}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-100"
          >
            <XIcon className="h-4 w-4" />
            Clear
          </button>
        </div>

        {slowHint && (
          <p className="text-xs text-neutral-500">
            Still working — response time on the Gemini free tier varies,
            this can occasionally take 5-10s.
          </p>
        )}
      </form>

      {error && (
        <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {result && (
        <section className="flex flex-col gap-6">
          <div
            className={`flex flex-col gap-3 rounded-xl border-l-4 p-4 shadow-sm ${TONE_ACCENT[tone].border} ${TONE_ACCENT[tone].bg}`}
          >
            <div className="flex items-center justify-between">
              <h2 className={`inline-flex items-center gap-1.5 text-sm font-medium ${TONE_ACCENT[tone].text}`}>
                Rewrite
              </h2>
              <button
                onClick={() => handleCopy(result.output, "single")}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                {copiedTone === "single" ? (
                  <>
                    <CheckIcon className="h-3.5 w-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm">{result.output}</p>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-neutral-500">Why it changed</h2>
            <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
              {result.explanation}
            </p>
          </div>
        </section>
      )}

      {compareResults && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {compareResults.map((r) => {
            const ToneIcon = TONE_ICONS[r.tone];
            const accent = TONE_ACCENT[r.tone];
            return (
              <div
                key={r.tone}
                className={`flex flex-col gap-3 rounded-xl border-l-4 p-4 shadow-sm ${accent.border} ${accent.bg}`}
              >
                <div className="flex items-center justify-between">
                  <h2 className={`inline-flex items-center gap-1.5 text-sm font-medium ${accent.text}`}>
                    <ToneIcon className="h-4 w-4" />
                    {TONES.find((t) => t.value === r.tone)?.label ?? r.tone}
                  </h2>
                  <button
                    onClick={() => handleCopy(r.output, r.tone)}
                    className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                  >
                    {copiedTone === r.tone ? (
                      <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                      <CopyIcon className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm">{r.output}</p>
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                  {r.explanation}
                </p>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
