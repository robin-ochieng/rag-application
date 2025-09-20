"use client";
import { PropsWithChildren } from "react";
import { BulbIcon, CopyIcon, PinIcon } from "./Icons";

export function MessageCard({ children, side }: PropsWithChildren<{ side: "left" | "right" }>) {
  const isRight = side === "right";
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[80ch] w-full rounded-[var(--radius-card)] border p-5 shadow-[var(--shadow-card)] transition-all duration-200 bg-white/95 dark:bg-neutral-900/80 border-black/5 dark:border-white/10 hover:shadow-lg ${
          isRight ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-900 dark:text-neutral-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function IconCluster({ onCopy, onIdeas, onPin }: { onCopy?: () => void; onIdeas?: () => void; onPin?: () => void }) {
  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/5 dark:border-white/10 bg-white/60 hover:bg-white/90 dark:bg-neutral-800/70 dark:hover:bg-neutral-700 transition focus:outline-none focus:ring-2 focus:ring-violet-400 text-neutral-700 dark:text-neutral-200";
  return (
    <div className="absolute right-3 top-3 flex items-center gap-2">
      <button aria-label="Pin" className={btn} onClick={onPin} title="Pin"><PinIcon /></button>
      <button aria-label="Ideas" className={btn} onClick={onIdeas} title="Ideas"><BulbIcon /></button>
      <button aria-label="Copy" className={btn} onClick={onCopy} title="Copy"><CopyIcon /></button>
    </div>
  );
}

export function Citations({ items }: { items?: { id?: string; label?: string; href?: string }[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-3 text-[13px]">
      <span className="font-medium">Citations: </span>
      {items.map((c, i) => (
        <a
          key={i}
          href={c.href || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 decoration-blue-400 hover:decoration-blue-600 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-400/50 rounded"
        >
          {i + 1}. {c.label || c.href}
        </a>
      ))}
    </div>
  );
}

export function FollowUps({ items, onClick }: { items?: string[]; onClick?: (q: string) => void }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((q, i) => (
        <button
          key={i}
          className="rounded-full px-3 py-1 text-[13px] bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-black/5 dark:border-white/10 transition focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm hover:shadow"
          onClick={() => onClick?.(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-3/4 rounded bg-neutral-300/60 dark:bg-neutral-700/60" />
      <div className="mt-2 h-4 w-5/6 rounded bg-neutral-300/60 dark:bg-neutral-700/60" />
      <div className="mt-2 h-4 w-2/3 rounded bg-neutral-300/60 dark:bg-neutral-700/60" />
    </div>
  );
}
