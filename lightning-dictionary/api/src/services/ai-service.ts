/**
 * AI Service
 * Manages AI providers and routes requests with fallback support
 */

import { 
  AIProvider, 
  AIRequest, 
  AIResponse, 
  AIFeature, 
  AIProviderConfig,
  AIMetrics,
  AIError
} from '../types/ai-context';

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private primaryProvider?: string;
  private metrics: AIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    fallbackRequests: 0,
    averageResponseTime: 0,
    costEstimate: 0,
    errorRate: 0,
    featureUsage: {} as Record<AIFeature, number>
  };

  constructor() {
    // Initialize with available providers
  }

  /**
   * Register an AI provider
   */
  async registerProvider(name: string, provider: AIProvider, config: AIProviderConfig) {
    await provider.initialize(config);
    this.providers.set(name, provider);
    
    if (!this.primaryProvider) {
      this.primaryProvider = name;
    }
  }

  /**
   * Process an AI request with automatic fallback
   */
  async process(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    // Update feature usage metrics
    this.metrics.featureUsage[request.feature] = 
      (this.metrics.featureUsage[request.feature] || 0) + 1;

    // Try primary provider first
    if (this.primaryProvider) {
      const provider = this.providers.get(this.primaryProvider);
      if (provider && provider.isAvailable()) {
        try {
          const response = await provider.process(request);
          this.updateMetrics(startTime, true, false);
          return response;
        } catch (error) {
          console.error(`Primary provider ${this.primaryProvider} failed:`, error);
        }
      }
    }

    // Fallback to other providers
    for (const [name, provider] of this.providers) {
      if (name !== this.primaryProvider && provider.isAvailable()) {
        try {
          const response = await provider.process(request);
          this.updateMetrics(startTime, true, true);
          return { ...response, fallback: true };
        } catch (error) {
          console.error(`Fallback provider ${name} failed:`, error);
        }
      }
    }

    // All providers failed - return fallback response
    this.updateMetrics(startTime, false, true);
    return this.getFallbackResponse(request, startTime);
  }

  /**
   * Get fallback response when all AI providers fail
   */
  private getFallbackResponse(request: AIRequest, startTime: number): AIResponse {
    const processingTime = Date.now() - startTime;
    
    const fallbackResults: Record<AIFeature, any> = {
      [AIFeature.CONTEXT_DEFINITION]: {
        message: "AI-enhanced definition unavailable. Showing standard definition.",
        useStandard: true
      },
      [AIFeature.SMART_SUMMARY]: {
        message: "Summary generation unavailable",
        useStandard: true
      },
      [AIFeature.USAGE_EXAMPLES]: {
        examples: ["AI examples unavailable. Please try again later."]
      },
      [AIFeature.ETYMOLOGY]: {
        message: "Etymology insights unavailable"
      },
      [AIFeature.DIFFICULTY_LEVEL]: {
        level: "unknown",
        message: "Unable to assess difficulty"
      },
      [AIFeature.RELATED_CONCEPTS]: {
        concepts: []
      },
      [AIFeature.TRANSLATION_CONTEXT]: {
        message: "Contextual translation unavailable"
      }
    };

    return {
      feature: request.feature,
      result: fallbackResults[request.feature],
      fallback: true,
      processingTime,
      provider: 'fallback',
      error: {
        code: 'ALL_PROVIDERS_FAILED',
        message: 'All AI providers are currently unavailable',
        fallbackAvailable: true,
        retryable: true
      }
    };
  }

  /**
   * Update service metrics
   */
  private updateMetrics(startTime: number, success: boolean, fallback: boolean) {
    const responseTime = Date.now() - startTime;
    
    if (success) {
      this.metrics.successfulRequests++;
    }
    
    if (fallback) {
      this.metrics.fallbackRequests++;
    }

    // Update average response time
    const totalRequests = this.metrics.totalRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;

    // Update error rate
    this.metrics.errorRate = 
      (this.metrics.totalRequests - this.metrics.successfulRequests) / this.metrics.totalRequests;
  }

  /**
   * Get current metrics
   */
  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if AI features are available
   */
  isAvailable(): boolean {
    for (const provider of this.providers.values()) {
      if (provider.isAvailable()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get available features across all providers
   */
  getAvailableFeatures(): AIFeature[] {
    const features = new Set<AIFeature>();
    
    for (const provider of this.providers.values()) {
      if (provider.isAvailable()) {
        provider.getCapabilities().forEach(f => features.add(f));
      }
    }
    
    return Array.from(features);
  }

  /**
   * Estimate cost for a request
   */
  estimateCost(request: AIRequest): number {
    if (this.primaryProvider) {
      const provider = this.providers.get(this.primaryProvider);
      if (provider) {
        return provider.getCost(request);
      }
    }
    return 0;
  }
}