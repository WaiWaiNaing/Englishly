// Shared by every route that calls the LLM, so a Gemini free-tier quota hit
// always surfaces as the same friendly 429 rather than a raw error message.
export function quotaAwareError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const isQuota = message.toLowerCase().includes("quota") || message.includes("429");
  return {
    error: isQuota ? "Gemini quota reached, try again shortly." : message,
    status: isQuota ? 429 : 500,
  };
}
