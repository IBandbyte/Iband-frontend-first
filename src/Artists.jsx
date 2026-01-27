import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, API_BASE } from "./services/api";

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

// Normalizes many backend shapes into an array of artists
function extractArtists(res) {
  if (!res) return [];

  // Most common: { success, count, artists: [...] }
  if (Array.isArray(res?.artists)) return res.artists;

  // Sometimes: { data: { artists: [...] } } (axios-like)
  if (Array.isArray(res?.data?.artists)) return res.data.artists;

  // Sometimes: { data: [...] }
  if (Array.isArray(res?.data)) return res.data;

  // Sometimes: { items: [...] } or { results: [...] }
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.results)) return res.results;

  // Sometimes backend returns array directly: [...]
  if (Array.isArray(res)) return res;

  return [];
}

export default function Artists() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active"); // default public view
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [artists, setArtists] = useState([]);
  const [debug, setDebug] = useState(null);

  const canSearch = useMemo(() => safeText(q).trim().length >= 0, [q]);

  async function load() {
    if (!canSearch) return;

    setLoading(true);
    setError("");
    setDebug(null);

    try {
      const res = await api.listArtists({
        status,
        query: safeText(q).trim() || "",
      });

      const list = extractArtists(res);

      setArtists(list);

      // tiny dev debug: helps if it ever breaks again
      setDebug({
        status,
        query: safeText(q).trim() || "",
        receivedType: Array.isArray(res) ? "array" : typeof res,
        keys: res && typeof res === "object" ? Object.keys(res).slice(0, 12) : [],
        count: Array.isArray(list) ? list.length : 0,
      });
    } catch (e) {
      setArtists([]);

      const msg =
        safeText(e?.message) ||
        safeText(e?.data?.message) ||
        safeText(e?.data?.error) ||
        "Could not load artists. Check API base + routes.";

      setError(msg);

      setDebug({
        status,
        query: safeText(q).trim() || "",
        url: safeText(e?.url),
        httpStatus: e?.status,
        raw: e?.data || null,
      });
    } finally {
      setLoading(false);
    }
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

        <Link to="/submit" style={{ ...pillStyle(false), cursor: "pointer" }}>
          + Submit Artist
        </Link>
      </div>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Search</div>
        <div style={{ marginTop: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search artists (name, genre, location)…"
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
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={load}
            disabled={loading}
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(154,74,255,0.25)",
              color: "white",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Loading…" : "Search"}
          </button>

          <button
            onClick={() => {
              setQ("");
              setError("");
              setArtists([]);
              setDebug(null);
              // reload after clear
              setTimeout(() => load(), 0);
            }}
            disabled={loading}
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            Clear
          </button>
        </div>

        {error ? (
          <div style={{ marginTop: 12, opacity: 0.95, color: "#ffb3b3", whiteSpace: "pre-wrap" }}>
            {error}
          </div>
        ) : null}

        {debug ? (
          <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12, whiteSpace: "pre-wrap" }}>
            Debug: {JSON.stringify(debug, null, 2)}
          </div>
        ) : null}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Results</div>

        {loading ? <div style={{ marginTop: 12, opacity: 0.8 }}>Loading…</div> : null}

        {!loading && (!artists || artists.length === 0) ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>No artists found.</div>
        ) : null}

        {!loading && artists && artists.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {artists.map((a, idx) => {
              const id = safeText(a?.id || a?._id || a?.slug);
              const key = id || `${safeText(a?.name)}-${idx}`;

              return (
                <div
                  key={key}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {safeText(a?.name || "Unnamed Artist")}
                  </div>

                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    {safeText(a?.genre)} • {safeText(a?.location)} •{" "}
                    <b>{safeText(a?.status || status)}</b>
                  </div>

                  <div style={{ opacity: 0.85, marginTop: 8 }}>
                    {safeText(a?.bio).slice(0, 140)}
                    {safeText(a?.bio).length > 140 ? "…" : ""}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <Link
                      to={id ? `/artist/${encodeURIComponent(id)}` : "/artists"}
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