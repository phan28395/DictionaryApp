import { memo, useCallback, useEffect, useState } from 'react';
import { useKeyboardNavigation, useDefinitionNavigation } from '../hooks/useKeyboardNavigation';
import { performanceTracker } from '../utils/performance';
import '../styles/animations.css';

interface Definition {
  word: string;
  pronunciation?: string;
  pos: string;
  definitions: string[];
  frequency?: number;
}

interface KeyboardNavigablePopupProps {
  definition: Definition | null;
  onClose?: () => void;
}

export const KeyboardNavigablePopup = memo(({ definition, onClose }: KeyboardNavigablePopupProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const {
    selectedIndex,
    navigateUp,
    navigateDown,
    copyDefinition: copySelectedDefinition,
    setSelectedIndex
  } = useDefinitionNavigation(definition?.definitions || []);

  const handleCopy = useCallback(() => {
    if (selectedIndex >= 0) {
      copySelectedDefinition();
      setCopiedIndex(selectedIndex);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else if (definition) {
      // Copy all definitions if none selected
      const allText = `${definition.word}\n${definition.pos}\n\n${definition.definitions.join('\n')}`;
      navigator.clipboard.writeText(allText);
      setCopiedIndex(-1); // Special value for "all copied"
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  }, [selectedIndex, copySelectedDefinition, definition]);

  const handleCopyWord = useCallback(() => {
    if (definition) {
      navigator.clipboard.writeText(definition.word);
      // Show feedback
    }
  }, [definition]);

  const { containerRef } = useKeyboardNavigation({
    onEscape: onClose,
    onArrowUp: navigateUp,
    onArrowDown: navigateDown,
    onCopy: handleCopy,
    enableFocusTrap: true
  });

  useEffect(() => {
    if (definition) {
      setIsVisible(true);
      performanceTracker.mark('render-start');
      requestAnimationFrame(() => {
        performanceTracker.mark('render-complete');
      });
    }
  }, [definition]);

  if (!isVisible || !definition) {
    return null;
  }

  return (
    <div className="popup-overlay animate-fade-in" onClick={onClose}>
      <div 
        ref={containerRef}
        className="popup-content animate-spring hardware-accelerated"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          backgroundColor: '#1e1e1e',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Keyboard shortcuts hint */}
        <div 
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '3rem',
            fontSize: '0.75rem',
            color: '#666',
            display: 'flex',
            gap: '1rem'
          }}
        >
          <span>↑↓ Navigate</span>
          <span>Ctrl+C Copy</span>
          <span>Esc Close</span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="button-press"
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            background: 'transparent',
            border: 'none',
            color: '#888',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px'
          }}
          aria-label="Close popup"
        >
          ×
        </button>

        {/* Word header with copy button */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <h2 
            className="word"
            style={{
              margin: 0,
              fontSize: '1.8rem',
              fontWeight: 600,
              color: '#fff'
            }}
          >
            {definition.word}
          </h2>
          <button
            onClick={handleCopyWord}
            className="button-press color-transition"
            style={{
              background: 'transparent',
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              color: '#888',
              cursor: 'pointer'
            }}
            title="Copy word"
          >
            Copy
          </button>
        </div>

        {/* Part of speech */}
        <p style={{ 
          color: '#888',
          fontSize: '0.9rem',
          marginBottom: '1rem'
        }}>
          {definition.pos}
        </p>

        {/* Copy status message */}
        {copiedIndex !== null && (
          <div 
            className="animate-fade-in"
            style={{
              position: 'absolute',
              top: '3rem',
              right: '1rem',
              background: '#2d4a2b',
              color: '#90ee90',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontSize: '0.875rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            {copiedIndex === -1 ? 'All definitions copied!' : `Definition ${copiedIndex + 1} copied!`}
          </div>
        )}

        {/* Definitions with keyboard navigation */}
        <ul 
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}
          role="list"
        >
          {definition.definitions.map((def, idx) => (
            <li 
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`definition-item animate-slide-up ${
                selectedIndex === idx ? 'selected' : ''
              }`}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: selectedIndex === idx ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: `2px solid ${selectedIndex === idx ? '#4a9eff' : 'transparent'}`,
                animationDelay: `${idx * 50}ms`,
                opacity: 0,
                animationFillMode: 'forwards'
              }}
              role="option"
              aria-selected={selectedIndex === idx}
              tabIndex={0}
            >
              <span style={{ color: selectedIndex === idx ? '#fff' : '#ccc' }}>
                {idx + 1}. {def}
              </span>
            </li>
          ))}
        </ul>

        {/* Frequency rank */}
        {definition.frequency && (
          <div 
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #333',
              fontSize: '0.8rem',
              color: '#666'
            }}
          >
            Frequency rank: #{definition.frequency}
          </div>
        )}

        {/* Action buttons */}
        <div 
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={handleCopy}
            className="button-press color-transition"
            style={{
              background: '#2d4a2b',
              border: 'none',
              color: '#90ee90',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Copy {selectedIndex >= 0 ? 'Selected' : 'All'}
          </button>
          <button
            onClick={onClose}
            className="button-press color-transition"
            style={{
              background: '#444',
              border: 'none',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

KeyboardNavigablePopup.displayName = 'KeyboardNavigablePopup';