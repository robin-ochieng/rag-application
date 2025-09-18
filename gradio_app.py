import os
from typing import List, Dict, Any

from dotenv import load_dotenv
import gradio as gr

from rag_core import ask

load_dotenv()


def _format_sources(sources: List[Dict[str, Any]]) -> str:
    if not sources:
        return "No sources."
    lines = []
    for i, s in enumerate(sources, 1):
        meta = s.get("metadata", {}) or {}
        parts = []
        for k in ["title", "file_path", "source", "page", "page_number"]:
            if meta.get(k):
                parts.append(f"{k}: {meta[k]}")
        snippet = s.get("snippet") or "(no snippet)"
        joined = "; ".join(parts)
        lines.append(f"{i}. {snippet}\n   {joined}")
    return "\n\n".join(lines)


def on_ask(message: str) -> List[str]:
    if not message or not message.strip():
        return ["", "Please enter a question."]
    result = ask(message)
    answer = result.get("answer", "")
    sources = _format_sources(result.get("sources", []))
    return [answer, sources]


with gr.Blocks(title="Insurance Act Chatbot") as demo:
    gr.Markdown("# Insurance Act Chatbot")
    with gr.Row():
        inp = gr.Textbox(label="Your question", lines=4, placeholder="Ask about the Insurance Act…")
    with gr.Row():
        btn = gr.Button("Ask")
    with gr.Row():
        out_answer = gr.Textbox(label="Answer", lines=8)
    with gr.Row():
        out_sources = gr.Textbox(label="Sources", lines=8)

    btn.click(on_ask, inputs=[inp], outputs=[out_answer, out_sources])


if __name__ == "__main__":
    # Host on 0.0.0.0 so it’s reachable from localhost; default port 7860
    demo.launch(server_name="0.0.0.0", server_port=int(os.getenv("PORT", "7860")))
