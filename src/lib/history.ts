import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { messages, rewrites } from "@/db/schema";

export interface HistoryFilters {
  context?: string;
  tone?: string;
  q?: string;
}

// Shared by the web History page (server component) and GET /api/history
// (mobile) so the filtering logic — including the tone-filter caveat below
// — only exists in one place.
export async function getFilteredHistory(userId: string, filters: HistoryFilters) {
  const { context: contextFilter, tone: toneFilter, q: searchQuery } = filters;

  const conditions = [eq(messages.userId, userId)];
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
  // Note: the tone filter is applied after the 30-message LIMIT, so it
  // effectively searches "last 30 messages" rather than "last 30 matches" —
  // acceptable at current usage scale, worth revisiting if that changes.
  const recentMessages = toneFilter
    ? matchedMessages.filter((m) => (rewritesByMessage.get(m.id) ?? []).length > 0)
    : matchedMessages;

  return { messages: recentMessages, rewritesByMessage };
}
