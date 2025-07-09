/**
 * Prefetch Engine - Intelligent word prefetching based on user patterns
 * 
 * This engine tracks user lookup patterns and predicts likely next words
 * to prefetch, improving perceived performance through caching.
 */

interface LookupPattern {
  word: string;
  timestamp: number;
  relatedWords: string[];
  category?: string;
}

interface PrefetchConfig {
  maxPrefetchQueue: number;
  patternHistorySize: number;
  confidenceThreshold: number;
  prefetchDelay: number;
  maxConcurrentPrefetch: number;
}

interface WordRelationship {
  word: string;
  score: number;
  type: 'synonym' | 'antonym' | 'related' | 'sequential' | 'morphological';
}

export class PrefetchEngine {
  private patterns: LookupPattern[] = [];
  private prefetchQueue: Set<string> = new Set();
  private wordRelationships: Map<string, WordRelationship[]> = new Map();
  private sequencePatterns: Map<string, string[]> = new Map();
  private config: PrefetchConfig;
  private prefetchInProgress: Set<string> = new Set();
  
  constructor(config: Partial<PrefetchConfig> = {}) {
    this.config = {
      maxPrefetchQueue: config.maxPrefetchQueue || 50,
      patternHistorySize: config.patternHistorySize || 100,
      confidenceThreshold: config.confidenceThreshold || 0.3,
      prefetchDelay: config.prefetchDelay || 500,
      maxConcurrentPrefetch: config.maxConcurrentPrefetch || 3,
      ...config
    };
    
    // Load patterns from localStorage if available
    this.loadPatterns();
  }
  
  /**
   * Track a word lookup and analyze patterns
   */
  trackLookup(word: string, definition?: any): void {
    const normalizedWord = word.toLowerCase().trim();
    
    // Extract related words from definition
    const relatedWords = this.extractRelatedWords(definition);
    
    const pattern: LookupPattern = {
      word: normalizedWord,
      timestamp: Date.now(),
      relatedWords,
      category: this.categorizeWord(normalizedWord)
    };
    
    this.patterns.push(pattern);
    
    // Keep pattern history within limit
    if (this.patterns.length > this.config.patternHistorySize) {
      this.patterns.shift();
    }
    
    // Update relationships and patterns
    this.updateWordRelationships(normalizedWord, relatedWords);
    this.updateSequencePatterns(normalizedWord);
    
    // Analyze and queue prefetch candidates
    this.analyzePrefetchCandidates(normalizedWord);
    
    // Save patterns periodically
    this.savePatterns();
  }
  
  /**
   * Extract related words from definition (synonyms, antonyms, etc.)
   */
  private extractRelatedWords(definition?: any): string[] {
    if (!definition) return [];
    
    const related: string[] = [];
    
    // Extract from various definition fields
    if (definition.synonyms) {
      related.push(...definition.synonyms);
    }
    if (definition.antonyms) {
      related.push(...definition.antonyms);
    }
    
    // Extract cross-referenced words from definition text
    if (definition.text) {
      const words = this.extractWordsFromText(definition.text);
      related.push(...words);
    }
    
    return [...new Set(related.map(w => w.toLowerCase().trim()))];
  }
  
  /**
   * Extract meaningful words from definition text
   */
  private extractWordsFromText(text: string): string[] {
    // Simple word extraction - could be enhanced with NLP
    const words = text.match(/\b[a-z]+\b/gi) || [];
    
    // Filter out common words
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    
    return words
      .filter(w => w.length > 3 && !commonWords.has(w.toLowerCase()))
      .slice(0, 5); // Limit to top 5 words
  }
  
  /**
   * Categorize word based on patterns (e.g., technical, common, etc.)
   */
  private categorizeWord(word: string): string {
    // Simple categorization - could be enhanced
    if (word.includes('-')) return 'compound';
    if (word.endsWith('ing') || word.endsWith('ed')) return 'verb-form';
    if (word.endsWith('ly')) return 'adverb';
    if (word.endsWith('tion') || word.endsWith('ment')) return 'noun-abstract';
    return 'general';
  }
  
  /**
   * Update word relationships based on lookup patterns
   */
  private updateWordRelationships(word: string, relatedWords: string[]): void {
    const existingRelations = this.wordRelationships.get(word) || [];
    
    relatedWords.forEach(relatedWord => {
      const existing = existingRelations.find(r => r.word === relatedWord);
      if (existing) {
        existing.score = Math.min(1, existing.score + 0.1);
      } else {
        existingRelations.push({
          word: relatedWord,
          score: 0.3,
          type: 'related'
        });
      }
    });
    
    this.wordRelationships.set(word, existingRelations);
  }
  
