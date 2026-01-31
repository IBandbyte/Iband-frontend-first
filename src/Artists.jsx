import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, API_BASE } from "./services/api";

/* -----------------------------
   Helpers
----------------------------- */

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function pillStyle(active) {
  return {
    textDecoration: "none",
    borderRadius: 16,
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: active ? "rgba(154,74,255,0.25)" : "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 900,
    display: "inline-block",
    cursor: "pointer",
  };
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

/* -----------------------------
   Extract Artists Safely
----------------------------- */

function extractArtists(res) {
  if (!res) return [];

  if (Array.isArray(res.artists)) return res.artists;
  if (Array.isArray(res.items)) return res.items;

  if (res.data) {
    if (Array.isArray(res.data.artists)) return res.data.artists;
    if (Array.isArray(res.data.items)) return res.data.items;
  }

  // If backend ever returns the array raw
  if (Array.isArray(res)) return res;

  return [];
}

/* -----------------------------
   Artists Page
----------------------------- */

export default function Artists() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [artists, setArtists] = useState([]);

  const canSearch = useMemo(() => safeText(q).trim().length >= 0, [q]);

  async function load() {
    if (!canSearch) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.listArtists({
        status,
        query: safeText(q).trim(),
      });

      const extracted = extractArtists(res);

      setArtists(extracted);
    } catch (e) {
      setArtists([]);
      setError(
        safeText(e?.message) || "Could not load artists. Check API routes."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQ("");
    load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>Artists</h1>

      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Backend: {API_BASE} • Public view shows <b>active</b> artists only.
      </p>

      {/* Status Pills */}
      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span
          style={pillStyle(status === "active")}
          onClick={() => setStatus("active")}
        >
          Active
        </span>

        <span
          style={pillStyle(status === "pending")}
          onClick={() => setStatus("pending")}
        >
          Pending (dev)
        </span>

        <span
          style={pillStyle(status === "rejected")}
          onClick={() => setStatus("rejected")}
        >
          Rejected (dev)
        </span>

        <Link to="/submit" style={pillStyle(false)}>
          + Submit Artist
        </Link>
      </div>

      {/* Search */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Search</div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search artists (name, genre, location)…"
          style={{
            width: "100%",
            padding: "14px",
            marginTop: 10,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            fontSize: 16,
            outline: "none",
          }}
        />

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button
            onClick={load}
            disabled={loading}
            style={{
              borderRadius: 16,
              padding: "12px 18px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(154,74,255,0.25)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {loading ? "Loading…" : "Search"}
          </button>

          <button
            onClick={clearSearch}
            style={{
              borderRadius: 16,
              padding: "12px 18px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        <div style={{ marginTop: 10, opacity: 0.7 }}>
          Count: {artists.length}
        </div>

        {error ? (
          <div style={{ marginTop: 10, color: "#ffb3b3" }}>{error}</div>
        ) : null}
      </Card>

      {/* Results */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Results</div>

        {!loading && artists.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>
            No artists found.
          </div>
        ) : null}

        {artists.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {artists.map((a) => {
              const id = safeText(a.id || a._id);

              return (
                <div
                  key={id}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {safeText(a.name)}
                  </div>

                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    {safeText(a.genre)} • {safeText(a.location)} •{" "}
                    <b>{safeText(a.status)}</b>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <Link
                      to={`/artist/${encodeURIComponent(id)}`}
                      style={{
                        textDecoration: "none",
                        borderRadius: 16,
                        padding: "10px 14px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        fontWeight: 900,
                        display: "inline-block",
                      }}
                    >
                      View →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </Card>
    </div>
  );
}