export interface Citation {
  docId: string;
  title: string;
  url: string;
  page?: number | string;
  section?: string;
  score?: number;
  sourceType?: "InsuranceAct" | "IFRS17" | "InternalDoc" | "Web";
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
  sources?: { snippet?: string; metadata?: Record<string, any> }[];
  citations?: Citation[];
  followUps?: string[];
  error?: string;
}