import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getFilteredHistory } from "@/lib/history";

export async function GET(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const filters = {
    context: url.searchParams.get("context") ?? undefined,
    tone: url.searchParams.get("tone") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  };

  const { messages, rewritesByMessage } = await getFilteredHistory(userId, filters);

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      contextType: m.contextType,
      rawInput: m.rawInput,
      createdAt: m.createdAt,
      rewrites: (rewritesByMessage.get(m.id) ?? []).map((r) => ({
        id: r.id,
        tone: r.tone,
        outputText: r.outputText,
        explanation: r.explanation,
      })),
    })),
  });
}
