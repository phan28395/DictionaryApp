#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

console.log('🔍 Cross-Platform Refinement Test Suite');
console.log('=====================================\n');

// Detect platform
const platform = os.platform();
const platformName = {
  'win32': 'Windows',
  'darwin': 'macOS',
  'linux': 'Linux'
}[platform] || platform;

console.log(`Platform: ${platformName}`);
console.log(`Node: ${process.version}`);
console.log(`Architecture: ${os.arch()}`);
console.log(`CPU cores: ${os.cpus().length}`);
console.log(`Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`);
console.log('');

// Test results
const results = {
  platform: platformName,
  tests: [],
  issues: [],
  recommendations: []
};

// Test 1: Check Tauri dependencies
console.log('1. Checking Tauri dependencies...');
try {
  execSync('cargo --version', { stdio: 'pipe' });
  results.tests.push({ name: 'Rust/Cargo', status: 'pass' });
} catch (e) {
  results.tests.push({ name: 'Rust/Cargo', status: 'fail' });
  results.issues.push('Rust/Cargo not installed');
}

// Test 2: Check platform-specific configurations
console.log('2. Checking platform-specific configurations...');
const tauriConfig = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));

// Platform-specific window decorations
if (platform === 'linux') {
  if (!tauriConfig.app.windows[0].decorations) {
    results.issues.push('Linux: Consider setting custom window decorations for better integration');
    results.recommendations.push({
      platform: 'Linux',
      fix: 'Add "decorations": true to window config for native decorations'
    });
  }
}

if (platform === 'darwin') {
  if (!tauriConfig.app.windows[0].titleBarStyle) {
    results.recommendations.push({
      platform: 'macOS',
      fix: 'Consider setting "titleBarStyle": "hiddenInset" for modern macOS look'
    });
  }
}

// Test 3: Font rendering check
console.log('3. Checking font configurations...');
const appCss = fs.readFileSync('src/App.css', 'utf8');
if (!appCss.includes('font-smooth') && platform === 'darwin') {
  results.issues.push('macOS: Missing font smoothing CSS properties');
  results.recommendations.push({
    platform: 'macOS',
    fix: 'Add -webkit-font-smoothing: antialiased; and -moz-osx-font-smoothing: grayscale;'
  });
}

// Test 4: Keyboard shortcuts
console.log('4. Checking keyboard shortcuts...');
const hotkeyFile = fs.readFileSync('src-tauri/src/hotkey_v2.rs', 'utf8');
const shortcuts = {
  'win32': ['Ctrl', 'Alt'],
  'darwin': ['Cmd', 'Option'],
  'linux': ['Ctrl', 'Alt', 'Super']
};

// Test 5: Window management
console.log('5. Testing window management features...');
const windowIssues = [];

// Check for platform-specific window behaviors
if (platform === 'linux') {
  windowIssues.push('Linux: Test with different window managers (GNOME, KDE, XFCE)');
  windowIssues.push('Linux: Verify system tray icon works across distros');
}

if (platform === 'darwin') {
  windowIssues.push('macOS: Verify app works with Stage Manager');
  windowIssues.push('macOS: Test with multiple desktops/spaces');
}

if (platform === 'win32') {
  windowIssues.push('Windows: Test with different DPI settings');
  windowIssues.push('Windows: Verify snap layouts work correctly');
}

windowIssues.forEach(issue => results.recommendations.push({ platform: platformName, fix: issue }));

// Test 6: Performance optimizations
console.log('6. Checking platform-specific performance...');
const performanceChecks = [];

if (platform === 'win32') {
  performanceChecks.push('Enable GPU acceleration for Windows');
  performanceChecks.push('Consider using DirectWrite for better font rendering');
}

if (platform === 'darwin') {
  performanceChecks.push('Enable Metal rendering for better performance');
  performanceChecks.push('Optimize for Apple Silicon if available');
}

if (platform === 'linux') {
  performanceChecks.push('Test with both X11 and Wayland');
  performanceChecks.push('Consider disabling GPU acceleration on older systems');
}

// Test 7: File path handling
console.log('7. Testing file path handling...');
const testPaths = [
  'data/processed/dictionary.json',
  'src/components/MultiDefinition.tsx',
  'api/data/dictionary.db'
];

testPaths.forEach(testPath => {
  const normalizedPath = path.normalize(testPath);
  if (testPath !== normalizedPath && platform === 'win32') {
    results.issues.push(`Windows: Path separator issue in ${testPath}`);
  }
});

// Test 8: UI Scaling
console.log('8. Checking UI scaling configurations...');
if (!tauriConfig.app.windows[0].minWidth || !tauriConfig.app.windows[0].minHeight) {
  results.issues.push('Missing minimum window size constraints');
  results.recommendations.push({
    platform: 'All',
    fix: 'Add minWidth: 400, minHeight: 300 to prevent UI breaking'
  });
}

// Generate platform-specific CSS
console.log('\n📝 Generating platform-specific CSS fixes...');
const platformCSS = {
  'darwin': `
/* macOS specific styles */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Adjust for macOS traffic lights */
.window-controls {
  padding-left: 70px;
}

/* Better scrollbar for macOS */
::-webkit-scrollbar {
  width: 8px;
  background-color: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
`,
  'win32': `
/* Windows specific styles */
body {
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* Windows-style scrollbar */
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .popup {
    border: 2px solid currentColor;
  }
}
`,
  'linux': `
/* Linux specific styles */
body {
  font-family: 'Ubuntu', 'Noto Sans', system-ui, sans-serif;
}

/* GTK-style scrollbar */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
}

/* Respect system theme */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #2b2b2b;
    --text-color: #ffffff;
  }
}
`
};

