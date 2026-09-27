"use client";

import { useEffect, useRef } from "react";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export default function SearchBox({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: SearchBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [value]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <form
      className="relative w-full"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Ask a question..."
        aria-label="Your question"
        className="min-h-16 w-full resize-none overflow-hidden rounded-2xl border bg-surface py-5 pr-16 pl-5 text-base leading-6 text-foreground shadow-[0_12px_30px_rgba(16,58,52,0.07)] outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send question"
        className="absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-accent text-lg text-white transition hover:scale-105 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 dark:text-[#10201d]"
      >
        →
      </button>
    </form>
  );
}