"use client";
import { useEffect, useId, useRef, useState } from "react";

type Citation = { label: string; href: string };

export default function CitationsDisclosure({
  items,
  defaultOpen = false,
  id,
  className = "",
}: {
  items: Citation[];
  defaultOpen?: boolean;
  id?: string;
  className?: string;
}) {
  if (!items || items.length === 0) return null;
  const autoId = useId();
  const panelId = id ?? `citations-${autoId}`;
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [maxH, setMaxH] = useState<number>(0);

  // Recalculate content height for smooth expand/collapse
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const m = el.scrollHeight;
    setMaxH(m);
  }, [items, open]);

  // Handle window resize to keep height in sync
  useEffect(() => {
    const onResize = () => {
      const el = panelRef.current;
      if (!el) return;
      setMaxH(el.scrollHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className={["mt-2 select-none", className].join(" ")}
      onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] rounded px-1"
      >
        <span>Citations</span>
        <span
          className="inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] text-[10px] leading-none font-medium"
        >
          {items.length}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
        >
          <path d="M7 5l6 5-6 5V5z" />
        </svg>
      </button>

      <div
        id={panelId}
        ref={panelRef}
        aria-hidden={!open}
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
        style={{ maxHeight: open ? maxH : 0, opacity: open ? 1 : 0 }}
      >
        <div className="pt-2 border-t border-[rgb(var(--border))]">
          <ol className="list-decimal pl-5 space-y-1 text-sm text-[rgb(var(--muted-foreground))]">
          {items.map((c, i) => (
            <li key={i}>
              <a
                href={c.href || "#"}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 decoration-blue-400 hover:decoration-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] rounded"
                title={c.label}
              >
                {c.label || c.href}
              </a>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
