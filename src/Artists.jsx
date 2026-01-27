import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, API_BASE } from "./services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function pickArtistsFromResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.artists)) return res.artists;
  if (Array.isArray(res?.data?.artists)) return res.data.artists;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function Chip({ active, children, to }) {
  const style = {
    textDecoration: "none",
    borderRadius: 16,
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: active ? "rgba(154,74,255,0.35)" : "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 900,
    display: "inline-block",
  };
  return (
    <Link to={to} style={style}>
      {children}
    </Link>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "14px 14px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.25)",
        color: "white",
        outline: "none",
        fontSize: 16,
        ...(props.style || {}),
      }}
    />
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
        minWidth: 120,
      }}
    >
      {children}
    </button>
  );
}

function SoftBtn({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 16,
        padding: "12px 16px",
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

function Card({ children }) {
  return (
    <div
      style={{
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
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [artists, setArtists] = useState([]);

  const status = "active";

  const headerBackend = useMemo(() => {
    try {
      const u = new URL(API_BASE);
      return `${u.host}`;
    } catch {
      return safeText(API_BASE);
    }
  }, []);

  async function loadArtists({ q } = {}) {
    setLoading(true);
    setError("");

    try {
      const res = await api.listArtists({
        status,
        query: safeText(q ?? query).trim(),
      });

      const list = pickArtistsFromResponse(res);
      setArtists(list);
    } catch (e) {
      setArtists([]);
      setError(e?.message || "Failed to load artists");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArtists({ q: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showEmpty = !loading && !error && (!artists || artists.length === 0);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px" }}>
      {/* Top nav chips (matches your screenshot layout) */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
        <Chip active to="/artists">
          Artists
        </Chip>
        <Chip to="/submit">Submit</Chip>
        <Chip to="/admin">Admin</Chip>
      </div>

      <div style={{ marginTop: 18 }}>
        <Card>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -0.5 }}>
            Artists
          </div>

          <div style={{ marginTop: 10, opacity: 0.85 }}>
            <div style={{ fontWeight: 900 }}>Backend: … ({headerBackend})</div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
              Public view shows <b>active</b> artists only.
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artists (name, genre, location)…"
              onKeyDown={(e) => {
                if (e.key === "Enter") loadArtists();
              }}
            />
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <PrimaryBtn disabled={loading} onClick={() => loadArtists()}>
              {loading ? "Searching…" : "Search"}
            </PrimaryBtn>

            <SoftBtn
              disabled={loading}
              onClick={() => {
                setQuery("");
                loadArtists({ q: "" });
              }}
            >
              Clear
            </SoftBtn>

            <div style={{ marginLeft: "auto", opacity: 0.7, fontSize: 13, alignSelf: "center" }}>
              API: {API_BASE}
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
            </div>
          ) : null}
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <Card>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Loading artists…</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              Waiting for backend response…
            </div>
          </Card>
        ) : null}

        {showEmpty ? (
          <Card>
            <div style={{ fontWeight: 900, fontSize: 22 }}>No artists found.</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              Try “Clear” and Search again, or seed an active artist from Hoppscotch.
            </div>
          </Card>
        ) : null}

        {!loading && artists && artists.length > 0 ? (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {artists.map((a, idx) => {
              const id = safeText(a?.id || a?._id || a?.slug || idx);
              const name = safeText(a?.name || "Unnamed Artist");
              const genre = safeText(a?.genre);
              const location = safeText(a?.location);
              const bio = safeText(a?.bio);

              return (
                <Card key={id}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 22, fontWeight: 900 }}>{name}</div>
                      <div style={{ opacity: 0.75, marginTop: 6 }}>
                        {[genre, location].filter(Boolean).join(" • ") || "—"}
                      </div>
                      {bio ? (
                        <div style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.35 }}>
                          {bio}
                        </div>
                      ) : null}
                    </div>

                    <Link
                      to={`/artist/${encodeURIComponent(id)}`}
                      style={{
                        textDecoration: "none",
                        borderRadius: 16,
                        padding: "12px 16px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                      }}
                    >
                      View →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : null}
      </div>

      <div style={{ opacity: 0.6, marginTop: 22, fontSize: 13, textAlign: "center" }}>
        Powered by Fans. A Platform for Artists and Influencers.
      </div>
    </div>
  );
}