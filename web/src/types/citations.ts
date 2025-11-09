export type SourceMetadataValue = string | number | boolean | null | undefined;

export interface SourceMetadata {
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
  [key: string]: SourceMetadataValue;
}

export interface Source {
  snippet?: string;
  metadata?: SourceMetadata;
  score?: number;
}

export interface Citation {
  docId: string;
  title: string;
  url: string;
  page?: number | string;
  section?: string;
  score?: number;
  sourceType?: "InsuranceAct" | "IFRS17" | "InternalDoc" | "Web";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  time: string;
  sources?: Source[];
  citations?: Citation[];
  followUps?: string[];
  error?: string;
}