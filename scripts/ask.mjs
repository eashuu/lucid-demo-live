const query = process.argv.slice(2).join(" ");

if (!query) {
  console.error("Usage: node scripts/ask.mjs <question>");
  process.exit(1);
}

const response = await fetch("http://localhost:3000/api/ask", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

if (!response.ok || !response.body) {
  console.error(`Request failed with status ${response.status}`);
  console.error(await response.text());
  process.exit(1);
}

const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
let buffer = "";
let answerStarted = false;

while (true) {
  const { done, value } = await reader.read();
  buffer += value ?? "";
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line) continue;
    const event = JSON.parse(line);

    if (event.type === "sources") {
      console.log("Sources:");
      for (const source of event.sources) {
        console.log(`[${source.id}] ${source.title} - ${source.url}`);
      }
      console.log("\nAnswer:");
      answerStarted = true;
    } else if (event.type === "token") {
      process.stdout.write(event.text);
    } else if (event.type === "error") {
      console.error(`\nError: ${event.message}`);
    }
  }

  if (done) break;
}

if (answerStarted) process.stdout.write("\n");
