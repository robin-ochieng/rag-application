"use client";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, KeyboardEvent } from "react";
import { Citations, FollowUps, IconCluster, MessageCard, Skeleton } from "./chat/Card";

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

  // Tiny status pill that pings the proxy health (GET /api/chat)
  function StatusPill() {
    const [state, setState] = useState<"checking" | "ok" | "warn">("checking");
    const [backend, setBackend] = useState<string | undefined>(undefined);
    const [last, setLast] = useState<string>("");

    let inFlight = false;
    const ping = async () => {
      if (inFlight) return; // prevent overlapping polls
      inFlight = true;
      setState("checking");
      try {
        const res = await fetch("/api/chat", { cache: "no-store" });
        const data = await res.json().catch(() => ({} as any));
        if (res.ok && (data?.ok ?? true)) {
          setState("ok");
        } else {
          setState("warn");
        }
        setBackend(data?.backend);
      } catch (_e) {
        setState("warn");
      } finally {
        setLast(timeNow());
        inFlight = false;
      }
    };

    useEffect(() => {
      ping();
      const id = setInterval(ping, 15000);
      return () => clearInterval(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const dot = state === "ok" ? "bg-emerald-300" : state === "checking" ? "bg-amber-300" : "bg-amber-400";
    const bg = state === "ok" ? "bg-emerald-500/80 text-white" : "bg-amber-500/80 text-black";
    const label = state === "ok" ? "API: OK" : state === "checking" ? "API: Checking…" : "API: Unreachable";

    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border border-white/20 ${bg}`}>
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
        {backend ? <span className="opacity-70"> · {backend}</span> : null}
        {last ? <span className="opacity-70"> · {last}</span> : null}
      </span>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      // Helper: perform POST with a single retry for transient "fetch failed" cases
      const doPost = async (): Promise<{ data: any; status: number; ok: boolean }> => {
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
        return { data: payload, status: res.status, ok: res.ok };
      };

      let result: { data: any; status: number; ok: boolean };
      try {
        result = await doPost();
      } catch (e1: any) {
        // Retry once after a short delay on network error (e.g., HMR rebuilds)
        await new Promise((r) => setTimeout(r, 500));
        try {
          result = await doPost();
        } catch (e2: any) {
          throw e2; // surface to outer catch
        }
      }

      const { data, status, ok } = result;
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
                const label = meta.title || meta.file_path || meta.source || "Source";
                const page = meta.page || meta.page_number;
                const l = page ? `${label}#page=${page}` : label;
                const href = meta.url || meta.href || "#";
                return { label: l, href };
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
      const form = (e.currentTarget as HTMLTextAreaElement).closest("form");
      if (form) (form as HTMLFormElement).requestSubmit();
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
        <summary className="cursor-pointer select-none text-sm/6 text-neutral-300 hover:text-white">Citations</summary>
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
  <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Live API status */}
      <div className="sticky top-16 z-20 flex items-center justify-end">
        <StatusPill />
      </div>
      {/* Input block */}
      <form
        id="chat-form"
        onSubmit={onSubmit}
        className="sticky top-20 z-10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur rounded-[var(--radius-card)] border border-black/5 dark:border-white/10 shadow-[var(--shadow-card)] p-4"
      >
        <label htmlFor="q" className="block text-sm font-medium text-neutral-800 dark:text-neutral-200/90 mb-2">
          Ask a question
        </label>
        <textarea
          id="q"
          value={q}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about the Insurance Act…"
          className="w-full rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-transparent min-h-[120px]"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            aria-label="Ask question"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium text-white bg-gradient-to-r from-violet-600 to-cyan-500 shadow hover:shadow-lg transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
          >
            {loading ? "Asking…" : "Ask Question"}
          </button>
          <button
            type="button"
            aria-label="Start new chat"
            onClick={() => {
              if (msgs.length > 0 && !confirm("Start a new chat? Current messages will be cleared.")) return;
              setMsgs([]);
            }}
            className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30 border border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
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
            className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30 border border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
          >
            Clear chat
          </button>
        </div>
      </form>

      {/* Messages */}
      <div ref={scrollRef} className="h-[calc(100vh-14rem)] overflow-y-auto px-1">
        <div className="flex flex-col gap-4">
          {msgs.length === 0 && (
            <div className="text-neutral-300">No messages yet. Ask something to get started.</div>
          )}
          {msgs.map((m, i) => {
            const isUser = m.role === "user";
            const hasError = !!m.error;
            return (
              <MessageCard key={i} side={isUser ? "right" : "left"}>
                <div className="relative">
                  {!isUser && !hasError && (
                    <IconCluster onCopy={() => navigator.clipboard.writeText(m.content)} />
                  )}
                  <div className="whitespace-pre-wrap chat-content">
                    {m.content || (hasError ? `Error: ${m.error}` : <Skeleton />)}
                  </div>
                  <div className="mt-2 text-xs text-neutral-500">{m.time}</div>
                  {!isUser && !hasError && (
                    <>
                      <Citations items={m.citations as any} />
                      <FollowUps items={m.followUps as any} onClick={submitFollowUp} />
                    </>
                  )}
                </div>
              </MessageCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
