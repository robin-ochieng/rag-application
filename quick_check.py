"""Quick retrieval sanity check (multi-query aware).

Usage examples:
  python quick_check.py --queries "IFRS 17 simplified approach,CSM calculation" --k 40
  python quick_check.py --k 30

Outputs:
  1. Raw (file, namespace) tuples (deduped) per query merged
  2. Counts per namespace -> per file
  3. IFRS-17 expected file presence summary

Note: Retrieval is relevance-based; absence != not ingested. Use scripts/audit_namespace.py for stronger guarantees.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from typing import List

from rag_core import retrieve_multi

EXPECTED_IFRS17 = {
	"CAS-WorkingPaper_IFRS-17-Primer-12-16-21 1.pdf",
	"IAA_IAN100_31August2021 2.pdf",
	"IFRS-17-a-simplified-approach.pdf",
	"IFRS17 Insurance Contracts 2.pdf",
	"insurance-ifrs17-Unpacking-LRC-LIC-Calculations.pdf",
	"IRA_IFRS 17_Digital Training Module.pdf",
	"KAFS_NBFIRA Presentation - Inception Meeting 0323 (3).pdf",
	"NBFIRA_IFRS 17_Digital Training Module.pdf",
}


def run(queries: List[str], k: int):
	merged = []
	for q in queries:
		docs = retrieve_multi(q, k_total=k)
		for d in docs:
			merged.append((d.metadata.get("file_name"), d.metadata.get("namespace")))

	print(merged)

	counter_by_ns: dict[str, Counter] = defaultdict(Counter)
	for file_name, ns in merged:
		if not file_name or not ns:
			continue
		counter_by_ns[ns][file_name] += 1

	print("\nFile counts per namespace:")
	for ns, ctr in counter_by_ns.items():
		print(f"{ns}: {dict(ctr)}")

	seen_ifrs17 = set(counter_by_ns.get("ifrs-17", {}))
	missing = EXPECTED_IFRS17 - seen_ifrs17
	if missing:
		print("\nIFRS-17 files NOT surfaced in these queries (may still exist in index):")
		for m in sorted(missing):
			print(" -", m)
	else:
		print("\nAll expected IFRS-17 files surfaced at least once in these queries.")

	print("\nTip: Increase --k or broaden queries to surface more files; use scripts/audit_namespace.py for ingestion audit.")


def main():
	parser = argparse.ArgumentParser()
	parser.add_argument("--queries", default="IFRS 17 simplified approach", help="Comma separated queries")
	parser.add_argument("--k", type=int, default=12, help="Total k per query across namespaces")
	args = parser.parse_args()
	queries = [q.strip() for q in args.queries.split(",") if q.strip()]
	run(queries, args.k)


if __name__ == "__main__":
	main()