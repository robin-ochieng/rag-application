import os
from typing import Dict, List, AsyncGenerator

from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import PineconeVectorStore
from langchain.schema import Document
from pinecone import Pinecone
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain

load_dotenv()

# Bridge Pinecone env vars for LangChain integration:
# Our repo uses PINECONE_API_KEY2/INDEX_NAME2 during ingestion.
# LangChain's PineconeVectorStore expects PINECONE_API_KEY from the environment.
if not os.getenv("PINECONE_API_KEY") and os.getenv("PINECONE_API_KEY2"):
    os.environ["PINECONE_API_KEY"] = os.getenv("PINECONE_API_KEY2", "")


def _ns_value() -> str:
    """Backward-compatible single namespace accessor (legacy)."""
    raw = os.getenv("INDEX_NAMESPACE")
    if not raw:
        return "insurance-act"
    s = str(raw).strip()
    if s == "" or s.lower() in {"none", "null", "undefined"}:
        return "insurance-act"
    return s


def _namespaces() -> List[str]:
    """Return list of namespaces to query.

    Uses env var INDEX_NAMESPACES (comma separated). Falls back to INDEX_NAMESPACE or default.
    Example: INDEX_NAMESPACES="insurance-act,ifrs-17".
    """
    raw = os.getenv("INDEX_NAMESPACES")
    if not raw:
        return [_ns_value()]
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    return parts or [_ns_value()]


def build_chain():
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
    llm = ChatOpenAI(temperature=0, model="gpt-4o", streaming=True)  # ✅ Enable streaming
    
    # Enhanced prompt template for better formatting
    from langchain_core.prompts import ChatPromptTemplate
    
    enhanced_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a helpful AI assistant specializing in Insurance Act and IFRS-17 regulatory guidance. 

When answering questions, please:
- Use clear, well-structured markdown formatting
- Use headings (##, ###) to organize complex topics
- Use bullet points or numbered lists for multiple items
- Use **bold** for important terms and concepts
- Use `code formatting` for specific regulatory references, sections, or technical terms
- Use > blockquotes for direct regulatory quotations
- Structure your response with clear logical flow

Provide accurate, comprehensive answers based on the provided context."""),
        ("human", """Context information:
{context}

Question: {input}

Please provide a comprehensive, well-formatted answer based on the context above.""")
    ])
    
    combine_docs_chain = create_stuff_documents_chain(llm=llm, prompt=enhanced_prompt)
    return {"embeddings": embeddings, "combine": combine_docs_chain, "llm": llm, "prompt": enhanced_prompt}

CHAIN = build_chain()


def _retrieve_from_pinecone_single(query: str, namespace: str, k: int) -> List[Document]:
    index_name = os.getenv("INDEX_NAME2")
    if not index_name:
        return []
    pc_key = os.getenv("PINECONE_API_KEY") or os.getenv("PINECONE_API_KEY2") or ""
    pc = Pinecone(api_key=pc_key)
    index = pc.Index(index_name)
    vec = CHAIN["embeddings"].embed_query(query)
    res = index.query(vector=vec, top_k=k, include_metadata=True, namespace=namespace)
    docs: List[Document] = []
    for m in res.get("matches") or []:
        md = m.get("metadata") or {}
        text = md.get("text") or ""
        meta = {}
        for k2, v in md.items():
            if v is None:
                continue
            if isinstance(v, (str, int, float, bool)):
                meta[k2] = v
            else:
                meta[k2] = str(v)
        meta.setdefault("namespace", namespace)
        docs.append(Document(page_content=text, metadata=meta))
    return docs


def retrieve_multi(query: str, k_total: int = 6) -> List[Document]:
    """Retrieve across all configured namespaces and merge results.

    Strategy: allocate roughly even k across namespaces, at least 1 each.
    """
    nspaces = _namespaces()
    if not nspaces:
        return []
    per = max(1, k_total // len(nspaces))
    remainder = max(0, k_total - per * len(nspaces))
    all_docs: List[Document] = []
    for i, ns in enumerate(nspaces):
        k_ns = per + (1 if i < remainder else 0)
        try:
            docs = _retrieve_from_pinecone_single(query, ns, k_ns)
            all_docs.extend(docs)
        except Exception as e:  # pragma: no cover
            print(f"[warn] retrieval failed for namespace '{ns}': {e}")

    # Simple de-dupe by snippet start + source_path if present
    seen: set[tuple] = set()
    uniq: List[Document] = []
    for d in all_docs:
        key = (d.page_content[:120], d.metadata.get("source") or d.metadata.get("file_name"))
        if key in seen:
            continue
        seen.add(key)
        uniq.append(d)
    return uniq


def ask(query: str) -> Dict:
    """Run a query via multi-namespace Pinecone retrieval and LLM combine."""
    docs = retrieve_multi(query, k_total=6)
    result = CHAIN["combine"].invoke({"input": query, "context": docs})
    if isinstance(result, dict):
        answer = result.get("answer") or result.get("output_text") or ""
    else:
        answer = str(result)
    sources: List[Dict] = []
    for doc in docs:
        snippet = (doc.page_content or "").strip().replace("\n", " ")
        if len(snippet) > 300:
            snippet = snippet[:297] + "..."
        sources.append({"snippet": snippet, "metadata": doc.metadata or {}})
    return {"answer": answer, "sources": sources}


async def ask_stream(query: str) -> AsyncGenerator[Dict, None]:
    """Async generator that yields streaming tokens and meta similar to ask().

    Yields dict events of shape:
      {"type": "meta", "sources": [...]} (first)
      {"type": "token", "value": "..."} (multiple)
      {"type": "done", "answer": full_answer}
      {"type": "error", "message": str}
    """
    try:
        docs = retrieve_multi(query, k_total=6)
        sources: List[Dict] = []
        for doc in docs:
            snippet = (doc.page_content or "").strip().replace("\n", " ")
            if len(snippet) > 300:
                snippet = snippet[:297] + "..."
            sources.append({"snippet": snippet, "metadata": doc.metadata or {}})
        # Emit meta first
        yield {"type": "meta", "sources": sources}

        # Build a one-off chain manually to access streaming tokens from underlying ChatOpenAI
        llm: ChatOpenAI = CHAIN["llm"]  # type: ignore
        prompt = CHAIN["prompt"]  # pulled earlier
        # The retrieval-qa-chat prompt expects "input" + "context"
        # We'll manually format the prompt for streaming rather than using the combine_docs_chain which buffers.
        from langchain_core.messages import HumanMessage
        # Compose context block
        context_block = "\n\n".join([d.page_content for d in docs])
        formatted = prompt.format_messages(input=query, context=context_block)  # returns list[BaseMessage]

        full_answer_parts: List[str] = []
        token_count = 0
        async for chunk in llm.astream(formatted):  # chunk is an AIMessageChunk
            token = getattr(chunk, "content", None)
            if not token:
                continue
            if isinstance(token, list):  # sometimes comes as list of content parts
                # Flatten textual parts only
                token_text = "".join([t for t in token if isinstance(t, str)])
            else:
                token_text = str(token)
            if token_text:
                token_count += 1
                full_answer_parts.append(token_text)
                # ✅ Yield immediately for each token
                yield {"type": "token", "value": token_text}
        full_answer = "".join(full_answer_parts)
        yield {"type": "done", "answer": full_answer}
    except Exception as e:  # pragma: no cover - streaming error path
        yield {"type": "error", "message": str(e)}
