import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create AI batch jobs table
  await knex.schema.createTable('ai_batch_jobs', (table) => {
    table.string('id').primary();
    table.integer('user_id').unsigned().nullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled']).notNullable();
    table.enum('priority', ['low', 'normal', 'high']).defaultTo('normal');
    
    table.integer('total_items').notNullable();
    table.integer('completed_items').defaultTo(0);
    table.integer('progress').defaultTo(0); // 0-100
    
    table.integer('retry_count').defaultTo(0);
    table.integer('max_retries').defaultTo(3);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('started_at').nullable();
    table.timestamp('completed_at').nullable();
    
    // Indexes for performance
    table.index(['user_id', 'created_at']);
    table.index(['status', 'priority']);
    table.index('created_at');
  });

  // Create AI job requests table (stores individual requests in a job)
  await knex.schema.createTable('ai_job_requests', (table) => {
    table.increments('id').primary();
    table.string('job_id').notNullable();
    table.foreign('job_id').references('id').inTable('ai_batch_jobs').onDelete('CASCADE');
    
    table.integer('request_index').notNullable(); // Position in batch
    table.string('word').notNullable();
    table.string('feature').notNullable();
    table.jsonb('context').nullable(); // Store request context
    
    table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
    table.jsonb('result').nullable(); // Store AI response
    table.jsonb('error').nullable(); // Store error details if failed
    
    table.timestamp('processed_at').nullable();
    
    // Indexes
    table.index(['job_id', 'request_index']);
    table.index(['job_id', 'status']);
  });

  // Create AI job events table for tracking progress
  await knex.schema.createTable('ai_job_events', (table) => {
    table.increments('id').primary();
    table.string('job_id').notNullable();
    table.foreign('job_id').references('id').inTable('ai_batch_jobs').onDelete('CASCADE');
    
    table.enum('event_type', [
      'created',
      'started',
      'progress',
      'completed',
      'failed',
      'cancelled',
      'retry'
    ]).notNullable();
    
    table.jsonb('event_data').nullable(); // Additional event details
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Index for querying job history
    table.index(['job_id', 'created_at']);
  });

  // Create AI metrics table for cost tracking and analytics
  await knex.schema.createTable('ai_metrics', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    table.string('provider').notNullable();
    table.string('feature').notNullable();
    table.decimal('cost', 10, 6).defaultTo(0); // Cost in USD
    table.integer('tokens_used').defaultTo(0);
    table.integer('response_time').notNullable(); // in milliseconds
    
    table.boolean('was_fallback').defaultTo(false);
    table.boolean('was_cached').defaultTo(false);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes for analytics
    table.index(['user_id', 'created_at']);
    table.index(['provider', 'feature']);
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_metrics');
  await knex.schema.dropTableIfExists('ai_job_events');
  await knex.schema.dropTableIfExists('ai_job_requests');
  await knex.schema.dropTableIfExists('ai_batch_jobs');
}