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
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--accent))] text-[rgb(var(--foreground))] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] disabled:opacity-60"
              title="Send"
            >
              {/* Simple paper-plane icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
          <div className="pl-3 pr-12 py-2">
            <label htmlFor="chat-input" className="sr-only">Chat input</label>
            <textarea
              id="chat-input"
              ref={taRef}
              aria-label="Chat input"
              placeholder={placeholder || "Ask me anything…"}
              value={value}
              onChange={onChange}
              onKeyDown={onKeyDown}
              disabled={disabled}
              rows={1}
              className="w-full resize-none bg-transparent outline-none placeholder:text-[rgb(var(--muted-foreground))] text-[rgb(var(--foreground))] py-2.5"
            />
          </div>
          <div className="px-3 pb-2 pt-0 text-xs text-[rgb(var(--muted-foreground))] select-none">
            Press Enter to send • Shift+Enter for newline
          </div>
        </div>
      </form>
    </div>
  );
}
