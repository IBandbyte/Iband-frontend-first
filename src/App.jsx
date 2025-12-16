import { BrowserRouter, Routes, Route } from "react-router-dom";

/**
 * Temporary Home component
 * (We will replace this with the real homepage later)
 */
function Home() {
  return (
    <div style={{ padding: "2rem", color: "#fff" }}>
      <h1>iBandbyte</h1>
      <p>Home route loaded successfully.</p>
    </div>
  );
}

/**
 * Fallback route (already working)
 */
function NotFound() {
  return (
    <div style={{ padding: "2rem", color: "#fff" }}>
      <h1>iBandbyte</h1>
      <p style={{ color: "#ff5a5a" }}>Route not found.</p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: "1rem",
          padding: "0.6rem 1rem",
          borderRadius: "8px",
          border: "none",
          background: "linear-gradient(90deg,#7b2ff7,#f107a3)",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Refresh
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ Home route */}
        <Route path="/" element={<Home />} />

        {/* ❌ Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}