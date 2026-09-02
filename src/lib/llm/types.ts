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
  // Draft a reply to an inbound message (e.g. a customer inquiry) grounded
  // in retrieved knowledge-base context, rather than rewriting the input.
  answerWithContext(input: string, tone: Tone, context: string[]): Promise<RewriteResult>;
  embed(texts: string[]): Promise<number[][]>;
  // OCR/transcribe an image (e.g. a LINE screenshot of a policy or FAQ) into
  // plain text, for the knowledge base to chunk and embed as usual.
  extractTextFromImage(base64Data: string, mimeType: string): Promise<string>;
}
