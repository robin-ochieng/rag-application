import argparse
import glob
import hashlib
import os
from pathlib import Path
from typing import Iterable, List, Tuple

from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

# Prefer modern OpenAI embeddings import, fallback to community if missing
try:
    from langchain_openai import OpenAIEmbeddings
except Exception:  # pragma: no cover
    from langchain_community.embeddings import OpenAIEmbeddings  # type: ignore

from langchain_pinecone import PineconeVectorStore


def _fail(msg: str) -> None:
    raise SystemExit(f"ERROR: {msg}")


def _get_env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        _fail(f"Environment variable '{name}' is required but not set.")
    return v


def _iter_source_files(patterns: List[str]) -> List[Path]:
    files: List[Path] = []
    seen = set()
    for pat in patterns:
        for p in glob.glob(pat, recursive=True):
            pp = Path(p)
            if pp.is_file():
                key = str(pp.resolve())
                if key not in seen:
                    seen.add(key)
                    files.append(pp)
    return files


def _load_file(path: Path) -> List[Document]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return PyPDFLoader(str(path)).load()
    elif suffix in {".txt", ".md"}:
        try:
            return TextLoader(str(path), encoding="utf-8").load()
        except UnicodeDecodeError:
            return TextLoader(str(path), encoding="latin1").load()
    else:
        return []


def _normalize_text(t: str) -> str:
    return "\n".join(line.strip() for line in (t or "").splitlines()).strip()


def _hash_chunk(source_rel: str, page: int | None, text: str) -> str:
    h = hashlib.sha1()
    h.update(source_rel.encode("utf-8", errors="ignore"))
    h.update(b"|")
    h.update(str(page if page is not None else "").encode())
    h.update(b"|")
    h.update(text.encode("utf-8", errors="ignore"))
    return h.hexdigest()


def _split_documents(docs: List[Document]) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n", "\n", " ", ""],
    )
    return splitter.split_documents(docs)


def _sanitize_metadata(meta: dict) -> dict:
    clean: dict = {}
    for k, v in (meta or {}).items():
        if v is None:
            continue
        if isinstance(v, (str, int, float, bool)):
            clean[k] = v
        elif isinstance(v, list):
            clean[k] = [str(x) for x in v if x is not None]
        else:
            clean[k] = str(v)
    return clean


def ingest(
    patterns: List[str] | None = None,
    index_env: str = "INDEX_NAME2",
    pinecone_key_env: str = "PINECONE_API_KEY2",
    model: str = "text-embedding-3-large",
    namespace: str | None = None,
) -> Tuple[int, int]:
    """Ingest documents matched by patterns into Pinecone.

    Returns: (chunks_created, chunks_upserted)
    """
    load_dotenv()

    if patterns is None:
        patterns = [
            "data/documents/**/*.pdf",
            "data/documents/**/*.txt",
            "data/documents/**/*.md",
            # Seed existing files if present
            "InsuranceAct.pdf",
            "www/InsuranceAct.pdf",
        ]

    files = _iter_source_files(patterns)
    if not files:
        _fail("No source files found. Add files under data/documents or place InsuranceAct.pdf in the repo root.")

    all_docs: List[Document] = []
    for f in files:
        loaded = _load_file(f)
        if not loaded:
            continue
        # Normalize metadata: include relative source for traceability
        for d in loaded:
            md = dict(d.metadata or {})
            md["source_path"] = str(f)
            md.setdefault("file_name", f.name)
            d.metadata = md
        all_docs.extend(loaded)

    if not all_docs:
        _fail("No documents loaded from the selected files.")

    chunks = _split_documents(all_docs)

    # Build embeddings
    openai_key = _get_env("OPENAI_API_KEY")
    embeddings = OpenAIEmbeddings(openai_api_key=openai_key, model=model)

    # Pinecone settings and dimension check
    index_name = _get_env(index_env)
    pinecone_api_key = _get_env(pinecone_key_env)

    try:
        from pinecone import Pinecone as _PineClient  # type: ignore

        pc = _PineClient(api_key=pinecone_api_key)
        described = pc.describe_index(index_name)
        index_dimension = described.dimension
        test_vec = embeddings.embed_query("dimension probe")
        if len(test_vec) != index_dimension:
            _fail(
                f"Pinecone index '{index_name}' dimension {index_dimension} does not match embeddings {len(test_vec)}."
            )
    except Exception as e:  # pragma: no cover
        _fail(f"Unable to verify Pinecone index '{index_name}': {e}")

    # Deduplicate and produce deterministic IDs
    seen_hashes: set[str] = set()
    unique_chunks: List[Document] = []
    ids: List[str] = []

    repo_root = Path(__file__).resolve().parents[1]
    for i, ch in enumerate(chunks):
        text = _normalize_text(ch.page_content)
        if not text:
            continue
        src = ch.metadata.get("source_path") or ch.metadata.get("source") or "unknown"
        try:
            source_rel = str(Path(src).resolve().relative_to(repo_root))
        except Exception:
            source_rel = src
        page = ch.metadata.get("page")
        digest = _hash_chunk(source_rel, page, text)
        if digest in seen_hashes:
            continue
        seen_hashes.add(digest)

        # enrich metadata for traceability
        meta = dict(ch.metadata or {})
        meta.update({
            "source": source_rel,
            "sha1": digest,
        })
        # Only include page if it is an int
        if isinstance(page, int):
            meta["page"] = page
        ch.metadata = _sanitize_metadata(meta)

        unique_chunks.append(ch)
        ids.append(digest[:32])  # deterministic, Pinecone-safe length

    if not unique_chunks:
        _fail("All chunks were empty or duplicates; nothing to upsert.")

    # Upsert using LangChain PineconeVectorStore
    try:
        store = PineconeVectorStore(index_name=index_name, embedding=embeddings, namespace=namespace)
        store.add_documents(unique_chunks, ids=ids)
    except Exception as e:  # pragma: no cover
        _fail(f"Error upserting to Pinecone: {e}")

    return (len(chunks), len(unique_chunks))


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest documents into Pinecone from data/documents.")
    parser.add_argument(
        "--pattern",
        action="append",
        help="Glob pattern(s) to include. Defaults to data/documents/**/* plus InsuranceAct.pdf if present.",
    )
    parser.add_argument(
        "--namespace",
        default=os.getenv("INDEX_NAMESPACE", "insurance-act"),
        help="Pinecone namespace to use for upserts (default: env INDEX_NAMESPACE or 'insurance-act').",
    )
    args = parser.parse_args()

    patterns = args.pattern if args.pattern else None
    created, upserted = ingest(patterns=patterns, namespace=args.namespace)
    print(f"Created {created} chunks; upserted {upserted} unique chunks to Pinecone (namespace='{args.namespace}').")


if __name__ == "__main__":
    main()
