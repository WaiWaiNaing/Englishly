import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { messages, rewrites } from "@/db/schema";
import { TONES, CONTEXTS } from "@/lib/constants";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function labelFor<T extends { value: string; label: string }>(
  options: T[],
  value: string,
) {
  return options.find((o) => o.value === value)?.label ?? value;
}

interface HistoryFilters {
  context?: string;
  tone?: string;
  q?: string;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<HistoryFilters>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { context: contextFilter, tone: toneFilter, q: searchQuery } = await searchParams;
  const hasFilters = Boolean(contextFilter || toneFilter || searchQuery);

  const conditions = [eq(messages.userId, session.user.id)];
  if (contextFilter) conditions.push(eq(messages.contextType, contextFilter));
  if (searchQuery) conditions.push(ilike(messages.rawInput, `%${searchQuery}%`));

  const matchedMessages = await db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(30);

  const messageIds = matchedMessages.map((m) => m.id);
  const relatedRewrites = messageIds.length
    ? await db.select().from(rewrites).where(inArray(rewrites.messageId, messageIds))
    : [];

  const rewritesByMessage = new Map<string, typeof relatedRewrites>();
  for (const r of relatedRewrites) {
    if (toneFilter && r.tone !== toneFilter) continue;
    const list = rewritesByMessage.get(r.messageId) ?? [];
    list.push(r);
    rewritesByMessage.set(r.messageId, list);
  }

  // A tone filter can leave a message with zero matching rewrites — drop it.
  const recentMessages = toneFilter
    ? matchedMessages.filter((m) => (rewritesByMessage.get(m.id) ?? []).length > 0)
    : matchedMessages;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="text-sm text-neutral-500">
            {hasFilters
              ? `${recentMessages.length} matching rewrite${recentMessages.length === 1 ? "" : "s"}.`
              : "Your last 30 rewrites."}
          </p>
        </div>
        <Link href="/" className="text-sm text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200">
          ← New rewrite
        </Link>
      </header>

      <form action="/history" className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Context</span>
          <select
            name="context"
            defaultValue={contextFilter ?? ""}
            className="rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
          >
            <option value="">All</option>
            {CONTEXTS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Tone</span>
          <select
            name="tone"
            defaultValue={toneFilter ?? ""}
            className="rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
          >
            <option value="">All</option>
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[160px] flex-1 flex-col gap-1">
          <span className="text-xs text-neutral-500">Search</span>
          <input
            type="text"
            name="q"
            defaultValue={searchQuery ?? ""}
            placeholder="Search your messages..."
            className="rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 outline-none focus:border-neutral-500 dark:border-neutral-700"
          />
        </label>

        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium dark:border-neutral-700"
        >
          Filter
        </button>

        {hasFilters && (
          <Link
            href="/history"
            className="text-xs text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Clear
          </Link>
        )}
      </form>

      {recentMessages.length === 0 && (
        <p className="text-sm text-neutral-500">
          {hasFilters ? "No rewrites match those filters." : "No rewrites yet — go create one."}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {recentMessages.map((m) => (
          <div key={m.id} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{labelFor(CONTEXTS, m.contextType)}</span>
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
              {(rewritesByMessage.get(m.id) ?? []).map((r) => (
                <div key={r.id} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-neutral-500">
                    {labelFor(TONES, r.tone)}
                  </span>
                  <p className="whitespace-pre-wrap text-sm">{r.outputText}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
