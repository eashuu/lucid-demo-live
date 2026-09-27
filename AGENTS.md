<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Lucid — project rules for AI coding agents

## What we are building
Lucid is a Perplexity-style AI answer engine ("the opposite of perplexity").
A user asks a question → the server searches the web (Tavily) → the top results are
sent to an LLM (any OpenAI-compatible API: Groq, Gemini, OpenRouter, Ollama) → the
answer streams back with numbered citations like [1], plus source cards and
related follow-up questions.

## Stack
- Next.js 16 (App Router, `src/` directory) + React 19 + TypeScript (strict)
- Tailwind CSS v4 — theme tokens live in `src/app/globals.css` (there is no tailwind.config.js)
- No AI SDK. Call the LLM with `fetch` to `${LLM_BASE_URL}/chat/completions` (OpenAI-compatible, `stream: true`)
- Deployed on Vercel (Hobby plan)

## Folder map
- `src/app/page.tsx` — the search UI (client component)
- `src/app/api/search/route.ts` — GET `?q=` → web search only, returns JSON (debug endpoint)
- `src/app/api/ask/route.ts` — POST `{ query, history }` → search + LLM, streams NDJSON events
- `src/lib/` — server helpers: `search.ts`, `llm.ts`, `prompts.ts`, `demo.ts`, `types.ts`
- `src/components/` — UI components
- `docs/` — PRD and architecture notes. Read them before large changes.

## Rules
1. Secrets stay on the server. Read API keys only through `process.env` in route handlers or `src/lib`.
   Never prefix a secret with `NEXT_PUBLIC_`. Never hard-code keys or commit `.env.local`.
2. Ask before adding a new npm package.
3. TypeScript strict: no `any`. Keep functions small and named for what they do.
4. Validate every request body (type and length) before using it.
5. Handle errors visibly: return JSON `{ error }` with a status code, or stream an `error` event.
6. After a change, run `npm run lint` and `npm run build`, and fix whatever fails.
7. When unsure about a Next.js API, read `node_modules/next/dist/docs/` — don't guess.
8. Make the smallest change that does the job. Don't rewrite files you weren't asked to touch.

## Stream protocol — POST /api/ask
Newline-delimited JSON (NDJSON), one event per line:
```
{"type":"sources","sources":[{"id":1,"title":"...","url":"...","snippet":"..."}]}
{"type":"token","text":"..."}
{"type":"related","questions":["...","...","..."]}
{"type":"error","message":"..."}
{"type":"done"}
```
