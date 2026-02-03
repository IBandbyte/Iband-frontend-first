import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, API_BASE } from "./services/api";

/* -----------------------------
   Tiny helpers (UI-safe)
----------------------------- */

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function isObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
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
    cursor: "pointer",
  };
}

/* -----------------------------
   Response parsing (HARDENED)
   Accepts multiple shapes:
   - { success:true, artist:{...} }
   - { success:true, data:{ artist:{...} } }
   - { success:true, count, artists:[...] }  (fallback)
   - raw artist object (rare)
----------------------------- */

function extractArtistFromResponse(res, id) {
  const targetId = safeText(id);

  if (!res) return { artist: null, meta: { receivedType: "empty" } };

  const receivedType = Array.isArray(res) ? "array" : typeof res;

  // raw artist object
  if (isObject(res) && (res.id || res._id || res.name) && !res.artist && !res.artists) {
    return {
      artist: res,
      meta: { receivedType, mode: "raw-object", keys: Object.keys(res) },
    };
  }

  // primary: res.artist
  if (isObject(res) && isObject(res.artist)) {
    return {
      artist: res.artist,
      meta: { receivedType, mode: "res.artist", keys: Object.keys(res) },
    };
  }

  // wrapper: res.data.artist
  if (isObject(res) && isObject(res.data) && isObject(res.data.artist)) {
    return {
      artist: res.data.artist,
      meta: {
        receivedType,
        mode: "res.data.artist",
        keys: Object.keys(res),
        dataKeys: Object.keys(res.data),
      },
    };
  }

  // fallback: list shape in res.artists
  if (isObject(res) && Array.isArray(res.artists)) {
    const found =
      res.artists.find((a) => safeText(a?.id || a?._id) === targetId) || null;
    return {
      artist: found,
      meta: {
        receivedType,
        mode: "res.artists[] (fallback-find)",
        keys: Object.keys(res),
        artistsLen: res.artists.length,
      },
    };
  }

  // fallback: list shape in res.data.artists
  if (isObject(res) && isObject(res.data) && Array.isArray(res.data.artists)) {
    const found =
      res.data.artists.find((a) => safeText(a?.id || a?._id) === targetId) || null;
    return {
      artist: found,
      meta: {
        receivedType,
        mode: "res.data.artists[] (fallback-find)",
        keys: Object.keys(res),
        dataKeys: Object.keys(res.data),
        artistsLen: res.data.artists.length,
      },
    };
  }

  return {
    artist: null,
    meta: {
      receivedType,
      mode: "unrecognized",
      keys: isObject(res) ? Object.keys(res) : [],
    },
  };
}

/* -----------------------------
   Network helpers
----------------------------- */

async function directFetchJson(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });

  const text = await r.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!r.ok) {
    const msg =
      safeText(json?.message) ||
      safeText(json?.error) ||
      `Request failed (${r.status})`;
    const err = new Error(msg);
    err.status = r.status;
    err.body = json;
    throw err;
  }

  return json;
}

/* -----------------------------
   Artist Detail Page
----------------------------- */

