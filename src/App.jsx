import { BrowserRouter, Routes, Route } from "react-router-dom";

function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: "900",
          marginBottom: "1rem",
        }}
      >
        iBand<span style={{ color: "#ff7a18" }}>byte</span>
      </h1>

      <p style={{ fontSize: "1.2rem", opacity: 0.9 }}>
        Home route loaded successfully.
      </p>

      <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", opacity: 0.6 }}>
        Powered by Fans. A Platform for Artists.
      </p>
    </div>
  );
}

function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        Route not found
      </h1>
      <p style={{ opacity: 0.7 }}>
        This page does not exist.
      </p>
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