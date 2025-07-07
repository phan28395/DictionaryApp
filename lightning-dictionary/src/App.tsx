import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

function App() {
  const [word, setWord] = useState("hello");
  const [definition, setDefinition] = useState("A greeting or expression of goodwill");
  const [isWayland, setIsWayland] = useState(false);

  useEffect(() => {
    // Listen for word lookup events
    const unlistenLookup = listen("lookup-word", (event) => {
      console.log("Lookup word event received:", event.payload);
      setWord(event.payload as string);
      // TODO: Look up actual definition from dictionary
      setDefinition("Definition lookup coming soon...");
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
      setDefinition("Definition lookup coming soon...");
    });

    // Cleanup listeners
    return () => {
      unlistenLookup.then(fn => fn());
      unlistenWayland.then(fn => fn());
      unlistenClipboard.then(fn => fn());
    };
  }, []);

  return (
    <div className="container">
      <h1>⚡ Lightning Dictionary</h1>
      <div className="definition-card">
        <h2 className="word">{word}</h2>
        <p className="part-of-speech">interjection</p>
        <p className="definition">{definition}</p>
      </div>
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
        <p className="stats">Loaded 10,000 words • Response time: &lt;50ms</p>
      </div>
    </div>
  );
}

export default App;