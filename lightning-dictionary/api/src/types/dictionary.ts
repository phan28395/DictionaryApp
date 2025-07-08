export interface WordDefinition {
  rank: number;
  pos: string;
  frequency: number;
  definitions: string[];
  pronunciation?: string;
  examples?: string[];
}

export interface DictionaryData {
  metadata: {
    version: string;
    wordCount: number;
    lastUpdated: string;
  };
  words: Record<string, WordDefinition>;
}

export interface SearchResult {
  word: string;
  rank: number;
  pos: string;
  frequency: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}