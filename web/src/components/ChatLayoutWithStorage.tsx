"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useStreamAnswer } from "@/components/chat/useStreamAnswer";
import { FollowUps, IconCluster, MessageCard, Skeleton } from "./chat/Card";
import { CitationsToggle } from "@/components/chat/CitationsPanel";
import Composer from "@/components/chat/Composer";
import MarkdownResponse from "@/components/chat/MarkdownResponse";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { useChats, useMessages } from "@/hooks/useChat";
import { normalizeCitations, sourcesToCitations } from "@/lib/citations";
import type { ChatMessage, Citation, Source } from "@/types/citations";

type Message = ChatMessage;

interface ChatApiResponse {
  answer?: string;
  sources?: Source[];
  citations?: Citation[];
  followUps?: string[];
  error?: unknown;
}

const API_PATH = "/api/chat";
const bubbleStyle: CSSProperties & { "--bubble-actions-width": string } = {
  "--bubble-actions-width": "3.25rem",
};

type LibraryCitation = Parameters<typeof normalizeCitations>[0][number];

function toLibraryCitation(citation: Citation): LibraryCitation {
  return {
    ...citation,
    sourceType: citation.sourceType ?? "InternalDoc",
  };
}

function toAppCitations(items: LibraryCitation[]): Citation[] {
  return items.map((item) => ({ ...item }));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
}

function resolveCitations(data: ChatApiResponse): Citation[] {
  const payloadCitations: LibraryCitation[] = Array.isArray(data.citations)
    ? data.citations.map(toLibraryCitation)
    : [];

  const sourceCitations: LibraryCitation[] = Array.isArray(data.sources)
    ? sourcesToCitations(data.sources)
    : [];

  return toAppCitations(normalizeCitations([...payloadCitations, ...sourceCitations]));
}

