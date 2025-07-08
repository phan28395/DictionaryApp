import { readFile } from 'fs/promises';
import { join } from 'path';
import { DictionaryData, WordDefinition, SearchResult } from '../types/dictionary';
import { EnhancedWordDefinition, convertLegacyToEnhanced, generateMockDefinitions } from '../types/enhanced-dictionary';
import { config } from '../config';

let dictionaryData: DictionaryData | null = null;
let wordIndex: Map<string, WordDefinition> = new Map();
let searchIndex: Array<{ word: string; lowercase: string }> = [];

export async function loadDictionary(): Promise<void> {
  try {
    const dataPath = join(__dirname, '..', '..', '..', 'data', 'processed', 'dictionary.json');
    const fileContent = await readFile(dataPath, 'utf-8');
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

    console.log(`Loaded ${wordIndex.size} words into memory`);
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    throw error;
  }
}

export function getDefinition(word: string): WordDefinition | null {
  return wordIndex.get(word.toLowerCase()) || null;
}

export function searchWords(query: string): SearchResult[] {
  if (!query || query.length < config.search.minQueryLength) {
    return [];
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

  return results;
}

export function getDictionaryStats() {
  return {
    totalWords: wordIndex.size,
    metadata: dictionaryData?.metadata || null,
  };
}

// Enhanced definition support
export function getEnhancedDefinition(word: string): EnhancedWordDefinition | null {
  const legacyDef = getDefinition(word);
  
  if (!legacyDef) {
    // Try mock data in development
    if (process.env.NODE_ENV === 'development') {
      return generateMockDefinitions(word);
    }
    return null;
  }
  
  // Convert legacy format to enhanced format
  return convertLegacyToEnhanced(word, legacyDef);
}

// Get multiple words at once (for prefetching)
export function getMultipleDefinitions(words: string[]): Record<string, EnhancedWordDefinition> {
  const results: Record<string, EnhancedWordDefinition> = {};
  
  for (const word of words) {
    const enhanced = getEnhancedDefinition(word);
    if (enhanced) {
      results[word.toLowerCase()] = enhanced;
    }
  }
  
  return results;
}

// Check for circular references between words
export function detectCircularReferences(word: string, maxDepth: number = 5): string[] {
  const visited = new Set<string>();
  const circularRefs: string[] = [];
  
  function checkWord(currentWord: string, path: string[], depth: number) {
    if (depth > maxDepth) return;
    
    const normalizedWord = currentWord.toLowerCase();
    if (path.includes(normalizedWord)) {
      circularRefs.push(path.concat(normalizedWord).join(' → '));
      return;
    }
    
    if (visited.has(normalizedWord)) return;
    visited.add(normalizedWord);
    
    const definition = getEnhancedDefinition(currentWord);
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
    
    // Check each related word
    relatedWords.forEach(relatedWord => {
      checkWord(relatedWord, [...path, normalizedWord], depth + 1);
    });
  }
  
  checkWord(word, [], 0);
  return circularRefs;
}