import { useState } from "react";

import AdminArtistsInbox from "./AdminArtistsInbox";
import AdminCommentsInbox from "./AdminCommentsInbox";

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: "10px 16px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: active
          ? "rgba(154,74,255,0.30)"
          : "rgba(255,255,255,0.08)",
        color: "white",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("artists");

  return (
    <div style={{ padding: "20px", color: "#fff" }}>
      <h1 style={{ fontSize: 52, margin: 0 }}>Admin Dashboard</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>
        iBand Control Center · Moderation + Approvals
      </p>

      {/* Tabs */}
      <div
        style={{
          marginTop: 18,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <Tab active={tab === "artists"} onClick={() => setTab("artists")}>
          🎤 Artists Inbox
        </Tab>

        <Tab active={tab === "comments"} onClick={() => setTab("comments")}>
          💬 Comments Inbox
        </Tab>
      </div>

      {/* Panels */}
      <div style={{ marginTop: 20 }}>
        {tab === "artists" ? <AdminArtistsInbox /> : null}
        {tab === "comments" ? <AdminCommentsInbox /> : null}
      </div>
    </div>
  );
}