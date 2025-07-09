import { FastifyInstance } from 'fastify';
import { getDefinition, searchWords, getDictionaryStats, getEnhancedDefinition, getMultipleDefinitions, detectCircularReferences } from '../services/dictionary';
import { ApiResponse, WordDefinition, SearchResult } from '../types/dictionary';
import { MultiDefinitionResponse, EnhancedWordDefinition } from '../types/enhanced-dictionary';
import { config } from '../config';
import { authRoutes } from './auth';
import { historyRoutes } from './history';
import { optionalAuthenticate } from '../middleware/auth';
import { authService } from '../services/auth';
import cacheManager from '../utils/cache-manager';
import { connectionPool } from '../database/db';

export async function defineRoutes(server: FastifyInstance) {
  // Register auth routes
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  
  // Register history routes
  await server.register(historyRoutes, { prefix: '/api/v1' });
  
  // Health check endpoint
  server.get('/health', async () => {
    const stats = getDictionaryStats();
    return {
      status: 'ok',
      timestamp: Date.now(),
      dictionary: {
        loaded: stats.totalWords > 0,
        wordCount: stats.totalWords,
      },
    };
  });

  // Get word definition (for backward compatibility)
  server.get<{
    Params: { word: string };
  }>('/api/v1/define/:word', async (request, reply) => {
    const { word } = request.params;
    
    if (!word || word.trim().length === 0) {
      reply.code(400);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Word parameter is required',
        timestamp: Date.now(),
      };
      return response;
    }

    const definition = await getDefinition(word);
    
    if (!definition) {
      reply.code(404);
      const response: ApiResponse<null> = {
        success: false,
        error: `Word '${word}' not found`,
        timestamp: Date.now(),
      };
      return response;
    }

    // Set cache headers for performance
    reply.headers({
      'Cache-Control': `public, max-age=${config.cache.maxAge}, s-maxage=${config.cache.sMaxAge}`,
      'ETag': `"${word}-${definition.rank}"`,
    });

    const response: ApiResponse<WordDefinition> = {
      success: true,
      data: definition,
      timestamp: Date.now(),
    };

    return response;
  });

  // Search words
  server.get<{
    Querystring: { q: string };
  }>('/api/v1/search', async (request, reply) => {
    const { q: query } = request.query;

    if (!query || query.trim().length < config.search.minQueryLength) {
      reply.code(400);
      const response: ApiResponse<null> = {
        success: false,
        error: `Query must be at least ${config.search.minQueryLength} characters`,
        timestamp: Date.now(),
      };
      return response;
    }

    const results = await searchWords(query);

    // Set cache headers (shorter for search results)
    reply.headers({
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    });

    const response: ApiResponse<SearchResult[]> = {
      success: true,
      data: results,
      timestamp: Date.now(),
    };

    return response;
  });

  // Get dictionary statistics
  server.get('/api/v1/stats', async (_request, reply) => {
    const stats = getDictionaryStats();
    
    reply.headers({
      'Cache-Control': 'public, max-age=3600',
    });

    return {
      success: true,
      data: stats,
      timestamp: Date.now(),
    };
  });

  // Dictionary lookup endpoint with history tracking
  server.get<{
    Params: { word: string };
  }>('/api/v1/dictionary/lookup/:word', { preHandler: optionalAuthenticate }, async (request, reply) => {
    const { word } = request.params;
    
    if (!word || word.trim().length === 0) {
      reply.code(400);
      return {
        success: false,
        error: 'Word parameter is required',
        timestamp: Date.now(),
      };
    }

    const definition = await getDefinition(word);
    
    if (!definition) {
      reply.code(404);
      return {
        success: false,
        error: `Word '${word}' not found`,
        timestamp: Date.now(),
      };
    }

    // Track user history if authenticated and header is set
    if (request.user && request.headers['x-track-history'] === 'true') {
      try {
        await authService.addToHistory(request.user.userId, word);
      } catch (error) {
        request.log.error('Failed to track user history:', error);
      }
    }

    return {
      success: true,
      data: definition,
      timestamp: Date.now(),
    };
  });

  // Enhanced definition endpoint with multi-definition support
  server.get<{
    Params: { word: string };
  }>('/api/v1/define/enhanced/:word', { preHandler: optionalAuthenticate }, async (request, reply) => {
    const { word } = request.params;
    
    if (!word || word.trim().length === 0) {
      reply.code(400);
      const response: MultiDefinitionResponse = {
        success: false,
        error: 'Word parameter is required',
        cached: false,
        timestamp: Date.now(),
      };
      return response;
    }

    const enhancedDef = await getEnhancedDefinition(word);
    
    if (!enhancedDef) {
      reply.code(404);
      const response: MultiDefinitionResponse = {
        success: false,
        error: `Word '${word}' not found`,
        cached: false,
        timestamp: Date.now(),
      };
      return response;
    }
    
    // Track user history if authenticated
    if (request.user) {
      try {
        await authService.addToHistory(request.user.userId, word);
      } catch (error) {
        // Log error but don't fail the request
        request.log.error('Failed to track user history:', error);
      }
    }

    // Set cache headers for performance
    reply.headers({
      'Cache-Control': `public, max-age=${config.cache.maxAge}, s-maxage=${config.cache.sMaxAge}`,
      'ETag': `"${word}-enhanced-${enhancedDef.rank}"`,
    });

    const response: MultiDefinitionResponse = {
      success: true,
      data: enhancedDef,
      cached: false,
      timestamp: Date.now(),
    };

    return response;
  });

  // Batch definition endpoint for prefetching
  server.post<{
    Body: { words: string[] };
  }>('/api/v1/define/batch', async (request, reply) => {
    const { words } = request.body;
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      reply.code(400);
      return {
        success: false,
        error: 'Words array is required',
        timestamp: Date.now(),
      };
    }

    // Limit batch size
    const limitedWords = words.slice(0, 50);
    const definitions = await getMultipleDefinitions(limitedWords);

    // Set cache headers
    reply.headers({
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    });

    return {
      success: true,
      data: definitions,
      requested: limitedWords.length,
      found: Object.keys(definitions).length,
      timestamp: Date.now(),
    };
  });

  // Check circular references
  server.get<{
    Params: { word: string };
    Querystring: { maxDepth?: string };
  }>('/api/v1/circular-check/:word', async (request, reply) => {
    const { word } = request.params;
    const maxDepth = parseInt(request.query.maxDepth || '5', 10);
    
    if (!word || word.trim().length === 0) {
      reply.code(400);
      return {
        success: false,
        error: 'Word parameter is required',
        timestamp: Date.now(),
      };
    }

    const circularRefs = await detectCircularReferences(word, maxDepth);
    
    return {
      success: true,
      data: {
        word,
        hasCircularReferences: circularRefs.length > 0,
        circularPaths: circularRefs,
        maxDepthChecked: maxDepth,
      },
      timestamp: Date.now(),
    };
  });

  // Performance monitoring endpoint
  server.get('/api/v1/performance/stats', async (_request, reply) => {
    const cacheInfo = cacheManager.getCacheInfo();
    const poolStats = await connectionPool.getPoolStats();
    const dictStats = getDictionaryStats();
    
    return {
      success: true,
      data: {
        cache: cacheInfo,
        database: poolStats,
        dictionary: dictStats,
        uptime: process.uptime(),
        memory: {
          heapUsed: process.memoryUsage().heapUsed / 1024 / 1024, // MB
          heapTotal: process.memoryUsage().heapTotal / 1024 / 1024, // MB
          rss: process.memoryUsage().rss / 1024 / 1024, // MB
        }
      },
      timestamp: Date.now(),
    };
  });

  // Cache management endpoints
  server.delete('/api/v1/cache/flush', async (request, reply) => {
    // Require admin authentication or special header
    const adminKey = request.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      reply.code(401);
      return {
        success: false,
        error: 'Unauthorized',
        timestamp: Date.now(),
      };
    }

    await cacheManager.flush();
    
    return {
      success: true,
      message: 'Cache flushed successfully',
      timestamp: Date.now(),
    };
  });
}