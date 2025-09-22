import argparse
import importlib.util
import runpy
from pathlib import Path


def ingest_all(doc_glob: str) -> None:
    # For now, delegate to existing top-level ingestion.py to avoid breaking behavior.
    # Future: replace with modular pipeline under ingestion/.
    script = Path(__file__).resolve().parent.parent / "ingestion.py"
    runpy.run_path(str(script), run_name="__main__")


def main() -> None:
    p = argparse.ArgumentParser(description="Run document ingestion pipeline")
    p.add_argument("--docs", default="data/raw/**/*.pdf", help="Glob of documents to ingest (reserved for modular pipeline)")
    args = p.parse_args()
    ingest_all(args.docs)


if __name__ == "__main__":
    main()
