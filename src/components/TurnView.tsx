"use client";

import { useState } from "react";

import Answer from "@/components/Answer";
import SearchBox from "@/components/SearchBox";
import Sources from "@/components/Sources";
import type { Source } from "@/lib/types";

const suggestions = [
  "What should I learn about AI this year?",
  "How does the James Webb Space Telescope work?",
  "What are the best ways to sleep better?",
  "Explain quantum computing simply",
];

type StreamEvent =
  | { type: "sources"; sources: Source[] }
  | { type: "token"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

export default function TurnView() {
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(nextQuestion = input) {
    const query = nextQuestion.trim();
    if (!query || busy) return;

    setInput("");
    setQuestion(query);
    setSources([]);
    setAnswer("");
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "The search could not be started.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;
          if (event.type === "sources") setSources(event.sources);
          if (event.type === "token") setAnswer((current) => current + event.text);
          if (event.type === "error") setError(event.message);
        }

        if (done) break;
      }
    } catch (streamError: unknown) {
      setError(streamError instanceof Error ? streamError.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setInput("");
    setQuestion("");
    setSources([]);
    setAnswer("");
    setError("");
  }

  if (!question) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-2xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 text-4xl font-semibold tracking-[-0.06em]">
            <span className="size-3 rounded-full bg-accent" />
            lucid
          </div>
          <p className="mb-10 text-base text-muted sm:text-lg">
            Ask anything. Get answers you can verify.
          </p>
          <SearchBox value={input} onChange={setInput} onSubmit={() => ask()} />
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => ask(suggestion)}
                className="rounded-full border bg-surface px-4 py-2 text-sm text-muted transition hover:border-accent/50 hover:text-accent"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <button type="button" onClick={reset} className="flex items-center gap-2 text-xl font-semibold tracking-[-0.05em]">
            <span className="size-2.5 rounded-full bg-accent" />
            lucid
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border px-4 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-accent"
          >
            New search
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-12 pb-36">
        <h1 className="max-w-3xl text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl">
          {question}
        </h1>

        <section className="mt-10" aria-labelledby="sources-heading">
          <div className="mb-4 flex items-center gap-3">
            <h2 id="sources-heading" className="text-sm font-semibold tracking-wide text-muted uppercase">
              Sources
            </h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          <Sources sources={sources} loading={busy && sources.length === 0} />
        </section>

        <section className="mt-12" aria-labelledby="answer-heading">
          <div className="mb-4 flex items-center gap-3">
            <h2 id="answer-heading" className="text-sm font-semibold tracking-wide text-muted uppercase">
              Answer
            </h2>
            {busy && <span className="size-2 animate-pulse rounded-full bg-accent" />}
            <span className="h-px flex-1 bg-border" />
          </div>
          {error ? (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : answer ? (
            <Answer text={answer} sources={sources} />
          ) : (
            <div className="space-y-3" aria-label="Loading answer">
              <div className="h-4 w-11/12 animate-pulse rounded bg-border/70" />
              <div className="h-4 w-9/12 animate-pulse rounded bg-border/70" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-border/70" />
            </div>
          )}
        </section>
      </main>

      <div className="fixed right-0 bottom-0 left-0 z-10 border-t bg-background/90 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-4xl">
          <SearchBox value={input} onChange={setInput} onSubmit={() => ask()} disabled={busy} />
        </div>
      </div>
    </div>
  );
}