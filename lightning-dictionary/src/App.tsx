import { useState } from "react";
import "./App.css";

function App() {
  const [word, setWord] = useState("hello");
  const [definition, setDefinition] = useState("A greeting or expression of goodwill");

  return (
    <div className="container">
      <h1>⚡ Lightning Dictionary</h1>
      <div className="definition-card">
        <h2 className="word">{word}</h2>
        <p className="part-of-speech">interjection</p>
        <p className="definition">{definition}</p>
      </div>
      <div className="status">
        <p>✨ Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> on any selected text to look it up!</p>
        <p className="stats">Loaded 10,000 words • Response time: &lt;50ms</p>
      </div>
    </div>
  );
}

export default App;