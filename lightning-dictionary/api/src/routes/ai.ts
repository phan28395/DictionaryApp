import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AIService } from '../services/ai-service';
import { MockAIProvider } from '../services/mock-ai-provider';
import { 
  AIRequest, 
  AIFeature, 
  AIContext,
  AIProviderConfig 
} from '../types/ai-context';
import { optionalAuthenticate } from '../middleware/auth';

const aiService = new AIService();

// Initialize with mock provider by default
(async () => {
  const mockProvider = new MockAIProvider();
  const config: AIProviderConfig = {
    timeout: 5000,
    maxRetries: 2
  };
  await aiService.registerProvider('mock', mockProvider, config);
})();

export async function aiRoutes(server: FastifyInstance) {
  /**
   * GET /api/v1/ai/status
   * Check AI service status
   */
  server.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const isAvailable = aiService.isAvailable();
    const features = aiService.getAvailableFeatures();
    
    return {
      available: isAvailable,
      enabled: isAvailable,
      fallbackMode: false,
      provider: 'mock', // Would be dynamic in production
      features,
      lastError: null
    };
  });

  /**
   * POST /api/v1/ai/enhance
   * Enhance a word definition with AI
   */
  server.post<{
    Body: {
      word: string;
      context?: any;
      features?: any;
      provider?: string;
    };
  }>('/enhance', { preHandler: optionalAuthenticate }, async (request, reply) => {
  try {
    const { word, context, features, provider } = request.body;
    
    if (!word) {
      reply.code(400);
      return { error: 'Word is required' };
    }

    // Build AI context
    const aiContext: AIContext = {
      word,
      sentence: context?.surroundingSentence,
      paragraph: context?.selectedText,
      documentContext: context?.documentTitle,
      userHistory: context?.previousLookups || [],
      language: 'en',
      domain: context?.domain
    };

    // Determine which feature to use based on enabled features
    let feature = AIFeature.CONTEXT_DEFINITION;
    if (features?.smartSummaries) {
      feature = AIFeature.SMART_SUMMARY;
    } else if (features?.etymologyInsights) {
      feature = AIFeature.ETYMOLOGY;
    } else if (features?.difficultyAssessment) {
      feature = AIFeature.DIFFICULTY_LEVEL;
    }

    // Create AI request
    const aiRequest: AIRequest = {
      context: aiContext,
      feature,
      options: {
        model: provider === 'openai' ? 'gpt-4' : 'default',
        temperature: 0.7,
        maxTokens: 150
      }
    };

    // Process with AI service
    const response = await aiService.process(aiRequest);

    // Format enhancement based on response
    const enhancement = {
      word,
      contextualMeaning: response.result.contextualMeaning || response.result.summary,
      confidence: response.confidence,
      suggestions: response.result.suggestions || [],
      relatedConcepts: response.result.concepts?.map((c: any) => c.word) || [],
      difficultyLevel: response.result.level,
      usageInContext: response.result.examples?.[0] || response.result.usageInContext
    };

    return {
      enhancement,
      status: {
        available: true,
        enabled: true,
        fallbackMode: response.fallback,
        provider: response.provider,
        lastError: response.error?.message
      },
      processingTime: response.processingTime
    };
  } catch (error) {
    console.error('AI enhancement error:', error);
    reply.code(500);
    return { 
      error: { 
        message: 'AI enhancement failed',
        fallbackAvailable: true,
        retryable: true
      }
    };
  }
  });

  /**
   * POST /api/v1/ai/batch-enhance
   * Enhance multiple words with AI
   */
  server.post<{
    Body: {
      words: string[];
      features?: any;
    };
  }>('/batch-enhance', { preHandler: optionalAuthenticate }, async (request, reply) => {
  try {
    const { words, features } = request.body;
    
    if (!Array.isArray(words) || words.length === 0) {
      reply.code(400);
      return { error: 'Words array is required' };
    }

    if (words.length > 10) {
      reply.code(400);
      return { error: 'Maximum 10 words per batch' };
    }

    const enhancements = await Promise.all(
      words.map(async (word) => {
        try {
          const aiRequest: AIRequest = {
            context: {
              word,
              language: 'en'
            },
            feature: features?.difficultyAssessment 
              ? AIFeature.DIFFICULTY_LEVEL 
              : AIFeature.SMART_SUMMARY,
            options: {
              temperature: 0.5,
              maxTokens: 100
            }
          };

          const response = await aiService.process(aiRequest);
          
          return {
            word,
            success: true,
            data: response.result
          };
        } catch (error) {
          return {
            word,
            success: false,
            error: 'Enhancement failed'
          };
        }
      })
    );

    return { enhancements };
  } catch (error) {
    console.error('Batch enhancement error:', error);
    reply.code(500);
    return { 
      error: { 
        message: 'Batch enhancement failed',
        fallbackAvailable: true,
        retryable: true
      }
    };
  }
  });

  /**
   * GET /api/v1/ai/metrics
   * Get AI service metrics
   */
  server.get('/metrics', { preHandler: optionalAuthenticate }, async (request, reply) => {
  const metrics = aiService.getMetrics();
  
  return {
    metrics,
    costEstimate: {
      daily: metrics.costEstimate,
      monthly: metrics.costEstimate * 30,
      perRequest: metrics.totalRequests > 0 
        ? metrics.costEstimate / metrics.totalRequests 
        : 0
    },
    performance: {
      successRate: metrics.totalRequests > 0 
        ? (metrics.successfulRequests / metrics.totalRequests) * 100 
        : 0,
      fallbackRate: metrics.totalRequests > 0 
        ? (metrics.fallbackRequests / metrics.totalRequests) * 100 
        : 0,
      averageResponseTime: metrics.averageResponseTime
    }
  };
  });

  /**
   * POST /api/v1/ai/feedback
   * Submit feedback about AI enhancement quality
   */
  server.post<{
    Body: {
      word: string;
      enhancement: any;
      rating: number;
      comment?: string;
    };
  }>('/feedback', { preHandler: optionalAuthenticate }, async (request, reply) => {
  try {
    const { word, enhancement, rating, comment } = request.body;
    
    // In production, this would store feedback for improving AI responses
    console.log('AI feedback received:', {
      word,
      enhancement,
      rating,
      comment,
      user: (request as any).user?.userId || 'anonymous',
      timestamp: new Date()
    });

    return { 
      message: 'Feedback received. Thank you for helping improve our AI features!',
      feedbackId: Date.now().toString()
    };
  } catch (error) {
    console.error('Feedback submission error:', error);
    reply.code(500);
    return { error: 'Failed to submit feedback' };
  }
  });
}