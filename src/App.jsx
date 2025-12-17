import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";

function Shell({ children }) {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <div style={styles.brand}>iBand<span style={styles.brandAccent}>byte</span></div>
        </div>

        <nav style={styles.nav}>
          <Link style={styles.navLink} to="/">Home</Link>
          <Link style={styles.navLink} to="/artists">Artists</Link>
          <Link style={styles.navLink} to="/admin">Admin</Link>
        </nav>
      </header>

      <main style={styles.main}>{children}</main>

      <footer style={styles.footer}>
        Powered by Fans. A Platform for Artists.
      </footer>
    </div>
  );
}

function Home() {
  return (
    <div style={styles.center}>
      <h1 style={styles.h1}>
        iBand<span style={styles.brandAccent}>byte</span>
      </h1>

      <p style={styles.subTitle}>Home route loaded successfully.</p>

      <div style={styles.cardRow}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Discover</div>
          <div style={styles.cardText}>Browse up-and-coming artists and preview tracks.</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Vote</div>
          <div style={styles.cardText}>Help artists get signed with fan-powered voting.</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Connect</div>
          <div style={styles.cardText}>Labels scout talent, artists build fans.</div>
        </div>
      </div>

      <div style={styles.actions}>
        <Link to="/artists" style={styles.primaryBtn}>
          Go to Artists
        </Link>

        <button
          type="button"
          style={styles.secondaryBtn}
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

function Artists() {
  return (
    <div>
      <h2 style={styles.h2}>Artists</h2>
      <p style={styles.p}>
        Placeholder route. Next phase will fetch artists from the backend and render cards.
      </p>

      <div style={styles.list}>
        <Link style={styles.listLink} to="/artist/demo-1">Open demo artist</Link>
      </div>
    </div>
  );
}

function ArtistDetail() {
  const location = useLocation();
  return (
    <div>
      <h2 style={styles.h2}>Artist Detail</h2>
      <p style={styles.p}>
        Placeholder route for <code style={styles.code}>/artist/:id</code>
      </p>
      <p style={styles.pSmall}>
        You’re on: <code style={styles.code}>{location.pathname}</code>
      </p>
      <Link to="/artists" style={styles.secondaryBtnAsLink}>Back to Artists</Link>
    </div>
  );
}

function Admin() {
  return (
    <div>
      <h2 style={styles.h2}>Admin</h2>
      <p style={styles.p}>
        Placeholder route. Later we’ll connect to real admin endpoints + protect access.
      </p>
    </div>
  );
}

function NotFound() {
  return (
    <div style={styles.center}>
      <h2 style={styles.h2}>Route not found.</h2>
      <p style={styles.pSmall}>That path doesn’t exist yet.</p>
      <Link to="/" style={styles.primaryBtn}>Go Home</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artist/:id" element={<ArtistDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0f",
    color: "white",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  header: {
    padding: "18px 16px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    position: "sticky",
    top: 0,
    background: "rgba(11,11,15,0.85)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    zIndex: 10,
  },
  brandRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand: { fontSize: 26, fontWeight: 800, letterSpacing: 0.3 },
  brandAccent: {
    background: "linear-gradient(90deg, #9b5cff, #ff7a18)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  },
  nav: { marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap" },
  navLink: {
    color: "rgba(255,255,255,0.9)",
    textDecoration: "none",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
  },
  main: { padding: 16, maxWidth: 980, margin: "0 auto" },
  footer: {
    padding: 18,
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    marginTop: 24,
  },
  center: { textAlign: "center", paddingTop: 40 },
  h1: { fontSize: 54, margin: "0 0 10px", letterSpacing: -0.5 },
  h2: { fontSize: 26, margin: "6px 0 10px" },
  subTitle: { color: "rgba(255,255,255,0.75)", margin: "0 0 18px" },
  p: { color: "rgba(255,255,255,0.78)", lineHeight: 1.5 },
  pSmall: { color: "rgba(255,255,255,0.65)", lineHeight: 1.5 },
  code: {
    padding: "2px 6px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  actions: { marginTop: 18, display: "flex", gap: 10, justifyContent: "center" },
  primaryBtn: {
    display: "inline-block",
    textDecoration: "none",
    color: "white",
    padding: "12px 14px",
    borderRadius: 12,
    background: "linear-gradient(90deg, #9b5cff, #ff7a18)",
    fontWeight: 700,
    border: "0",
  },
  secondaryBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    background: "transparent",
    color: "white",
    border: "1px solid rgba(255,255,255,0.18)",
    fontWeight: 700,
  },
  secondaryBtnAsLink: {
    display: "inline-block",
    marginTop: 12,
    textDecoration: "none",
    padding: "12px 14px",
    borderRadius: 12,
    background: "transparent",
    color: "white",
    border: "1px solid rgba(255,255,255,0.18)",
    fontWeight: 700,
  },
  cardRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginTop: 18,
  },
  card: {
    textAlign: "left",
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
  },
  cardTitle: { fontWeight: 800, marginBottom: 6 },
  cardText: { color: "rgba(255,255,255,0.72)", lineHeight: 1.4 },
  list: { marginTop: 14 },
  listLink: {
    display: "inline-block",
    color: "white",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
  },
};