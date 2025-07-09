/**
 * Batch AI Processing Service
 * Handles batch processing of AI enhancement requests with job queue management
 */

import { 
  AIRequest, 
  AIResponse, 
  AIFeature,
  AIError
} from '../types/ai-context';
import { AIService } from './ai-service';
import { EventEmitter } from 'events';

export interface BatchJob {
  id: string;
  userId?: string;
  requests: AIRequest[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  totalItems: number;
  completedItems: number;
  results: Map<string, AIResponse>;
  errors: Map<string, AIError>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  priority: 'low' | 'normal' | 'high';
  retryCount: number;
  maxRetries: number;
}

export interface BatchOptions {
  priority?: 'low' | 'normal' | 'high';
  maxRetries?: number;
  userId?: string;
  notifyProgress?: boolean;
  chunkSize?: number; // Process items in chunks
}

export interface BatchResult {
  jobId: string;
  status: 'completed' | 'partial' | 'failed';
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: Record<string, AIResponse>;
  errors: Record<string, AIError>;
  processingTime: number;
}

export class BatchAIService extends EventEmitter {
  private jobs: Map<string, BatchJob> = new Map();
  private queue: string[] = []; // Job IDs in priority order
  private processing: boolean = false;
  private aiService: AIService;
  private maxConcurrentJobs: number = 3;
  private currentProcessingCount: number = 0;

  constructor(aiService: AIService) {
    super();
    this.aiService = aiService;
    
    // Start processing loop
    this.startProcessingLoop();
  }

  /**
   * Submit a batch of AI requests for processing
   */
  async submitBatch(
    requests: AIRequest[], 
    options: BatchOptions = {}
  ): Promise<string> {
    const jobId = this.generateJobId();
    
    const job: BatchJob = {
      id: jobId,
      userId: options.userId,
      requests,
      status: 'pending',
      progress: 0,
      totalItems: requests.length,
      completedItems: 0,
      results: new Map(),
      errors: new Map(),
      createdAt: new Date(),
      priority: options.priority || 'normal',
      retryCount: 0,
      maxRetries: options.maxRetries || 3
    };

    this.jobs.set(jobId, job);
    this.enqueueJob(jobId, job.priority);
    
    // Emit job created event
    this.emit('job:created', { jobId, totalItems: job.totalItems });
    
    return jobId;
  }

  /**
   * Get job status and results
   */
  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for a user
   */
  getUserJobs(userId: string): BatchJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Cancel a pending or processing job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'pending' || job.status === 'processing') {
      job.status = 'cancelled';
      job.completedAt = new Date();
      
      // Remove from queue
      this.queue = this.queue.filter(id => id !== jobId);
      
      // Emit cancellation event
      this.emit('job:cancelled', { jobId });
      
      return true;
    }
    
