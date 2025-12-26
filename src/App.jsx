import React from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import Artists from "./Artists.jsx";
import ArtistDetail from "./ArtistDetail.jsx";

function Home() {
  return (
    <div style={{ maxWidth: 950, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 56, margin: 0, letterSpacing: -1 }}>
        iBand<span style={{ color: "#FFB100" }}>byte</span>
      </h1>

      <p style={{ opacity: 0.85, marginTop: 10, fontSize: 18 }}>
        Powered by Fans. A Platform for Artists and Influencers.
      </p>

      <div
        style={{
          marginTop: 18,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.35)",
          padding: 18,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 900 }}>Get Signed / Connect</div>
        <div style={{ opacity: 0.85, marginTop: 6 }}>
          Discover rising artists, vote, and help talent get noticed.
        </div>
      </div>
    </div>
  );
}

function Admin() {
  return (
    <div style={{ maxWidth: 950, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 56, margin: 0, letterSpacing: -1 }}>Admin</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Admin dashboard placeholder. Next phase: submissions, moderation, stats.
      </p>
    </div>
  );
}

function TopNav() {
  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: "white",
    borderRadius: 14,
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: isActive ? "rgba(154,74,255,0.22)" : "rgba(255,255,255,0.06)",
    fontWeight: 900,
  });

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 28 }}>
        iBand<span style={{ color: "#FFB100" }}>byte</span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <NavLink to="/" style={linkStyle} end>
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

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
        background:
          "radial-gradient(1200px 700px at 20% 10%, rgba(154,74,255,0.35), transparent), radial-gradient(1000px 600px at 80% 20%, rgba(255,147,43,0.25), transparent), #05050a",
      }}
    >
      <TopNav />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/artists" element={<Artists />} />
        <Route path="/artists/:id" element={<ArtistDetail />} />

        <Route path="/admin" element={<Admin />} />

        {/* Prevent blank white screen on unknown route */}
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}