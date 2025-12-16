import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error(
    "Missing #root element. Ensure your index.html contains <div id='root'></div>"
  );
}

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);