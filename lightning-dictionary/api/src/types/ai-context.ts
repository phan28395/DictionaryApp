/**
 * AI Context Types
 * Defines the data structures for AI-enhanced features
 */

export interface AIContext {
  word: string;
  sentence?: string;
  paragraph?: string;
  documentContext?: string;
  userHistory?: string[];
  language: string;
  domain?: string;
}

export interface AIRequest {
  context: AIContext;
  feature: AIFeature;
  options?: AIOptions;
}

export enum AIFeature {
  CONTEXT_DEFINITION = 'context_definition',
  SMART_SUMMARY = 'smart_summary',
  USAGE_EXAMPLES = 'usage_examples',
  ETYMOLOGY = 'etymology',
  DIFFICULTY_LEVEL = 'difficulty_level',
  RELATED_CONCEPTS = 'related_concepts',
  TRANSLATION_CONTEXT = 'translation_context'
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  language?: string;
  style?: 'formal' | 'casual' | 'academic' | 'simple';
}

export interface AIResponse {
  feature: AIFeature;
  result: any;
  confidence?: number;
  fallback: boolean;
  processingTime: number;
  provider: string;
  error?: AIError;
}

export interface AIError {
  code: string;
  message: string;
  fallbackAvailable: boolean;
  retryable: boolean;
}

export interface AIProvider {
  name: string;
  initialize(config: AIProviderConfig): Promise<void>;
  process(request: AIRequest): Promise<AIResponse>;
  isAvailable(): boolean;
  getCost(request: AIRequest): number;
  getCapabilities(): AIFeature[];
}

export interface AIProviderConfig {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  maxRetries?: number;
  rateLimitPerMinute?: number;
}

export interface AIMetrics {
  totalRequests: number;
  successfulRequests: number;
  fallbackRequests: number;
  averageResponseTime: number;
  costEstimate: number;
  errorRate: number;
  featureUsage: Record<AIFeature, number>;
}