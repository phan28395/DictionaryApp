import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { 
  EnhancedWordDefinition, 
  MultiDefinitionResponse,
  generateMockDefinitions,
  convertLegacyToEnhanced,
  LegacyWordDefinition
} from '../types/enhanced-dictionary';

interface UseDefinitionsOptions {
  useMockData?: boolean;
  cacheResults?: boolean;
}

interface UseDefinitionsReturn {
  definition: EnhancedWordDefinition | null;
  isLoading: boolean;
  error: string | null;
  lookupWord: (word: string) => Promise<void>;
  clearError: () => void;
}

// Simple in-memory cache for definitions
const definitionCache = new Map<string, EnhancedWordDefinition>();

export function useDefinitions(options: UseDefinitionsOptions = {}): UseDefinitionsReturn {
  const { useMockData = false, cacheResults = true } = options;
  
  const [definition, setDefinition] = useState<EnhancedWordDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupWord = useCallback(async (word: string) => {
    if (!word) {
      setError('No word provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      if (cacheResults && definitionCache.has(word.toLowerCase())) {
        setDefinition(definitionCache.get(word.toLowerCase())!);
        setIsLoading(false);
        return;
      }

      // Use mock data in development
      if (useMockData || process.env.NODE_ENV === 'development') {
        const mockDef = generateMockDefinitions(word);
        if (cacheResults) {
          definitionCache.set(word.toLowerCase(), mockDef);
        }
        setDefinition(mockDef);
        setIsLoading(false);
        return;
      }

      // Try to get definition from Tauri backend
      try {
        const response = await invoke<MultiDefinitionResponse>('lookup_word_enhanced', { word });
        
        if (response.success && response.data) {
          if (cacheResults) {
            definitionCache.set(word.toLowerCase(), response.data);
          }
          setDefinition(response.data);
        } else {
          // Fallback to legacy format
          const legacyResponse = await invoke<any>('lookup_word', { word });
          
          if (legacyResponse) {
            const enhanced = convertLegacyToEnhanced(word, legacyResponse);
            if (cacheResults) {
              definitionCache.set(word.toLowerCase(), enhanced);
            }
            setDefinition(enhanced);
          } else {
            setError(`No definition found for "${word}"`);
          }
        }
      } catch (tauriError) {
        console.warn('Tauri invoke failed, trying API fallback:', tauriError);
        
        // Fallback to direct API call
        try {
          const apiResponse = await fetch(`http://localhost:3456/api/v1/define/${encodeURIComponent(word)}`);
          const data = await apiResponse.json();
          
          if (data.success && data.data) {
            const enhanced = convertLegacyToEnhanced(word, data.data as LegacyWordDefinition);
            if (cacheResults) {
              definitionCache.set(word.toLowerCase(), enhanced);
            }
            setDefinition(enhanced);
          } else {
            // Final fallback to mock data
            const mockDef = generateMockDefinitions(word);
            if (cacheResults) {
              definitionCache.set(word.toLowerCase(), mockDef);
            }
            setDefinition(mockDef);
          }
        } catch (apiError) {
          console.error('API call failed:', apiError);
          // Use mock data as final fallback
          const mockDef = generateMockDefinitions(word);
          setDefinition(mockDef);
        }
      }
    } catch (err) {
      console.error('Error looking up word:', err);
      setError(err instanceof Error ? err.message : 'Failed to look up word');
    } finally {
      setIsLoading(false);
    }
  }, [useMockData, cacheResults]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    definition,
    isLoading,
    error,
    lookupWord,
    clearError
  };
}

// Hook for prefetching related words
export function usePrefetchDefinitions() {
  const prefetchWords = useCallback(async (words: string[]) => {
    // Prefetch in background without blocking UI
    setTimeout(() => {
      words.forEach(async (word) => {
        if (!definitionCache.has(word.toLowerCase())) {
          try {
            // In production, this would call the actual API
            const mockDef = generateMockDefinitions(word);
            definitionCache.set(word.toLowerCase(), mockDef);
          } catch (err) {
            console.warn(`Failed to prefetch ${word}:`, err);
          }
        }
      });
    }, 100);
  }, []);

  return { prefetchWords };
}

// Hook to get cache statistics
export function useDefinitionCacheStats() {
  const [stats, setStats] = useState({
    size: definitionCache.size,
    words: Array.from(definitionCache.keys())
  });

  const updateStats = useCallback(() => {
    setStats({
      size: definitionCache.size,
      words: Array.from(definitionCache.keys())
    });
  }, []);

  const clearCache = useCallback(() => {
    definitionCache.clear();
    updateStats();
  }, [updateStats]);

  useEffect(() => {
    updateStats();
  }, [updateStats]);

  return {
    cacheSize: stats.size,
    cachedWords: stats.words,
    clearCache,
    updateStats
  };
}