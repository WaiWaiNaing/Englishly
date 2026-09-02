"use client";

import { useEffect, useState } from "react";

interface KnowledgeDocument {
  id: string;
  title: string;
  createdAt: string;
}

export function KnowledgeBasePanel() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [chunkCount, setChunkCount] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/knowledge");
    if (!res.ok) return;
    const data = await res.json();
    setDocuments(data.documents);
    setChunkCount(data.chunkCount);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/knowledge")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setDocuments(data.documents);
        setChunkCount(data.chunkCount);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!title.trim() || !text.trim() || saving) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setTitle("");
      setText("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
      <summary className="cursor-pointer font-medium text-neutral-700 dark:text-neutral-300">
        Knowledge base —{" "}
        {documents.length === 0
          ? "empty (Customer reply falls back to a plain rewrite)"
          : `${documents.length} doc${documents.length === 1 ? "" : "s"}, ${chunkCount} chunk${chunkCount === 1 ? "" : "s"}`}
      </summary>

      <div className="mt-3 flex flex-col gap-3">
        <p className="text-xs text-neutral-500">
          Paste an FAQ or policy doc below. When Context is set to
          &quot;Customer reply&quot;, the AI will look up relevant chunks
          here and ground its answer in them instead of just rewriting your
          input.
        </p>

        {documents.length > 0 && (
          <ul className="flex flex-col gap-1 text-xs text-neutral-500">
            {documents.map((d) => (
              <li key={d.id}>• {d.title}</li>
            ))}
          </ul>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title, e.g. Shipping Policy"
          className="w-full rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your FAQ or policy text here..."
          rows={5}
          maxLength={20000}
          className="w-full resize-y rounded-md border border-neutral-300 bg-transparent p-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
        />

        <button
          onClick={handleSave}
          disabled={!title.trim() || !text.trim() || saving}
          className="w-fit rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-neutral-700"
        >
          {saving ? "Saving…" : "Save to knowledge base"}
        </button>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </details>
  );
}
