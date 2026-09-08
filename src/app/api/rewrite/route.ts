import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, rewrites } from "@/db/schema";
import { getLLM } from "@/lib/llm";
import { TONES, CONTEXTS, type Tone } from "@/lib/constants";
import { getSessionUserId } from "@/lib/session";
import { quotaAwareError } from "@/lib/quotaAwareError";

const VALID_TONES = TONES.map((t) => t.value);
const VALID_CONTEXTS = CONTEXTS.map((c) => c.value);

export async function POST(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
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
    generated = await Promise.all(
      tonesToGenerate.map(async (t) => ({
        tone: t,
        ...(await getLLM().rewrite(input, t, { selfCritique })),
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
    .values({ userId, contextType, rawInput: input })
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
