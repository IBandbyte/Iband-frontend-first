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

function buttonStyle(primary) {
  return {
    borderRadius: 16,
    padding: "12px 18px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: primary ? "rgba(154,74,255,0.25)" : "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 900,
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

  if (Array.isArray(res)) return res;

  return [];
}

function debugShape(res) {
  const receivedType = Array.isArray(res) ? "array" : typeof res;
  const keys = res && typeof res === "object" && !Array.isArray(res) ? Object.keys(res) : [];
  const dataKeys =
    res && typeof res === "object" && res.data && typeof res.data === "object"
      ? Object.keys(res.data)
      : [];
  const artists = extractArtists(res);
  const count =
    typeof res?.count === "number"
      ? res.count
      : typeof res?.data?.count === "number"
      ? res.data.count
      : artists.length;

  return { receivedType, keys, dataKeys, count, artistsLen: artists.length };
}

function normalizeStatus(s) {
  return safeText(s).trim().toLowerCase();
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

  // Debug state
  const [debug, setDebug] = useState(null);

  const canSearch = useMemo(() => safeText(q).trim().length >= 0, [q]);

  async function load({ forceAdminFallback = false } = {}) {
    if (!canSearch) return;

    setLoading(true);
    setError("");

    const trimmedQ = safeText(q).trim();
    const normalizedStatus = normalizeStatus(status);

    const dbg = {
      apiBase: API_BASE,
      status: normalizedStatus,
      q: trimmedQ,
      primary: null,
      adminFallback: {
        attempted: false,
        used: false,
        shape: null,
      },
      lastUpdatedAt: new Date().toISOString(),
    };

    try {
      // 1) Primary: PUBLIC list
      const res = await api.listArtists({
        status: normalizedStatus,
        query: trimmedQ,
      });

      const primaryArtists = extractArtists(res);
      dbg.primary = debugShape(res);

      // If we got artists, render them immediately.
      if (primaryArtists.length > 0 && !forceAdminFallback) {
        setArtists(primaryArtists);
        setDebug(dbg);
        return;
      }

      // 2) DEV fallback: ADMIN list (only if admin key is saved)
      // We do this when:
      // - forceAdminFallback is true OR
      // - status is not "active" (pending/rejected are dev-only) OR
      // - primary returned empty but we still want to see what's in admin
      const shouldTryAdmin =
        forceAdminFallback ||
        normalizedStatus !== "active" ||
        primaryArtists.length === 0;

      if (shouldTryAdmin) {
        dbg.adminFallback.attempted = true;

        try {
          const adminRes = await api.adminListArtists({
            status: normalizedStatus,
            q: trimmedQ,
          });

          const adminArtists = extractArtists(adminRes);
          dbg.adminFallback.shape = debugShape(adminRes);

          // If admin has artists, use them.
          if (adminArtists.length > 0) {
            dbg.adminFallback.used = true;
            setArtists(adminArtists);
            setDebug(dbg);
            return;
          }
        } catch (eAdmin) {
          // If admin key isn't set, or route is protected, this may fail.
          // We keep this silent and just continue to show primary result.
          dbg.adminFallback.shape = {
            error: safeText(eAdmin?.message || "Admin fallback failed"),
            status: Number(eAdmin?.status || 0) || undefined,
          };
        }
      }

      // 3) No luck: show primary (empty) result.
      setArtists(primaryArtists);
      setDebug(dbg);

      // Helpful error only if BOTH are empty and user searched something specific
      if (trimmedQ && primaryArtists.length === 0) {
        setError("No matching artists found on the current data source.");
      }
    } catch (e) {
      setArtists([]);
      setDebug({
        apiBase: API_BASE,
        status: normalizeStatus(status),
        q: safeText(q).trim(),
        error: safeText(e?.message) || "Could not load artists.",
        statusCode: Number(e?.status || 0) || undefined,
        lastUpdatedAt: new Date().toISOString(),
      });

      setError(safeText(e?.message) || "Could not load artists. Check API routes.");
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQ("");
    // reload with empty search
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
        <span style={pillStyle(status === "active")} onClick={() => setStatus("active")}>
          Active
        </span>

        <span style={pillStyle(status === "pending")} onClick={() => setStatus("pending")}>
          Pending (dev)
        </span>

        <span style={pillStyle(status === "rejected")} onClick={() => setStatus("rejected")}>
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
          <button onClick={() => load()} disabled={loading} style={buttonStyle(true)}>
            {loading ? "Loading…" : "Search"}
          </button>

          <button onClick={clearSearch} disabled={loading} style={buttonStyle(false)}>
            Clear
          </button>

          <button
            onClick={() => load({ forceAdminFallback: true })}
            disabled={loading}
            style={{
              ...buttonStyle(false),
              background: "rgba(255,147,43,0.14)",
              border: "1px solid rgba(255,147,43,0.25)",
            }}
            title="DEV: If public returns 0, try admin route (requires admin key saved in /admin)"
          >
            Force Canonical Fetch
          </button>
        </div>

        <div style={{ marginTop: 10, opacity: 0.7 }}>
          Showing: {artists.length} artists
          {debug?.adminFallback?.used ? (
            <span style={{ marginLeft: 10, color: "rgba(255,147,43,0.9)", fontWeight: 900 }}>
              (admin fallback)
            </span>
          ) : null}
        </div>

        {error ? <div style={{ marginTop: 10, color: "#ffb3b3" }}>{error}</div> : null}
      </Card>

      {/* Debug */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Debug</div>
        <pre
          style={{
            marginTop: 10,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.25)",
            whiteSpace: "pre-wrap",
            overflow: "hidden",
            fontSize: 12,
            lineHeight: 1.35,
            opacity: 0.9,
          }}
        >
          {JSON.stringify(debug || { note: "No debug yet." }, null, 2)}
        </pre>
      </Card>

      {/* Results */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Results</div>

        {!loading && artists.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>No artists found.</div>
        ) : null}

        {artists.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {artists.map((a, idx) => {
              const id = safeText(a.id || a._id || a.uuid || a.slug || idx);

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
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{safeText(a.name)}</div>

                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    {safeText(a.genre)} • {safeText(a.location)} • <b>{safeText(a.status)}</b>
                  </div>

                  {safeText(a.bio) ? (
                    <div style={{ marginTop: 10, opacity: 0.78 }}>{safeText(a.bio)}</div>
                  ) : null}

                  <div style={{ marginTop: 12 }}>
                    {/* THIS is what you tap to view */}
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