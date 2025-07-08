import { useCallback, useMemo } from 'react';

// Debounce function to prevent excessive calls
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return useCallback((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

// Throttle function to limit call frequency
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      callback(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        callback(...args);
        timeoutId = null;
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]) as T;
}

// Memoized formatter for definitions
export function useDefinitionFormatter() {
  return useMemo(() => ({
    formatDefinition: (def: string) => {
      // Pre-process definition text for faster rendering
      return def.trim();
    },
    formatPos: (pos: string) => {
      // Standardize part of speech
      return pos.toLowerCase();
    }
  }), []);
}

// Preload critical resources
export function preloadResources() {
  // Preload fonts
  const fonts = [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI'
  ];
  
  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = font;
    document.head.appendChild(link);
  });
}

// Request idle callback wrapper
export function whenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
}

// Animation frame scheduler
export function scheduleAnimation(callback: () => void) {
  let rafId: number | null = null;
  
  const schedule = () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        callback();
        rafId = null;
      });
    }
  };

  const cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return { schedule, cancel };
}

// Batch DOM updates
export class DOMBatcher {
  private updates: (() => void)[] = [];
  private scheduled = false;

  add(update: () => void) {
    this.updates.push(update);
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  flush() {
    const updates = this.updates.slice();
    this.updates = [];
    this.scheduled = false;
    
    updates.forEach(update => update());
  }
}

export const domBatcher = new DOMBatcher();