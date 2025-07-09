/**
 * Web Worker for background prefetch processing
 * Handles pattern analysis and prefetch queue management
 */

import { PrefetchEngine } from '../utils/prefetch-engine';

// Message types for worker communication
interface WorkerMessage {
  type: 'TRACK_LOOKUP' | 'GET_BATCH' | 'MARK_COMPLETED' | 'GET_STATS' | 'RESET' | 'UPDATE_CONFIG';
  payload?: any;
}

interface WorkerResponse {
  type: 'BATCH_READY' | 'STATS' | 'SUCCESS' | 'ERROR';
  payload?: any;
}

// Initialize prefetch engine in worker context
let prefetchEngine: PrefetchEngine;

// Initialize the engine
function initializeEngine(config?: any) {
  prefetchEngine = new PrefetchEngine(config);
}

// Handle messages from main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  try {
    switch (type) {
      case 'TRACK_LOOKUP':
        if (!prefetchEngine) {
          initializeEngine();
        }
        prefetchEngine.trackLookup(payload.word, payload.definition);
        
        // Automatically get next batch after tracking
        const batch = prefetchEngine.getNextPrefetchBatch();
        if (batch.length > 0) {
          self.postMessage({
            type: 'BATCH_READY',
            payload: { words: batch }
          } as WorkerResponse);
        }
        break;
        
      case 'GET_BATCH':
        if (!prefetchEngine) {
          initializeEngine();
        }
        const words = prefetchEngine.getNextPrefetchBatch();
        self.postMessage({
          type: 'BATCH_READY',
          payload: { words }
        } as WorkerResponse);
        break;
        
      case 'MARK_COMPLETED':
        if (prefetchEngine && payload.word) {
          prefetchEngine.markPrefetchCompleted(payload.word);
        }
        self.postMessage({
          type: 'SUCCESS'
        } as WorkerResponse);
        break;
        
      case 'GET_STATS':
        if (!prefetchEngine) {
          initializeEngine();
        }
        const stats = prefetchEngine.getStatistics();
        self.postMessage({
          type: 'STATS',
          payload: stats
        } as WorkerResponse);
        break;
        
      case 'RESET':
        if (prefetchEngine) {
          prefetchEngine.reset();
        }
        self.postMessage({
          type: 'SUCCESS'
        } as WorkerResponse);
        break;
        
      case 'UPDATE_CONFIG':
        initializeEngine(payload);
        self.postMessage({
          type: 'SUCCESS'
        } as WorkerResponse);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: type
      }
    } as WorkerResponse);
  }
});

// Initialize on worker start
initializeEngine();

// Export types for use in main thread
export type { WorkerMessage, WorkerResponse };