#!/usr/bin/env node

/**
 * Test script for AI Batch Processing functionality
 * Tests job submission, progress tracking, cancellation, and metrics
 */

import axios from 'axios';
import { setTimeout } from 'timers/promises';

const API_BASE = 'http://localhost:3001/api/v1';
let authToken = null;
let userId = null;

// Test user credentials
const testUser = {
  username: 'batchtest',
  email: 'batchtest@example.com',
  password: 'batch123',
  display_name: 'Batch Test User'
};

// Utility function to make authenticated requests
const apiRequest = async (method, path, data = null) => {
  const config = {
    method,
    url: `${API_BASE}${path}`,
    headers: {}
  };
  
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API Error:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
async function registerAndLogin() {
  console.log('\n🔐 Setting up test user...');
  
  try {
    // Try to register
    await apiRequest('POST', '/auth/register', testUser);
    console.log('✅ Registered new test user');
  } catch (error) {
    if (error.response?.status === 409 || error.response?.status === 400) {
      console.log('ℹ️  User already exists, continuing...');
    } else {
      throw error;
    }
  }
  
  // Login
  const loginResponse = await apiRequest('POST', '/auth/login', {
    username: testUser.email, // Can use email as username
    password: testUser.password
  });
  
  authToken = loginResponse.token;
  userId = loginResponse.user.id;
  console.log('✅ Logged in successfully');
  
  return { authToken, userId };
}

async function testBatchSubmission() {
  console.log('\n📦 Testing batch job submission...');
  
  // Test 1: Submit a normal priority batch job
  const batch1 = await apiRequest('POST', '/ai/batch', {
    words: ['example', 'test', 'dictionary', 'enhance', 'batch'],
    features: {
      context_definition: true,
      smart_summary: true,
      difficulty_level: true
    },
    options: {
      priority: 'normal',
      context: {
        documentTitle: 'Test Document'
      }
    }
  });
  
  console.log('✅ Batch job submitted:', batch1.jobId);
  console.log('   Total items:', batch1.totalItems);
  
  // Test 2: Submit a high priority batch job
  const batch2 = await apiRequest('POST', '/ai/batch', {
    words: ['urgent', 'priority'],
    features: {
      etymology: true,
      related_concepts: true
    },
    options: {
      priority: 'high'
    }
  });
  
  console.log('✅ High priority batch submitted:', batch2.jobId);
  
  // Test 3: Try to submit invalid batch (too many words)
  try {
    await apiRequest('POST', '/ai/batch', {
      words: Array(101).fill('word'), // 101 words
      features: { smart_summary: true }
    });
    console.error('❌ Should have failed with too many words');
  } catch (error) {
    console.log('✅ Correctly rejected batch with too many words');
  }
  
  return { jobId1: batch1.jobId, jobId2: batch2.jobId };
}

async function testJobProgress(jobId) {
  console.log('\n📊 Testing job progress tracking...');
  
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max
  
  while (attempts < maxAttempts) {
    const job = await apiRequest('GET', `/ai/batch/${jobId}`);
    
    console.log(`   Status: ${job.status}, Progress: ${job.progress}%, Completed: ${job.completedItems}/${job.totalItems}`);
    
    if (job.status === 'completed' || job.status === 'failed') {
      console.log('✅ Job completed with status:', job.status);
      
      if (job.result) {
        const successCount = job.result.successCount || 0;
        const failureCount = job.result.failureCount || 0;
        console.log(`   Results: ${successCount} success, ${failureCount} failures`);
      }
      
      return job;
    }
    
    await setTimeout(1000); // Wait 1 second before checking again
    attempts++;
  }
  
  console.log('⏱️  Job still processing after 30 seconds');
  return null;
}

async function testJobEvents(jobId) {
  console.log('\n📋 Testing job event history...');
  
  const events = await apiRequest('GET', `/ai/batch/${jobId}/events`);
  
  console.log(`✅ Retrieved ${events.events.length} events for job ${jobId}`);
  
  // Display events
  for (const event of events.events) {
    const timestamp = new Date(event.created_at).toLocaleTimeString();
    console.log(`   [${timestamp}] ${event.event_type}`, 
      event.event_data ? JSON.stringify(event.event_data) : '');
  }
  
  return events;
}

async function testJobCancellation() {
  console.log('\n🚫 Testing job cancellation...');
  
  // Submit a low priority job with many items
  const job = await apiRequest('POST', '/ai/batch', {
    words: Array(20).fill('cancel').map((w, i) => `${w}${i}`),
    features: {
      context_definition: true,
      smart_summary: true,
      etymology: true,
      difficulty_level: true
    },
    options: {
      priority: 'low'
    }
  });
  
  console.log('✅ Submitted job for cancellation:', job.jobId);
  
  // Wait a moment then try to cancel
  await setTimeout(500);
  
  try {
    const result = await apiRequest('DELETE', `/ai/batch/${job.jobId}`);
    console.log('✅ Job cancelled successfully:', result.message);
    return true;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('ℹ️  Job already completed, cannot cancel');
      return false;
    }
    throw error;
  }
}