export default function ArtistDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [artist, setArtist] = useState(null);
  const [votesTotal, setVotesTotal] = useState(null);

  // comments placeholder (API not ready)
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentsError, setCommentsError] = useState("Comments API not available yet.");
  const [commentsCount] = useState(0);

  const [debug, setDebug] = useState(null);

  const artistId = useMemo(() => safeText(id), [id]);

  async function loadArtist() {
    if (!artistId) return;

    setLoading(true);
    setError("");

    try {
      let res = null;
      let used = "none";

      // 1) Prefer api.getArtist(id) if you have it
      if (api && typeof api.getArtist === "function") {
        used = "api.getArtist";
        res = await api.getArtist(artistId);
      } else {
        // 2) Direct fetch canonical detail URL
        used = "fetch:/api/artists/:id";
        res = await directFetchJson(`${API_BASE}/api/artists/${encodeURIComponent(artistId)}`);
      }

      const parsed = extractArtistFromResponse(res, artistId);
      const found = parsed.artist;

      setArtist(found || null);

      // votes: prefer artist.votes if present
      const v = found && typeof found.votes !== "undefined" ? Number(found.votes) : null;
      setVotesTotal(Number.isFinite(v) ? v : null);

      setDebug({
        apiBase: API_BASE,
        id: artistId,
        used,
        artistFound: !!found,
        artistKeys: isObject(res) ? Object.keys(res) : [],
        parse: parsed.meta,
        lastUpdatedAt: new Date().toISOString(),
      });
    } catch (e) {
      setArtist(null);
      setVotesTotal(null);
      setError(safeText(e?.message) || "Could not load artist.");
      setDebug({
        apiBase: API_BASE,
        id: artistId,
        error: safeText(e?.message),
        status: e?.status,
        lastUpdatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  async function vote(delta) {
    if (!artistId) return;
    setError("");

    try {
      // try api.vote first (if it exists)
      let res = null;
      let used = "none";

      if (api && typeof api.vote === "function") {
        used = "api.vote";
        res = await api.vote({ id: artistId, delta });
      } else if (api && typeof api.voteArtist === "function") {
        used = "api.voteArtist";
        res = await api.voteArtist({ id: artistId, delta });
      } else {
        // fallback patterns (backend differences)
        // A) POST /api/votes/:id { delta }
        try {
          used = "fetch:/api/votes/:id";
          res = await directFetchJson(`${API_BASE}/api/votes/${encodeURIComponent(artistId)}`, {
            method: "POST",
            body: JSON.stringify({ delta }),
          });
        } catch (_a) {
          // B) POST /api/votes { artistId, delta }
          used = "fetch:/api/votes";
          res = await directFetchJson(`${API_BASE}/api/votes`, {
            method: "POST",
            body: JSON.stringify({ artistId, delta }),
          });
        }
      }

      // Accept shapes:
      // - { success:true, total: 123 }
      // - { success:true, votes: 123 }
      // - { success:true, artist:{ votes: 123 } }
      // - { success:true, data:{ ... } }
      const total =
        (Number.isFinite(Number(res?.total)) && Number(res?.total)) ||
        (Number.isFinite(Number(res?.votes)) && Number(res?.votes)) ||
        (Number.isFinite(Number(res?.artist?.votes)) && Number(res?.artist?.votes)) ||
        (Number.isFinite(Number(res?.data?.total)) && Number(res?.data?.total)) ||
        (Number.isFinite(Number(res?.data?.votes)) && Number(res?.data?.votes)) ||
        null;

      if (total !== null) setVotesTotal(total);

      setDebug((d) => ({
        ...(d || {}),
        vote: { used, delta, keys: isObject(res) ? Object.keys(res) : [], received: res },
        lastUpdatedAt: new Date().toISOString(),
      }));
    } catch (e) {
      setError(safeText(e?.message) || "Vote failed.");
    }
  }

  function clearCommentFields() {
    setCommentName("");
    setCommentText("");
  }

  useEffect(() => {
    loadArtist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>Artist Profile</h1>

      <p style={{ opacity: 0.85, marginTop: 10 }}>
        API: {API_BASE} • ID: <b>{artistId || "—"}</b>
      </p>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link to="/artists" style={pillStyle()}>
          ← Back to Artists
        </Link>
        <Link to="/admin" style={pillStyle()}>
          Admin
        </Link>
      </div>

      {/* Profile */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Profile</div>

        {loading ? (
          <div style={{ marginTop: 12, opacity: 0.85 }}>Loading…</div>
        ) : null}

        {!loading && error ? (
          <div style={{ marginTop: 12, color: "#ffb3b3" }}>{error}</div>
        ) : null}

        {!loading && !error && !artist ? (
          <div style={{ marginTop: 12, color: "#ffb3b3" }}>
            Artist not found (unexpected response shape).
          </div>
        ) : null}

        {artist ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 24 }}>{safeText(artist.name)}</div>

            <div style={{ opacity: 0.8, marginTop: 6 }}>
              {safeText(artist.genre)} • {safeText(artist.location)} •{" "}
              <b>{safeText(artist.status)}</b>
            </div>

            {safeText(artist.bio) ? (
              <div style={{ opacity: 0.9, marginTop: 10, lineHeight: 1.45 }}>
                {safeText(artist.bio)}
              </div>
            ) : null}

            {safeText(artist.imageUrl) ? (
              <div style={{ marginTop: 14 }}>
                <img
                  alt={safeText(artist.name)}
                  src={safeText(artist.imageUrl)}
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    display: "block",
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* Votes */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Votes</div>

        <div style={{ marginTop: 10, opacity: 0.9 }}>
          Total: <b>{votesTotal === null ? "—" : safeText(votesTotal)}</b>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => vote(1)}
            disabled={!artistId}
            style={{
              borderRadius: 16,
              padding: "12px 18px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(154,74,255,0.25)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Vote +1
          </button>

          <button
            onClick={() => vote(5)}
            disabled={!artistId}
            style={{
              borderRadius: 16,
              padding: "12px 18px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,147,43,0.25)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Vote +5
          </button>
        </div>
      </Card>

      {/* Comments (placeholder until backend is enabled) */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Comments</div>

        <div style={{ marginTop: 10, color: "#ffb3b3" }}>{commentsError}</div>

        <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        <div style={{ marginTop: 14, fontWeight: 900, fontSize: 18 }}>Add a comment</div>

        <input
          value={commentName}
          onChange={(e) => setCommentName(e.target.value)}
          placeholder="Your name (optional)"
          style={{
            width: "100%",
            padding: "14px",
            marginTop: 10,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            fontSize: 16,
            outline: "none",
          }}
        />

        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write your comment…"
          style={{
            width: "100%",
            padding: "14px",
            marginTop: 10,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            fontSize: 16,
            outline: "none",
            minHeight: 120,
            resize: "vertical",
          }}
        />

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            disabled
            style={{
              borderRadius: 16,
              padding: "12px 18px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(154,74,255,0.25)",
              color: "white",
              fontWeight: 900,
              cursor: "not-allowed",
              opacity: 0.85,
            }}
          >
            Submit Comment
          </button>

          <button
            onClick={clearCommentFields}
            style={{
              borderRadius: 16,
              padding: "12px 18px",
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

        <div style={{ marginTop: 10, opacity: 0.7 }}>
          Comments loaded: {commentsCount}
        </div>
      </Card>

      {/* Debug */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Debug</div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          This helps us see response shapes without breaking the UI.
        </div>

        <pre
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.35)",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {JSON.stringify(
            {
              id: artistId,
              artistFound: !!artist,
              artistKeys: debug?.artistKeys || [],
              commentsCount,
              commentsError,
              debug,
            },
            null,
            2
          )}
        </pre>

        <div style={{ marginTop: 10 }}>
          <button
            onClick={loadArtist}
            disabled={loading}
            style={{
              borderRadius: 16,
              padding: "12px 18px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </Card>
    </div>
  );
}