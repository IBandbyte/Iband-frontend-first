import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import Artists from "./Artists.jsx";
import ArtistDetail from "./ArtistDetail.jsx";
import { api, API_BASE } from "./services/api";

function Home() {
  return (
    <div style={{ maxWidth: 950, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 56, margin: 0, letterSpacing: -1 }}>
        iBand<span style={{ color: "#FFB100" }}>byte</span>
      </h1>

      <p style={{ opacity: 0.85, marginTop: 10, fontSize: 18 }}>
        Powered by Fans. A Platform for Artists and Influencers.
      </p>

      <div
        style={{
          marginTop: 18,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.35)",
          padding: 18,
          boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 900 }}>Get Signed / Connect</div>
        <div style={{ opacity: 0.85, marginTop: 6 }}>
          Discover rising artists, vote, and help talent get noticed.
        </div>
      </div>
    </div>
  );
}

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeStatus(s) {
  const v = String(s || "").toLowerCase().trim();
  if (v === "pending" || v === "active" || v === "rejected") return v;
  return "";
}

function normalizeAdminArtist(raw) {
  const a = raw || {};
  const id = safeText(a.id || a._id || a.slug || "");
  const name = safeText(a.name || "Unnamed Artist");
  const genre = safeText(a.genre || a.primaryGenre || "");
  const location = safeText(a.location || a.city || a.country || "");
  const bio = safeText(a.bio || a.description || "");
  const imageUrl = safeText(a.imageUrl || a.image || "");
  const status = normalizeStatus(a.status) || "active";
  const createdAt = safeText(a.createdAt || "");
  const updatedAt = safeText(a.updatedAt || "");
  const votes = toNumber(a.votes, 0);

  return { ...a, id, name, genre, location, bio, imageUrl, status, createdAt, updatedAt, votes };
}

