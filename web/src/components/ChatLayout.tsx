"use client";
import { useEffect, useRef, useState, type FormEvent, KeyboardEvent, type ChangeEvent } from "react";
import { useStreamAnswer } from "@/components/chat/useStreamAnswer";
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
  const [loading, setLoading] = useState(false); // legacy non-stream fallback
  const [streamSources, setStreamSources] = useState<any[]>([]);
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const { start: startStream, stop: stopStream, streaming, answer: streamAnswer } = useStreamAnswer({
    onMeta: (sources) => setStreamSources(sources),
    onToken: (t) => {
      setMsgs((m) => {
        const next = [...m];
        const idx = next.findIndex((mm) => mm.role === "assistant" && mm.content === "" && !mm.error);
        if (idx >= 0) {
          next[idx] = { ...next[idx], content: (next[idx].content || "") + t, sources: streamSources };
        }
        return next;
      });
    },
    onDone: (full) => {
      setMsgs((m) => {
        const next = [...m];
        const idx = next.findIndex((mm) => mm.role === "assistant" && mm.content && !mm.error);
        if (idx >= 0) {
          next[idx] = { ...next[idx], content: full, sources: streamSources };
        }
        return next;
      });
    },
    onError: (msg) => {
      setStreamingError(msg);
    },
  });
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
    if (loading || streaming) return; // prevent double-submit
    if (!q.trim()) return;

    const userMsg: Message = { role: "user", content: q, time: timeNow() };
    setMsgs((m: Message[]) => [
      ...m,
      userMsg,
      { role: "assistant", content: "", time: timeNow(), error: undefined },
    ]);
    setQ("");
    setStreamingError(null);
    setStreamSources([]);

    // Attempt streaming first
    startStream(userMsg.content).catch(async (e) => {
      // Fallback to non-stream on error
      console.warn("Streaming failed, falling back", e);
      setLoading(true);
      try {
        const res = await fetch(apiPath, {
          method: "POST",
            headers: { "content-type": "application/json" },
          body: JSON.stringify({ q: userMsg.content }),
          cache: "no-store",
        });
        const payload = await res.json().catch(() => ({ answer: "", sources: [], error: "Invalid JSON" }));
        const { data, status, ok } = { data: payload, status: res.status, ok: res.ok };
        setMsgs((prev: Message[]) => {
          const next = [...prev];
          const idx = next.findIndex((mm) => mm.role === "assistant" && !mm.content && !mm.error);
          if (idx >= 0) {
            const hasAnswer = !!(data.answer && data.answer.length > 0);
            const errText = data.error ? String(data.error) : (!ok ? `HTTP ${status}` : "");
            if (!hasAnswer && errText) {
              next[idx] = { ...next[idx], content: "", error: errText };
            } else {
              next[idx] = { ...next[idx], content: data.answer || "", sources: data.sources || [] };
            }
          }
          return next;
        });
      } catch (err2: any) {
        setMsgs((prev: Message[]) => {
          const next = [...prev];
          const idx = next.findIndex((mm) => mm.role === "assistant" && !mm.content && !mm.error);
          if (idx >= 0) next[idx] = { ...next[idx], content: "", error: err2?.message || "Request failed" };
          return next;
        });
      } finally {
        setLoading(false);
      }
    });
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
            <div className="flex flex-col items-center justify-center py-20 text-center relative">
              <h2 className="text-xl font-semibold tracking-tight mb-4 bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 bg-clip-text text-transparent">
                Welcome to Kenbright GPT
              </h2>
              <p className="max-w-lg text-sm sm:text-base leading-relaxed text-[rgb(var(--muted-foreground))] mb-7">
                Ask anything and I'll search across curated Insurance Act resources to give concise, cited answers. Try asking about regulatory definitions, compliance obligations, or specific clauses.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                {[
                  "What are the capital requirements?",
                  "Summarize duties of an insurer",
                  "Explain section 57 in simple terms",
                  "Key compliance deadlines?",
                ].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => submitFollowUp(ex)}
                    className="group relative rounded-full border border-[rgb(var(--border))] px-4 py-1.5 text-xs sm:text-sm font-medium text-[rgb(var(--foreground))]/80 hover:text-[rgb(var(--foreground))] transition bg-[rgb(var(--background))]/60 hover:bg-[rgb(var(--accent))]/40"
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <div className="text-xs text-[rgb(var(--muted-foreground))] flex items-center gap-1">
                Developed by <span className="font-medium text-[rgb(var(--foreground))]">Kenbright AI</span>
              </div>
            </div>
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
                  <div className="whitespace-pre-wrap chat-content relative">
                    {m.content ? (
                      m.content
                    ) : hasError ? (
                      `Error: ${m.error}`
                    ) : (
                      <>
                        {/* Premium pre-stream animation */}
                        {streaming && i === msgs.length - 1 ? (
                          <div className="flex items-center gap-3 py-2">
                            <div className="relative h-5 w-5">
                              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-500 animate-pulse opacity-30" />
                              <div className="absolute inset-0 rounded-full border border-indigo-400/40 animate-[spin_2s_linear_infinite]" />
                              <div className="absolute inset-1 rounded-full bg-[rgb(var(--background))]" />
                            </div>
                            <div className="text-sm text-[rgb(var(--muted-foreground))] animate-pulse [animation-delay:150ms]">
                              Thinking…
                            </div>
                          </div>
                        ) : (
                          <Skeleton />
                        )}
                      </>
                    )}
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
        disabled={loading || streaming}
  placeholder="Ask me anything…"
      />
      {streaming && (
        <div className="text-xs text-[rgb(var(--muted-foreground))] flex items-center gap-1 px-1 -mt-2">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" /></span>
          Streaming…
        </div>
      )}
    </div>
  );
}
