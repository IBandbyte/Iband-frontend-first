// src/services/api.js
// iBand Frontend API Client (Vite / Vercel safe)
// - Canonical: /api/*
// - Legacy fallback: /* (no /api) if backend returns 404 "API route not found"
// - Admin header: x-admin-key stored in localStorage
// - Exposes BOTH: named exports (getHealth, listArtists...) AND api object (api.getArtist, api.addComment...)

const LS_API_BASE = "iband_api_base";
const LS_ADMIN_KEY = "iband_admin_key";

// Default backend (Render)
const DEFAULT_API_BASE = "https://iband-backend-first-1.onrender.com";

function normalizeBase(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  return s.replace(/\/+$/, "");
}

function safeEnvApiBase() {
  try {
    // Vite replaces import.meta.env at build time
    return (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || "";
  } catch {
    return "";
  }
}

export function getApiBase() {
  const envBase = safeEnvApiBase();
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem(LS_API_BASE) || "" : "";
  return normalizeBase(envBase) || normalizeBase(stored) || DEFAULT_API_BASE;
}

export function setApiBase(base) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LS_API_BASE, normalizeBase(base));
}

export function clearApiBase() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(LS_API_BASE);
}

export function getAdminKey() {
  if (typeof localStorage === "undefined") return "";
  return (localStorage.getItem(LS_ADMIN_KEY) || "").trim();
}

export function setAdminKey(key) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LS_ADMIN_KEY, String(key || "").trim());
}

export function clearAdminKey() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(LS_ADMIN_KEY);
}

// Exported constant (used by UI). Note: if you change base at runtime, reload page to refresh this constant.
export const API_BASE = getApiBase();

function buildUrl(path) {
  const base = getApiBase();
  const p = String(path || "");
  if (!p.startsWith("/")) return `${base}/${p}`;
  return `${base}${p}`;
}

function makeHeaders({ admin = false, json = false } = {}) {
  const h = {};
  if (json) h["Content-Type"] = "application/json";
  if (admin) {
    const k = getAdminKey();
    if (k) h["x-admin-key"] = k;
  }
  return h;
}

async function fetchJson(path, { method = "GET", body, admin = false } = {}) {
  const url = buildUrl(path);

  const opts = {
    method,
    headers: makeHeaders({ admin, json: body !== undefined }),
  };

  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    err.path = path;
    throw err;
  }

  return data;
}

function isApiRouteNotFound(err) {
  const status = err?.status;
  const msg = String(err?.message || "");
  const backendMsg = String(err?.data?.message || "");
  return status === 404 || msg.includes("API route not found") || backendMsg.includes("API route not found");
}

// Tries primary path first, then fallbacks if backend says route not found.
async function requestWithFallback(primaryPath, fallbacks, opts) {
  try {
    return await fetchJson(primaryPath, opts);
  } catch (err) {
    if (!isApiRouteNotFound(err)) throw err;

    for (const fb of fallbacks) {
      try {
        return await fetchJson(fb, opts);
      } catch (e2) {
        // only continue if still route-not-found; otherwise throw immediately
        if (!isApiRouteNotFound(e2)) throw e2;
      }
    }

    // If all fallbacks fail, throw original
    throw err;
  }
}

/* -----------------------------
   Public (Artists)
----------------------------- */

export function getHealth() {
  // Some backends use /health, some /api/health
  return requestWithFallback("/health", ["/api/health"], { method: "GET" });
}

export function listArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();

  // Prefer /api/artists, fallback /artists
  const p1 = qs ? `/api/artists?${qs}` : "/api/artists";
  const p2 = qs ? `/artists?${qs}` : "/artists";

  return requestWithFallback(p1, [p2], { method: "GET" });
}

export function submitArtist(payload) {
  // Prefer /api/artists, fallback /artists
  return requestWithFallback("/api/artists", ["/artists"], {
    method: "POST",
    body: payload,
  });
}

export function voteArtist(id, amount = 1) {
  const safeId = encodeURIComponent(String(id || ""));
  const body = { amount };

  // Prefer /api/artists/:id/votes, fallback /artists/:id/votes
  return requestWithFallback(`/api/artists/${safeId}/votes`, [`/artists/${safeId}/votes`], {
    method: "POST",
    body,
  });
}

