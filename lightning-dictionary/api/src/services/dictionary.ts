import { readFile } from 'fs/promises';
import { join } from 'path';
import { DictionaryData, WordDefinition, SearchResult } from '../types/dictionary';
import { EnhancedWordDefinition, convertLegacyToEnhanced, generateMockDefinitions } from '../types/enhanced-dictionary';
import { config } from '../config';
import cacheManager, { Cacheable } from '../utils/cache-manager';
import { initializeSearchService } from './search';

let dictionaryData: DictionaryData | null = null;
let wordIndex: Map<string, WordDefinition> = new Map();
let searchIndex: Array<{ word: string; lowercase: string }> = [];

export async function loadDictionary(): Promise<void> {
  try {
    // Try to load enhanced dictionary first, fallback to regular dictionary
    let dataPath = join(__dirname, '..', '..', '..', 'data', 'processed', 'dictionary_enhanced.json');
    let fileContent: string;
    
    try {
      fileContent = await readFile(dataPath, 'utf-8');
      console.log('Loading enhanced dictionary data...');
    } catch (error) {
      // Fallback to regular dictionary
      dataPath = join(__dirname, '..', '..', '..', 'data', 'processed', 'dictionary.json');
      fileContent = await readFile(dataPath, 'utf-8');
      console.log('Loading standard dictionary data...');
    }
    
    dictionaryData = JSON.parse(fileContent);

    if (!dictionaryData || !dictionaryData.words) {
      throw new Error('Invalid dictionary data format');
    }

    // Build indexes for O(1) lookups and fast searching
    wordIndex.clear();
    searchIndex = [];

    for (const [word, definition] of Object.entries(dictionaryData.words)) {
      wordIndex.set(word.toLowerCase(), definition);
      searchIndex.push({ word, lowercase: word.toLowerCase() });
    }

    // Sort search index for efficient prefix searching
    searchIndex.sort((a, b) => a.lowercase.localeCompare(b.lowercase));

    // Initialize search service with word index
    initializeSearchService(wordIndex);

    console.log(`Loaded ${wordIndex.size} words into memory`);
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    throw error;
  }
}

export async function getDefinition(word: string): Promise<WordDefinition | null> {
  const cacheKey = `def:${word.toLowerCase()}`;
  
  // Try cache first
  const cached = await cacheManager.get<WordDefinition>(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  // Get from memory
  const definition = wordIndex.get(word.toLowerCase()) || null;
  
  // Cache the result
  if (definition) {
    await cacheManager.set(cacheKey, definition, { ttl: 3600 }); // 1 hour
  }
  
  return definition;
}

export async function searchWords(query: string): Promise<SearchResult[]> {
  if (!query || query.length < config.search.minQueryLength) {
    return [];
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  
  // Try cache first
  const cached = await cacheManager.get<SearchResult[]>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const normalizedQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  // Binary search for prefix matching
  let left = 0;
  let right = searchIndex.length - 1;
  let firstMatch = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const word = searchIndex[mid].lowercase;

    if (word.startsWith(normalizedQuery)) {
      firstMatch = mid;
      // Continue searching left to find the first match
      right = mid - 1;
    } else if (word < normalizedQuery) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (firstMatch === -1) {
    await cacheManager.set(cacheKey, [], { ttl: 300 }); // Cache empty results for 5 minutes
    return [];
  }

  // Collect all matches starting from firstMatch
  for (let i = firstMatch; i < searchIndex.length && results.length < config.search.maxResults; i++) {
    const entry = searchIndex[i];
    if (!entry.lowercase.startsWith(normalizedQuery)) {
      break;
    }

    const definition = wordIndex.get(entry.lowercase);
    if (definition) {
      results.push({
        word: entry.word,
        rank: definition.rank,
        pos: definition.pos,
        frequency: definition.frequency,
      });
    }
  }

  // Sort by frequency (most common first)
  results.sort((a, b) => b.frequency - a.frequency);

  // Cache the results
  await cacheManager.set(cacheKey, results, { ttl: 300 }); // 5 minutes

  return results;
}

export function getDictionaryStats() {
  return {
    totalWords: wordIndex.size,
    metadata: dictionaryData?.metadata || null,
  };
}

// Enhanced definition support
export async function getEnhancedDefinition(word: string): Promise<EnhancedWordDefinition | null> {
  const cacheKey = `enhanced:${word.toLowerCase()}`;
  
  // Try cache first
  const cached = await cacheManager.get<EnhancedWordDefinition>(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  const legacyDef = await getDefinition(word);
  
  if (!legacyDef) {
    // Try mock data in development
    if (process.env.NODE_ENV === 'development') {
      const mockDef = generateMockDefinitions(word);
      if (mockDef) {
        await cacheManager.set(cacheKey, mockDef, { ttl: 3600 });
      }
      return mockDef;
    }
    return null;
  }
  
  // Convert legacy format to enhanced format
  const enhanced = convertLegacyToEnhanced(word, legacyDef);
  
  // Cache the enhanced definition
  if (enhanced) {
    await cacheManager.set(cacheKey, enhanced, { ttl: 3600 });
  }
  
  return enhanced;
}

// Get multiple words at once (for prefetching)
export async function getMultipleDefinitions(words: string[]): Promise<Record<string, EnhancedWordDefinition>> {
  const results: Record<string, EnhancedWordDefinition> = {};
  
  // Process in parallel for better performance
  const promises = words.map(async (word) => {
    const enhanced = await getEnhancedDefinition(word);
    if (enhanced) {
      results[word.toLowerCase()] = enhanced;
    }
  });
  
  await Promise.all(promises);
  
  return results;
}

// Check for circular references between words
export async function detectCircularReferences(word: string, maxDepth: number = 5): Promise<string[]> {
  const visited = new Set<string>();
  const circularRefs: string[] = [];
  
  async function checkWord(currentWord: string, path: string[], depth: number) {
    if (depth > maxDepth) return;
    
    const normalizedWord = currentWord.toLowerCase();
    if (path.includes(normalizedWord)) {
      circularRefs.push(path.concat(normalizedWord).join(' → '));
      return;
    }
    
    if (visited.has(normalizedWord)) return;
    visited.add(normalizedWord);
    
    const definition = await getEnhancedDefinition(currentWord);
    if (!definition) return;
    
    // Check all related words
    const relatedWords = new Set<string>();
    
    // Add words from synonyms and antonyms
    definition.posGroups.forEach(group => {
      group.definitions.forEach(def => {
        def.synonyms?.forEach(syn => relatedWords.add(syn));
        def.antonyms?.forEach(ant => relatedWords.add(ant));
      });
    });
    
    // Add related words
    definition.relatedWords?.forEach(word => relatedWords.add(word));
    
    // Check each related word - process in parallel
    const promises = Array.from(relatedWords).map(relatedWord => 
      checkWord(relatedWord, [...path, normalizedWord], depth + 1)
    );
    
    await Promise.all(promises);
  }
  
  await checkWord(word, [], 0);
  return circularRefs;
}