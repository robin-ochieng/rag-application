"use client";
import { useEffect, useRef, useState, type FormEvent, KeyboardEvent, type ChangeEvent } from "react";
import { FollowUps, IconCluster, MessageCard, Skeleton } from "./chat/Card";
import CitationsDisclosure from "@/components/chat/CitationsDisclosure";
import Composer from "@/components/chat/Composer";

// Minimal message shape
type Message = {
  role: "user" | "assistant";
  content: string;
  time: string;
  sources?: { snippet?: string; metadata?: Record<string, any> }[];
  citations?: { id?: string; label?: string; href?: string }[];
  followUps?: string[];
  error?: string;
};

export default function ChatLayout() {
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Always use Next.js API proxy to avoid browser CORS/host issues
  const apiPath = "/api/chat";

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, loading]);

  function timeNow() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Removed the old API status pill per new design

  async function onSubmit(e?: FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();
    if (loading) return; // prevent double-submit
    if (!q.trim()) return;

    const userMsg: Message = { role: "user", content: q, time: timeNow() };
    setMsgs((m: Message[]) => [
      ...m,
      userMsg,
      { role: "assistant", content: "", time: timeNow(), error: undefined },
    ]);
    setQ("");
    setLoading(true);

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: userMsg.content }),
        cache: "no-store",
      });
      let payload: any = {};
      try {
        payload = await res.json();
      } catch (e: any) {
        const txt = await res.text().catch(() => "");
        payload = { answer: "", sources: [], error: txt || e?.message || `Invalid JSON (status ${res.status})` };
      }
      const { data, status, ok } = { data: payload, status: res.status, ok: res.ok };
          setMsgs((prev: Message[]) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.role === "assistant" && !m.content && !m.error);
        if (idx >= 0) {
          // Build citations from either explicit citations or fallback to sources metadata
          const cites = Array.isArray(data?.citations)
            ? data.citations
            : Array.isArray(data?.sources)
            ? (data.sources as any[]).map((s) => {
                const meta = s?.metadata || {};
                const rawSrc = (meta.source || meta.source_path || "") as string;
                const norm = rawSrc.replace(/\\/g, "/");
                const rawPage = (meta.page as number) || (meta.page_number as number) || undefined;
                const pageNum = typeof rawPage === "number" && !Number.isNaN(rawPage) ? Math.max(1, Math.floor(rawPage)) : undefined;
                const fileLabel = meta.file_name || (norm.split("/").pop() || "Source");
                const pageSuffix = pageNum ? `#page=${pageNum}` : "";
                const href = norm ? `/pdf?src=${encodeURIComponent(norm)}${pageSuffix}` : "#";
                const label = pageNum ? `${fileLabel} (p. ${pageNum})` : fileLabel;
                return { label, href };
              })
            : [];
          const base: Message = {
            role: "assistant",
            content: data.answer || "",
            time: timeNow(),
            citations: cites,
            followUps: data.followUps || [],
          };
          if (Array.isArray(data.sources)) base.sources = data.sources;
          const hasAnswer = !!(data.answer && data.answer.length > 0);
          const errText = data.error ? String(data.error) : (!ok ? `HTTP ${status}` : "");
          if (!hasAnswer && errText) { base.content = ""; base.error = errText; }
          next[idx] = base;
        }
        return next;
      });
    } catch (err: any) {
      setMsgs((prev: Message[]) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.role === "assistant" && !m.content && !m.error);
        if (idx >= 0) next[idx] = { role: "assistant", content: "", error: err?.message || "Request failed", time: timeNow() };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "Escape") {
      (e.currentTarget as HTMLTextAreaElement).blur();
    }
  }

  function submitFollowUp(qText: string) {
    setQ(qText);
    // Submit immediately
    const form = document.getElementById("chat-form") as HTMLFormElement | null;
    if (form) form.requestSubmit();
  }

  function CitationList({ sources }: { sources?: Message["sources"] }) {
    if (!sources || sources.length === 0) return null;
    return (
      <details className="mt-2">
        <summary className="cursor-pointer select-none text-sm/6 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]">Citations</summary>
        <ul className="mt-2 space-y-2 list-disc pl-6">
          {sources.map((s, i) => {
            const meta = s.metadata || {};
            const parts: string[] = [];
            for (const k of ["title", "file_path", "source", "page", "page_number"]) {
              if (meta[k]) parts.push(`${k}: ${meta[k]}`);
            }
            return (
              <li key={i}>
                <div className="text-sm">{s.snippet || "(no snippet)"}</div>
                {parts.length > 0 && (
                  <div className="text-xs text-neutral-400">{parts.join("; ")}</div>
                )}
              </li>
            );
          })}
        </ul>
      </details>
    );
  }

  return (
    <div
      className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4 min-h-[calc(100vh-8rem)] grid grid-rows-[auto,1fr,auto] gap-4"
    >
      {/* Header row with controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-[rgb(var(--foreground))]">Chat</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Start new chat"
            onClick={() => {
              if (msgs.length > 0 && !confirm("Start a new chat? Current messages will be cleared.")) return;
              setMsgs([]);
            }}
            className="h-9 rounded-md border border-[rgb(var(--border))] px-3 text-sm bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
          >
            New chat
          </button>
          <button
            type="button"
            aria-label="Clear chat"
            onClick={() => {
              if (msgs.length > 0 && !confirm("Clear all messages?")) return;
              setMsgs([]);
            }}
            className="h-9 rounded-md border border-[rgb(var(--border))] px-3 text-sm bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
          >
            Clear chat
          </button>
        </div>
      </div>

      {/* Scrollable chat list as the only scrolling area */}
      <div ref={scrollRef} className="overflow-y-auto px-1">
        <div className="flex flex-col gap-4 pb-4">
          {msgs.length === 0 && (
            <div className="text-[rgb(var(--muted-foreground))]">No messages yet. Ask something to get started.</div>
          )}
          {msgs.map((m, i) => {
            const isUser = m.role === "user";
            const hasError = !!m.error;
            return (
              <MessageCard key={i} side={isUser ? "right" : "left"}>
                <div
                  className="relative pr-[var(--bubble-actions-width)]"
                  style={{ ["--bubble-actions-width" as any]: "3.25rem" }}
                >
                  {!isUser && !hasError && (
                    <IconCluster onCopy={() => navigator.clipboard.writeText(m.content)} />
                  )}
                  <div className="whitespace-pre-wrap chat-content">
                    {m.content || (hasError ? `Error: ${m.error}` : <Skeleton />)}
                  </div>
                  <div className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">{m.time}</div>
                  {!isUser && !hasError && (
                    <>
                      <CitationsDisclosure items={(m.citations as any) || []} />
                      <FollowUps items={m.followUps as any} onClick={submitFollowUp} />
                    </>
                  )}
                </div>
              </MessageCard>
            );
          })}
        </div>
      </div>

      {/* Bottom composer row */}
      <Composer
        id="chat-form"
        value={q}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        onSubmit={onSubmit}
        disabled={loading}
        placeholder="Ask about the Insurance Act..."
      />
    </div>
  );
}
