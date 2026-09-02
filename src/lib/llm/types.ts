import type { Tone } from "@/lib/constants";

export type { Tone };

export interface RewriteResult {
  output: string;
  explanation: string;
  modelUsed: string;
  latencyMs: number;
}

export interface RewriteOptions {
  // Runs a second pass where the model reviews its own draft against the
  // original message before returning — costs a second API call.
  selfCritique?: boolean;
}

export interface LLMProvider {
  rewrite(input: string, tone: Tone, options?: RewriteOptions): Promise<RewriteResult>;
}
