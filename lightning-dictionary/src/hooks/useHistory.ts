import { useState, useEffect, useCallback } from 'react';
import { historyManager, HistoryEntry, HistoryFilter } from '../utils/history-manager';

interface UseHistoryOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useHistory(filter?: HistoryFilter, options?: UseHistoryOptions) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { autoRefresh = false, refreshInterval = 5000 } = options || {};

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const entries = await historyManager.getHistory(filter);
      setHistory(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const addEntry = useCallback(
    async (word: string, context?: string, definition?: string) => {
      await historyManager.addEntry(word, context, definition);
      if (autoRefresh) {
        await loadHistory();
      }
    },
    [autoRefresh, loadHistory]
  );

  const clearHistory = useCallback(
    async (beforeDate?: string) => {
      try {
        await historyManager.clearHistory(beforeDate);
        await loadHistory();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clear history');
      }
    },
    [loadHistory]
  );

  const exportHistory = useCallback(async (format: 'json' | 'csv') => {
    try {
      return await historyManager.exportHistory(format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export history');
      throw err;
    }
  }, []);

  const getStatistics = useCallback(async () => {
    try {
      return await historyManager.getStatistics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get statistics');
      throw err;
    }
  }, []);

  const setPrivacyMode = useCallback((enabled: boolean) => {
    historyManager.setPrivacyMode(enabled);
    if (enabled) {
      setHistory([]);
    } else {
      loadHistory();
    }
  }, [loadHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadHistory, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadHistory]);

  return {
    history,
    isLoading,
    error,
    addEntry,
    clearHistory,
    exportHistory,
    getStatistics,
    setPrivacyMode,
    refresh: loadHistory,
  };
}

export function useHistoryStatistics() {
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const stats = await historyManager.getStatistics();
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return {
    statistics,
    isLoading,
    error,
    refresh: loadStatistics,
  };
}