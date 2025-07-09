import { useState, useCallback, useEffect } from 'react';
import { AIEnhancedDefinition, AIFeatureStatus, AIContextData } from '../types/ai-response';
import { useSettings } from './useSettings';

interface UseAIOptions {
  autoEnhance?: boolean;
  cacheKey?: string;
}

interface UseAIReturn {
  enhance: (word: string, context?: AIContextData) => Promise<AIEnhancedDefinition | null>;
  enhancedData: AIEnhancedDefinition | null;
  loading: boolean;
  error: string | null;
  status: AIFeatureStatus;
  clearCache: () => void;
}

// Simple in-memory cache
const aiCache = new Map<string, { data: AIEnhancedDefinition; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useAI(options: UseAIOptions = {}): UseAIReturn {
  const { settings } = useSettings();
  const [enhancedData, setEnhancedData] = useState<AIEnhancedDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AIFeatureStatus>({
    available: false,
    enabled: false,
    fallbackMode: false,
    provider: 'mock'
  });

  useEffect(() => {
    // Update status based on settings
    setStatus({
      available: true,
      enabled: settings.ai?.enabled ?? false,
      fallbackMode: false,
      provider: settings.ai?.provider ?? 'mock'
    });
  }, [settings.ai]);

  const clearCache = useCallback(() => {
    if (options.cacheKey) {
      aiCache.delete(options.cacheKey);
    } else {
      aiCache.clear();
    }
  }, [options.cacheKey]);

  const enhance = useCallback(async (
    word: string, 
    context?: AIContextData
  ): Promise<AIEnhancedDefinition | null> => {
    if (!settings.ai?.enabled) {
      return null;
    }

    // Check cache
    const cacheKey = options.cacheKey || `${word}-${JSON.stringify(context)}`;
    if (settings.ai.cacheResults && aiCache.has(cacheKey)) {
      const cached = aiCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        setEnhancedData(cached.data);
        return cached.data;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word,
          context: {
            selectedText: context?.selectedText,
            surroundingSentence: context?.surroundingSentence,
            documentTitle: context?.documentTitle,
            userLevel: context?.userLevel,
            previousLookups: context?.previousLookups
          },
          features: settings.ai.features,
          provider: settings.ai.provider,
          options: {
            maxCost: settings.ai.maxCostPerMonth ? settings.ai.maxCostPerMonth / 30 / 100 : undefined
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const enhanced = data.enhancement as AIEnhancedDefinition;
      
      // Cache the result
      if (settings.ai.cacheResults) {
        aiCache.set(cacheKey, {
          data: enhanced,
          timestamp: Date.now()
        });
      }

      setEnhancedData(enhanced);
      setStatus(data.status);
      
      return enhanced;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI enhancement failed';
      console.error('AI enhancement error:', err);
      setError(errorMessage);
      setStatus(prev => ({ ...prev, fallbackMode: true }));
      return null;
    } finally {
      setLoading(false);
    }
  }, [settings.ai, options.cacheKey]);

  // Auto-enhance if requested
  useEffect(() => {
    if (options.autoEnhance && settings.ai?.autoEnhance) {
      // This would be triggered by the parent component
      // providing the word and context
    }
  }, [options.autoEnhance, settings.ai?.autoEnhance]);

  return {
    enhance,
    enhancedData,
    loading,
    error,
    status,
    clearCache
  };
}

// Hook for checking AI availability
export function useAIStatus(): AIFeatureStatus {
  const { settings } = useSettings();
  const [status, setStatus] = useState<AIFeatureStatus>({
    available: false,
    enabled: false,
    fallbackMode: false,
    provider: 'mock'
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/v1/ai/status');
        if (response.ok) {
          const data = await response.json();
          setStatus({
            ...data,
            enabled: settings.ai?.enabled ?? false
          });
        }
      } catch (err) {
        console.error('Failed to check AI status:', err);
      }
    };

    checkStatus();
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [settings.ai?.enabled]);

  return status;
}