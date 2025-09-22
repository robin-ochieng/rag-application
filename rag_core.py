import os
from typing import Dict, List

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
    return {"embeddings": embeddings, "combine": combine_docs_chain}

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
