#!/usr/bin/env node

/**
 * AI Infrastructure Test Suite
 * Tests AI service endpoints, providers, and fallback mechanisms
 */

import { performance } from 'perf_hooks';

const API_BASE_URL = 'http://localhost:3456';
const TEST_WORDS = ['example', 'run', 'test', 'dictionary', 'artificial'];

// Test utilities
async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: response.status, data };
  } catch (error) {
    console.error(`Request failed for ${endpoint}:`, error.message);
    return { status: 0, error: error.message };
  }
}

function logTest(name, passed, details = '') {
  console.log(`${passed ? '✅' : '❌'} ${name}${details ? ` - ${details}` : ''}`);
}

function logSection(title) {
  console.log(`\n🔍 ${title}\n${'-'.repeat(50)}`);
}

// Test cases
async function testAIStatus() {
  logSection('Testing AI Service Status');
  
  const result = await makeRequest('/api/v1/ai/status');
  
  logTest('AI status endpoint accessible', result.status === 200);
  logTest('AI service available', result.data?.available === true);
  logTest('Features list returned', Array.isArray(result.data?.features));
  logTest('Provider information present', result.data?.provider !== undefined);
  
  if (result.data?.features) {
    console.log(`  Available features: ${result.data.features.join(', ')}`);
  }
  
  return result.status === 200;
}

async function testAIEnhancement() {
  logSection('Testing AI Enhancement');
  
  const testCases = [
    {
      name: 'Basic word enhancement',
      payload: {
        word: 'example',
        context: {
          surroundingSentence: 'This is an example of AI enhancement.'
        },
        features: {
          contextualDefinitions: true,
          difficultyAssessment: true
        }
      }
    },
    {
      name: 'Enhancement without context',
      payload: {
        word: 'test',
        features: {
          smartSummaries: true,
          usageExamples: true
        }
      }
    },
    {
      name: 'Etymology request',
      payload: {
        word: 'dictionary',
        features: {
          etymologyInsights: true
        }
      }
    }
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const start = performance.now();
    const result = await makeRequest('/api/v1/ai/enhance', {
      method: 'POST',
      body: JSON.stringify(testCase.payload)
    });
    const duration = (performance.now() - start).toFixed(2);
    
    const passed = result.status === 200 && result.data?.enhancement;
    allPassed = allPassed && passed;
    
    logTest(testCase.name, passed, `${duration}ms`);
    
    if (passed && result.data.enhancement) {
      const enhancement = result.data.enhancement;
      console.log(`  Word: ${enhancement.word}`);
      if (enhancement.contextualMeaning) {
        console.log(`  Contextual: ${enhancement.contextualMeaning.substring(0, 80)}...`);
      }
      if (enhancement.confidence) {
        console.log(`  Confidence: ${(enhancement.confidence * 100).toFixed(0)}%`);
      }
      if (enhancement.difficultyLevel) {
        console.log(`  Difficulty: ${enhancement.difficultyLevel}`);
      }
      if (result.data.status.fallbackMode) {
        console.log(`  ⚠️  Using fallback mode`);
      }
    }
  }
  
  return allPassed;
}

async function testBatchEnhancement() {
  logSection('Testing Batch Enhancement');
  
  const start = performance.now();
  const result = await makeRequest('/api/v1/ai/batch-enhance', {
    method: 'POST',
    body: JSON.stringify({
      words: TEST_WORDS.slice(0, 5),
      features: {
        difficultyAssessment: true
      }
    })
  });
  const duration = (performance.now() - start).toFixed(2);
  
  const passed = result.status === 200 && Array.isArray(result.data?.enhancements);
  logTest('Batch enhancement endpoint', passed, `${duration}ms`);
  
  if (passed) {
    const successful = result.data.enhancements.filter(e => e.success).length;
    console.log(`  Processed: ${result.data.enhancements.length} words`);
    console.log(`  Successful: ${successful}/${result.data.enhancements.length}`);
    console.log(`  Average time per word: ${(duration / result.data.enhancements.length).toFixed(2)}ms`);
  }
  
  // Test batch size limit
  const largeResult = await makeRequest('/api/v1/ai/batch-enhance', {
    method: 'POST',
    body: JSON.stringify({
      words: Array(15).fill('test')
    })
  });
  
  logTest('Batch size limit enforced', largeResult.status === 400);
  
  return passed;
}