async function testUserJobs() {
  console.log('\n📚 Testing user job history...');
  
  const jobs = await apiRequest('GET', '/ai/batch?limit=10');
  
  console.log(`✅ Retrieved ${jobs.jobs.length} jobs for user`);
  
  // Display job summary
  for (const job of jobs.jobs) {
    const created = new Date(job.created_at).toLocaleString();
    console.log(`   Job ${job.id}: ${job.status} (${job.priority}) - ${job.total_items} items - ${created}`);
  }
  
  return jobs;
}

async function testBatchStats() {
  console.log('\n📈 Testing batch processing statistics...');
  
  const stats = await apiRequest('GET', '/ai/batch/stats');
  
  console.log('✅ Batch processing statistics:');
  console.log('   Queue:', JSON.stringify(stats.queue, null, 2));
  console.log('   Jobs:', JSON.stringify(stats.jobs, null, 2));
  
  return stats;
}

async function testUserMetrics() {
  console.log('\n💰 Testing user AI metrics...');
  
  const metrics = await apiRequest('GET', '/ai/batch/metrics');
  
  console.log('✅ User AI usage metrics:');
  console.log(`   Total cost: $${metrics.metrics.totalCost.toFixed(4)}`);
  console.log(`   Total requests: ${metrics.metrics.totalRequests}`);
  console.log(`   Average response time: ${metrics.metrics.averageResponseTime.toFixed(0)}ms`);
  console.log('   Feature usage:', metrics.metrics.featureUsage);
  console.log('   Provider usage:', metrics.metrics.providerUsage);
  
  return metrics;
}

async function testBatchProcessingFlow() {
  console.log('\n🔄 Testing complete batch processing flow...');
  
  // Submit a batch with various features
  const batchJob = await apiRequest('POST', '/ai/batch', {
    words: ['flow', 'process', 'queue', 'system', 'test'],
    features: {
      context_definition: true,
      smart_summary: true,
      difficulty_level: true,
      etymology: true,
      related_concepts: true
    },
    options: {
      priority: 'normal',
      context: {
        documentTitle: 'Batch Processing Test',
        domain: 'technology'
      }
    }
  });
  
  console.log('✅ Batch submitted:', batchJob.jobId);
  
  // Monitor progress
  await setTimeout(1000);
  const progress1 = await apiRequest('GET', `/ai/batch/${batchJob.jobId}`);
  console.log(`   Initial progress: ${progress1.progress}%`);
  
  // Wait for completion
  const completed = await testJobProgress(batchJob.jobId);
  
  if (completed && completed.result) {
    console.log('\n📝 Batch results:');
    const results = completed.result.results;
    const errors = completed.result.errors;
    
    // Display some results
    for (const [index, result] of Object.entries(results || {}).slice(0, 3)) {
      console.log(`   Word ${index}:`, result.feature, '-', 
        result.result?.summary || result.result?.level || 'processed');
    }
    
    if (Object.keys(errors || {}).length > 0) {
      console.log('   Errors:', errors);
    }
  }
  
  return completed;
}

// Main test execution
async function runTests() {
  console.log('🧪 AI Batch Processing Test Suite');
  console.log('=================================');
  
  try {
    // Setup
    await registerAndLogin();
    
    // Test batch submission
    const { jobId1, jobId2 } = await testBatchSubmission();
    
    // Test job progress tracking
    await testJobProgress(jobId1);
    
    // Test job events
    await testJobEvents(jobId1);
    
    // Test job cancellation
    await testJobCancellation();
    
    // Test user jobs listing
    await testUserJobs();
    
    // Test batch statistics
    await testBatchStats();
    
    // Test user metrics
    await testUserMetrics();
    
    // Test complete flow
    await testBatchProcessingFlow();
    
    console.log('\n✅ All batch processing tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
runTests();