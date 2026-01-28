import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "./services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function normalizeArtist(res) {
  if (!res) return null;

  // Common shapes:
  // { artist: {...} }
  // { data: {...} }
  // { success:true, artist:{...} }
  // or the artist object directly
  if (res.artist && typeof res.artist === "object") return res.artist;
  if (res.data && typeof res.data === "object") return res.data;
  if (res.result && typeof res.result === "object") return res.result;

  // If it already looks like an artist object
  if (res.name || res.genre || res.location || res.id || res._id) return res;

  return null;
}

function normalizeComments(res) {
  if (!res) return [];

  // Common shapes:
  // { comments: [...] }
  // { data: [...] }
  // { items: [...] }
  // or array directly
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.comments)) return res.comments;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.items)) return res.items;

  return [];
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

export default function ArtistDetail() {
  const params = useParams();
  const artistId = safeText(params?.id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [artist, setArtist] = useState(null);

  const [voteLoading, setVoteLoading] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [voteSuccess, setVoteSuccess] = useState("");

  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [comments, setComments] = useState([]);

  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState("");

  const displayId = useMemo(() => {
    const a = artist;
    return safeText(a?.id || a?._id || artistId);
  }, [artist, artistId]);

  async function loadArtist() {
    if (!artistId) {
      setArtist(null);
      setError("Missing artist id in URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.getArtist(artistId);
      const a = normalizeArtist(res);

      if (!a) {
        setArtist(null);
        setError("Artist not found (unexpected response shape).");
        return;
      }

      setArtist(a);
    } catch (e) {
      setArtist(null);
      setError(safeText(e?.message) || "Could not load artist.");
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    if (!artistId) return;

    setCommentsLoading(true);
    setCommentsError("");

    try {
      const res = await api.listComments(artistId, { limit: 50 });
      setComments(normalizeComments(res));
    } catch (e) {
      setComments([]);
      setCommentsError(safeText(e?.message) || "Could not load comments.");
    } finally {
      setCommentsLoading(false);
    }
  }

  async function vote(amount = 1) {
    if (!artistId) return;

    setVoteLoading(true);
    setVoteError("");
    setVoteSuccess("");

    try {
      const res = await api.voteArtist(artistId, amount);

      // Try to update local votes if response contains it
      const updatedArtist = normalizeArtist(res) || res?.artist || res?.data;
      if (updatedArtist && typeof updatedArtist === "object") {
        setArtist((prev) => ({
          ...(prev || {}),
          ...updatedArtist,
        }));
      } else {
        // fallback: reload artist
        await loadArtist();
      }

      setVoteSuccess("Vote recorded ✅");
      setTimeout(() => setVoteSuccess(""), 2000);
    } catch (e) {
      setVoteError(safeText(e?.message) || "Voting failed.");
    } finally {
      setVoteLoading(false);
    }
  }

  async function submitComment() {
    const name = safeText(commentName).trim();
    const text = safeText(commentText).trim();

    setCommentSuccess("");
    setCommentsError("");

    if (!artistId) {
      setCommentsError("Missing artist id.");
      return;
    }
    if (!text) {
      setCommentsError("Please write a comment first.");
      return;
    }

    setCommentLoading(true);

    try {
      const payload = {
        artistId,
        name: name || "Anonymous",
        text,
      };

      await api.addComment(payload);

      setCommentText("");
      setCommentSuccess("Comment submitted ✅ (may require moderation)");
      setTimeout(() => setCommentSuccess(""), 2500);

      await loadComments();
    } catch (e) {
      setCommentsError(safeText(e?.message) || "Could not submit comment.");
    } finally {
      setCommentLoading(false);
    }
  }

  useEffect(() => {
    loadArtist();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 46, margin: 0, letterSpacing: -1 }}>
            Artist Profile
          </h1>
          <p style={{ opacity: 0.85, marginTop: 10 }}>
            ID: <b>{displayId || "—"}</b>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/artists" style={pillStyle(false)}>
            ← Back to Artists
          </Link>
        </div>
      </div>

      <Card>
        {loading ? (
          <div style={{ opacity: 0.85 }}>Loading artist…</div>
        ) : null}

        {error ? (
          <div style={{ opacity: 0.9, color: "#ffb3b3" }}>{error}</div>
        ) : null}

        {!loading && !error && artist ? (
          <>
            <div style={{ fontWeight: 900, fontSize: 28 }}>
              {safeText(artist?.name || "Unnamed Artist")}
            </div>

            <div style={{ opacity: 0.85, marginTop: 8 }}>
              {safeText(artist?.genre)} • {safeText(artist?.location)} •{" "}
              <b>{safeText(artist?.status || "active")}</b>
            </div>

            <div style={{ opacity: 0.9, marginTop: 12, lineHeight: 1.45 }}>
              {safeText(artist?.bio) || "No bio yet."}
            </div>

            <div style={{ marginTop: 14, opacity: 0.9 }}>
              Votes: <b>{Number(artist?.votes || 0)}</b>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => vote(1)}
                disabled={voteLoading}
                style={{
                  borderRadius: 16,
                  padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(154,74,255,0.25)",
                  color: "white",
                  fontWeight: 900,
                  cursor: voteLoading ? "not-allowed" : "pointer",
                  opacity: voteLoading ? 0.8 : 1,
                }}
              >
                {voteLoading ? "Voting…" : "🔥 Vote"}
              </button>

              <button
                onClick={() => vote(5)}
                disabled={voteLoading}
                style={{
                  borderRadius: 16,
                  padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  fontWeight: 900,
                  cursor: voteLoading ? "not-allowed" : "pointer",
                  opacity: voteLoading ? 0.8 : 1,
                }}
              >
                {voteLoading ? "Voting…" : "⚡ Vote +5"}
              </button>
            </div>

            {voteError ? (
              <div style={{ marginTop: 10, color: "#ffb3b3", opacity: 0.95 }}>
                {voteError}
              </div>
            ) : null}

            {voteSuccess ? (
              <div style={{ marginTop: 10, color: "#b9ffcf", opacity: 0.95 }}>
                {voteSuccess}
              </div>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Comments</div>

        {commentsLoading ? (
          <div style={{ marginTop: 10, opacity: 0.8 }}>Loading comments…</div>
        ) : null}

        {commentsError ? (
          <div style={{ marginTop: 10, color: "#ffb3b3", opacity: 0.95 }}>
            {commentsError}
          </div>
        ) : null}

        {!commentsLoading && !commentsError && (!comments || comments.length === 0) ? (
          <div style={{ marginTop: 10, opacity: 0.8 }}>
            No comments yet.
          </div>
        ) : null}

        {!commentsLoading && comments && comments.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {comments.map((c) => {
              const cid = safeText(c?.id || c?._id || c?.commentId || "");
              return (
                <div
                  key={cid || Math.random()}
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
                  <div style={{ opacity: 0.9, marginTop: 6, lineHeight: 1.4 }}>
                    {safeText(c?.text || c?.comment || "")}
                  </div>
                  <div style={{ opacity: 0.65, marginTop: 8, fontSize: 12 }}>
                    {safeText(c?.status || "")}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Add a comment</div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
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

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment…"
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
              <button
                onClick={submitComment}
                disabled={commentLoading}
                style={{
                  borderRadius: 16,
                  padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(154,74,255,0.25)",
                  color: "white",
                  fontWeight: 900,
                  cursor: commentLoading ? "not-allowed" : "pointer",
                  opacity: commentLoading ? 0.8 : 1,
                }}
              >
                {commentLoading ? "Submitting…" : "Submit Comment"}
              </button>

              <button
                onClick={() => {
                  setCommentName("");
                  setCommentText("");
                  setCommentSuccess("");
                  setCommentsError("");
                }}
                disabled={commentLoading}
                style={{
                  borderRadius: 16,
                  padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  fontWeight: 900,
                  cursor: commentLoading ? "not-allowed" : "pointer",
                  opacity: commentLoading ? 0.8 : 1,
                }}
              >
                Clear
              </button>
            </div>

            {commentSuccess ? (
              <div style={{ marginTop: 6, color: "#b9ffcf", opacity: 0.95 }}>
                {commentSuccess}
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}