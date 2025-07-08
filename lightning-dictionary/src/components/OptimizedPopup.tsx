import { memo, useCallback, useEffect, useRef } from 'react';
import { performanceTracker } from '../utils/performance';
import { scheduleAnimation, useDefinitionFormatter } from '../utils/optimizations';

interface Definition {
  word: string;
  pronunciation?: string;
  pos: string;
  definitions: string[];
  frequency?: number;
}

interface OptimizedPopupProps {
  definition: Definition | null;
  onClose?: () => void;
}

// Memoized definition item component
const DefinitionItem = memo(({ text, index }: { text: string; index: number }) => (
  <li key={index}>{text}</li>
));

// Memoized header component
const PopupHeader = memo(({ word, pronunciation }: { word: string; pronunciation?: string }) => (
  <>
    <h2 className="word">{word}</h2>
    {pronunciation && <span className="pronunciation">{pronunciation}</span>}
  </>
));

export const OptimizedPopup = memo(({ definition, onClose }: OptimizedPopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { formatPos } = useDefinitionFormatter();
  const animationScheduler = useRef(scheduleAnimation(() => {
    performanceTracker.mark('render-complete');
  }));

  useEffect(() => {
    if (definition) {
      performanceTracker.mark('render-start');
      // Schedule render complete measurement
      animationScheduler.current.schedule();
    }

    return () => {
      animationScheduler.current.cancel();
    };
  }, [definition]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Early return for no definition
  if (!definition) {
    return null;
  }

  return (
    <div 
      ref={popupRef}
      className="popup-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        // Hardware acceleration
        transform: 'translateZ(0)',
        willChange: 'opacity'
      }}
    >
      <div 
        className="popup-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1e1e1e',
          borderRadius: '8px',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 50px rgba(0, 0, 0, 0.5)',
          // Hardware acceleration
          transform: 'translateZ(0)',
          willChange: 'transform',
          // Optimize scrolling
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <PopupHeader word={definition.word} pronunciation={definition.pronunciation} />
        
        <p className="part-of-speech" style={{ 
          color: '#888',
          fontSize: '0.9rem',
          marginBottom: '1rem' 
        }}>
          {formatPos(definition.pos)}
        </p>
        
        <ul className="definitions" style={{
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          {definition.definitions.map((def, idx) => (
            <DefinitionItem key={idx} text={def} index={idx} />
          ))}
        </ul>
        
        {definition.frequency && (
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #333',
            fontSize: '0.8rem',
            color: '#666'
          }}>
            Frequency rank: #{definition.frequency}
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedPopup.displayName = 'OptimizedPopup';