// src/services/api.js
// iBand Frontend API Client (ESM)
//
// ✅ Canonical backend routes are /api/*
// ✅ Legacy fallback supported (tries non-/api if backend is older)
// ✅ Admin header x-admin-key stored in localStorage (iband_admin_key)
// ✅ API base stored in localStorage (iband_api_base) or VITE_API_BASE or default

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

  const stored = localStorage.getItem(LS_API_BASE) || "";
  return normalizeBase(envBase) || normalizeBase(stored) || DEFAULT_API_BASE;
}

export function setApiBase(base) {
  localStorage.setItem(LS_API_BASE, normalizeBase(base));
}

export function clearApiBase() {
  localStorage.removeItem(LS_API_BASE);
}

export function getAdminKey() {
  return (localStorage.getItem(LS_ADMIN_KEY) || "").trim();
}

export function setAdminKey(key) {
  localStorage.setItem(LS_ADMIN_KEY, String(key || "").trim());
}

export function clearAdminKey() {
  localStorage.removeItem(LS_ADMIN_KEY);
}

/* -----------------------------
   URL helpers
----------------------------- */

function buildUrl(path) {
  const base = getApiBase();
  const p = String(path || "");
  if (!p.startsWith("/")) return `${base}/${p}`;
  return `${base}${p}`;
}

function asCanonicalApiPath(path) {
  const p = String(path || "");
  if (!p.startsWith("/")) return `/api/${p}`;
  if (p === "/") return "/api";
  if (p.startsWith("/api/") || p === "/api") return p;

  // Allow health at root too, but canonicalize to /health (your backend may expose /health)
  // For everything else, canonical is /api/*
  if (p === "/health") return "/health";

  return `/api${p}`;
}

function asLegacyPathFromCanonical(canonicalPath) {
  // Convert /api/admin/comments -> /admin/comments
  const p = String(canonicalPath || "");
  if (p === "/api") return "/";
  if (p.startsWith("/api/")) return p.replace(/^\/api/, "");
  return p;
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

async function parseResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return data;
}

async function requestOnce(fullUrl, { method = "GET", body, admin = false } = {}) {
  const opts = {
    method,
    headers: makeHeaders({ admin, json: body !== undefined }),
  };

  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(fullUrl, opts);
  const data = await parseResponse(res);

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * request(path)
 * - Always tries canonical /api/* first
 * - If it 404s, retries legacy path (non-/api) for backwards compatibility
 */
async function request(path, { method = "GET", body, admin = false } = {}) {
  const canonicalPath = asCanonicalApiPath(path);
  const canonicalUrl = buildUrl(canonicalPath);

  try {
    return await requestOnce(canonicalUrl, { method, body, admin });
  } catch (err) {
    // Only fallback on 404 (route not found)
    if (err?.status !== 404) throw err;

    const legacyPath = asLegacyPathFromCanonical(canonicalPath);
    const legacyUrl = buildUrl(legacyPath);

    return await requestOnce(legacyUrl, { method, body, admin });
  }
}

/* -----------------------------
   Public (canonical: /api/*)
----------------------------- */

export function getHealth() {
  // Health is commonly at /health (not /api/health). We support both via request().
  return request("/health", { method: "GET" });
}

export function listArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/artists?${qs}` : "/artists", { method: "GET" });
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

/* -----------------------------
   Comments (public)
----------------------------- */

export function createComment(payload) {
  // POST /api/comments
  return request("/comments", { method: "POST", body: payload });
}

export function listCommentsByArtist(artistId) {
  // GET /api/comments/by-artist/:artistId
  return request(`/comments/by-artist/${encodeURIComponent(artistId)}`, {
    method: "GET",
  });
}

/* -----------------------------
   Admin (canonical: /api/admin/*)
----------------------------- */

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

/* -----------------------------
   Admin Comments (canonical: /api/admin/comments/*)
----------------------------- */

export function adminListComments({ status, artistId, flagged } = {}) {
  const params = {};
  if (status) params.status = status;
  if (artistId) params.artistId = artistId;
  if (flagged !== undefined) params.flagged = String(!!flagged);

  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/admin/comments?${qs}` : "/admin/comments", {
    method: "GET",
    admin: true,
  });
}

export function adminGetComment(id) {
  return request(`/admin/comments/${encodeURIComponent(id)}`, {
    method: "GET",
    admin: true,
  });
}

export function adminPatchComment(id, patch) {
  // PATCH /api/admin/comments/:id
  return request(`/admin/comments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    admin: true,
    body: patch,
  });
}

export function adminDeleteComment(id) {
  // DELETE /api/admin/comments/:id
  return request(`/admin/comments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    admin: true,
  });
}

export function adminFlagComment(id, { code = "flag", reason = "" } = {}) {
  // POST /api/admin/comments/:id/flag
  return request(`/admin/comments/${encodeURIComponent(id)}/flag`, {
    method: "POST",
    admin: true,
    body: { code, reason },
  });
}

export function adminClearFlags(id) {
  // POST /api/admin/comments/:id/flags/clear
  return request(`/admin/comments/${encodeURIComponent(id)}/flags/clear`, {
    method: "POST",
    admin: true,
  });
}

export function adminResetComments() {
  // POST /api/admin/comments/reset
  return request("/admin/comments/reset", { method: "POST", admin: true });
}

export function adminSeedComments() {
  // POST /api/admin/comments/seed
  return request("/admin/comments/seed", { method: "POST", admin: true });
}