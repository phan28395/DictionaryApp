/**
 * Mock AI Provider
 * Simulates AI responses for development and testing
 */

import { 
  AIProvider, 
  AIRequest, 
  AIResponse, 
  AIFeature, 
  AIProviderConfig 
} from '../types/ai-context';

export class MockAIProvider implements AIProvider {
  name = 'mock-ai';
  private config?: AIProviderConfig;
  private available = true;
  private simulateDelay = true;
  private failureRate = 0.1; // 10% failure rate for testing

  async initialize(config: AIProviderConfig): Promise<void> {
    this.config = config;
    console.log('Mock AI Provider initialized');
  }

  async process(request: AIRequest): Promise<AIResponse> {
    // Simulate network delay
    if (this.simulateDelay) {
      await this.delay(Math.random() * 500 + 200); // 200-700ms
    }

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      throw new Error('Mock AI provider simulated failure');
    }

    const startTime = Date.now();
    const result = await this.generateMockResponse(request);

    return {
      feature: request.feature,
      result,
      confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
      fallback: false,
      processingTime: Date.now() - startTime,
      provider: this.name
    };
  }

  private async generateMockResponse(request: AIRequest): Promise<any> {
    const { feature, context } = request;

    switch (feature) {
      case AIFeature.CONTEXT_DEFINITION:
        return {
          contextualMeaning: `In the context of "${context.sentence || 'general usage'}", "${context.word}" means: [Mock contextual definition based on surrounding text]`,
          confidence: 0.9,
          suggestions: [
            'Consider the technical usage in this domain',
            'This word has a specialized meaning here'
          ]
        };

      case AIFeature.SMART_SUMMARY:
        return {
          summary: `${context.word} is commonly used to describe [mock summary]. In your context, it specifically relates to [mock context-specific meaning].`,
          keyPoints: [
            'Primary meaning in this context',
            'Related to surrounding concepts',
            'Technical or specialized usage'
          ]
        };

      case AIFeature.USAGE_EXAMPLES:
        return {
          examples: [
            `The ${context.word} was evident in the results.`,
            `We need to ${context.word} the process for better efficiency.`,
            `This ${context.word} demonstrates the principle clearly.`
          ],
          contextRelevant: true,
          domain: context.domain || 'general'
        };

      case AIFeature.ETYMOLOGY:
        return {
          origin: `Mock etymology: "${context.word}" derives from [mock language] meaning [mock original meaning]`,
          evolution: [
            '1500s: Original meaning in [language]',
            '1800s: Adopted into English',
            'Modern: Current usage established'
          ],
          relatedWords: ['mock-related-1', 'mock-related-2']
        };

      case AIFeature.DIFFICULTY_LEVEL:
        const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
        const level = levels[Math.floor(Math.random() * levels.length)];
        return {
          level,
          reasoning: `This word is classified as ${level} based on frequency and complexity`,
          alternatives: level === 'advanced' || level === 'expert' 
            ? ['simpler-alternative-1', 'simpler-alternative-2']
            : []
        };

      case AIFeature.RELATED_CONCEPTS:
        return {
          concepts: [
            { word: 'mock-concept-1', relevance: 0.9 },
            { word: 'mock-concept-2', relevance: 0.8 },
            { word: 'mock-concept-3', relevance: 0.7 }
          ],
          explanation: 'These concepts are related through semantic similarity'
        };

      case AIFeature.TRANSLATION_CONTEXT:
        return {
          translations: {
            spanish: `[Mock Spanish translation of ${context.word}]`,
            french: `[Mock French translation of ${context.word}]`,
            german: `[Mock German translation of ${context.word}]`
          },
          contextualNotes: 'Translation may vary based on context',
          idiomaticUsage: false
        };

      default:
        return {
          message: `Mock response for ${feature}`,
          data: { word: context.word }
        };
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  getCost(request: AIRequest): number {
    // Mock cost calculation (cents per request)
    const baseCost = 0.1;
    const featureMultipliers: Record<AIFeature, number> = {
      [AIFeature.CONTEXT_DEFINITION]: 1,
      [AIFeature.SMART_SUMMARY]: 1.5,
      [AIFeature.USAGE_EXAMPLES]: 1.2,
      [AIFeature.ETYMOLOGY]: 2,
      [AIFeature.DIFFICULTY_LEVEL]: 0.8,
      [AIFeature.RELATED_CONCEPTS]: 1.3,
      [AIFeature.TRANSLATION_CONTEXT]: 1.5
    };

    return baseCost * (featureMultipliers[request.feature] || 1);
  }

  getCapabilities(): AIFeature[] {
    return Object.values(AIFeature);
  }

  // Helper methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test control methods
  setAvailable(available: boolean) {
    this.available = available;
  }

  setFailureRate(rate: number) {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  setSimulateDelay(simulate: boolean) {
    this.simulateDelay = simulate;
  }
}