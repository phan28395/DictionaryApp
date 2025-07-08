import { useEffect, useCallback, useRef, useState } from 'react';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onTab?: (e: KeyboardEvent) => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onCopy?: () => void;
  enableFocusTrap?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const [focusIndex, setFocusIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const focusableElementsRef = useRef<HTMLElement[]>([]);

  // Update focusable elements list
  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return;
    
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const elements = Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    
    focusableElementsRef.current = elements;
  }, []);

  // Focus trap handler
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (!options.enableFocusTrap || focusableElementsRef.current.length === 0) {
      options.onTab?.(e);
      return;
    }

    e.preventDefault();
    
    const elements = focusableElementsRef.current;
    const currentIndex = elements.findIndex(el => el === document.activeElement);
    
    let nextIndex: number;
    if (e.shiftKey) {
      // Shift+Tab - go backwards
      nextIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    } else {
      // Tab - go forwards
      nextIndex = currentIndex >= elements.length - 1 ? 0 : currentIndex + 1;
    }
    
    elements[nextIndex]?.focus();
    setFocusIndex(nextIndex);
  }, [options]);

  // Main keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;
    const ctrlOrCmd = e.ctrlKey || e.metaKey;

    switch (key) {
      case 'Escape':
        e.preventDefault();
        options.onEscape?.();
        break;
        
      case 'Enter':
        if (!e.shiftKey && !ctrlOrCmd) {
          e.preventDefault();
          options.onEnter?.();
        }
        break;
        
      case 'Tab':
        handleTabKey(e);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        options.onArrowUp?.();
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        options.onArrowDown?.();
        break;
        
      case 'c':
      case 'C':
        if (ctrlOrCmd) {
          options.onCopy?.();
        }
        break;
    }
  }, [options, handleTabKey]);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    updateFocusableElements();
    
    // Update focusable elements on DOM changes
    const observer = new MutationObserver(updateFocusableElements);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'tabindex']
      });
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
    };
  }, [handleKeyDown, updateFocusableElements]);

  // Focus first element on mount
  useEffect(() => {
    if (options.enableFocusTrap && focusableElementsRef.current.length > 0) {
      focusableElementsRef.current[0]?.focus();
    }
  }, [options.enableFocusTrap]);

  return {
    containerRef,
    focusIndex,
    setFocusIndex,
    focusableElements: focusableElementsRef.current
  };
}

// Hook for definition list navigation
export function useDefinitionNavigation(definitions: string[]) {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const navigateUp = useCallback(() => {
    setSelectedIndex(prev => 
      prev <= 0 ? definitions.length - 1 : prev - 1
    );
  }, [definitions.length]);

  const navigateDown = useCallback(() => {
    setSelectedIndex(prev => 
      prev >= definitions.length - 1 ? 0 : prev + 1
    );
  }, [definitions.length]);

  const copyDefinition = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < definitions.length) {
      navigator.clipboard.writeText(definitions[selectedIndex]);
      // Could show a toast notification here
    }
  }, [selectedIndex, definitions]);

  return {
    selectedIndex,
    navigateUp,
    navigateDown,
    copyDefinition,
    setSelectedIndex
  };
}

// Hook for search navigation
export function useSearchNavigation(
  results: string[],
  onSelect: (result: string) => void
) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const navigateResults = useCallback((direction: 'up' | 'down') => {
    setHighlightedIndex(prev => {
      if (direction === 'up') {
        return prev <= 0 ? results.length - 1 : prev - 1;
      } else {
        return prev >= results.length - 1 ? 0 : prev + 1;
      }
    });
  }, [results.length]);

  const selectHighlighted = useCallback(() => {
    if (highlightedIndex >= 0 && highlightedIndex < results.length) {
      onSelect(results[highlightedIndex]);
    }
  }, [highlightedIndex, results, onSelect]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  return {
    highlightedIndex,
    navigateUp: () => navigateResults('up'),
    navigateDown: () => navigateResults('down'),
    selectHighlighted,
    setHighlightedIndex
  };
}