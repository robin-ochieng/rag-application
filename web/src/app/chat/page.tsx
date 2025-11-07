"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";

type SourceMetaValue = string | number | boolean | null | undefined;
type SourceMetadata = Record<string, SourceMetaValue>;

interface Source {
  snippet?: string;
  metadata?: SourceMetadata;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export default function ChatPage() {
  const [message, setMessage] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(API_KEY ? { "X-API-KEY": API_KEY } : {}),
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data: {
        answer?: string;
        sources?: Source[];
      } = await response.json();

      setAnswer(data.answer ?? "");
      setSources(data.sources ?? []);
    } catch (error) {
      console.error("chat request failed", error);
      setAnswer("Request failed. Check API base URL and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleMessageChange(
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void {
    setMessage(event.target.value);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <nav className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Insurance Act Chatbot</h1>
        <Link className="text-sm text-blue-600 hover:underline" href="/">
          Home
        </Link>
      </nav>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          className="min-h-[120px] w-full rounded border p-3"
          placeholder="Ask about the Insurance Act…"
          value={message}
          onChange={handleMessageChange}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </form>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-medium">Answer</h2>
        <div className="whitespace-pre-wrap rounded border p-4">
          {answer || "No answer yet."}
        </div>
      </section>

      <section className="mt-6">
        <details>
          <summary className="cursor-pointer select-none">Sources</summary>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            {sources.length === 0 && <li>No sources.</li>}
            {sources.map((source, index) => {
              const metadataEntries = Object.entries(source.metadata ?? {});
              const formattedMetadata = metadataEntries
                .filter(([, value]) => value !== undefined && value !== null)
                .map(([key, value]) => `${key}: ${String(value)}`)
                .join("; ");

              return (
                <li key={index}>
                  <div className="text-sm">
                    {source.snippet ?? "(no snippet)"}
                  </div>
                  {formattedMetadata && (
                    <div className="text-xs text-gray-600">
                      {formattedMetadata}
                    </div>
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
