import { GoogleGenAI, Type } from "@google/genai";
import type { LLMProvider, RewriteOptions, RewriteResult, Tone } from "./types";

const MODEL = "gemini-3.5-flash-lite";
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768; // must match src/db/schema.ts knowledgeChunks.embedding

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

  async answerWithContext(input: string, tone: Tone, context: string[]): Promise<RewriteResult> {
    const start = Date.now();

    const result = await this.prompt(
      [
        "You are drafting a customer service reply for a small business.",
        `Target tone: ${TONE_GUIDANCE[tone]}.`,
        idiomGuidance(tone),
        "",
        `A customer sent this message:\n"""${input}"""`,
        "",
        "Use the following context from the business's FAQ/policies to answer",
        "accurately.",
        "",
        "Context:",
        context.map((c, i) => `[${i + 1}] ${c}`).join("\n\n"),
        "",
        "IMPORTANT: only state facts, policies, numbers, or yes/no answers that",
        "are directly supported by the context above. If the context does not",
        "cover part of the customer's question, the REPLY ITSELF (not just the",
        "explanation) must say that you'll check and follow up on that part —",
        "never state or imply an answer, positive or negative, that the context",
        "doesn't support. It's fine to answer the parts the context does cover",
        "and flag only the uncovered part this way.",
        "",
        "Draft the reply. Then briefly explain which parts of the context you",
        "used and why, and which parts (if any) you flagged as needing",
        "follow-up, so the business owner can verify accuracy. Keep the",
        "explanation to 2-4 short bullet points.",
      ].join("\n"),
    );

    return { ...result, modelUsed: MODEL, latencyMs: Date.now() - start };
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: texts,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    return (response.embeddings ?? []).map((e) => e.values ?? []);
  }

  async extractTextFromImage(base64Data: string, mimeType: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "This image is a screenshot (e.g. from LINE, a document, or a",
                "policy page) containing FAQ or business policy information.",
                "Transcribe all the readable text from it as plain text, in",
                "reading order. Do not summarize, translate, or add commentary",
                "— just the text as it appears.",
              ].join("\n"),
            },
            { inlineData: { mimeType, data: base64Data } },
          ],
        },
      ],
    });

    const text = response.text;
    if (!text) throw new Error("Gemini could not read any text from the image");
    return text.trim();
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