    return false;
  }

  /**
   * Start processing queued jobs
   */
  private startProcessingLoop() {
    setInterval(() => {
      if (!this.processing && this.currentProcessingCount < this.maxConcurrentJobs) {
        this.processNextJob();
      }
    }, 1000); // Check every second
  }

  /**
   * Process the next job in queue
   */
  private async processNextJob() {
    if (this.queue.length === 0 || this.currentProcessingCount >= this.maxConcurrentJobs) {
      return;
    }

    const jobId = this.queue.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'pending') return;

    this.currentProcessingCount++;
    await this.processJob(job);
    this.currentProcessingCount--;
  }

  /**
   * Process a single batch job
   */
  private async processJob(job: BatchJob) {
    job.status = 'processing';
    job.startedAt = new Date();
    
    // Emit processing started event
    this.emit('job:started', { jobId: job.id });

    try {
      // Process requests in chunks for better performance
      const chunkSize = 5; // Process 5 items at a time
      const chunks = this.chunkArray(job.requests, chunkSize);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Check if job was cancelled
        if (job.status === 'cancelled') {
          break;
        }
        
        // Process chunk in parallel
        const chunkPromises = chunk.map(async (request, index) => {
          const itemIndex = i * chunkSize + index;
          try {
            const response = await this.aiService.process(request);
            job.results.set(`${itemIndex}`, response);
            job.completedItems++;
          } catch (error) {
            const aiError: AIError = {
              code: 'PROCESSING_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error',
              retryable: true
            };
            job.errors.set(`${itemIndex}`, aiError);
            job.completedItems++;
          }
        });

        await Promise.all(chunkPromises);
        
        // Update progress
        job.progress = Math.round((job.completedItems / job.totalItems) * 100);
        
        // Emit progress event
        this.emit('job:progress', {
          jobId: job.id,
          progress: job.progress,
          completedItems: job.completedItems,
          totalItems: job.totalItems
        });
      }

      // Mark job as completed
      job.status = job.errors.size > 0 ? 'completed' : 'completed';
      job.completedAt = new Date();
      
      // Emit completion event
      this.emit('job:completed', {
        jobId: job.id,
        successCount: job.results.size,
        failureCount: job.errors.size
      });

    } catch (error) {
      // Handle job-level failure
      job.status = 'failed';
      job.completedAt = new Date();
      
      // Retry if possible
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = 'pending';
        job.completedAt = undefined;
        this.enqueueJob(job.id, job.priority);
        
        // Emit retry event
        this.emit('job:retry', {
          jobId: job.id,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries
        });
      } else {
        // Emit failure event
        this.emit('job:failed', {
          jobId: job.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Enqueue a job based on priority
   */
  private enqueueJob(jobId: string, priority: 'low' | 'normal' | 'high') {
    // Find insertion point based on priority
    let insertIndex = this.queue.length;
    
    if (priority === 'high') {
      insertIndex = 0;
    } else if (priority === 'normal') {
      // Insert after high priority jobs
      for (let i = 0; i < this.queue.length; i++) {
        const job = this.jobs.get(this.queue[i]);
        if (job && job.priority !== 'high') {
          insertIndex = i;
          break;
        }
      }
    }
    
    this.queue.splice(insertIndex, 0, jobId);
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get batch processing result
   */
  async getBatchResult(jobId: string): Promise<BatchResult | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const processingTime = job.completedAt && job.startedAt
      ? job.completedAt.getTime() - job.startedAt.getTime()
      : 0;

    const results: Record<string, AIResponse> = {};
    const errors: Record<string, AIError> = {};

    job.results.forEach((value, key) => {
      results[key] = value;
    });

    job.errors.forEach((value, key) => {
      errors[key] = value;
    });

    return {
      jobId: job.id,
      status: job.status === 'completed' 
        ? (job.errors.size === 0 ? 'completed' : 'partial')
        : 'failed',
      totalProcessed: job.completedItems,
      successCount: job.results.size,
      failureCount: job.errors.size,
      results,
      errors,
      processingTime
    };
  }

  /**
   * Clean up old completed jobs (housekeeping)
   */
  cleanupOldJobs(olderThanHours: number = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    for (const [jobId, job] of this.jobs) {
      if (job.completedAt && job.completedAt.getTime() < cutoffTime) {
        this.jobs.delete(jobId);
      }
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const stats = {
      totalJobs: this.jobs.size,
      pendingJobs: 0,
      processingJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      cancelledJobs: 0,
      queueLength: this.queue.length,
      currentProcessing: this.currentProcessingCount
    };

    for (const job of this.jobs.values()) {
      switch (job.status) {
        case 'pending':
          stats.pendingJobs++;
          break;
        case 'processing':
          stats.processingJobs++;
          break;
        case 'completed':
          stats.completedJobs++;
          break;
        case 'failed':
          stats.failedJobs++;
          break;
        case 'cancelled':
          stats.cancelledJobs++;
          break;
      }
    }

    return stats;
  }
}