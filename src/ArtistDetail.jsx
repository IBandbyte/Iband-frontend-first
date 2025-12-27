import React, { useEffect, useState } from "react";
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

function Pill({ children }) {
  return (
    <span
      style={{
        borderRadius: 999,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        fontSize: 13,
        fontWeight: 900,
        display: "inline-block",
      }}
    >
      {children}
    </span>
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

function SoftBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 16,
        padding: "12px 16px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.08)",
        color: "white",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
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
        payload;

      setArtist(normalizeArtist(raw || {}));
    } catch (e) {
      setArtist(null);
      setError(e?.message || "Failed to load artist");
    } finally {
      setLastFetchMs(Date.now() - started);
      setLoading(false);
    }
  }

  async function vote() {
    if (!id) return;

    setVoting(true);
    setError("");
    try {
      await apiFetchVote(id);
      await load();
    } catch (e) {
      setError(e?.message || "Vote failed");
    } finally {
      setVoting(false);
    }
  }

  async function apiFetchVote(artistId) {
    // Backend route: POST /artists/:id/votes with body { amount: 1 }
    return apiFetchRaw(`/artists/${encodeURIComponent(artistId)}/votes`, {
      method: "POST",
      body: { amount: 1 },
    });
  }

  async function apiFetchRaw(path, options) {
    // Reuse your shared api client if you already exposed a helper;
    // otherwise keep it simple by calling api.getArtist/api.listArtists on the shared api.
    // Here we call api.listArtists() style only through the shared apiFetch by using api.health trick:
    // We DON'T have direct access unless it's exported; so we call fetch directly here safely.
    const base = API_BASE.replace(/\/+$/, "");
    const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(url, {
        method: options.method || "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
      });

      const text = await res.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!res.ok) {
        const msg =
          (data && typeof data === "object" && (data.error || data.message)) ||
          `Request failed (${res.status})`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (e) {
      if (e?.name === "AbortError") throw new Error("Request timed out");
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const subtitle = artist ? [artist.genre, artist.location].filter(Boolean).join(" • ") : "";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 60, margin: 0, letterSpacing: -1 }}>
        {artist?.name || (loading ? "Loading…" : "Artist")}
      </h1>

      <p style={{ opacity: 0.85, marginTop: 10 }}>
        API: {API_BASE}
        {lastFetchMs ? ` • ${lastFetchMs}ms` : ""}
      </p>

      <div style={{ marginTop: 14 }}>
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
            display: "inline-block",
          }}
        >
          ← Back
        </Link>
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
        </div>
      ) : null}

      {artist ? (
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
            {artist.imageUrl ? (
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
                  fontSize: 30,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                {artist.name?.slice(0, 1)?.toUpperCase() || "A"}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              {subtitle ? <div style={{ opacity: 0.85, fontSize: 18 }}>{subtitle}</div> : null}

              {artist.bio ? (
                <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.45 }}>
                  {artist.bio}
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <Pill>Votes: {toNumber(artist.votes, 0)}</Pill>
                <Pill>Status: {artist.status}</Pill>
                <Pill>ID: {artist.id}</Pill>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <PrimaryBtn onClick={vote} disabled={voting || loading}>
                  {voting ? "Voting…" : "Vote +1"}
                </PrimaryBtn>
                <SoftBtn onClick={load} disabled={loading}>
                  {loading ? "Loading…" : "Refresh"}
                </SoftBtn>
              </div>
            </div>
          </div>

          {artist.tracks.length ? (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 10 }}>Tracks</div>

              <div style={{ display: "grid", gap: 10 }}>
                {artist.tracks.slice(0, 5).map((t, idx) => (
                  <div
                    key={`${artist.id}-track-${idx}`}
                    style={{
                      borderRadius: 16,
                      padding: "12px 14px",
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(0,0,0,0.25)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>
                        {t.title || "Track"}
                      </div>
                      <div style={{ opacity: 0.75, fontSize: 13, marginTop: 4 }}>
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
                          borderRadius: 16,
                          padding: "10px 14px",
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.08)",
                          color: "white",
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Open
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>

              <div style={{ opacity: 0.7, marginTop: 12, fontSize: 13 }}>
                Notes: Vote uses POST /artists/:id/votes with {"{ amount: 1 }"}.
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}