  /**
   * Update sequence patterns (words often looked up in sequence)
   */
  private updateSequencePatterns(word: string): void {
    if (this.patterns.length < 2) return;
    
    const previousPattern = this.patterns[this.patterns.length - 2];
    const timeDiff = Date.now() - previousPattern.timestamp;
    
    // If looked up within 30 seconds, consider it a sequence
    if (timeDiff < 30000) {
      const sequence = this.sequencePatterns.get(previousPattern.word) || [];
      if (!sequence.includes(word)) {
        sequence.push(word);
        this.sequencePatterns.set(previousPattern.word, sequence);
      }
    }
  }
  
  /**
   * Analyze and determine which words to prefetch
   */
  private analyzePrefetchCandidates(currentWord: string): void {
    const candidates: Array<{ word: string; score: number }> = [];
    
    // 1. Add related words from current lookup
    const relations = this.wordRelationships.get(currentWord) || [];
    relations.forEach(rel => {
      if (rel.score >= this.config.confidenceThreshold) {
        candidates.push({ word: rel.word, score: rel.score });
      }
    });
    
    // 2. Add sequence pattern predictions
    const sequenceWords = this.sequencePatterns.get(currentWord) || [];
    sequenceWords.forEach(word => {
      candidates.push({ word, score: 0.5 });
    });
    
    // 3. Add morphological variations
    const variations = this.getMorphologicalVariations(currentWord);
    variations.forEach(word => {
      candidates.push({ word, score: 0.4 });
    });
    
    // Sort by score and take top candidates
    candidates.sort((a, b) => b.score - a.score);
    const topCandidates = candidates.slice(0, 10);
    
    // Add to prefetch queue
    topCandidates.forEach(candidate => {
      if (this.prefetchQueue.size < this.config.maxPrefetchQueue) {
        this.prefetchQueue.add(candidate.word);
      }
    });
  }
  
  /**
   * Get morphological variations of a word
   */
  private getMorphologicalVariations(word: string): string[] {
    const variations: string[] = [];
    
    // Simple morphological rules
    if (word.endsWith('y')) {
      variations.push(word.slice(0, -1) + 'ies'); // happy -> happies
      variations.push(word.slice(0, -1) + 'ied'); // happy -> happied
    }
    
    if (word.endsWith('e')) {
      variations.push(word + 'd'); // like -> liked
      variations.push(word.slice(0, -1) + 'ing'); // like -> liking
    } else {
      variations.push(word + 'ed'); // want -> wanted
      variations.push(word + 'ing'); // want -> wanting
      variations.push(word + 's'); // want -> wants
    }
    
    // Remove duplicates and filter valid words
    return [...new Set(variations)].filter(v => v.length > 2);
  }
  
  /**
   * Get next words to prefetch
   */
  getNextPrefetchBatch(): string[] {
    const batch: string[] = [];
    const iterator = this.prefetchQueue.values();
    
    for (let i = 0; i < this.config.maxConcurrentPrefetch; i++) {
      const { value, done } = iterator.next();
      if (!done && value && !this.prefetchInProgress.has(value)) {
        batch.push(value);
        this.prefetchInProgress.add(value);
      }
    }
    
    return batch;
  }
  
  /**
   * Mark prefetch as completed
   */
  markPrefetchCompleted(word: string): void {
    this.prefetchQueue.delete(word);
    this.prefetchInProgress.delete(word);
  }
  
  /**
   * Get prefetch statistics
   */
  getStatistics(): {
    patternsTracked: number;
    prefetchQueueSize: number;
    relationshipsTracked: number;
    sequencePatternsFound: number;
  } {
    return {
      patternsTracked: this.patterns.length,
      prefetchQueueSize: this.prefetchQueue.size,
      relationshipsTracked: this.wordRelationships.size,
      sequencePatternsFound: this.sequencePatterns.size
    };
  }
  
  /**
   * Clear all patterns and reset
   */
  reset(): void {
    this.patterns = [];
    this.prefetchQueue.clear();
    this.wordRelationships.clear();
    this.sequencePatterns.clear();
    this.prefetchInProgress.clear();
    localStorage.removeItem('prefetch-patterns');
  }
  
  /**
   * Save patterns to localStorage
   */
  private savePatterns(): void {
    try {
      const data = {
        patterns: this.patterns.slice(-20), // Save last 20 patterns
        relationships: Array.from(this.wordRelationships.entries()).slice(-50),
        sequences: Array.from(this.sequencePatterns.entries()).slice(-30)
      };
      localStorage.setItem('prefetch-patterns', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save prefetch patterns:', e);
    }
  }
  
  /**
   * Load patterns from localStorage
   */
  private loadPatterns(): void {
    try {
      const saved = localStorage.getItem('prefetch-patterns');
      if (saved) {
        const data = JSON.parse(saved);
        this.patterns = data.patterns || [];
        this.wordRelationships = new Map(data.relationships || []);
        this.sequencePatterns = new Map(data.sequences || []);
      }
    } catch (e) {
      console.warn('Failed to load prefetch patterns:', e);
    }
  }
}

// Export singleton instance
export const prefetchEngine = new PrefetchEngine();