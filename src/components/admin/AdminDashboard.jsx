import React, { useEffect, useMemo, useState } from "react";
import { api, getAdminKey, setAdminKey, clearAdminKey, getApiBase } from "../../services/api";
import AdminArtistsInbox from "./AdminArtistsInbox";
import AdminCommentsInbox from "./AdminCommentsInbox";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function TabBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 16,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(154,74,255,0.25)" : "rgba(255,255,255,0.08)",
        color: "white",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.35)",
        boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("artists"); // artists | comments
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState("");

  const apiBase = useMemo(() => {
    try {
      return getApiBase();
    } catch {
      return "";
    }
  }, []);

  function refreshSavedKey() {
    const k = safeText(getAdminKey()).trim();
    setSavedKey(k);
    if (!adminKeyInput) setAdminKeyInput(k);
  }

  async function loadStats() {
    setLoadingStats(true);
    setError("");
    try {
      const res = await api.adminStats();
      setStats(res || null);
    } catch (e) {
      setStats(null);
      setError(safeText(e?.message) || "Failed to load admin stats.");
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    refreshSavedKey();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSaveKey() {
    setError("");
    const ok = setAdminKey(adminKeyInput);
    if (!ok) {
      setError("Could not save admin key (browser storage blocked?).");
      return;
    }
    refreshSavedKey();
    loadStats();
  }

  function onClearKey() {
    setError("");
    clearAdminKey();
    setAdminKeyInput("");
    refreshSavedKey();
    loadStats();
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>Admin</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Command Center • Backend: <b>{apiBase}</b>
      </p>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 20 }}>Admin Key</div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          Stored locally in your browser as <b>iband_admin_key</b>. Required if backend ADMIN_KEY is set.
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <input
            value={adminKeyInput}
            onChange={(e) => setAdminKeyInput(e.target.value)}
            placeholder="Paste your x-admin-key value here"
            style={{
              width: "100%",
              padding: "14px 14px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              color: "white",
              outline: "none",
              fontSize: 16,
            }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={onSaveKey}
              style={{
                borderRadius: 16,
                padding: "12px 16px",
                border: "1px solid rgba(255,255,255,0.12)",
                background:
                  "linear-gradient(90deg, rgba(154,74,255,0.95), rgba(255,147,43,0.95))",
                color: "black",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Save Key
            </button>

            <button
              onClick={onClearKey}
              style={{
                borderRadius: 16,
                padding: "12px 16px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Clear Key
            </button>

            <button
              onClick={loadStats}
              disabled={loadingStats}
              style={{
                borderRadius: 16,
                padding: "12px 16px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontWeight: 900,
                cursor: loadingStats ? "not-allowed" : "pointer",
                opacity: loadingStats ? 0.7 : 1,
              }}
            >
              {loadingStats ? "Refreshing…" : "Refresh Stats"}
            </button>
          </div>

          <div style={{ opacity: 0.85, fontSize: 14 }}>
            Current saved key:{" "}
            <b>{savedKey ? `${savedKey.slice(0, 4)}…${savedKey.slice(-4)}` : "None"}</b>
          </div>
        </div>

        {error ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>{error}</div>
        ) : null}

        <div style={{ marginTop: 14, opacity: 0.9 }}>
          <div style={{ fontWeight: 900 }}>Stats</div>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            {stats ? (
              <pre
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.25)",
                  overflowX: "auto",
                  color: "white",
                }}
              >
                {JSON.stringify(stats, null, 2)}
              </pre>
            ) : (
              <span style={{ opacity: 0.8 }}>No stats loaded yet.</span>
            )}
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TabBtn active={tab === "artists"} onClick={() => setTab("artists")}>
          Artists Inbox
        </TabBtn>
        <TabBtn active={tab === "comments"} onClick={() => setTab("comments")}>
          Comments Inbox
        </TabBtn>
      </div>

      {tab === "artists" ? <AdminArtistsInbox /> : null}
      {tab === "comments" ? <AdminCommentsInbox /> : null}
    </div>
  );
}