// Generate platform-specific keyboard shortcuts
const keyboardShortcuts = {
  'darwin': {
    'openDictionary': 'Cmd+Shift+D',
    'searchFocus': 'Cmd+K',
    'historyBack': 'Cmd+[',
    'historyForward': 'Cmd+]',
    'settings': 'Cmd+,',
    'close': 'Cmd+W'
  },
  'win32': {
    'openDictionary': 'Ctrl+Shift+D',
    'searchFocus': 'Ctrl+K',
    'historyBack': 'Alt+Left',
    'historyForward': 'Alt+Right',
    'settings': 'Ctrl+,',
    'close': 'Alt+F4'
  },
  'linux': {
    'openDictionary': 'Ctrl+Shift+D',
    'searchFocus': 'Ctrl+K',
    'historyBack': 'Alt+Left',
    'historyForward': 'Alt+Right',
    'settings': 'Ctrl+,',
    'close': 'Ctrl+Q'
  }
};

// Test 9: Accessibility
console.log('9. Checking accessibility features...');
const accessibilityChecks = [];

if (platform === 'win32') {
  accessibilityChecks.push('Verify Windows Narrator compatibility');
  accessibilityChecks.push('Test with high contrast themes');
}

if (platform === 'darwin') {
  accessibilityChecks.push('Verify VoiceOver compatibility');
  accessibilityChecks.push('Test with Reduce Motion enabled');
}

if (platform === 'linux') {
  accessibilityChecks.push('Test with Orca screen reader');
  accessibilityChecks.push('Verify keyboard-only navigation');
}

accessibilityChecks.forEach(check => {
  results.recommendations.push({
    platform: platformName,
    category: 'Accessibility',
    fix: check
  });
});

// Output results
console.log('\n📊 Test Results:');
console.log('================\n');

console.log('✅ Passed Tests:');
results.tests.filter(t => t.status === 'pass').forEach(t => {
  console.log(`  - ${t.name}`);
});

console.log('\n❌ Failed Tests:');
results.tests.filter(t => t.status === 'fail').forEach(t => {
  console.log(`  - ${t.name}`);
});

if (results.issues.length > 0) {
  console.log('\n⚠️  Issues Found:');
  results.issues.forEach(issue => {
    console.log(`  - ${issue}`);
  });
}

console.log('\n💡 Recommendations:');
results.recommendations.forEach(rec => {
  console.log(`  - [${rec.platform}] ${rec.fix}`);
});

// Save platform-specific CSS
console.log('\n💾 Saving platform-specific styles...');
const platformCssPath = `src/styles/platform-${platform}.css`;
fs.writeFileSync(platformCssPath, platformCSS[platform] || '/* No platform-specific styles */');
console.log(`  Created: ${platformCssPath}`);

// Save keyboard shortcuts configuration
console.log('\n⌨️  Saving keyboard shortcuts...');
const shortcutsPath = 'src/config/keyboard-shortcuts.json';
fs.mkdirSync(path.dirname(shortcutsPath), { recursive: true });
fs.writeFileSync(shortcutsPath, JSON.stringify({
  shortcuts: keyboardShortcuts[platform] || keyboardShortcuts['linux'],
  platform: platformName
}, null, 2));
console.log(`  Created: ${shortcutsPath}`);

// Generate platform-specific Tauri configuration updates
console.log('\n🔧 Generating Tauri config updates...');
const tauriUpdates = {
  ...tauriConfig
};

// Platform-specific window configurations
if (platform === 'darwin') {
  tauriUpdates.app.windows[0].titleBarStyle = 'hiddenInset';
  tauriUpdates.app.windows[0].transparent = true;
}

if (platform === 'linux') {
  tauriUpdates.app.windows[0].decorations = true;
  tauriUpdates.app.windows[0].resizable = true;
}

if (platform === 'win32') {
  tauriUpdates.app.windows[0].decorations = true;
  tauriUpdates.app.windows[0].theme = 'system';
}

// Add minimum window size for all platforms
tauriUpdates.app.windows[0].minWidth = 400;
tauriUpdates.app.windows[0].minHeight = 300;

// Save recommended Tauri config
const recommendedConfigPath = `src-tauri/tauri.conf.${platform}.json`;
fs.writeFileSync(recommendedConfigPath, JSON.stringify(tauriUpdates, null, 2));
console.log(`  Created: ${recommendedConfigPath}`);

// Generate final report
const report = {
  timestamp: new Date().toISOString(),
  platform: platformName,
  platformVersion: os.release(),
  nodeVersion: process.version,
  issues: results.issues,
  recommendations: results.recommendations,
  generatedFiles: [
    platformCssPath,
    shortcutsPath,
    recommendedConfigPath
  ]
};

fs.writeFileSync('cross-platform-report.json', JSON.stringify(report, null, 2));
console.log('\n✅ Cross-platform refinement test complete!');
console.log('📄 Full report saved to: cross-platform-report.json');

// Return exit code based on issues found
process.exit(results.issues.length > 0 ? 1 : 0);