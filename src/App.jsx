import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useNavigate,
  useParams,
} from "react-router-dom";

import { api } from "./services/api.js";

const BRAND = {
  name: "iBandbyte",
  tagline: "Powered by Fans. A Platform for Artists.",
};

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeText(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  const s = String(v);
  return s.trim().length ? s : fallback;
}

function normalizeArtists(payload) {
  // Accepts: array, { data: [] }, { artists: [] }, { items: [] }, { results: [] }
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const keys = ["data", "artists", "items", "results"];
    for (const k of keys) {
      if (Array.isArray(payload[k])) return payload[k];
    }
  }
  return [];
}

function normalizeArtist(payload) {
  // Accepts: object, { data: {} }, { artist: {} }
  if (payload && typeof payload === "object") {
    if (payload.id || payload._id || payload.name) return payload;
    if (payload.data && typeof payload.data === "object") return payload.data;
    if (payload.artist && typeof payload.artist === "object") return payload.artist;
  }
  return null;
}

function getArtistId(a) {
  return a?.id ?? a?._id ?? a?.artistId ?? a?.slug ?? null;
}

function getVotes(a) {
  const v = a?.votes ?? a?.voteCount ?? a?.totalVotes ?? a?.voteTotal ?? 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getGenre(a) {
  return (
    a?.genre ??
    a?.primaryGenre ??
    a?.category ??
    (Array.isArray(a?.genres) ? a.genres[0] : null) ??
    "Unknown"
  );
}

function getLocation(a) {
  return a?.location ?? a?.city ?? a?.country ?? "";
}

function getBio(a) {
  return a?.bio ?? a?.about ?? a?.description ?? "";
}

function getImage(a) {
  return a?.imageUrl ?? a?.image ?? a?.avatarUrl ?? a?.avatar ?? a?.photoUrl ?? "";
}

function formatApiError(err) {
  if (!err) return "Unknown error";
  const msg = err.message || "Request failed";
  const status = err.status ? ` (HTTP ${err.status})` : "";
  return `${msg}${status}`;
}

function Shell({ children }) {
  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandName}>
            <span style={styles.brandWhite}>iBand</span>
            <span style={styles.brandGradient}>byte</span>
          </div>
          <div style={styles.brandSub}>{BRAND.tagline}</div>
        </div>

        <nav style={styles.nav}>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              ...styles.navBtn,
              ...(isActive ? styles.navBtnActive : {}),
            })}
          >
            Home
          </NavLink>
          <NavLink
            to="/artists"
            style={({ isActive }) => ({
              ...styles.navBtn,
              ...(isActive ? styles.navBtnActive : {}),
            })}
          >
            Artists
          </NavLink>
          <NavLink
            to="/admin"
            style={({ isActive }) => ({
              ...styles.navBtn,
              ...(isActive ? styles.navBtnActive : {}),
            })}
          >
            Admin
          </NavLink>
        </nav>
      </header>

      <main style={styles.main}>{children}</main>

      <footer style={styles.footer}>{BRAND.tagline}</footer>
    </div>
  );
}

function Home() {
  const nav = useNavigate();

  return (
    <Shell>
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>
          <span style={styles.heroBrand}>
            <span style={styles.brandWhite}>iBand</span>
            <span style={styles.brandGradient}>byte</span>
          </span>
        </h1>
        <p style={styles.heroLead}>Home route loaded successfully.</p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Discover</div>
            <div style={styles.cardText}>
              Browse up-and-coming artists and preview tracks.
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Vote</div>
            <div style={styles.cardText}>
              Help artists get signed with fan-powered voting.
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Connect</div>
            <div style={styles.cardText}>
              Labels scout talent, artists build fans.
            </div>
          </div>
        </div>

        <div style={styles.actionsRow}>
          <button style={styles.primaryBtn} onClick={() => nav("/artists")}>
            Go to Artists
          </button>
          <button style={styles.ghostBtn} onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      </section>
    </Shell>
  );
}

