import { NextResponse } from "next/server";

import { searchWeb } from "@/lib/search";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q");

  if (!query || query.length > 500) {
    return NextResponse.json(
      { error: "Query is required and must be 500 characters or fewer" },
      { status: 400 },
    );
  }

  try {
    const sources = await searchWeb(query);
    return NextResponse.json({ query, sources });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
