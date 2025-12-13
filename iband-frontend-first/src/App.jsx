import React from "react";

export default function App() {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <div style={styles.logoCircle} aria-hidden="true" />
          <div style={styles.brandText}>
            <span style={styles.iband}>iBand</span>
            <span style={styles.byte}>byte</span>
          </div>
        </div>

        <div style={styles.tagline}>Get Signed / Connect</div>
        <div style={styles.sub}>
          Powered by Fans. A Platform for Artists and Influencers.
        </div>

        <div style={styles.ctaRow}>
          <a style={styles.primaryBtn} href="#artists">Browse Artists</a>
          <a style={styles.ghostBtn} href="#submit">Submit Your Music</a>
        </div>
      </header>

      <main style={styles.main}>
        <section id="artists" style={styles.card}>
          <h2 style={styles.h2}>Live Artist Feed</h2>
          <p style={styles.p}>
            Phase 1 boot complete. Next: connect to the backend API and render real artists here.
          </p>
          <div style={styles.placeholderRow}>
            <div style={styles.placeholder} />
            <div style={styles.placeholder} />
            <div style={styles.placeholder} />
          </div>
        </section>

        <section id="submit" style={styles.card}>
          <h2 style={styles.h2}>Artist Submissions</h2>
          <p style={styles.p}>
            Coming next: submission form → moderation queue → admin approval.
          </p>
        </section>
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerLine}>
          © {new Date().getFullYear()} iBandbyte
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(1200px 800px at 20% 0%, rgba(106,17,203,.35), transparent 60%), radial-gradient(900px 700px at 90% 10%, rgba(255,102,0,.22), transparent 55%), #0b0b0f",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    padding: "28px 18px",
  },
  header: {
    maxWidth: 980,
    margin: "0 auto",
    borderRadius: 18,
    padding: "22px 20px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(10px)",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 12 },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: "linear-gradient(135deg, #6a11cb, #ff6600)",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
  },
  brandText: { fontSize: 28, fontWeight: 900, letterSpacing: -0.5 },
  iband: { color: "#fff" },
  byte: { color: "#ffb100" },
  tagline: { marginTop: 12, fontSize: 22, fontWeight: 800 },
  sub: { marginTop: 6, color: "rgba(255,255,255,.75)", lineHeight: 1.35 },
  ctaRow: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 },
  primaryBtn: {
    display: "inline-block",
    padding: "12px 14px",
    borderRadius: 12,
    color: "#111",
    textDecoration: "none",
    fontWeight: 800,
    background: "linear-gradient(90deg, #ffb100, #ff6600)",
  },
  ghostBtn: {
    display: "inline-block",
    padding: "12px 14px",
    borderRadius: 12,
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,.18)",
    background: "rgba(255,255,255,.04)",
  },
  main: { maxWidth: 980, margin: "18px auto 0", display: "grid", gap: 14 },
  card: {
    borderRadius: 18,
    padding: "18px 18px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  h2: { margin: 0, fontSize: 18, fontWeight: 900 },
  p: { marginTop: 10, marginBottom: 0, color: "rgba(255,255,255,.78)", lineHeight: 1.4 },
  placeholderRow: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 },
  placeholder: {
    width: 220,
    height: 110,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.10)",
    background: "linear-gradient(135deg, rgba(106,17,203,.25), rgba(255,102,0,.12))",
  },
  footer: { maxWidth: 980, margin: "16px auto 0", color: "rgba(255,255,255,.55)" },
  footerLine: { padding: "6px 2px" },
};