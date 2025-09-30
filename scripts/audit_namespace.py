"""Audit Pinecone namespace contents.

Usage:
  python scripts/audit_namespace.py --namespace ifrs-17 [--expect-pattern "data/ifrs-17/*.pdf"] [--limit 10000]

What it does:
  1. Loads .env for keys.
  2. Attempts to load previously generated manifest (data/_manifests/<namespace>.json) if present.
  3. Performs similarity sweeps using a set of probe queries to colleare we using fct unique (file_name, sha1) pairs.
     NOTE: Free Pinecone plans may not expose direct index scans; this heuristic approach samples.
  4. Builds a summary of observed files + counts vs manifest + filesystem expectation.
  5. Exits with non-zero code if any expected file is completely missing (no observed chunks and not listed in manifest).

Limitations:
  - Without index listing API access, we approximate by multiple broad queries.
  - For a definitive count you would need Pinecone's describe stats or a dedicated metadata filter scan.
"""
from __future__ import annotations

import argparse
import glob
import os
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, Set

from dotenv import load_dotenv
from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings

PROBE_QUERIES = [
    "IFRS 17 overview",
    "contract measurement approach",
    "CSM calculation",
    "loss component LRC LIC",
    "digital training module IFRS 17",
    "insurance act regulation"  # include legacy domain to keep embedding stable
]


def load_manifest(ns: str) -> dict | None:
    path = Path("data/_manifests") / f"{ns}.json"
    if path.is_file():
        import json
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return None
    return None


def expected_files_from_pattern(pattern: str | None) -> Set[str]:
    if not pattern:
        return set()
    out: Set[str] = set()
    for p in glob.glob(pattern):
        if os.path.isfile(p):
            out.add(Path(p).name)
    return out


def embed(texts, embeddings):
    if isinstance(texts, str):
        texts = [texts]
    return [embeddings.embed_query(t) for t in texts]


def sample_namespace(ns: str, embeddings, top_k: int = 25):
    api_key = os.getenv("PINECONE_API_KEY") or os.getenv("PINECONE_API_KEY2")
    index_name = os.getenv("INDEX_NAME2")
    if not api_key or not index_name:
        print("Missing Pinecone env vars.")
        return []
    pc = Pinecone(api_key=api_key)
    index = pc.Index(index_name)
    seen = {}
    for q in PROBE_QUERIES:
        vec = embeddings.embed_query(q)
        try:
            res = index.query(vector=vec, top_k=top_k, include_metadata=True, namespace=ns)
        except Exception as e:  # pragma: no cover
            print(f"[warn] query failed: {e}")
            continue
        for m in res.get("matches", []) or []:
            md = m.get("metadata") or {}
            fn = md.get("file_name") or md.get("source_path") or "unknown"
            sha1 = md.get("sha1")
            key = (fn, sha1)
            if key not in seen:
                seen[key] = md
    return list(seen.values())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--namespace", required=True)
    parser.add_argument("--expect-pattern", help="Glob of expected source PDFs (e.g. data/ifrs-17/*.pdf)")
    parser.add_argument("--top-k", type=int, default=25, help="Top_k per probe query")
    args = parser.parse_args()

    load_dotenv()

    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

    manifest = load_manifest(args.namespace)
    manifest_files = {f["file_name"] for f in (manifest.get("files") if manifest else [])}

    observed = sample_namespace(args.namespace, embeddings, top_k=args.top_k)
    observed_counts: Dict[str, int] = defaultdict(int)
    for md in observed:
        fn = md.get("file_name") or "unknown"
        observed_counts[fn] += 1

    expected = expected_files_from_pattern(args.expect_pattern)
    union_expected = expected or manifest_files

    missing = [f for f in sorted(union_expected) if f not in manifest_files and f not in observed_counts]

    print(f"Namespace: {args.namespace}")
    if manifest:
        print(f"Manifest total_unique_chunks: {manifest.get('total_unique_chunks')}")
    print("Observed file sample counts:")
    for fn, c in sorted(observed_counts.items()):
        print(f"  {fn}: {c} sampled chunks")
    if manifest_files:
        extra = sorted(manifest_files - observed_counts.keys())
        if extra:
            print("Files only in manifest (not seen in sample queries – likely ingested but not surfaced):")
            for fn in extra:
                print("  -", fn)
    if expected:
        print("Expected files from pattern:")
        for fn in sorted(expected):
            mark = "OK" if (fn in manifest_files or fn in observed_counts) else "MISSING"
            print(f"  {fn}: {mark}")

    if missing:
        print("\nERROR: Missing expected files (not in manifest or sample retrieval):")
        for f in missing:
            print("  -", f)
        sys.exit(2)
    else:
        print("\nAudit complete: no hard missing files detected (sampling-based).")


if __name__ == "__main__":
    main()