export function getArtist(id) {
  const safeId = encodeURIComponent(String(id || ""));

  // Prefer /api/artists/:id, fallback /artists/:id
  return requestWithFallback(`/api/artists/${safeId}`, [`/artists/${safeId}`], { method: "GET" });
}

/* -----------------------------
   Public (Comments)
   Backend confirmed working:
   POST /api/comments  { artistId, author, text }  -> 201
   GET  /api/admin/comments?status=pending        -> 200
----------------------------- */

export async function addComment({ artistId, name, author, text }) {
  // Backend expects "author". Frontend may send "name".
  const payload = {
    artistId: String(artistId || "").trim(),
    author: String(author || name || "Anonymous").trim(),
    text: String(text || "").trim(),
  };

  // Prefer /api/comments, fallback /comments
  return requestWithFallback("/api/comments", ["/comments"], {
    method: "POST",
    body: payload,
  });
}

// Normalize whatever backend returns into: { data: { items: [...] } }
export async function listComments(artistId, { limit = 50, page = 1 } = {}) {
  const qs = new URLSearchParams({
    artistId: String(artistId || ""),
    limit: String(limit),
    page: String(page),
  }).toString();

  // Common patterns:
  // - GET /api/comments?artistId=demo
  // - Legacy: /comments?artistId=demo
  const raw = await requestWithFallback(`/api/comments?${qs}`, [`/comments?${qs}`], { method: "GET" });

  const items =
    (raw && Array.isArray(raw.items) && raw.items) ||
    (raw && Array.isArray(raw.comments) && raw.comments) ||
    (raw && raw.data && Array.isArray(raw.data.items) && raw.data.items) ||
    [];

  return { data: { items } };
}

/* -----------------------------
   Admin (Artists)
----------------------------- */

export function adminListArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();

  const p1 = qs ? `/api/admin/artists?${qs}` : "/api/admin/artists";
  const p2 = qs ? `/admin/artists?${qs}` : "/admin/artists";

  return requestWithFallback(p1, [p2], { method: "GET", admin: true });
}

export function adminStats() {
  return requestWithFallback("/api/admin/stats", ["/admin/stats"], { method: "GET", admin: true });
}

export function adminApproveArtist(id) {
  const safeId = encodeURIComponent(String(id || ""));
  return requestWithFallback(`/api/admin/artists/${safeId}/approve`, [`/admin/artists/${safeId}/approve`], {
    method: "POST",
    admin: true,
  });
}

export function adminRejectArtist(id) {
  const safeId = encodeURIComponent(String(id || ""));
  return requestWithFallback(`/api/admin/artists/${safeId}/reject`, [`/admin/artists/${safeId}/reject`], {
    method: "POST",
    admin: true,
  });
}

/* -----------------------------
   Admin (Comments)
----------------------------- */

export function adminListComments(status = "pending") {
  const qs = new URLSearchParams({ status: String(status || "pending") }).toString();
  return requestWithFallback(`/api/admin/comments?${qs}`, [`/admin/comments?${qs}`], {
    method: "GET",
    admin: true,
  });
}

export function adminUpdateComment(id, patch = {}) {
  const safeId = encodeURIComponent(String(id || ""));
  return requestWithFallback(`/api/admin/comments/${safeId}`, [`/admin/comments/${safeId}`], {
    method: "PATCH",
    admin: true,
    body: patch,
  });
}

export function adminDeleteComment(id) {
  const safeId = encodeURIComponent(String(id || ""));
  return requestWithFallback(`/api/admin/comments/${safeId}`, [`/admin/comments/${safeId}`], {
    method: "DELETE",
    admin: true,
  });
}

/* -----------------------------
   api object (ArtistDetail.jsx uses api.*)
----------------------------- */

export const api = {
  // base helpers
  getApiBase,
  setApiBase,
  clearApiBase,
  getAdminKey,
  setAdminKey,
  clearAdminKey,

  // health
  getHealth,

  // artists
  listArtists,
  submitArtist,
  voteArtist,
  getArtist,

  // comments
  addComment,
  listComments,

  // admin artists
  adminListArtists,
  adminStats,
  adminApproveArtist,
  adminRejectArtist,

  // admin comments
  adminListComments,
  adminUpdateComment,
  adminDeleteComment,
};