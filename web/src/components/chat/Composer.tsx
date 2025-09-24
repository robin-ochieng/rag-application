"use client";
import { useEffect, useRef } from "react";

type Props = {
  id?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
};

export default function Composer({ id, value, placeholder, disabled, onChange, onKeyDown, onSubmit }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea up to a sensible max height
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = 180; // px
    ta.style.height = Math.min(ta.scrollHeight, max) + "px";
  }, [value]);

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-[rgb(var(--background))]/80 supports-[backdrop-filter]:bg-[rgb(var(--background))]/60 backdrop-blur border-t border-[rgb(var(--border))]">
      <form
        id={id}
        onSubmit={(e) => onSubmit(e)}
        className="mx-auto max-w-5xl px-0 sm:px-0 lg:px-0 py-3"
        aria-label="Message composer"
      >
        <div className="relative rounded-[var(--radius-card)] border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-[var(--shadow-card)]">
          {/* Right send button */}
          <div className="absolute right-2 top-2">
            <button
              type="submit"
              aria-label="Send message"
              disabled={disabled}
              className="inline-flex h-10 w-12 items-center justify-center rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] shadow-sm hover:shadow-md hover:bg-[rgb(var(--accent))]/90 transition-all focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] disabled:opacity-60 disabled:shadow-none"
              title="Send"
            >
              {/* Modern horizontal plane icon */}
              <svg
                width="30"
                height="30"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="drop-shadow-sm"
              >
                <path d="M6 24h14" />
                <path d="M6 18h20c6 0 11.5 3.5 16 6l-16 6c-4.5 2.5-10 6-12 9v-9" />
                <path d="M26 24l16 0" />
              </svg>
            </button>
          </div>
          <div className="pl-3 pr-12 py-2">
            <label htmlFor="chat-input" className="sr-only">Chat input</label>
            <textarea
              id="chat-input"
              ref={taRef}
              aria-label="Chat input"
              placeholder={placeholder || "Ask anything about Kenbright..."}
              value={value}
              onChange={onChange}
              onKeyDown={onKeyDown}
              disabled={disabled}
              rows={1}
              className="w-full resize-none bg-transparent outline-none placeholder:text-[rgb(var(--muted-foreground))] text-[rgb(var(--foreground))] py-2.5"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
