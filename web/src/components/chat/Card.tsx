"use client";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { BulbIcon, CopyIcon, PinIcon, DotsIcon } from "./Icons";

export function MessageCard({ children, side }: PropsWithChildren<{ side: "left" | "right" }>) {
  const isRight = side === "right";
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[80ch] w-full rounded-[var(--radius-card)] border border-[rgb(var(--border))] p-5 shadow-[var(--shadow-card)] transition-all duration-200 bg-[rgb(var(--card))] text-[rgb(var(--card-foreground))] hover:shadow-lg`}
      >
        {children}
      </div>
    </div>
  );
}

export function IconCluster({ onCopy, onIdeas, onPin }: { onCopy?: () => void; onIdeas?: () => void; onPin?: () => void }) {
  const btn =
    "inline-flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-md text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--accent))] border border-[rgb(var(--border))] transition focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]";

  // Small screens: kebab menu; md+: full icon row.
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onClick); };
  }, [open]);

  return (
    <div className="absolute right-2 md:right-3 top-2 md:top-3 z-10" aria-label="Message actions">
      {/* md+: full actions, show-on-hover for cleaner look */}
      <div className="hidden md:flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
        <button aria-label="Pin" className={btn} onClick={onPin} title="Pin"><PinIcon /></button>
        <button aria-label="Ideas" className={btn} onClick={onIdeas} title="Ideas"><BulbIcon /></button>
        <button aria-label="Copy" className={btn} onClick={onCopy} title="Copy"><CopyIcon /></button>
      </div>
      {/* sm: kebab menu */}
      <div className="md:hidden" ref={menuRef}>
        <button
          aria-label="Open actions"
          title="More"
          className={btn}
          onClick={() => setOpen((v) => !v)}
        >
          <DotsIcon />
        </button>
        {open && (
          <div
            role="menu"
            className="mt-1 w-36 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-[var(--shadow-card)] p-1 text-sm"
          >
            <button role="menuitem" className="w-full text-left rounded px-2 py-1.5 hover:bg-[rgb(var(--accent))]" onClick={() => { setOpen(false); onCopy?.(); }}>Copy</button>
            <button role="menuitem" className="w-full text-left rounded px-2 py-1.5 hover:bg-[rgb(var(--accent))]" onClick={() => { setOpen(false); onIdeas?.(); }}>Ideas</button>
            <button role="menuitem" className="w-full text-left rounded px-2 py-1.5 hover:bg-[rgb(var(--accent))]" onClick={() => { setOpen(false); onPin?.(); }}>Pin</button>
          </div>
        )}
      </div>
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
          className="rounded-full px-3 py-1 text-[13px] bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] hover:opacity-95 border border-[rgb(var(--border))] transition focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] shadow-sm hover:shadow"
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
      <div className="h-4 w-3/4 rounded bg-[rgb(var(--muted))]" />
      <div className="mt-2 h-4 w-5/6 rounded bg-[rgb(var(--muted))]" />
      <div className="mt-2 h-4 w-2/3 rounded bg-[rgb(var(--muted))]" />
    </div>
  );
}
