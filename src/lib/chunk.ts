// Paragraph-based chunker: groups paragraphs up to ~maxChars per chunk.
// A single paragraph longer than maxChars is kept whole rather than split
// mid-sentence — acceptable for FAQ-sized documents, not ideal for very
// long unbroken text.
export function chunkText(text: string, maxChars = 800): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    const candidate = current ? `${current}\n\n${p}` : p;
    if (candidate.length > maxChars && current) {
      chunks.push(current);
      current = p;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}
