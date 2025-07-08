import React from 'react';
import './NavigationControls.css';

interface NavigationControlsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  currentWord?: string;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  currentWord
}) => {
  return (
    <div className="navigation-controls">
      <button
        className="nav-button nav-back"
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Go back to previous word"
        title="Previous word (Alt+Left)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 13L5 8L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      <button
        className="nav-button nav-forward"
        onClick={onForward}
        disabled={!canGoForward}
        aria-label="Go forward to next word"
        title="Next word (Alt+Right)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 13L11 8L6 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      {currentWord && (
        <span className="current-word-indicator" title="Current word">
          {currentWord}
        </span>
      )}
    </div>
  );
};

export default NavigationControls;