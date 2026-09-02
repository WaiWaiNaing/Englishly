"use client";

import { useEffect, useRef, useState } from "react";

interface KnowledgeDocument {
  id: string;
  title: string;
  createdAt: string;
}

const MAX_FILES = 6;
const MAX_DIMENSION = 1600; // px, long edge — plenty for OCR, far smaller than a raw phone screenshot
const JPEG_QUALITY = 0.82;

// Resize + re-encode as JPEG in-browser so a multi-MB phone screenshot
// becomes a few hundred KB before it ever hits the network — this is what
// actually fixes "image too large", not just raising the size cap.
function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      resolve({ base64: dataUrl.split(",")[1] ?? "", mimeType: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

export function KnowledgeBasePanel() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [chunkCount, setChunkCount] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
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
    const files = Array.from(e.target.files ?? []);
    setError(null);
    if (files.length > MAX_FILES) {
      setError(`Too many files — attach up to ${MAX_FILES} at a time.`);
      setImageFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setImageFiles(files);
    if (files.length > 0) setText(""); // one source at a time — images take priority
  }

  async function handleSave() {
    if (!title.trim() || (!text.trim() && imageFiles.length === 0) || saving) return;

    setSaving(true);
    setError(null);
    try {
      let finalText = text;

      if (imageFiles.length > 0) {
        const extracted: string[] = [];
        for (let i = 0; i < imageFiles.length; i++) {
          setProgress(
            imageFiles.length > 1
              ? `Reading image ${i + 1} of ${imageFiles.length}…`
              : "Reading image…",
          );
          const { base64, mimeType } = await compressImage(imageFiles[i]);
          const res = await fetch("/api/knowledge/extract-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64, imageMimeType: mimeType }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Could not read that image");
          extracted.push(data.text);
        }
        finalText = extracted.join("\n\n");
        setProgress("Saving…");
      } else {
        setProgress("Saving…");
      }

      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text: finalText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setTitle("");
      setText("");
      setImageFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
      setProgress(null);
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
          Paste an FAQ/policy doc, or upload one or more screenshots (e.g.
          from LINE) — text gets read out of each image automatically and
          combined into one document. When Context is set to &quot;Customer
          reply&quot;, the AI looks up relevant chunks here and grounds its
          answer in them instead of just rewriting your input.
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
              setImageFiles([]);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }
          }}
          placeholder="Paste your FAQ or policy text here..."
          rows={5}
          maxLength={50000}
          disabled={imageFiles.length > 0}
          className="w-full resize-y rounded-md border border-neutral-300 bg-transparent p-2 text-sm outline-none disabled:opacity-40 focus:border-neutral-500 dark:border-neutral-700"
        />

        <div className="flex flex-col gap-1 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span>or</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="text-xs file:mr-2 file:rounded file:border file:border-neutral-300 file:bg-transparent file:px-2 file:py-1 file:text-xs dark:file:border-neutral-700"
            />
          </div>
          {imageFiles.length > 0 && (
            <span>
              {imageFiles.length} image{imageFiles.length === 1 ? "" : "s"} selected
              (resized before upload)
            </span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!title.trim() || (!text.trim() && imageFiles.length === 0) || saving}
          className="w-fit rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-neutral-700"
        >
          {saving ? (progress ?? "Saving…") : "Save to knowledge base"}
        </button>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </details>
  );
}
