import React, { useEffect, useMemo, useState } from "react";
import { api, apiFetch, API_BASE } from "./services/api";

/**
 * iBandbyte — Phase 1 Frontend Rebuild
 * - Live health check
 * - Live artists feed
 * - Vote + Comments (with graceful fallback if endpoints differ)
 */

export default function App() {
  const [health, setHealth] = useState({ loading: true, ok: false, data: null, err: null });
  const [artists, setArtists] = useState({ loading: true, items: [], err: null });
  const [selectedId, setSelectedId] = useState(null);

  const [voteState, setVoteState] = useState({ loading: false, err: null, last: null });

  const [comments, setComments] = useState({ loading: false, items: [], err: null });
  const [commentForm, setCommentForm] = useState({ name: "", text: "" });
  const [commentPost, setCommentPost] = useState({ loading: false, err: null, last: null });

  const selectedArtist = useMemo(() => {
    return artists.items.find((a) => String(a.id) === String(selectedId)) || null;
  }, [artists.items, selectedId]);

  async function loadHealth() {
    setHealth({ loading: true, ok: false, data: null, err: null });
    try {
      const data = await api.health();
      setHealth({ loading: false, ok: true, data, err: null });
    } catch (e) {
      setHealth({ loading: false, ok: false, data: null, err: e?.message || "Health check failed" });
    }
  }

  async function loadArtists() {
    setArtists((p) => ({ ...p, loading: true, err: null }));
    try {
      // Preferred (your backend currently exposes /artists)
      let data = await api.listArtists();

      // If backend returns {items:[...]} normalize; if it returns array, normalize
      let items = Array.isArray(data) ? data : data?.items || data?.artists || [];

      // Fallback if someone uses /api/artists instead
      if (!items?.length) {
        try {
          const alt = await apiFetch("/api/artists");
          items = Array.isArray(alt) ? alt : alt?.items || alt?.artists || items;
        } catch {
          // ignore fallback failure
        }
      }

      // Ensure each artist has an id
      items = (items || []).map((a, idx) => ({
        id: a?.id ?? a?._id ?? a?.slug ?? idx,
        name: a?.name ?? a?.artistName ?? "Unknown Artist",
        genre: a?.genre ?? a?.category ?? "Unknown",
        imageUrl: a?.imageUrl ?? a?.image ?? a?.photo ?? "",
        votes: a?.votes ?? a?.voteCount ?? a?.totalVotes ?? 0,
        ...a,
      }));

      setArtists({ loading: false, items, err: null });

      // Auto-select first artist if none selected
      if (!selectedId && items.length) setSelectedId(String(items[0].id));
    } catch (e) {
      setArtists({ loading: false, items: [], err: e?.message || "Failed to load artists" });
    }
  }

  async function runVote(artistId) {
    setVoteState({ loading: true, err: null, last: null });
    try {
      // Try common vote patterns
      let out = null;
      try {
        out = await api.vote(artistId); // POST /votes {artistId}
      } catch (e1) {
        // fallback A: /api/votes
        try {
          out = await apiFetch("/api/votes", { method: "POST", body: { artistId } });
        } catch (e2) {
          // fallback B: /artists/:id/vote
          out = await apiFetch(`/artists/${encodeURIComponent(artistId)}/vote`, {
            method: "POST",
            body: {},
          });
        }
      }

      setVoteState({ loading: false, err: null, last: out });

      // Refresh artists to update totals
      await loadArtists();
    } catch (e) {
      setVoteState({ loading: false, err: e?.message || "Vote failed", last: null });
    }
  }

  async function loadComments(artistId) {
    if (!artistId) return;
    setComments({ loading: true, items: [], err: null });
    try {
      // Preferred: GET /comments?artistId=...
      let data = null;
      try {
        data = await api.listComments(artistId);
      } catch (e1) {
        // fallback A: /api/comments?artistId=...
        try {
          data = await apiFetch(`/api/comments?artistId=${encodeURIComponent(artistId)}`);
        } catch (e2) {
          // fallback B: /artists/:id/comments
          data = await apiFetch(`/artists/${encodeURIComponent(artistId)}/comments`);
        }
      }

      let items = Array.isArray(data) ? data : data?.items || data?.comments || [];
      items = (items || []).map((c, idx) => ({
        id: c?.id ?? c?._id ?? idx,
        name: c?.name ?? c?.author ?? "Fan",
        text: c?.text ?? c?.comment ?? "",
        createdAt: c?.createdAt ?? c?.created_at ?? null,
        ...c,
      }));

      setComments({ loading: false, items, err: null });
    } catch (e) {
      setComments({ loading: false, items: [], err: e?.message || "Failed to load comments" });
    }
  }

  async function postComment() {
    if (!selectedArtist) return;

    const name = (commentForm.name || "").trim();
    const text = (commentForm.text || "").trim();

    if (!name || !text) {
      setCommentPost({ loading: false, err: "Name and comment are required", last: null });
      return;
    }

    setCommentPost({ loading: true, err: null, last: null });
    try {
      let out = null;

      // Preferred: POST /comments {artistId,name,text}
      try {
        out = await api.addComment({ artistId: selectedArtist.id, name, text });
      } catch (e1) {
        // fallback A: /api/comments
        try {
          out = await apiFetch("/api/comments", {
            method: "POST",
            body: { artistId: selectedArtist.id, name, text },
          });
        } catch (e2) {
          // fallback B: /artists/:id/comments
          out = await apiFetch(`/artists/${encodeURIComponent(selectedArtist.id)}/comments`, {
            method: "POST",
            body: { name, text },
          });
        }
      }

      setCommentPost({ loading: false, err: null, last: out });
      setCommentForm({ name: "", text: "" });
      await loadComments(selectedArtist.id);
    } catch (e) {
      setCommentPost({ loading: false, err: e?.message || "Failed to post comment", last: null });
    }
  }

  useEffect(() => {
    loadHealth();
    loadArtists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) loadComments(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <div style={styles.logoDot} aria-hidden />
          <div style={styles.brandText}>
            <span style={{ color: "#fff", fontWeight: 900 }}>iBand</span>
            <span style={{ color: "#FFB100", fontWeight: 900 }}>byte</span>
          </div>
        </div>

        <div style={styles.subTitle}>Phase 1 — Frontend ↔ Backend Connection</div>

        <div style={styles.topBar}>
          <div style={styles.pill}>
            <span style={{ opacity: 0.8 }}>API:</span>{" "}
            <code style={styles.code}>{API_BASE}</code>
          </div>

          <button style={styles.btn} onClick={() => { loadHealth(); loadArtists(); }}>
            Refresh
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* HEALTH */}
        <section style={styles.card}>
          <h2 style={styles.h2}>Backend status</h2>
          {health.loading ? (
            <div style={styles.muted}>Checking /health…</div>
          ) : health.ok ? (
            <div style={{ ...styles.muted, color: "#9ef59e" }}>
              Live ✓ {health.data ? "— " + stringifyOneLine(health.data) : ""}
            </div>
          ) : (
            <div style={{ ...styles.muted, color: "#ffb4b4" }}>
              Offline / error: {health.err}
            </div>
          )}
        </section>

        <div style={styles.grid}>
          {/* ARTISTS */}
          <section style={styles.card}>
            <div style={styles.rowBetween}>
              <h2 style={styles.h2}>Artists</h2>
              <button style={styles.btnGhost} onClick={loadArtists} disabled={artists.loading}>
                {artists.loading ? "Loading…" : "Reload"}
              </button>
            </div>

            {artists.err ? (
              <div style={{ ...styles.muted, color: "#ffb4b4" }}>{artists.err}</div>
            ) : null}

            {artists.loading ? (
              <div style={styles.muted}>Fetching artists…</div>
            ) : artists.items.length ? (
              <div style={styles.list}>
                {artists.items.map((a) => {
                  const active = String(a.id) === String(selectedId);
                  return (
                    <button
                      key={String(a.id)}
                      onClick={() => setSelectedId(String(a.id))}
                      style={{
                        ...styles.listItem,
                        borderColor: active ? "rgba(255,177,0,0.8)" : "rgba(255,255,255,0.10)",
                        background: active ? "rgba(255,177,0,0.08)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div style={styles.artistLine}>
                        <div style={styles.artistName}>{a.name}</div>
                        <div style={styles.artistMeta}>
                          <span style={styles.badge}>{a.genre}</span>
                          <span style={styles.badge}>Votes: {Number(a.votes) || 0}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={styles.muted}>No artists yet.</div>
            )}
          </section>

          {/* ARTIST DETAIL */}
          <section style={styles.card}>
            <h2 style={styles.h2}>Artist detail</h2>

            {!selectedArtist ? (
              <div style={styles.muted}>Select an artist to see details.</div>
            ) : (
              <>
                <div style={styles.detailTop}>
                  <div>
                    <div style={styles.detailName}>{selectedArtist.name}</div>
                    <div style={styles.muted}>
                      Genre: <b>{selectedArtist.genre}</b> • Votes:{" "}
                      <b>{Number(selectedArtist.votes) || 0}</b>
                    </div>
                  </div>

                  <button
                    style={styles.btn}
                    onClick={() => runVote(selectedArtist.id)}
                    disabled={voteState.loading}
                  >
                    {voteState.loading ? "Voting…" : "Vote"}
                  </button>
                </div>

                {voteState.err ? (
                  <div style={{ ...styles.muted, color: "#ffb4b4", marginTop: 8 }}>
                    Vote error: {voteState.err}
                  </div>
                ) : null}

                {/* COMMENTS */}
                <div style={{ marginTop: 14 }}>
                  <div style={styles.rowBetween}>
                    <h3 style={styles.h3}>Comments</h3>
                    <button
                      style={styles.btnGhost}
                      onClick={() => loadComments(selectedArtist.id)}
                      disabled={comments.loading}
                    >
                      {comments.loading ? "Loading…" : "Reload"}
                    </button>
                  </div>

                  {comments.err ? (
                    <div style={{ ...styles.muted, color: "#ffb4b4" }}>{comments.err}</div>
                  ) : null}

                  <div style={styles.commentBox}>
                    <input
                      style={styles.input}
                      placeholder="Your name"
                      value={commentForm.name}
                      onChange={(e) => setCommentForm((p) => ({ ...p, name: e.target.value }))}
                    />
                    <textarea
                      style={styles.textarea}
                      placeholder="Write a comment…"
                      value={commentForm.text}
                      onChange={(e) => setCommentForm((p) => ({ ...p, text: e.target.value }))}
                    />
                    <button style={styles.btn} onClick={postComment} disabled={commentPost.loading}>
                      {commentPost.loading ? "Posting…" : "Post comment"}
                    </button>

                    {commentPost.err ? (
                      <div style={{ ...styles.muted, color: "#ffb4b4", marginTop: 8 }}>
                        {commentPost.err}
                      </div>
                    ) : null}
                  </div>

                  <div style={styles.commentsList}>
                    {comments.loading ? (
                      <div style={styles.muted}>Loading comments…</div>
                    ) : comments.items.length ? (
                      comments.items.map((c) => (
                        <div key={String(c.id)} style={styles.commentItem}>
                          <div style={styles.commentHeader}>
                            <b>{c.name}</b>
                            {c.createdAt ? (
                              <span style={styles.commentTime}>
                                {formatDate(c.createdAt)}
                              </span>
                            ) : null}
                          </div>
                          <div style={styles.commentText}>{c.text}</div>
                        </div>
                      ))
                    ) : (
                      <div style={styles.muted}>No comments yet.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={styles.muted}>
          Powered by Fans. A Platform for Artists and Influencers.
        </div>
      </footer>
    </div>
  );
}

function stringifyOneLine(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

function formatDate(v) {
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0f",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  header: {
    padding: "18px 16px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background:
      "radial-gradient(1200px 400px at 30% 0%, rgba(106,17,203,0.30), transparent), radial-gradient(1200px 400px at 80% 0%, rgba(255,102,0,0.25), transparent)",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 10 },
  logoDot: {
    width: 34,
    height: 34,
    borderRadius: 999,
    background: "linear-gradient(135deg, #6a11cb, #ff6600)",
    boxShadow: "0 0 0 2px rgba(255,255,255,0.10) inset",
  },
  brandText: { fontSize: 26, letterSpacing: 0.2 },
  subTitle: { marginTop: 6, opacity: 0.8, fontSize: 13 },
  topBar: { marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  pill: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    fontSize: 13,
  },
  code: { fontSize: 12, opacity: 0.9 },
  main: { padding: 16, maxWidth: 1100, margin: "0 auto" },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  h2: { margin: "0 0 10px", fontSize: 18 },
  h3: { margin: "0 0 10px", fontSize: 16 },
  muted: { opacity: 0.75, fontSize: 13 },
  grid: { display: "grid", gridTemplateColumns: "1fr", gap: 12 },
  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    color: "#fff",
    fontWeight: 700,
    background: "linear-gradient(90deg,#6a11cb,#ff6600)",
  },
  btnGhost: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    cursor: "pointer",
    color: "#fff",
    background: "rgba(255,255,255,0.03)",
  },
  list: { display: "flex", flexDirection: "column", gap: 10, marginTop: 10 },
  listItem: {
    textAlign: "left",
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    cursor: "pointer",
    background: "rgba(255,255,255,0.03)",
  },
  artistLine: { display: "flex", flexDirection: "column", gap: 6 },
  artistName: { fontWeight: 800, fontSize: 15 },
  artistMeta: { display: "flex", gap: 8, flexWrap: "wrap" },
  badge: {
    fontSize: 12,
    opacity: 0.85,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.20)",
  },
  detailTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  detailName: { fontSize: 20, fontWeight: 900, marginBottom: 4 },
  commentBox: { display: "grid", gap: 10, marginTop: 10 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
    color: "#fff",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
    color: "#fff",
    fontSize: 14,
    resize: "vertical",
  },
  commentsList: { marginTop: 10, display: "grid", gap: 10 },
  commentItem: {
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  },
  commentHeader: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 },
  commentTime: { opacity: 0.7, fontSize: 12 },
  commentText: { opacity: 0.9, fontSize: 14, lineHeight: 1.35 },
  footer: {
    padding: "14px 16px 24px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    textAlign: "center",
  },
};

// Responsive upgrade (simple)
if (typeof window !== "undefined") {
  const mq = window.matchMedia?.("(min-width: 980px)");
  const apply = () => {
    // eslint-disable-next-line no-undef
    const root = document?.documentElement;
    if (!root) return;
    // we can’t mutate the styles object safely after render,
    // but we can rely on CSS in later phases.
  };
  mq?.addEventListener?.("change", apply);
  apply();
}