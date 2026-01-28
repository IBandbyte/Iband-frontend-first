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

function primaryBtnStyle(disabled) {
  return {
    borderRadius: 16,
    padding: "12px 16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(154,74,255,0.25)",
    color: "white",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.75 : 1,
  };
}

function dangerText() {
  return { marginTop: 10, opacity: 0.95, color: "#ffb3b3" };
}

/**
 * Normalize backend responses so ArtistDetail NEVER breaks
 * Accepts:
 * - { success: true, artist: {...} }
 * - { artist: {...} }
 * - { success: true, artists: [...] } (fallback)
 * - raw artist object {...}
 */
function normalizeArtistResponse(res) {
  const candidate =
    res?.artist ||
    res?.data?.artist ||
    (Array.isArray(res?.artists) ? res.artists[0] : null) ||
    (Array.isArray(res?.data?.artists) ? res.data.artists[0] : null) ||
    res;

  if (!candidate || typeof candidate !== "object") return null;

  const id = safeText(candidate?.id || candidate?._id || candidate?.slug);
  const name = safeText(candidate?.name);
  const genre = safeText(candidate?.genre);
  const location = safeText(candidate?.location);

  // Basic sanity check: must look like an artist object
  if (!id && !name && !genre && !location) return null;

  return {
    ...candidate,
    id: id || candidate?.id || candidate?._id || candidate?.slug,
  };
}

function normalizeCommentsResponse(res) {
  const list =
    (Array.isArray(res?.comments) && res.comments) ||
    (Array.isArray(res?.data?.comments) && res.data.comments) ||
    (Array.isArray(res?.items) && res.items) ||
    [];

  return list.map((c) => ({
    ...c,
    id: safeText(c?.id || c?._id || c?.commentId || ""),
    name: safeText(c?.name || c?.author || "Anonymous"),
    text: safeText(c?.text || c?.comment || c?.body || ""),
    createdAt: safeText(c?.createdAt || c?.created_at || ""),
    status: safeText(c?.status || ""),
  }));
}

