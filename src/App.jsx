import React from "react";
import { Link, Route, Routes, NavLink } from "react-router-dom";

import Artists from "./Artists.jsx";

// Simple placeholders (keep your existing ones if you already have them elsewhere)
function Home() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>iBandbyte</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Home route loaded successfully.
      </p>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.35)",
            padding: 18,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 900 }}>Discover</div>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            Browse up-and-coming artists and preview tracks.
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.35)",
            padding: 18,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 900 }}>Vote</div>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            Help artists get signed with fan-powered voting.
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.35)",
            padding: 18,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 900 }}>Connect</div>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            Labels scout talent, artists build fans.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            to="/artists"
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background:
                "linear-gradient(90deg, rgba(154,74,255,0.95), rgba(255,147,43,0.95))",
              color: "black",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            Go to Artists
          </Link>

          <button
            onClick={() => window.location.reload()}
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={{ opacity: 0.65, marginTop: 26 }}>
        Powered by Fans. A Platform for Artists.
      </div>
    </div>
  );
}

function Admin() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>Admin</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Placeholder route. Later we’ll connect to real admin endpoints + protect
        access.
      </p>
    </div>
  );
}

function DemoArtist() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>Demo Artist</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        This is a demo placeholder. Next phase will display a real artist with
        track previews and comments.
      </p>

      <div
        style={{
          marginTop: 16,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.35)",
          padding: 18,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 18 }}>Overview</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <span
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            Pop / Urban
          </span>
          <span
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            Votes: 42
          </span>
        </div>

        <div style={{ marginTop: 14, fontWeight: 900, fontSize: 18 }}>Bio</div>
        <div style={{ opacity: 0.9, marginTop: 8, lineHeight: 1.45 }}>
          This is a demo placeholder. Next phase will display a real artist with
          track previews and comments.
        </div>

        <Link
          to="/artists"
          style={{
            display: "inline-block",
            marginTop: 16,
            borderRadius: 16,
            padding: "12px 16px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Back
        </Link>
      </div>

      <div style={{ opacity: 0.65, marginTop: 26 }}>
        Powered by Fans. A Platform for Artists.
      </div>
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
    fontWeight: 800,
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
        iBand<span style={{ color: "#ffb300" }}>byte</span>
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
        <Route path="/artists/demo" element={<DemoArtist />} />
        <Route path="/admin" element={<Admin />} />

        {/* Catch-all: ensures refresh on unknown client routes doesn’t show blank */}
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}