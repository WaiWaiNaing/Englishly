import Link from "next/link";
import { redirect } from "next/navigation";
import { TONES, CONTEXTS } from "@/lib/constants";
import { TONE_ICONS, CONTEXT_ICONS, TONE_ACCENT } from "@/lib/theme";
import { ClockIcon, SearchIcon, XIcon } from "@/components/icons";
import { auth } from "@/lib/auth";
import { getFilteredHistory, type HistoryFilters } from "@/lib/history";

export const dynamic = "force-dynamic";

function labelFor<T extends { value: string; label: string }>(
  options: T[],
  value: string,
) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<HistoryFilters>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const filters = await searchParams;
  const hasFilters = Boolean(filters.context || filters.tone || filters.q);

  function hrefFor(overrides: { context?: string; tone?: string }) {
    const params = new URLSearchParams();
    const context = overrides.context ?? filters.context;
    const tone = overrides.tone ?? filters.tone;
    if (context) params.set("context", context);
    if (tone) params.set("tone", tone);
    if (filters.q) params.set("q", filters.q);
    const qs = params.toString();
    return qs ? `/history?${qs}` : "/history";
  }

  const { messages: recentMessages, rewritesByMessage } = await getFilteredHistory(
    session.user.id,
    filters,
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-900 text-white shadow-sm dark:from-neutral-300 dark:to-neutral-100 dark:text-neutral-900">
            <ClockIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">History</h1>
            <p className="text-sm text-neutral-500">
              {hasFilters
                ? `${recentMessages.length} matching rewrite${recentMessages.length === 1 ? "" : "s"}.`
                : "Your last 30 rewrites."}
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

      <form action="/history" className="flex flex-col gap-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <a
            href={hrefFor({ context: "" })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              !filters.context
                ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400"
            }`}
          >
            All contexts
          </a>
          {CONTEXTS.map((c) => {
            const Icon = CONTEXT_ICONS[c.value];
            const active = filters.context === c.value;
            return (
              <a
                key={c.value}
                href={hrefFor({ context: c.value })}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                    : "border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                {c.label}
              </a>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={hrefFor({ tone: "" })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              !filters.tone
                ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400"
            }`}
          >
            All tones
          </a>
          {TONES.map((t) => {
            const Icon = TONE_ICONS[t.value];
            const active = filters.tone === t.value;
            return (
              <a
                key={t.value}
                href={hrefFor({ tone: t.value })}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                    : "border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </a>
            );
          })}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[160px] flex-1 flex-col gap-1">
            <span className="text-xs text-neutral-500">Search</span>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Search your messages..."
                className="w-full rounded-md border border-neutral-300 bg-transparent py-1.5 pl-8 pr-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700"
              />
            </div>
          </label>
          {filters.context && <input type="hidden" name="context" value={filters.context} />}
          {filters.tone && <input type="hidden" name="tone" value={filters.tone} />}

          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium dark:border-neutral-700"
          >
            Search
          </button>

          {hasFilters && (
            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-xs text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <XIcon className="h-3.5 w-3.5" />
              Clear filters
            </Link>
          )}
        </div>
      </form>

      {recentMessages.length === 0 && (
        <p className="text-sm text-neutral-500">
          {hasFilters ? "No rewrites match those filters." : "No rewrites yet — go create one."}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {recentMessages.map((m) => {
          const ContextIcon = CONTEXT_ICONS[m.contextType as keyof typeof CONTEXT_ICONS];
          return (
            <div
              key={m.id}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 shadow-sm dark:border-neutral-800"
            >
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  {ContextIcon && <ContextIcon className="h-3.5 w-3.5" />}
                  {labelFor(CONTEXTS, m.contextType)}
                </span>
                <span>
                  {new Date(m.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                {m.rawInput}
              </p>

              <div className="flex flex-col gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                {(rewritesByMessage.get(m.id) ?? []).map((r) => {
                  const ToneIcon = TONE_ICONS[r.tone as keyof typeof TONE_ICONS];
                  const accent = TONE_ACCENT[r.tone as keyof typeof TONE_ACCENT];
                  return (
                    <div key={r.id} className="flex flex-col gap-1">
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${accent?.bg ?? ""} ${accent?.text ?? "text-neutral-500"}`}
                      >
                        {ToneIcon && <ToneIcon className="h-3 w-3" />}
                        {labelFor(TONES, r.tone)}
                      </span>
                      <p className="whitespace-pre-wrap text-sm">{r.outputText}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
