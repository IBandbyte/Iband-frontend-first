import React, { useEffect, useMemo, useState } from "react";
import * as api from "./services/api";

const DEFAULT_BASE =
  (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "https://iband-backend-first-1.onrender.com";

async function tryFetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function fallbackHealth(base) {
  return tryFetchJson(`${base.replace(/\/$/, "")}/health`);
}

async function fallbackArtists(base) {
  const clean = base.replace(/\/$/, "");
  // Try the most likely routes in order
  const candidates = [
    `${clean}/api/artists`,
    `${clean}/artists`,
    `${clean}/api/artists?source=fake`,
    `${clean}/artists?source=fake`,
  ];

  let last = null;
  for (const url of candidates) {
    last = await tryFetchJson(url);
    if (last.ok) return last;
  }
  return last || { ok: false, status: 0, data: null };
}

async function fallbackVote(base, artistId) {
  const clean = base.replace(/\/$/, "");
  const candidates = [
    { url: `${clean}/api/votes`, body: { artistId } },
    { url: `${clean}/votes`, body: { artistId } },
    { url: `${clean}/api/votes/${encodeURIComponent(artistId)}`, body: {} },
    { url: `${clean}/votes/${encodeURIComponent(artistId)}`, body: {} },
  ];

  let last = null;
  for (const c of candidates) {
    last = await tryFetchJson(c.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c.body),
    });
    if (last.ok) return last;
  }
  return last || { ok: false, status: 0, data: null };
}

function normalizeArtistsPayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  // common shapes:
  // { success:true, artists:[...] }
  // { items:[...] }
  // { data:[...] }
  const candidates = [payload.artists, payload.items, payload.data];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

function safeArtistId(a, idx) {
  return (
    a?.id ||
    a?._id ||
    a?.artistId ||
    a?.slug ||
    a?.name ||
    `artist-${idx + 1}`
  );
}

function safeName(a, idx) {
  return a?.name || a?.artistName || a?.title || `Artist ${idx + 1}`;
}

function safeGenre(a) {
  return a?.genre || a?.category || a?.style || "";
}

function safeVotes(a) {
  const v =
    a?.votes ??
    a?.voteCount ??
    a?.totalVotes ??
    a?.stats?.votes ??
    a?.voteTotal;
  return typeof v === "number" ? v : null;
}

