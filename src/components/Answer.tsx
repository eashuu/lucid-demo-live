import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { Source } from "@/lib/types";

type AnswerProps = {
  text: string;
  sources: Source[];
};

function withCitationLinks(text: string, sources: Source[]) {
  return text.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (match, numbers: string) => {
    const citations = numbers
      .split(",")
      .map((number) => Number(number.trim()))
      .map((number) => sources.find((source) => source.id === number))
      .filter((source): source is Source => Boolean(source))
      .map((source) => `[${source.id}](${source.url})`);

    return citations.length ? citations.join("") : "";
  });
}

export default function Answer({ text, sources }: AnswerProps) {
  const markdown = withCitationLinks(text, sources);

  return (
    <article className="prose prose-teal max-w-none text-[15px] leading-7 text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-p:my-4 prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-blockquote:border-accent prose-blockquote:text-muted prose-code:text-accent prose-li:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            const source = sources.find((item) => item.url === href);
            if (source && String(children) === String(source.id)) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open source ${source.id}`}
                  className="mx-0.5 inline-flex size-5 translate-y-[-1px] items-center justify-center rounded-full bg-accent/12 text-[11px] leading-none font-semibold text-accent no-underline hover:bg-accent/25"
                >
                  {children}
                </a>
              );
            }
            return (
              <a href={href} {...props} target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}