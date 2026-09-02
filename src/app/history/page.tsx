import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
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

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const recentMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.userId, session.user.id))
    .orderBy(desc(messages.createdAt))
    .limit(30);

  const messageIds = recentMessages.map((m) => m.id);
  const relatedRewrites = messageIds.length
    ? await db.select().from(rewrites).where(inArray(rewrites.messageId, messageIds))
    : [];

  const rewritesByMessage = new Map<string, typeof relatedRewrites>();
  for (const r of relatedRewrites) {
    const list = rewritesByMessage.get(r.messageId) ?? [];
    list.push(r);
    rewritesByMessage.set(r.messageId, list);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="text-sm text-neutral-500">Your last 30 rewrites.</p>
        </div>
        <Link href="/" className="text-sm text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200">
          ← New rewrite
        </Link>
      </header>

      {recentMessages.length === 0 && (
        <p className="text-sm text-neutral-500">
          No rewrites yet — go create one.
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
