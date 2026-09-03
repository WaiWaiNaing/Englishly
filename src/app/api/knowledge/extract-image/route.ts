import { NextResponse } from "next/server";
import { getLLM } from "@/lib/llm";
import { getSessionUserId } from "@/lib/session";

// Separate from POST /api/knowledge so each image in a multi-file upload is
// its own small request — keeps every request well under Vercel's 4.5MB
// body limit regardless of how many screenshots the user attaches, instead
// of trying to cram them all into one payload.
export async function POST(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const imageData = typeof body?.image === "string" ? body.image : "";
  const imageMimeType = typeof body?.imageMimeType === "string" ? body.imageMimeType : "";

  if (!imageData) {
    return NextResponse.json({ error: "image is required" }, { status: 400 });
  }
  if (imageData.length > 4_000_000) {
    return NextResponse.json({ error: "image is too large (max ~3MB)" }, { status: 400 });
  }

  try {
    const text = await getLLM().extractTextFromImage(imageData, imageMimeType);
    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
