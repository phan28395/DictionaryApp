interface BatchRequest<T> {
  key: string;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

interface BatcherOptions {
  maxBatchSize?: number;
  batchDelay?: number;
  maxRetries?: number;
}

export class RequestBatcher<T> {
  private pendingRequests: Map<string, BatchRequest<T>[]> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;
  private options: Required<BatcherOptions>;

  constructor(
    private batchFunction: (keys: string[]) => Promise<Record<string, T>>,
    options: BatcherOptions = {}
  ) {
    this.options = {
      maxBatchSize: options.maxBatchSize || 50,
      batchDelay: options.batchDelay || 10, // milliseconds
      maxRetries: options.maxRetries || 3
    };
  }

  async get(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      // Add request to pending
      if (!this.pendingRequests.has(key)) {
        this.pendingRequests.set(key, []);
      }
      this.pendingRequests.get(key)!.push({ key, resolve, reject });

      // Schedule batch execution
      this.scheduleBatch();
    });
  }

  private scheduleBatch(): void {
    if (this.batchTimer) {
      return; // Batch already scheduled
    }

    // Check if we should execute immediately due to size
    if (this.pendingRequests.size >= this.options.maxBatchSize) {
      this.executeBatch();
      return;
    }

    // Schedule batch execution
    this.batchTimer = setTimeout(() => {
      this.executeBatch();
    }, this.options.batchDelay);
  }

  private async executeBatch(): Promise<void> {
    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Get all pending requests
    const currentBatch = new Map(this.pendingRequests);
    this.pendingRequests.clear();

    if (currentBatch.size === 0) {
      return;
    }

    const keys = Array.from(currentBatch.keys());

    try {
      // Execute batch request
      const results = await this.retryWithBackoff(() => this.batchFunction(keys));

      // Resolve all requests
      for (const [key, requests] of currentBatch.entries()) {
        const result = results[key];
        if (result !== undefined) {
          requests.forEach(req => req.resolve(result));
        } else {
          const error = new Error(`No result for key: ${key}`);
          requests.forEach(req => req.reject(error));
        }
      }
    } catch (error) {
      // Reject all requests
      const err = error as Error;
      for (const requests of currentBatch.values()) {
        requests.forEach(req => req.reject(err));
      }
    }
  }

  private async retryWithBackoff<R>(
    fn: () => Promise<R>,
    attempt: number = 0
  ): Promise<R> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.options.maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  // Utility method to get multiple items
  async getMultiple(keys: string[]): Promise<Record<string, T>> {
    const promises = keys.map(key => 
      this.get(key).then(result => ({ key, result }))
    );

    const results = await Promise.all(promises);
    const resultMap: Record<string, T> = {};
    
    results.forEach(({ key, result }) => {
      resultMap[key] = result;
    });

    return resultMap;
  }

  // Force execution of pending batch
  async flush(): Promise<void> {
    if (this.pendingRequests.size > 0) {
      await this.executeBatch();
    }
  }

  // Get statistics
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      hasPendingBatch: this.batchTimer !== null
    };
  }
}

// Create a word definition batcher
export const definitionBatcher = new RequestBatcher<any>(
  async (words: string[]) => {
    const response = await fetch('/api/v1/define/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words })
    });

    if (!response.ok) {
      throw new Error(`Batch request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || {};
  },
  {
    maxBatchSize: 25,
    batchDelay: 10,
    maxRetries: 3
  }
);

// Create a search suggestions batcher
export const searchBatcher = new RequestBatcher<any[]>(
  async (queries: string[]) => {
    // For search, we need to handle each query separately
    // but we can still batch the network requests
    const promises = queries.map(query =>
      fetch(`/api/v1/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(result => ({ query, data: result.data || [] }))
    );

    const results = await Promise.all(promises);
    const resultMap: Record<string, any[]> = {};
    
    results.forEach(({ query, data }) => {
      resultMap[query] = data;
    });

    return resultMap;
  },
  {
    maxBatchSize: 10,
    batchDelay: 50, // Slightly longer delay for search
    maxRetries: 2
  }
);