// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getHealth,
  listArtists,
  submitArtist,
  voteArtist,
  adminListArtists,
  adminStats,
  adminApproveArtist,
  adminRejectArtist,
  getAdminKey,
  setAdminKey,
  clearAdminKey,
  getApiBase,
} from "./services/api";

// Simple router via hash (works anywhere, no extra deps)
function getRoute() {
  const hash = (window.location.hash || "").replace("#", "").trim();
  return hash || "/";
}

function Nav({ route }) {
  return (
    <nav style={styles.nav}>
      <a style={styles.navLink(route === "/")} href="#/">
        Artists
      </a>
      <a style={styles.navLink(route === "/submit")} href="#/submit">
        Submit
      </a>
      <a style={styles.navLink(route === "/admin")} href="#/admin">
        Admin
      </a>
    </nav>
  );
}

export default function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoDot} />
          <div>
            <div style={styles.title}>iBand</div>
            <div style={styles.subtitle}>Get Signed / Connect</div>
          </div>
        </div>
        <div style={styles.apiBase}>API: {getApiBase()}</div>
      </header>

      <Nav route={route} />

      <main style={styles.main}>
        {route === "/" && <ArtistsPage />}
        {route === "/submit" && <SubmitPage />}
        {route === "/admin" && <AdminPage />}
        {!["/", "/submit", "/admin"].includes(route) && (
          <div style={styles.card}>
            <h2 style={styles.h2}>Not found</h2>
            <p style={styles.p}>That route doesn’t exist.</p>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        Powered by Fans. A Platform for Artists and Influencers.
      </footer>
    </div>
  );
}

