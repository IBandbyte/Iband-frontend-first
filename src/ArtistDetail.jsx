import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "./services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function cleanUrl(v) {
  const s = safeText(v).trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://${s}`;
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

export default function ArtistDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [artist, setArtist] = useState(null);

  const artistId = useMemo(() => safeText(id), [id]);

  async function load() {
    if (!artistId) return;
    setLoading(true);
    setError("");
    try {
      const a = await api.getArtist(artistId);
      setArtist(a || null);
    } catch (e) {
      setArtist(null);
      setError(safeText(e?.message) || "Could not load artist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  const socials = artist?.socials || {};
  const tracks = Array.isArray(artist?.tracks) ? artist.tracks : [];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <div style={{ marginBottom: 10 }}>
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
          ← Back to Artists
        </Link>
      </div>

      <Card>
        {loading ? <div style={{ opacity: 0.8 }}>Loading…</div> : null}
        {error ? <div style={{ color: "#ffb3b3" }}>{error}</div> : null}

        {!loading && !error && artist ? (
          <>
            <div style={{ fontSize: 34, fontWeight: 900 }}>
              {safeText(artist?.name || "Artist")}
            </div>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              {safeText(artist?.genre)} • {safeText(artist?.location)} •{" "}
              <b>{safeText(artist?.status)}</b>
            </div>

            <div style={{ marginTop: 12, opacity: 0.9 }}>
              {safeText(artist?.bio)}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={async () => {
                  try {
                    await api.voteArtist(artist?.id || artist?._id, 1);
                    await load();
                  } catch (e) {
                    setError(safeText(e?.message) || "Vote failed");
                  }
                }}
                style={{
                  borderRadius: 16,
                  padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(154,74,255,0.25)",
                  color: "white",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Vote +1 (total: {Number(artist?.votes || 0)})
              </button>
            </div>
          </>
        ) : null}
      </Card>

      {artist ? (
        <>
          <Card>
            <div style={{ fontWeight: 900, fontSize: 22 }}>Socials</div>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {Object.entries(socials).map(([k, v]) => {
                const u = cleanUrl(v);
                if (!u) return null;
                return (
                  <a
                    key={k}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "white", opacity: 0.85 }}
                  >
                    {k}: {u}
                  </a>
                );
              })}
              {Object.values(socials).filter(Boolean).length === 0 ? (
                <div style={{ opacity: 0.7 }}>No socials provided.</div>
              ) : null}
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 900, fontSize: 22 }}>Tracks</div>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {tracks.length === 0 ? (
                <div style={{ opacity: 0.7 }}>No tracks provided.</div>
              ) : (
                tracks.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(0,0,0,0.25)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>
                      {safeText(t?.title || `Track ${idx + 1}`)}
                    </div>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>
                      {safeText(t?.platform)}
                    </div>
                    {t?.url ? (
                      <a
                        href={cleanUrl(t.url)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "white", opacity: 0.85, marginTop: 6, display: "inline-block" }}
                      >
                        Open →
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}