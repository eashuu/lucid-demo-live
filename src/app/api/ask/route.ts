import { searchWeb } from "@/lib/search";
import { completeChat, streamChat, type ChatMessage } from "@/lib/llm";
import { answerSystemPrompt } from "@/lib/prompts";

type HistoryItem = {
  question: string;
  answer: string;
};

type AskBody = {
  query?: unknown;
  history?: unknown;
};

export const maxDuration = 60;

function encodeEvent(
  encoder: TextEncoder,
  event: Record<string, unknown>,
): Uint8Array {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

function removeCitationMarkers(text: string) {
  return text.replace(/\[\d+(?:\s*,\s*\d+)*\]/g, "");
}

function parseHistory(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is HistoryItem =>
        typeof item === "object" &&
        item !== null &&
        typeof item.question === "string" &&
        typeof item.answer === "string",
    )
    .slice(-2);
}

async function rewriteQuery(
  query: string,
  history: HistoryItem[],
  signal: AbortSignal,
) {
  const context: ChatMessage[] = history.flatMap((item) => [
    { role: "user" as const, content: removeCitationMarkers(item.question) },
    { role: "assistant" as const, content: removeCitationMarkers(item.answer) },
  ]);
  const rewritten = await completeChat(
    [
      {
        role: "system",
        content:
          "Rewrite the latest user message as one standalone web search query. Return only the query, with no quotes, explanation, or punctuation around it.",
      },
      ...context,
      { role: "user", content: query },
    ],
    process.env.LLM_FAST_MODEL || process.env.LLM_MODEL,
    signal,
  );

  return rewritten || query;
}

async function relatedQuestions(
  query: string,
  sourceTitles: string[],
  signal: AbortSignal,
) {
  const response = await completeChat(
    [
      {
        role: "system",
        content:
          "Suggest exactly 3 short, natural follow-up questions. Base them on the user's question and the source titles. Return one question per line, with no bullets or numbering.",
      },
      {
        role: "user",
        content: `Question: ${query}\nSource titles:\n${sourceTitles.join("\n")}`,
      },
    ],
    process.env.LLM_FAST_MODEL || process.env.LLM_MODEL,
    signal,
  );

  return response
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .map((line) => line.replace(/^['"]|['"]$/g, ""))
    .filter(Boolean)
    .slice(0, 3);
}

export async function POST(request: Request) {
  let body: AskBody;
  try {
    body = (await request.json()) as AskBody;
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (
    typeof body.query !== "string" ||
    body.query.length < 1 ||
    body.query.length > 500
  ) {
    return Response.json(
      { error: "Query must be a string between 1 and 500 characters" },
      { status: 400 },
    );
  }

  const query = body.query;
  const history = parseHistory(body.history);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const searchQuery = history.length
          ? await rewriteQuery(query, history, request.signal)
          : query;
        const sources = await searchWeb(searchQuery);
        controller.enqueue(encodeEvent(encoder, { type: "sources", sources }));

        const historyMessages: ChatMessage[] = history.flatMap((item) => [
          { role: "user", content: removeCitationMarkers(item.question) },
          { role: "assistant", content: removeCitationMarkers(item.answer) },
        ]);
        const messages: ChatMessage[] = [
          { role: "system" as const, content: answerSystemPrompt(sources) },
          ...historyMessages,
          { role: "user" as const, content: query },
        ];
        const relatedPromise = relatedQuestions(
          query,
          sources.map((source) => source.title),
          request.signal,
        );

        for await (const text of streamChat(messages, request.signal)) {
          controller.enqueue(encodeEvent(encoder, { type: "token", text }));
        }

        const questions = await relatedPromise;
        controller.enqueue(encodeEvent(encoder, { type: "related", questions }));
        controller.enqueue(encodeEvent(encoder, { type: "done" }));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Request failed";
        if (!request.signal.aborted) {
          controller.enqueue(encodeEvent(encoder, { type: "error", message }));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}