/* -----------------------------
   Artists Page (Public)
   RULE: Public page shows ONLY ACTIVE artists
----------------------------- */
function ArtistsPage() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [artists, setArtists] = useState([]);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const h = await getHealth();
      setHealth(h);

      // IMPORTANT: Public list is ALWAYS active only
      const params = { status: "active" };
      if (q && q.trim()) params.q = q.trim();

      const res = await listArtists(params);
      setArtists(res?.data || []);
    } catch (e) {
      setError(e?.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.stack}>
      <div style={styles.card}>
        <h2 style={styles.h2}>Artists</h2>
        <p style={styles.p}>
          {health?.success ? "Backend: OK ✅" : "Backend: …"}{" "}
          <span style={{ opacity: 0.7 }}>({health?.service || "iband-backend"})</span>
        </p>

        <div style={styles.row}>
          <input
            style={styles.input}
            placeholder="Search artists (name, genre, location)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button style={styles.btn} onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Search"}
          </button>
        </div>

        <div style={styles.muted}>
          Public view shows <b>active</b> artists only.
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}
      </div>

      <div style={styles.grid}>
        {artists.map((a) => (
          <ArtistCard key={a.id} artist={a} />
        ))}
        {!loading && artists.length === 0 ? (
          <div style={styles.card}>
            <p style={styles.p}>No artists found.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ArtistCard({ artist }) {
  const [busy, setBusy] = useState(false);
  const [votes, setVotes] = useState(Number(artist?.votes || 0));
  const [msg, setMsg] = useState("");

  const status = (artist?.status || "active").toLowerCase();
  const canVote = status === "active";

  async function onVote() {
    if (!canVote) {
      setMsg("Voting disabled (not active)");
      setTimeout(() => setMsg(""), 1200);
      return;
    }

    setMsg("");
    setBusy(true);
    try {
      const res = await voteArtist(artist.id, 1);
      const next = res?.data?.votes;
      if (typeof next === "number") setVotes(next);
      else setVotes((v) => v + 1);
      setMsg("Voted ✅");
      setTimeout(() => setMsg(""), 900);
    } catch (e) {
      setMsg(e?.message || "Vote failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <div>
          <div style={styles.artistName}>{artist?.name || "Unnamed"}</div>
          <div style={styles.muted}>
            {artist?.genre || "—"} • {artist?.location || "—"}
          </div>
          <div style={styles.badges}>
            <span style={styles.badge}>{status}</span>
            <span style={styles.badge}>votes: {votes}</span>
          </div>
        </div>
      </div>

      {artist?.bio ? <p style={styles.p}>{artist.bio}</p> : null}

      <button
        style={canVote ? styles.btn : styles.btnDisabled}
        onClick={onVote}
        disabled={busy || !canVote}
        title={!canVote ? "Only active artists can receive votes" : "Vote"}
      >
        {busy ? "Voting…" : canVote ? "Vote +1" : "Voting disabled"}
      </button>

      {msg ? <div style={styles.muted}>{msg}</div> : null}
    </div>
  );
}

/* -----------------------------
   Submit Page (Public)
----------------------------- */
function SubmitPage() {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setStatusMsg("");
    setBusy(true);
    try {
      const payload = { name, genre, location, bio, status: "pending" };
      const res = await submitArtist(payload);
      if (res?.success) {
        setStatusMsg("Submitted ✅ (pending approval)");
        setName("");
        setGenre("");
        setLocation("");
        setBio("");
      } else {
        setStatusMsg(res?.message || "Submit failed.");
      }
    } catch (e2) {
      setStatusMsg(e2?.message || "Submit failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.h2}>Submit Artist</h2>
      <p style={styles.p}>
        Submissions go in as <b>pending</b> for admin approval.
      </p>

      <form onSubmit={onSubmit} style={styles.stack}>
        <input
          style={styles.input}
          placeholder="Artist name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          style={styles.input}
          placeholder="Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <textarea
          style={styles.textarea}
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
        />
        <button style={styles.btn} type="submit" disabled={busy}>
          {busy ? "Submitting…" : "Submit"}
        </button>
      </form>

      {statusMsg ? <div style={styles.muted}>{statusMsg}</div> : null}
    </div>
  );
}

/* -----------------------------
   Admin Page (Mobile-first)
----------------------------- */
function AdminPage() {
  const [adminKey, setAdminKeyState] = useState(getAdminKey());
  const [savedMsg, setSavedMsg] = useState("");

  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("pending"); // pending | active | rejected | all
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const statusParam = useMemo(() => {
    if (filter === "all") return {};
    return { status: filter };
  }, [filter]);

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const s = await adminStats();
      setStats(s?.data || null);

      const res = await adminListArtists(statusParam);
      setList(res?.data || []);
    } catch (e) {
      setErr(e?.message || "Admin request failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function onSaveKey() {
    setSavedMsg("");
    setAdminKey(adminKey);
    setSavedMsg("Admin key saved ✅");
    setTimeout(() => setSavedMsg(""), 1200);
    refresh();
  }

  function onClearKey() {
    clearAdminKey();
    setAdminKeyState("");
    setSavedMsg("Admin key cleared ✅");
    setTimeout(() => setSavedMsg(""), 1200);
    refresh();
  }

  async function onApprove(id) {
    setErr("");
    try {
      await adminApproveArtist(id);
      await refresh();
    } catch (e) {
      setErr(e?.message || "Approve failed");
    }
  }

  async function onReject(id) {
    setErr("");
    try {
      await adminRejectArtist(id);
      await refresh();
    } catch (e) {
      setErr(e?.message || "Reject failed");
    }
  }

  return (
    <div style={styles.stack}>
      <div style={styles.card}>
        <h2 style={styles.h2}>Admin Moderation</h2>
        <p style={styles.p}>
          Uses header <code>x-admin-key</code> (stored locally). If your backend has no{" "}
          <code>ADMIN_KEY</code> set, it allows requests (dev mode).
        </p>

        <div style={styles.row}>
          <input
            style={styles.input}
            placeholder="Admin key (x-admin-key)"
            value={adminKey}
            onChange={(e) => setAdminKeyState(e.target.value)}
          />
          <button style={styles.btn} onClick={onSaveKey}>
            Save Key
          </button>
          <button style={styles.btnSecondary} onClick={onClearKey}>
            Clear
          </button>
        </div>

        {savedMsg ? <div style={styles.muted}>{savedMsg}</div> : null}
        {err ? <div style={styles.error}>{err}</div> : null}
      </div>

      <div style={styles.card}>
        <div style={styles.rowBetween}>
          <div>
            <div style={styles.h2}>Stats</div>
            <div style={styles.muted}>
              pending: {stats?.pending ?? "—"} • active: {stats?.active ?? "—"} • rejected:{" "}
              {stats?.rejected ?? "—"}
            </div>
          </div>
          <button style={styles.btn} onClick={refresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div style={styles.row}>
          <select style={styles.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="pending">pending</option>
            <option value="active">active</option>
            <option value="rejected">rejected</option>
            <option value="all">all</option>
          </select>
          <div style={styles.muted}>Showing: {filter}</div>
        </div>

        <div style={styles.stack}>
          {list.map((a) => (
            <div key={a.id} style={styles.adminCard}>
              <div style={styles.adminCardTop}>
                <div>
                  <div style={styles.adminName}>{a.name}</div>
                  <div style={styles.muted}>
                    {a.genre || "—"} • {a.location || "—"}
                  </div>
                  <div style={styles.badges}>
                    <span style={styles.badge}>{a.status}</span>
                    <span style={styles.badge}>votes: {a.votes ?? 0}</span>
                  </div>
                </div>
              </div>

              <div style={styles.adminActions}>
                <button style={styles.btnApprove} onClick={() => onApprove(a.id)}>
                  Approve
                </button>
                <button style={styles.btnReject} onClick={() => onReject(a.id)}>
                  Reject
                </button>
              </div>
            </div>
          ))}

          {list.length === 0 ? <div style={styles.muted}>No records.</div> : null}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Styles (simple + mobile safe)
----------------------------- */
const styles = {
  page: {
    minHeight: "100vh",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
    background: "#0b0b10",
    color: "#ffffff",
  },
  header: {
    padding: "16px 16px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  brand: { display: "flex", gap: 10, alignItems: "center" },
  logoDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    background: "linear-gradient(90deg, #7c3aed, #f97316)",
  },
  title: { fontSize: 18, fontWeight: 800, letterSpacing: 0.2 },
  subtitle: { fontSize: 12, opacity: 0.7 },
  apiBase: { fontSize: 12, opacity: 0.65 },

  nav: {
    padding: "10px 16px",
    display: "flex",
    gap: 10,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  navLink: (active) => ({
    padding: "8px 10px",
    borderRadius: 10,
    textDecoration: "none",
    color: "#fff",
    background: active ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.06)",
    border: active
      ? "1px solid rgba(124,58,237,0.5)"
      : "1px solid rgba(255,255,255,0.10)",
  }),

  main: { padding: 16, maxWidth: 1100, margin: "0 auto" },
  footer: {
    padding: 14,
    textAlign: "center",
    fontSize: 12,
    opacity: 0.65,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },

  stack: { display: "flex", flexDirection: "column", gap: 14 },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  card: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  },
  h2: { margin: 0, fontSize: 16, fontWeight: 800 },
  p: { marginTop: 8, marginBottom: 0, opacity: 0.9, lineHeight: 1.35 },
  muted: { marginTop: 8, opacity: 0.7, fontSize: 12 },

  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.3)",
    color: "#fff",
    outline: "none",
    minWidth: 220,
    flex: 1,
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.3)",
    color: "#fff",
    outline: "none",
    width: "100%",
    resize: "vertical",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.3)",
    color: "#fff",
    outline: "none",
  },

  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(124,58,237,0.6)",
    background: "rgba(124,58,237,0.25)",
    color: "#fff",
    fontWeight: 700,
  },
  btnDisabled: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.7)",
    fontWeight: 700,
  },
  btnSecondary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: 700,
  },

  badges: { marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
  },
  artistName: { fontSize: 16, fontWeight: 900 },
  cardTop: { display: "flex", justifyContent: "space-between", gap: 10 },

  error: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(248,113,113,0.45)",
    background: "rgba(248,113,113,0.15)",
  },

  // Admin cards (mobile-first)
  adminCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 12,
  },
  adminCardTop: { display: "flex", justifyContent: "space-between", gap: 10 },
  adminName: { fontSize: 16, fontWeight: 900 },

  adminActions: {
    marginTop: 10,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  btnApprove: {
    flex: 1,
    minWidth: 130,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(34,197,94,0.55)",
    background: "rgba(34,197,94,0.22)",
    color: "#fff",
    fontWeight: 900,
  },
  btnReject: {
    flex: 1,
    minWidth: 130,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(248,113,113,0.55)",
    background: "rgba(248,113,113,0.22)",
    color: "#fff",
    fontWeight: 900,
  },
};