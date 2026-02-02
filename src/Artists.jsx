import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, API_BASE, getAdminKey } from "./services/api";

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

function shapeOf(res) {
  const obj = res && typeof res === "object" ? res : null;
  const keys = obj ? Object.keys(obj) : [];
  const dataKeys =
    obj && obj.data && typeof obj.data === "object" ? Object.keys(obj.data) : [];
  const artistsLen = extractArtists(res).length;
  const count =
    typeof obj?.count === "number"
      ? obj.count
      : typeof obj?.data?.count === "number"
        ? obj.data.count
        : artistsLen;

  return {
    receivedType: Array.isArray(res) ? "array" : typeof res,
    keys,
    dataKeys,
    count,
    artistsLen,
  };
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

  // Admin-aware preview
  const [adminPreview, setAdminPreview] = useState(false);
  const [adminHint, setAdminHint] = useState("");
  const [debug, setDebug] = useState(null);

  const hasAdminKey = useMemo(() => {
    try {
      return !!safeText(getAdminKey?.() || "").trim();
    } catch {
      return false;
    }
  }, []);

  const canSearch = useMemo(() => safeText(q).trim().length >= 0, [q]);

  async function load({ forceCanonical = false } = {}) {
    if (!canSearch) return;

    setLoading(true);
    setError("");
    setAdminHint("");

    const dbg = {
      apiBase: API_BASE,
      status,
      q: safeText(q).trim(),
      primary: null,
      adminFallback: {
        attempted: false,
        used: false,
        note: "",
        shape: null,
      },
      lastUpdatedAt: new Date().toISOString(),
    };

    try {
      // Primary (public) fetch
      // forceCanonical: still uses api client, but we mark it in debug for you
      const res = await api.listArtists({
        status,
        query: safeText(q).trim(),
        forceCanonical: !!forceCanonical,
      });

      dbg.primary = shapeOf(res);

      const extracted = extractArtists(res);
      setArtists(extracted);

      // If public is empty, and we have admin key saved, do an admin visibility check
      if (extracted.length === 0 && hasAdminKey) {
        dbg.adminFallback.attempted = true;

        // First check admin ACTIVE for truth
        let adminResActive = null;
        try {
          adminResActive = await api.adminListArtists({
            status: "active",
            q: safeText(q).trim(),
            query: safeText(q).trim(),
          });
        } catch (e) {
          // ignore, we’ll report below
        }

        const activeShape = adminResActive ? shapeOf(adminResActive) : null;
        const activeArtists = extractArtists(adminResActive);

        // If admin has active but public doesn’t, we show hint + allow preview toggle
        if (activeArtists.length > 0) {
          dbg.adminFallback.used = true;
          dbg.adminFallback.shape = activeShape;
          dbg.adminFallback.note =
            "Admin can see active artists but public returned none. This indicates a backend public-filter issue or separate dataset.";

          setAdminHint(
            "Admin can see ACTIVE artists but Public shows none. Use Admin Preview below, and we’ll fix the backend public filter next."
          );

          if (adminPreview) setArtists(activeArtists);
          setDebug(dbg);
          return;
        }

        // Otherwise check admin PENDING (most common reason)
        let adminResPending = null;
        try {
          adminResPending = await api.adminListArtists({
            status: "pending",
            q: safeText(q).trim(),
            query: safeText(q).trim(),
          });
        } catch (e) {
          // ignore, report below
        }

        const pendingArtists = extractArtists(adminResPending);

        if (pendingArtists.length > 0) {
          dbg.adminFallback.used = true;
          dbg.adminFallback.shape = shapeOf(adminResPending);
          dbg.adminFallback.note =
            "Admin has PENDING artists. Public list is active-only, so nothing will show until approved.";

          setAdminHint(
            "You have PENDING artists. Public view is ACTIVE-only. Approve the artist in Admin → Artists Inbox to make it appear publicly."
          );

          if (adminPreview) setArtists(pendingArtists);
          setDebug(dbg);
          return;
        }

        // If admin returns nothing too
        dbg.adminFallback.used = false;
        dbg.adminFallback.note =
          "Admin did not return active or pending artists either.";
      }

      setDebug(dbg);
    } catch (e) {
      setArtists([]);
      setError(safeText(e?.message) || "Could not load artists. Check API routes.");
      dbg.primary = { error: safeText(e?.message) || "request failed" };
      setDebug(dbg);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQ("");
    // load with the cleared state (next tick)
    setTimeout(() => load(), 0);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, adminPreview]);

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

          <button onClick={clearSearch} style={buttonStyle(false)}>
            Clear
          </button>

          {hasAdminKey ? (
            <button
              onClick={() => setAdminPreview((v) => !v)}
              style={{
                ...buttonStyle(false),
                borderColor: adminPreview ? "rgba(255,147,43,0.55)" : "rgba(255,255,255,0.12)",
              }}
              title="Uses Admin API if public list is empty"
            >
              {adminPreview ? "Admin Preview: ON" : "Admin Preview: OFF"}
            </button>
          ) : null}

          <button
            onClick={() => load({ forceCanonical: true })}
            disabled={loading}
            style={{
              ...buttonStyle(false),
              borderColor: "rgba(255,147,43,0.30)",
            }}
            title="Forces a fresh fetch + refreshes debug timestamp"
          >
            Force Canonical Fetch
          </button>
        </div>

        <div style={{ marginTop: 10, opacity: 0.7 }}>
          Showing: {artists.length} artists
        </div>

        {adminHint ? (
          <div style={{ marginTop: 10, color: "#ffd7a6", fontWeight: 700 }}>
            {adminHint}
          </div>
        ) : null}

        {error ? <div style={{ marginTop: 10, color: "#ffb3b3" }}>{error}</div> : null}
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
              const id = safeText(a.id || a._id || a.artistId);
              const safeId = encodeURIComponent(id);

              return (
                <div
                  key={id || Math.random()}
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

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link
                      to={`/artist/${safeId}`}
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

                    <span style={{ opacity: 0.6, fontSize: 12, alignSelf: "center" }}>
                      ID: {id || "(missing id)"}
                    </span>
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
            padding: 12,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.25)",
            overflowX: "auto",
            fontSize: 12,
            lineHeight: 1.35,
          }}
        >
          {JSON.stringify(debug || { ready: true }, null, 2)}
        </pre>
      </Card>
    </div>
  );
}