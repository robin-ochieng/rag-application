"use client";
import { useEffect, useRef, useState, type FormEvent, KeyboardEvent, type ChangeEvent } from "react";
import { useStreamAnswer } from "@/components/chat/useStreamAnswer";
import { FollowUps, IconCluster, MessageCard, Skeleton } from "./chat/Card";
import CitationsDisclosure from "@/components/chat/CitationsDisclosure";
import Composer from "@/components/chat/Composer";
import MarkdownResponse from "@/components/chat/MarkdownResponse";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { useChats, useMessages } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";

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

export default function ChatLayoutWithStorage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamSources, setStreamSources] = useState<any[]>([]);
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Chat hooks
  const { createChat } = useChats();
  const { messages: dbMessages, addMessage } = useMessages(currentChatId);
  
  const { start: startStream, stop: stopStream, streaming, answer: streamAnswer } = useStreamAnswer({
    onMeta: (sources) => setStreamSources(sources),
    onToken: (t) => {
      setMsgs((m) => {
        const next = [...m];
        let idx = -1;
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "assistant" && !next[i].error) {
            idx = i;
            break;
          }
        }
        if (idx >= 0) {
          next[idx] = { ...next[idx], content: (next[idx].content || "") + t, sources: streamSources };
        }
        return next;
      });
    },
    onDone: async (full) => {
      setMsgs((m) => {
        const next = [...m];
        let idx = -1;
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "assistant" && !next[i].error) {
            idx = i;
            break;
          }
        }
        if (idx >= 0) {
          next[idx] = { ...next[idx], content: full, sources: streamSources };
        }
        return next;
      });
      
      // Save assistant message to database after UI update
      if (currentChatId && full) {
        try {
          await addMessage(full, 'assistant');
        } catch (error) {
          console.error('Failed to save assistant message:', error);
        }
      }
    },
    onError: (msg) => {
      setStreamingError(msg);
    },
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const apiPath = "/api/chat";

  // Load messages from database when chat changes
  useEffect(() => {
    if (currentChatId && dbMessages.length > 0) {
      const convertedMessages: Message[] = dbMessages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: [],
        citations: [],
        followUps: []
      }));
      setMsgs(convertedMessages);
    } else if (currentChatId && dbMessages.length === 0) {
      // Only clear if we explicitly selected a chat with no messages
      setMsgs([]);
    }
    // Don't clear messages if currentChatId is null (new chat mode)
  }, [dbMessages, currentChatId]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, loading]);

  function timeNow() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMsgs([]);
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  async function onSubmit(e?: FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();
    if (loading || streaming) return;
    if (!q.trim()) return;

    // Create new chat if none selected (only if database is available)
    let chatId = currentChatId;
    if (!chatId) {
      try {
        const newChat = await createChat();
        if (newChat) {
          chatId = newChat.id;
          setCurrentChatId(chatId);
        }
        // If chat creation fails, continue without chat storage
      } catch (error) {
        console.error('Failed to create chat, continuing without storage:', error);
      }
    }

    const userMsg: Message = { role: "user", content: q, time: timeNow() };
    const assistantMsg: Message = { role: "assistant", content: "", time: timeNow(), error: undefined };
    
    setMsgs((m: Message[]) => [...m, userMsg, assistantMsg]);
    const userQuestion = q.trim();
    setQ("");
    setStreamingError(null);
    setStreamSources([]);

    // Save user message to database (non-blocking)
    if (chatId) {
      addMessage(userQuestion, 'user').catch(error => {
        console.error('Failed to save user message:', error);
      });
    }

    // Start streaming
    startStream(userQuestion).catch(async (e) => {
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
          let idx = -1;
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "assistant" && !next[i].content && !next[i].error) {
              idx = i;
              break;
            }
          }
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
        
        // Save assistant response to database (non-blocking)
        const assistantResponse = data.answer || "";
        if (chatId && assistantResponse) {
          addMessage(assistantResponse, 'assistant').catch(error => {
            console.error('Failed to save assistant message:', error);
          });
        }
      } catch (err2: any) {
        setMsgs((prev: Message[]) => {
          const next = [...prev];
          let idx = -1;
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "assistant" && !next[i].content && !next[i].error) {
              idx = i;
              break;
            }
          }
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
    setTimeout(() => onSubmit(), 0);
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg shadow-sm"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          lg:relative lg:translate-x-0 lg:block
          fixed top-0 left-0 h-full z-50 
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <ChatSidebar
          currentChatId={currentChatId || undefined}
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
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4 min-h-full grid grid-rows-[auto,1fr,auto] gap-4 w-full">
          {/* Header row with controls */}
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-[rgb(var(--foreground))]">
              {currentChatId ? 'Chat' : 'New Chat'}
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Clear current chat"
                onClick={() => {
                  if (msgs.length > 0 && !confirm("Clear current chat messages?")) return;
                  setMsgs([]);
                }}
                className="h-9 rounded-md border border-[rgb(var(--border))] px-3 text-sm bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
              >
                Clear chat
              </button>
            </div>
          </div>

          {/* Scrollable chat list */}
          <div ref={scrollRef} className="overflow-y-auto px-1">
            <div className="flex flex-col gap-4 pb-4">
              {msgs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center relative">
                  <h2 className="text-xl font-semibold tracking-tight mb-4 bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 bg-clip-text text-transparent">
                    Welcome to Kenbright GPT
                  </h2>
                  <p className="max-w-lg text-sm sm:text-base leading-relaxed text-[rgb(var(--muted-foreground))] mb-7">
                    Ask anything and I'll search across curated Insurance Act and IFRS-17 resources to give concise, cited answers. Try asking about regulatory definitions, compliance obligations, contract measurement, or specific clauses.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                    {[
                      "What are the capital requirements?",
                      "Explain IFRS-17 CSM calculation",
                      "Summarize duties of an insurer",
                      "IFRS-17 loss component approach",
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
                      <div className="chat-content relative">
                        {m.content ? (
                          isUser ? (
                            <div className="whitespace-pre-wrap text-[rgb(var(--foreground))]">
                              {m.content}
                            </div>
                          ) : (
                            <MarkdownResponse content={m.content} />
                          )
                        ) : hasError ? (
                          `Error: ${m.error}`
                        ) : (
                          <>
                            {streaming && i === msgs.length - 1 && m.role === "assistant" ? (
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
            placeholder="Ask about Insurance Act, IFRS-17, or compliance topics…"
          />
        </div>
      </div>
    </div>
  );
}