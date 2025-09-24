import os
from typing import Dict, List, AsyncIterator, Any

from dotenv import load_dotenv
from langchain import hub
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
    raw = os.getenv("INDEX_NAMESPACE")
    if not raw:
        return "insurance-act"
    s = str(raw).strip()
    if s == "" or s.lower() in {"none", "null", "undefined"}:
        return "insurance-act"
    return s


def build_chain():
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
    llm = ChatOpenAI(temperature=0, model="gpt-4o")
    retrieval_prompt = hub.pull("langchain-ai/retrieval-qa-chat")
    combine_docs_chain = create_stuff_documents_chain(llm=llm, prompt=retrieval_prompt)
    return {"embeddings": embeddings, "combine": combine_docs_chain, "llm": llm}

CHAIN = build_chain()


def _retrieve_from_pinecone(query: str, k: int = 6) -> List[Document]:
    ns = _ns_value()
    index_name = os.getenv("INDEX_NAME2")
    if not index_name:
        return []
    pc_key = os.getenv("PINECONE_API_KEY") or os.getenv("PINECONE_API_KEY2") or ""
    pc = Pinecone(api_key=pc_key)
    index = pc.Index(index_name)
    vec = CHAIN["embeddings"].embed_query(query)
    res = index.query(vector=vec, top_k=k, include_metadata=True, namespace=ns)
    docs: List[Document] = []
    for m in res.get("matches") or []:
        md = m.get("metadata") or {}
        text = md.get("text") or ""
        # Ensure minimal metadata fields are strings/ints
        meta = {}
        for k2, v in md.items():
            if v is None:
                continue
            if isinstance(v, (str, int, float, bool)):
                meta[k2] = v
            else:
                meta[k2] = str(v)
        docs.append(Document(page_content=text, metadata=meta))
    return docs


def ask(query: str) -> Dict:
    """Run a query via direct Pinecone retrieval and LLM combine, return answer + sources."""
    docs = _retrieve_from_pinecone(query, k=6)
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


async def ask_stream(query: str) -> AsyncIterator[Dict[str, Any]]:
    """Async generator streaming answer tokens.

    Yields event dicts with shape:
      {"type": "meta", "sources": [...]} once
      {"type": "token", "value": "..."} multiple times
      {"type": "done", "answer": "full answer"} once at end
      {"type": "error", "error": "message"} on failure
    """
    docs = _retrieve_from_pinecone(query, k=6)
    sources: List[Dict[str, Any]] = []
    for doc in docs:
        snippet = (doc.page_content or "").strip().replace("\n", " ")
        if len(snippet) > 300:
            snippet = snippet[:297] + "..."
        sources.append({"snippet": snippet, "metadata": doc.metadata or {}})
    # Emit sources metadata first
    yield {"type": "meta", "sources": sources}

    # Build a simplified context prompt similar to combine chain use
    # We directly stream from the underlying llm to get incremental tokens.
    llm: ChatOpenAI = CHAIN["llm"]
    context_blocks = []
    for i, d in enumerate(docs, 1):
        context_blocks.append(f"Source {i}:\n{d.page_content}")
    context_text = "\n\n".join(context_blocks)
    system_msg = (
        "You are a helpful assistant. Use the provided sources to answer the question. "
        "If unsure, say you are not certain. Keep answers concise and grounded."
    )
    user_msg = f"Context:\n{context_text}\n\nQuestion: {query}\n\nAnswer:" if context_text else query

    collected: List[str] = []
    try:
        # ChatOpenAI astream expects sequence of tuples or messages
        async for chunk in llm.astream([("system", system_msg), ("human", user_msg)]):
            token = getattr(chunk, "content", None)
            if not token:
                continue
            collected.append(token)
            yield {"type": "token", "value": token}
    except Exception as e:  # pragma: no cover - streaming failures
        yield {"type": "error", "error": str(e)}
        return
    full_answer = "".join(collected)
    yield {"type": "done", "answer": full_answer}
