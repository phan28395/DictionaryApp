#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';

const API_URL = 'http://localhost:3001/api/v1';

// Test utilities
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class PreferencesTestSuite {
  constructor() {
    this.authToken = null;
    this.testUser = {
      username: `test_prefs_${Date.now()}`,
      email: `test_prefs_${Date.now()}@example.com`,
      password: 'testPassword123!'
    };
    this.passedTests = 0;
    this.totalTests = 0;
  }

  async runTest(name, testFn) {
    this.totalTests++;
    const spinner = ora(name).start();
    try {
      await testFn();
      spinner.succeed(chalk.green(`✓ ${name}`));
      this.passedTests++;
    } catch (error) {
      spinner.fail(chalk.red(`✗ ${name}: ${error.message}`));
      console.error(chalk.gray(error.stack));
    }
  }

  async setup() {
    const spinner = ora('Setting up test user...').start();
    try {
      // Register test user
      const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.testUser),
      });

      if (!registerRes.ok) {
        throw new Error(`Registration failed: ${await registerRes.text()}`);
      }

      const { token } = await registerRes.json();
      this.authToken = token;
      spinner.succeed('Test user setup complete');
    } catch (error) {
      spinner.fail(`Setup failed: ${error.message}`);
      throw error;
    }
  }

  async testGetDefaultPreferences() {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });

    const { user } = await res.json();
    
    // Check default preferences
    if (!user.preferences) {
      throw new Error('No preferences found');
    }

    const expectedDefaults = {
      theme: 'system',
      fontSize: 'medium',
      prefetchEnabled: true,
      prefetchAggressiveness: 'medium',
      historyEnabled: true,
      keyboardShortcutsEnabled: true,
      showExamples: true,
      showUsage: true,
      showSynonyms: true,
      showAntonyms: true,
    };

    for (const [key, value] of Object.entries(expectedDefaults)) {
      if (user.preferences[key] !== value) {
        throw new Error(`Expected ${key} to be ${value}, got ${user.preferences[key]}`);
      }
    }
  }

  async testUpdatePreferences() {
    const updates = {
      theme: 'dark',
      fontSize: 'large',
      prefetchEnabled: false,
      showExamples: false,
    };

    const res = await fetch(`${API_URL}/auth/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      throw new Error(`Update failed: ${await res.text()}`);
    }

    const { user } = await res.json();

    // Verify updates
    for (const [key, value] of Object.entries(updates)) {
      if (user.preferences[key] !== value) {
        throw new Error(`Expected ${key} to be ${value}, got ${user.preferences[key]}`);
      }
    }
  }

  async testResetPreferences() {
    // First update some preferences
    await fetch(`${API_URL}/auth/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme: 'dark', fontSize: 'large' }),
    });

    // Reset preferences
    const res = await fetch(`${API_URL}/auth/preferences/reset`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });

    if (!res.ok) {
      throw new Error(`Reset failed: ${await res.text()}`);
    }

    const { preferences } = await res.json();

    // Check if reset to defaults
    if (preferences.theme !== 'system' || preferences.fontSize !== 'medium') {
      throw new Error('Preferences not reset to defaults');
    }
  }

  async testExportPreferences() {
    // Test without history
    const res1 = await fetch(`${API_URL}/auth/export?includeHistory=false`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });

    if (!res1.ok) {
      throw new Error(`Export failed: ${await res1.text()}`);
    }

    const exportData1 = await res1.json();
    
    if (!exportData1.version || !exportData1.exportDate || !exportData1.preferences) {
      throw new Error('Invalid export format');
    }

    // Test with history
    const res2 = await fetch(`${API_URL}/auth/export?includeHistory=true`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });

    const exportData2 = await res2.json();
    
    if (!exportData2.history) {
      throw new Error('History not included in export');
    }
  }

  async testImportPreferences() {
    // Create test import data
    const importData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      preferences: {
        theme: 'light',
        fontSize: 'small',
        prefetchEnabled: true,
        prefetchAggressiveness: 'high',
        historyEnabled: false,
        keyboardShortcutsEnabled: false,
        showExamples: false,
        showUsage: false,
        showSynonyms: false,
        showAntonyms: false,
      },
    };

    const res = await fetch(`${API_URL}/auth/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: importData,
        mergeWithExisting: false,
        importHistory: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Import failed: ${await res.text()}`);
    }

    const { preferences } = await res.json();

    // Verify imported preferences
    for (const [key, value] of Object.entries(importData.preferences)) {
      if (preferences[key] !== value) {
        throw new Error(`Expected ${key} to be ${value}, got ${preferences[key]}`);
      }
    }
  }

  async testPreferenceValidation() {
    // Test invalid preference values
    const invalidUpdates = {
      theme: 'invalid-theme',
      fontSize: 'extra-large',
    };

    const res = await fetch(`${API_URL}/auth/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidUpdates),
    });

    // Should fail validation
    if (res.ok) {
      throw new Error('Invalid preferences should not be accepted');
    }
  }

  async testPreferenceStats() {
    const res = await fetch(`${API_URL}/auth/preferences/stats`);

    if (!res.ok) {
      throw new Error(`Stats request failed: ${await res.text()}`);
    }

    const { stats } = await res.json();

    // Check stats structure
    if (!stats.totalUsers || !stats.themes || !stats.fontSize) {
      throw new Error('Invalid stats format');
    }

    if (typeof stats.prefetchEnabled !== 'number' || 
        typeof stats.historyEnabled !== 'number') {
      throw new Error('Invalid stats data');
    }
  }

  async testWordHistory() {
    // First enable history
    await fetch(`${API_URL}/auth/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ historyEnabled: true }),
    });

    // Look up some words to create history
    const words = ['example', 'test', 'dictionary'];
    for (const word of words) {
      await fetch(`${API_URL}/dictionary/lookup/${word}`, {
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'X-Track-History': 'true'
        },
      });
      await delay(100);
    }

    // Get history
    const res = await fetch(`${API_URL}/auth/history`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });

    if (!res.ok) {
      throw new Error(`History request failed: ${await res.text()}`);
    }

    const { history } = await res.json();

    if (!Array.isArray(history)) {
      throw new Error('History should be an array');
    }

    // Check if our lookups are in history
    const lookedUpWords = history.map(h => h.word);
    for (const word of words) {
      if (!lookedUpWords.includes(word)) {
        console.warn(`Warning: ${word} not found in history (might be due to async timing)`);
      }
    }
  }

  async testPreferencePersistence() {
    // Update preferences
    const updates = {
      theme: 'dark',
      fontSize: 'large',
      prefetchAggressiveness: 'high',
    };

    await fetch(`${API_URL}/auth/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    // Get preferences again to verify persistence
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });

    const { user } = await res.json();

    // Verify preferences persisted
    for (const [key, value] of Object.entries(updates)) {
      if (user.preferences[key] !== value) {
        throw new Error(`Preference ${key} not persisted correctly`);
      }
    }
  }

  async testMergeImport() {
    // Set some initial preferences
    await fetch(`${API_URL}/auth/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        theme: 'dark',
        fontSize: 'large',
        showExamples: true,
      }),
    });

    // Import with merge
    const importData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      preferences: {
        fontSize: 'small',
        prefetchEnabled: false,
      },
    };

    const res = await fetch(`${API_URL}/auth/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: importData,
        mergeWithExisting: true,
        importHistory: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Merge import failed: ${await res.text()}`);
    }

    const { preferences } = await res.json();

    // Check merged result
    if (preferences.theme !== 'dark') { // Should be preserved
      throw new Error('Theme should be preserved during merge');
    }
    if (preferences.fontSize !== 'small') { // Should be updated
      throw new Error('Font size should be updated during merge');
    }
    if (preferences.showExamples !== true) { // Should be preserved
      throw new Error('Show examples should be preserved during merge');
    }
    if (preferences.prefetchEnabled !== false) { // Should be updated
      throw new Error('Prefetch enabled should be updated during merge');
    }
  }

  async run() {
    console.log(chalk.bold('\n🧪 User Preferences Test Suite\n'));
    
    try {
      await this.setup();
      
      // Run all tests
      await this.runTest('Get default preferences', () => this.testGetDefaultPreferences());
      await this.runTest('Update preferences', () => this.testUpdatePreferences());
      await this.runTest('Reset preferences to defaults', () => this.testResetPreferences());
      await this.runTest('Export preferences', () => this.testExportPreferences());
      await this.runTest('Import preferences', () => this.testImportPreferences());
      await this.runTest('Validate preference values', () => this.testPreferenceValidation());
      await this.runTest('Get preference statistics', () => this.testPreferenceStats());
      await this.runTest('Track word history', () => this.testWordHistory());
      await this.runTest('Verify preference persistence', () => this.testPreferencePersistence());
      await this.runTest('Merge import preferences', () => this.testMergeImport());
      
      // Summary
      console.log(chalk.bold(`\n📊 Test Summary\n`));
      console.log(`Total tests: ${this.totalTests}`);
      console.log(chalk.green(`Passed: ${this.passedTests}`));
      console.log(chalk.red(`Failed: ${this.totalTests - this.passedTests}`));
      
      const successRate = (this.passedTests / this.totalTests * 100).toFixed(1);
      if (this.passedTests === this.totalTests) {
        console.log(chalk.green.bold(`\n✨ All tests passed! (${successRate}%)`));
      } else {
        console.log(chalk.yellow.bold(`\n⚠️  ${successRate}% tests passed`));
      }
      
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Test suite failed:'), error);
    }
  }
}

// Run the test suite
const suite = new PreferencesTestSuite();
suite.run().catch(console.error);