export default function ChatLayoutWithStorage() {
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const { createChat, generateTitleFromFirstMessage } = useChats();
  const { messages: dbMessages, addMessage } = useMessages(currentChatId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const streamMetaRef = useRef<{ sources: Source[]; citations: Citation[] }>({ sources: [], citations: [] });

  const applyToLastAssistant = useCallback((updater: (message: Message) => Message) => {
    setMsgs((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === "assistant") {
          next[i] = updater(next[i]);
          break;
        }
      }
      return next;
    });
  }, []);

  const { start: startStream, streaming } = useStreamAnswer({
    onMeta: (sources, citations) => {
      const normalized = citations && citations.length > 0
        ? normalizeCitations(citations.map(toLibraryCitation))
        : normalizeCitations(sourcesToCitations(sources));
      const appCitations = toAppCitations(normalized);
      streamMetaRef.current = { sources, citations: appCitations };
      applyToLastAssistant((msg) => ({ ...msg, sources, citations: appCitations }));
    },
    onToken: (token) => {
      applyToLastAssistant((msg) => ({
        ...msg,
        content: `${msg.content}${token}`,
        sources: streamMetaRef.current.sources,
        citations: streamMetaRef.current.citations,
      }));
    },
    onDone: async (answer) => {
      applyToLastAssistant((msg) => ({
        ...msg,
        content: answer,
        sources: streamMetaRef.current.sources,
        citations: streamMetaRef.current.citations,
      }));

      if (currentChatId && answer) {
        try {
          await addMessage(answer, "assistant");
        } catch (error) {
          console.error("Failed to save assistant message:", error);
        }
      }
    },
    onError: (message) => {
      applyToLastAssistant((msg) => ({ ...msg, error: message || "Stream error" }));
    },
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [msgs, loading]);

  useEffect(() => {
    if (currentChatId && dbMessages.length > 0) {
      const converted: Message[] = dbMessages.map((entry) => ({
        role: entry.role as Message["role"],
        content: entry.content,
        time: new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: [],
        citations: [],
        followUps: [],
      }));
      setMsgs(converted);
    } else if (currentChatId && dbMessages.length === 0) {
      setMsgs([]);
    }
  }, [dbMessages, currentChatId]);

  function timeNow(): string {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const enqueueAssistantPlaceholder = (userMessage: Message) => {
    const assistantMsg: Message = { role: "assistant", content: "", time: timeNow() };
    setMsgs((prev) => [...prev, userMessage, assistantMsg]);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMsgs([]);
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleFallbackRequest = async (prompt: string, chatId: string | null) => {
    setLoading(true);
    try {
      const res = await fetch(API_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: prompt }),
        cache: "no-store",
      });

      let payload: ChatApiResponse = {};
      try {
        payload = (await res.json()) as ChatApiResponse;
      } catch (jsonError) {
        const fallbackText = await res.text().catch(() => "");
        payload = {
          answer: "",
          sources: [],
          error: fallbackText || getErrorMessage(jsonError) || `Invalid JSON (status ${res.status})`,
        };
      }

      const answer = typeof payload.answer === "string" ? payload.answer : "";
      const followUps = Array.isArray(payload.followUps) ? payload.followUps : [];
      const citations = resolveCitations(payload);
      const sources = Array.isArray(payload.sources) ? payload.sources : [];
      const errorText = payload.error ? getErrorMessage(payload.error) : !res.ok ? `HTTP ${res.status}` : "";

      applyToLastAssistant((msg) => ({
        ...msg,
        content: answer,
        error: answer ? undefined : errorText || "Request failed",
        sources,
        citations,
        followUps,
      }));

      if (chatId && answer) {
        try {
          await addMessage(answer, "assistant");
        } catch (error) {
          console.error("Failed to save assistant message:", error);
        }
      }
    } catch (error) {
      const message = getErrorMessage(error);
      applyToLastAssistant((msg) => ({ ...msg, content: "", error: message }));
    } finally {
      setLoading(false);
    }
  };

  async function onSubmit(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    if (loading || streaming) return;
    if (!q.trim()) return;

    let chatId = currentChatId;
    if (!chatId) {
      try {
        const created = await createChat();
        if (created) {
          chatId = created.id;
          setCurrentChatId(created.id);
        }
      } catch (error) {
        console.error("Failed to create chat, continuing without storage:", error);
      }
    }

    const userQuestion = q.trim();
    const userMsg: Message = { role: "user", content: userQuestion, time: timeNow() };
    setQ("");
    streamMetaRef.current = { sources: [], citations: [] };
    enqueueAssistantPlaceholder(userMsg);

    if (chatId) {
      addMessage(userQuestion, "user").catch((error) => {
        console.error("Failed to save user message:", error);
      });

      if (msgs.length === 0) {
        generateTitleFromFirstMessage(chatId, userQuestion).catch((error) => {
          console.error("Failed to generate chat title:", error);
        });
      }
    }

    startStream(userQuestion).catch((error) => {
      console.warn("Streaming failed, falling back", error);
      void handleFallbackRequest(userQuestion, chatId ?? null);
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void onSubmit();
    } else if (event.key === "Escape") {
      event.currentTarget.blur();
    }
  }

  function submitFollowUp(text: string) {
    setQ(text);
    setTimeout(() => {
      void onSubmit();
    }, 0);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg shadow-sm"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          lg:relative lg:translate-x-0 lg:block
          fixed top-0 left-0 h-full z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <ChatSidebar
          currentChatId={currentChatId ?? undefined}
          onChatSelect={(chatId) => {
            handleChatSelect(chatId);
            setSidebarOpen(false);
          }}
          onNewChat={() => {
            handleNewChat();
            setSidebarOpen(false);
          }}
        />
      </div>

  <div className="flex-1 flex flex-col">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4 min-h-full grid grid-rows-[auto,1fr,auto] gap-4 w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-[rgb(var(--foreground))]">
              {currentChatId ? "Chat" : "New Chat"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Clear current chat"
                onClick={() => {
                  if (msgs.length > 0 && !confirm("Clear current chat messages?")) {
                    return;
                  }
                  setMsgs([]);
                }}
                className="h-9 rounded-md border border-[rgb(var(--border))] px-3 text-sm bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
              >
                Clear chat
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="overflow-y-auto px-1">
            <div className="flex flex-col gap-4 pb-4">
              {msgs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center relative">
                  <h2 className="text-xl font-semibold tracking-tight mb-4 bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 bg-clip-text text-transparent">
                    Welcome to Kenbright GPT
                  </h2>
                  <p className="max-w-lg text-sm sm:text-base leading-relaxed text-[rgb(var(--muted-foreground))] mb-7">
                    Ask anything and I will search across curated Insurance Act and IFRS-17 resources to give concise, cited answers. Try asking about regulatory definitions, compliance obligations, contract measurement, or specific clauses.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                    {[
                      "How do I optimize IFRS-17 CSM calculations for profitability?",
                      "What are the latest regulatory capital adequacy requirements?",
                      "Guide me through risk adjustment methodologies under IFRS-17",
                      "How to implement loss component recognition for complex contracts?",
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => submitFollowUp(example)}
                        className="group relative rounded-full border border-[rgb(var(--border))] px-4 py-1.5 text-xs sm:text-sm font-medium text-[rgb(var(--foreground))]/80 hover:text-[rgb(var(--foreground))] transition bg-[rgb(var(--background))]/60 hover:bg-[rgb(var(--accent))]/40"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-[rgb(var(--muted-foreground))] flex items-center gap-1">
                    Developed by <span className="font-medium text-[rgb(var(--foreground))]">Kenbright AI</span>
                  </div>
                </div>
              )}
              {msgs.map((message, index) => {
                const isUser = message.role === "user";
                const hasError = Boolean(message.error);
                return (
                  <MessageCard key={`${message.role}-${index}-${message.time}`} side={isUser ? "right" : "left"}>
                    <div className="relative pr-[var(--bubble-actions-width)]" style={bubbleStyle}>
                      {!isUser && !hasError && (
                        <IconCluster onCopy={() => navigator.clipboard.writeText(message.content)} />
                      )}
                      <div className="chat-content relative">
                        {message.content ? (
                          isUser ? (
                            <div className="whitespace-pre-wrap text-[rgb(var(--foreground))]">{message.content}</div>
                          ) : (
                            <MarkdownResponse content={message.content} />
                          )
                        ) : hasError ? (
                          `Error: ${message.error}`
                        ) : (
                          <>
                            {streaming && index === msgs.length - 1 && message.role === "assistant" ? (
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
                      <div className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">{message.time}</div>
                      {!isUser && !hasError && (
                        <>
                          <CitationsToggle citations={message.citations} className="mt-2" />
                          <FollowUps items={message.followUps ?? []} onClick={submitFollowUp} />
                        </>
                      )}
                    </div>
                  </MessageCard>
                );
              })}
            </div>
          </div>

          <Composer
            id="chat-form"
            value={q}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setQ(event.target.value)}
            onKeyDown={onKeyDown}
            onSubmit={onSubmit}
            disabled={loading || streaming}
            placeholder="Ask about Insurance Act, IFRS-17, or compliance topics…"
          />
        </div>
      </div>
    </div>
  );
}