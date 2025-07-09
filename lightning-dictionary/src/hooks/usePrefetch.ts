import { useEffect, useRef, useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { prefetchEngine } from '../utils/prefetch-engine';
import type { WorkerMessage, WorkerResponse } from '../workers/prefetch.worker';

interface PrefetchStats {
  total_prefetched: number;
  cache_hits_from_prefetch: number;
  prefetch_queue_size: number;
  active_prefetches: number;
}

interface PrefetchConfig {
  enabled: boolean;
  maxBatchSize: number;
  batchDelay: number;
  priority: 'high' | 'medium' | 'low';
  useWorker?: boolean;
}

const DEFAULT_CONFIG: PrefetchConfig = {
  enabled: true,
  maxBatchSize: 10,
  batchDelay: 500,
  priority: 'medium',
  useWorker: false, // Default to direct mode for now
};

export function usePrefetch(config: Partial<PrefetchConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingBatchRef = useRef<Set<string>>(new Set());
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  
  // Initialize worker if enabled
  useEffect(() => {
    if (finalConfig.useWorker && !workerRef.current) {
      try {
        workerRef.current = new Worker(
          new URL('../workers/prefetch.worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const { type, payload } = event.data;
          
          if (type === 'BATCH_READY' && payload?.words?.length > 0) {
            // Add to pending batch
            payload.words.forEach((w: string) => pendingBatchRef.current.add(w));
            
            // Clear existing timer
            if (batchTimerRef.current) {
              clearTimeout(batchTimerRef.current);
            }
            
            // Set new timer to batch prefetch requests
            batchTimerRef.current = setTimeout(() => {
              processPrefetchBatch();
            }, finalConfig.batchDelay);
          }
        };
        
        setIsWorkerReady(true);
      } catch (error) {
        console.error('Failed to initialize prefetch worker:', error);
        setIsWorkerReady(false);
      }
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        setIsWorkerReady(false);
      }
    };
  }, [finalConfig.useWorker, finalConfig.batchDelay]);
  
  /**
   * Track word lookup and queue prefetch candidates
   */
  const trackWordLookup = useCallback((word: string, definition?: any) => {
    if (!finalConfig.enabled) return;
    
    if (finalConfig.useWorker && workerRef.current && isWorkerReady) {
      // Use worker for processing
      const message: WorkerMessage = {
        type: 'TRACK_LOOKUP',
        payload: { word, definition }
      };
      workerRef.current.postMessage(message);
    } else {
      // Use direct mode
      prefetchEngine.trackLookup(word, definition);
      
      // Get next batch of words to prefetch
      const candidates = prefetchEngine.getNextPrefetchBatch();
      
      if (candidates.length > 0) {
        // Add to pending batch
        candidates.forEach(w => pendingBatchRef.current.add(w));
        
        // Clear existing timer
        if (batchTimerRef.current) {
          clearTimeout(batchTimerRef.current);
        }
        
        // Set new timer to batch prefetch requests
        batchTimerRef.current = setTimeout(() => {
          processPrefetchBatch();
        }, finalConfig.batchDelay);
      }
    }
  }, [finalConfig.enabled, finalConfig.batchDelay, finalConfig.useWorker, isWorkerReady]);
  
  /**
   * Process the pending prefetch batch
   */
  const processPrefetchBatch = useCallback(async () => {
    const batch = Array.from(pendingBatchRef.current).slice(0, finalConfig.maxBatchSize);
    
    if (batch.length === 0) return;
    
    // Clear processed items from pending
    batch.forEach(w => {
      pendingBatchRef.current.delete(w);
      
      if (finalConfig.useWorker && workerRef.current && isWorkerReady) {
        // Notify worker that prefetch is completed
        const message: WorkerMessage = {
          type: 'MARK_COMPLETED',
          payload: { word: w }
        };
        workerRef.current.postMessage(message);
      } else {
        // Direct mode
        prefetchEngine.markPrefetchCompleted(w);
      }
    });
    
    try {
      // Send to Rust backend for prefetching
      await invoke('queue_prefetch', {
        words: batch,
        priority: finalConfig.priority,
      });
    } catch (error) {
      console.error('Failed to queue prefetch:', error);
    }
  }, [finalConfig.maxBatchSize, finalConfig.priority, finalConfig.useWorker, isWorkerReady]);
  
  /**
   * Get current prefetch statistics
   */
  const getPrefetchStats = useCallback(async (): Promise<PrefetchStats | null> => {
    try {
      const stats = await invoke<PrefetchStats>('get_prefetch_stats');
      return stats;
    } catch (error) {
      console.error('Failed to get prefetch stats:', error);
      return null;
    }
  }, []);
  
  /**
   * Clear the prefetch queue
   */
  const clearPrefetchQueue = useCallback(async () => {
    try {
      await invoke('clear_prefetch_queue');
      pendingBatchRef.current.clear();
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
    } catch (error) {
      console.error('Failed to clear prefetch queue:', error);
    }
  }, []);
  
  /**
   * Reset prefetch patterns
   */
  const resetPrefetchPatterns = useCallback(() => {
    prefetchEngine.reset();
    clearPrefetchQueue();
  }, [clearPrefetchQueue]);
  
  /**
   * Get prefetch engine statistics
   */
  const getEngineStats = useCallback(() => {
    return prefetchEngine.getStatistics();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, []);
  
  return {
    trackWordLookup,
    getPrefetchStats,
    clearPrefetchQueue,
    resetPrefetchPatterns,
    getEngineStats,
    processPrefetchBatch,
  };
}