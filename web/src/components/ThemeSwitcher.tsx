"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";

type Item = { id: "light" | "dark" | "system"; label: "Light" | "Dark" | "System" };

export default function ThemeSwitcher() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => setMounted(true), []);

  const items: Item[] = useMemo(() => [
    { id: "system", label: "System" },
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
  ], []);

  useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLElement>("[role='menuitem']");
    first?.focus();
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t) && buttonRef.current && !buttonRef.current.contains(t)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const label = useMemo(() => {
    if (!mounted) return "";
    if (theme === "system") {
      const resolved = (resolvedTheme ?? systemTheme ?? "light").replace(/^./, c => c.toUpperCase());
      return `System (${resolved})`;
    }
    return (theme ?? "light").replace(/^./, c => c.toUpperCase());
  }, [mounted, theme, systemTheme, resolvedTheme]);

  if (!mounted) return null;

  function onSelect(id: Item["id"]) {
    setTheme(id);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (activeIndex + 1) % items.length;
      setActiveIndex(nextIndex);
      const el = menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']")[nextIndex];
      el?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIndex = (activeIndex - 1 + items.length) % items.length;
      setActiveIndex(nextIndex);
      const el = menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']")[nextIndex];
      el?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
      const el = menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']")[0];
      el?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(items.length - 1);
      const el = menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']")[items.length - 1];
      el?.focus();
    } else if (e.key === "Tab") {
      // Focus trap within the menu
      const menuitems = menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']");
      if (!menuitems || menuitems.length === 0) return;
      e.preventDefault();
      const current = document.activeElement as HTMLElement | null;
      const idx = current ? Array.from(menuitems).indexOf(current) : -1;
      let nextIdx = idx;
      if (e.shiftKey) {
        nextIdx = idx <= 0 ? menuitems.length - 1 : idx - 1;
      } else {
        nextIdx = idx === menuitems.length - 1 ? 0 : idx + 1;
      }
      setActiveIndex(nextIdx);
      menuitems[nextIdx]?.focus();
    }
  }

  const selectedId = (theme ?? "system") as Item["id"] | undefined;

  return (
    <div className="relative inline-block text-sm">
      <button
        ref={buttonRef}
        id="theme-switcher-trigger"
        aria-haspopup="menu"
        aria-controls="theme-switcher-menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 py-1.5 text-[rgb(var(--foreground))] hover:opacity-95 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
      >
        {label} <span aria-hidden>▾</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          id="theme-switcher-menu"
          aria-labelledby="theme-switcher-trigger"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 mt-2 w-40 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--card-foreground))] shadow-lg focus:outline-none p-1"
        >
          <div className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-[rgb(var(--muted-foreground))]" role="group" aria-label="System">
            System
          </div>
          {items.map((it, idx) => (
            <button
              key={it.id}
              role="menuitem"
              tabIndex={idx === activeIndex ? 0 : -1}
              className="flex w-full items-center justify-between px-2 py-1.5 rounded text-left text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] focus:bg-[rgb(var(--muted))] outline-none"
              onClick={() => onSelect(it.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(it.id);
                }
              }}
            >
              <span>{it.label}</span>
              <span aria-hidden className="text-[rgb(var(--muted-foreground))]">{selectedId === it.id ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
