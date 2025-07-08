import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { performanceTracker } from '../utils/performance';
import { scheduleAnimation, useDefinitionFormatter } from '../utils/optimizations';
import '../styles/animations.css';

interface Definition {
  word: string;
  pronunciation?: string;
  pos: string;
  definitions: string[];
  frequency?: number;
}

interface AnimatedPopupProps {
  definition: Definition | null;
  onClose?: () => void;
  position?: { x: number; y: number };
}

// Loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className="skeleton-container animate-fade-in">
    <div className="skeleton" style={{ height: '2rem', width: '60%', marginBottom: '0.5rem' }} />
    <div className="skeleton" style={{ height: '1rem', width: '30%', marginBottom: '1rem' }} />
    <div className="skeleton" style={{ height: '1rem', width: '100%', marginBottom: '0.5rem' }} />
    <div className="skeleton" style={{ height: '1rem', width: '90%', marginBottom: '0.5rem' }} />
    <div className="skeleton" style={{ height: '1rem', width: '95%' }} />
  </div>
));

// Animated definition item
const AnimatedDefinitionItem = memo(({ text, index }: { text: string; index: number }) => (
  <li 
    className="animate-slide-up"
    style={{
      animationDelay: `${index * 50}ms`,
      opacity: 0,
      animationFillMode: 'forwards'
    }}
  >
    {text}
  </li>
));

export const AnimatedPopup = memo(({ definition, onClose, position }: AnimatedPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { formatPos } = useDefinitionFormatter();

  useEffect(() => {
    if (definition) {
      performanceTracker.mark('render-start');
      setIsVisible(true);
      
      // Trigger animation after mount
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.classList.add('animate-spring');
        }
        performanceTracker.mark('render-complete');
      });
    }
  }, [definition]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    if (contentRef.current) {
      contentRef.current.classList.remove('animate-spring');
      contentRef.current.classList.add('animate-fade-out');
    }
    
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose?.();
    }, 150);
  }, [onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Calculate popup position
  const getPopupStyle = () => {
    if (!position) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const padding = 20;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const popupWidth = 500; // Approximate width
    const popupHeight = 300; // Approximate height

    let x = position.x;
    let y = position.y;

    // Adjust position to keep popup within viewport
    if (x + popupWidth > windowWidth - padding) {
      x = windowWidth - popupWidth - padding;
    }
    if (y + popupHeight > windowHeight - padding) {
      y = position.y - popupHeight - padding;
    }
    if (x < padding) x = padding;
    if (y < padding) y = padding;

    return {
      top: `${y}px`,
      left: `${x}px`
    };
  };

  if (!isVisible || !definition) {
    return null;
  }

  return (
    <div 
      ref={popupRef}
      className={`popup-overlay hardware-accelerated ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        cursor: 'pointer'
      }}
    >
      <div 
        ref={contentRef}
        className="popup-content hardware-accelerated"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          ...getPopupStyle(),
          backgroundColor: '#1e1e1e',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'default',
          opacity: 0,
          transform: 'scale(0.8)'
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="button-press color-transition"
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
            borderRadius: '4px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>

        {/* Word header with staggered animation */}
        <h2 
          className="word animate-fade-in"
          style={{
            margin: 0,
            marginBottom: '0.25rem',
            fontSize: '1.8rem',
            fontWeight: 600,
            color: '#fff'
          }}
        >
          {definition.word}
        </h2>

        {/* Part of speech with delay */}
        <p 
          className="part-of-speech animate-fade-in"
          style={{ 
            color: '#888',
            fontSize: '0.9rem',
            marginBottom: '1rem',
            animationDelay: '50ms',
            opacity: 0,
            animationFillMode: 'forwards'
          }}
        >
          {formatPos(definition.pos)}
        </p>

        {/* Pronunciation if available */}
        {definition.pronunciation && (
          <p 
            className="pronunciation animate-fade-in"
            style={{
              color: '#aaa',
              fontSize: '1rem',
              marginBottom: '1rem',
              fontStyle: 'italic',
              animationDelay: '100ms',
              opacity: 0,
              animationFillMode: 'forwards'
            }}
          >
            {definition.pronunciation}
          </p>
        )}

        {/* Definitions with staggered slide-up animation */}
        <ul 
          className="definitions"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}
        >
          {definition.definitions.map((def, idx) => (
            <AnimatedDefinitionItem key={idx} text={def} index={idx} />
          ))}
        </ul>

        {/* Frequency rank with fade in */}
        {definition.frequency && (
          <div 
            className="animate-fade-in"
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #333',
              fontSize: '0.8rem',
              color: '#666',
              animationDelay: `${(definition.definitions.length + 1) * 50}ms`,
              opacity: 0,
              animationFillMode: 'forwards'
            }}
          >
            Frequency rank: #{definition.frequency}
          </div>
        )}
      </div>
    </div>
  );
});

AnimatedPopup.displayName = 'AnimatedPopup';