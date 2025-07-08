import React, { useState } from 'react';
import { EnhancedPopup } from './EnhancedPopup';

export const TestMultiDefinition: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [currentWord, setCurrentWord] = useState('example');
  const [testWords] = useState(['example', 'run', 'test', 'dictionary', 'definition']);

  const handleShowWord = (word: string) => {
    setCurrentWord(word);
    setShowPopup(true);
  };

  const handleWordClick = (word: string) => {
    console.log('Word clicked in popup:', word);
    setCurrentWord(word);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#f0f0f0' }}>
      <h1>Multi-Definition Display Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test Words:</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {testWords.map(word => (
            <button
              key={word}
              onClick={() => handleShowWord(word)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#60a5fa',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#60a5fa'}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Features to Test:</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✓ Multiple definitions grouped by part of speech</li>
          <li>✓ Expandable/collapsible POS sections</li>
          <li>✓ Clickable synonyms and related words</li>
          <li>✓ Navigation history with back/forward buttons</li>
          <li>✓ Keyboard shortcuts (Alt+←/→, Esc)</li>
          <li>✓ Performance metrics display</li>
          <li>✓ Smooth animations</li>
          <li>✓ Mock data for development</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Performance Target:</h2>
        <p>Response time should be &lt;50ms (check bottom of popup)</p>
      </div>

      {showPopup && (
        <EnhancedPopup
          initialWord={currentWord}
          onClose={() => setShowPopup(false)}
          onWordClick={handleWordClick}
        />
      )}
    </div>
  );
};