import type { Tone } from "@/lib/constants";

export type { Tone };

export interface RewriteResult {
  output: string;
  explanation: string;
  modelUsed: string;
  latencyMs: number;
}

export interface LLMProvider {
  rewrite(input: string, tone: Tone): Promise<RewriteResult>;
}
