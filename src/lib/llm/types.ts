import type { Tone, Language } from "@/lib/constants";

export type { Tone, Language };

export interface RewriteResult {
  output: string;
  explanation: string;
  modelUsed: string;
  latencyMs: number;
}

export interface TranslationResult {
  output: string;
  modelUsed: string;
  latencyMs: number;
}

export interface RewriteOptions {
  // Runs a second pass where the model reviews its own draft against the
  // original message before returning — costs a second API call.
  selfCritique?: boolean;
}

export interface WritingSample {
  input: string;
  explanation: string;
}

export interface WritingPattern {
  title: string;
  detail: string;
  example?: string;
}

export interface LLMProvider {
  rewrite(input: string, tone: Tone, options?: RewriteOptions): Promise<RewriteResult>;
  // Looks across a user's past messages + the per-rewrite explanations of
  // what changed, and surfaces recurring grammar/English patterns — not
  // one-off mistakes — so the user can see what to actually work on.
  analyzeWritingPatterns(samples: WritingSample[]): Promise<WritingPattern[]>;
  // Translates an already-tone-guided English rewrite into another
  // language. Kept separate from `rewrite` because the input here is
  // already-polished English, not the user's raw draft.
  translate(text: string, language: Language, tone: Tone): Promise<TranslationResult>;
}
