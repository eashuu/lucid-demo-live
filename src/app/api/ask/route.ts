import { searchWeb } from "@/lib/search";
import { streamChat } from "@/lib/llm";
import { answerSystemPrompt } from "@/lib/prompts";

type AskBody = {
  query?: unknown;
};

export const maxDuration = 60;

function encodeEvent(
  encoder: TextEncoder,
  event: Record<string, unknown>,
): Uint8Array {
  return encoder.encode(`${JSON.stringify(event)}\n`);
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
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const sources = await searchWeb(query);
        controller.enqueue(encodeEvent(encoder, { type: "sources", sources }));

        const messages = [
          { role: "system" as const, content: answerSystemPrompt(sources) },
          { role: "user" as const, content: query },
        ];

        for await (const text of streamChat(messages, request.signal)) {
          controller.enqueue(encodeEvent(encoder, { type: "token", text }));
        }

        controller.enqueue(encodeEvent(encoder, { type: "done" }));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Request failed";
        controller.enqueue(encodeEvent(encoder, { type: "error", message }));
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
