import { FastifyInstance } from 'fastify';
import { getDefinition, searchWords, getDictionaryStats } from '../services/dictionary';
import { ApiResponse, WordDefinition, SearchResult } from '../types/dictionary';
import { config } from '../config';

export async function defineRoutes(server: FastifyInstance) {
  // Health check endpoint
  server.get('/health', async (request, reply) => {
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

  // Get word definition
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

    const definition = getDefinition(word);
    
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

    const results = searchWords(query);

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
  server.get('/api/v1/stats', async (request, reply) => {
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
}