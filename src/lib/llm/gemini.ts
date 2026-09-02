import { GoogleGenAI, Type } from "@google/genai";
import type { LLMProvider, RewriteResult, Tone } from "./types";

const MODEL = "gemini-3.5-flash-lite";

const TONE_GUIDANCE: Record<Tone, string> = {
  professional:
    "clear, polished, and businesslike — confident but not stiff",
  friendly: "warm and conversational while still being clear and respectful",
  formal:
    "formal and precise, suitable for official or high-stakes correspondence",
};

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI;

  constructor(apiKey = process.env.GEMINI_API_KEY) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    this.client = new GoogleGenAI({ apiKey });
  }

  async rewrite(input: string, tone: Tone): Promise<RewriteResult> {
    const start = Date.now();

    const response = await this.client.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "You help a non-native English speaker rewrite workplace messages",
                "(Slack updates, emails, customer replies, PR comments) in natural,",
                `${TONE_GUIDANCE[tone]} English.`,
                "",
                tone === "friendly"
                  ? "A little casual idiom is fine here."
                  : 'Prefer precise, standard phrasing over casual idioms — e.g. "arrive" rather than "make it in", "unable to" rather than "can\'t swing it".',
                "",
                "Rewrite the message below. Keep the original meaning and intent —",
                "do not add information that wasn't there. Then briefly explain the",
                "key changes you made and why, so the writer learns from it. Keep the",
                "explanation to 2-4 short bullet points, plain language, no jargon.",
                "",
                `Message:\n"""${input}"""`,
              ].join("\n"),
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            output: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["output", "explanation"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Gemini returned an empty response");

    const parsed = JSON.parse(text) as { output: string; explanation: string };

    return {
      output: parsed.output,
      explanation: parsed.explanation,
      modelUsed: MODEL,
      latencyMs: Date.now() - start,
    };
  }
}