export default function App() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE);
  const [health, setHealth] = useState(null);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [votingId, setVotingId] = useState(null);
  const [error, setError] = useState("");

  const cleanBase = useMemo(() => baseUrl.trim().replace(/\/$/, ""), [baseUrl]);

  async function loadAll() {
    setError("");
    setLoading(true);

    try {
      // HEALTH (prefer api.js if it has a function, otherwise fallback)
      let healthRes = null;
      if (typeof api.getHealth === "function") {
        healthRes = await api.getHealth(cleanBase);
      } else if (typeof api.health === "function") {
        healthRes = await api.health(cleanBase);
      } else {
        healthRes = await fallbackHealth(cleanBase);
      }

      setHealth(healthRes);

      // ARTISTS
      let artistsRes = null;
      if (typeof api.listArtists === "function") {
        artistsRes = await api.listArtists(cleanBase);
      } else if (typeof api.getArtists === "function") {
        artistsRes = await api.getArtists(cleanBase);
      } else {
        artistsRes = await fallbackArtists(cleanBase);
      }

      if (!artistsRes?.ok) {
        throw new Error(
          `Artists fetch failed (HTTP ${artistsRes?.status ?? "?"}).`
        );
      }

      const list = normalizeArtistsPayload(artistsRes.data);
      setArtists(list);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function voteFor(artist) {
    const id = safeArtistId(artist, 0);
    setError("");
    setVotingId(id);

    try {
      let voteRes = null;

      if (typeof api.voteForArtist === "function") {
        voteRes = await api.voteForArtist(cleanBase, id);
      } else if (typeof api.vote === "function") {
        voteRes = await api.vote(cleanBase, id);
      } else {
        voteRes = await fallbackVote(cleanBase, id);
      }

      if (!voteRes?.ok) {
        throw new Error(`Vote failed (HTTP ${voteRes?.status ?? "?"}).`);
      }

      // Reload artists to show updated totals (simple + reliable)
      await loadAll();
    } catch (e) {
      setError(e?.message || "Vote error");
    } finally {
      setVotingId(null);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLive = Boolean(health?.ok);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.iband}>iBand</span>
          <span style={styles.byte}>byte</span>
        </div>

        <div style={styles.statusRow}>
          <span style={{ ...styles.pill, ...(isLive ? styles.ok : styles.warn) }}>
            {isLive ? "Backend: LIVE" : "Backend: ?"}
          </span>
          {health?.status ? (
            <span style={styles.pill}>HTTP {health.status}</span>
          ) : null}
        </div>
      </header>

      <section style={styles.card}>
        <h2 style={styles.h2}>Connection</h2>

        <div style={styles.row}>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Backend base URL (Render)"
            style={styles.input}
            spellCheck={false}
          />
          <button
            onClick={loadAll}
            disabled={loading}
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : null) }}
          >
            {loading ? "Loading…" : "Reload"}
          </button>
        </div>

        <p style={styles.hint}>
          Tip: use your Render URL, e.g.{" "}
          <code style={styles.code}>{DEFAULT_BASE}</code>
        </p>

        {error ? <div style={styles.errBox}>⚠️ {error}</div> : null}

        <details style={{ marginTop: 10 }}>
          <summary style={styles.summary}>Debug payloads</summary>
          <pre style={styles.pre}>
            {JSON.stringify(
              {
                baseUrl: cleanBase,
                health,
                artistsCount: artists.length,
              },
              null,
              2
            )}
          </pre>
        </details>
      </section>

      <section style={styles.card}>
        <h2 style={styles.h2}>Live Artist Feed</h2>

        {loading && artists.length === 0 ? (
          <div style={styles.hint}>Loading artists…</div>
        ) : null}

        {artists.length === 0 && !loading ? (
          <div style={styles.hint}>
            No artists yet. This is OK — we’ll seed/submit next.
          </div>
        ) : null}

        <div style={styles.grid}>
          {artists.map((a, idx) => {
            const id = safeArtistId(a, idx);
            const name = safeName(a, idx);
            const genre = safeGenre(a);
            const votes = safeVotes(a);

            return (
              <div key={id} style={styles.artistCard}>
                <div style={styles.artistTop}>
                  <div style={styles.artistName}>{name}</div>
                  {genre ? <div style={styles.genre}>{genre}</div> : null}
                </div>

                <div style={styles.artistMeta}>
                  <div style={styles.metaLine}>
                    <span style={styles.metaLabel}>ID:</span>{" "}
                    <code style={styles.codeSmall}>{id}</code>
                  </div>
                  <div style={styles.metaLine}>
                    <span style={styles.metaLabel}>Votes:</span>{" "}
                    <strong>{votes ?? "—"}</strong>
                  </div>
                </div>

                <button
                  onClick={() => voteFor(a)}
                  disabled={votingId === id || loading}
                  style={{
                    ...styles.voteBtn,
                    ...(votingId === id || loading ? styles.btnDisabled : null),
                  }}
                >
                  {votingId === id ? "Voting…" : "Vote"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerText}>
          Powered by Fans. A Platform for Artists and Influencers.
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0f",
    color: "#fff",
    padding: 18,
    fontFamily:
      "system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  brand: { fontSize: 28, fontWeight: 900, letterSpacing: 0.2 },
  iband: { color: "#fff" },
  byte: { color: "#FFB100" },
  statusRow: { display: "flex", gap: 8, alignItems: "center" },
  pill: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
  },
  ok: { borderColor: "rgba(120,255,120,.35)" },
  warn: { borderColor: "rgba(255,200,120,.35)" },
  card: {
    background: "#12121a",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  h2: { margin: "0 0 10px 0", fontSize: 18 },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  input: {
    flex: 1,
    minWidth: 240,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.14)",
    background: "#0e0e16",
    color: "#fff",
    outline: "none",
  },
  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    color: "#fff",
    cursor: "pointer",
    background: "linear-gradient(90deg,#6a11cb,#ff6600)",
    fontWeight: 700,
  },
  voteBtn: {
    marginTop: 10,
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    color: "#fff",
    cursor: "pointer",
    background: "linear-gradient(90deg,#6a11cb,#ff6600)",
    fontWeight: 800,
  },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  hint: { marginTop: 8, color: "rgba(255,255,255,.72)", fontSize: 13 },
  errBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background: "rgba(255,70,70,.10)",
    border: "1px solid rgba(255,70,70,.25)",
    color: "#ffd0d0",
  },
  summary: { cursor: "pointer", color: "rgba(255,255,255,.8)" },
  pre: {
    marginTop: 10,
    background: "#0a0a10",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 12,
    padding: 12,
    overflow: "auto",
    fontSize: 12,
  },
  code: {
    background: "rgba(255,255,255,.08)",
    padding: "2px 6px",
    borderRadius: 8,
  },
  codeSmall: {
    background: "rgba(255,255,255,.08)",
    padding: "1px 6px",
    borderRadius: 8,
    fontSize: 12,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  artistCard: {
    background: "#0e0e16",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 16,
    padding: 12,
  },
  artistTop: { display: "flex", justifyContent: "space-between", gap: 10 },
  artistName: { fontWeight: 900, fontSize: 16 },
  genre: {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
    color: "rgba(255,255,255,.86)",
    height: "fit-content",
  },
  artistMeta: { marginTop: 8, color: "rgba(255,255,255,.85)" },
  metaLine: { fontSize: 13, marginTop: 6 },
  metaLabel: { color: "rgba(255,255,255,.65)" },
  footer: { marginTop: 10, padding: 8, textAlign: "center" },
  footerText: { color: "rgba(255,255,255,.65)", fontSize: 12 },
};