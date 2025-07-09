import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getSearchService } from '../services/search';

interface SearchSuggestionsQuery {
  q: string;
  limit?: string;
}

interface SearchContainsQuery {
  substring: string;
  limit?: string;
}

interface RelatedWordsParams {
  word: string;
}

export async function searchRoutes(fastify: FastifyInstance) {
  // Search suggestions endpoint with fuzzy matching
  fastify.get<{
    Querystring: SearchSuggestionsQuery
  }>('/suggestions', async (request: FastifyRequest<{ Querystring: SearchSuggestionsQuery }>, reply: FastifyReply) => {
    const { q, limit = '10' } = request.query;
    
    if (!q || q.trim().length === 0) {
      return reply.status(400).send({
        error: 'Query parameter is required',
        status: 400
      });
    }
    
    try {
      const searchService = getSearchService();
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
      const suggestions = searchService.getSuggestions(q, limitNum);
      
      return reply.send({
        query: q,
        suggestions,
        count: suggestions.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get search suggestions',
        status: 500
      });
    }
  });

  // Search for words containing substring
  fastify.get<{
    Querystring: SearchContainsQuery
  }>('/contains', async (request: FastifyRequest<{ Querystring: SearchContainsQuery }>, reply: FastifyReply) => {
    const { substring, limit = '20' } = request.query;
    
    if (!substring || substring.trim().length === 0) {
      return reply.status(400).send({
        error: 'Substring parameter is required',
        status: 400
      });
    }
    
    try {
      const searchService = getSearchService();
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const results = searchService.searchContains(substring, limitNum);
      
      return reply.send({
        substring,
        results,
        count: results.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to search words',
        status: 500
      });
    }
  });

  // Get related words (synonyms, antonyms)
  fastify.get<{
    Params: RelatedWordsParams
  }>('/related/:word', async (request: FastifyRequest<{ Params: RelatedWordsParams }>, reply: FastifyReply) => {
    const { word } = request.params;
    
    try {
      const searchService = getSearchService();
      const relatedWords = searchService.getRelatedWords(word);
      
      return reply.send({
        word,
        relatedWords,
        count: relatedWords.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get related words',
        status: 500
      });
    }
  });

  // Autocomplete endpoint (lightweight, prefix-based)
  fastify.get<{
    Querystring: SearchSuggestionsQuery
  }>('/autocomplete', async (request: FastifyRequest<{ Querystring: SearchSuggestionsQuery }>, reply: FastifyReply) => {
    const { q, limit = '5' } = request.query;
    
    if (!q || q.trim().length === 0) {
      return reply.send({
        query: q,
        suggestions: [],
        count: 0
      });
    }
    
    try {
      const searchService = getSearchService();
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
      
      // Get suggestions but filter to only prefix matches for autocomplete
      const allSuggestions = searchService.getSuggestions(q, limitNum * 2);
      const autocompleteSuggestions = allSuggestions
        .filter(s => s.word.toLowerCase().startsWith(q.toLowerCase()))
        .slice(0, limitNum)
        .map(s => ({
          word: s.word,
          isExactMatch: s.isExactMatch
        }));
      
      return reply.send({
        query: q,
        suggestions: autocompleteSuggestions,
        count: autocompleteSuggestions.length
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get autocomplete suggestions',
        status: 500
      });
    }
  });
}