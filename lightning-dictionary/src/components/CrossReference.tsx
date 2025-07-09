import React, { useMemo, useCallback } from 'react';
import { parseTextForWords, isValidWord } from '../utils/wordParser';
import './CrossReference.css';

interface CrossReferenceProps {
  text: string;
  onWordClick?: (word: string) => void;
  excludeWords?: Set<string>;
  className?: string;
}

export const CrossReference = React.memo<CrossReferenceProps>(({
  text,
  onWordClick,
  excludeWords = new Set(),
  className = ''
}) => {
  const parsedContent = useMemo(() => {
    return parseTextForWords(text);
  }, [text]);
  
  const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const normalizedWord = word.toLowerCase();
    if (!excludeWords.has(normalizedWord) && isValidWord(word)) {
      onWordClick?.(normalizedWord);
    }
  }, [onWordClick, excludeWords]);
  
  return (
    <span className={`cross-reference-text ${className}`}>
      {parsedContent.map((segment, index) => {
        if (!segment.isWord || !isValidWord(segment.text)) {
          return <span key={index}>{segment.text}</span>;
        }
        
        const normalizedWord = segment.text.toLowerCase();
        const isExcluded = excludeWords.has(normalizedWord);
        const isClickable = !isExcluded && segment.text.length > 2;
        
        if (!isClickable) {
          return <span key={index}>{segment.text}</span>;
        }
        
        return (
          <button
            key={index}
            className="cross-reference-word"
            onClick={(e) => handleWordClick(segment.text, e)}
            aria-label={`Look up ${segment.text}`}
            title={`Click to look up "${segment.text}"`}
          >
            {segment.text}
          </button>
        );
      })}
    </span>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.text === nextProps.text &&
    prevProps.className === nextProps.className &&
    prevProps.onWordClick === nextProps.onWordClick &&
    prevProps.excludeWords === nextProps.excludeWords
  );
});

export default CrossReference;