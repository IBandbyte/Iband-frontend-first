import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, API_BASE } from "./services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function normalizeArtistsResponse(res) {
  // Supports:
  // - { artists: [...] }
  // - { data: { artists: [...] } }
  // - { data: [...] }
  // - [...] (rare)
  const direct = res?.artists;
  if (Array.isArray(direct)) return direct;

  const dataArtists = res?.data?.artists;
  if (Array.isArray(dataArtists)) return dataArtists;

  const data = res?.data;
  if (Array.isArray(data)) return data;

  if (Array.isArray(res)) return res;

  return [];
}

function pillStyle(active) {
  return {
    appearance: "none",
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

export default function Artists() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active"); // public default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [artists, setArtists] = useState([]);
  const [lastMeta, setLastMeta] = useState({ count: 0, success: null });

  const trimmedQ = useMemo(() => safeText(q).trim(), [q]);

  async function load(next = {}) {
    setLoading(true);
    setError("");

    try {
      const res = await api.listArtists({
        status: next.status ?? status,
        query: next.query ?? trimmedQ,
      });

      const list = normalizeArtistsResponse(res);

      setArtists(list);
      setLastMeta({
        count:
          Number(res?.count) ||
          Number(res?.data?.count) ||
          (Array.isArray(list) ? list.length : 0),
        success:
          typeof res?.success === "boolean"
            ? res.success
            : typeof res?.data?.success === "boolean"
            ? res.data.success
            : null,
      });

      if (!Array.isArray(list)) {
        setError("Unexpected response shape (artists is not an array).");
        setArtists([]);
      }
    } catch (e) {
      setArtists([]);
      setLastMeta({ count: 0, success: false });

      setError(
        safeText(e?.message) ||
          "Could not load artists. Check API base + backend routes."
      );
    } finally {
      setLoading(false);
    }
  }

  // Auto-load when status changes (public UX)
  useEffect(() => {
    load({ status, query: trimmedQ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function onClear() {
    setQ("");
    load({ status, query: "" });
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>Artists</h1>

      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Backend: {API_BASE} • Public view shows <b>active</b> artists only.
      </p>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          style={pillStyle(status === "active")}
          onClick={() => setStatus("active")}
        >
          Active
        </button>
        <button
          type="button"
          style={pillStyle(status === "pending")}
          onClick={() => setStatus("pending")}
        >
          Pending (dev)
        </button>
        <button
          type="button"
          style={pillStyle(status === "rejected")}
          onClick={() => setStatus("rejected")}
        >
          Rejected (dev)
        </button>

        <Link to="/submit" style={pillStyle(false)}>
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
            type="button"
            onClick={() => load({ status, query: trimmedQ })}
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
              minWidth: 120,
            }}
          >
            {loading ? "Loading…" : "Search"}
          </button>

          <button
            type="button"
            onClick={onClear}
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
              minWidth: 120,
            }}
          >
            Clear
          </button>

          <div style={{ opacity: 0.7, alignSelf: "center" }}>
            {lastMeta?.success === false ? "API error" : null}
            {lastMeta?.success !== false ? `Count: ${Number(lastMeta?.count || 0)}` : null}
          </div>
        </div>

        {error ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>
            {error}
          </div>
        ) : null}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Results</div>

        {loading ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>Loading…</div>
        ) : null}

        {!loading && (!artists || artists.length === 0) ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>No artists found.</div>
        ) : null}

        {!loading && artists && artists.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {artists.map((a, idx) => {
              const id = safeText(a?.id || a?._id || a?.slug);
              const key = id || `row-${idx}`;

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