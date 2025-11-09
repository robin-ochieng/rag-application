"""Clean up duplicate vectors in a Pinecone namespace.

This script identifies and removes duplicate vectors based on SHA1 hash in metadata.
Since ingestion uses deterministic IDs based on content hash, true duplicates
should be rare, but this handles edge cases from multiple ingestion runs.

Usage:
    python scripts/cleanup_duplicates.py --namespace ifrs-17 [--dry-run]
"""

import argparse
import os
from collections import defaultdict
from typing import Dict, List, Set

from dotenv import load_dotenv
from pinecone import Pinecone


def get_all_vectors_metadata(namespace: str, api_key: str, index_name: str) -> List[Dict]:
    """Fetch all vector metadata from a namespace using list_paginated."""
    pc = Pinecone(api_key=api_key)
    index = pc.Index(index_name)
    
    all_vectors = []
    try:
        # Use list with pagination to get all vectors
        results = index.list(namespace=namespace)
        vector_ids = results.get('vectors', [])
        
        if vector_ids:
            # Fetch metadata for all vectors
            fetch_response = index.fetch(ids=vector_ids, namespace=namespace)
            for vector_id, vector_data in fetch_response.get('vectors', {}).items():
                metadata = vector_data.get('metadata', {})
                metadata['id'] = vector_id
                all_vectors.append(metadata)
                
    except Exception as e:
        print(f"Error fetching vectors: {e}")
        # Fallback: try query-based sampling
        print("Falling back to query-based sampling...")
        from langchain_openai import OpenAIEmbeddings
        embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        
        probe_queries = [
            "IFRS 17 overview", "contract measurement", "CSM calculation", 
            "loss component", "digital training", "simplified approach"
        ]
        
        seen_ids = set()
        for query in probe_queries:
            vec = embeddings.embed_query(query)
            try:
                res = index.query(vector=vec, top_k=100, include_metadata=True, namespace=namespace)
                for match in res.get('matches', []):
                    if match['id'] not in seen_ids:
                        metadata = match.get('metadata', {})
                        metadata['id'] = match['id']
                        all_vectors.append(metadata)
                        seen_ids.add(match['id'])
            except Exception as query_e:
                print(f"Query failed: {query_e}")
                
    return all_vectors


def find_duplicates(vectors_metadata: List[Dict]) -> Dict[str, List[str]]:
    """Group vectors by SHA1 hash to find duplicates."""
    hash_to_ids: Dict[str, List[str]] = defaultdict(list)
    
    for metadata in vectors_metadata:
        sha1 = metadata.get('sha1')
        vector_id = metadata.get('id')
        if sha1 and vector_id:
            hash_to_ids[sha1].append(vector_id)
    
    # Return only groups with more than one vector (duplicates)
    duplicates = {sha1: ids for sha1, ids in hash_to_ids.items() if len(ids) > 1}
    return duplicates


def cleanup_duplicates(namespace: str, duplicates: Dict[str, List[str]], 
                      api_key: str, index_name: str, dry_run: bool = True):
    """Remove duplicate vectors, keeping only the first one in each group."""
    pc = Pinecone(api_key=api_key)
    index = pc.Index(index_name)
    
    total_to_delete = 0
    for sha1, ids in duplicates.items():
        to_delete = ids[1:]  # Keep first, delete rest
        total_to_delete += len(to_delete)
        
        print(f"SHA1 {sha1[:16]}...: keeping {ids[0]}, deleting {len(to_delete)} duplicates")
        
        if not dry_run:
            try:
                index.delete(ids=to_delete, namespace=namespace)
                print(f"  ✓ Deleted {len(to_delete)} duplicate vectors")
            except Exception as e:
                print(f"  ✗ Error deleting duplicates: {e}")
    
    if dry_run:
        print(f"\nDRY RUN: Would delete {total_to_delete} duplicate vectors")
    else:
        print(f"\nDeleted {total_to_delete} duplicate vectors")


def main():
    parser = argparse.ArgumentParser(description="Clean up duplicate vectors in Pinecone namespace")
    parser.add_argument("--namespace", required=True, help="Pinecone namespace to clean")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be deleted without actually deleting")
    args = parser.parse_args()
    
    load_dotenv()
    
    api_key = os.getenv("PINECONE_API_KEY") or os.getenv("PINECONE_API_KEY2")
    index_name = os.getenv("INDEX_NAME2")
    
    if not api_key or not index_name:
        print("ERROR: Missing PINECONE_API_KEY/PINECONE_API_KEY2 or INDEX_NAME2 environment variables")
        return
    
    print(f"Analyzing namespace: {args.namespace}")
    vectors_metadata = get_all_vectors_metadata(args.namespace, api_key, index_name)
    print(f"Found {len(vectors_metadata)} total vectors")
    
    if not vectors_metadata:
        print("No vectors found in namespace")
        return
    
    duplicates = find_duplicates(vectors_metadata)
    
    if not duplicates:
        print("No duplicates found!")
        return
    
    print(f"\nFound {len(duplicates)} groups of duplicates:")
    cleanup_duplicates(args.namespace, duplicates, api_key, index_name, args.dry_run)


if __name__ == "__main__":
    main()