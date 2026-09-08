import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { messages, rewrites, insights } from "@/db/schema";
import type { WritingPattern, WritingSample } from "@/lib/llm";

const SAMPLE_LIMIT = 30;
export const MIN_SAMPLES_REQUIRED = 5;

export interface InsightsResult {
  tips: WritingPattern[];
  messageCount: number;
  createdAt: string | null;
}

// One sample per message: its raw text plus the explanation from whichever
// rewrite ran on it first — that explanation already names what was wrong,
// which is exactly the signal analyzeWritingPatterns needs.
export async function gatherWritingSamples(userId: string): Promise<WritingSample[]> {
  const recentMessages = await db
    .select({ id: messages.id, rawInput: messages.rawInput })
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(desc(messages.createdAt))
    .limit(SAMPLE_LIMIT);

  if (recentMessages.length === 0) return [];

  const messageIds = recentMessages.map((m) => m.id);
  const relatedRewrites = await db
    .select({ messageId: rewrites.messageId, explanation: rewrites.explanation })
    .from(rewrites)
    .where(inArray(rewrites.messageId, messageIds));

  const explanationByMessage = new Map<string, string>();
  for (const r of relatedRewrites) {
    if (!explanationByMessage.has(r.messageId)) explanationByMessage.set(r.messageId, r.explanation);
  }

  return recentMessages
    .filter((m) => explanationByMessage.has(m.id))
    .map((m) => ({ input: m.rawInput, explanation: explanationByMessage.get(m.id)! }));
}

export async function getCachedInsights(userId: string): Promise<InsightsResult | null> {
  const row = await db.query.insights.findFirst({ where: eq(insights.userId, userId) });
  if (!row) return null;
  return {
    tips: row.tips as WritingPattern[],
    messageCount: row.messageCount,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function saveInsights(
  userId: string,
  tips: WritingPattern[],
  messageCount: number,
): Promise<InsightsResult> {
  const [row] = await db
    .insert(insights)
    .values({ userId, tips, messageCount })
    .onConflictDoUpdate({
      target: insights.userId,
      set: { tips, messageCount, createdAt: new Date() },
    })
    .returning();

  return {
    tips: row.tips as WritingPattern[],
    messageCount: row.messageCount,
    createdAt: row.createdAt.toISOString(),
  };
}
