/**
 * Performance test for multi-definition display
 * Tests that the new feature maintains <50ms response time
 */

const API_BASE = 'http://localhost:3456';
const TEST_WORDS = ['example', 'run', 'test', 'make', 'good', 'time', 'person', 'work', 'life', 'world'];

// Warm up the cache
async function warmCache() {
  console.log('🔥 Warming up cache...');
  for (const word of TEST_WORDS) {
    try {
      await fetch(`${API_BASE}/api/v1/define/enhanced/${word}`);
    } catch (err) {
      // Ignore errors during warmup
    }
  }
  console.log('✅ Cache warmed\n');
}

// Test single word lookup performance
async function testSingleLookup(word) {
  const start = process.hrtime.bigint();
  
  try {
    const response = await fetch(`${API_BASE}/api/v1/define/enhanced/${word}`);
    const data = await response.json();
    const end = process.hrtime.bigint();
    const timeMs = Number(end - start) / 1_000_000;
    
    return {
      word,
      success: data.success,
      time: timeMs,
      definitions: data.data?.totalDefinitions || 0,
      posGroups: data.data?.posGroups?.length || 0
    };
  } catch (error) {
    const end = process.hrtime.bigint();
    const timeMs = Number(end - start) / 1_000_000;
    
    return {
      word,
      success: false,
      time: timeMs,
      error: error.message
    };
  }
}

// Test batch lookup performance
async function testBatchLookup(words) {
  const start = process.hrtime.bigint();
  
  try {
    const response = await fetch(`${API_BASE}/api/v1/define/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words })
    });
    const data = await response.json();
    const end = process.hrtime.bigint();
    const timeMs = Number(end - start) / 1_000_000;
    
    return {
      success: data.success,
      time: timeMs,
      requested: data.requested,
      found: data.found
    };
  } catch (error) {
    const end = process.hrtime.bigint();
    const timeMs = Number(end - start) / 1_000_000;
    
    return {
      success: false,
      time: timeMs,
      error: error.message
    };
  }
}

// Run performance tests
async function runTests() {
  console.log('🚀 Multi-Definition Performance Test\n');
  console.log('Target: <50ms response time\n');
  
  // Test server connectivity
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error('Server not healthy');
    console.log('✅ API server is running\n');
  } catch (err) {
    console.error('❌ API server is not running. Please start it with: cd api && npm start');
    process.exit(1);
  }
  
  // Warm cache
  await warmCache();
  
  // Test individual lookups
  console.log('📊 Individual Lookup Tests:');
  console.log('─'.repeat(60));
  
  const results = [];
  for (const word of TEST_WORDS) {
    const result = await testSingleLookup(word);
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    const timeColor = result.time < 50 ? '\x1b[32m' : '\x1b[31m'; // Green if <50ms, red otherwise
    
    console.log(
      `${status} ${word.padEnd(10)} | ${timeColor}${result.time.toFixed(2)}ms\x1b[0m | ` +
      `${result.definitions || 0} defs | ${result.posGroups || 0} POS groups`
    );
  }
  
  console.log('─'.repeat(60));
  
  // Calculate statistics
  const successfulResults = results.filter(r => r.success);
  const times = successfulResults.map(r => r.time);
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
  
  console.log('\n📈 Performance Summary:');
  console.log(`   Average: ${avgTime.toFixed(2)}ms ${avgTime < 50 ? '✅' : '❌'}`);
  console.log(`   Min: ${minTime.toFixed(2)}ms`);
  console.log(`   Max: ${maxTime.toFixed(2)}ms`);
  console.log(`   P95: ${p95Time.toFixed(2)}ms`);
  console.log(`   Success Rate: ${(successfulResults.length / results.length * 100).toFixed(0)}%`);
  
  // Test batch lookup
  console.log('\n📦 Batch Lookup Test:');
  const batchResult = await testBatchLookup(TEST_WORDS);
  console.log(`   Time: ${batchResult.time.toFixed(2)}ms`);
  console.log(`   Words: ${batchResult.requested} requested, ${batchResult.found} found`);
  
  // Final verdict
  console.log('\n🎯 Final Verdict:');
  if (avgTime < 50 && p95Time < 100) {
    console.log('   ✅ PASS - Performance target achieved!');
    console.log('   Multi-definition display maintains <50ms response time');
  } else {
    console.log('   ❌ FAIL - Performance needs optimization');
    console.log('   Consider caching improvements or data structure optimization');
  }
}

// Run the tests
runTests().catch(console.error);