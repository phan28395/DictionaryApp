import { useState, useCallback, useRef } from 'react';

export interface NavigationEntry {
  word: string;
  timestamp: number;
}

export interface UseWordNavigationReturn {
  history: NavigationEntry[];
  currentIndex: number;
  currentWord: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
  navigateTo: (word: string) => void;
  goBack: () => void;
  goForward: () => void;
  clearHistory: () => void;
}

const MAX_HISTORY_SIZE = 50;

export function useWordNavigation(initialWord?: string): UseWordNavigationReturn {
  const [history, setHistory] = useState<NavigationEntry[]>(() => {
    if (initialWord) {
      return [{
        word: initialWord,
        timestamp: Date.now()
      }];
    }
    return [];
  });
  
  const [currentIndex, setCurrentIndex] = useState(() => initialWord ? 0 : -1);
  const isNavigatingRef = useRef(false);
  
  const navigateTo = useCallback((word: string) => {
    if (!word || word.trim().length === 0) return;
    
    const normalizedWord = word.toLowerCase().trim();
    
    if (currentIndex >= 0 && history[currentIndex]?.word === normalizedWord) {
      return;
    }
    
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }
    
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      
      newHistory.push({
        word: normalizedWord,
        timestamp: Date.now()
      });
      
      if (newHistory.length > MAX_HISTORY_SIZE) {
        return newHistory.slice(-MAX_HISTORY_SIZE);
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      return Math.min(newIndex, MAX_HISTORY_SIZE - 1);
    });
  }, [currentIndex, history]);
  
  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      isNavigatingRef.current = true;
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);
  
  const goForward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isNavigatingRef.current = true;
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);
  
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);
  
  return {
    history,
    currentIndex,
    currentWord: currentIndex >= 0 ? history[currentIndex]?.word || null : null,
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < history.length - 1,
    navigateTo,
    goBack,
    goForward,
    clearHistory
  };
}