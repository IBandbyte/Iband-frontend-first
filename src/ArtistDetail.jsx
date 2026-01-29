import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, API_BASE } from "./services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function pillStyle(active) {
  return {
    textDecoration: "none",
    borderRadius: 16,
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: active ? "rgba(154,74,255,0.25)" : "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 900,
    display: "inline-block",
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

function normalizeArtist(res) {
  if (!res) return null;

  if (res.artist && typeof res.artist === "object") return res.artist;

  if (Array.isArray(res.artists) && res.artists.length > 0) return res.artists[0];

  if (res.id || res._id || res.name) return res;

  return null;
}

function normalizeComments(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.comments)) return res.comments;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

export default function ArtistDetail() {
  const { id } = useParams();

  const [loadingArtist, setLoadingArtist] = useState(false);
  const [artistErr, setArtistErr] = useState("");
  const [artist, setArtist] = useState(null);

  const [voting, setVoting] = useState(false);
  const [voteErr, setVoteErr] = useState("");

  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsErr, setCommentsErr] = useState("");
  const [comments, setComments] = useState([]);

  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [postCommentErr, setPostCommentErr] = useState("");
  const [postCommentOk, setPostCommentOk] = useState("");

  const artistId = useMemo(() => safeText(id).trim(), [id]);

  async function loadArtist() {
    if (!artistId) return;

    setLoadingArtist(true);
    setArtistErr("");
    setArtist(null);

    try {
      const res = await api.getArtist(artistId);
      const a = normalizeArtist(res);

      if (!a) {
        setArtistErr("Artist not found (unexpected response shape).");
        setArtist(null);
      } else {
        setArtist(a);
      }
    } catch (e) {
      setArtist(null);
      setArtistErr(safeText(e?.message) || "Could not load artist.");
    } finally {
      setLoadingArtist(false);
    }
  }

  async function loadComments() {
    if (!artistId) return;

    setLoadingComments(true);
    setCommentsErr("");
    setComments([]);

    try {
      const res = await api.listComments(artistId, { page: 1, limit: 50 });
      setComments(normalizeComments(res));
    } catch (e) {
      const status = Number(e?.status || 0);

      if (status === 404 || status === 405) {
        setComments([]);
        setCommentsErr("Comments API not available yet.");
      } else {
        setComments([]);
        setCommentsErr(safeText(e?.message) || "Could not load comments.");
      }
    } finally {
      setLoadingComments(false);
    }
  }

  useEffect(() => {
    loadArtist();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  async function handleVote(amount = 1) {
    if (!artistId) return;

    setVoting(true);
    setVoteErr("");

    try {
      const res = await api.voteArtist(artistId, amount);

      const a =
        normalizeArtist(res) ||
        normalizeArtist(res?.data) ||
        normalizeArtist(res?.artist);

      if (a) {
        setArtist(a);
      } else {
        setArtist((prev) => {
          if (!prev) return prev;
          const currentVotes = Number(prev?.votes || 0);
          return { ...prev, votes: currentVotes + Number(amount || 1) };
        });
      }
    } catch (e) {
      setVoteErr(safeText(e?.message) || "Vote failed.");
    } finally {
      setVoting(false);
    }
  }

  async function handleSubmitComment() {
    setPostCommentErr("");
    setPostCommentOk("");

    const text = safeText(commentText).trim();
    if (!text) {
      setPostCommentErr("Please write a comment.");
      return;
    }

    setPostingComment(true);

    try {
      await api.addComment({
        artistId,
        name: safeText(commentName).trim(),
        text,
      });

      setPostCommentOk("Comment submitted.");
      setCommentText("");
      setCommentName("");

      await loadComments();
    } catch (e) {
      const status = Number(e?.status || 0);
      if (status === 404 || status === 405) {
        setPostCommentErr("Comments API not available yet.");
      } else {
        setPostCommentErr(safeText(e?.message) || "Comment failed.");
      }
    } finally {
      setPostingComment(false);
    }
  }

  const displayId = safeText(artist?.id || artist?._id || artistId);
  const displayName = safeText(artist?.name || "Artist");
  const displayGenre = safeText(artist?.genre || "");
  const displayLocation = safeText(artist?.location || "");
  const displayBio = safeText(artist?.bio || "");
  const displayVotes = Number(artist?.votes || 0);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>
        Artist Profile
      </h1>

      <p style={{ opacity: 0.85, marginTop: 10 }}>
        API: {API_BASE}
        <br />
        ID: <b>{displayId}</b>
      </p>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link to="/artists" style={pillStyle(false)}>
          ← Back to Artists
        </Link>
        <Link to="/admin" style={pillStyle(false)}>
          Admin
        </Link>
      </div>

      <Card>
        {loadingArtist ? (
          <div style={{ opacity: 0.8 }}>Loading artist…</div>
        ) : artistErr ? (
          <div style={{ opacity: 0.9, color: "#ffb3b3" }}>{artistErr}</div>
        ) : artist ? (
          <>
            <div style={{ fontWeight: 900, fontSize: 28 }}>{displayName}</div>

            <div style={{ opacity: 0.8, marginTop: 8 }}>
              {displayGenre} {displayGenre && displayLocation ? "•" : ""}{" "}
              {displayLocation}
            </div>

            {displayBio ? (
              <div style={{ opacity: 0.9, marginTop: 12, lineHeight: 1.55 }}>
                {displayBio}
              </div>
            ) : null}

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={pillStyle(true)}>Votes: {displayVotes}</span>

              <button
                onClick={() => handleVote(1)}
                disabled={voting}
                style={{
                  borderRadius: 16,
                  padding: "10px 14px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(154,74,255,0.25)",
                  color: "white",
                  fontWeight: 900,
                  cursor: voting ? "not-allowed" : "pointer",
                  opacity: voting ? 0.8 : 1,
                }}
              >
                {voting ? "Voting…" : "Vote +1"}
              </button>
            </div>

            {voteErr ? (
              <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>
                {voteErr}
              </div>
            ) : null}
          </>
        ) : (
          <div style={{ opacity: 0.8 }}>No artist loaded.</div>
        )}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 28 }}>Comments</div>

        {loadingComments ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>Loading comments…</div>
        ) : commentsErr ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>
            {commentsErr}
          </div>
        ) : comments.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>No comments yet.</div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {comments.map((c, idx) => (
              <div
                key={safeText(c?.id || c?._id || idx)}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <div style={{ fontWeight: 900 }}>
                  {safeText(c?.name || "Anonymous")}
                </div>
                <div style={{ opacity: 0.9, marginTop: 6, lineHeight: 1.5 }}>
                  {safeText(c?.text || c?.comment || "")}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 28 }}>Add a comment</div>

        <div style={{ marginTop: 10 }}>
          <input
            value={commentName}
            onChange={(e) => setCommentName(e.target.value)}
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
        </div>

        <div style={{ marginTop: 10 }}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment…"
            rows={5}
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
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleSubmitComment}
            disabled={postingComment}
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(154,74,255,0.25)",
              color: "white",
              fontWeight: 900,
              cursor: postingComment ? "not-allowed" : "pointer",
              opacity: postingComment ? 0.8 : 1,
            }}
          >
            {postingComment ? "Submitting…" : "Submit Comment"}
          </button>

          <button
            onClick={() => {
              setCommentName("");
              setCommentText("");
              setPostCommentErr("");
              setPostCommentOk("");
            }}
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        {postCommentErr ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>
            {postCommentErr}
          </div>
        ) : null}

        {postCommentOk ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#baffc9" }}>
            {postCommentOk}
          </div>
        ) : null}

        <div style={{ marginTop: 12, opacity: 0.6, fontSize: 13, lineHeight: 1.5 }}>
          Note: if the backend comments routes aren’t deployed yet, this page will
          show “Comments API not available yet.” (That’s expected until backend is
          ready.)
        </div>
      </Card>
    </div>
  );
}