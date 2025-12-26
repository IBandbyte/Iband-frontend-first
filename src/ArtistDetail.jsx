import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

function Button({ children, onClick, disabled, variant = "primary" }) {
  const base = {
    borderRadius: 16,
    padding: "12px 16px",
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
  };

  const style =
    variant === "primary"
      ? {
          ...base,
          background:
            "linear-gradient(90deg, rgba(154,74,255,0.95), rgba(255,147,43,0.95))",
          color: "black",
        }
      : {
          ...base,
          background: "rgba(255,255,255,0.08)",
          color: "white",
        };

  return (
    <button onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
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

export default function ArtistDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [artist, setArtist] = useState(null);
  const [lastFetchMs, setLastFetchMs] = useState(0);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError("");

    const started = Date.now();
    try {
      const payload = await api.getArtist(id);

      const raw =
        (payload && payload.data && typeof payload.data === "object" && payload.data) ||
        (payload && payload.artist && typeof payload.artist === "object" && payload.artist) ||
        (payload && typeof payload === "object" && payload) ||
        null;

      if (!raw) {
        throw new Error("Artist not found");
      }

      setArtist(normalizeArtist(raw));
    } catch (e) {
      setArtist(null);
      setError(e?.message || "Failed to load artist");
    } finally {
      setLastFetchMs(Date.now() - started);
      setLoading(false);
    }
  }

  async function vote(amount = 1) {
    if (!id) return;
    setVoting(true);
    setError("");

    try {
      const payload = await api.voteArtist(id, amount);

      // Try to pull updated artist from response if backend returns it
      const updated =
        (payload && payload.data && typeof payload.data === "object" && payload.data) ||
        (payload && payload.artist && typeof payload.artist === "object" && payload.artist) ||
        null;

      if (updated) {
        setArtist(normalizeArtist(updated));
        return;
      }

      // Otherwise optimistic update + refresh
      setArtist((prev) =>
        prev ? { ...prev, votes: toNumber(prev.votes, 0) + amount } : prev
      );
      await load();
    } catch (e) {
      setError(e?.message || "Vote failed");
    } finally {
      setVoting(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const subtitle = useMemo(() => {
    if (!artist) return "";
    return [artist.genre, artist.location].filter(Boolean).join(" • ");
  }, [artist]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>
            {artist?.name || (loading ? "Loading…" : "Artist")}
          </h1>
          <p style={{ opacity: 0.85, marginTop: 10 }}>
            API: {API_BASE}
            {lastFetchMs ? ` • ${lastFetchMs}ms` : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            to="/artists"
            style={{
              textDecoration: "none",
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 900,
            }}
          >
            ← Back
          </Link>
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
            If Render cold-started, try refresh once.
          </div>
        </div>
      ) : null}

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
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {artist?.imageUrl ? (
            <img
              src={artist.imageUrl}
              alt={artist.name}
              style={{
                width: 110,
                height: 110,
                borderRadius: 18,
                objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            />
          ) : (
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 28,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              {(artist?.name || "A").slice(0, 1).toUpperCase()}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            {subtitle ? (
              <div style={{ opacity: 0.8, marginTop: 2 }}>{subtitle}</div>
            ) : null}

            {artist?.bio ? (
              <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.45 }}>
                {artist.bio}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <Pill>Votes: {toNumber(artist?.votes, 0)}</Pill>
              <Pill>Status: {artist?.status || "active"}</Pill>
              <Pill>ID: {id}</Pill>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <Button onClick={() => vote(1)} disabled={voting || loading || !id}>
                {voting ? "Voting…" : "Vote +1"}
              </Button>

              <Button onClick={load} disabled={loading} variant="secondary">
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        {artist?.tracks?.length ? (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 900, marginBottom: 10, fontSize: 18 }}>Tracks</div>
            <div style={{ display: "grid", gap: 10 }}>
              {artist.tracks.map((t, idx) => (
                <div
                  key={`${artist.id}-trk-${idx}`}
                  style={{
                    borderRadius: 14,
                    padding: "12px 12px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.25)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900 }}>{t.title || "Track"}</div>
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
                        padding: "10px 12px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        height: "fit-content",
                        whiteSpace: "nowrap",
                        fontWeight: 900,
                      }}
                    >
                      Open
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 18, opacity: 0.8 }}>
            No tracks yet. Next phase adds richer previews + comments.
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, opacity: 0.75, fontSize: 13 }}>
        Notes: Vote uses <b>POST /artists/:id/votes</b> with <b>{"{ amount: 1 }"}</b>.
      </div>
    </div>
  );
}