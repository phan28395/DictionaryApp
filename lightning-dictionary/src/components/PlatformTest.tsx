import React from 'react';
import { detectPlatform, getPlatformShortcuts, formatShortcut } from '../utils/platform';

export const PlatformTest: React.FC = () => {
  const platform = detectPlatform();
  const shortcuts = getPlatformShortcuts();
  
  return (
    <div style={{
      background: '#1a1a1a',
      padding: '20px',
      borderRadius: '8px',
      margin: '20px',
      color: '#fff'
    }}>
      <h3>Cross-Platform Test</h3>
      <p>Current Platform: <strong>{platform}</strong></p>
      
      <h4>Keyboard Shortcuts:</h4>
      <ul>
        <li>Open Dictionary: {formatShortcut(shortcuts.openDictionary)}</li>
        <li>Search Focus: {formatShortcut(shortcuts.searchFocus)}</li>
        <li>History Back: {formatShortcut(shortcuts.historyBack)}</li>
        <li>History Forward: {formatShortcut(shortcuts.historyForward)}</li>
        <li>Settings: {formatShortcut(shortcuts.settings)}</li>
      </ul>
      
      <h4>Platform Features:</h4>
      <ul>
        {platform === 'linux' && (
          <>
            <li>✓ GTK-style scrollbars</li>
            <li>✓ System theme detection</li>
            <li>✓ Ubuntu/Noto Sans fonts</li>
          </>
        )}
        {platform === 'macos' && (
          <>
            <li>✓ Font smoothing enabled</li>
            <li>✓ Vibrancy effects</li>
            <li>✓ Traffic light window controls</li>
          </>
        )}
        {platform === 'windows' && (
          <>
            <li>✓ Windows-style controls</li>
            <li>✓ High contrast support</li>
            <li>✓ Fluent design effects</li>
          </>
        )}
      </ul>
      
      <p style={{ marginTop: '20px', fontSize: '0.9em', opacity: 0.8 }}>
        Platform-specific styles have been applied. Check the scrollbars, fonts, and UI elements.
      </p>
    </div>
  );
};