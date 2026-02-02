import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, API_BASE, getApiBase } from "./services/api";

/* -----------------------------
   Helpers
----------------------------- */

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function pillStyle(active) {
  return {
    textDecoration: "none",
    borderRadius: 16,
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: active ? "rgba(154,74,255,0.25)" : "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 900,
    display: "inline-block",
    cursor: "pointer",
  };
}

function Card({ children }) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.35)",
        boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
}

/* -----------------------------
   Extract Artists Safely
   (handles many possible shapes)
----------------------------- */

function extractArtists(res) {
  if (!res) return [];

  if (Array.isArray(res.artists)) return res.artists;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.results)) return res.results;

  if (res.data) {
    if (Array.isArray(res.data.artists)) return res.data.artists;
    if (Array.isArray(res.data.items)) return res.data.items;
    if (Array.isArray(res.data.results)) return res.data.results;
    if (res.data.data) {
      if (Array.isArray(res.data.data.artists)) return res.data.data.artists;
      if (Array.isArray(res.data.data.items)) return res.data.data.items;
      if (Array.isArray(res.data.data.results)) return res.data.data.results;
    }
  }

  // if backend ever returns the array raw
  if (Array.isArray(res)) return res;

  return [];
}

function getId(a) {
  return safeText(a?.id || a?._id || a?.slug || "");
}

/* -----------------------------
   Canonical fetch fallback
   (single purpose: stop "count 0" / empty render issues)
----------------------------- */

async function canonicalFetchArtists({ status, q }) {
  const base = safeText(getApiBase ? getApiBase() : API_BASE).trim();
  const urlBase = base || API_BASE;

  const params = new URLSearchParams();
  if (status) params.set("status", safeText(status));
  if (q) params.set("q", safeText(q));

  const url = `${urlBase}/api/artists${params.toString() ? `?${params.toString()}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      safeText(data?.message) ||
      safeText(data?.error) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    err.url = url;
    throw err;
  }

  return { url, data };
}

/* -----------------------------
   Artists Page
----------------------------- */

