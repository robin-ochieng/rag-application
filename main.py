from dotenv import load_dotenv
from rag_core import ask

load_dotenv()

if __name__ == "__main__":
    print("Retrieving...")

    query = "What is the purpose and scope of the Insurance Act?"
    result = ask(query)

    answer = result.get("answer", "")
    sources = result.get("sources", [])

    md_lines: list[str] = []
    md_lines.append("# Answer\n")
    md_lines.append(f"**Question:** {query}\n")
    md_lines.append("")
    md_lines.append("## Response")
    md_lines.append(answer.strip())
    md_lines.append("")
    md_lines.append("## Sources")
    if not sources:
        md_lines.append("- _No source documents returned._")
    else:
        for i, src in enumerate(sources, start=1):
            snippet = (src.get("snippet", "").strip().replace("\n", " "))
            if len(snippet) > 280:
                snippet = snippet[:277] + "..."
            meta = src.get("metadata", {}) or {}
            meta_parts = []
            for key in ("source", "file_path", "page", "page_number", "title"):
                if key in meta and meta[key] not in (None, ""):
                    meta_parts.append(f"{key}: {meta[key]}")
            meta_str = f" ({'; '.join(meta_parts)})" if meta_parts else ""
            md_lines.append(f"- {i}. {snippet}{meta_str}")

    print("\n".join(md_lines))