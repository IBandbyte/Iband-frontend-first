import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, API_BASE } from "./services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function toArray(v) {
  return Array.isArray(v) ? v : [];
}

function readAdminKey() {
  try {
    return safeText(localStorage.getItem("iband_admin_key") || "");
  } catch {
    return "";
  }
}

function normalizeArtist(raw) {
  const a = raw || {};
  return {
    id: safeText(a.id || a._id || a.slug || ""),
    name: safeText(a.name || "Unnamed Artist"),
    genre: safeText(a.genre || a.primaryGenre || ""),
    location: safeText(a.location || a.city || a.country || ""),
    bio: safeText(a.bio || a.description || ""),
    votes: Number.isFinite(Number(a.votes)) ? Number(a.votes) : 0,
    status: safeText(a.status || "active"),
    imageUrl: safeText(a.imageUrl || a.image || ""),
  };
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg =
      safeText(data?.message) ||
      safeText(data?.error) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function robustListArtists({ q, status }) {
  // 1) Prefer api client if present
  if (api && typeof api.listArtists === "function") {
    const payload = await api.listArtists({ q, status });

    // Accept multiple shapes
    const candidates = [
      payload?.artists,
      payload?.data?.artists,
      payload?.data?.items,
      payload?.data,
      payload,
    ];

    for (const c of candidates) {
      if (Array.isArray(c)) return c;
    }

    // Some APIs return { success, count, artists: [] }
    if (payload && typeof payload === "object" && Array.isArray(payload.artists)) {
      return payload.artists;
    }

    return [];
  }

  // 2) Fallback direct fetch to backend
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);

  const url = `${API_BASE}/api/artists${params.toString() ? `?${params}` : ""}`;
  const data = await fetchJson(url);

  if (Array.isArray(data?.artists)) return data.artists;
  if (Array.isArray(data?.data?.artists)) return data.data.artists;
  if (Array.isArray(data?.data?.items)) return data.data.items;

  return [];
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

function Btn({ children, onClick, disabled, soft }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 16,
        padding: "12px 16px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: soft
          ? "rgba(255,255,255,0.08)"
          : "linear-gradient(90deg, rgba(154,74,255,0.95), rgba(255,147,43,0.95))",
        color: soft ? "white" : "black",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.8 : 1,
      }}
    >
      {children}
    </button>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const adminKey = useMemo(() => readAdminKey(), []);
  const canSeeToggle = Boolean(adminKey);
  const [showPending, setShowPending] = useState(false);

  const status = useMemo(() => {
    // Public default: active only
    // Admin toggle: include pending too
    return showPending ? "all" : "active";
  }, [showPending]);

  const subtitle = useMemo(() => {
    return showPending ? "active + pending" : "active only";
  }, [showPending]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const raw = await robustListArtists({
        q: safeText(q).trim(),
        status,
      });

      const normalized = toArray(raw)
        .map(normalizeArtist)
        .filter((a) => a.id && a.name);

      // If backend ignores status=all and returns pending too, we still filter for public mode
      const finalList =
        showPending ? normalized : normalized.filter((a) => a.status !== "pending");

      setItems(finalList);
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
      <h1 style={{ fontSize: 60, margin: 0, letterSpacing: -1 }}>Artists</h1>

      <p style={{ opacity: 0.85, marginTop: 10 }}>
        API: {API_BASE} • Public view shows <b>{subtitle}</b>
      </p>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Artists</div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          Backend: … (iband-backend)
        </div>

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

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn onClick={load} disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </Btn>

            <Btn onClick={load} disabled={loading} soft>
              {loading ? "Loading…" : "Refresh"}
            </Btn>

            <Link
              to="/submit"
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
              Submit Artist →
            </Link>
          </div>

          {canSeeToggle ? (
            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginTop: 6,
                opacity: 0.9,
                fontWeight: 800,
              }}
            >
              <input
                type="checkbox"
                checked={showPending}
                onChange={(e) => setShowPending(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              Show pending too (Admin/Dev)
            </label>
          ) : (
            <div style={{ opacity: 0.7, marginTop: 6 }}>
              Public view shows <b>active</b> artists only.
            </div>
          )}

          {error ? (
            <div
              style={{
                marginTop: 10,
                padding: 14,
                borderRadius: 16,
                border: "1px solid rgba(255,64,64,0.35)",
                background: "rgba(120,0,0,0.20)",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 18 }}>API Error</div>
              <div style={{ opacity: 0.9, marginTop: 6 }}>{error}</div>
              <div style={{ opacity: 0.7, marginTop: 8, fontSize: 13 }}>
                If Render cold-starts, refresh once.
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        {!loading && items.length === 0 ? (
          <div style={{ opacity: 0.75, fontSize: 18 }}>No artists found.</div>
        ) : null}

        <div style={{ display: "grid", gap: 12 }}>
          {items.map((a) => (
            <div
              key={a.id}
              style={{
                borderRadius: 16,
                padding: "14px 14px",
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
                  {a.name?.slice(0, 1)?.toUpperCase() || "A"}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 20 }}>{a.name}</div>
                  <Pill>{a.status}</Pill>
                  <Pill>Votes: {a.votes}</Pill>
                </div>

                <div style={{ opacity: 0.8, marginTop: 6 }}>
                  {[a.genre, a.location].filter(Boolean).join(" • ")}
                </div>

                {a.bio ? (
                  <div style={{ opacity: 0.9, marginTop: 8, lineHeight: 1.45 }}>
                    {a.bio.length > 160 ? `${a.bio.slice(0, 160)}…` : a.bio}
                  </div>
                ) : null}

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link
                    to={`/artist/${encodeURIComponent(a.id)}`}
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
                    View →
                  </Link>

                  <span style={{ opacity: 0.65, fontSize: 12 }}>ID: {a.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}