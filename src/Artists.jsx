import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, API_BASE } from "./services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeArtist(raw) {
  const a = raw || {};
  return {
    id: safeText(a.id || a._id || a.slug || ""),
    name: safeText(a.name || "Unnamed Artist"),
    genre: safeText(a.genre || a.primaryGenre || ""),
    location: safeText(a.location || a.city || a.country || ""),
    bio: safeText(a.bio || a.description || ""),
    status: safeText(a.status || ""),
    votes: toNumber(a.votes, 0),
    imageUrl: safeText(a.imageUrl || a.image || ""),
  };
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

function PrimaryBtn({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 16,
        padding: "12px 16px",
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

function SoftLink({ children, to }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        borderRadius: 16,
        padding: "12px 16px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.08)",
        color: "white",
        fontWeight: 900,
        display: "inline-block",
      }}
    >
      {children}
    </Link>
  );
}

function Card({ children }) {
  return (
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
      {children}
    </div>
  );
}

export default function Artists() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active"); // public view = active only by default

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const subtitle = useMemo(() => {
    const s = status === "all" ? "all" : status;
    const query = safeText(q).trim();
    return query ? `Showing: ${s} • Search: "${query}"` : `Showing: ${s}`;
  }, [q, status]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const params = {
        q: safeText(q).trim(),
        status: status === "all" ? undefined : status,
        limit: 50,
        page: 1,
      };

      const res = await api.listArtists(params);

      // Accept multiple shapes:
      // - { data: { items: [...] } }
      // - { data: [...] }
      // - { items: [...] }
      // - { artists: [...] }
      // - [...]
      const raw =
        (res && res.data && Array.isArray(res.data) && res.data) ||
        (res && res.data && Array.isArray(res.data.items) && res.data.items) ||
        (res && Array.isArray(res.items) && res.items) ||
        (res && Array.isArray(res.artists) && res.artists) ||
        (Array.isArray(res) && res) ||
        [];

      const normalized = raw.map(normalizeArtist).filter((a) => a.id || a.name);
      setItems(normalized);
    } catch (e) {
      setItems([]);
      setError(e?.message || "Failed to load artists");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 56, margin: 0, letterSpacing: -1 }}>Artists</h1>

      <p style={{ opacity: 0.85, marginTop: 10 }}>
        API: {API_BASE}
      </p>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <SoftLink to="/submit">+ Submit Artist</SoftLink>
      </div>

      {error ? (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,64,64,0.35)",
            background: "rgba(120,0,0,0.20)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>Error</div>
          <div style={{ opacity: 0.9, marginTop: 6 }}>{error}</div>
          <div style={{ opacity: 0.7, marginTop: 8, fontSize: 13 }}>
            If Render cold-starts, hit Search once.
          </div>
        </div>
      ) : null}

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Search</div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>{subtitle}</div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search artists (name, genre, location)…"
            style={{
              width: "100%",
              padding: "14px 14px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              color: "white",
              outline: "none",
              fontSize: 16,
            }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "white",
                outline: "none",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              <option value="active">active (public)</option>
              <option value="pending">pending</option>
              <option value="rejected">rejected</option>
              <option value="all">all</option>
            </select>

            <PrimaryBtn onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Search"}
            </PrimaryBtn>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Pill>Total: {items.length}</Pill>
              <Pill>View: {status}</Pill>
            </div>
          </div>

          <div style={{ opacity: 0.7, fontSize: 13 }}>
            Public view shows <b>active</b> artists only by default.
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Results</div>

        {!loading && items.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.75 }}>
            No artists found.
          </div>
        ) : null}

        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          {items.map((a) => {
            const meta = [a.genre, a.location].filter(Boolean).join(" • ");
            return (
              <div
                key={a.id || a.name}
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.25)",
                  padding: 14,
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
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.10)",
                      flex: "0 0 auto",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.05)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 900,
                      fontSize: 26,
                      color: "rgba(255,255,255,0.75)",
                      flex: "0 0 auto",
                    }}
                  >
                    {(a.name?.slice(0, 1) || "A").toUpperCase()}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 20, lineHeight: 1.1 }}>
                    {a.name}
                  </div>
                  {meta ? (
                    <div style={{ opacity: 0.78, marginTop: 6 }}>
                      {meta}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                    <Pill>Votes: {toNumber(a.votes, 0)}</Pill>
                    {a.status ? <Pill>Status: {a.status}</Pill> : null}
                    {a.id ? <Pill>ID: {a.id}</Pill> : null}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <Link
                      to={`/artist/${encodeURIComponent(a.id || "demo")}`}
                      style={{
                        textDecoration: "none",
                        borderRadius: 16,
                        padding: "10px 14px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        fontWeight: 900,
                        display: "inline-block",
                      }}
                    >
                      View Artist →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}