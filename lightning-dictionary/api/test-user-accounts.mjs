#!/usr/bin/env node
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api/v1';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPassword123!',
  display_name: 'Test User'
};

let authToken = null;

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/login')) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// Test functions
async function testRegister() {
  console.log('\n1. Testing user registration...');
  
  const { status, data } = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  if (status === 201) {
    console.log('✅ Registration successful');
    console.log('   User ID:', data.user.id);
    console.log('   Username:', data.user.username);
    console.log('   Email:', data.user.email);
    authToken = data.token;
  } else {
    console.log('❌ Registration failed:', data.error);
  }
  
  return status === 201;
}

async function testDuplicateRegister() {
  console.log('\n2. Testing duplicate registration prevention...');
  
  const { status, data } = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  if (status === 400) {
    console.log('✅ Duplicate registration prevented:', data.error);
  } else {
    console.log('❌ Duplicate registration not prevented');
  }
  
  return status === 400;
}

async function testLogin() {
  console.log('\n3. Testing user login...');
  
  const { status, data } = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: testUser.username,
      password: testUser.password
    })
  });
  
  if (status === 200) {
    console.log('✅ Login successful');
    console.log('   Token received:', data.token.substring(0, 20) + '...');
    authToken = data.token;
  } else {
    console.log('❌ Login failed:', data.error);
  }
  
  return status === 200;
}

async function testGetCurrentUser() {
  console.log('\n4. Testing get current user...');
  
  const { status, data } = await apiCall('/auth/me');
  
  if (status === 200) {
    console.log('✅ Current user retrieved');
    console.log('   User:', data.user.username);
    console.log('   Preferences:', JSON.stringify(data.user.preferences, null, 2));
  } else {
    console.log('❌ Failed to get current user:', data.error);
  }
  
  return status === 200;
}

async function testUpdatePreferences() {
  console.log('\n5. Testing update preferences...');
  
  const newPreferences = {
    theme: 'dark',
    fontSize: 'large',
    prefetchAggressiveness: 'high'
  };
  
  const { status, data } = await apiCall('/auth/preferences', {
    method: 'PUT',
    body: JSON.stringify(newPreferences)
  });
  
  if (status === 200) {
    console.log('✅ Preferences updated');
    console.log('   New preferences:', JSON.stringify(data.user.preferences, null, 2));
  } else {
    console.log('❌ Failed to update preferences:', data.error);
  }
  
  return status === 200;
}

async function testWordLookupWithHistory() {
  console.log('\n6. Testing word lookup with history tracking...');
  
  const words = ['example', 'test', 'run'];
  
  for (const word of words) {
    const { status, data } = await apiCall(`/define/enhanced/${word}`);
    
    if (status === 200) {
      console.log(`✅ Looked up word: ${word}`);
    } else {
      console.log(`❌ Failed to look up word: ${word}`);
    }
  }
  
  // Check history
  const { status, data } = await apiCall('/auth/history');
  
  if (status === 200) {
    console.log('✅ History retrieved');
    console.log('   History entries:', data.history.length);
    data.history.forEach(entry => {
      console.log(`   - ${entry.word} (looked up ${entry.frequency} time(s))`);
    });
  } else {
    console.log('❌ Failed to get history:', data.error);
  }
  
  return status === 200;
}

async function testLogout() {
  console.log('\n7. Testing logout...');
  
  const { status, data } = await apiCall('/auth/logout', {
    method: 'POST',
    body: '{}'
  });
  
  if (status === 200) {
    console.log('✅ Logout successful');
  } else {
    console.log('❌ Logout failed:', data.error);
  }
  
  // Try to access protected endpoint after logout
  const { status: status2 } = await apiCall('/auth/me');
  
  if (status2 === 401) {
    console.log('✅ Token invalidated after logout');
  } else {
    console.log('❌ Token still valid after logout');
  }
  
  return status === 200 && status2 === 401;
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting User Accounts API Tests');
  console.log('=====================================');
  
  try {
    // Check if API is running
    const healthCheck = await fetch(`${API_BASE.replace('/api/v1', '')}/health`);
    if (!healthCheck.ok) {
      console.error('❌ API server is not running. Please start it first.');
      process.exit(1);
    }
    
    const results = [];
    
    // Run tests in sequence
    results.push(await testRegister());
    results.push(await testDuplicateRegister());
    results.push(await testLogin());
    results.push(await testGetCurrentUser());
    results.push(await testUpdatePreferences());
    results.push(await testWordLookupWithHistory());
    results.push(await testLogout());
    
    // Summary
    console.log('\n=====================================');
    console.log('Test Summary:');
    const passed = results.filter(r => r).length;
    const failed = results.length - passed;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total: ${results.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Make sure the API server is running on port 3001');
  }
}

// Run the tests
runTests();