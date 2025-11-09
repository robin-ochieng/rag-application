type Citation = {
  docId: string;
  title: string;
  url: string;
  page?: string | number;
  section?: string;
  score?: number;
  sourceType: "InsuranceAct" | "IFRS17" | "InternalDoc" | "Web";
};

type SourceMetadataValue = string | number | boolean | null | undefined;

interface SourceMetadata {
  title?: string;
  document_title?: string;
  file_name?: string;
  source?: string;
  url?: string;
  source_url?: string;
  file_path?: string;
  page?: string | number;
  page_number?: string | number;
  section?: string;
  chunk_id?: string;
  score?: number | string;
  doc_id?: string;
  [key: string]: SourceMetadataValue;
}

interface SourceLike {
  metadata?: SourceMetadata;
  score?: number | string;
}

/**
 * Normalizes raw citations by:
 * - Filtering out items without required fields (title, url)
 * - Deduplicating by docId/url (keeping highest scored/most specific)
 * - Sorting by score descending
 * - Limiting to specified count
 */
export function normalizeCitations(raw: Citation[], limit = 4): Citation[] {
  const seen = new Map<string, Citation>();
  
  for (const c of raw) {
    // Skip citations without required fields
    if (!c?.title || !c?.url) continue;
    
    // Use docId as primary key, fall back to url
    const key = c.docId ?? c.url;
    const existing = seen.get(key);
    
    // Determine if this citation is better than existing
    const isBetter = !existing
      || (Number(c.score ?? 0) > Number(existing.score ?? 0))
      || (!!(c.page || c.section) && !(existing.page || existing.section));
    
    if (isBetter) {
      seen.set(key, c);
    }
  }
  
  return Array.from(seen.values())
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
    .slice(0, limit);
}

/**
 * Converts backend sources to Citation format
 */
export function sourcesToCitations(sources: SourceLike[]): Citation[] {
  if (!Array.isArray(sources)) return [];

  const mapped = sources
    .map((source, index): Citation | null => {
      const metadata: SourceMetadata = source.metadata ?? {};
      
      // Extract title from various possible fields
      const rawTitle =
        metadata.title ??
        metadata.document_title ??
        metadata.file_name ??
        metadata.source ??
        `Document ${index + 1}`;
      const title = typeof rawTitle === "string" && rawTitle.trim().length > 0 ? rawTitle : `Document ${index + 1}`;
      
      // Extract URL - create a reasonable URL if missing
      const initialUrl = metadata.url ?? metadata.source_url ?? metadata.file_path;
      let url = typeof initialUrl === "string" && initialUrl.length > 0 ? initialUrl : undefined;
      
      // If no URL, try to construct one based on the source
      if (!url) {
        const fileNameValue = metadata.file_name ?? metadata.source;
        const fileName = typeof fileNameValue === "string" ? fileNameValue : undefined;
        if (fileName) {
          // For PDFs, we could link to a document viewer
          if (fileName.toLowerCase().endsWith(".pdf")) {
            url = `/pdf?file=${encodeURIComponent(fileName)}`;
          } else {
            // Generic document link
            url = `/documents/${encodeURIComponent(fileName)}`;
          }
        }
      }
      
      // Skip if we still don't have a URL
      if (!url) return null;
      
      // Extract additional metadata
      const pageValue = metadata.page ?? metadata.page_number;
      const page =
        typeof pageValue === "number" || (typeof pageValue === "string" && pageValue.length > 0)
          ? pageValue
          : undefined;
      const sectionValue = metadata.section ?? metadata.chunk_id;
      const section = typeof sectionValue === "string" && sectionValue.length > 0 ? sectionValue : undefined;
      const scoreCandidate = source.score ?? metadata.score ?? 1 - index * 0.1;
      const scoreNumber = Number(scoreCandidate);
      const score = Number.isFinite(scoreNumber) ? scoreNumber : 0;
      
      // Determine source type
      let sourceType: Citation["sourceType"] = "InternalDoc";
      const titleLower = title.toLowerCase();
      if (titleLower.includes("insurance act")) {
        sourceType = "InsuranceAct";
      } else if (titleLower.includes("ifrs") || titleLower.includes("ifrs-17")) {
        sourceType = "IFRS17";
      } else if (url.startsWith("http")) {
        sourceType = "Web";
      }
      
      const citation: Citation = {
        docId:
          (typeof metadata.doc_id === "string" && metadata.doc_id.length > 0)
            ? metadata.doc_id
            : (typeof metadata.source === "string" && metadata.source.length > 0)
            ? metadata.source
            : url,
        title: title.trim(),
        url,
        page,
        section,
        score,
        sourceType,
      };
      return citation;
    })
    .filter((citation): citation is Citation => citation !== null);

  return mapped;
}

/**
 * Sanitizes URLs to ensure they're safe
 */
export function sanitizeUrl(url: string): string | null {
  try {
    // Allow relative URLs and absolute HTTP/HTTPS URLs
    if (url.startsWith('/')) {
      return url;
    }
    
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Formats citation display text
 */
export function formatCitationMeta(citation: Citation): string {
  const parts: string[] = [];
  
  if (citation.sourceType === 'InsuranceAct' && citation.section) {
    parts.push(`s. ${citation.section}`);
  } else if (citation.page) {
    parts.push(`p. ${citation.page}`);
  } else if (citation.section) {
    parts.push(citation.section);
  }
  
  return parts.join(' • ');
}