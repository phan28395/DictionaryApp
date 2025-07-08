import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

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

function App() {
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [isWayland, setIsWayland] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [lookupTime, setLookupTime] = useState<number | null>(null);
  const [fromCache, setFromCache] = useState<boolean | null>(null);
  const [testWord, setTestWord] = useState("");

  useEffect(() => {
    // Listen for word definition events from cache
    const unlistenDefinition = listen<CacheEvent>("word-definition", (event) => {
      console.log("Word definition event:", event.payload);
      const data = event.payload;
      setWord(data.word);
      setDefinition(data.definition);
      setFromCache(data.from_cache);
      setLookupTime(data.lookup_time_ms);
    });

    // Listen for clipboard definition events
    const unlistenClipboardDef = listen<CacheEvent>("clipboard-definition", (event) => {
      console.log("Clipboard definition event:", event.payload);
      const data = event.payload;
      setWord(data.word);
      setDefinition(data.definition);
      setFromCache(data.from_cache);
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

  const testCacheLookup = async () => {
    if (!testWord.trim()) return;
    
    try {
      const start = performance.now();
      const result = await invoke<Definition | null>("lookup_word", { word: testWord });
      const time = performance.now() - start;
      
      setWord(testWord);
      setDefinition(result);
      setLookupTime(time);
      setFromCache(result !== null);
      
      // Reload cache stats
      await loadCacheStats();
    } catch (error) {
      console.error("Lookup error:", error);
    }
  };

  return (
    <div className="container">
      <h1>⚡ Lightning Dictionary - Cache Test</h1>
      
      {/* Cache Testing Section */}
      <div className="test-section" style={{ marginBottom: "2rem", padding: "1rem", border: "2px dashed #666", borderRadius: "8px" }}>
        <h3>🧪 Cache Testing</h3>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <input
            type="text"
            value={testWord}
            onChange={(e) => setTestWord(e.target.value)}
            placeholder="Enter a word to test cache"
            style={{ flex: 1, padding: "0.5rem" }}
            onKeyDown={(e) => e.key === "Enter" && testCacheLookup()}
          />
          <button onClick={testCacheLookup} style={{ padding: "0.5rem 1rem" }}>
            Test Lookup
          </button>
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
          {definition ? (
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
          ) : (
            <p className="definition">No definition in cache (cache miss)</p>
          )}
          
          {/* Performance Metrics */}
          {lookupTime !== null && (
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
    </div>
  );
}

export default App;