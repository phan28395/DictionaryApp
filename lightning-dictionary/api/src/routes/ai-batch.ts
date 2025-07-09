/**
 * AI Batch Processing Routes
 * Handles batch AI enhancement requests with job management
 */

import { FastifyInstance } from 'fastify';
import { BatchAIService, BatchOptions } from '../services/batch-ai-service';
import { AIJobStorage } from '../services/ai-job-storage';
import { AIRequest, AIFeature } from '../types/ai-context';
import { AIService } from '../services/ai-service';
import { MockAIProvider } from '../services/mock-ai-provider';
import { optionalAuthenticate } from '../middleware/auth';

// Initialize services
const aiService = new AIService();
const mockProvider = new MockAIProvider();
aiService.registerProvider('mock', mockProvider, { apiKey: 'mock-key' });

const batchService = new BatchAIService(aiService);
const jobStorage = new AIJobStorage();

// Listen to batch service events and persist to database
batchService.on('job:created', async ({ jobId }) => {
  const job = batchService.getJob(jobId);
  if (job) {
    await jobStorage.saveBatchJob(job);
    await jobStorage.saveJobEvent({
      job_id: jobId,
      event_type: 'created'
    });
  }
});

batchService.on('job:started', async ({ jobId }) => {
  const job = batchService.getJob(jobId);
  if (job) {
    await jobStorage.updateJobStatus(jobId, 'processing', {
      started_at: new Date()
    });
    await jobStorage.saveJobEvent({
      job_id: jobId,
      event_type: 'started'
    });
  }
});

batchService.on('job:progress', async ({ jobId, progress, completedItems }) => {
  await jobStorage.updateJobProgress(jobId, progress, completedItems);
  await jobStorage.saveJobEvent({
    job_id: jobId,
    event_type: 'progress',
    event_data: { progress, completedItems }
  });
});

batchService.on('job:completed', async ({ jobId, successCount, failureCount }) => {
  const job = batchService.getJob(jobId);
  if (job) {
    await jobStorage.updateJobStatus(jobId, 'completed', {
      completed_at: new Date()
    });
    await jobStorage.saveBatchJob(job); // Save final state
    await jobStorage.saveJobEvent({
      job_id: jobId,
      event_type: 'completed',
      event_data: { successCount, failureCount }
    });
  }
});

batchService.on('job:failed', async ({ jobId, error }) => {
  await jobStorage.updateJobStatus(jobId, 'failed', {
    completed_at: new Date()
  });
  await jobStorage.saveJobEvent({
    job_id: jobId,
    event_type: 'failed',
    event_data: { error }
  });
});

batchService.on('job:cancelled', async ({ jobId }) => {
  await jobStorage.updateJobStatus(jobId, 'cancelled', {
    completed_at: new Date()
  });
  await jobStorage.saveJobEvent({
    job_id: jobId,
    event_type: 'cancelled'
  });
});

batchService.on('job:retry', async ({ jobId, retryCount, maxRetries }) => {
  await jobStorage.saveJobEvent({
    job_id: jobId,
    event_type: 'retry',
    event_data: { retryCount, maxRetries }
  });
});

