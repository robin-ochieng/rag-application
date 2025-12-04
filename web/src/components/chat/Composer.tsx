"use client";
import { useEffect, useRef, useCallback } from "react";

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
    const max = 200; // px
    ta.style.height = Math.min(ta.scrollHeight, max) + "px";
  }, [value]);

  const hasContent = value.trim().length > 0;

  const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (hasContent && !disabled) {
      onSubmit();
    }
  }, [hasContent, disabled, onSubmit]);

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-gradient-to-t from-white via-white to-white/80 backdrop-blur-xl z-30">
      <form
        id={id}
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl px-4 sm:px-6 py-4"
        aria-label="Message composer"
      >
        <div className="relative group">
          {/* Outer glow effect on focus */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300" />
          
          {/* Main input container */}
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 transition-all duration-300 group-focus-within:border-indigo-300 group-focus-within:shadow-xl group-focus-within:shadow-indigo-500/10">
            <div className="flex items-end gap-3 p-3">
              {/* Textarea container */}
              <div className="flex-1 min-w-0">
                <label htmlFor="chat-input" className="sr-only">Chat input</label>
                <textarea
                  id="chat-input"
                  ref={taRef}
                  aria-label="Chat input"
                  placeholder={placeholder || "Ask about Insurance Act, IFRS-17, or compliance topics..."}
                  value={value}
                  onChange={onChange}
                  onKeyDown={onKeyDown}
                  disabled={disabled}
                  rows={1}
                  className="w-full resize-none bg-transparent outline-none text-slate-900 placeholder:text-slate-400 text-base leading-relaxed py-2 px-1 max-h-[200px] scrollbar-thin scrollbar-thumb-slate-300"
                />
              </div>
              
              {/* Send button */}
              <div className="flex-shrink-0 pb-1">
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={disabled || !hasContent}
                  className={`
                    relative group/btn inline-flex items-center justify-center
                    h-10 w-10 rounded-full
                    transition-all duration-300 ease-out
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-white
                    disabled:cursor-not-allowed
                    ${hasContent 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95' 
                      : 'bg-slate-100 text-slate-400'
                    }
                  `}
                  title="Send message"
                >
                  {/* Clean arrow send icon */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`transition-transform duration-200 ${hasContent ? '-rotate-45' : ''}`}
                  >
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Helper text */}
            <div className="px-4 pb-2 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px]">Enter</kbd>
                <span>to send</span>
                <span className="mx-1">•</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px]">Shift + Enter</kbd>
                <span>for new line</span>
              </span>
              {value.length > 0 && (
                <span className={`transition-colors ${value.length > 4000 ? 'text-amber-500' : ''}`}>
                  {value.length.toLocaleString()} characters
                </span>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
