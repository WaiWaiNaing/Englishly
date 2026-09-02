import { NextResponse } from "next/server";
import { eq, cosineDistance } from "drizzle-orm";
import { db } from "@/db";
import { messages, rewrites, knowledgeChunks } from "@/db/schema";
import { getLLM } from "@/lib/llm";
import { TONES, CONTEXTS, type Tone } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { getOrCreateDefaultOrg } from "@/lib/org";

const KNOWLEDGE_MATCH_COUNT = 3;

// customer_reply drafts get grounded in the knowledge base when one exists,
// rather than being treated as text to rewrite.
async function retrieveKnowledgeContext(input: string): Promise<string[] | null> {
  const org = await getOrCreateDefaultOrg();

  const hasKnowledge = await db
    .select({ id: knowledgeChunks.id })
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.orgId, org.id))
    .limit(1);
  if (hasKnowledge.length === 0) return null;

  const [queryEmbedding] = await getLLM().embed([input]);

  const retrieved = await db
    .select({ content: knowledgeChunks.content })
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.orgId, org.id))
    .orderBy(cosineDistance(knowledgeChunks.embedding, queryEmbedding))
    .limit(KNOWLEDGE_MATCH_COUNT);

  return retrieved.map((r) => r.content);
}

const VALID_TONES = TONES.map((t) => t.value);
const VALID_CONTEXTS = CONTEXTS.map((c) => c.value);

function quotaAwareError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const isQuota = message.toLowerCase().includes("quota") || message.includes("429");
  return {
    error: isQuota ? "Gemini quota reached, try again shortly." : message,
    status: isQuota ? 429 : 500,
  };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  const input = typeof body?.input === "string" ? body.input.trim() : "";
  const compareAll = body?.compareAll === true;
  const selfCritique = body?.selfCritique === true;
  const tone: Tone = VALID_TONES.includes(body?.tone) ? body.tone : "professional";
  const contextType = VALID_CONTEXTS.includes(body?.contextType)
    ? body.contextType
    : "other";

  if (!input) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }
  if (input.length > 4000) {
    return NextResponse.json(
      { error: "input is too long (max 4000 characters)" },
      { status: 400 },
    );
  }

  const tonesToGenerate = compareAll ? VALID_TONES : [tone];

  let generated;
  try {
    const knowledgeContext =
      contextType === "customer_reply" ? await retrieveKnowledgeContext(input) : null;

    generated = await Promise.all(
      tonesToGenerate.map(async (t) => ({
        tone: t,
        ...(await (knowledgeContext
          ? getLLM().answerWithContext(input, t, knowledgeContext)
          : getLLM().rewrite(input, t, { selfCritique }))),
      })),
    );
  } catch (error) {
    const { error: message, status } = quotaAwareError(error);
    return NextResponse.json({ error: message }, { status });
  }

  // Only persist the message once we know at least the generation succeeded,
  // so a failed Gemini call doesn't leave an orphaned message with no rewrite.
  const [message] = await db
    .insert(messages)
    .values({ userId: session.user.id, contextType, rawInput: input })
    .returning();

  await db.insert(rewrites).values(
    generated.map((r) => ({
      messageId: message.id,
      tone: r.tone,
      outputText: r.output,
      explanation: r.explanation,
      modelUsed: r.modelUsed,
      latencyMs: r.latencyMs,
    })),
  );

  if (compareAll) {
    return NextResponse.json({
      results: generated.map(({ tone, output, explanation }) => ({
        tone,
        output,
        explanation,
      })),
    });
  }
  return NextResponse.json(generated[0]);
}
