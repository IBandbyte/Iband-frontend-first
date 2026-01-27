import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, API_BASE } from "./services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function normalizeArtistsResponse(res) {
  // Our api.js uses fetch and returns JSON directly (not axios),
  // but we accept many shapes to be future-proof.
  const data =
    (res && res.data && typeof res.data === "object" && res.data) ||
    (res && typeof res === "object" && res) ||
    {};

  const list =
    (Array.isArray(data?.artists) && data.artists) ||
    (Array.isArray(data?.data?.artists) && data.data.artists) ||
    (Array.isArray(data?.results) && data.results) ||
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data) && data) ||
    [];

  return {
    success: Boolean(data?.success ?? true),
    count: Number(data?.count ?? list.length ?? 0),
    artists: list,
    raw: data,
  };
}

function pillStyle(active) {
  return {
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: active
      ? "linear-gradient(90deg, rgba(154,74,255,0.30), rgba(255,147,43,0.22))"
      : "rgba(255,255,255,0.06)",
    color: "white",
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-block",
  };
}

export default function Artists() {
  const [query, setQuery] = useState("");
  const [includePending, setIncludePending] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [artists, setArtists] = useState([]);

  const status = useMemo(() => {
    // Public view should show active only.
    // Toggle gives you a dev/admin view without changing backend rules.
    return includePending ? "" : "active";
  }, [includePending]);

  async function fetchArtists({ silent = false } = {}) {
    if (!silent) setLoading(true);
    setError("");

    try {
      const res = await api.listArtists({
        status,
        query: safeText(query).trim(),
      });

      const norm = normalizeArtistsResponse(res);
      setArtists(norm.artists || []);
    } catch (e) {
      setArtists([]);
      setError(
        safeText(e?.message) ||
          "Failed to load artists. Check API_BASE and backend routes."
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Auto-load on first render and whenever the status filter changes
  useEffect(() => {
    fetchArtists({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            background:
              "linear-gradient(135deg, rgba(154,74,255,1), rgba(255,147,43,1))",
          }}
        />
        <div>
          <div style={{ fontWeight: 950, fontSize: 28, lineHeight: 1 }}>
            iBand
          </div>
          <div style={{ opacity: 0.75, marginTop: 2 }}>Get Signed / Connect</div>
        </div>
      </div>

      <div style={{ opacity: 0.8, marginTop: 12 }}>
        API: <span style={{ opacity: 1 }}>{API_BASE}</span>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <Link to="/artists" style={pillStyle(true)}>
          Artists
        </Link>
        <Link to="/submit" style={pillStyle(false)}>
          Submit
        </Link>
        <Link to="/admin" style={pillStyle(false)}>
          Admin
        </Link>
      </div>

      <div
        style={{
          marginTop: 18,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.35)",
          padding: 18,
          boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ fontWeight: 950, fontSize: 26 }}>Artists</div>

        <div style={{ opacity: 0.75, marginTop: 6 }}>
          Public view shows <b>active</b> artists only.
        </div>

        <label
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginTop: 12,
            opacity: 0.9,
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={includePending}
            onChange={(e) => setIncludePending(Boolean(e.target.checked))}
          />
          Dev/Admin mode: include pending/rejected (backend must allow it)
        </label>

        <div style={{ marginTop: 14 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
            onClick={() => fetchArtists({ silent: false })}
            disabled={loading}
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background:
                "linear-gradient(90deg, rgba(154,74,255,0.95), rgba(255,147,43,0.95))",
              color: "black",
              fontWeight: 950,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Loading…" : "Search"}
          </button>

          <button
            onClick={() => {
              setQuery("");
              setError("");
              fetchArtists({ silent: false });
            }}
            disabled={loading}
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 950,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            Reset
          </button>
        </div>

        {error ? (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 16,
              border: "1px solid rgba(255,64,64,0.35)",
              background: "rgba(120,0,0,0.20)",
            }}
          >
            <div style={{ fontWeight: 950, fontSize: 18 }}>Error</div>
            <div style={{ opacity: 0.9, marginTop: 6 }}>{error}</div>
          </div>
        ) : null}
      </div>

      <div
        style={{
          marginTop: 16,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.25)",
          padding: 18,
        }}
      >
        {artists.length === 0 ? (
          <div style={{ opacity: 0.9, fontSize: 18 }}>No artists found.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {artists.map((a) => {
              const id = safeText(a?.id || a?._id || a?.slug || "");
              const name = safeText(a?.name || "Untitled Artist");
              const genre = safeText(a?.genre);
              const location = safeText(a?.location);
              const votes = Number(a?.votes ?? 0);

              return (
                <div
                  key={id || name + Math.random()}
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.35)",
                    padding: 16,
                  }}
                >
                  <div style={{ fontWeight: 950, fontSize: 20 }}>{name}</div>
                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    {genre ? <span>{genre}</span> : null}
                    {genre && location ? <span> • </span> : null}
                    {location ? <span>{location}</span> : null}
                  </div>

                  <div style={{ opacity: 0.85, marginTop: 8 }}>
                    Votes: <b>{votes}</b>
                  </div>

                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {id ? (
                      <Link to={`/artist/${encodeURIComponent(id)}`} style={pillStyle(true)}>
                        View →
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ opacity: 0.65, marginTop: 18, textAlign: "center" }}>
        Powered by Fans. A Platform for Artists and Influencers.
      </div>
    </div>
  );
}