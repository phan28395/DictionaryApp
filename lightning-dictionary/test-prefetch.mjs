#!/usr/bin/env node

/**
 * Test script to verify prefetch functionality and cache hit rate
 * 
 * This script simulates word lookups with patterns to test:
 * 1. Pattern recognition
 * 2. Prefetch effectiveness
 * 3. Cache hit rate improvement
 */

import { spawn } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test word sequences that simulate user patterns
const testSequences = [
  // Related words (synonyms/antonyms)
  ['happy', 'joyful', 'cheerful', 'sad', 'melancholy'],
  
  // Morphological variations
  ['run', 'running', 'runner', 'runs', 'ran'],
  
  // Sequential lookups (definitions contain references)
  ['define', 'definition', 'definitive', 'definitely'],
  
  // Technical terms in sequence
  ['algorithm', 'complexity', 'optimization', 'performance'],
  
  // Common word pairs
  ['cause', 'effect', 'reason', 'result', 'consequence']
];

// Statistics tracking
let stats = {
  totalLookups: 0,
  cacheHits: 0,
  cacheMisses: 0,
  prefetchStats: null,
  startTime: Date.now()
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPrefetchSystem() {
  console.log('🚀 Starting Prefetch System Test\n');
  console.log('This test will simulate user lookup patterns to measure cache effectiveness.\n');
  
  // First, ensure the API server is running
  console.log('📡 Checking API server...');
  try {
    const response = await fetch('http://localhost:3001/health');
    if (!response.ok) {
      console.error('❌ API server is not responding. Please start it first.');
      process.exit(1);
    }
    console.log('✅ API server is running\n');
  } catch (error) {
    console.error('❌ Cannot connect to API server at http://localhost:3001');
    console.error('   Please run: cd api && npm run dev');
    process.exit(1);
  }
  
  console.log('📊 Running lookup sequences...\n');
  
  for (let i = 0; i < testSequences.length; i++) {
    const sequence = testSequences[i];
    console.log(`\n🔤 Sequence ${i + 1}: ${sequence.join(' → ')}`);
    
    for (let j = 0; j < sequence.length; j++) {
      const word = sequence[j];
      const startTime = Date.now();
      
      try {
        // Simulate word lookup
        const response = await fetch(`http://localhost:3001/api/define/${word}`);
        const data = await response.json();
        const lookupTime = Date.now() - startTime;
        
        stats.totalLookups++;
        
        // Determine if it was a cache hit based on response time
        // Cache hits should be <5ms, API calls typically >20ms
        const isCacheHit = lookupTime < 5;
        
        if (isCacheHit) {
          stats.cacheHits++;
          console.log(`  ✓ ${word} (${lookupTime}ms) - CACHE HIT`);
        } else {
          stats.cacheMisses++;
          console.log(`  ○ ${word} (${lookupTime}ms) - Cache miss`);
        }
        
        // Simulate user reading time between lookups
        await delay(500 + Math.random() * 1000);
        
      } catch (error) {
        console.error(`  ✗ ${word} - Error: ${error.message}`);
      }
    }
    
    // Longer pause between sequences
    await delay(2000);
  }
  
  // Get prefetch statistics from the backend
  try {
    const response = await fetch('http://localhost:3001/api/prefetch/stats');
    if (response.ok) {
      stats.prefetchStats = await response.json();
    }
  } catch (error) {
    console.log('Could not fetch prefetch statistics');
  }
  
  // Display final statistics
  console.log('\n' + '='.repeat(50));
  console.log('📈 PREFETCH TEST RESULTS');
  console.log('='.repeat(50));
  
  const cacheHitRate = ((stats.cacheHits / stats.totalLookups) * 100).toFixed(1);
  const testDuration = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  
  console.log(`\nTotal lookups: ${stats.totalLookups}`);
  console.log(`Cache hits: ${stats.cacheHits}`);
  console.log(`Cache misses: ${stats.cacheMisses}`);
  console.log(`Cache hit rate: ${cacheHitRate}%`);
  console.log(`Test duration: ${testDuration}s`);
  
  if (stats.prefetchStats) {
    console.log(`\nPrefetch Statistics:`);
    console.log(`  Words prefetched: ${stats.prefetchStats.totalPrefetched || 0}`);
    console.log(`  Queue size: ${stats.prefetchStats.prefetchQueueSize || 0}`);
    console.log(`  Active prefetches: ${stats.prefetchStats.activePrefetches || 0}`);
  }
  
  // Evaluate success
  console.log('\n' + '='.repeat(50));
  if (parseFloat(cacheHitRate) >= 80) {
    console.log('✅ SUCCESS: Cache hit rate exceeds 80% target!');
  } else if (parseFloat(cacheHitRate) >= 60) {
    console.log('⚠️  PARTIAL: Cache hit rate is good but below 80% target');
  } else {
    console.log('❌ NEEDS IMPROVEMENT: Cache hit rate is below expectations');
  }
  
  console.log('\n💡 Tips for improving cache hit rate:');
  console.log('   - Ensure prefetch is enabled in settings');
  console.log('   - Try more predictable word sequences');
  console.log('   - Check that the Rust backend prefetch worker is running');
  console.log('   - Increase prefetch aggressiveness in settings');
}

// Interactive mode for manual testing
async function interactiveMode() {
  console.log('\n🎮 INTERACTIVE MODE');
  console.log('Type words to look up, or commands:');
  console.log('  stats - Show current statistics');
  console.log('  clear - Clear cache and reset stats');
  console.log('  exit - Exit the program\n');
  
  const askForWord = () => {
    rl.question('Word: ', async (input) => {
      if (input === 'exit') {
        rl.close();
        process.exit(0);
      } else if (input === 'stats') {
        const cacheHitRate = stats.totalLookups > 0 
          ? ((stats.cacheHits / stats.totalLookups) * 100).toFixed(1)
          : '0.0';
        console.log(`\nCache hit rate: ${cacheHitRate}% (${stats.cacheHits}/${stats.totalLookups})`);
      } else if (input === 'clear') {
        stats = {
          totalLookups: 0,
          cacheHits: 0,
          cacheMisses: 0,
          prefetchStats: null,
          startTime: Date.now()
        };
        console.log('Stats cleared!');
      } else if (input.trim()) {
        // Lookup the word
        const startTime = Date.now();
        try {
          const response = await fetch(`http://localhost:3001/api/define/${input}`);
          const lookupTime = Date.now() - startTime;
          stats.totalLookups++;
          
          if (lookupTime < 5) {
            stats.cacheHits++;
            console.log(`✓ Found in ${lookupTime}ms (CACHE HIT)`);
          } else {
            stats.cacheMisses++;
            console.log(`○ Found in ${lookupTime}ms (cache miss)`);
          }
        } catch (error) {
          console.error(`✗ Error: ${error.message}`);
        }
      }
      
      askForWord();
    });
  };
  
  askForWord();
}

// Main execution
async function main() {
  console.log('🧪 Lightning Dictionary - Prefetch System Test\n');
  
  console.log('Select test mode:');
  console.log('1. Automated test sequences');
  console.log('2. Interactive mode');
  console.log('3. Exit\n');
  
  rl.question('Choice (1-3): ', async (choice) => {
    switch (choice) {
      case '1':
        await testPrefetchSystem();
        rl.close();
        break;
      case '2':
        await interactiveMode();
        break;
      case '3':
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid choice');
        rl.close();
        process.exit(1);
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  rl.close();
  process.exit(0);
});

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});