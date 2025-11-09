"""Selective PDF ingestion script.

Ingests PDFs one by one, checking if they're already present and skipping if so.
Creates or updates the manifest after each successful ingestion.

Usage:
    python scripts/selective_ingest.py --namespace ifrs-17 --file "data/ifrs-17/IFRS-17-a-simplified-approach.pdf"
    python scripts/selective_ingest.py --namespace ifrs-17 --directory "data/ifrs-17" [--force]
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path
from typing import List, Set

from dotenv import load_dotenv
load_dotenv()

from scripts.audit_namespace import sample_namespace
from langchain_openai import OpenAIEmbeddings


def get_existing_files_in_namespace(namespace: str) -> Set[str]:
    """Get list of files already present in the namespace."""
    try:
        embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        observed = sample_namespace(namespace, embeddings, top_k=50)
        existing_files = set()
        for md in observed:
            fn = md.get("file_name") or "unknown"
            if fn != "unknown":
                existing_files.add(fn)
        return existing_files
    except Exception as e:
        print(f"Warning: Could not check existing files in namespace: {e}")
        return set()


def ingest_single_file(file_path: Path, namespace: str) -> bool:
    """Ingest a single PDF file into the specified namespace."""
    try:
        # Call ingestion CLI as subprocess
        cmd = [
            sys.executable, "-m", "ingestion.cli",
            "--namespace", namespace,
            "--pattern", str(file_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=Path(__file__).parent.parent)
        
        if result.returncode == 0:
            # Parse output to get chunk counts
            output = result.stdout
            if "upserted" in output and "chunks" in output:
                print(f"✓ {file_path.name}: {output.strip().split('Created')[1] if 'Created' in output else 'Ingested successfully'}")
            else:
                print(f"✓ {file_path.name}: Ingested successfully")
            return True
        else:
            print(f"✗ {file_path.name}: Failed to ingest")
            if result.stderr:
                print(f"    Error: {result.stderr.strip()}")
            return False
            
    except Exception as e:
        print(f"✗ {file_path.name}: Failed to ingest - {e}")
        return False


def ingest_directory_selective(directory: Path, namespace: str, force: bool = False) -> None:
    """Ingest all PDFs in directory, skipping those already present unless force=True."""
    pdf_files = list(directory.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {directory}")
        return
    
    print(f"Found {len(pdf_files)} PDF files in {directory}")
    
    if not force:
        existing_files = get_existing_files_in_namespace(namespace)
        print(f"Found {len(existing_files)} files already in namespace: {namespace}")
        
        if existing_files:
            print("Already present files:")
            for fn in sorted(existing_files):
                print(f"  - {fn}")
    else:
        existing_files = set()
        print("Force mode: will attempt to ingest all files regardless of existing content")
    
    success_count = 0
    skip_count = 0
    
    for pdf_file in sorted(pdf_files):
        if not force and pdf_file.name in existing_files:
            print(f"⏭️  {pdf_file.name}: Already present, skipping")
            skip_count += 1
            continue
        
        print(f"\n📄 Processing: {pdf_file.name}")
        if ingest_single_file(pdf_file, namespace):
            success_count += 1
    
    print(f"\n📊 Summary:")
    print(f"  ✓ Successfully ingested: {success_count}")
    print(f"  ⏭️  Skipped (already present): {skip_count}")
    print(f"  📁 Total files: {len(pdf_files)}")


def main():
    parser = argparse.ArgumentParser(description="Selective PDF ingestion")
    parser.add_argument("--namespace", required=True, help="Pinecone namespace")
    
    # Either specify a single file or a directory
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--file", help="Single PDF file to ingest")
    group.add_argument("--directory", help="Directory containing PDF files to ingest")
    
    parser.add_argument("--force", action="store_true", 
                       help="Force ingestion even if files appear to be already present")
    
    args = parser.parse_args()
    
    load_dotenv()
    
    # Verify required environment variables
    required_vars = ["OPENAI_API_KEY", "PINECONE_API_KEY2", "INDEX_NAME2"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print(f"ERROR: Missing required environment variables: {', '.join(missing_vars)}")
        sys.exit(1)
    
    if args.file:
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"ERROR: File not found: {file_path}")
            sys.exit(1)
        
        if not args.force:
            existing_files = get_existing_files_in_namespace(args.namespace)
            if file_path.name in existing_files:
                print(f"File {file_path.name} already exists in namespace {args.namespace}")
                print("Use --force to ingest anyway")
                return
        
        print(f"Ingesting single file: {file_path}")
        success = ingest_single_file(file_path, args.namespace)
        sys.exit(0 if success else 1)
    
    elif args.directory:
        dir_path = Path(args.directory)
        if not dir_path.exists() or not dir_path.is_dir():
            print(f"ERROR: Directory not found: {dir_path}")
            sys.exit(1)
        
        print(f"Ingesting PDFs from directory: {dir_path}")
        ingest_directory_selective(dir_path, args.namespace, args.force)


if __name__ == "__main__":
    main()