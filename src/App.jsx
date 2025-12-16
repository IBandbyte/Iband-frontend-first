import { BrowserRouter, Routes, Route } from "react-router-dom";

function Home() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>iBandbyte</h1>
      <p>Home route loaded successfully.</p>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>iBandbyte</h1>
      <p style={{ color: "crimson" }}>Route not found.</p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: "1rem",
          padding: "0.6rem 1rem",
          borderRadius: "8px",
          border: "none",
          background: "linear-gradient(90deg,#7c3aed,#f97316)",
          color: "white",
          fontWeight: "bold",
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
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}