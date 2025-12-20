import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const DEFAULT_API_BASE = "https://iband-backend-first-1.onrender.com";

// Small helper: safe string
function s(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

// Small helper: safe number
function n(v, fallback = 0) {
  const num = Number(v);
  return Number.isFinite(num) ? num : fallback;
}

// Build API URL with env override
function getApiBaseUrl() {
  const env = s(import.meta?.env?.VITE_API_BASE_URL).trim();
  if (env) return env.replace(/\/+$/, "");
  return DEFAULT_API_BASE;
}

function normalizeArtist(raw) {
  const id = s(raw?.id || raw?._id || raw?.slug || "").trim();
  const name = s(raw?.name || raw?.artistName || "").trim();
  const genre = s(raw?.genre || raw?.style || "").trim();
  const location = s(raw?.location || raw?.city || raw?.country || "").trim();
  const votes = n(raw?.votes, 0);

  const status = s(raw?.status || "active").trim() || "active";
  const bio = s(raw?.bio || raw?.about || "").trim();

  const links = raw?.links && typeof raw.links === "object" ? raw.links : {};
  const tracks = Array.isArray(raw?.tracks) ? raw.tracks : [];

  return {
    id: id || "unknown",
    name: name || "Untitled Artist",
    genre: genre || "Unknown",
    location: location || "Unknown",
    votes,
    status,
    bio,
    links,
    tracks,
    _raw: raw,
  };
}

function formatError(err) {
  if (!err) return "Unknown error";
  if (err.name === "AbortError") return "Request timed out. Try Refresh.";
  return s(err.message || err);
}

function getPrimaryLink(artist) {
  const links = artist?.links || {};
  const order = ["spotify", "youtube", "soundcloud", "instagram", "tiktok", "website"];
  for (const key of order) {
    const url = s(links[key]).trim();
    if (url) return { label: key.toUpperCase(), url };
  }
  return null;
}

const pageWrapStyle = {
  minHeight: "100vh",
  padding: "24px 16px 80px",
};

const containerStyle = {
  maxWidth: "960px",
  margin: "0 auto",
};

const headerStyle = {
  margin: "0 0 10px",
  fontSize: "48px",
  letterSpacing: "-0.02em",
};

const subStyle = {
  margin: "0 0 18px",
  opacity: 0.85,
  lineHeight: 1.4,
  fontSize: "16px",
};

const rowStyle = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const inputStyle = {
  flex: "1 1 260px",
  minWidth: "220px",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  outline: "none",
};

const btnStyle = {
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  cursor: "pointer",
  userSelect: "none",
};

const btnPrimaryStyle = {
  ...btnStyle,
  border: "none",
  background: "linear-gradient(90deg, rgba(138,80,255,0.95), rgba(255,150,48,0.95))",
  color: "#0b0b10",
  fontWeight: 700,
};

const infoBoxStyle = {
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.18)",
  padding: "14px 14px",
  marginTop: "10px",
};

const errorBoxStyle = {
  ...infoBoxStyle,
  border: "1px solid rgba(255,80,80,0.25)",
  background: "rgba(255,50,50,0.06)",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "14px",
  marginTop: "14px",
};

const cardStyle = {
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.20)",
  padding: "14px 14px",
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.2,
};

const metaStyle = {
  marginTop: "6px",
  opacity: 0.9,
  fontSize: "14px",
  lineHeight: 1.35,
};

const pillRowStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "10px",
};

const pillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 10px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.18)",
  fontSize: "13px",
  opacity: 0.95,
};

const linkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "12px",
  textDecoration: "none",
  color: "white",
  opacity: 0.95,
};

