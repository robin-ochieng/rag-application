import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore


def delete_by_namespace(index_name: str, namespace: str) -> None:
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large", openai_api_key=os.getenv("OPENAI_API_KEY"))
    store = PineconeVectorStore(index_name=index_name, embedding=embeddings)
    index = store._index  # type: ignore[attr-defined]
    index.delete(delete_all=True, namespace=namespace)
    print(f"Deleted all vectors in namespace='{namespace}'.")


def delete_by_file(index_name: str, file_path: str, namespace: str | None = None) -> None:
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large", openai_api_key=os.getenv("OPENAI_API_KEY"))
    store = PineconeVectorStore(index_name=index_name, embedding=embeddings, namespace=namespace)
    index = store._index  # type: ignore[attr-defined]

    repo_root = Path(__file__).resolve().parents[1]
    abs_path = str((repo_root / file_path).resolve())

    filters = [
        {"source": {"$eq": file_path}},
        {"source_path": {"$eq": file_path}},
        {"source": {"$eq": abs_path}},
        {"source_path": {"$eq": abs_path}},
    ]
    for f in filters:
        index.delete(filter=f, namespace=namespace or "", delete_all=False)
    print(f"Requested deletion for file='{file_path}' in namespace='{namespace or ''}'.")


def main() -> None:
    load_dotenv()
    index_name = os.getenv("INDEX_NAME2")
    pinecone_key = os.getenv("PINECONE_API_KEY2")
    if not index_name or not pinecone_key:
        raise SystemExit("ERROR: INDEX_NAME2 and PINECONE_API_KEY2 must be set.")

    p = argparse.ArgumentParser(description="Cleanup Pinecone vectors by namespace or file")
    sub = p.add_subparsers(dest="cmd", required=True)

    ns = sub.add_parser("namespace", help="Delete all vectors in a namespace")
    ns.add_argument("name", help="Namespace to delete")

    df = sub.add_parser("file", help="Delete vectors by file path metadata")
    df.add_argument("path", help="Relative file path e.g. data/documents/YourDoc.pdf")
    df.add_argument("--namespace", default=None, help="Namespace to target (default: empty)")

    args = p.parse_args()
    if args.cmd == "namespace":
        delete_by_namespace(index_name, args.name)
    elif args.cmd == "file":
        delete_by_file(index_name, args.path, args.namespace)


if __name__ == "__main__":
    main()
