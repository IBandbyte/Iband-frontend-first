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
    cursor: "pointer",
  };
}

function parseArtistResponse(res) {
  // Accept many backend shapes safely:
  // 1) { success:true, artist:{...} }
  // 2) { artist:{...} }
  // 3) { success:true, data:{ artist:{...} } }
  // 4) direct artist object { id, name, ... }
  // 5) { data:{...} } (where data is the artist)
  if (!res) return null;

  if (res.artist && typeof res.artist === "object") return res.artist;
  if (res.data && res.data.artist && typeof res.data.artist === "object")
    return res.data.artist;

  // If it looks like an artist object already
  const maybe = res.data && typeof res.data === "object" ? res.data : res;
  const id = maybe?.id || maybe?._id || maybe?.slug;
  const name = maybe?.name;
  if (id || name) return maybe;

  return null;
}

function parseCommentsResponse(res) {
  // Accept many shapes:
  // 1) { success:true, comments:[...] }
  // 2) { comments:[...] }
  // 3) { success:true, data:[...] }
  // 4) direct array [...]
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.comments)) return res.comments;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

export default function ArtistDetail() {
  const params = useParams();
  const id = safeText(params?.id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [artist, setArtist] = useState(null);
  const [rawArtistResponse, setRawArtistResponse] = useState(null);

  const [voteLoading, setVoteLoading] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [localVotes, setLocalVotes] = useState(null);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");

  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSubmitError, setCommentSubmitError] = useState("");

  const votesToShow = useMemo(() => {
    const aVotes = Number(artist?.votes ?? 0);
    const lVotes = localVotes === null ? null : Number(localVotes);
    if (lVotes === null || Number.isNaN(lVotes)) return aVotes;
    return lVotes;
  }, [artist, localVotes]);

  async function loadArtist() {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      const res = await api.getArtist(id);
      setRawArtistResponse(res);

      const parsed = parseArtistResponse(res);
      if (!parsed) {
        setArtist(null);
        setError("Artist not found (unexpected response shape).");
        return;
      }

      setArtist(parsed);
      setLocalVotes(parsed?.votes ?? 0);
    } catch (e) {
      setArtist(null);
      setError(safeText(e?.message) || "Could not load artist.");
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    if (!id) return;

    setCommentsLoading(true);
    setCommentsError("");

    try {
      const res = await api.listComments(id);
      const parsed = parseCommentsResponse(res);
      setComments(parsed);
    } catch (e) {
      const status = Number(e?.status || 0);

      // If comments routes aren’t deployed, show a friendly message
      if ([404, 405].includes(status)) {
        setComments([]);
        setCommentsError("Comments API not available yet.");
      } else {
        setComments([]);
        setCommentsError(safeText(e?.message) || "Could not load comments.");
      }
    } finally {
      setCommentsLoading(false);
    }
  }

  async function vote(amount = 1) {
    if (!id) return;
    setVoteLoading(true);
    setVoteError("");

    try {
      const res = await api.voteArtist(id, amount);

      // Vote response shapes vary; try to extract votes if present.
      const maybeVotes =
        res?.votes ??
        res?.artist?.votes ??
        res?.data?.votes ??
        res?.data?.artist?.votes;

      if (maybeVotes !== undefined && maybeVotes !== null) {
        setLocalVotes(Number(maybeVotes));
      } else {
        // optimistic fallback
        setLocalVotes((v) => Number(v ?? votesToShow) + Number(amount || 1));
      }

      // Optionally refresh artist to stay in sync
      await loadArtist();
    } catch (e) {
      const status = Number(e?.status || 0);
      if ([404, 405].includes(status)) {
        setVoteError("Voting API not available yet.");
      } else {
        setVoteError(safeText(e?.message) || "Could not vote.");
      }
    } finally {
      setVoteLoading(false);
    }
  }

  async function submitComment() {
    setCommentSubmitError("");

    const name = safeText(commentName).trim();
    const text = safeText(commentText).trim();

    if (!text) {
      setCommentSubmitError("Comment text is required.");
      return;
    }

    setCommentSubmitting(true);

    try {
      const payload = {
        artistId: id,
        name: name || "Anonymous",
        text,
      };

      await api.addComment(payload);

      setCommentText("");
      await loadComments();
    } catch (e) {
      const status = Number(e?.status || 0);
      if ([404, 405].includes(status)) {
        setCommentSubmitError("Comments API not available yet.");
      } else {
        setCommentSubmitError(safeText(e?.message) || "Could not submit comment.");
      }
    } finally {
      setCommentSubmitting(false);
    }
  }

  useEffect(() => {
    loadArtist();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>
        Artist Profile
      </h1>

      <p style={{ opacity: 0.85, marginTop: 10 }}>
        API: {API_BASE} • ID: <b>{id || "missing"}</b>
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
        <div style={{ fontWeight: 900, fontSize: 22 }}>Profile</div>

        {loading ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>Loading…</div>
        ) : null}

        {error ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>
            {error}
          </div>
        ) : null}

        {!loading && !error && artist ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 24 }}>
              {safeText(artist?.name || "Unnamed Artist")}
            </div>

            <div style={{ opacity: 0.8, marginTop: 8 }}>
              {safeText(artist?.genre)} • {safeText(artist?.location)} •{" "}
              <b>{safeText(artist?.status || "unknown")}</b>
            </div>

            <div style={{ opacity: 0.9, marginTop: 10, lineHeight: 1.45 }}>
              {safeText(artist?.bio || "")}
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>Votes</div>
              <div style={{ marginTop: 8, opacity: 0.9 }}>
                Total: <b>{Number(votesToShow || 0)}</b>
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
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
                    opacity: voteLoading ? 0.85 : 1,
                  }}
                >
                  {voteLoading ? "Voting…" : "Vote +1"}
                </button>

                <button
                  onClick={() => vote(5)}
                  disabled={voteLoading}
                  style={{
                    borderRadius: 16,
                    padding: "12px 16px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,147,43,0.18)",
                    color: "white",
                    fontWeight: 900,
                    cursor: voteLoading ? "not-allowed" : "pointer",
                    opacity: voteLoading ? 0.85 : 1,
                  }}
                >
                  {voteLoading ? "Voting…" : "Vote +5"}
                </button>
              </div>

              {voteError ? (
                <div style={{ marginTop: 10, opacity: 0.9, color: "#ffb3b3" }}>
                  {voteError}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Comments</div>

        {commentsLoading ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>Loading…</div>
        ) : null}

        {commentsError ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>
            {commentsError}
          </div>
        ) : null}

        {!commentsLoading && !commentsError && comments.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>No comments found.</div>
        ) : null}

        {!commentsLoading && comments && comments.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {comments.map((c) => {
              const cid = safeText(c?.id || c?._id);
              const when = safeText(c?.createdAt || c?.created_at || "");
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
                    {safeText(c?.name || c?.author || "Anonymous")}
                  </div>
                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    {safeText(c?.text || c?.comment || "")}
                  </div>
                  {when ? (
                    <div style={{ opacity: 0.55, marginTop: 8, fontSize: 12 }}>
                      {when}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        <div style={{ marginTop: 18, borderTop: "1px solid rgba(255,255,255,0.10)" }} />

        <div style={{ marginTop: 16, fontWeight: 900, fontSize: 20 }}>
          Add a comment
        </div>

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
            onClick={submitComment}
            disabled={commentSubmitting}
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(154,74,255,0.25)",
              color: "white",
              fontWeight: 900,
              cursor: commentSubmitting ? "not-allowed" : "pointer",
              opacity: commentSubmitting ? 0.85 : 1,
            }}
          >
            {commentSubmitting ? "Submitting…" : "Submit Comment"}
          </button>

          <button
            onClick={() => {
              setCommentName("");
              setCommentText("");
              setCommentSubmitError("");
            }}
            disabled={commentSubmitting}
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 900,
              cursor: commentSubmitting ? "not-allowed" : "pointer",
              opacity: commentSubmitting ? 0.85 : 1,
            }}
          >
            Clear
          </button>
        </div>

        {commentSubmitError ? (
          <div style={{ marginTop: 10, opacity: 0.9, color: "#ffb3b3" }}>
            {commentSubmitError}
          </div>
        ) : null}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Debug</div>
        <div style={{ opacity: 0.75, marginTop: 8 }}>
          This helps us see response shapes without breaking the UI.
        </div>
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.25)",
            overflowX: "auto",
            fontSize: 12,
            opacity: 0.9,
          }}
        >
{JSON.stringify(
  {
    id,
    artistFound: !!artist,
    artistKeys: rawArtistResponse ? Object.keys(rawArtistResponse) : [],
    commentsCount: comments?.length || 0,
    commentsError,
  },
  null,
  2
)}
        </pre>
      </Card>
    </div>
  );
}