function Artists() {
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [artists, setArtists] = React.useState([]);
  const [query, setQuery] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await api.listArtists();
      const list = normalizeArtists(payload);

      // Ensure stable shape for rendering (best-effort)
      const cleaned = list.map((a, idx) => ({
        ...a,
        __key: getArtistId(a) ?? `row_${idx}`,
        __name: safeText(a?.name, "Unnamed Artist"),
        __genre: safeText(getGenre(a), "Unknown"),
        __votes: getVotes(a),
        __location: safeText(getLocation(a), ""),
        __bio: safeText(getBio(a), ""),
        __image: safeText(getImage(a), ""),
      }));

      setArtists(cleaned);
    } catch (e) {
      setError(formatApiError(e));
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => {
      const hay = [
        a.__name,
        a.__genre,
        a.__location,
        a.__bio,
        String(a.__votes),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [artists, query]);

  return (
    <Shell>
      <section style={styles.section}>
        <h2 style={styles.pageTitle}>Artists</h2>
        <p style={styles.pageSub}>
          Live route. This now fetches from the backend and renders cards.
        </p>

        <div style={styles.toolbar}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artists (name, genre, location, votes)…"
            style={styles.search}
            autoCapitalize="none"
            autoCorrect="off"
          />

          <div style={styles.toolbarBtns}>
            <button style={styles.primaryBtn} onClick={load} disabled={loading}>
              Refresh
            </button>

            <button
              style={styles.ghostBtn}
              onClick={() => nav("/artists/demo")}
            >
              Open demo artist
            </button>
          </div>
        </div>

        {error ? (
          <div style={styles.alertError}>
            <div style={styles.alertTitle}>Error</div>
            <div style={styles.alertText}>{error}</div>
            <div style={styles.alertHint}>
              If you see timeouts: the backend may be cold-starting on Render.
              Hit Refresh once or twice.
            </div>
          </div>
        ) : null}

        {loading ? (
          <div style={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={styles.skeletonCard}>
                <div style={styles.skeletonLineLg} />
                <div style={styles.skeletonLineSm} />
                <div style={styles.skeletonLineSm} />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div style={styles.card}>
            <div style={styles.cardTitle}>No artists yet</div>
            <div style={styles.cardText}>
              The backend returned an empty list. That’s okay — next phase we’ll
              add seed data or admin submission.
            </div>
          </div>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div style={styles.cardsGrid}>
            {filtered.map((a) => {
              const id = getArtistId(a);
              return (
                <div key={a.__key} style={styles.artistCard}>
                  <div style={styles.artistTopRow}>
                    <div style={styles.artistIdentity}>
                      <div style={styles.artistName}>{a.__name}</div>
                      <div style={styles.artistMetaRow}>
                        <span style={styles.pill}>{a.__genre}</span>
                        {a.__location ? (
                          <span style={styles.pillMuted}>{a.__location}</span>
                        ) : null}
                        <span style={styles.pillVotes}>
                          Votes: <b style={{ fontWeight: 700 }}>{a.__votes}</b>
                        </span>
                      </div>
                    </div>

                    {a.__image ? (
                      <div style={styles.artistAvatarWrap}>
                        <img
                          src={a.__image}
                          alt={a.__name}
                          style={styles.artistAvatar}
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div style={styles.artistAvatarFallback}>
                        {a.__name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {a.__bio ? (
                    <div style={styles.artistBio}>{a.__bio}</div>
                  ) : (
                    <div style={styles.artistBioMuted}>
                      No bio yet. Next phase we’ll show track previews + comments.
                    </div>
                  )}

                  <div style={styles.artistActions}>
                    <button
                      style={styles.ghostBtn}
                      onClick={() => {
                        if (id) nav(`/artists/${encodeURIComponent(id)}`);
                        else nav("/artists/demo");
                      }}
                    >
                      View Profile
                    </button>

                    <button
                      style={styles.primaryBtn}
                      onClick={async () => {
                        // Vote now (optimistic UI)
                        const artistId = id;
                        if (!artistId) return;

                        // Optimistic
                        setArtists((prev) =>
                          prev.map((x) =>
                            getArtistId(x) === artistId
                              ? { ...x, __votes: (x.__votes || 0) + 1 }
                              : x
                          )
                        );

                        try {
                          await api.vote(artistId);
                        } catch (e) {
                          // Revert on failure
                          setArtists((prev) =>
                            prev.map((x) =>
                              getArtistId(x) === artistId
                                ? { ...x, __votes: Math.max((x.__votes || 1) - 1, 0) }
                                : x
                            )
                          );
                          setError(formatApiError(e));
                        }
                      }}
                    >
                      Vote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </Shell>
  );
}

function ArtistDetail() {
  const nav = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [artist, setArtist] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await api.getArtist(id);
      const a = normalizeArtist(payload);
      if (!a) throw new Error("Artist not found");
      setArtist(a);
    } catch (e) {
      setError(formatApiError(e));
      setArtist(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const name = safeText(artist?.name, "Artist");
  const genre = safeText(getGenre(artist), "Unknown");
  const votes = getVotes(artist);
  const bio = safeText(getBio(artist), "");

  return (
    <Shell>
      <section style={styles.section}>
        <h2 style={styles.pageTitle}>{name}</h2>
        <p style={styles.pageSub}>Live detail route: /artists/:id</p>

        {error ? (
          <div style={styles.alertError}>
            <div style={styles.alertTitle}>Error</div>
            <div style={styles.alertText}>{error}</div>
            <div style={styles.alertHint}>
              If your backend doesn’t support <code>/artists/:id</code> yet,
              we’ll add it in the backend phase.
            </div>
          </div>
        ) : null}

        {loading ? (
          <div style={styles.skeletonCard}>
            <div style={styles.skeletonLineLg} />
            <div style={styles.skeletonLineSm} />
            <div style={styles.skeletonLineSm} />
          </div>
        ) : null}

        {!loading && artist ? (
          <div style={styles.artistDetailCard}>
            <div style={styles.artistMetaRow}>
              <span style={styles.pill}>{genre}</span>
              <span style={styles.pillVotes}>
                Votes: <b style={{ fontWeight: 700 }}>{votes}</b>
              </span>
              {getLocation(artist) ? (
                <span style={styles.pillMuted}>{safeText(getLocation(artist), "")}</span>
              ) : null}
            </div>

            {bio ? (
              <div style={styles.artistBio}>{bio}</div>
            ) : (
              <div style={styles.artistBioMuted}>
                This artist has no bio yet.
              </div>
            )}

            <div style={styles.artistActions}>
              <button style={styles.ghostBtn} onClick={() => nav("/artists")}>
                Back
              </button>

              <button style={styles.primaryBtn} onClick={load}>
                Refresh
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </Shell>
  );
}

function DemoArtist() {
  const nav = useNavigate();

  return (
    <Shell>
      <section style={styles.section}>
        <h2 style={styles.pageTitle}>Demo Artist</h2>

        <div style={styles.artistDetailCard}>
          <div style={styles.cardTitle}>Overview</div>
          <div style={styles.artistMetaRow}>
            <span style={styles.pill}>Pop / Urban</span>
            <span style={styles.pillVotes}>
              Votes: <b style={{ fontWeight: 700 }}>42</b>
            </span>
          </div>

          <div style={styles.cardTitle}>Bio</div>
          <div style={styles.artistBio}>
            This is a demo placeholder. Next phase will display a real artist with
            track previews and comments.
          </div>

          <div style={styles.artistActions}>
            <button style={styles.ghostBtn} onClick={() => nav("/artists")}>
              Back
            </button>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Admin() {
  return (
    <Shell>
      <section style={styles.section}>
        <h2 style={styles.pageTitle}>Admin</h2>
        <p style={styles.pageSub}>
          Placeholder route. Later we’ll connect to real admin endpoints + protect access.
        </p>
      </section>
    </Shell>
  );
}

function NotFound() {
  const nav = useNavigate();
  return (
    <Shell>
      <section style={styles.section}>
        <h2 style={styles.pageTitle}>Route not found.</h2>
        <div style={styles.actionsRow}>
          <button style={styles.primaryBtn} onClick={() => nav("/")}>
            Go Home
          </button>
          <button style={styles.ghostBtn} onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      </section>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/artists" element={<Artists />} />
        <Route path="/artists/demo" element={<DemoArtist />} />
        <Route path="/artists/:id" element={<ArtistDetail />} />

        <Route path="/admin" element={<Admin />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    color: "rgba(255,255,255,0.92)",
    background: "radial-gradient(1200px 800px at 30% -10%, rgba(168, 85, 247, 0.20), transparent 55%), radial-gradient(900px 700px at 90% 0%, rgba(249, 115, 22, 0.16), transparent 55%), #07070b",
    position: "relative",
    overflowX: "hidden",
  },
  bgGlow: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 30%, rgba(255,255,255,0.02))",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    padding: "18px 18px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(7,7,11,0.70)",
    backdropFilter: "blur(10px)",
  },
  brand: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  brandName: {
    fontSize: 34,
    letterSpacing: "-0.02em",
    fontWeight: 800,
    lineHeight: 1,
  },
  brandWhite: { color: "rgba(255,255,255,0.92)" },
  brandGradient: {
    background: "linear-gradient(90deg, #a855f7, #f97316)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  },
  brandSub: {
    fontSize: 14,
    opacity: 0.72,
  },
  nav: {
    marginTop: 12,
    display: "flex",
    gap: 10,
  },
  navBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    borderRadius: 14,
    textDecoration: "none",
    color: "rgba(255,255,255,0.86)",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
  },
  navBtnActive: {
    border: "1px solid rgba(168,85,247,0.55)",
    boxShadow: "0 0 0 1px rgba(249,115,22,0.18) inset",
  },
  main: {
    padding: 18,
  },
  footer: {
    padding: "22px 18px 28px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    opacity: 0.6,
    textAlign: "center",
  },
  hero: {
    maxWidth: 900,
    margin: "20px auto 0",
  },
  heroTitle: {
    fontSize: 56,
    letterSpacing: "-0.03em",
    margin: "14px 0 6px",
  },
  heroBrand: {
    display: "inline-block",
  },
  heroLead: {
    margin: "6px 0 18px",
    opacity: 0.72,
    fontSize: 18,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
    marginTop: 14,
  },
  card: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 16,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 6,
  },
  cardText: {
    opacity: 0.75,
    lineHeight: 1.45,
  },
  actionsRow: {
    display: "flex",
    gap: 12,
    marginTop: 18,
    flexWrap: "wrap",
  },
  primaryBtn: {
    border: "none",
    borderRadius: 16,
    padding: "12px 16px",
    fontWeight: 800,
    color: "#0a0a0f",
    background: "linear-gradient(90deg, #a855f7, #f97316)",
  },
  ghostBtn: {
    borderRadius: 16,
    padding: "12px 16px",
    fontWeight: 800,
    color: "rgba(255,255,255,0.86)",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  section: {
    maxWidth: 980,
    margin: "10px auto 0",
  },
  pageTitle: {
    fontSize: 46,
    letterSpacing: "-0.03em",
    margin: "10px 0 6px",
  },
  pageSub: {
    opacity: 0.70,
    margin: "0 0 14px",
    lineHeight: 1.45,
  },
  toolbar: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    margin: "12px 0 16px",
  },
  toolbarBtns: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  search: {
    width: "100%",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.90)",
    padding: "12px 14px",
    outline: "none",
    fontSize: 15,
  },
  alertError: {
    borderRadius: 18,
    border: "1px solid rgba(255,80,80,0.20)",
    background: "rgba(255,80,80,0.05)",
    padding: 16,
    marginBottom: 16,
  },
  alertTitle: { fontSize: 18, fontWeight: 900, marginBottom: 6 },
  alertText: { opacity: 0.9, lineHeight: 1.45 },
  alertHint: { marginTop: 10, opacity: 0.65, lineHeight: 1.45 },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
  },
  artistCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 16,
    boxShadow: "0 18px 55px rgba(0,0,0,0.25)",
  },
  artistTopRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  artistIdentity: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
    flex: 1,
  },
  artistName: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  artistMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  pill: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(168,85,247,0.25)",
    background: "rgba(168,85,247,0.08)",
    fontSize: 12,
    fontWeight: 800,
  },
  pillMuted: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    fontSize: 12,
    fontWeight: 800,
    opacity: 0.8,
  },
  pillVotes: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(249,115,22,0.25)",
    background: "rgba(249,115,22,0.08)",
    fontSize: 12,
    fontWeight: 800,
  },
  artistBio: {
    marginTop: 12,
    opacity: 0.78,
    lineHeight: 1.5,
  },
  artistBioMuted: {
    marginTop: 12,
    opacity: 0.60,
    lineHeight: 1.5,
  },
  artistActions: {
    marginTop: 14,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  artistAvatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    flex: "0 0 auto",
  },
  artistAvatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  artistAvatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    color: "rgba(255,255,255,0.85)",
    flex: "0 0 auto",
  },
  skeletonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
    marginBottom: 16,
  },
  skeletonCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 16,
  },
  skeletonLineLg: {
    height: 18,
    borderRadius: 10,
    background: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },
  skeletonLineSm: {
    height: 12,
    borderRadius: 10,
    background: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  artistDetailCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 16,
    boxShadow: "0 18px 55px rgba(0,0,0,0.25)",
  },
};