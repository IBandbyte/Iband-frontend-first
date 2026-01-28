import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, API_BASE } from "./services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
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

function pillStyle() {
  return {
    textDecoration: "none",
    borderRadius: 16,
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 900,
    display: "inline-block",
  };
}

function primaryButtonStyle(disabled) {
  return {
    borderRadius: 16,
    padding: "12px 16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(154,74,255,0.25)",
    color: "white",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.8 : 1,
  };
}

function dangerButtonStyle(disabled) {
  return {
    borderRadius: 16,
    padding: "12px 16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,70,70,0.18)",
    color: "white",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.8 : 1,
  };
}

function normalizeArtistResponse(res, id) {
  // Accept many possible response shapes without breaking UI.
  // Typical shapes we’ve seen / expect:
  // - { success:true, artist:{...} }
  // - { artist:{...} }
  // - { success:true, artists:[...] }
  // - { id, name, ... } (direct artist)
  // - { data:{ artist:{...} } } (nested)
  const rid = safeText(id);

  const direct = res && typeof res === "object" ? res : null;

  const candidate =
    direct?.artist ||
    direct?.data?.artist ||
    (Array.isArray(direct?.artists)
      ? direct.artists.find((a) => safeText(a?.id || a?._id) === rid) || null
      : null) ||
    (direct?.id || direct?._id ? direct : null);

  if (!candidate) return null;

  return {
    id: safeText(candidate?.id || candidate?._id || rid),
    name: safeText(candidate?.name || "Unnamed Artist"),
    genre: safeText(candidate?.genre),
    location: safeText(candidate?.location),
    bio: safeText(candidate?.bio),
    status: safeText(candidate?.status),
    votes: Number(candidate?.votes || 0),
    createdAt: safeText(candidate?.createdAt),
    updatedAt: safeText(candidate?.updatedAt),
  };
}

function normalizeCommentsResponse(res) {
  // Accept:
  // - { success:true, comments:[...] }
  // - { comments:[...] }
  // - [...] (array)
  const direct = res && typeof res === "object" ? res : null;
  const list = Array.isArray(res)
    ? res
    : Array.isArray(direct?.comments)
    ? direct.comments
    : [];

  return list.map((c) => ({
    id: safeText(c?.id || c?._id),
    artistId: safeText(c?.artistId),
    name: safeText(c?.name || c?.author || ""),
    text: safeText(c?.text || c?.comment || c?.body || ""),
    status: safeText(c?.status || ""),
    createdAt: safeText(c?.createdAt),
  }));
}

