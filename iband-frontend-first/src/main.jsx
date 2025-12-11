import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Use existing global CSS (from root)
import "/style.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);