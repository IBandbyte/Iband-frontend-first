import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import Feed from "./Feed";
import Artists from "./Artists";
import ArtistDetail from "./ArtistDetail";
import Submit from "./Submit";

function linkStyle({ isActive }, isFeedRoute) {
  return {
    color: isActive ? "#ffffff" : "rgba(255,255,255,0.72)",
    textDecoration: "none",
    fontWeight: isActive ? 800 : 600,
    fontSize: "14px",
    padding: "10px 14px",
    borderRadius: "999px",
    background: isActive
      ? "rgba(255,255,255,0.14)"
      : isFeedRoute
        ? "transparent"
        : "transparent",
    border: isActive
      ? "1px solid rgba(255,255,255,0.18)"
      : "1px solid transparent",
    transition: "all 0.2s ease"
  };
}

function Shell({ children }) {
  const location = useLocation();
  const isFeedRoute = location.pathname === "/";

  return (
    <div style={styles.appShell}>
      <header
        style={{
          ...styles.topBar,
          ...(isFeedRoute ? styles.topBarFeed : styles.topBarDefault)
        }}
      >
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>🎵</div>
          <div>
            <div style={styles.logoText}>iBandbyte</div>
            <div style={styles.logoSub}>Powered by Fans</div>
          </div>
        </div>

        <nav style={styles.nav}>
          <NavLink to="/" style={(state) => linkStyle(state, isFeedRoute)} end>
            Feed
          </NavLink>

          <NavLink to="/artists" style={(state) => linkStyle(state, isFeedRoute)}>
            Artists
          </NavLink>

          <NavLink to="/submit" style={(state) => linkStyle(state, isFeedRoute)}>
            Submit
          </NavLink>
        </nav>
      </header>

      <main
        style={{
          ...styles.main,
          ...(isFeedRoute ? styles.mainFeed : styles.mainDefault)
        }}
      >
        {children}
      </main>
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
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.06)"
  },
  topBarFeed: {
    background: "linear-gradient(180deg, rgba(3,7,18,0.82) 0%, rgba(3,7,18,0.42) 62%, rgba(3,7,18,0) 100%)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.04)"
  },
  topBarDefault: {
    background: "rgba(5, 8, 22, 0.75)",
    backdropFilter: "blur(14px)"
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  logoIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, rgba(168,85,247,0.8), rgba(249,115,22,0.8))",
    fontSize: "18px"
  },
  logoText: {
    fontSize: "16px",
    fontWeight: 800
  },
  logoSub: {
    fontSize: "11px",
    opacity: 0.72
  },
  nav: {
    display: "flex",
    gap: "10px"
  },
  main: {},
  mainFeed: {
    padding: 0
  },
  mainDefault: {
    padding: "76px 14px 40px"
  }
};