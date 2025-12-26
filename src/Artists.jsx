import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, API_BASE } from "./services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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
    imageUrl: safeText(a.imageUrl || a.image || ""),
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

function Pill({ children }) {
  return (
    <span
      style={{
        borderRadius: 999,
        padding: "8px 12px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        fontSize: 13,
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}

function SoftBtn({ children, to, onClick, disabled }) {
  const common = {
    textDecoration: "none",
    borderRadius: 16,
    padding: "12px 16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
    display: "inline-block",
  };

  if (to) {
    return (
      <Link to={to} style={common}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} style={common}>
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 16,
        padding: "12px 16px",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(90deg, rgba(154,74,255,0.95), rgba(255,147,43,0.95))",
        color: "black",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.8 : 1,
      }}
    >
      {children}
    </button>
  );
}

function ArtistCard({ artist }) {
  const subtitle = [artist.genre, artist.location].filter(Boolean).join(" • ");

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
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {artist.imageUrl ? (
          <img
            src={artist.imageUrl}
            alt={artist.name}
            style={{
              width: 96,
              height: 96,
              borderRadius: 16,
              objectFit: "cover",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          />
        ) : (
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 22,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            {artist.name?.slice(0, 1)?.toUpperCase() || "A"}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
            {artist.name}
          </div>

          {subtitle ? <div style={{ opacity: 0.8, marginTop: 6 }}>{subtitle}</div> : null}

          {artist.bio ? (
            <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.45 }}>
              {artist.bio}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Pill>Votes: {toNumber(artist.votes, 0)}</Pill>
            <Pill>Status: {artist.status}</Pill>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <SoftBtn to={`/artists/${encodeURIComponent(artist.id)}`}>View</SoftBtn>
          </div>
        </div>
      </div>

      {artist.tracks.length ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Tracks</div>

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

    const started = Date.now();
    try {
      const payload = await api.listArtists({ q: query || undefined, limit: 50, page: 1 });

      const listRaw =
        (payload && payload.data && Array.isArray(payload.data) && payload.data) ||
        (payload && payload.artists && Array.isArray(payload.artists) && payload.artists) ||
        (Array.isArray(payload) && payload) ||
        [];

      setArtists(listRaw.map(normalizeArtist));
    } catch (e) {
      setArtists([]);
      setError(e?.message || "Failed to load artists");
    } finally {
      setLastFetchMs(Date.now() - started);
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return artists;

    return artists.filter((a) => {
      const hay = [a.name, a.genre, a.location, String(a.votes ?? ""), a.bio]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [artists, query]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>Artists</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Live feed from backend • API: {API_BASE}
        {lastFetchMs ? ` • ${lastFetchMs}ms` : ""}
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
        <PrimaryBtn onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </PrimaryBtn>

        <div style={{ opacity: 0.7, alignSelf: "center" }}>
          Showing {filtered.length} artist(s)
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
            Render may cold-start. Hit Refresh once or twice.
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 16 }}>
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
              Backend returned an empty list. Next we’ll seed + admin submit.
            </div>
          </div>
        ) : null}

        {filtered.map((a) => (
          <ArtistCard key={a.id || a.name} artist={a} />
        ))}
      </div>
    </div>
  );
}