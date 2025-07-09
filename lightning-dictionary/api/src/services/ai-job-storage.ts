/**
 * AI Job Storage Service
 * Handles database persistence for batch AI jobs
 */

import { Knex } from 'knex';
import { db } from '../database/db';
import { BatchJob } from './batch-ai-service';
import { AIRequest, AIResponse, AIError } from '../types/ai-context';

export interface StoredBatchJob {
  id: string;
  user_id?: number;
  status: string;
  priority: string;
  total_items: number;
  completed_items: number;
  progress: number;
  retry_count: number;
  max_retries: number;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
}

export interface StoredJobRequest {
  id?: number;
  job_id: string;
  request_index: number;
  word: string;
  feature: string;
  context?: any;
  status: string;
  result?: any;
  error?: any;
  processed_at?: Date;
}

export interface JobEvent {
  job_id: string;
  event_type: string;
  event_data?: any;
  created_at?: Date;
}

export interface AIMetric {
  user_id?: number;
  provider: string;
  feature: string;
  cost: number;
  tokens_used: number;
  response_time: number;
  was_fallback: boolean;
  was_cached: boolean;
}

export class AIJobStorage {
  private db: Knex;

  constructor() {
    this.db = db;
  }

  /**
   * Save a batch job to the database
   */
  async saveBatchJob(job: BatchJob): Promise<void> {
    const storedJob: StoredBatchJob = {
      id: job.id,
      user_id: job.userId ? parseInt(job.userId) : undefined,
      status: job.status,
      priority: job.priority,
      total_items: job.totalItems,
      completed_items: job.completedItems,
      progress: job.progress,
      retry_count: job.retryCount,
      max_retries: job.maxRetries,
      created_at: job.createdAt,
      started_at: job.startedAt,
      completed_at: job.completedAt
    };

    await this.db('ai_batch_jobs').insert(storedJob).onConflict('id').merge();

    // Save individual requests
    const requests: StoredJobRequest[] = job.requests.map((req, index) => ({
      job_id: job.id,
      request_index: index,
      word: req.word,
      feature: req.feature,
      context: req.context,
      status: job.results.has(`${index}`) ? 'completed' : 
              job.errors.has(`${index}`) ? 'failed' : 'pending',
      result: job.results.get(`${index}`),
      error: job.errors.get(`${index}`),
      processed_at: job.results.has(`${index}`) || job.errors.has(`${index}`) 
        ? new Date() : undefined
    }));

    // Batch insert requests
    if (requests.length > 0) {
      await this.db('ai_job_requests')
        .insert(requests)
        .onConflict(['job_id', 'request_index'])
        .merge();
    }
  }

  /**
   * Load a batch job from the database
   */
  async loadBatchJob(jobId: string): Promise<BatchJob | null> {
    const storedJob = await this.db('ai_batch_jobs')
      .where('id', jobId)
      .first();

    if (!storedJob) return null;

    const requests = await this.db('ai_job_requests')
      .where('job_id', jobId)
      .orderBy('request_index');

    // Reconstruct the BatchJob object
    const job: BatchJob = {
      id: storedJob.id,
      userId: storedJob.user_id?.toString(),
      requests: requests.map(req => ({
        word: req.word,
        feature: req.feature,
        context: req.context,
        userId: storedJob.user_id?.toString()
      })),
      status: storedJob.status as any,
      progress: storedJob.progress,
      totalItems: storedJob.total_items,
      completedItems: storedJob.completed_items,
      results: new Map(
        requests
          .filter(req => req.status === 'completed' && req.result)
          .map(req => [`${req.request_index}`, req.result])
      ),
      errors: new Map(
        requests
          .filter(req => req.status === 'failed' && req.error)
          .map(req => [`${req.request_index}`, req.error])
      ),
      createdAt: storedJob.created_at,
      startedAt: storedJob.started_at || undefined,
      completedAt: storedJob.completed_at || undefined,
      priority: storedJob.priority as any,
      retryCount: storedJob.retry_count,
      maxRetries: storedJob.max_retries
    };

    return job;
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string, 
    status: string, 
    updates: Partial<StoredBatchJob> = {}
  ): Promise<void> {
    await this.db('ai_batch_jobs')
      .where('id', jobId)
      .update({
        status,
        ...updates
      });
  }

  /**
   * Update job progress
   */
  async updateJobProgress(
    jobId: string, 
    progress: number, 
    completedItems: number
  ): Promise<void> {
    await this.db('ai_batch_jobs')
      .where('id', jobId)
      .update({
        progress,
        completed_items: completedItems
      });
  }

  /**
   * Save job event
   */
  async saveJobEvent(event: JobEvent): Promise<void> {
    await this.db('ai_job_events').insert({
      job_id: event.job_id,
      event_type: event.event_type,
      event_data: JSON.stringify(event.event_data),
      created_at: event.created_at || new Date()
    });
  }

  /**
   * Get job events
   */
  async getJobEvents(jobId: string): Promise<JobEvent[]> {
    const events = await this.db('ai_job_events')
      .where('job_id', jobId)
      .orderBy('created_at', 'desc');

    return events.map(event => ({
      job_id: event.job_id,
      event_type: event.event_type,
      event_data: event.event_data ? JSON.parse(event.event_data) : null,
      created_at: event.created_at
    }));
  }

  /**
   * Get user jobs
   */
  async getUserJobs(
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<StoredBatchJob[]> {
    return await this.db('ai_batch_jobs')
      .where('user_id', parseInt(userId))
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  /**
   * Save AI metric
   */
  async saveMetric(metric: AIMetric): Promise<void> {
    await this.db('ai_metrics').insert(metric);
  }

  /**
   * Get user metrics
   */
  async getUserMetrics(
    userId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<{
    totalCost: number;
    totalRequests: number;
    averageResponseTime: number;
    featureUsage: Record<string, number>;
    providerUsage: Record<string, number>;
  }> {
    let query = this.db('ai_metrics')
      .where('user_id', parseInt(userId));

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }
    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }

    const metrics = await query;

    const result = {
      totalCost: 0,
      totalRequests: metrics.length,
      averageResponseTime: 0,
      featureUsage: {} as Record<string, number>,
      providerUsage: {} as Record<string, number>
    };

    let totalResponseTime = 0;

    for (const metric of metrics) {
      result.totalCost += parseFloat(metric.cost);
      totalResponseTime += metric.response_time;
      
      result.featureUsage[metric.feature] = 
        (result.featureUsage[metric.feature] || 0) + 1;
        
      result.providerUsage[metric.provider] = 
        (result.providerUsage[metric.provider] || 0) + 1;
    }

    if (metrics.length > 0) {
      result.averageResponseTime = totalResponseTime / metrics.length;
    }

    return result;
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.db('ai_batch_jobs')
      .where('completed_at', '<', cutoffDate)
      .whereIn('status', ['completed', 'failed', 'cancelled'])
      .delete();

    return result;
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  }> {
    const stats = await this.db('ai_batch_jobs')
      .select('status')
      .count('* as count')
      .groupBy('status');

    const result = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };

    for (const stat of stats) {
      const count = parseInt(stat.count as string);
      result.total += count;
      result[stat.status as keyof typeof result] = count;
    }

    return result;
  }
}