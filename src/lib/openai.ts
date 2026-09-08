import OpenAI from "openai";
import { LANGUAGES, type Language, type Tone } from "@/lib/constants";

// Configurable via env rather than hardcoded, since — like the Gemini model
// name elsewhere in this app — the right value depends on what's actually
// available on the account, and is easiest to fix without a redeploy.
const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

const TONE_GUIDANCE: Record<Tone, string> = {
  professional: "clear, polished, and businesslike",
  friendly: "warm and conversational, but still respectful",
  formal: "formal and precise, suitable for official correspondence",
};

export interface ToneCheckResult {
  output: string;
  modelUsed: string;
  latencyMs: number;
}

// A second opinion on Gemini's translation, from a different model family —
// specifically to catch phrasing that's grammatically correct but reads as
// translated rather than natural, which a model tends to miss in its own
// output more than in someone else's.
export class OpenAIToneChecker {
  private client: OpenAI;

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    this.client = new OpenAI({ apiKey });
  }

  async polishTranslation(text: string, language: Language, tone: Tone): Promise<ToneCheckResult> {
    const start = Date.now();
    const languageLabel = LANGUAGES.find((l) => l.value === language)?.label ?? language;

    const response = await this.client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            `You are a native ${languageLabel} speaker and professional translator.`,
            `The text below was translated into ${languageLabel} by another system.`,
            "Review it for natural, idiomatic phrasing — fix anything that reads",
            "as translated or stiff rather than something a native speaker would",
            `actually write. Target tone: ${TONE_GUIDANCE[tone]}. Keep the meaning`,
            "exactly the same — do not add or remove information. Reply with ONLY",
            "the final polished text, nothing else.",
            "",
            `Text:\n"""${text}"""`,
          ].join("\n"),
        },
      ],
    });

    const output = response.choices[0]?.message?.content?.trim();
    if (!output) throw new Error("ChatGPT returned an empty response");

    return { output, modelUsed: MODEL, latencyMs: Date.now() - start };
  }
}

let instance: OpenAIToneChecker | undefined;

// Mirrors getLLM()'s lazy-singleton pattern — a missing OPENAI_API_KEY only
// throws when this is actually called (i.e. only for non-English output),
// not at import time, so English-only usage of the app is unaffected.
export function getToneChecker(): OpenAIToneChecker {
  if (!instance) instance = new OpenAIToneChecker();
  return instance;
}
