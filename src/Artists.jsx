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
    userSelect: "none",
  };
}

function buttonStyle(kind = "primary") {
  const isPrimary = kind === "primary";
  const isWarn = kind === "warn";
  return {
    borderRadius: 16,
    padding: "12px 18px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: isWarn
      ? "rgba(255,147,43,0.18)"
      : isPrimary
      ? "rgba(154,74,255,0.25)"
      : "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    userSelect: "none",
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
   Safe extract (supports multiple response shapes)
----------------------------- */

function extractArtists(res) {
  if (!res) return [];

  if (Array.isArray(res.artists)) return res.artists;
  if (Array.isArray(res.items)) return res.items;

  if (res.data) {
    if (Array.isArray(res.data.artists)) return res.data.artists;
    if (Array.isArray(res.data.items)) return res.data.items;
  }

  if (Array.isArray(res)) return res;

  return [];
}

function shapeInfo(res) {
  const receivedType = Array.isArray(res) ? "array" : typeof res;
  const keys =
    res && typeof res === "object" && !Array.isArray(res) ? Object.keys(res) : [];
  const dataKeys =
    res?.data && typeof res.data === "object" && !Array.isArray(res.data)
      ? Object.keys(res.data)
      : [];

  const artistsLen = extractArtists(res).length;
  const count =
    Number(res?.count) ||
    Number(res?.total) ||
    Number(res?.data?.count) ||
    Number(res?.data?.total) ||
    0;

  return { receivedType, keys, dataKeys, count, artistsLen };
}

/* -----------------------------
   Artists Page
----------------------------- */

const ADMIN_PREVIEW_STORAGE = "iband_admin_preview";

export default function Artists() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active");

  const [adminPreview, setAdminPreview] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_PREVIEW_STORAGE) === "1";
    } catch {
      return false;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [artists, setArtists] = useState([]);

  // Debug snapshots
  const [debug, setDebug] = useState({
    apiBase: API_BASE,
    status: "active",
    q: "",
    primary: null,
    adminFallback: null,
    lastUpdatedAt: null,
  });

  const trimmedQ = useMemo(() => safeText(q).trim(), [q]);

  function persistAdminPreview(next) {
    try {
      localStorage.setItem(ADMIN_PREVIEW_STORAGE, next ? "1" : "0");
    } catch {
      // ignore
    }
  }

  async function load({ forceCanonical = false } = {}) {
    setLoading(true);
    setError("");

    const meta = {
      apiBase: API_BASE,
      status,
      q: trimmedQ,
      primary: null,
      adminFallback: null,
      lastUpdatedAt: null,
    };

    try {
      // Primary path (public) OR adminPreview path (admin)
      let res = null;

      if (adminPreview) {
        // Admin list uses admin routes (requires x-admin-key only if backend enforces it)
        res = await api.adminListArtists({
          status,
          q: trimmedQ,
          page: 1,
          limit: 50,
        });
        meta.primary = shapeInfo(res);
      } else {
        // Public list
        res = await api.listArtists({
          status,
          query: trimmedQ,
          page: 1,
          limit: 50,
        });
        meta.primary = shapeInfo(res);

        // If public returns none for active, try admin fallback ONCE for diagnosis
        const extracted = extractArtists(res);
        const publicEmpty = status === "active" && extracted.length === 0;

        if (publicEmpty || forceCanonical) {
          try {
            const adminRes = await api.adminListArtists({
              status: "active",
              q: trimmedQ,
              page: 1,
              limit: 50,
            });

            const adminExtracted = extractArtists(adminRes);

            meta.adminFallback = {
              attempted: true,
              used: adminExtracted.length > 0,
              note:
                adminExtracted.length > 0
                  ? "Admin can see ACTIVE artists but public returned none. This indicates a backend public-filter issue or separate dataset."
                  : "Admin fallback also returned none.",
              shape: shapeInfo(adminRes),
            };

            // IMPORTANT: we do NOT silently show admin results in public mode.
            // We keep public mode honest, and only show admin results when Admin Preview is ON.
          } catch (e2) {
            meta.adminFallback = {
              attempted: true,
              used: false,
              note:
                safeText(e2?.message) ||
                "Admin fallback failed (admin route not available or key required).",
              shape: null,
            };
          }
        }
      }

      const extracted = extractArtists(res);
      setArtists(extracted);

      meta.lastUpdatedAt = new Date().toISOString();
      setDebug(meta);
    } catch (e) {
      setArtists([]);
      setError(safeText(e?.message) || "Could not load artists. Check API routes.");
      meta.lastUpdatedAt = new Date().toISOString();
      setDebug(meta);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQ("");
    // load with empty search next tick so state is correct
    setTimeout(() => load(), 0);
  }

  function toggleAdminPreview() {
    const next = !adminPreview;
    setAdminPreview(next);
    persistAdminPreview(next);
    setTimeout(() => load(), 0);
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
        <span style={pillStyle(status === "active")} onClick={() => setStatus("active")}>
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

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => load()} disabled={loading} style={buttonStyle("primary")}>
            {loading ? "Loading…" : "Search"}
          </button>

          <button onClick={clearSearch} style={buttonStyle("secondary")}>
            Clear
          </button>

          <button onClick={toggleAdminPreview} style={buttonStyle("secondary")}>
            Admin Preview: {adminPreview ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => load({ forceCanonical: true })}
            style={buttonStyle("warn")}
            disabled={loading}
            title="Runs public fetch, then tries admin fallback for diagnosis (does not display admin results unless Admin Preview is ON)."
          >
            Force Canonical Fetch
          </button>
        </div>

        <div style={{ marginTop: 10, opacity: 0.7 }}>
          Showing: {artists.length} artists
        </div>

        {!adminPreview && debug?.adminFallback?.used ? (
          <div style={{ marginTop: 10, color: "rgba(255,147,43,0.9)", fontWeight: 900 }}>
            Admin can see ACTIVE artists but Public shows none. Turn <b>Admin Preview ON</b>{" "}
            to view them now — then we’ll fix the backend public filter next.
          </div>
        ) : null}

        {error ? (
          <div style={{ marginTop: 10, color: "#ffb3b3" }}>{error}</div>
        ) : null}
      </Card>

      {/* Results */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Results</div>

        {!loading && artists.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>No artists found.</div>
        ) : null}

        {artists.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {artists.map((a) => {
              const id = safeText(a.id || a._id);
              const viewTo = `/artist/${encodeURIComponent(id || "")}`;

              return (
                <div
                  key={id || `${safeText(a.name)}-${Math.random()}`}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{safeText(a.name)}</div>

                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    {safeText(a.genre)} • {safeText(a.location)} •{" "}
                    <b>{safeText(a.status)}</b>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {/* BIG TAP TARGET: this is what you tap */}
                    <Link
                      to={viewTo}
                      style={{
                        textDecoration: "none",
                        borderRadius: 16,
                        padding: "12px 16px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        fontWeight: 900,
                        display: "inline-block",
                        minWidth: 110,
                        textAlign: "center",
                      }}
                    >
                      View →
                    </Link>

                    <div style={{ opacity: 0.65, alignSelf: "center" }}>
                      ID: {id || "(missing id)"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </Card>

      {/* Debug */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Debug</div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          This helps us see response shapes without breaking the UI.
        </div>

        <pre
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.25)",
            overflow: "auto",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {JSON.stringify(debug, null, 2)}
        </pre>
      </Card>
    </div>
  );
}