export default function ArtistDetail() {
  const params = useParams();
  const artistId = safeText(params?.id);

  const [loading, setLoading] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [artist, setArtist] = useState(null);
  const [artistError, setArtistError] = useState("");

  const [comments, setComments] = useState([]);
  const [commentsError, setCommentsError] = useState("");
  const [commentsAvailable, setCommentsAvailable] = useState(true);

  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const canSubmitComment = useMemo(
    () => safeText(commentText).trim().length > 0 && !commentsLoading,
    [commentText, commentsLoading]
  );

  async function loadArtist() {
    if (!artistId) return;
    setLoading(true);
    setArtistError("");

    try {
      const res = await api.getArtist(artistId);
      const normalized = normalizeArtistResponse(res, artistId);

      if (!normalized) {
        setArtist(null);
        setArtistError("Artist not found (unexpected response shape).");
      } else {
        setArtist(normalized);
      }
    } catch (e) {
      setArtist(null);
      setArtistError(safeText(e?.message) || "Artist not found.");
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    if (!artistId) return;

    setCommentsLoading(true);
    setCommentsError("");

    try {
      const res = await api.listComments(artistId, { limit: 50, page: 1 });
      const normalized = normalizeCommentsResponse(res);

      setCommentsAvailable(true);
      setComments(normalized);
    } catch (e) {
      // If route doesn’t exist yet, don’t treat as “fatal”
      const status = Number(e?.status || 0);
      if ([404, 405].includes(status) || safeText(e?.message).toLowerCase().includes("route")) {
        setCommentsAvailable(false);
        setComments([]);
        setCommentsError("");
      } else {
        setCommentsAvailable(true);
        setComments([]);
        setCommentsError(safeText(e?.message) || "Could not load comments.");
      }
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    loadArtist();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  async function handleVote(amount) {
    if (!artistId) return;

    setVoteLoading(true);
    try {
      const res = await api.voteArtist(artistId, amount);

      // Try to pull updated votes from multiple shapes:
      const updatedVotes =
        Number(res?.artist?.votes) ||
        Number(res?.data?.artist?.votes) ||
        Number(res?.votes);

      if (artist && Number.isFinite(updatedVotes) && updatedVotes >= 0) {
        setArtist({ ...artist, votes: updatedVotes });
      } else if (artist) {
        // optimistic fallback
        setArtist({ ...artist, votes: Number(artist.votes || 0) + Number(amount || 1) });
      }

      // Re-fetch to stay authoritative (but don’t block UX if it fails)
      loadArtist();
    } catch (e) {
      // If vote API isn’t ready, show an error inside the artist card
      setArtistError(safeText(e?.message) || "Voting failed.");
    } finally {
      setVoteLoading(false);
    }
  }

  async function handleSubmitComment() {
    if (!canSubmitComment) return;

    setCommentsLoading(true);
    setCommentsError("");

    try {
      await api.addComment({
        artistId,
        name: safeText(commentName).trim(),
        text: safeText(commentText).trim(),
      });

      setCommentText("");
      // reload list if supported
      await loadComments();
    } catch (e) {
      const status = Number(e?.status || 0);
      if ([404, 405].includes(status) || safeText(e?.message).toLowerCase().includes("route")) {
        setCommentsAvailable(false);
        setCommentsError("");
      } else {
        setCommentsAvailable(true);
        setCommentsError(safeText(e?.message) || "Could not submit comment.");
      }
    } finally {
      setCommentsLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>Artist Profile</h1>

      <p style={{ opacity: 0.85, marginTop: 10 }}>
        API: {API_BASE}
      </p>

      <p style={{ opacity: 0.85, marginTop: 4 }}>
        ID: <b>{artistId || "-"}</b>
      </p>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link to="/artists" style={pillStyle()}>
          ← Back to Artists
        </Link>

        <Link to="/admin" style={pillStyle()}>
          Admin
        </Link>
      </div>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Artist</div>

        {loading ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>Loading…</div>
        ) : null}

        {!loading && artistError ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>{artistError}</div>
        ) : null}

        {!loading && artist ? (
          <>
            <div style={{ marginTop: 10, fontWeight: 900, fontSize: 20 }}>{safeText(artist.name)}</div>

            <div style={{ opacity: 0.8, marginTop: 6 }}>
              {safeText(artist.genre)} • {safeText(artist.location)} •{" "}
              <b>{safeText(artist.status || "active")}</b>
            </div>

            {artist.bio ? (
              <div style={{ opacity: 0.85, marginTop: 10, lineHeight: 1.45 }}>{safeText(artist.bio)}</div>
            ) : null}

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 900 }}>
                Votes: <span style={{ opacity: 0.9 }}>{Number(artist.votes || 0)}</span>
              </span>

              <button
                onClick={() => handleVote(1)}
                disabled={voteLoading}
                style={primaryButtonStyle(voteLoading)}
              >
                {voteLoading ? "Voting…" : "Vote +1"}
              </button>

              <button
                onClick={() => handleVote(-1)}
                disabled={voteLoading}
                style={dangerButtonStyle(voteLoading)}
              >
                {voteLoading ? "Voting…" : "Vote -1"}
              </button>
            </div>
          </>
        ) : null}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Comments</div>

        {!commentsAvailable ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>
            Comments API not available yet.
          </div>
        ) : null}

        {commentsAvailable && commentsLoading ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>Loading…</div>
        ) : null}

        {commentsAvailable && !commentsLoading && commentsError ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>{commentsError}</div>
        ) : null}

        {commentsAvailable && !commentsLoading && (!comments || comments.length === 0) ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>No comments yet.</div>
        ) : null}

        {commentsAvailable && !commentsLoading && comments && comments.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {comments.map((c) => (
              <div
                key={c.id || Math.random()}
                style={{
                  padding