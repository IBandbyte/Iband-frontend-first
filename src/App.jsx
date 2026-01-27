import React from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import Artists from "./Artists";
import Submit from "./Submit";
import ArtistDetail from "./ArtistDetail";
import { API_BASE } from "./services/api";

function Tab({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        textDecoration: "none",
        borderRadius: 16,
        padding: "12px 16px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: isActive ? "rgba(154,74,255,0.25)" : "rgba(255,255,255,0.08)",
        color: "white",
        fontWeight: 900,
        display: "inline-block",
      })}
    >
      {label}
    </NavLink>
  );
}

function Shell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
        background: "radial-gradient(circle at 20% 10%, rgba(154,74,255,0.18), transparent 45%), radial-gradient(circle at 80% 0%, rgba(255,147,43,0.16), transparent 50%), #07070b",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(154,74,255,1), rgba(255,147,43,1))",
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 900 }}>iBand</div>
        </div>
        <div style={{ opacity: 0.7, marginTop: 6 }}>Get Signed / Connect</div>
        <div style={{ opacity: 0.7, marginTop: 10 }}>API: {API_BASE}</div>

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Tab to="/artists" label="Artists" />
          <Tab to="/submit" label="Submit" />
          <Tab to="/admin" label="Admin" />
        </div>

        <div style={{ marginTop: 18 }}>{children}</div>

        <div style={{ opacity: 0.6, marginTop: 40 }}>
          Powered by Fans. A Platform for Artists and Influencers.
        </div>
      </div>
    </div>
  );
}

function AdminPlaceholder() {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 22 }}>Admin</div>
      <div style={{ opacity: 0.8, marginTop: 10 }}>
        Admin UI comes next. Backend endpoints exist under <b>/api/admin/*</b>.
      </div>
      <div style={{ opacity: 0.8, marginTop: 10 }}>
        For now: use Hoppscotch to approve/reject, or switch Artists to “Pending (dev)”.
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Artists />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/artist/:id" element={<ArtistDetail />} />
        <Route path="/admin" element={<AdminPlaceholder />} />
        <Route
          path="*"
          element={
            <div style={{ opacity: 0.85 }}>
              Page not found. Go to <NavLink to="/artists">Artists</NavLink>.
            </div>
          }
        />
      </Routes>
    </Shell>
  );
}