export default function Artists() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [artists, setArtists] = useState([]);

  // Debug snapshot shown on page
  const [debug, setDebug] = useState({
    apiBase: safeText(API_BASE),
    status: "active",
    q: "",
    primaryKeys: [],
    primaryCount: 0,
    primaryArtistsLen: 0,
    fallbackUsed: false,
    fallbackUrl: "",
    fallbackKeys: [],
    fallbackCount: 0,
    fallbackArtistsLen: 0,
    lastUpdatedAt: "",
  });

  const canSearch = useMemo(() => safeText(q).trim().length >= 0, [q]);

  const inFlightRef = useRef(0);

  async function load({ overrideQ, overrideStatus, forceCanonical = false } = {}) {
    if (!canSearch) return;

    const reqId = ++inFlightRef.current;

    const qTrim = safeText(overrideQ !== undefined ? overrideQ : q).trim();
    const st = safeText(overrideStatus !== undefined ? overrideStatus : status).trim();

    setLoading(true);
    setError("");

    try {
      // 1) Primary: use api.js (single source of truth)
      const primaryRes = await api.listArtists({
        status: st,
        query: qTrim,
      });

      const primaryArtists = extractArtists(primaryRes);

      // Build debug snapshot for primary
      const primaryKeys = primaryRes && typeof primaryRes === "object" ? Object.keys(primaryRes) : [];
      const primaryCount =
        typeof primaryRes?.count === "number"
          ? primaryRes.count
          : typeof primaryRes?.total === "number"
            ? primaryRes.total
            : Array.isArray(primaryArtists)
              ? primaryArtists.length
              : 0;

      // 2) If empty OR forced, attempt canonical direct GET /api/artists
      let finalArtists = Array.isArray(primaryArtists) ? primaryArtists : [];
      let fallbackUsed = false;
      let fallbackUrl = "";
      let fallbackKeys = [];
      let fallbackCount = 0;
      let fallbackArtistsLen = 0;

      if (forceCanonical || finalArtists.length === 0) {
        try {
          const fb = await canonicalFetchArtists({ status: st, q: qTrim });
          fallbackUrl = safeText(fb?.url);
          const fbRes = fb?.data;
          fallbackKeys = fbRes && typeof fbRes === "object" ? Object.keys(fbRes) : [];
          const fbArtists = extractArtists(fbRes);
          fallbackArtistsLen = Array.isArray(fbArtists) ? fbArtists.length : 0;

          fallbackCount =
            typeof fbRes?.count === "number"
              ? fbRes.count
              : typeof fbRes?.total === "number"
                ? fbRes.total
                : fallbackArtistsLen;

          if (fallbackArtistsLen > 0) {
            fallbackUsed = true;
            finalArtists = fbArtists;
          }
        } catch (e) {
          // fallback failed — keep primary result + show error only if primary empty
          if (finalArtists.length === 0) {
            throw e;
          }
        }
      }

      // Only apply if this is latest request
      if (reqId === inFlightRef.current) {
        setArtists(Array.isArray(finalArtists) ? finalArtists : []);

        setDebug({
          apiBase: safeText(getApiBase ? getApiBase() : API_BASE),
          status: st,
          q: qTrim,
          primaryKeys,
          primaryCount,
          primaryArtistsLen: primaryArtists?.length || 0,
          fallbackUsed,
          fallbackUrl,
          fallbackKeys,
          fallbackCount,
          fallbackArtistsLen,
          lastUpdatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      if (reqId === inFlightRef.current) {
        setArtists([]);
        setDebug((d) => ({
          ...d,
          apiBase: safeText(getApiBase ? getApiBase() : API_BASE),
          status: safeText(overrideStatus !== undefined ? overrideStatus : status),
          q: safeText(overrideQ !== undefined ? overrideQ : q).trim(),
          primaryKeys: [],
          primaryCount: 0,
          primaryArtistsLen: 0,
          fallbackUsed: false,
          fallbackUrl: safeText(e?.url || ""),
          fallbackKeys: [],
          fallbackCount: 0,
          fallbackArtistsLen: 0,
          lastUpdatedAt: new Date().toISOString(),
        }));

        setError(
          safeText(e?.message) || "Could not load artists. Check API routes."
        );
      }
    } finally {
      if (reqId === inFlightRef.current) setLoading(false);
    }
  }

  function clearSearch() {
    setQ("");
    load({ overrideQ: "", overrideStatus: status });
  }

  useEffect(() => {
    load({ overrideStatus: status, overrideQ: safeText(q).trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>Artists</h1>

      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Backend: {safeText(getApiBase ? getApiBase() : API_BASE)} • Public view shows{" "}
        <b>active</b> artists only.
      </p>

      {/* Status Pills */}
      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span style={pillStyle(status === "active")} onClick={() => setStatus("active")}>
          Active
        </span>

        <span style={pillStyle(status === "pending")} onClick={() => setStatus("pending")}>
          Pending (dev)
        </span>

        <span style={pillStyle(status === "rejected")} onClick={() => setStatus("rejected")}>
          Rejected (dev)
        </span>

        <Link to="/submit" style={pillStyle(false)}>
          + Submit Artist
        </Link>
      </div>

      {/* Search */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Search</div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search artists (name, genre, location)…"
          style={{
            width: "100%",
            padding: "14px",
            marginTop: 10,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            fontSize: 16,
            outline: "none",
          }}
        />

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => load({ overrideQ: safeText(q).trim(), overrideStatus: status })}
            disabled={loading}
            style={{
              borderRadius: 16,
              padding: "12px 18px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(154,74,255,0.25)",
              color: "white",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Loading…" : "Search"}
          </button>

          <button
            onClick={clearSearch}
            disabled={loading}
            style={{
              borderRadius: 16,
              padding: "12px 18px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            Clear
          </button>

          <button
            onClick={() => load({ overrideQ: safeText(q).trim(), overrideStatus: status, forceCanonical: true })}
            disabled={loading}
            style={{
              borderRadius: 16,
              padding: "12px 18px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,147,43,0.18)",
              color: "white",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            Force Canonical Fetch
          </button>
        </div>

        <div style={{ marginTop: 10, opacity: 0.75 }}>
          Showing: <b>{artists.length}</b> artists
          {debug.fallbackUsed ? (
            <span style={{ marginLeft: 8, opacity: 0.9 }}>
              • <b>Fallback used</b>
            </span>
          ) : null}
        </div>

        {error ? (
          <div style={{ marginTop: 10, color: "#ffb3b3" }}>{error}</div>
        ) : null}
      </Card>

      {/* Debug */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Debug</div>
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.30)",
            overflowX: "auto",
            fontSize: 13,
            lineHeight: 1.4,
            opacity: 0.9,
          }}
        >
{JSON.stringify(
  {
    apiBase: debug.apiBase,
    status: debug.status,
    q: debug.q,
    primary: {
      keys: debug.primaryKeys,
      count: debug.primaryCount,
      artistsLen: debug.primaryArtistsLen,
    },
    fallback: {
      used: debug.fallbackUsed,
      url: debug.fallbackUrl,
      keys: debug.fallbackKeys,
      count: debug.fallbackCount,
      artistsLen: debug.fallbackArtistsLen,
    },
    lastUpdatedAt: debug.lastUpdatedAt,
  },
  null,
  2
)}
        </pre>
      </Card>

      {/* Results */}
      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Results</div>

        {loading ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>Loading…</div>
        ) : null}

        {!loading && artists.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>No artists found.</div>
        ) : null}

        {artists.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {artists.map((a) => {
              const id = getId(a);

              return (
                <div
                  key={id || `fallback-${Math.random()}`}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {safeText(a?.name || "Unnamed Artist")}
                  </div>

                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    {safeText(a?.genre)} • {safeText(a?.location)} •{" "}
                    <b>{safeText(a?.status || status)}</b>
                  </div>

                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    Votes: <b>{Number(a?.votes || 0)}</b>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <Link
                      to={id ? `/artist/${encodeURIComponent(id)}` : "/artists"}
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
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </Card>
    </div>
  );
}