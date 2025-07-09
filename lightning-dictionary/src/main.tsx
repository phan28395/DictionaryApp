import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/platform-linux.css";
import "./styles/platform-darwin.css";
import "./styles/platform-win32.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
