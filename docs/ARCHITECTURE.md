# Lucid — Architecture

## Request flow
```
Browser (page.tsx)                 Next.js server (Vercel function)             External APIs
──────────────────                 ───────────────────────────────             ─────────────
question ──POST /api/ask──────────▶ validate body
                                   (follow-up? rewrite into a standalone query) ──▶ LLM
                                   searchWeb(query) ─────────────────────────────▶ Tavily
◀── {"type":"sources"} ───────────  top 5 results → numbered sources
                                   build prompt: system rules + sources + question
                                   streamChat(messages) ─────── stream:true ────▶ LLM (Groq/Gemini)
◀── {"type":"token"} × N ─────────  forward each text delta as it arrives
                                   suggestRelated(query, titles) ────────────────▶ LLM
◀── {"type":"related"} ───────────
◀── {"type":"done"} ──────────────
```

## Why this shape
- **Route handler as the backend**: keys stay server-side; the browser only talks to our own API.
- **RAG with web search as the retriever**: no vector database is needed for v1. Tavily returns
  clean text snippets, which become the LLM's context. Classic RAG (chunk → embed → vector DB)
  is the v2 "chat with PDF" feature.
- **OpenAI-compatible API over plain fetch**: switching Groq → Gemini → Ollama is an env change,
  not a code change. No SDK version drift.
- **NDJSON streaming**: one JSON object per line is trivial to produce and parse, and lets us send
  different event types (sources, tokens, related) over one response.

## Files
| File | Responsibility |
| --- | --- |
| `src/lib/search.ts` | Call Tavily, map results → `Source[]` |
| `src/lib/llm.ts` | `streamChat()` and `completeChat()` over `/chat/completions`, SSE parsing |
| `src/lib/prompts.ts` | System prompt with numbered sources, related-questions prompt, query rewrite prompt |
| `src/lib/followups.ts` | Related questions, and rewriting follow-ups into standalone search queries |
| `src/lib/demo.ts` | Canned sources and answer when keys are missing (offline safety net) |
| `src/app/api/search/route.ts` | GET debug endpoint: search only |
| `src/app/api/ask/route.ts` | POST: orchestrates search → LLM stream → related questions |
| `src/lib/read-ndjson.ts` | Client helper: turn a streamed Response into parsed events |
| `src/app/page.tsx` | UI state: list of Q&A turns, follow-ups |
| `src/components/*` | SearchBox, Sources, Answer (markdown + citation chips), Related |

## Environment variables
| Name | Where it's used | Example |
| --- | --- | --- |
| `LLM_BASE_URL` | server | `https://api.groq.com/openai/v1` |
| `LLM_API_KEY` | server (secret) | `gsk_…` |
| `LLM_MODEL` | server | `openai/gpt-oss-120b` |
| `LLM_FAST_MODEL` | server (optional) | `openai/gpt-oss-20b` |
| `LLM_REASONING_EFFORT` | server (optional) | `low` |
| `TAVILY_API_KEY` | server (secret) | `tvly-…` |
