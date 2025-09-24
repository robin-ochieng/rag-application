import { useCallback, useRef, useState } from "react";

export type StreamEvent =
  | { type: "meta"; sources: any[] }
  | { type: "token"; value: string }
  | { type: "done"; answer: string }
  | { type: "error"; message: string };

interface UseStreamAnswerOptions {
  onMeta?: (sources: any[]) => void;
  onToken?: (t: string) => void;
  onDone?: (answer: string) => void;
  onError?: (msg: string) => void;
}

export function useStreamAnswer(opts: UseStreamAnswerOptions = {}) {
  const controllerRef = useRef<AbortController | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [answer, setAnswer] = useState("");

  const start = useCallback(async (q: string) => {
    if (controllerRef.current) controllerRef.current.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setStreaming(true);
    setAnswer("");

    try {
      const resp = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q }),
        signal: ctrl.signal,
      });
      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 2);
          if (!raw.startsWith("data:")) continue;
          const jsonPart = raw.slice(5).trim();
          if (jsonPart === "[DONE]") {
            setStreaming(false);
            return;
          }
          try {
            const evt: StreamEvent = JSON.parse(jsonPart);
            if (evt.type === "meta") {
              opts.onMeta?.(evt.sources);
            } else if (evt.type === "token") {
              setAnswer(a => a + evt.value);
              opts.onToken?.(evt.value);
            } else if (evt.type === "done") {
              setAnswer(evt.answer);
              opts.onDone?.(evt.answer);
              setStreaming(false);
            } else if (evt.type === "error") {
              opts.onError?.(evt.message);
              setStreaming(false);
            }
          } catch (e) {
            console.error("Bad SSE line", jsonPart, e);
          }
        }
      }
      setStreaming(false);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      opts.onError?.(e.message || String(e));
      setStreaming(false);
    }
  }, [opts]);

  const stop = useCallback(() => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = null;
    setStreaming(false);
  }, []);

  return { start, stop, streaming, answer };
}
