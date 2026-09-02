"use client";

import { useEffect, useRef, useState } from "react";

interface KnowledgeDocument {
  id: string;
  title: string;
  createdAt: string;
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // ~3MB raw, stays under Vercel's 4.5MB body limit after base64

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? ""); // strip the "data:<mime>;base64," prefix
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function KnowledgeBasePanel() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [chunkCount, setChunkCount] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    if (file && file.size > MAX_IMAGE_BYTES) {
      setError("Image is too large (max ~3MB).");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setImageFile(file);
    if (file) setText(""); // one source at a time — image takes priority
  }

  async function handleSave() {
    if (!title.trim() || (!text.trim() && !imageFile) || saving) return;

    setSaving(true);
    setError(null);
    try {
      const body = imageFile
        ? { title, image: await readFileAsBase64(imageFile), imageMimeType: imageFile.type }
        : { title, text };

      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setTitle("");
      setText("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          Paste an FAQ/policy doc, or upload a screenshot (e.g. from LINE) —
          text gets read out of the image automatically. When Context is set
          to &quot;Customer reply&quot;, the AI looks up relevant chunks here
          and grounds its answer in them instead of just rewriting your
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
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value) {
              setImageFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }
          }}
          placeholder="Paste your FAQ or policy text here..."
          rows={5}
          maxLength={20000}
          disabled={!!imageFile}
          className="w-full resize-y rounded-md border border-neutral-300 bg-transparent p-2 text-sm outline-none disabled:opacity-40 focus:border-neutral-500 dark:border-neutral-700"
        />

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>or</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-xs file:mr-2 file:rounded file:border file:border-neutral-300 file:bg-transparent file:px-2 file:py-1 file:text-xs dark:file:border-neutral-700"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!title.trim() || (!text.trim() && !imageFile) || saving}
          className="w-fit rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-neutral-700"
        >
          {saving ? (imageFile ? "Reading image…" : "Saving…") : "Save to knowledge base"}
        </button>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </details>
  );
}
