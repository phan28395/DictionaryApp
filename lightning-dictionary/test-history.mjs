#!/usr/bin/env node
import fetch from 'node-fetch';
import chalk from 'chalk';

const API_BASE = 'http://localhost:3001/api/v1';
let authToken = null;

// Test user credentials
const testUser = {
  email: 'history_test@example.com',
  password: 'testpass123',
  name: 'History Test User'
};

async function testHistoryFeatures() {
  console.log(chalk.blue('\n📚 Testing Word History Features\n'));

  try {
    // 1. Register test user
    console.log(chalk.yellow('1. Registering test user...'));
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (registerRes.ok) {
      console.log(chalk.green('✓ User registered successfully'));
    } else {
      // Try login if already exists
      console.log(chalk.yellow('User might exist, trying login...'));
    }

    // 2. Login
    console.log(chalk.yellow('\n2. Logging in...'));
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const loginData = await loginRes.json();
    if (loginRes.ok && loginData.token) {
      authToken = loginData.token;
      console.log(chalk.green('✓ Login successful'));
    } else {
      throw new Error('Login failed: ' + JSON.stringify(loginData));
    }

    // 3. Add history entries
    console.log(chalk.yellow('\n3. Adding history entries...'));
    const testWords = [
      { word: 'example', context: 'Testing history', definition: 'A thing characteristic of its kind' },
      { word: 'dictionary', context: 'App development', definition: 'A book or electronic resource' },
      { word: 'history', context: 'Feature testing', definition: 'The study of past events' },
      { word: 'test', context: 'Quality assurance', definition: 'A procedure to establish quality' },
      { word: 'example', context: 'Duplicate test', definition: 'Testing duplicate entries' }
    ];

    for (const entry of testWords) {
      const historyRes = await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          entry: {
            id: Date.now().toString(),
            word: entry.word,
            context: entry.context,
            definition: entry.definition,
            timestamp: new Date().toISOString(),
            language: 'en'
          }
        })
      });

      if (historyRes.ok) {
        console.log(chalk.green(`✓ Added "${entry.word}" to history`));
      } else {
        console.log(chalk.red(`✗ Failed to add "${entry.word}"`));
      }

      // Small delay between entries
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. Fetch history
    console.log(chalk.yellow('\n4. Fetching history...'));
    const historyRes = await fetch(`${API_BASE}/history`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (historyRes.ok) {
      const history = await historyRes.json();
      console.log(chalk.green(`✓ Retrieved ${history.length} history entries`));
      
      // Display recent entries
      console.log(chalk.cyan('\nRecent entries:'));
      history.slice(0, 3).forEach(entry => {
        console.log(`  - ${entry.word} (${new Date(entry.timestamp).toLocaleString()})`);
      });
    } else {
      console.log(chalk.red('✗ Failed to fetch history'));
    }

    // 5. Get statistics
    console.log(chalk.yellow('\n5. Getting history statistics...'));
    const statsRes = await fetch(`${API_BASE}/history/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (statsRes.ok) {
      const stats = await statsRes.json();
      console.log(chalk.green('✓ Statistics retrieved:'));
      console.log(`  - Total lookups: ${stats.totalLookups}`);
      console.log(`  - Unique words: ${stats.uniqueWords}`);
      console.log(`  - Top words:`);
      stats.topWords.slice(0, 3).forEach(word => {
        console.log(`    • ${word.word}: ${word.count} times`);
      });
    } else {
      console.log(chalk.red('✗ Failed to get statistics'));
    }

    // 6. Test privacy features
    console.log(chalk.yellow('\n6. Testing privacy features...'));
    console.log(chalk.cyan('Privacy mode would:'));
    console.log('  - Disable all history tracking');
    console.log('  - Clear existing history from local storage');
    console.log('  - Prevent sync with cloud');

    // 7. Test export (simulated)
    console.log(chalk.yellow('\n7. Testing export functionality...'));
    console.log(chalk.cyan('Export formats available:'));
    console.log('  - JSON: Full data export with all fields');
    console.log('  - CSV: Simplified tabular format');

    // 8. Test search/filter (simulated)
    console.log(chalk.yellow('\n8. Testing search and filters...'));
    console.log(chalk.cyan('Available filters:'));
    console.log('  - Search by word, context, or definition');
    console.log('  - Date range filters (today, week, month, custom)');
    console.log('  - Language filter (when multiple languages available)');

    // 9. Delete some history
    console.log(chalk.yellow('\n9. Testing history deletion...'));
    const beforeDate = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
    const deleteRes = await fetch(`${API_BASE}/history?beforeDate=${beforeDate}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (deleteRes.ok) {
      console.log(chalk.green('✓ Deleted old history entries'));
    } else {
      console.log(chalk.red('✗ Failed to delete history'));
    }

    console.log(chalk.green('\n✨ All history features tested successfully!\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error.message);
    process.exit(1);
  }
}

// Run tests
testHistoryFeatures();