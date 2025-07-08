import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { MultiDefinition } from './MultiDefinition';
import { useDefinitions, usePrefetchDefinitions } from '../hooks/useDefinitions';
import { performanceTracker } from '../utils/performance';
import { scheduleAnimation } from '../utils/optimizations';
import './Popup.css';

interface EnhancedPopupProps {
  initialWord?: string;
  onClose?: () => void;
  onWordClick?: (word: string) => void;
}

export const EnhancedPopup = memo(({ initialWord, onClose, onWordClick }: EnhancedPopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { definition, isLoading, error, lookupWord, clearError } = useDefinitions({ 
    useMockData: process.env.NODE_ENV === 'development' 
  });
  const { prefetchWords } = usePrefetchDefinitions();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const animationScheduler = useRef(scheduleAnimation(() => {
    performanceTracker.mark('render-complete');
  }));

  // Handle initial word lookup
  useEffect(() => {
    if (initialWord) {
      performanceTracker.mark('lookup-start');
      lookupWord(initialWord);
      setNavigationHistory([initialWord]);
      setHistoryIndex(0);
    }
  }, [initialWord, lookupWord]);

  // Track render performance
  useEffect(() => {
    if (definition) {
      performanceTracker.mark('render-start');
      animationScheduler.current.schedule();
      
      // Prefetch related words
      if (definition.relatedWords && definition.relatedWords.length > 0) {
        prefetchWords(definition.relatedWords);
      }
    }

    return () => {
      animationScheduler.current.cancel();
    };
  }, [definition, prefetchWords]);

  // Handle word navigation
  const handleWordClick = useCallback((word: string) => {
    performanceTracker.mark('navigation-start');
    
    // Update navigation history
    const newHistory = [...navigationHistory.slice(0, historyIndex + 1), word];
    setNavigationHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Lookup the new word
    lookupWord(word);
    
    // Call parent handler if provided
    onWordClick?.(word);
  }, [navigationHistory, historyIndex, lookupWord, onWordClick]);

  // Navigation controls
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < navigationHistory.length - 1;

  const goBack = useCallback(() => {
    if (canGoBack) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      lookupWord(navigationHistory[newIndex]);
    }
  }, [canGoBack, historyIndex, navigationHistory, lookupWord]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      lookupWord(navigationHistory[newIndex]);
    }
  }, [canGoForward, historyIndex, navigationHistory, lookupWord]);

  // Keyboard handling
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose?.();
        break;
      case 'ArrowLeft':
        if (e.altKey) {
          e.preventDefault();
          goBack();
        }
        break;
      case 'ArrowRight':
        if (e.altKey) {
          e.preventDefault();
          goForward();
        }
        break;
    }
  }, [onClose, goBack, goForward]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Measure total render time
  useEffect(() => {
    if (definition && !isLoading) {
      const renderTime = performanceTracker.measure('lookup-time', 'lookup-start', 'render-complete');
      console.log(`Total render time: ${renderTime}ms`);
    }
  }, [definition, isLoading]);

  return (
    <div 
      ref={popupRef}
      className="popup-overlay enhanced-popup-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transform: 'translateZ(0)',
        willChange: 'opacity',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="enhanced-popup-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '85vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          transform: 'translateZ(0)',
          willChange: 'transform',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Navigation Bar */}
        <div className="popup-navigation" style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)'
        }}>
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="nav-button"
            aria-label="Go back"
            style={{
              background: 'none',
              border: 'none',
              color: canGoBack ? '#60a5fa' : '#444',
              cursor: canGoBack ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              padding: '4px 8px',
              marginRight: '8px'
            }}
          >
            ←
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className="nav-button"
            aria-label="Go forward"
            style={{
              background: 'none',
              border: 'none',
              color: canGoForward ? '#60a5fa' : '#444',
              cursor: canGoForward ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              padding: '4px 8px',
              marginRight: '16px'
            }}
          >
            →
          </button>
          
          <div className="navigation-breadcrumbs" style={{
            flex: 1,
            fontSize: '14px',
            color: '#808080',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {navigationHistory.slice(Math.max(0, historyIndex - 2), historyIndex + 1).map((word, idx, arr) => (
              <React.Fragment key={idx}>
                {idx > 0 && ' → '}
                <span style={{ color: idx === arr.length - 1 ? '#f0f0f0' : '#808080' }}>
                  {word}
                </span>
              </React.Fragment>
            ))}
          </div>

          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close popup"
            style={{
              background: 'none',
              border: 'none',
              color: '#f0f0f0',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px 8px',
              marginLeft: '16px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {isLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#808080'
            }}>
              <div className="loading-spinner">Loading...</div>
            </div>
          )}

          {error && (
            <div style={{
              padding: '20px',
              color: '#f87171',
              textAlign: 'center'
            }}>
              <p>{error}</p>
              <button
                onClick={clearError}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid #f87171',
                  borderRadius: '4px',
                  color: '#f87171',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          {definition && !isLoading && !error && (
            <MultiDefinition
              definition={definition}
              onWordClick={handleWordClick}
              expandAll={true}
            />
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '12px',
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Alt+← Back • Alt+→ Forward • Esc Close</span>
          {definition && (
            <span>Response time: {Math.round(performanceTracker.getLastMeasure('lookup-time') || 0)}ms</span>
          )}
        </div>
      </div>
    </div>
  );
});

EnhancedPopup.displayName = 'EnhancedPopup';