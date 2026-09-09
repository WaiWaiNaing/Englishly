import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, rewrites } from "@/db/schema";
import { getLLM } from "@/lib/llm";
import { getToneChecker } from "@/lib/openai";
import { TONES, CONTEXTS, LANGUAGES, type Tone, type Language } from "@/lib/constants";
import { getSessionUserId } from "@/lib/session";
import { quotaAwareError } from "@/lib/quotaAwareError";

const VALID_TONES = TONES.map((t) => t.value);
const VALID_CONTEXTS = CONTEXTS.map((c) => c.value);
const VALID_LANGUAGES = LANGUAGES.map((l) => l.value);

// Generates one tone's rewrite. For English (the default) this is just the
// Gemini rewrite step. For any other language, the Gemini rewrite is always
// done first — its "why it changed" explanation is English-learning
// feedback and only makes sense against an English draft — then that draft
// is translated, then (if configured) passed through ChatGPT for a natural-
// tone check. ChatGPT is optional and best-effort: if it's unconfigured OR
// it fails for any reason (billing, quota, an outage), this falls back to
// Gemini's translation alone rather than failing the whole request — a
// worse-but-working result beats no result.
async function generateOne(input: string, tone: Tone, language: Language, selfCritique: boolean) {
  const draft = await getLLM().rewrite(input, tone, { selfCritique });

  if (language === "en") {
    return {
      tone,
      language,
      output: draft.output,
      explanation: draft.explanation,
      modelUsed: draft.modelUsed,
      latencyMs: draft.latencyMs,
    };
  }

  const translated = await getLLM().translate(draft.output, language, tone);
  let output = translated.output;
  let modelUsed = `${draft.modelUsed}+${translated.modelUsed}`;
  let latencyMs = draft.latencyMs + translated.latencyMs;

  if (process.env.OPENAI_API_KEY) {
    try {
      const polished = await getToneChecker().polishTranslation(translated.output, language, tone);
      output = polished.output;
      modelUsed += `+${polished.modelUsed}`;
      latencyMs += polished.latencyMs;
    } catch (error) {
      console.error("ChatGPT tone-check failed, falling back to Gemini translation:", error);
    }
  }

  return { tone, language, output, explanation: draft.explanation, modelUsed, latencyMs };
}

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
  const language: Language = VALID_LANGUAGES.includes(body?.outputLanguage)
    ? body.outputLanguage
    : "en";

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
      tonesToGenerate.map((t) => generateOne(input, t, language, selfCritique)),
    );
  } catch (error) {
    const { error: message, status } = quotaAwareError(error);
    return NextResponse.json({ error: message }, { status });
  }

  // Only persist the message once we know at least the generation succeeded,
  // so a failed LLM call doesn't leave an orphaned message with no rewrite.
  const [message] = await db
    .insert(messages)
    .values({ userId, contextType, rawInput: input })
    .returning();

  await db.insert(rewrites).values(
    generated.map((r) => ({
      messageId: message.id,
      tone: r.tone,
      language: r.language,
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
