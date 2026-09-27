export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function getLlmConfig(model: string) {
  return {
    model,
    messages: [] as ChatMessage[],
    stream: false,
    temperature: 0.2,
  };
}

export async function completeChat(
  messages: ChatMessage[],
  model = process.env.LLM_FAST_MODEL || process.env.LLM_MODEL,
  signal?: AbortSignal,
): Promise<string> {
  const body = getLlmConfig(model ?? "");
  body.messages = messages;

  const response = await fetch(
    `${process.env.LLM_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    },
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "The AI provider's rate limit was hit. Wait a minute and try again.",
      );
    }

    const responseBody = (await response.text()).slice(0, 300);
    throw new Error(
      `AI provider request failed with status ${response.status}: ${responseBody}`,
    );
  }

  const data = (await response.json()) as ChatCompletionResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function* streamChat(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const reasoningEffort = process.env.LLM_REASONING_EFFORT;
  const body: Record<string, unknown> = {
    model: process.env.LLM_MODEL,
    messages,
    stream: true,
    temperature: 0.2,
  };

  if (reasoningEffort) {
    body.reasoning_effort = reasoningEffort;
  }

  const response = await fetch(
    `${process.env.LLM_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    },
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "The AI provider's rate limit was hit. Wait a minute and try again.",
      );
    }

    const responseBody = (await response.text()).slice(0, 300);
    throw new Error(
      `AI provider request failed with status ${response.status}: ${responseBody}`,
    );
  }

  if (!response.body) {
    throw new Error("AI provider returned an empty response.");
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
      const data = line.trim().replace(/^data:\s*/, "");
      if (!data || data === "[DONE]") {
        continue;
      }

      const chunk = JSON.parse(data) as ChatCompletionChunk;
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }

    if (done) {
      const data = buffer.trim().replace(/^data:\s*/, "");
      if (data && data !== "[DONE]") {
        const chunk = JSON.parse(data) as ChatCompletionChunk;
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
      break;
    }
  }
}
