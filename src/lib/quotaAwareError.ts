// Shared by every route that calls an LLM (Gemini, and now optionally
// ChatGPT for the translation tone-check), so a quota/billing hit always
// surfaces as the same friendly 429 rather than a raw provider error.
// Deliberately doesn't name a specific vendor — a 429 caught here could be
// from either.
export function quotaAwareError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const isQuota =
    message.toLowerCase().includes("quota") ||
    message.toLowerCase().includes("credits") ||
    message.includes("429");
  return {
    error: isQuota ? "AI quota reached, try again shortly." : message,
    status: isQuota ? 429 : 500,
  };
}
