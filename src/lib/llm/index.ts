import { GeminiProvider } from "./gemini";
import type { LLMProvider } from "./types";

export type { LLMProvider, RewriteResult, Tone } from "./types";

let instance: LLMProvider | undefined;

// Single seam for swapping providers later — everything else in the app
// should only ever call `getLLM()`, never import `GeminiProvider` directly.
// Lazily constructed so a missing GEMINI_API_KEY only throws on first use,
// not at module import time.
export function getLLM(): LLMProvider {
  if (!instance) instance = new GeminiProvider();
  return instance;
}