export default function Artists() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState([]);
  const [error, setError] = useState("");
  const [apiBase] = useState(() => getApiBaseUrl());

  const lastFetchAtRef = useRef(0);

  async function fetchArtists() {
    setError("");
    setLoading(true);

    const controller = new AbortController();
    const timeoutMs = 12_000; // iPhone-friendly, avoids hanging forever
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      lastFetchAtRef.current = Date.now();
      const res = await fetch(`${apiBase}/artists`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        const msg =
          s(json?.message).trim() ||
          `Request failed. (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const rawList = Array.isArray(json?.data) ? json.data : [];
      const normalized = rawList.map(normalizeArtist);

      setArtists(normalized);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setArtists([]);
      setError(formatError(e));
    } finally {
      clearTimeout(t);
    }
  }

  useEffect(() => {
    fetchArtists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return artists;

    return artists.filter((a) => {
      const haystack = [
        a.name,
        a.genre,
        a.location,
        String(a.votes),
        a.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [artists, query]);

  const subtitle = useMemo(() => {
    if (loading) return "Loading artists from the backend…";
    if (error) return "Live route. Backend returned an error — see below.";
    if (!artists.length) return "Live route. Backend returned an empty list.";
    return `Live route. Showing ${filtered.length} of ${artists.length} artists.`;
  }, [loading, error, artists.length, filtered.length]);

  return (
    <div style={pageWrapStyle}>
      <div style={containerStyle}>
        <h1 style={headerStyle}>Artists</h1>
        <p style={subStyle}>{subtitle}</p>

        <div style={rowStyle}>
          <input
            style={inputStyle}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artists (name, genre, location, votes)…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />

          <button
            type="button"
            style={btnPrimaryStyle}
            onClick={() => fetchArtists()}
          >
            Refresh
          </button>

          <button
            type="button"
            style={btnStyle}
            onClick={() => navigate("/artists/demo")}
          >
            Open demo artist
          </button>
        </div>

        {error ? (
          <div style={errorBoxStyle}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Error</div>
            <div style={{ opacity: 0.92, lineHeight: 1.45 }}>
              {error}
            </div>
            <div style={{ opacity: 0.75, marginTop: 10, fontSize: 13 }}>
              Tip: Render can cold-start. If the backend is waking up, hit{" "}
              <b>Refresh</b> once or twice.
            </div>
          </div>
        ) : null}

        {!loading && !error && artists.length === 0 ? (
          <div style={infoBoxStyle}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>
              No artists yet
            </div>
            <div style={{ opacity: 0.9, lineHeight: 1.45 }}>
              That’s okay — next phase we’ll add seed data and/or admin
              submissions.
            </div>
          </div>
        ) : null}

        {!loading && !error && artists.length > 0 ? (
          <div style={gridStyle}>
            {filtered.map((a) => {
              const primary = getPrimaryLink(a);

              return (
                <div key={a.id} style={cardStyle}>
                  <h3 style={cardTitleStyle}>{a.name}</h3>

                  <div style={metaStyle}>
                    <div>
                      <span style={{ opacity: 0.75 }}>Genre:</span>{" "}
                      <b>{a.genre}</b>
                    </div>
                    <div>
                      <span style={{ opacity: 0.75 }}>Location:</span>{" "}
                      <b>{a.location}</b>
                    </div>
                  </div>

                  <div style={pillRowStyle}>
                    <span style={pillStyle}>
                      <span style={{ opacity: 0.75 }}>Votes</span>
                      <b>{a.votes}</b>
                    </span>
                    <span style={pillStyle}>
                      <span style={{ opacity: 0.75 }}>Status</span>
                      <b>{a.status}</b>
                    </span>
                    <span style={pillStyle}>
                      <span style={{ opacity: 0.75 }}>ID</span>
                      <b>{a.id}</b>
                    </span>
                  </div>

                  {a.bio ? (
                    <div style={{ marginTop: 10, opacity: 0.88, lineHeight: 1.5 }}>
                      {a.bio}
                    </div>
                  ) : null}

                  {primary ? (
                    <a
                      style={linkStyle}
                      href={primary.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${a.name} link`}
                    >
                      <span style={{ opacity: 0.8 }}>Link:</span>
                      <b>{primary.label}</b>
                      <span style={{ opacity: 0.7 }}>↗</span>
                    </a>
                  ) : null}

                  <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={btnStyle}
                      onClick={() => navigate(`/artists/${encodeURIComponent(a.id)}`)}
                      title="If this route isn't built yet, we'll add it next."
                    >
                      View
                    </button>

                    <button
                      type="button"
                      style={btnStyle}
                      onClick={() => navigate(`/artists/${encodeURIComponent(a.id)}/votes`)}
                      title="Votes UI is coming next — backend already supports it."
                    >
                      Vote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div style={{ marginTop: 18, opacity: 0.7, fontSize: 12 }}>
          API: <span style={{ opacity: 0.9 }}>{apiBase}</span>
        </div>
      </div>
    </div>
  );
}