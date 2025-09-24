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
  const [streaming, setStreaming] = useState(false);
  const [gotFirstToken, setGotFirstToken] = useState(false);
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

    // Attempt streaming first
    setStreaming(true);
    try {
      const controller = new AbortController();
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: userMsg.content, query: userMsg.content }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Streaming failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantIndex: number | null = null;
      let fullAnswer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const dataStr = line.slice(5).trim();
            if (dataStr === "[DONE]") {
              continue;
            }
          let evt: any;
          try { evt = JSON.parse(dataStr); } catch { continue; }
          if (assistantIndex === null) {
            assistantIndex = msgs.length; // index of the assistant placeholder at time of submit
          }
          if (evt.type === "meta") {
            // attach sources now
            setMsgs((prev) => {
              const next = [...prev];
              const idx = next.findIndex((m) => m.role === "assistant" && !m.content && !m.error);
              if (idx >= 0) {
                next[idx].sources = evt.sources || [];
              }
              return next;
            });
          } else if (evt.type === "token") {
            if (!gotFirstToken) setGotFirstToken(true);
            fullAnswer += evt.value;
            setMsgs((prev) => {
              const next = [...prev];
              const idx = next.findIndex((m) => m.role === "assistant" && !m.error && typeof m.content === "string");
              if (idx >= 0) {
                next[idx] = { ...next[idx], content: fullAnswer };
              }
              return next;
            });
          } else if (evt.type === "done") {
            if (evt.answer) fullAnswer = evt.answer;
            setMsgs((prev) => {
              const next = [...prev];
              const idx = next.findIndex((m) => m.role === "assistant" && !m.error);
              if (idx >= 0) {
                next[idx] = { ...next[idx], content: fullAnswer };
              }
              return next;
            });
          } else if (evt.type === "error") {
            setMsgs((prev) => {
              const next = [...prev];
              const idx = next.findIndex((m) => m.role === "assistant" && !m.content && !m.error);
              if (idx >= 0) next[idx] = { ...next[idx], error: evt.error || "Streaming error" };
              return next;
            });
          }
        }
      }
    } catch (streamErr) {
      // Fallback to non-streaming call
      try {
        const res = await fetch(apiPath, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ q: userMsg.content }),
          cache: "no-store",
        });
        const payload = await res.json().catch(() => ({ error: `Bad JSON (status ${res.status})` }));
        setMsgs((prev) => {
          const next = [...prev];
          const idx = next.findIndex((m) => m.role === "assistant" && !m.content && !m.error);
          if (idx >= 0) {
            next[idx] = { ...next[idx], content: payload.answer || "", sources: payload.sources || [], error: payload.error };
          }
          return next;
        });
      } catch (fallbackErr: any) {
        setMsgs((prev) => {
          const next = [...prev];
            const idx = next.findIndex((m) => m.role === "assistant" && !m.content && !m.error);
            if (idx >= 0) next[idx] = { ...next[idx], error: fallbackErr?.message || "Request failed" };
            return next;
        });
      }
    } finally {
      setStreaming(false);
      setGotFirstToken(false);
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
            <section
              role="region"
              aria-label="Welcome"
              className="mx-auto w-full max-w-3xl"
            >
              <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-[var(--shadow-card)] p-6 text-center">
                <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-[rgb(var(--accent))]/15 text-[rgb(var(--accent-foreground))] flex items-center justify-center">
                  {/* chat bubble icon */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Welcome to Robin GPT</h2>
                <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">Ask anything to get started.</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {[
                    "Summarize the Insurance Act",
                    "What are the licensing requirements?",
                    "Explain Section 156",
                    "Give me a quick overview",
                  ].map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => submitFollowUp(s)}
                      className="px-3 py-1.5 text-sm rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--background))] hover:bg-[rgb(var(--muted))]/40 text-[rgb(var(--foreground))]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </section>
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
                    {m.content || (hasError ? `Error: ${m.error}` : (!gotFirstToken && streaming && i === msgs.length - 1 && m.role === "assistant" ? (
                      <div className="flex items-center gap-4 py-2 px-1">
                        <div className="loader-ring"><div className="loader-core" /></div>
                        <div>
                          <div className="text-sm font-medium loader-text">Processing your request…</div>
                          <div className="text-xs mt-1 text-[rgb(var(--muted-foreground))]">Retrieving context & preparing answer</div>
                        </div>
                      </div>
                    ) : <Skeleton />))}
                  </div>
                  <div className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">{m.time}</div>
                  {!isUser && !hasError && (() => {
                    const citations = Array.isArray(m.citations) ? (m.citations as any[]) : [];
                    const followUps = Array.isArray(m.followUps) ? (m.followUps as string[]) : [];
                    return (
                      <div className="space-y-2">
                        <CitationsDisclosure items={citations as any} />
                        <FollowUps items={followUps} onClick={submitFollowUp} />
                      </div>
                    );
                  })()}
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
        disabled={loading || streaming}
        placeholder="Ask me anything…"
      />
    </div>
  );
}