export default function ArtistDetail() {
  const { id } = useParams();

  const [loadingArtist, setLoadingArtist] = useState(false);
  const [artistError, setArtistError] = useState("");
  const [artist, setArtist] = useState(null);

  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState("");

  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [commentsUnsupported, setCommentsUnsupported] = useState(false);
  const [comments, setComments] = useState([]);

  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentSendError, setCommentSendError] = useState("");
  const [commentSendOk, setCommentSendOk] = useState("");

  const artistId = useMemo(() => safeText(id).trim(), [id]);

  async function loadArtist() {
    if (!artistId) return;

    setLoadingArtist(true);
    setArtistError("");
    try {
      const res = await api.getArtist(artistId);
      const normalized = normalizeArtistResponse(res);
      if (!normalized) {
        setArtist(null);
        setArtistError("Artist not found (unexpected response shape).");
        return;
      }
      setArtist(normalized);
    } catch (e) {
      setArtist(null);
      setArtistError(safeText(e?.message) || "Could not load artist.");
    } finally {
      setLoadingArtist(false);
    }
  }

  async function loadComments() {
    if (!artistId) return;

    setLoadingComments(true);
    setCommentsError("");
    setCommentsUnsupported(false);

    try {
      const res = await api.listComments(artistId);
      const normalized = normalizeCommentsResponse(res);
      setComments(normalized);
    } catch (e) {
      const status = Number(e?.status || 0);

      // If backend doesn't have comments routes yet, show a clean message (not a scary error)
      if ([404, 405].includes(status)) {
        setComments([]);
        setCommentsUnsupported(true);
        setCommentsError("Comments API not available yet.");
      } else {
        setComments([]);
        setCommentsError(safeText(e?.message) || "Could not load comments.");
      }
    } finally {
      setLoadingComments(false);
    }
  }

  async function doVote() {
    if (!artistId) return;

    setVoting(true);
    setVoteError("");

    try {
      const res = await api.voteArtist(artistId, 1);

      const updatedVotes =
        res?.artist?.votes ??
        res?.data?.artist?.votes ??
        res?.votes ??
        res?.data?.votes ??
        null;

      if (updatedVotes !== null && artist) {
        setArtist({ ...artist, votes: updatedVotes });
      } else {
        // safest: refetch artist to reflect server truth
        await loadArtist();
      }
    } catch (e) {
      setVoteError(safeText(e?.message) || "Vote failed.");
    } finally {
      setVoting(false);
    }
  }

  async function submitComment() {
    setCommentSendOk("");
    setCommentSendError("");

    const text = safeText(commentText).trim();
    const name = safeText(commentName).trim();

    if (!artistId) return;
    if (!text) {
      setCommentSendError("Please write a comment first.");
      return;
    }

    setCommentSending(true);

    try {
      const payload = { artistId, name, text };
      await api.addComment(payload);

      setCommentText("");
      setCommentSendOk("Comment submitted.");

      // refresh list if comments endpoint exists
      await loadComments();
    } catch (e) {
      const status = Number(e?.status || 0);
      if ([404, 405].includes(status)) {
        setCommentsUnsupported(true);
        setCommentSendError("Comments API not available yet.");
      } else {
        setCommentSendError(safeText(e?.message) || "Could not submit comment.");
      }
    } finally {
      setCommentSending(false);
    }
  }

  function clearCommentForm() {
    setCommentName("");
    setCommentText("");
    setCommentSendOk("");
    setCommentSendError("");
  }

  useEffect(() => {
    loadArtist();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  const displayName = safeText(artist?.name || "Unnamed Artist");
  const displayGenre = safeText(artist?.genre);
  const displayLocation = safeText(artist?.location);
  const displayBio = safeText(artist?.bio);
  const displayVotes =
    artist?.votes === 0 || artist?.votes ? Number(artist.votes) : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>
        Artist Profile
      </h1>

      <p style={{ opacity: 0.85, marginTop: 10 }}>
        API: {API_BASE}
      </p>

      <div style={{ marginTop: 10 }}>
        <div style={{ opacity: 0.8, fontWeight: 900 }}>
          ID: {artistId || "—"}
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link to="/artists" style={pillStyle()}>
          ← Back to Artists
        </Link>
        <Link to="/admin" style={pillStyle()}>
          Admin
        </Link>
      </div>

      <Card>
        {loadingArtist ? (
          <div style={{ opacity: 0.85 }}>Loading artist…</div>
        ) : artistError ? (
          <div style={dangerText()}>{artistError}</div>
        ) : !artist ? (
          <div style={dangerText()}>Artist not found.</div>
        ) : (
          <>
            <div style={{ fontWeight: 900, fontSize: 26 }}>{displayName}</div>
            <div style={{ opacity: 0.8, marginTop: 8 }}>
              {displayGenre ? displayGenre : "—"} •{" "}
              {displayLocation ? displayLocation : "—"}
            </div>

            {displayBio ? (
              <div style={{ opacity: 0.9, marginTop: 12, lineHeight: 1.5 }}>
                {displayBio}
              </div>
            ) : null}

            <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={doVote} disabled={voting || loadingArtist} style={primaryBtnStyle(voting || loadingArtist)}>
                {voting ? "Voting…" : "Vote +1"}
              </button>

              <div style={{ opacity: 0.9, fontWeight: 900 }}>
                Votes: {displayVotes === null ? "—" : displayVotes}
              </div>
            </div>

            {voteError ? <div style={dangerText()}>{voteError}</div> : null}
          </>
        )}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 26 }}>Comments</div>

        {loadingComments ? (
          <div style={{ marginTop: 10, opacity: 0.85 }}>Loading comments…</div>
        ) : commentsError ? (
          <div style={dangerText()}>{commentsError}</div>
        ) : null}

        {!loadingComments && !commentsError && comments.length === 0 ? (
          <div style={{ marginTop: 10, opacity: 0.85 }}>
            {commentsUnsupported ? "Comments are not enabled yet." : "No comments yet."}
          </div>
        ) : null}

        {!loadingComments && comments.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {comments.map((c, idx) => (
              <div
                key={c.id || `${idx}`}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <div style={{ fontWeight: 900 }}>
                  {safeText(c.name || "Anonymous")}
                </div>
                <div style={{ opacity: 0.85, marginTop: 6, lineHeight: 1.45 }}>
                  {safeText(c.text)}
                </div>
                <div style={{ opacity: 0.55, marginTop: 8, fontSize: 12 }}>
                  {safeText(c.createdAt)}
                  {c.status ? ` • ${safeText(c.status)}` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 26 }}>Add a comment</div>

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

        <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={submitComment}
            disabled={commentSending || !artistId}
            style={primaryBtnStyle(commentSending || !artistId)}
          >
            {commentSending ? "Submitting…" : "Submit Comment"}
          </button>

          <button
            onClick={clearCommentForm}
            disabled={commentSending}
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 900,
              cursor: commentSending ? "not-allowed" : "pointer",
              opacity: commentSending ? 0.75 : 1,
            }}
          >
            Clear
          </button>
        </div>

        {commentSendOk ? (
          <div style={{ marginTop: 10, opacity: 0.9, color: "#b7ffcf" }}>
            {commentSendOk}
          </div>
        ) : null}

        {commentSendError ? <div style={dangerText()}>{commentSendError}</div> : null}

        <div style={{ marginTop: 12, opacity: 0.6, fontSize: 12 }}>
          Note: if the backend comments routes aren’t deployed yet, this will show “Comments API not available yet.”
        </div>
      </Card>
    </div>
  );
}