import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { performanceTracker } from "./utils/performance";
import { Settings } from "./components/Settings";
import { TestMultiDefinition } from "./components/TestMultiDefinition";
import { WordHistory } from "./components/WordHistory";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { SearchBox } from "./components/SearchBox";
import { historyManager } from "./utils/history-manager";
import "./App.css";

interface Definition {
  word: string;
  pronunciation?: string;
  pos: string;
  definitions: string[];
  frequency?: number;
}

interface LookupResult {
  success: boolean;
  data?: Definition;
  error?: string;
}

interface CacheEvent {
  word: string;
  definition: Definition | null;
  from_cache: boolean;
  lookup_time_ms: number;
}

function App() {
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [isWayland, setIsWayland] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [lookupTime, setLookupTime] = useState<number | null>(null);
  const [fromCache, setFromCache] = useState<boolean | null>(null);
  const [testWord, setTestWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [perfStats, setPerfStats] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMultiDefTest, setShowMultiDefTest] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  useEffect(() => {
    // Listen for word definition events from cache
    const unlistenDefinition = listen<CacheEvent>("word-definition", (event) => {
      console.log("Word definition event:", event.payload);
      performanceTracker.mark('render-start');
      const data = event.payload;
      setWord(data.word);
      setDefinition(data.definition);
      setFromCache(data.from_cache);
      setLookupTime(data.lookup_time_ms);
      
      // Track in history
      if (data.word && data.definition) {
        historyManager.addEntry(
          data.word,
          undefined,
          data.definition.definitions[0]
        );
      }
      
      // Mark render complete on next tick
      requestAnimationFrame(() => {
        performanceTracker.mark('render-complete');
        const metrics = performanceTracker.measure();
        if (metrics) {
          console.log(`Total E2E time: ${metrics.totalTime.toFixed(2)}ms`);
        }
      });
    });

    // Listen for clipboard definition events
    const unlistenClipboardDef = listen<CacheEvent>("clipboard-definition", (event) => {
      console.log("Clipboard definition event:", event.payload);
      const data = event.payload;
      setWord(data.word);
      setDefinition(data.definition);
      setFromCache(data.from_cache);
      
      // Track in history
      if (data.word && data.definition) {
        historyManager.addEntry(
          data.word,
          "Clipboard lookup",
          data.definition.definitions[0]
        );
      }
    });

    // Listen for no selection event
    const unlistenNoSelection = listen("no-selection", () => {
      console.log("No text selected");
    });

    // Listen for Wayland detection
    const unlistenWayland = listen("wayland-detected", () => {
      console.log("Running on Wayland - showing alternative instructions");
      setIsWayland(true);
    });

    // Listen for clipboard monitoring (Wayland fallback)
    const unlistenClipboard = listen("clipboard-word", (event) => {
      console.log("Clipboard word detected:", event.payload);
      setWord(event.payload as string);
      setDefinition(null);
      setFromCache(false);
    });

    // Load initial cache stats
    loadCacheStats();

    // Cleanup listeners
    return () => {
      unlistenDefinition.then(fn => fn());
      unlistenClipboardDef.then(fn => fn());
      unlistenNoSelection.then(fn => fn());
      unlistenWayland.then(fn => fn());
      unlistenClipboard.then(fn => fn());
    };
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await invoke<string>("cache_stats");
      setCacheStats(JSON.parse(stats));
    } catch (error) {
      console.error("Failed to load cache stats:", error);
    }
  };

  const loadPerfStats = async () => {
    try {
      const backendStats = await invoke<any>("get_performance_stats");
      const frontendStats = performanceTracker.getStats();
      setPerfStats({
        backend: backendStats,
        frontend: frontendStats
      });
    } catch (error) {
      console.error("Failed to load performance stats:", error);
    }
  };

  const resetPerfStats = async () => {
    try {
      await invoke("reset_performance_stats");
      performanceTracker.reset();
      setPerfStats(null);
    } catch (error) {
      console.error("Failed to reset performance stats:", error);
    }
  };

  const testCacheLookup = async () => {
    if (!testWord.trim()) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      const start = performance.now();
      const result = await invoke<LookupResult>("lookup_word", { word: testWord });
      const time = performance.now() - start;
      
      if (result.success && result.data) {
        setWord(testWord);
        setDefinition(result.data);
        setLookupTime(time);
        setFromCache(true); // Will be determined by cache stats
        setError(null);
      } else {
        setDefinition(null);
        setError(result.error || "Word not found");
      }
      
      // Reload cache stats
      await loadCacheStats();
    } catch (error) {
      console.error("Lookup error:", error);
      setError("Failed to connect to dictionary service");
      setDefinition(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>⚡ Lightning Dictionary</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
            className="button-press color-transition"
            style={{
              background: showPerformanceMonitor ? '#4a5568' : '#333',
              border: '1px solid #555',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            📊 Performance
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="button-press color-transition"
            style={{
              background: '#333',
              border: '1px solid #555',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📚 History
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="button-press color-transition"
            style={{
              background: '#333',
              border: '1px solid #555',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ⚙️ Settings
          </button>
        </div>
        <button 
          onClick={() => setShowMultiDefTest(!showMultiDefTest)}
          style={{
            background: showMultiDefTest ? '#60a5fa' : '#2a2a2a',
            border: '1px solid #555',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          📚 Test Multi-Definition
        </button>
      </div>
      
      {/* Search Section */}
      <div className="test-section" style={{ marginBottom: "2rem", padding: "1rem", border: "2px dashed #666", borderRadius: "8px" }}>
        <h3>🔍 Dictionary Search</h3>
        <div style={{ marginBottom: "1rem" }}>
          <SearchBox
            onSearch={async (query) => {
              setTestWord(query);
              await testCacheLookup();
            }}
            onSelectWord={async (selectedWord) => {
              setTestWord(selectedWord);
              // Use setTimeout to ensure state update happens first
              setTimeout(() => {
                const lookupWord = async () => {
                  if (!selectedWord.trim()) return;
                  
                  setError(null);
                  setIsLoading(true);
                  
                  try {
                    const start = performance.now();
                    const result = await invoke<LookupResult>("lookup_word", { word: selectedWord });
                    const time = performance.now() - start;
                    
                    if (result.success && result.data) {
                      setWord(selectedWord);
                      setDefinition(result.data);
                      setLookupTime(time);
                      setFromCache(true);
                      setError(null);
                      
                      // Track in history
                      await historyManager.addEntry({
                        word: selectedWord,
                        timestamp: Date.now(),
                        definition: result.data.definitions[0] || '',
                        partOfSpeech: result.data.pos
                      });
                    } else {
                      setDefinition(null);
                      setError(result.error || "Word not found");
                    }
                    
                    await loadCacheStats();
                  } catch (error) {
                    console.error("Lookup error:", error);
                    setError("Failed to connect to dictionary service");
                    setDefinition(null);
                  } finally {
                    setIsLoading(false);
                  }
                };
                lookupWord();
              }, 0);
            }}
            placeholder="Search for a word..."
            autoFocus={true}
          />
        </div>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <button onClick={loadCacheStats} style={{ padding: "0.5rem 1rem" }}>
            Refresh Stats
          </button>
        </div>
        
        {cacheStats && (
          <div style={{ fontSize: "0.9rem", color: "#888" }}>
            <p>📊 Cache Stats:</p>
            <ul style={{ listStyle: "none", paddingLeft: "1rem" }}>
              <li>• Size: {cacheStats.size}/{cacheStats.capacity} words</li>
              <li>• Memory: ~{(cacheStats.memory_usage_estimate / 1024 / 1024).toFixed(2)} MB</li>
            </ul>
          </div>
        )}
      </div>

      {/* Definition Display */}
      {word && (
        <div className="definition-card">
          <h2 className="word">{word}</h2>
          {error ? (
            <div style={{ color: "#e74c3c", padding: "1rem", textAlign: "center" }}>
              <p>⚠️ {error}</p>
              {error.includes("internet") && (
                <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                  Please check your connection and try again.
                </p>
              )}
            </div>
          ) : definition ? (
            <>
              <p className="part-of-speech">{definition.pos}</p>
              {definition.pronunciation && (
                <p className="pronunciation">{definition.pronunciation}</p>
              )}
              <ul className="definitions">
                {definition.definitions.map((def, idx) => (
                  <li key={idx}>{def}</li>
                ))}
              </ul>
            </>
          ) : isLoading ? (
            <p className="definition">Loading...</p>
          ) : (
            <p className="definition">No definition in cache (cache miss)</p>
          )}
          
          {/* Performance Metrics */}
          {lookupTime !== null && !error && (
            <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#666" }}>
              <p>⏱️ Lookup time: {lookupTime.toFixed(2)}ms</p>
              <p>💾 Source: {fromCache ? "Cache (HIT)" : "Not in cache (MISS)"}</p>
            </div>
          )}
        </div>
      )}

      {/* Status Section */}
      <div className="status">
        {isWayland ? (
          <>
            <p>⚠️ Running on Wayland - Global hotkeys are not supported</p>
            <p>✅ Clipboard monitoring is active!</p>
            <p>✨ Copy any single word to look it up automatically</p>
          </>
        ) : (
          <p>✨ Press <kbd>Alt</kbd>+<kbd>J</kbd> or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> on any selected text!</p>
        )}
        <p className="stats">
          {cacheStats 
            ? `Cache: ${cacheStats.size} words loaded • Target: <50ms response`
            : "Loading cache stats..."}
        </p>
      </div>
      
      {/* Performance Dashboard */}
      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#1a1a1a", borderRadius: "8px", border: "1px solid #333" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3>🚀 Performance Metrics</h3>
          <div>
            <button onClick={loadPerfStats} style={{ marginRight: "0.5rem", padding: "0.5rem 1rem" }}>
              Load Stats
            </button>
            <button onClick={resetPerfStats} style={{ padding: "0.5rem 1rem" }}>
              Reset
            </button>
          </div>
        </div>
        
        {perfStats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Backend Stats */}
            <div style={{ padding: "1rem", backgroundColor: "#222", borderRadius: "4px" }}>
              <h4 style={{ marginTop: 0 }}>Backend Performance</h4>
              {perfStats.backend.count > 0 ? (
                <>
                  <p>📊 Total Lookups: {perfStats.backend.count}</p>
                  <p>⚡ Average Time: {perfStats.backend.avg_total_ms.toFixed(2)}ms</p>
                  <p>🏃 Min/Max: {perfStats.backend.min_total_ms.toFixed(2)}ms / {perfStats.backend.max_total_ms.toFixed(2)}ms</p>
                  <p>📈 P95: {perfStats.backend.p95_total_ms.toFixed(2)}ms</p>
                  <p>💾 Cache Hit Rate: {perfStats.backend.cache_hit_rate.toFixed(1)}%</p>
                  <hr style={{ margin: "0.5rem 0", opacity: 0.3 }} />
                  <p style={{ fontSize: "0.9rem" }}>Breakdown:</p>
                  <ul style={{ listStyle: "none", paddingLeft: "1rem", fontSize: "0.9rem" }}>
                    <li>• Text Capture: {perfStats.backend.breakdown.text_capture_ms.toFixed(2)}ms</li>
                    <li>• Cache Lookup: {perfStats.backend.breakdown.cache_lookup_ms.toFixed(2)}ms</li>
                    <li>• API Call: {perfStats.backend.breakdown.api_call_ms.toFixed(2)}ms</li>
                  </ul>
                </>
              ) : (
                <p style={{ color: "#666" }}>No data yet. Try some lookups!</p>
              )}
            </div>
            
            {/* Frontend Stats */}
            <div style={{ padding: "1rem", backgroundColor: "#222", borderRadius: "4px" }}>
              <h4 style={{ marginTop: 0 }}>Frontend Performance</h4>
              {perfStats.frontend.count > 0 ? (
                <>
                  <p>📊 Total Renders: {perfStats.frontend.count}</p>
                  <p>⚡ Average E2E: {perfStats.frontend.avgTotal.toFixed(2)}ms</p>
                  <p>🏃 Min/Max: {perfStats.frontend.minTotal.toFixed(2)}ms / {perfStats.frontend.maxTotal.toFixed(2)}ms</p>
                  <p>📈 P95: {perfStats.frontend.p95Total.toFixed(2)}ms</p>
                  <p style={{ 
                    color: perfStats.frontend.avgTotal < 50 ? "#4CAF50" : "#FF9800",
                    fontWeight: "bold",
                    marginTop: "0.5rem"
                  }}>
                    {perfStats.frontend.avgTotal < 50 ? "✅ Meeting <50ms target!" : "⚠️ Above 50ms target"}
                  </p>
                  <hr style={{ margin: "0.5rem 0", opacity: 0.3 }} />
                  <p style={{ fontSize: "0.9rem" }}>Breakdown:</p>
                  <ul style={{ listStyle: "none", paddingLeft: "1rem", fontSize: "0.9rem" }}>
                    <li>• Rendering: {perfStats.frontend.breakdown.rendering.toFixed(2)}ms</li>
                  </ul>
                </>
              ) : (
                <p style={{ color: "#666" }}>No data yet. Try some lookups!</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f0f0f0", borderRadius: "8px", color: "#333" }}>
        <h4>📝 Testing Instructions:</h4>
        <ol>
          <li>Try looking up words using the test input above</li>
          <li>Select text in any application and press Alt+J</li>
          <li>Watch the console for debug output</li>
          <li>Note: Cache is empty until you add test data</li>
        </ol>
      </div>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      {/* Word History */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '90%',
            maxWidth: '800px',
            height: '80%',
            maxHeight: '600px'
          }}>
            <WordHistory 
              onWordClick={async (clickedWord) => {
                setShowHistory(false);
                setTestWord(clickedWord);
                setError(null);
                setIsLoading(true);
                
                try {
                  const start = performance.now();
                  const result = await invoke<LookupResult>("lookup_word", { word: clickedWord });
                  const time = performance.now() - start;
                  
                  setLookupTime(time);
                  
                  if (result.success && result.data) {
                    setWord(result.data.word);
                    setDefinition(result.data);
                    setFromCache(true);
                    
                    // Add to history
                    historyManager.addEntry(
                      result.data.word,
                      "History navigation",
                      result.data.definitions[0]
                    );
                  } else {
                    setError(result.error || "Word not found");
                    setDefinition(null);
                  }
                  
                  await loadCacheStats();
                } catch (error) {
                  console.error("Lookup error:", error);
                  setError("Failed to connect to dictionary service");
                  setDefinition(null);
                } finally {
                  setIsLoading(false);
                }
              }}
              onClose={() => setShowHistory(false)}
            />
          </div>
        </div>
      )}
      
      {/* Multi-Definition Test */}
      {showMultiDefTest && <TestMultiDefinition />}
      
      {/* Performance Monitor */}
      <PerformanceMonitor 
        isVisible={showPerformanceMonitor}
        position="bottom-right"
        onClose={() => setShowPerformanceMonitor(false)}
      />
    </div>
  );
}

export default App;