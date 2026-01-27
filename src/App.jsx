import React from "react";
import { Routes, Route, Navigate, NavLink } from "react-router-dom";

import Artists from "./Artists";
import Submit from "./Submit";
import ArtistDetail from "./ArtistDetail";

// ✅ Admin upgrade components
import AdminDashboard from "./components/admin/AdminDashboard";

import { API_BASE } from "./services/api";

function Pill({ to, children }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        textDecoration: "none",
        borderRadius: 18,
        padding: "12px 18px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: isActive
          ? "rgba(154,74,255,0.28)"
          : "rgba(255,255,255,0.08)",
        color: "white",
        fontWeight: 900,
        display: "inline-block",
        minWidth: 96,
        textAlign: "center",
      })}
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "26px 16px",
        background:
          "radial-gradient(circle at 20% 10%, rgba(154,74,255,0.18), transparent 45%), radial-gradient(circle at 90% 20%, rgba(255,147,43,0.14), transparent 40%), linear-gradient(180deg, rgba(0,0,0,0.95), rgba(0,0,0,0.92))",
        color: "white",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(154,74,255,1), rgba(255,147,43,1))",
              boxShadow: "0 0 18px rgba(154,74,255,0.35)",
            }}
          />
          <div>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: -1 }}>
              iBand
            </div>
            <div style={{ opacity: 0.85, marginTop: 2 }}>
              Get Signed / Connect
            </div>
          </div>
        </div>

        <div style={{ opacity: 0.8, marginTop: 10 }}>
          API: {API_BASE || API_BASE === "" ? API_BASE : API_BASE}
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Pill to="/artists">Artists</Pill>
          <Pill to="/submit">Submit</Pill>
          <Pill to="/admin">Admin</Pill>
        </div>

        {/* Routes */}
        <div style={{ marginTop: 16 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/artists" replace />} />

            <Route path="/artists" element={<Artists />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/artist/:id" element={<ArtistDetail />} />

            {/* ✅ Real Admin UI now */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/artists" replace />} />
          </Routes>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 30, opacity: 0.55 }}>
          Powered by Fans. A Platform for Artists and Influencers.
        </div>
      </div>
    </div>
  );
}