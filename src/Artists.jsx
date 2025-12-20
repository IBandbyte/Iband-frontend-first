import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "https://iband-backend-first-1.onrender.com";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function buildArtistsUrl(params) {
  const url = new URL("/artists", API_BASE);

  // Optional server-side query support (future-proof). Backend can ignore safely.
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (!s) return;
    url.searchParams.set(k, s);
  });

  return url.toString();
}

async function fetchWithTimeout(url, { timeoutMs = 12000, ...options } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    return { ok: res.ok, status: res.status, json, text };
  } finally {
    clearTimeout(id);
  }
}

function normalizeArtist(raw) {
  const a = raw || {};
  const socials = a.socials || {};
  const tracks = Array.isArray(a.tracks) ? a.tracks : [];

  return {
    id: safeText(a.id || a._id || a.slug || ""),
    name: safeText(a.name || "Unnamed Artist"),
    genre: safeText(a.genre || a.primaryGenre || ""),
    location: safeText(a.location || a.city || a.country || ""),
    bio: safeText(a.bio || a.description || ""),
    status: safeText(a.status || "active"),
    votes: toNumber(a.votes, 0),
    socials: {
      instagram: safeText(socials.instagram || ""),
      tiktok: safeText(socials.tiktok || ""),
      youtube: safeText(socials.youtube || ""),
      spotify: safeText(socials.spotify || ""),
      soundcloud: safeText(socials.soundcloud || ""),
      website: safeText(socials.website || ""),
    },
    tracks: tracks
      .map((t) => ({
        title: safeText(t.title || ""),
        url: safeText(t.url || ""),
        platform: safeText(t.platform || ""),
        durationSec: toNumber(t.durationSec, 0),
      }))
      .filter((t) => t.title || t.url),
  };
}

function ArtistCard({ artist }) {
  const subtitle = [artist.genre, artist.location].filter(Boolean).join(" • ");

  const socials = Object.entries(artist.socials || {}).filter(
    ([, v]) => v && v.startsWith("http")
  );

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.35)",
        padding: 18,
        marginBottom: 14,
        boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>
            {artist.name}
          </div>
          {subtitle ? (
            <div style={{ opacity: 0.8, marginTop: 6 }}>{subtitle}</div>
          ) : null}
          {artist.status ? (
            <div style={{ opacity: 0.65, marginTop: 6, fontSize: 13 }}>
              Status: {artist.status}
            </div>
          ) : null}
        </div>

        <div
          style={{
            borderRadius: 16,
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            textAlign: "center",
            minWidth: 84,
            height: "fit-content",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.85 }}>Votes</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>
            {toNumber(artist.votes, 0)}
          </div>
        </div>
      </div>

      {artist.bio ? (
        <div style={{ marginTop: 12, opacity: 0.9, lineHeight: 1.45 }}>
          {artist.bio}
        </div>
      ) : null}

      {artist.tracks.length ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Tracks</div>
          <div style={{ display: "grid", gap: 8 }}>
            {artist.tracks.slice(0, 3).map((t, idx) => (
              <div
                key={`${artist.id}-track-${idx}`}
                style={{
                  borderRadius: 14,
                  padding: "10px 12px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.25)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{t.title || "Track"}</div>
                  <div style={{ opacity: 0.75, fontSize: 13, marginTop: 2 }}>
                    {[t.platform, t.durationSec ? `${t.durationSec}s` : ""]
                      .filter(Boolean)
                      .join(" • ")}
                  </div>
                </div>

                {t.url && t.url.startsWith("http") ? (
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: "none",
                      borderRadius: 12,
                      padding: "8px 10px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.08)",
                      color: "white",
                      height: "fit-content",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Open
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {socials.length ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Socials</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {socials.slice(0, 6).map(([k, v]) => (
              <a
                key={`${artist.id}-social-${k}`}
                href={v}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: "none",
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  fontSize: 13,
                }}
              >
                {k}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Artists() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [artists, setArtists] = useState([]);
  const [lastFetchMs, setLastFetchMs] = useState(0);

  async function load() {
    setLoading(true);
    setError("");

    const url = buildArtistsUrl({
      // Future-proof: backend can optionally support server-side filtering/sorting
      q: query || undefined,
      order: "desc",
      sort: "new",
      limit: 50,
      page: 1,
    });

    const started = Date.now();
    const result = await fetchWithTimeout(url, { timeoutMs: 15000 });

    setLastFetchMs(Date.now() - started);

    if (!result.ok) {
      const msg =
        (result.json && (result.json.message || result.json.error)) ||
        `Route not found. (HTTP ${result.status})`;

      setArtists([]);
      setError(msg);
      setLoading(false);
      return;
    }

    const payload = result.json;
    const listRaw =
      (payload && payload.data && Array.isArray(payload.data) && payload.data) ||
      (Array.isArray(payload) && payload) ||
      [];

    const normalized = listRaw.map(normalizeArtist);
    setArtists(normalized);
    setLoading(false);
  }

  useEffect(() => {
    // Initial load
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return artists;

    return artists.filter((a) => {
      const hay = [
        a.name,
        a.genre,
        a.location,
        String(a.votes ?? ""),
        a.bio,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [artists, query]);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>Artists</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Live route. This now fetches from the backend and renders cards.
      </p>

      <div style={{ marginTop: 18 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search artists (name, genre, location, votes)…"
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

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button
          onClick={load}
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
          {loading ? "Loading…" : "Refresh"}
        </button>

        <a
          href="/artists/demo"
          style={{
            borderRadius: 16,
            padding: "12px 16px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          Open demo artist
        </a>

        <div style={{ opacity: 0.7, alignSelf: "center" }}>
          API: {API_BASE}
          {lastFetchMs ? ` • ${lastFetchMs}ms` : ""}
        </div>
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
          <div style={{ fontWeight: 900, fontSize: 18 }}>Error</div>
          <div style={{ opacity: 0.9, marginTop: 6 }}>{error}</div>
          <div style={{ opacity: 0.75, marginTop: 8, fontSize: 13 }}>
            If you see timeouts: the backend may be cold-starting on Render. Hit
            Refresh once or twice.
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 16 }}>
        {loading && !artists.length ? (
          <div style={{ opacity: 0.85 }}>Loading artists…</div>
        ) : null}

        {!loading && !filtered.length ? (
          <div
            style={{
              marginTop: 10,
              padding: 18,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 20 }}>No artists yet</div>
            <div style={{ opacity: 0.85, marginTop: 6 }}>
              The backend returned an empty list. That’s okay — next we’ll add
              admin submission + seed data.
            </div>
          </div>
        ) : null}

        {filtered.map((a) => (
          <ArtistCard key={a.id || a.name} artist={a} />
        ))}
      </div>

      <div style={{ opacity: 0.6, marginTop: 18, fontSize: 13 }}>
        Tip: set <b>VITE_API_BASE_URL</b> on Vercel later to swap backend
        environments without code changes.
      </div>
    </div>
  );
}