export async function aiBatchRoutes(server: FastifyInstance) {
  /**
   * POST /batch
   * Submit a batch of words for AI enhancement
   */
  server.post<{
    Body: {
      words: string[];
      features: Record<string, boolean>;
      options?: {
        priority?: 'low' | 'normal' | 'high';
        context?: any;
        notifyProgress?: boolean;
        maxRetries?: number;
      };
    };
  }>('/batch', { preHandler: optionalAuthenticate }, async (request, reply) => {
    try {
      const { words, features, options = {} } = request.body;

      // Validate input
      if (!Array.isArray(words) || words.length === 0) {
        reply.code(400);
        return { 
          error: 'Words array is required and must not be empty' 
        };
      }

      if (words.length > 100) {
        reply.code(400);
        return { 
          error: 'Maximum 100 words per batch' 
        };
      }

      if (!features || typeof features !== 'object') {
        reply.code(400);
        return { 
          error: 'Features object is required' 
        };
      }

      // Build AI requests from words and features
      const requests: AIRequest[] = [];
      
      for (const word of words) {
        for (const [feature, enabled] of Object.entries(features)) {
          if (enabled) {
            requests.push({
              word,
              feature: feature as AIFeature,
              context: options.context,
              userId: request.user?.userId?.toString()
            });
          }
        }
      }

      if (requests.length === 0) {
        reply.code(400);
        return { 
          error: 'No features selected' 
        };
      }

      // Submit batch job
      const batchOptions: BatchOptions = {
        priority: options.priority || 'normal',
        userId: request.user?.userId?.toString(),
        notifyProgress: options.notifyProgress !== false,
        maxRetries: options.maxRetries || 3
      };

      const jobId = await batchService.submitBatch(requests, batchOptions);

      return {
        jobId,
        totalItems: requests.length,
        status: 'pending',
        message: `Batch job submitted with ${requests.length} requests`
      };

    } catch (error) {
      request.log.error('Batch submission error:', error);
      reply.code(500);
      return { 
        error: 'Failed to submit batch job' 
      };
    }
  });

  /**
   * GET /batch/:jobId
   * Get batch job status and results
   */
  server.get<{
    Params: { jobId: string };
  }>('/batch/:jobId', { preHandler: optionalAuthenticate }, async (request, reply) => {
    try {
      const { jobId } = request.params;
      
      // First try to get from memory
      let job = batchService.getJob(jobId);
      
      // If not in memory, try to load from database
      if (!job) {
        job = await jobStorage.loadBatchJob(jobId);
      }

      if (!job) {
        reply.code(404);
        return { 
          error: 'Job not found' 
        };
      }

      // Check authorization
      if (request.user && job.userId && job.userId !== request.user.userId.toString()) {
        reply.code(403);
        return { 
          error: 'Unauthorized to access this job' 
        };
      }

      // Get batch result
      const result = await batchService.getBatchResult(jobId);
      
      return {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        totalItems: job.totalItems,
        completedItems: job.completedItems,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        priority: job.priority,
        result: result
      };

    } catch (error) {
      request.log.error('Get batch job error:', error);
      reply.code(500);
      return { 
        error: 'Failed to retrieve batch job' 
      };
    }
  });

  /**
   * GET /batch/:jobId/events
   * Get batch job events (progress updates)
   */
  server.get<{
    Params: { jobId: string };
  }>('/batch/:jobId/events', { preHandler: optionalAuthenticate }, async (request, reply) => {
    try {
      const { jobId } = request.params;
      
      // Check job exists and user has access
      const job = batchService.getJob(jobId) || await jobStorage.loadBatchJob(jobId);
      
      if (!job) {
        reply.code(404);
        return { 
          error: 'Job not found' 
        };
      }

      if (request.user && job.userId && job.userId !== request.user.userId.toString()) {
        reply.code(403);
        return { 
          error: 'Unauthorized to access this job' 
        };
      }

      const events = await jobStorage.getJobEvents(jobId);
      
      return {
        jobId,
        events
      };

    } catch (error) {
      request.log.error('Get job events error:', error);
      reply.code(500);
      return { 
        error: 'Failed to retrieve job events' 
      };
    }
  });

  /**
   * DELETE /batch/:jobId
   * Cancel a pending or processing batch job
   */
  server.delete<{
    Params: { jobId: string };
  }>('/batch/:jobId', { preHandler: optionalAuthenticate }, async (request, reply) => {
    try {
      const { jobId } = request.params;
      
      const job = batchService.getJob(jobId);
      
      if (!job) {
        reply.code(404);
        return { 
          error: 'Job not found' 
        };
      }

      // Check authorization
      if (request.user && job.userId && job.userId !== request.user.userId.toString()) {
        reply.code(403);
        return { 
          error: 'Unauthorized to cancel this job' 
        };
      }

      const cancelled = batchService.cancelJob(jobId);
      
      if (cancelled) {
        return {
          jobId,
          status: 'cancelled',
          message: 'Job cancelled successfully'
        };
      } else {
        reply.code(400);
        return { 
          error: 'Job cannot be cancelled (already completed or failed)' 
        };
      }

    } catch (error) {
      request.log.error('Cancel job error:', error);
      reply.code(500);
      return { 
        error: 'Failed to cancel job' 
      };
    }
  });

  /**
   * GET /batch
   * Get user's batch jobs
   */
  server.get<{
    Querystring: {
      limit?: string;
      offset?: string;
    };
  }>('/batch', { preHandler: optionalAuthenticate }, async (request, reply) => {
    try {
      if (!request.user) {
        reply.code(401);
        return { 
          error: 'Authentication required' 
        };
      }

      const limit = parseInt(request.query.limit || '50');
      const offset = parseInt(request.query.offset || '0');

      const jobs = await jobStorage.getUserJobs(
        request.user.userId.toString(), 
        limit, 
        offset
      );
      
      return {
        jobs,
        limit,
        offset
      };

    } catch (error) {
      request.log.error('Get user jobs error:', error);
      reply.code(500);
      return { 
        error: 'Failed to retrieve user jobs' 
      };
    }
  });

  /**
   * GET /batch/stats
   * Get batch processing statistics
   */
  server.get('/batch/stats', async (request, reply) => {
    try {
      const queueStats = batchService.getQueueStats();
      const jobStats = await jobStorage.getJobStats();
      
      return {
        queue: queueStats,
        jobs: jobStats,
        timestamp: new Date()
      };

    } catch (error) {
      request.log.error('Get stats error:', error);
      reply.code(500);
      return { 
        error: 'Failed to retrieve statistics' 
      };
    }
  });

  /**
   * GET /batch/metrics
   * Get user's AI usage metrics
   */
  server.get<{
    Querystring: {
      startDate?: string;
      endDate?: string;
    };
  }>('/batch/metrics', { preHandler: optionalAuthenticate }, async (request, reply) => {
    try {
      if (!request.user) {
        reply.code(401);
        return { 
          error: 'Authentication required' 
        };
      }

      const startDate = request.query.startDate ? new Date(request.query.startDate) : undefined;
      const endDate = request.query.endDate ? new Date(request.query.endDate) : undefined;

      const metrics = await jobStorage.getUserMetrics(
        request.user.userId.toString(),
        startDate,
        endDate
      );
      
      return {
        userId: request.user.userId,
        metrics,
        period: {
          start: startDate,
          end: endDate
        }
      };

    } catch (error) {
      request.log.error('Get metrics error:', error);
      reply.code(500);
      return { 
        error: 'Failed to retrieve metrics' 
      };
    }
  });
}

// Cleanup old jobs periodically
setInterval(async () => {
  try {
    const deleted = await jobStorage.cleanupOldJobs(30); // 30 days
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} old batch jobs`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 24 * 60 * 60 * 1000); // Run daily