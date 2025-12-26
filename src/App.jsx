import React from "react";
import { NavLink, Routes, Route } from "react-router-dom";
import Artists from "./Artists.jsx";

/* -------------------- Pages -------------------- */

function Home() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px" }}>
      <h1 style={{ fontSize: 56, margin: 0 }}>
        iBand<span style={{ color: "#FFB100" }}>byte</span>
      </h1>

      <p style={{ marginTop: 12, fontSize: 18, opacity: 0.85 }}>
        Powered by Fans. A Platform for Artists and Influencers.
      </p>

      <div
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 900 }}>
          Get Signed / Connect
        </div>
        <div style={{ marginTop: 8, opacity: 0.85 }}>
          Discover rising artists, vote, and help talent get noticed.
        </div>
      </div>
    </div>
  );
}

function Admin() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px" }}>
      <h1 style={{ fontSize: 48 }}>Admin</h1>
      <p style={{ opacity: 0.85 }}>
        Admin dashboard placeholder.  
        Next phase: submissions, moderation, stats.
      </p>
    </div>
  );
}

/* -------------------- Navigation -------------------- */

function TopNav() {
  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: "white",
    padding: "10px 14px",
    borderRadius: 14,
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.12)",
    background: isActive
      ? "rgba(154,74,255,0.35)"
      : "rgba(255,255,255,0.08)",
  });

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 900 }}>
        iBand<span style={{ color: "#FFB100" }}>byte</span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <NavLink to="/" end style={linkStyle}>
          Home
        </NavLink>
        <NavLink to="/artists" style={linkStyle}>
          Artists
        </NavLink>
        <NavLink to="/admin" style={linkStyle}>
          Admin
        </NavLink>
      </div>
    </div>
  );
}

/* -------------------- App Shell -------------------- */

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
        background:
          "radial-gradient(1200px 700px at 20% 10%, rgba(154,74,255,0.35), transparent)," +
          "radial-gradient(1000px 600px at 80% 20%, rgba(255,147,43,0.25), transparent)," +
          "#05050a",
      }}
    >
      <TopNav />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/admin" element={<Admin />} />

        {/* Fallback to avoid blank screen */}
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}