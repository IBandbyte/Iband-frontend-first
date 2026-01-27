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

function normalizeComments(payload, artistId) {
  // Backend (current): { success, artistId, count, comments: [] }
  if (payload && Array.isArray(payload.comments)) {
    return payload.comments
      .map((c) => ({
        id: safeText(c.id || c._id || ""),
        artistId: safeText(c.artistId || artistId || ""),
        author: safeText(c.author || c.name || "Anonymous"),
        text: safeText(c.text || ""),
        status: safeText(c.status || ""),
        createdAt: safeText(c.createdAt || ""),
      }))
      .filter((c) => c.text);
  }

  // Fallback legacy shapes: { data: { items: [] } }
  const items =
    (payload &&
      payload.data &&
      Array.isArray(payload.data.items) &&
      payload.data.items) ||
    [];

  return items
    .map((c) => ({
      id: safeText(c.id || c._id || ""),
      artistId: safeText(c.artistId || artistId || ""),
      author: safeText(c.author || c.name || "Anonymous"),
      text: safeText(c.text || ""),
      status: safeText(c.status || ""),
      createdAt: safeText(c.createdAt || ""),
    }))
    .filter((c) => c.text);
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

function PrimaryBtn({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
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

function Card({ children }) {
  return (
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
      {children}
    </div>
  );
}

export default function ArtistDetail() {
  const { id } = useParams();

  const [loadingArtist, setLoadingArtist] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [voting, setVoting] = useState(false);
  const [posting, setPosting] = useState(false);

  const [error, setError] = useState("");
  const [artist, setArtist] = useState(null);
  const [comments, setComments] = useState([]);
  const [lastFetchMs, setLastFetchMs] = useState(0);

  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");

  const subtitle = useMemo(() => {
    return artist ? [artist.genre, artist.location].filter(Boolean).join(" • ") : "";
  }, [artist]);

  async function loadArtist() {
    if (!id) return;

    setLoadingArtist(true);
    setError("");

    const started = Date.now();
    try {
      const payload = await api.getArtist(id);

      // prefer explicit artist keys if present, else treat payload as the artist object
      const raw =
        (payload && payload.artist && typeof payload.artist === "object" && payload.artist) ||
        (payload && payload.data && typeof payload.data === "object" && payload.data) ||
        payload;

      setArtist(normalizeArtist(raw || {}));
    } catch (e) {
      setArtist(null);
      setError(e?.message || "Failed to load artist");
    } finally {
      setLastFetchMs(Date.now() - started);
      setLoadingArtist(false);
    }
  }

  async function loadComments() {
    if (!id) return;

    setLoadingComments(true);
    setError("");

    try {
      const payload = await api.listComments(id, { limit: 50, page: 1 });
      const normalized = normalizeComments(payload, id);

      // Public view should normally show approved only (backend filters)
      setComments(normalized);
    } catch (e) {
      setComments([]);
      setError(e?.message || "Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadArtist(), loadComments()]);
  }

  async function vote() {
    if (!id) return;

    setVoting(true);
    setError("");
    try {
      await api.voteArtist(id, 1);
      await loadArtist();
    } catch (e) {
      setError(e?.message || "Vote failed");
    } finally {
      setVoting(false);
    }
  }

  async function postComment() {
    if (!id) return;

    const author = commentAuthor.trim();
    const text = commentText.trim();

    if (!text) {
      setError("Please write a comment first.");
      return;
    }

    setPosting(true);
    setError("");

    try {
      await api.addComment({
        artistId: id,
        author: author || "Anonymous",
        text,
      });

      setCommentText("");
      await loadComments();
    } catch (e) {
      setError(e?.message || "Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 60, margin: 0, letterSpacing: -1 }}>
        {artist?.name || (loadingArtist ? "Loading…" : "Artist")}
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
          <div style={{ opacity: 0.7, marginTop: 8, fontSize: 13 }}>
            If Render cold-starts, hit Refresh once.
          </div>
        </div>
      ) : null}

      {artist ? (
        <Card>
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
              {subtitle ? (
                <div style={{ opacity: 0.85, fontSize: 18 }}>{subtitle}</div>
              ) : null}

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
                <PrimaryBtn onClick={vote} disabled={voting || loadingArtist}>
                  {voting ? "Voting…" : "Vote +1"}
                </PrimaryBtn>

                <SoftBtn onClick={refreshAll} disabled={loadingArtist || loadingComments}>
                  {loadingArtist || loadingComments ? "Loading…" : "Refresh"}
                </SoftBtn>
              </div>
            </div>
          </div>

          {artist.tracks.length ? (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 10 }}>
                Tracks
              </div>

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
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* COMMENTS */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 28 }}>Comments</div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          Fans can comment • {loadingComments ? "Loading…" : `${comments.length} shown`}
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <input
            value={commentAuthor}
            onChange={(e) => setCommentAuthor(e.target.value)}
            placeholder="Your name (optional)"
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

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment…"
            rows={4}
            style={{
              width: "100%",
              padding: "14px 14px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              color: "white",
              outline: "none",
              fontSize: 16,
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <PrimaryBtn onClick={postComment} disabled={posting || !id} type="button">
              {posting ? "Posting…" : "Post Comment"}
            </PrimaryBtn>

            <SoftBtn onClick={loadComments} disabled={loadingComments || !id}>
              {loadingComments ? "Loading…" : "Refresh Comments"}
            </SoftBtn>
          </div>

          <div style={{ opacity: 0.7, fontSize: 13, marginTop: 2 }}>
            Note: comments appear publicly once approved by Admin.
          </div>
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {!loadingComments && comments.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No comments yet. Be the first 🔥</div>
          ) : null}

          {comments.map((c) => (
            <div
              key={c.id || `${c.author}-${c.createdAt}`}
              style={{
                borderRadius: 16,
                padding: "12px 14px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 900 }}>{c.author || "Anonymous"}</div>
                <div style={{ opacity: 0.6, fontSize: 12 }}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                </div>
              </div>
              <div style={{ marginTop: 8, opacity: 0.95, lineHeight: 1.45 }}>
                {c.text}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}