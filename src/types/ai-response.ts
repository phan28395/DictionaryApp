/**
 * Frontend AI Response Types
 */

export interface AIEnhancedDefinition {
  word: string;
  contextualMeaning?: string;
  confidence?: number;
  suggestions?: string[];
  relatedConcepts?: string[];
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  usageInContext?: string;
}

export interface AIFeatureStatus {
  available: boolean;
  enabled: boolean;
  fallbackMode: boolean;
  lastError?: string;
  provider?: string;
}

export interface AISettings {
  enabled: boolean;
  features: {
    contextualDefinitions: boolean;
    smartSummaries: boolean;
    etymologyInsights: boolean;
    difficultyAssessment: boolean;
    usageExamples: boolean;
  };
  preferredProvider?: string;
  apiKey?: string;
  useFallback: boolean;
  cacheResults: boolean;
  maxCostPerMonth?: number;
}

export interface AIContextData {
  selectedText?: string;
  surroundingSentence?: string;
  documentTitle?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  previousLookups?: string[];
}