async function testFallbackMechanisms() {
  logSection('Testing Fallback Mechanisms');
  
  // Test with invalid provider settings to trigger fallback
  const result = await makeRequest('/api/v1/ai/enhance', {
    method: 'POST',
    body: JSON.stringify({
      word: 'fallback',
      provider: 'invalid-provider',
      features: {
        contextualDefinitions: true
      }
    })
  });
  
  const passed = result.status === 200;
  logTest('Fallback mechanism works', passed);
  
  if (passed && result.data?.status) {
    console.log(`  Fallback mode: ${result.data.status.fallbackMode}`);
    console.log(`  Provider used: ${result.data.status.provider}`);
  }
  
  return passed;
}

async function testAIMetrics() {
  logSection('Testing AI Metrics');
  
  const result = await makeRequest('/api/v1/ai/metrics');
  
  const hasMetrics = result.status === 200 && result.data?.metrics;
  logTest('Metrics endpoint accessible', hasMetrics);
  
  if (hasMetrics) {
    const metrics = result.data.metrics;
    console.log(`  Total requests: ${metrics.totalRequests}`);
    console.log(`  Success rate: ${result.data.performance.successRate.toFixed(1)}%`);
    console.log(`  Fallback rate: ${result.data.performance.fallbackRate.toFixed(1)}%`);
    console.log(`  Avg response time: ${metrics.averageResponseTime.toFixed(2)}ms`);
    
    if (result.data.costEstimate) {
      console.log(`  Estimated daily cost: $${result.data.costEstimate.daily.toFixed(2)}`);
      console.log(`  Estimated monthly cost: $${result.data.costEstimate.monthly.toFixed(2)}`);
    }
  }
  
  return hasMetrics;
}

async function testErrorHandling() {
  logSection('Testing Error Handling');
  
  const testCases = [
    {
      name: 'Missing word parameter',
      payload: { features: {} },
      expectedStatus: 400
    },
    {
      name: 'Empty word',
      payload: { word: '', features: {} },
      expectedStatus: 400
    },
    {
      name: 'Invalid features object',
      payload: { word: 'test', features: 'invalid' },
      expectedStatus: 200 // Should still work with default features
    }
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const result = await makeRequest('/api/v1/ai/enhance', {
      method: 'POST',
      body: JSON.stringify(testCase.payload)
    });
    
    const passed = result.status === testCase.expectedStatus;
    allPassed = allPassed && passed;
    
    logTest(testCase.name, passed, `Expected ${testCase.expectedStatus}, got ${result.status}`);
  }
  
  return allPassed;
}

async function testFeedback() {
  logSection('Testing Feedback Submission');
  
  const result = await makeRequest('/api/v1/ai/feedback', {
    method: 'POST',
    body: JSON.stringify({
      word: 'test',
      enhancement: {
        contextualMeaning: 'Test enhancement'
      },
      rating: 4,
      comment: 'Good but could be more detailed'
    })
  });
  
  const passed = result.status === 200 && result.data?.feedbackId;
  logTest('Feedback submission', passed);
  
  if (passed) {
    console.log(`  Feedback ID: ${result.data.feedbackId}`);
  }
  
  return passed;
}

async function testCaching() {
  logSection('Testing AI Result Caching');
  
  const word = 'cache-test';
  const payload = {
    word,
    features: { contextualDefinitions: true }
  };
  
  // First request
  const start1 = performance.now();
  const result1 = await makeRequest('/api/v1/ai/enhance', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const duration1 = performance.now() - start1;
  
  // Second request (should be cached)
  const start2 = performance.now();
  const result2 = await makeRequest('/api/v1/ai/enhance', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const duration2 = performance.now() - start2;
  
  const cacheWorking = duration2 < duration1 * 0.5; // Cached should be at least 50% faster
  logTest('Caching improves performance', cacheWorking, 
    `First: ${duration1.toFixed(2)}ms, Cached: ${duration2.toFixed(2)}ms`);
  
  return result1.status === 200 && result2.status === 200;
}

// Main test runner
async function runTests() {
  console.log('🤖 AI Infrastructure Test Suite');
  console.log('================================\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  const tests = [
    testAIStatus,
    testAIEnhancement,
    testBatchEnhancement,
    testFallbackMechanisms,
    testAIMetrics,
    testErrorHandling,
    testFeedback,
    testCaching
  ];
  
  for (const test of tests) {
    totalTests++;
    try {
      const passed = await test();
      if (passed) passedTests++;
    } catch (error) {
      console.error(`\n❌ Test failed with error: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total test groups: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n✨ All AI infrastructure tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests
runTests().catch(console.error);