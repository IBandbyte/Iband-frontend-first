import React, { useEffect, useState } from "react";
import { api } from "../../services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
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

function ActionBtn({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 14,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: danger
          ? "rgba(255,80,80,0.25)"
          : "rgba(80,255,160,0.20)",
        color: "white",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function AdminArtistsInbox() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingArtists, setPendingArtists] = useState([]);

  async function loadPending() {
    setLoading(true);
    setError("");

    try {
      const res = await api.adminListArtists("pending");

      setPendingArtists(Array.isArray(res?.artists) ? res.artists : []);
    } catch (e) {
      setPendingArtists([]);
      setError(
        safeText(e?.message) ||
          "Could not load pending artists. Check admin API routes + key."
      );
    } finally {
      setLoading(false);
    }
  }

  async function approveArtist(id) {
    if (!id) return;

    try {
      await api.adminApproveArtist(id);
      await loadPending();
    } catch (e) {
      alert("Approve failed: " + safeText(e?.message));
    }
  }

  async function rejectArtist(id) {
    if (!id) return;

    try {
      await api.adminRejectArtist(id);
      await loadPending();
    } catch (e) {
      alert("Reject failed: " + safeText(e?.message));
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  return (
    <div style={{ marginTop: 20 }}>
      <h2 style={{ fontSize: 28, marginBottom: 10 }}>
        🎵 Pending Artist Submissions
      </h2>

      {loading ? (
        <div style={{ opacity: 0.8 }}>Loading pending artists…</div>
      ) : null}

      {error ? (
        <div style={{ marginTop: 10, color: "#ffb3b3" }}>{error}</div>
      ) : null}

      {!loading && pendingArtists.length === 0 ? (
        <Card>No pending artists right now ✅</Card>
      ) : null}

      {pendingArtists.map((a) => {
        const id = safeText(a?.id || a?._id);

        return (
          <Card key={id}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              {safeText(a?.name || "Unnamed Artist")}
            </div>

            <div style={{ marginTop: 6, opacity: 0.85 }}>
              {safeText(a?.genre)} • {safeText(a?.location)}
            </div>

            <div style={{ marginTop: 10, opacity: 0.8 }}>
              {safeText(a?.bio).slice(0, 160)}
              {safeText(a?.bio).length > 160 ? "…" : ""}
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <ActionBtn onClick={() => approveArtist(id)}>
                ✅ Approve
              </ActionBtn>

              <ActionBtn danger onClick={() => rejectArtist(id)}>
                ❌ Reject
              </ActionBtn>
            </div>
          </Card>
        );
      })}
    </div>
  );
}