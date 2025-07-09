import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SearchSuggestions.css';

interface SearchSuggestion {
  word: string;
  relevance: number;
  isExactMatch: boolean;
  partOfSpeech?: string[];
}

interface SearchSuggestionsProps {
  query: string;
  onSelectWord: (word: string) => void;
  isVisible: boolean;
  maxSuggestions?: number;
  position?: { x: number; y: number };
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = React.memo(({
  query,
  onSelectWord,
  isVisible,
  maxSuggestions = 10,
  position
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3002/api/v1/search/suggestions?q=${encodeURIComponent(query)}&limit=${maxSuggestions}`,
          { signal: abortController.signal }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        if (!abortController.signal.aborted) {
          setSuggestions(data.suggestions || []);
          setSelectedIndex(-1);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchSuggestions, 150);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, maxSuggestions]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible || suggestions.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > -1 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onSelectWord(suggestions[selectedIndex].word);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setSelectedIndex(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, suggestions, selectedIndex, onSelectWord]);

  const handleSuggestionClick = useCallback((word: string) => {
    onSelectWord(word);
  }, [onSelectWord]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  const stylePosition = position ? {
    position: 'fixed' as const,
    left: `${position.x}px`,
    top: `${position.y}px`
  } : {};

  return (
    <div 
      ref={containerRef}
      className="search-suggestions"
      style={stylePosition}
    >
      {loading && (
        <div className="search-suggestions-loading">
          <span className="loading-spinner"></span>
          Searching...
        </div>
      )}
      
      {!loading && suggestions.length > 0 && (
        <ul className="search-suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.word}
              className={`search-suggestion-item ${
                index === selectedIndex ? 'selected' : ''
              } ${suggestion.isExactMatch ? 'exact-match' : ''}`}
              onClick={() => handleSuggestionClick(suggestion.word)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="suggestion-word">{suggestion.word}</span>
              {suggestion.partOfSpeech && suggestion.partOfSpeech.length > 0 && (
                <span className="suggestion-pos">
                  {suggestion.partOfSpeech.join(', ')}
                </span>
              )}
              <span className="suggestion-relevance">
                {Math.round(suggestion.relevance * 100)}%
              </span>
            </li>
          ))}
        </ul>
      )}
      
      {!loading && query.length >= 2 && suggestions.length === 0 && (
        <div className="search-suggestions-empty">
          No suggestions found for "{query}"
        </div>
      )}
    </div>
  );
});