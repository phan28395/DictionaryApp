import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SearchSuggestions } from './SearchSuggestions';
import './SearchBox.css';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  onSelectWord: (word: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = React.memo(({
  onSearch,
  onSelectWord,
  placeholder = 'Search for a word...',
  autoFocus = false,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsPosition, setSuggestionsPosition] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update suggestions position when input changes
  useEffect(() => {
    if (inputRef.current && showSuggestions) {
      const rect = inputRef.current.getBoundingClientRect();
      setSuggestionsPosition({
        x: rect.left,
        y: rect.bottom + 4
      });
    }
  }, [showSuggestions, query]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length >= 2);
  }, []);

  // Handle form submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  // Handle word selection from suggestions
  const handleSelectWord = useCallback((word: string) => {
    setQuery(word);
    setShowSuggestions(false);
    onSelectWord(word);
  }, [onSelectWord]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (query.length >= 2) {
      setShowSuggestions(true);
    }
  }, [query]);

  // Handle blur (with delay to allow suggestion clicks)
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSuggestions) {
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    };

    if (showSuggestions) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSuggestions]);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div ref={containerRef} className={`search-box-container ${className}`}>
      <form onSubmit={handleSubmit} className="search-box-form">
        <div className="search-box-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="search-box-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              className="search-clear-button"
              onClick={() => {
                setQuery('');
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              title="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </form>
      
      <SearchSuggestions
        query={query}
        onSelectWord={handleSelectWord}
        isVisible={showSuggestions}
        position={suggestionsPosition}
      />
    </div>
  );
});