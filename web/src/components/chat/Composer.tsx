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
              className="group inline-flex h-10 w-12 items-center justify-center rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] shadow-sm hover:shadow-md hover:bg-[rgb(var(--accent))]/90 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] disabled:opacity-60 disabled:shadow-none transition-all duration-200 active:scale-[0.96]"
              title="Send"
            >
              {/* Premium send icon (inspired by modern icon sets) */}
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-95"
              >
                <path d="M3.5 11.25L19.2 5.4c.9-.34 1.72.48 1.38 1.38l-5.86 15.69c-.34.9-1.62.94-1.96.05l-2.28-5.94a1 1 0 0 0-.6-.6L3.55 13.7c-.92-.33-.93-1.63-.05-1.97Z" />
                <path d="M10.25 13.75l3.9-3.9" />
              </svg>
              <span className="pointer-events-none absolute inset-0 rounded-md opacity-0 group-hover:opacity-40 group-active:opacity-60 transition duration-300 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.45),rgba(255,255,255,0))]" />
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
