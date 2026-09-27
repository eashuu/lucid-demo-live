export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center font-sans">
      <p className="text-sm font-semibold tracking-[0.2em] text-teal-700 uppercase dark:text-teal-400">
        Setup complete
      </p>
      <h1 className="text-6xl font-semibold tracking-tight">lucid</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Your app is running. Next: Mission 1 in README.md, the web search API.
      </p>
    </main>
  );
}
