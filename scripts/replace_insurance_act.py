import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore


def main() -> None:
    load_dotenv()
    index_name = os.environ.get("INDEX_NAME2")
    pinecone_api_key = os.environ.get("PINECONE_API_KEY2")
    if not index_name or not pinecone_api_key:
        raise SystemExit("ERROR: INDEX_NAME2 and PINECONE_API_KEY2 are required in environment.")

    # Initialize vector store
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large", openai_api_key=os.environ.get("OPENAI_API_KEY"))

    # Delete old InsuranceAct.pdf chunks by metadata filter (any namespace)
    # Note: LangChain's PineconeVectorStore exposes .client for lower-level operations if needed
    store = PineconeVectorStore(index_name=index_name, embedding=embeddings)

    try:
        # Use low-level client to delete by filter in default (empty) namespace
        index = store._index  # type: ignore[attr-defined]
        repo_root = Path(__file__).resolve().parents[1]
        absolute = str((repo_root / "InsuranceAct.pdf").resolve())
        candidates = [
            {"source": {"$eq": "InsuranceAct.pdf"}},
            {"source": {"$eq": "www/InsuranceAct.pdf"}},
            {"source_path": {"$eq": "InsuranceAct.pdf"}},
            {"source_path": {"$eq": "www/InsuranceAct.pdf"}},
            {"source": {"$eq": absolute}},
            {"source_path": {"$eq": absolute}},
        ]
        for f in candidates:
            index.delete(filter=f, namespace="", delete_all=False)
        print("Requested deletion of old InsuranceAct.pdf vectors in default namespace (if any).")
    except Exception as e:
        raise SystemExit(f"ERROR deleting old vectors: {e}")

    # Now ingest the new document under a namespace
    ns = os.environ.get("INDEX_NAMESPACE", "insurance-act")
    print(f"Re-ingesting documents into namespace='{ns}'...")
    from ingestion.cli import ingest

    patterns = [
        "data/documents/**/*.pdf",
        "data/documents/**/*.txt",
        "data/documents/**/*.md",
    ]
    created, upserted = ingest(patterns=patterns, namespace=ns)
    print(f"Done. Created {created} chunks; upserted {upserted} unique chunks to Pinecone in namespace='{ns}'.")


if __name__ == "__main__":
    main()
