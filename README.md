# Englishly

AI-powered English & business communication assistant. Paste a message you
want to send (Slack update, email, customer reply, PR comment), get a
natural-English rewrite in your chosen tone, and an explanation of what
changed so you actually learn from it.

Stack: Next.js (App Router) · Neon (Postgres, via Drizzle) · Gemini API,
deployed on Vercel. See `src/lib/llm/` for the provider abstraction — swap
`GeminiProvider` for another provider there without touching the rest of
the app.

## Setup

1. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — a Neon **pooled** connection string (the `-pooler`
     host, from the Neon dashboard's "Connection Details" with "Pooled
     connection" toggled on). Using the direct connection string here will
     exhaust Neon's connection limit under serverless load.
   - `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey).
2. Enable the `pgvector` extension once on your Neon database (needed later
   for the business-knowledge/RAG phase, harmless to enable now):
   ```sql
   create extension if not exists vector;
   ```
3. Push the schema:
   ```bash
   npm run db:push
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Notes

- **Auth**: intentionally skipped for the MVP — every request is attributed
  to a single default user (see `src/lib/user.ts`). Fine for solo daily use;
  swap in real auth before this is multi-user.
- **Gemini free tier**: this app defaults to `gemini-3.5-flash-lite`
  (`src/lib/llm/gemini.ts`) — the 2.5 line was retired for new users in
  2026. Check current RPM/RPD quotas at
  [ai.google.dev/gemini-api/docs/rate-limits](https://ai.google.dev/gemini-api/docs/rate-limits)
  before demoing heavily; model names on the free tier shift over time.
- **Neon pooling**: `src/db/index.ts` uses `@neondatabase/serverless`'s
  HTTP driver, which is stateless per-request and doesn't hold a TCP
  connection open — the right choice for Vercel serverless functions.

## Data model

`src/db/schema.ts` — `organizations` → `users` → `messages` → `rewrites`
for the core flow, plus `knowledge_documents` / `knowledge_chunks`
(pgvector) staged in for the future business-knowledge/RAG mode.

## Deploy

Push to a GitHub repo, import into Vercel, set `DATABASE_URL` and
`GEMINI_API_KEY` as environment variables in the Vercel project settings.
The Hobby plan is personal/non-commercial use only — fine for this MVP.
