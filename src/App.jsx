import { NavLink, Route, Routes } from "react-router-dom";
import Feed from "./Feed";
import Artists from "./Artists";
import ArtistDetail from "./ArtistDetail";
import Submit from "./Submit";

function linkStyle({ isActive }) {
  return {
    color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)",
    textDecoration: "none",
    fontWeight: isActive ? 800 : 600,
    fontSize: "14px",
    padding: "10px 14px",
    borderRadius: "999px",
    background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
    border: isActive
      ? "1px solid rgba(255,255,255,0.15)"
      : "1px solid transparent",
    transition: "all 0.2s ease"
  };
}

function Shell({ children }) {
  return (
    <div style={styles.appShell}>
      <header style={styles.topBar}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>🎵</div>
          <div>
            <div style={styles.logoText}>iBandbyte</div>
            <div style={styles.logoSub}>Powered by Fans</div>
          </div>
        </div>

        <nav style={styles.nav}>
          <NavLink to="/" style={linkStyle} end>
            Feed
          </NavLink>

          <NavLink to="/artists" style={linkStyle}>
            Artists
          </NavLink>

          <NavLink to="/submit" style={linkStyle}>
            Submit
          </NavLink>
        </nav>
      </header>

      <main style={styles.main}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/artists/:id" element={<ArtistDetail />} />
        <Route path="/submit" element={<Submit />} />
      </Routes>
    </Shell>
  );
}

const styles = {
  appShell: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #050816 0%, #0f172a 40%, #111827 100%)",
    color: "#ffffff",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    backdropFilter: "blur(12px)",
    background: "rgba(5,8,22,0.7)",
    borderBottom: "1px solid rgba(255,255,255,0.05)"
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  logoIcon: {
    fontSize: "22px"
  },
  logoText: {
    fontWeight: 800,
    fontSize: "16px"
  },
  logoSub: {
    fontSize: "11px",
    opacity: 0.6
  },
  nav: {
    display: "flex",
    gap: "10px"
  },
  main: {
    padding: "16px"
  }
};