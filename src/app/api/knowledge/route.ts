import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { knowledgeDocuments, knowledgeChunks } from "@/db/schema";
import { getLLM } from "@/lib/llm";
import { chunkText } from "@/lib/chunk";
import { getOrCreateOrgForUser } from "@/lib/org";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getOrCreateOrgForUser(session.user.id);

  const documents = await db
    .select({
      id: knowledgeDocuments.id,
      title: knowledgeDocuments.title,
      createdAt: knowledgeDocuments.createdAt,
    })
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.orgId, org.id))
    .orderBy(desc(knowledgeDocuments.createdAt));

  const chunks = await db
    .select({ id: knowledgeChunks.id })
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.orgId, org.id));

  return NextResponse.json({ documents, chunkCount: chunks.length });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const pastedText = typeof body?.text === "string" ? body.text.trim() : "";
  const imageData = typeof body?.image === "string" ? body.image : "";
  const imageMimeType = typeof body?.imageMimeType === "string" ? body.imageMimeType : "";

  if (!title || (!pastedText && !imageData)) {
    return NextResponse.json(
      { error: "title and either text or an image are required" },
      { status: 400 },
    );
  }
  if (pastedText.length > 20000) {
    return NextResponse.json(
      { error: "text is too long (max 20000 characters)" },
      { status: 400 },
    );
  }
  // ~3MB raw, base64-inflated — stays well under Vercel's 4.5MB request body limit.
  if (imageData.length > 4_000_000) {
    return NextResponse.json({ error: "image is too large (max ~3MB)" }, { status: 400 });
  }

  let text: string;
  try {
    text = imageData ? await getLLM().extractTextFromImage(imageData, imageMimeType) : pastedText;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    return NextResponse.json({ error: "no content to index" }, { status: 400 });
  }

  const org = await getOrCreateOrgForUser(session.user.id);

  let embeddings: number[][];
  try {
    embeddings = await getLLM().embed(chunks);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const [document] = await db
    .insert(knowledgeDocuments)
    .values({ orgId: org.id, title, sourceType: "faq", rawText: text })
    .returning();

  await db.insert(knowledgeChunks).values(
    chunks.map((content, i) => ({
      documentId: document.id,
      orgId: org.id,
      chunkIndex: i,
      content,
      embedding: embeddings[i],
    })),
  );

  return NextResponse.json({ documentId: document.id, chunkCount: chunks.length });
}
