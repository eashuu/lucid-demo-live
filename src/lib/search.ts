import type { Source } from "./types";

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score: number;
};

type TavilyResponse = {
  results: TavilyResult[];
};

export async function searchWeb(
  query: string,
  maxResults = 5,
): Promise<Source[]> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: "basic",
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const body = (await response.text()).slice(0, 200);
    throw new Error(`Tavily search failed with status ${response.status}: ${body}`);
  }

  const data = (await response.json()) as TavilyResponse;
  return data.results.map((result, index) => ({
    id: index + 1,
    title: result.title,
    url: result.url,
    snippet: result.content.slice(0, 800),
  }));
}
