"use client";
import React, { useState, type FormEvent, type ChangeEvent } from "react";

type Source = { snippet?: string; metadata?: Record<string, any> };

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const apiBase =
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_BASE ||
    "http://localhost:8080";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setAnswer("");
    setSources([]);
    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setAnswer(data.answer || "");
      setSources(data.sources || []);
    } catch (err) {
      setAnswer("Request failed. Check API base URL and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <nav className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Insurance Act Chatbot</h1>
        <a className="text-sm text-blue-600 hover:underline" href="/">Home</a>
      </nav>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          className="w-full border rounded p-3 min-h-[120px]"
          placeholder="Ask about the Insurance Act…"
          value={message}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setMessage(e.target.value)
          }
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </form>

      <section className="mt-6">
        <h2 className="text-lg font-medium mb-2">Answer</h2>
        <div className="whitespace-pre-wrap border rounded p-4">
          {answer || "No answer yet."}
        </div>
      </section>

      <section className="mt-6">
        <details>
          <summary className="cursor-pointer select-none">Sources</summary>
          <ul className="mt-2 space-y-2 list-disc pl-6">
            {sources.length === 0 && <li>No sources.</li>}
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
                    <div className="text-xs text-gray-600">{parts.join("; ")}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      </section>
    </div>
  );
}
