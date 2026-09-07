import { GoogleGenAI, Type } from "@google/genai";
import type { LLMProvider, RewriteOptions, RewriteResult, Tone } from "./types";

const MODEL = "gemini-3.5-flash-lite";

const TONE_GUIDANCE: Record<Tone, string> = {
  professional:
    "clear, polished, and businesslike — confident but not stiff",
  friendly: "warm and conversational while still being clear and respectful",
  formal:
    "formal and precise, suitable for official or high-stakes correspondence",
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    output: { type: Type.STRING },
    explanation: { type: Type.STRING },
  },
  required: ["output", "explanation"],
};

const idiomGuidance = (tone: Tone) =>
  tone === "friendly"
    ? "A little casual idiom is fine here."
    : 'Prefer precise, standard phrasing over casual idioms — e.g. "arrive" rather than "make it in", "unable to" rather than "can\'t swing it".';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI;

  constructor(apiKey = process.env.GEMINI_API_KEY) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    this.client = new GoogleGenAI({ apiKey });
  }

  async rewrite(input: string, tone: Tone, options?: RewriteOptions): Promise<RewriteResult> {
    const start = Date.now();

    const draft = await this.generate(input, tone);
    const final = options?.selfCritique ? await this.critique(input, tone, draft) : draft;

    return { ...final, modelUsed: MODEL, latencyMs: Date.now() - start };
  }

  private async generate(input: string, tone: Tone) {
    return this.prompt(
      [
        "You help a non-native English speaker rewrite workplace messages",
        "(Slack updates, emails, customer replies, PR comments) in natural,",
        `${TONE_GUIDANCE[tone]} English.`,
        "",
        idiomGuidance(tone),
        "",
        "Rewrite the message below. Keep the original meaning and intent —",
        "do not add information that wasn't there. Then briefly explain the",
        "key changes you made and why, so the writer learns from it. Keep the",
        "explanation to 2-4 short bullet points, plain language, no jargon.",
        "",
        `Message:\n"""${input}"""`,
      ].join("\n"),
    );
  }

  private async critique(input: string, tone: Tone, draft: { output: string }) {
    return this.prompt(
      [
        "You are reviewing a rewrite of a workplace message for a non-native",
        `English speaker. Target tone: ${TONE_GUIDANCE[tone]}.`,
        idiomGuidance(tone),
        "",
        `Original message:\n"""${input}"""`,
        "",
        `Draft rewrite:\n"""${draft.output}"""`,
        "",
        "Check the draft for accuracy to the original meaning, natural phrasing,",
        "and correct tone. Fix anything awkward, mistranslated, or off-tone. If",
        "it's already good, keep it as is — do not change it just to change it.",
        "",
        "Return the final version and a short explanation (2-4 bullet points) of",
        "what's different between the ORIGINAL message and this FINAL version —",
        "not a commentary on the review process itself.",
      ].join("\n"),
    );
  }

  private async prompt(text: string): Promise<{ output: string; explanation: string }> {
    const response = await this.client.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const raw = response.text;
    if (!raw) throw new Error("Gemini returned an empty response");

    return JSON.parse(raw) as { output: string; explanation: string };
  }
}
