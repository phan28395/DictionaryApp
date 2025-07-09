#!/usr/bin/env node

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test utilities
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let passedTests = 0;
let failedTests = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    await fn();
    passedTests++;
    log(`✓ ${name}`, colors.green);
  } catch (error) {
    failedTests++;
    log(`✗ ${name}`, colors.red);
    log(`  Error: ${error.message}`, colors.red);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test cases
async function runTests() {
  log('\n🧪 Search Suggestions Test Suite\n', colors.blue);

  // Test 1: Basic search suggestions
  await test('Basic search suggestions', async () => {
    const response = await fetch(`${API_BASE_URL}/search/suggestions?q=hel&limit=5`);
    assert(response.ok, 'Response should be OK');
    
    const data = await response.json();
    assert(data.suggestions, 'Should have suggestions array');
    assert(data.suggestions.length > 0, 'Should return suggestions');
    assert(data.suggestions.length <= 5, 'Should respect limit');
    
    // Check first suggestion structure
    const first = data.suggestions[0];
    assert(first.word, 'Suggestion should have word');
    assert(typeof first.relevance === 'number', 'Should have relevance score');
    assert(typeof first.isExactMatch === 'boolean', 'Should have isExactMatch flag');
  });

  // Test 2: Exact match detection
  await test('Exact match detection', async () => {
    const response = await fetch(`${API_BASE_URL}/search/suggestions?q=hello`);
    const data = await response.json();
    
    const exactMatch = data.suggestions.find(s => s.word.toLowerCase() === 'hello');
    assert(exactMatch, 'Should find exact match for "hello"');
    assert(exactMatch.isExactMatch === true, 'Should mark as exact match');
    assert(exactMatch.relevance === 1.0, 'Exact match should have relevance 1.0');
  });

  // Test 3: Fuzzy matching for typos
  await test('Fuzzy matching for typos', async () => {
    const typoTests = [
      { query: 'wrold', expected: 'world' },
      { query: 'helo', expected: 'hello' },
      { query: 'teh', expected: ['the', 'tech', 'they', 'them', 'ten'] }, // Accept any of these
      { query: 'becuase', expected: 'because' }
    ];

    for (const { query, expected } of typoTests) {
      const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${query}`);
      const data = await response.json();
      
      if (Array.isArray(expected)) {
        // For multiple acceptable answers
        const found = data.suggestions.some(s => 
          expected.includes(s.word.toLowerCase())
        );
        assert(found, `Should suggest one of [${expected.join(', ')}] for typo "${query}"`);
      } else {
        // For single expected answer
        const found = data.suggestions.some(s => s.word.toLowerCase() === expected);
        assert(found, `Should suggest "${expected}" for typo "${query}"`);
      }
    }
  });

  // Test 4: Prefix matching
  await test('Prefix matching', async () => {
    const response = await fetch(`${API_BASE_URL}/search/suggestions?q=comp`);
    const data = await response.json();
    
    const prefixMatches = data.suggestions.filter(s => 
      s.word.toLowerCase().startsWith('comp')
    );
    assert(prefixMatches.length > 0, 'Should find words starting with "comp"');
    
    // Check ordering - prefix matches should come first
    const firstNonPrefix = data.suggestions.findIndex(s => 
      !s.word.toLowerCase().startsWith('comp')
    );
    if (firstNonPrefix !== -1) {
      assert(prefixMatches.length <= firstNonPrefix, 
        'Prefix matches should appear before fuzzy matches');
    }
  });

  // Test 5: Empty query handling
  await test('Empty query handling', async () => {
    const response = await fetch(`${API_BASE_URL}/search/suggestions?q=`);
    assert(response.status === 400, 'Should return 400 for empty query');
  });

  // Test 6: Limit parameter
  await test('Limit parameter', async () => {
    const limits = [1, 5, 10, 50];
    
    for (const limit of limits) {
      const response = await fetch(`${API_BASE_URL}/search/suggestions?q=test&limit=${limit}`);
      const data = await response.json();
      
      assert(data.suggestions.length <= limit, 
        `Should respect limit of ${limit} (got ${data.suggestions.length})`);
    }
  });

  // Test 7: Autocomplete endpoint
  await test('Autocomplete endpoint', async () => {
    const response = await fetch(`${API_BASE_URL}/search/autocomplete?q=prog&limit=5`);
    assert(response.ok, 'Autocomplete response should be OK');
    
    const data = await response.json();
    assert(data.suggestions, 'Should have suggestions array');
    
    // All suggestions should be prefix matches for autocomplete
    for (const suggestion of data.suggestions) {
      assert(suggestion.word.toLowerCase().startsWith('prog'), 
        `Autocomplete should only return prefix matches (got ${suggestion.word})`);
    }
  });

  // Test 8: Contains search
  await test('Contains search', async () => {
    const response = await fetch(`${API_BASE_URL}/search/contains?substring=tion&limit=10`);
    assert(response.ok, 'Contains search response should be OK');
    
    const data = await response.json();
    assert(data.results, 'Should have results array');
    
    // All results should contain the substring
    for (const result of data.results) {
      assert(result.word.toLowerCase().includes('tion'), 
        `Word should contain "tion" (got ${result.word})`);
    }
  });

  // Test 9: Related words endpoint
  await test('Related words endpoint', async () => {
    const response = await fetch(`${API_BASE_URL}/search/related/happy`);
    assert(response.ok, 'Related words response should be OK');
    
    const data = await response.json();
    assert(data.word === 'happy', 'Should return the requested word');
    assert(Array.isArray(data.relatedWords), 'Should have relatedWords array');
    // Note: May be empty if dictionary doesn't have synonym data
  });

  // Test 10: Performance test
  await test('Performance - response time', async () => {
    const queries = ['test', 'hello', 'world', 'prog', 'comp'];
    const times = [];
    
    for (const query of queries) {
      const start = Date.now();
      await fetch(`${API_BASE_URL}/search/suggestions?q=${query}`);
      const time = Date.now() - start;
      times.push(time);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    assert(avgTime < 100, `Average response time should be < 100ms (got ${avgTime.toFixed(2)}ms)`);
  });

  // Test 11: Case insensitivity
  await test('Case insensitive search', async () => {
    const queries = ['HELLO', 'Hello', 'hello', 'HeLLo'];
    
    for (const query of queries) {
      const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${query}`);
      const data = await response.json();
      
      const found = data.suggestions.some(s => s.word.toLowerCase() === 'hello');
      assert(found, `Should find "hello" regardless of case (query: ${query})`);
    }
  });

  // Test 12: Special characters handling
  await test('Special characters handling', async () => {
    const specialQueries = ['test!', 'test@', 'test#', 'test$'];
    
    for (const query of specialQueries) {
      const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}`);
      assert(response.ok, `Should handle special character in: ${query}`);
    }
  });

  // Test 13: Part of speech data
  await test('Part of speech in suggestions', async () => {
    const response = await fetch(`${API_BASE_URL}/search/suggestions?q=run`);
    const data = await response.json();
    
    const withPOS = data.suggestions.filter(s => s.partOfSpeech && s.partOfSpeech.length > 0);
    assert(withPOS.length > 0, 'Some suggestions should include part of speech');
  });

  // Test 14: Relevance scoring
  await test('Relevance scoring order', async () => {
    const response = await fetch(`${API_BASE_URL}/search/suggestions?q=test`);
    const data = await response.json();
    
    // Check that suggestions are sorted by relevance (generally)
    for (let i = 1; i < data.suggestions.length; i++) {
      const current = data.suggestions[i];
      const previous = data.suggestions[i - 1];
      
      // Exact matches should always come first
      if (previous.isExactMatch && !current.isExactMatch) {
        assert(previous.relevance >= current.relevance, 
          'Exact matches should have higher relevance');
      }
    }
  });

  // Test 15: Error handling
  await test('Error handling - invalid limit', async () => {
    const response = await fetch(`${API_BASE_URL}/search/suggestions?q=test&limit=invalid`);
    assert(response.ok, 'Should handle invalid limit gracefully');
    
    const data = await response.json();
    assert(data.suggestions, 'Should still return suggestions with default limit');
  });

  // Summary
  log('\n📊 Test Summary', colors.blue);
  log(`✓ Passed: ${passedTests}`, colors.green);
  if (failedTests > 0) {
    log(`✗ Failed: ${failedTests}`, colors.red);
  }
  log(`Total: ${passedTests + failedTests}\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Check if API is running
async function checkAPI() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`);
    if (!response.ok) {
      throw new Error('API health check failed');
    }
  } catch (error) {
    log('❌ API is not running. Please start the API server first.', colors.red);
    log('Run: cd lightning-dictionary/api && npm run dev\n', colors.yellow);
    process.exit(1);
  }
}

// Run tests
(async () => {
  await checkAPI();
  await runTests();
})();