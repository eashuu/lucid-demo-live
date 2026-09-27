import type { Source } from "@/lib/types";

type SourcesProps = {
  sources: Source[];
  loading?: boolean;
};

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function Sources({ sources, loading = false }: SourcesProps) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden" aria-label="Loading sources">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 min-w-60 animate-pulse rounded-xl border bg-surface/70"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-thin">
      {sources.map((source) => {
        const domain = getDomain(source.url);
        return (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="group flex min-w-60 max-w-72 flex-1 flex-col justify-between rounded-xl border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                aria-hidden="true"
                className="size-6 shrink-0 rounded-md bg-contain bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url("https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32")`,
                }}
              />
              <span className="text-xs font-medium text-muted">[{source.id}]</span>
            </div>
            <p className="mt-4 line-clamp-2 text-sm leading-5 font-medium text-foreground group-hover:text-accent">
              {source.title}
            </p>
            <p className="mt-2 truncate text-xs text-muted">{domain}</p>
          </a>
        );
      })}
    </div>
  );
}