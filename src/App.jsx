import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { api } from "./services/api.js";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function GradientLogo() {
  return (
    <span className="brand">
      <span className="brand-iband">iBand</span>
      <span className="brand-byte">byte</span>
    </span>
  );
}

function Shell({ children }) {
  return (
    <div className="page">
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <GradientLogo />
          </div>

          <nav className="nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => cx("nav-btn", isActive && "active")}
            >
              Home
            </NavLink>
            <NavLink
              to="/artists"
              className={({ isActive }) => cx("nav-btn", isActive && "active")}
            >
              Artists
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) => cx("nav-btn", isActive && "active")}
            >
              Admin
            </NavLink>
          </nav>
        </div>
      </div>

      <main className="content">{children}</main>

      <footer className="footer">
        Powered by Fans. A Platform for Artists.
      </footer>
    </div>
  );
}

function Button({ variant = "solid", onClick, children, disabled }) {
  return (
    <button
      className={cx("btn", variant === "ghost" && "btn-ghost")}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

function Card({ title, children }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();

  return (
    <Shell>
      <div className="hero">
        <div className="hero-logo">
          <GradientLogo />
        </div>
        <div className="hero-sub">Home route loaded successfully.</div>

        <div className="stack">
          <Card title="Discover">
            Browse up-and-coming artists and preview tracks.
          </Card>
          <Card title="Vote">Help artists get signed with fan-powered voting.</Card>
          <Card title="Connect">Labels scout talent, artists build fans.</Card>
        </div>

        <div className="actions">
          <Button onClick={() => navigate("/artists")}>Go to Artists</Button>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    </Shell>
  );
}

function Artists() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [artists, setArtists] = useState([]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await api.listArtists();

      // We accept either: { artists: [] } OR [] directly (future-proof)
      const list = Array.isArray(data) ? data : Array.isArray(data?.artists) ? data.artists : [];
      setArtists(list);
    } catch (e) {
      setError(e?.message || "Failed to load artists");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasArtists = artists && artists.length > 0;

  return (
    <Shell>
      <h1 className="h1">Artists</h1>
      <p className="muted">
        Live route. This now fetches from the backend and renders cards.
      </p>

      <div className="actions">
        <Button onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate("/artists/demo")}
          disabled={loading}
        >
          Open demo artist
        </Button>
      </div>

      {error ? (
        <div className="notice error">
          <div className="notice-title">Error</div>
          <div className="notice-body">{error}</div>
        </div>
      ) : null}

      {loading ? (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="artist-card skeleton" key={i}>
              <div className="skeleton-line lg" />
              <div className="skeleton-line" />
              <div className="skeleton-line sm" />
              <div className="skeleton-line btn" />
            </div>
          ))}
        </div>
      ) : hasArtists ? (
        <div className="grid">
          {artists.map((a) => (
            <ArtistCard
              key={String(a?.id || a?._id || a?.slug || a?.name || Math.random())}
              artist={a}
              onOpen={() => {
                const id = a?.id || a?._id || a?.slug || a?.name;
                navigate(`/artists/${encodeURIComponent(String(id))}`);
              }}
              onVoted={load}
            />
          ))}
        </div>
      ) : (
        <div className="notice">
          <div className="notice-title">No artists yet</div>
          <div className="notice-body">
            The backend returned an empty list. That’s okay — next phase we’ll add seed data
            or admin submission.
          </div>
        </div>
      )}
    </Shell>
  );
}

function ArtistCard({ artist, onOpen, onVoted }) {
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState("");

  const name = useMemo(() => {
    return (
      artist?.name ||
      artist?.stageName ||
      artist?.artistName ||
      artist?.title ||
      "Unnamed artist"
    );
  }, [artist]);

  const genre = useMemo(() => {
    return artist?.genre || artist?.category || artist?.style || "";
  }, [artist]);

  const votes = useMemo(() => {
    const v = artist?.votes ?? artist?.voteCount ?? artist?.totalVotes;
    return typeof v === "number" ? v : null;
  }, [artist]);

  async function vote() {
    setVoteError("");
    setVoting(true);
    try {
      const id = artist?.id || artist?._id || artist?.slug || artist?.name;
      await api.vote(String(id));
      if (typeof onVoted === "function") onVoted();
    } catch (e) {
      setVoteError(e?.message || "Vote failed");
    } finally {
      setVoting(false);
    }
  }

  return (
    <div className="artist-card">
      <div className="artist-top">
        <div className="artist-name">{name}</div>
        {genre ? <div className="chip">{genre}</div> : null}
      </div>

      <div className="artist-meta">
        {votes === null ? (
          <span className="muted">Votes: —</span>
        ) : (
          <span className="muted">Votes: {votes}</span>
        )}
      </div>

      {voteError ? <div className="mini-error">{voteError}</div> : null}

      <div className="artist-actions">
        <Button variant="ghost" onClick={onOpen}>
          Open
        </Button>
        <Button onClick={vote} disabled={voting}>
          {voting ? "Voting..." : "Vote"}
        </Button>
      </div>
    </div>
  );
}

function ArtistDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [artist, setArtist] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      // special demo route
      if (id === "demo") {
        setArtist({
          id: "demo",
          name: "Demo Artist",
          genre: "Pop / Urban",
          votes: 42,
          bio:
            "This is a demo placeholder. Next phase will display a real artist with track previews and comments.",
        });
        return;
      }

      const data = await api.getArtist(id);
      setArtist(data?.artist || data);
    } catch (e) {
      setError(e?.message || "Failed to load artist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const name =
    artist?.name ||
    artist?.stageName ||
    artist?.artistName ||
    artist?.title ||
    "Artist";

  const genre = artist?.genre || artist?.category || artist?.style || "";
  const votes = artist?.votes ?? artist?.voteCount ?? artist?.totalVotes;

  return (
    <Shell>
      <h1 className="h1">{name}</h1>

      {loading ? <p className="muted">Loading...</p> : null}

      {error ? (
        <div className="notice error">
          <div className="notice-title">Error</div>
          <div className="notice-body">{error}</div>
        </div>
      ) : null}

      {!loading && !error && artist ? (
        <div className="stack">
          <Card title="Overview">
            <div className="detail-row">
              <span className="muted">Genre</span>
              <span>{genre || "—"}</span>
            </div>
            <div className="detail-row">
              <span className="muted">Votes</span>
              <span>{typeof votes === "number" ? votes : "—"}</span>
            </div>
          </Card>

          <Card title="Bio">
            {artist?.bio || artist?.about || "No bio yet."}
          </Card>

          <div className="actions">
            <Button variant="ghost" onClick={() => window.history.back()}>
              Back
            </Button>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}

function Admin() {
  return (
    <Shell>
      <h1 className="h1">Admin</h1>
      <p className="muted">
        Placeholder route. Later we&apos;ll connect to real admin endpoints + protect access.
      </p>
    </Shell>
  );
}

function NotFound() {
  return (
    <Shell>
      <h1 className="h1">Route not found.</h1>
      <div className="actions">
        <Button onClick={() => (window.location.href = "/")}>Go Home</Button>
        <Button variant="ghost" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </Shell>
  );
}

export default function App() {
  return (
    <>
      <style>{styles}</style>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artists/:id" element={<ArtistDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const styles = `
:root{
  --bg:#050507;
  --panel:#0b0b10;
  --panel2:#0e0e14;
  --text:#eaeaf2;
  --muted:#a8a8b6;
  --stroke:rgba(255,255,255,.10);
  --shadow:rgba(0,0,0,.35);
  --grad: linear-gradient(90deg,#7b2cff 0%,#ff7a18 100%);
  --grad2: linear-gradient(90deg,#a855f7 0%,#fb7185 50%,#f97316 100%);
}

*{ box-sizing:border-box; }
html,body{ height:100%; }
body{
  margin:0;
  background: radial-gradient(800px 500px at 20% 0%, rgba(123,44,255,.20), transparent 60%),
              radial-gradient(800px 500px at 80% 0%, rgba(255,122,24,.18), transparent 60%),
              var(--bg);
  color:var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
}

.page{
  min-height:100vh;
  display:flex;
  flex-direction:column;
}

.topbar{
  position:sticky;
  top:0;
  z-index:10;
  backdrop-filter: blur(10px);
  background: rgba(8,8,12,.70);
  border-bottom:1px solid var(--stroke);
}

.topbar-inner{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:14px 16px;
  gap:12px;
}

.brand{
  font-weight:800;
  letter-spacing:.2px;
  font-size:28px;
  line-height:1;
}
.brand-iband{ color: var(--text); }
.brand-byte{
  background: var(--grad2);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
}

.nav{ display:flex; gap:10px; }
.nav-btn{
  text-decoration:none;
  color:var(--text);
  border:1px solid var(--stroke);
  padding:10px 14px;
  border-radius:14px;
  background: rgba(255,255,255,.02);
}
.nav-btn.active{
  border-color: rgba(168,85,247,.55);
  box-shadow: 0 0 0 3px rgba(168,85,247,.12);
}

.content{
  flex:1;
  padding:22px 16px 34px;
}

.footer{
  border-top:1px solid var(--stroke);
  color: var(--muted);
  text-align:center;
  padding:18px 16px;
  background: rgba(8,8,12,.55);
}

.hero{
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap:14px;
  max-width: 560px;
  margin: 18px auto 0;
  width:100%;
}

.hero-logo{ font-size:56px; }
.hero-sub{
  color: var(--muted);
  font-size:20px;
}

.h1{
  max-width: 900px;
  margin: 10px auto 6px;
  width:100%;
  font-size:42px;
  letter-spacing:.2px;
}

.muted{
  max-width: 900px;
  margin: 0 auto 18px;
  width:100%;
  color: var(--muted);
  font-size:16px;
}

.stack{
  width:100%;
  display:flex;
  flex-direction:column;
  gap:12px;
}

.card{
  border:1px solid var(--stroke);
  background: rgba(255,255,255,.03);
  border-radius:18px;
  padding:16px;
  box-shadow: 0 18px 45px var(--shadow);
}
.card-title{
  font-weight:800;
  font-size:26px;
  margin-bottom:8px;
}
.card-body{
  color: var(--muted);
  font-size:18px;
  line-height:1.35;
}

.actions{
  display:flex;
  gap:12px;
  margin-top: 8px;
  flex-wrap:wrap;
}

.btn{
  border:none;
  padding:14px 18px;
  border-radius:18px;
  font-weight:800;
  font-size:18px;
  cursor:pointer;
  background: var(--grad);
  color: #0b0b10;
  box-shadow: 0 16px 40px rgba(123,44,255,.22);
}
.btn:disabled{
  opacity:.65;
  cursor:not-allowed;
}
.btn-ghost{
  background: rgba(255,255,255,.03);
  color: var(--text);
  border:1px solid var(--stroke);
  box-shadow:none;
}

.grid{
  max-width: 980px;
  margin: 0 auto;
  width:100%;
  display:grid;
  grid-template-columns: 1fr;
  gap:12px;
}

.artist-card{
  border:1px solid var(--stroke);
  background: rgba(255,255,255,.03);
  border-radius:18px;
  padding:16px;
  box-shadow: 0 18px 45px var(--shadow);
}
.artist-top{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
}
.artist-name{
  font-weight:900;
  font-size:22px;
}
.chip{
  border:1px solid var(--stroke);
  padding:6px 10px;
  border-radius:999px;
  background: rgba(255,255,255,.02);
  color: var(--muted);
  font-size:13px;
}
.artist-meta{
  margin-top:10px;
}
.artist-actions{
  display:flex;
  gap:10px;
  margin-top:14px;
  flex-wrap:wrap;
}

.notice{
  max-width: 980px;
  margin: 14px auto 0;
  width:100%;
  border:1px solid var(--stroke);
  border-radius:18px;
  background: rgba(255,255,255,.03);
  padding:14px 16px;
}
.notice.error{
  border-color: rgba(248,113,113,.35);
  background: rgba(248,113,113,.06);
}
.notice-title{
  font-weight:900;
  font-size:18px;
  margin-bottom:6px;
}
.notice-body{
  color: var(--muted);
  line-height:1.35;
}

.mini-error{
  margin-top:10px;
  color: #fca5a5;
  font-weight:700;
}

.detail-row{
  display:flex;
  justify-content:space-between;
  gap:10px;
  padding:8px 0;
  border-bottom:1px solid rgba(255,255,255,.06);
}
.detail-row:last-child{ border-bottom:none; }

.skeleton{
  position:relative;
  overflow:hidden;
}
.skeleton::after{
  content:"";
  position:absolute;
  inset:0;
  transform:translateX(-60%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent);
  animation: shine 1.2s infinite;
}
@keyframes shine{
  0%{ transform:translateX(-60%); }
  100%{ transform:translateX(60%); }
}
.skeleton-line{
  height:12px;
  border-radius:10px;
  background: rgba(255,255,255,.05);
  margin:10px 0;
}
.skeleton-line.lg{ height:18px; width:70%; }
.skeleton-line.sm{ width:55%; }
.skeleton-line.btn{ height:44px; width:60%; border-radius:18px; margin-top:16px; }

@media (min-width: 860px){
  .grid{ grid-template-columns: 1fr 1fr; }
  .hero-logo{ font-size:64px; }
}
`;