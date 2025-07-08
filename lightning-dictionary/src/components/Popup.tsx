import React, { useEffect, useState } from 'react';
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from '@tauri-apps/api/window';
import './Popup.css';

interface Definition {
  word: string;
  pronunciation?: string;
  pos: string;
  definitions: string[];
  frequency?: number;
}

interface CacheEvent {
  word: string;
  definition: Definition | null;
  from_cache: boolean;
  lookup_time_ms: number;
}

export const Popup: React.FC = React.memo(() => {
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [lookupTime, setLookupTime] = useState<number | null>(null);
  const [fromCache, setFromCache] = useState<boolean | null>(null);

  useEffect(() => {
    performance.mark('popup-component-mounted');
    
    const window = getCurrentWindow();
    
    // Listen for word definition events
    const unlistenDefinition = listen<CacheEvent>("word-definition", (event) => {
      performance.mark('definition-received');
      console.log("Word definition received:", event.payload);
      const data = event.payload;
      setDefinition(data.definition);
      setFromCache(data.from_cache);
      setLookupTime(data.lookup_time_ms);
      
      // Measure time from mount to definition display
      performance.measure('popup-time', 'popup-component-mounted', 'definition-received');
      const measure = performance.getEntriesByName('popup-time')[0];
      console.log(`Popup render time: ${measure.duration}ms`);
    });

    // Listen for escape key to close
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('Escape key pressed, closing popup');
        // Close the window (this will destroy it)
        window.close().catch(err => console.error('Failed to close window:', err));
      }
    };
    
    // Also listen for click outside the popup to close (when user clicks elsewhere)
    const handleClickOutside = (e: MouseEvent) => {
      // If the click is on the body but not on our popup content, close
      if (e.target === document.body) {
        console.log('Click outside detected, closing popup');
        window.close().catch(err => console.error('Failed to close window:', err));
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleClickOutside);
    
    // Auto-close after 10 seconds
    const autoCloseTimer = setTimeout(() => {
      console.log('Auto-closing popup after 10 seconds');
      window.close().catch(err => console.error('Failed to auto-close window:', err));
    }, 10000);

    // Focus the window to ensure keyboard events work
    window.setFocus().catch(err => console.error('Failed to focus window:', err));

    return () => {
      unlistenDefinition.then(fn => fn());
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('click', handleClickOutside);
      clearTimeout(autoCloseTimer);
    };
  }, []);

  if (!definition) {
    return (
      <div className="popup-container">
        <button 
          className="close-button" 
          onClick={() => getCurrentWindow().close()}
          title="Close (Esc)"
        >
          ✕
        </button>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <button 
        className="close-button" 
        onClick={() => getCurrentWindow().close()}
        title="Close (Esc)"
      >
        ✕
      </button>
      <div className="popup-content">
        <div className="word-header">
          <h2 className="word">{definition.word}</h2>
          {definition.pronunciation && (
            <span className="pronunciation">/{definition.pronunciation}/</span>
          )}
        </div>
        
        <div className="pos-tag">{definition.pos}</div>
        
        <ol className="definitions">
          {definition.definitions.map((def, idx) => (
            <li key={idx}>{def}</li>
          ))}
        </ol>
        
        {lookupTime !== null && (
          <div className="metrics">
            <span>{lookupTime.toFixed(1)}ms</span>
            <span>{fromCache ? 'cached' : 'loaded'}</span>
          </div>
        )}
      </div>
    </div>
  );
});