function Pill({ children }) {
  return (
    <span
      style={{
        borderRadius: 999,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        fontSize: 13,
        fontWeight: 900,
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

function SoftBtn({ children, onClick, disabled, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 16,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.08)",
        color: "white",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

function DangerBtn({ children, onClick, disabled, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 16,
        padding: "10px 14px",
        border: "1px solid rgba(255,100,100,0.25)",
        background: "rgba(255,40,40,0.14)",
        color: "white",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, disabled, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 16,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(90deg, rgba(154,74,255,0.95), rgba(255,147,43,0.95))",
        color: "black",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.8 : 1,
      }}
    >
      {children}
    </button>
  );
}

function TabBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 16,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(154,74,255,0.22)" : "rgba(255,255,255,0.06)",
        color: "white",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function AdminModeration() {
  const [tab, setTab] = useState("pending"); // pending | active | rejected
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState("");
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [lastMs, setLastMs] = useState(0);

  const title = useMemo(() => {
    if (tab === "pending") return "Pending";
    if (tab === "active") return "Active";
    return "Rejected";
  }, [tab]);

  async function load() {
    setLoading(true);
    setError("");
    const started = Date.now();
    try {
      const [listRes, statsRes] = await Promise.all([
        api.adminListArtists({ status: tab, q: q || "", page: 1, limit: 50 }),
        api.adminStats(),
      ]);

      // listRes shape (from backend): { success, page, limit, total, pages, data }
      const raw = (listRes && listRes.data) || [];
      const normalized = Array.isArray(raw) ? raw.map(normalizeAdminArtist) : [];
      setItems(normalized);

      const s = (statsRes && statsRes.data) || null;
      setStats(s && typeof s === "object" ? s : null);
    } catch (e) {
      setItems([]);
      setStats(null);
      setError(e?.message || "Failed to load admin data");
    } finally {
      setLastMs(Date.now() - started);
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function doAction(fn, id) {
    if (!id) return;
    setActingId(id);
    setError("");
    try {
      await fn(id);
      await load();
    } catch (e) {
      setError(e?.message || "Action failed");
    } finally {
      setActingId("");
    }
  }

  const emptyHint =
    tab === "pending"
      ? "No pending submissions right now."
      : tab === "active"
      ? "No active artists found."
      : "No rejected artists found.";

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 48, margin: 0, letterSpacing: -1 }}>Admin</h1>
          <div style={{ opacity: 0.85, marginTop: 8 }}>
            Moderation Panel • API: {API_BASE}
            {lastMs ? ` • ${lastMs}ms` : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <TabBtn active={tab === "pending"} onClick={() => setTab("pending")}>
            Pending
          </TabBtn>
          <TabBtn active={tab === "active"} onClick={() => setTab("active")}>
            Active
          </TabBtn>
          <TabBtn active={tab === "rejected"} onClick={() => setTab("rejected")}>
            Rejected
          </TabBtn>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.35)",
          padding: 16,
          boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Pill>View: {title}</Pill>
            {stats ? (
              <>
                <Pill>Total: {toNumber(stats.total, 0)}</Pill>
                <Pill>Pending: {toNumber(stats.pending, 0)}</Pill>
                <Pill>Active: {toNumber(stats.active, 0)}</Pill>
                <Pill>Rejected: {toNumber(stats.rejected, 0)}</Pill>
              </>
            ) : (
              <Pill>Stats: {loading ? "Loading…" : "—"}</Pill>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name / genre / location…"
              style={{
                width: 240,
                maxWidth: "100%",
                borderRadius: 16,
                padding: "10px 12px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
                fontWeight: 800,
              }}
            />
            <SoftBtn onClick={load} disabled={loading} title="Reload list + stats">
              {loading ? "Loading…" : "Refresh"}
            </SoftBtn>
            <SoftBtn
              onClick={() => {
                setQ("");
                // reload with cleared q
                setTimeout(load, 0);
              }}
              disabled={loading}
              title="Clear search"
            >
              Clear
            </SoftBtn>
          </div>
        </div>

        {error ? (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 16,
              border: "1px solid rgba(255,64,64,0.35)",
              background: "rgba(120,0,0,0.20)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18 }}>Error</div>
            <div style={{ opacity: 0.9, marginTop: 6 }}>{error}</div>
            <div style={{ opacity: 0.75, marginTop: 10, fontSize: 13 }}>
              Tip: if you set an admin key on the backend, add <b>VITE_ADMIN_KEY</b> to your frontend env.
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 14, opacity: 0.9 }}>
          {q ? (
            <div style={{ marginBottom: 10, fontWeight: 900 }}>
              Searching: <span style={{ opacity: 0.85 }}>{q}</span>
            </div>
          ) : null}

          {items.length === 0 ? (
            <div
              style={{
                borderRadius: 16,
                padding: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 18 }}>{loading ? "Loading…" : emptyHint}</div>
              <div style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.4 }}>
                {tab === "pending"
                  ? "When artists submit, they should appear here for approval."
                  : "Try switching tabs or clearing search."}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {items
                .filter((a) => {
                  if (!q) return true;
                  const hay = `${a.id} ${a.name} ${a.genre} ${a.location} ${a.bio}`.toLowerCase();
                  return hay.includes(String(q).toLowerCase());
                })
                .map((a) => {
                  const busy = actingId === a.id || loading;

                  return (
                    <div
                      key={a.id}
                      style={{
                        borderRadius: 16,
                        padding: 14,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(0,0,0,0.25)",
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      {a.imageUrl ? (
                        <img
                          src={a.imageUrl}
                          alt={a.name}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 14,
                            objectFit: "cover",
                            border: "1px solid rgba(255,255,255,0.10)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(255,255,255,0.05)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 900,
                            fontSize: 22,
                            color: "rgba(255,255,255,0.75)",
                            flex: "0 0 auto",
                          }}
                        >
                          {(a.name || "A").slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 900, fontSize: 20, lineHeight: 1.15 }}>
                              {a.name}
                            </div>
                            <div style={{ opacity: 0.82, marginTop: 4, fontSize: 14 }}>
                              {[a.genre, a.location].filter(Boolean).join(" • ")}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            <Pill>Status: {a.status}</Pill>
                            <Pill>Votes: {toNumber(a.votes, 0)}</Pill>
                          </div>
                        </div>

                        {a.bio ? (
                          <div style={{ marginTop: 10, opacity: 0.88, lineHeight: 1.4 }}>
                            {a.bio}
                          </div>
                        ) : null}

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                          {tab === "pending" ? (
                            <>
                              <PrimaryBtn
                                disabled={busy}
                                onClick={() => doAction(api.adminApproveArtist, a.id)}
                                title="Approve → becomes active"
                              >
                                {busy ? "Working…" : "Approve"}
                              </PrimaryBtn>
                              <DangerBtn
                                disabled={busy}
                                onClick={() => doAction(api.adminRejectArtist, a.id)}
                                title="Reject → moves to rejected"
                              >
                                {busy ? "Working…" : "Reject"}
                              </DangerBtn>
                            </>
                          ) : null}

                          {tab === "rejected" ? (
                            <>
                              <PrimaryBtn
                                disabled={busy}
                                onClick={() => doAction(api.adminRestoreArtist, a.id)}
                                title="Restore → returns to pending"
                              >
                                {busy ? "Working…" : "Restore → Pending"}
                              </PrimaryBtn>
                              <DangerBtn
                                disabled={busy}
                                onClick={() => doAction(api.adminDeleteArtist, a.id)}
                                title="Delete permanently from store (if supported)"
                              >
                                {busy ? "Working…" : "Delete"}
                              </DangerBtn>
                            </>
                          ) : null}

                          {tab === "active" ? (
                            <>
                              <DangerBtn
                                disabled={busy}
                                onClick={() => doAction(api.adminRejectArtist, a.id)}
                                title="Reject active artist"
                              >
                                {busy ? "Working…" : "Reject"}
                              </DangerBtn>
                              <DangerBtn
                                disabled={busy}
                                onClick={() => doAction(api.adminDeleteArtist, a.id)}
                                title="Delete active artist"
                              >
                                {busy ? "Working…" : "Delete"}
                              </DangerBtn>
                            </>
                          ) : null}

                          <SoftBtn
                            disabled={busy}
                            onClick={() => navigator.clipboard?.writeText(a.id)}
                            title="Copy artist ID"
                          >
                            Copy ID
                          </SoftBtn>
                        </div>

                        <div style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
                          ID: {a.id}
                          {a.createdAt ? ` • Created: ${a.createdAt}` : ""}
                          {a.updatedAt ? ` • Updated: ${a.updatedAt}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div style={{ opacity: 0.7, marginTop: 14, fontSize: 13, lineHeight: 1.4 }}>
          Notes:
          <div>• This page uses backend routes under <b>/admin/*</b>.</div>
          <div>• If backend has ADMIN_KEY enabled, add <b>VITE_ADMIN_KEY</b> in your frontend env.</div>
        </div>
      </div>
    </div>
  );
}

function TopNav() {
  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: "white",
    borderRadius: 14,
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: isActive ? "rgba(154,74,255,0.22)" : "rgba(255,255,255,0.06)",
    fontWeight: 900,
  });

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 28 }}>
        iBand<span style={{ color: "#FFB100" }}>byte</span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <NavLink to="/" style={linkStyle} end>
          Home
        </NavLink>

        <NavLink to="/artists" style={linkStyle}>
          Artists
        </NavLink>

        <NavLink to="/admin" style={linkStyle}>
          Admin
        </NavLink>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
        background:
          "radial-gradient(1200px 700px at 20% 10%, rgba(154,74,255,0.35), transparent), radial-gradient(1000px 600px at 80% 20%, rgba(255,147,43,0.25), transparent), #05050a",
      }}
    >
      <TopNav />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/artists/:id" element={<ArtistDetail />} />

        {/* Phase 2.2.3: Admin moderation UI */}
        <Route path="/admin" element={<AdminModeration />} />

        {/* Prevent blank route */}
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}