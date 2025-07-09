import { FastifyInstance } from 'fastify';
import { WordDefinition } from '../types/dictionary';

export interface SearchResult {
  word: string;
  score: number;
  distance: number;
}

export interface SearchSuggestion {
  word: string;
  relevance: number;
  isExactMatch: boolean;
  partOfSpeech?: string[];
}

export class SearchService {
  private dictionary: Map<string, WordDefinition>;
  private wordList: string[];
  private commonWords: Set<string>;

  constructor(dictionary: Map<string, WordDefinition>) {
    this.dictionary = dictionary;
    this.wordList = Array.from(dictionary.keys());
    
    // Common words for boosting relevance
    this.commonWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
      'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
      'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
      'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
      'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
      'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
      'give', 'day', 'most', 'us'
    ]);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Calculate distances
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Calculate Jaro-Winkler similarity for better matching of similar strings
   */
  private jaroWinklerSimilarity(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0 && len2 === 0) return 1;
    if (len1 === 0 || len2 === 0) return 0;
    
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    
    // Jaro-Winkler modification
    let prefixLen = 0;
    for (let i = 0; i < Math.min(len1, len2, 4); i++) {
      if (s1[i] === s2[i]) prefixLen++;
      else break;
    }
    
    return jaro + prefixLen * 0.1 * (1 - jaro);
  }

  /**
   * Get search suggestions for a query
   */
  getSuggestions(query: string, limit: number = 10): SearchSuggestion[] {
    if (!query || query.length === 0) return [];
    
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];
    
    // First pass: find exact matches and prefix matches
    const exactMatches: SearchSuggestion[] = [];
    const prefixMatches: SearchSuggestion[] = [];
    
    for (const word of this.wordList) {
      const lowerWord = word.toLowerCase();
      
      if (lowerWord === lowerQuery) {
        // Exact match
        const data = this.dictionary.get(word);
        exactMatches.push({
          word,
          relevance: 1.0,
          isExactMatch: true,
          partOfSpeech: data?.pos ? [data.pos] : undefined
        });
      } else if (lowerWord.startsWith(lowerQuery)) {
        // Prefix match
        const data = this.dictionary.get(word);
        const relevance = 0.9 - (lowerWord.length - lowerQuery.length) * 0.01;
        prefixMatches.push({
          word,
          relevance: Math.max(relevance, 0.5),
          isExactMatch: false,
          partOfSpeech: data?.pos ? [data.pos] : undefined
        });
      }
    }
    
    // Sort prefix matches by relevance and alphabetically
    prefixMatches.sort((a, b) => {
      if (Math.abs(a.relevance - b.relevance) > 0.01) {
        return b.relevance - a.relevance;
      }
      return a.word.localeCompare(b.word);
    });
    
    // Combine exact and prefix matches
    const combinedMatches = [...exactMatches, ...prefixMatches].slice(0, limit);
    
    // If we have enough matches, return them
    if (combinedMatches.length >= limit) {
      return combinedMatches;
    }
    
    // Second pass: fuzzy matching for typos
    const fuzzyMatches: SearchResult[] = [];
    const maxDistance = Math.min(3, Math.floor(lowerQuery.length / 3) + 1);
    
    for (const word of this.wordList) {
      const lowerWord = word.toLowerCase();
      
      // Skip if already included
      if (combinedMatches.some(m => m.word === word)) continue;
      
      // Skip if too different in length
      if (Math.abs(lowerWord.length - lowerQuery.length) > maxDistance) continue;
      
      // Calculate distance
      const distance = this.levenshteinDistance(lowerQuery, lowerWord);
      
      if (distance <= maxDistance) {
        // Calculate similarity for better ranking
        const similarity = this.jaroWinklerSimilarity(lowerQuery, lowerWord);
        
        // Boost score for common words
        const commonWordBoost = this.commonWords.has(lowerWord) ? 0.1 : 0;
        
        // Calculate final score
        const score = similarity + commonWordBoost - distance * 0.1;
        
        fuzzyMatches.push({ word, score, distance });
      }
    }
    
    // Sort fuzzy matches by score
    fuzzyMatches.sort((a, b) => b.score - a.score);
    
    // Convert to suggestions
    const fuzzySuggestions: SearchSuggestion[] = fuzzyMatches.slice(0, limit - combinedMatches.length).map(result => {
      const data = this.dictionary.get(result.word);
      return {
        word: result.word,
        relevance: Math.max(0.3, Math.min(0.7, result.score)),
        isExactMatch: false,
        partOfSpeech: data?.pos ? [data.pos] : undefined
      };
    });
    
    return [...combinedMatches, ...fuzzySuggestions];
  }

  /**
   * Search for words containing a substring
   */
  searchContains(substring: string, limit: number = 20): SearchSuggestion[] {
    if (!substring || substring.length === 0) return [];
    
    const lowerSubstring = substring.toLowerCase();
    const results: SearchSuggestion[] = [];
    
    for (const word of this.wordList) {
      const lowerWord = word.toLowerCase();
      
      if (lowerWord.includes(lowerSubstring)) {
        const data = this.dictionary.get(word);
        
        // Calculate relevance based on position and word frequency
        let relevance = 0.5;
        if (lowerWord.startsWith(lowerSubstring)) relevance = 0.8;
        else if (lowerWord.endsWith(lowerSubstring)) relevance = 0.6;
        
        if (this.commonWords.has(lowerWord)) relevance += 0.1;
        
        results.push({
          word,
          relevance: Math.min(relevance, 0.9),
          isExactMatch: lowerWord === lowerSubstring,
          partOfSpeech: data?.pos ? [data.pos] : undefined
        });
      }
      
      if (results.length >= limit * 2) break; // Get more than needed for better sorting
    }
    
    // Sort by relevance and alphabetically
    results.sort((a, b) => {
      if (Math.abs(a.relevance - b.relevance) > 0.01) {
        return b.relevance - a.relevance;
      }
      return a.word.length - b.word.length || a.word.localeCompare(b.word);
    });
    
    return results.slice(0, limit);
  }

  /**
   * Get related words (currently returns empty array - can be enhanced with synonym/antonym data)
   */
  getRelatedWords(word: string): string[] {
    // This would need enhanced dictionary data with synonyms/antonyms
    // For now, return empty array
    return [];
  }
}

let searchService: SearchService | null = null;

export function initializeSearchService(dictionary: Map<string, WordDefinition>): void {
  searchService = new SearchService(dictionary);
}

export function getSearchService(): SearchService {
  if (!searchService) {
    throw new Error('Search service not initialized');
  }
  return searchService;
}