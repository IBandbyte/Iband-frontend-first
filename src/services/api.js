// src/services/api.js
// iBand Frontend API Client (Vite / Vercel friendly)
// Goals:
// - Backwards compatible named exports used by src/App.jsx
// - New `api` client used by ArtistDetail.jsx
// - Canonical `/api/*` routing with legacy fallback when needed
// - Admin header support via localStorage ("iband_admin_key")

const LS_API_BASE = "iband_api_base";
const LS_ADMIN_KEY = "iband_admin_key";

// Default backend (Render)
const DEFAULT_API_BASE = "https://iband-backend-first-1.onrender.com";

function normalizeBase(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  return s.replace(/\/+$/, "");
}

export function getApiBase() {
  const envBase =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE) ||
    "";

  const stored =
    (typeof window !== "undefined" &&
      window.localStorage &&
      window.localStorage.getItem(LS_API_BASE)) ||
    "";

  return normalizeBase(envBase) || normalizeBase(stored) || DEFAULT_API_BASE;
}

export function setApiBase(base) {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(LS_API_BASE, normalizeBase(base));
}

export function clearApiBase() {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(LS_API_BASE);
}

export function getAdminKey() {
  if (typeof window === "undefined" || !window.localStorage) return "";
  return String(window.localStorage.getItem(LS_ADMIN_KEY) || "").trim();
}

export function setAdminKey(key) {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(LS_ADMIN_KEY, String(key || "").trim());
}

export function clearAdminKey() {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(LS_ADMIN_KEY);
}

export const API_BASE = getApiBase();

function buildUrl(base, path) {
  const p = String(path || "");
  if (!p) return base;
  if (!p.startsWith("/")) return `${base}/${p}`;
  return `${base}${p}`;
}

function makeHeaders({ admin = false, json = true } = {}) {
  const h = {};
  if (json) h["Content-Type"] = "application/json";
  if (admin) {
    const k = getAdminKey();
    if (k) h["x-admin-key"] = k;
  }
  return h;
}

async function readResponse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * request(path, opts)
 * - Always tries canonical `/api` first when path is not already `/api/...`
 * - If it gets a 404, it retries the legacy path (without `/api`)
 */
async function request(path, { method = "GET", body, admin = false } = {}) {
  const base = getApiBase();

  const inputPath = String(path || "");
  const canonicalPath = inputPath.startsWith("/api/")
    ? inputPath
    : inputPath.startsWith("/")
      ? `/api${inputPath}`
      : `/api/${inputPath}`;

  const legacyPath = inputPath.startsWith("/api/")
    ? inputPath.replace(/^\/api/, "")
    : inputPath.startsWith("/")
      ? inputPath
      : `/${inputPath}`;

  const opts = {
    method,
    headers: makeHeaders({ admin, json: body !== undefined }),
  };

  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  // 1) Try canonical
  let res = await fetch(buildUrl(base, canonicalPath), opts);
  let data = await readResponse(res);

  // 404 fallback → try legacy
  if (res.status === 404 && canonicalPath !== legacyPath) {
    res = await fetch(buildUrl(base, legacyPath), opts);
    data = await readResponse(res);
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

/* -------------------------------------------------------
   Public (Backwards compatible named exports)
------------------------------------------------------- */

export function getHealth() {
  // supports either /api/health or /health due to fallback logic
  return request("/health", { method: "GET" });
}

export function listArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const path = qs ? `/artists?${qs}` : "/artists";
  return request(path, { method: "GET" });
}

export function submitArtist(payload) {
  return request("/artists", { method: "POST", body: payload });
}

export function voteArtist(id, amount = 1) {
  return request(`/artists/${encodeURIComponent(id)}/votes`, {
    method: "POST",
    body: { amount },
  });
}

/* -------------------------------------------------------
   Comments (Public)
------------------------------------------------------- */

export function listComments(artistId, { limit = 50, page = 1 } = {}) {
  const qs = new URLSearchParams({
    artistId: String(artistId || ""),
    limit: String(limit),
    page: String(page),
  }).toString();

  return request(`/comments?${qs}`, { method: "GET" });
}

export function addComment(payload) {
  // payload: { artistId, name|author, text }
  return request("/comments", { method: "POST", body: payload });
}

/* -------------------------------------------------------
   Admin (Artists)
------------------------------------------------------- */

export function adminListArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/admin/artists?${qs}` : "/admin/artists", {
    method: "GET",
    admin: true,
  });
}

export function adminStats() {
  return request("/admin/stats", { method: "GET", admin: true });
}

export function adminApproveArtist(id) {
  return request(`/admin/artists/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    admin: true,
  });
}

export function adminRejectArtist(id) {
  return request(`/admin/artists/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    admin: true,
  });
}

/* -------------------------------------------------------
   Admin (Comments moderation)
------------------------------------------------------- */

export function adminListComments(status = "pending") {
  const qs = new URLSearchParams({ status: String(status || "pending") }).toString();
  return request(`/admin/comments?${qs}`, { method: "GET", admin: true });
}

export function adminPatchComment(id, patch = {}) {
  return request(`/admin/comments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    admin: true,
    body: patch,
  });
}

export function adminDeleteComment(id) {
  return request(`/admin/comments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    admin: true,
  });
}

/* -------------------------------------------------------
   New API client (ArtistDetail.jsx expects: api.getArtist, api.voteArtist, etc.)
------------------------------------------------------- */

export const api = {
  // artists
  getHealth,
  listArtists,
  submitArtist,
  voteArtist,

  getArtist: (id) => request(`/artists/${encodeURIComponent(id)}`, { method: "GET" }),

  // comments
  listComments,
  addComment,

  // admin
  adminListArtists,
  adminStats,
  adminApproveArtist,
  adminRejectArtist,

  adminListComments,
  adminPatchComment,
  adminDeleteComment,
};