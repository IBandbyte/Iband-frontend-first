// src/services/api.js
// iBand Frontend API Client (ESM)
// - Works on Vercel
// - Supports admin header x-admin-key via localStorage
// - Uses VITE_API_BASE if set, otherwise stored API base, otherwise Render default
//
// Canonical backend routes use /api/*
// This client also includes a safe fallback: if /api/* returns 404,
// it retries once without the /api prefix (legacy compatibility).

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

function buildUrl(path) {
  const base = getApiBase();
  const p = String(path || "");
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

async function requestOnce(
  path,
  { method = "GET", body, admin = false } = {}
) {
  const url = buildUrl(path);

  const opts = {
    method,
    headers: makeHeaders({ admin, json: body !== undefined }),
  };

  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);

  // Try parse JSON, but don't crash if backend returns plain text
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { res, data };
}

// Canonical: /api/*
// Safe fallback: if 404, retry once without /api prefix (legacy compatibility)
async function request(path, { method = "GET", body, admin = false } = {}) {
  const first = await requestOnce(path, { method, body, admin });

  if (first.res.ok) return first.data;

  // fallback only if 404 and path starts with /api/
  if (first.res.status === 404 && String(path).startsWith("/api/")) {
    const legacyPath = String(path).replace(/^\/api\//, "/");
    const second = await requestOnce(legacyPath, { method, body, admin });
    if (second.res.ok) return second.data;

    const msg =
      second.data?.message ||
      second.data?.error ||
      `Request failed (${second.res.status})`;
    throw new Error(msg);
  }

  const msg =
    first.data?.message ||
    first.data?.error ||
    `Request failed (${first.res.status})`;
  throw new Error(msg);
}

/* -----------------------------
   Public (canonical /api/*)
----------------------------- */

export function getHealth() {
  // health might be /health or /api/health depending on backend;
  // use canonical first + fallback.
  return request("/api/health", { method: "GET" });
}

export function listArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/api/artists?${qs}` : "/api/artists", { method: "GET" });
}

export function submitArtist(payload) {
  return request("/api/artists", { method: "POST", body: payload });
}

export function voteArtist(id, amount = 1) {
  return request(`/api/artists/${encodeURIComponent(id)}/votes`, {
    method: "POST",
    body: { amount },
  });
}

/* -----------------------------
   Comments (public)
----------------------------- */

export function listCommentsByArtist(artistId) {
  return request(`/api/comments/by-artist/${encodeURIComponent(artistId)}`, {
    method: "GET",
  });
}

export function createComment(payload) {
  return request("/api/comments", { method: "POST", body: payload });
}

/* -----------------------------
   Admin (canonical /api/admin/*)
----------------------------- */

export function adminListArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/api/admin/artists?${qs}` : "/api/admin/artists", {
    method: "GET",
    admin: true,
  });
}

export function adminStats() {
  return request("/api/admin/stats", { method: "GET", admin: true });
}

export function adminApproveArtist(id) {
  return request(`/api/admin/artists/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    admin: true,
  });
}

export function adminRejectArtist(id) {
  return request(`/api/admin/artists/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    admin: true,
  });
}

/* -----------------------------
   Admin Comments (canonical /api/admin/comments/*)
----------------------------- */

export function adminListComments(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/api/admin/comments?${qs}` : "/api/admin/comments", {
    method: "GET",
    admin: true,
  });
}

export function adminGetComment(id) {
  return request(`/api/admin/comments/${encodeURIComponent(id)}`, {
    method: "GET",
    admin: true,
  });
}

export function adminPatchComment(id, payload) {
  return request(`/api/admin/comments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    admin: true,
    body: payload,
  });
}

export function adminDeleteComment(id) {
  return request(`/api/admin/comments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    admin: true,
  });
}

export function adminFlagComment(id, { code = "flag", reason = "" } = {}) {
  return request(`/api/admin/comments/${encodeURIComponent(id)}/flag`, {
    method: "POST",
    admin: true,
    body: { code, reason },
  });
}

export function adminClearCommentFlags(id) {
  return request(`/api/admin/comments/${encodeURIComponent(id)}/flags/clear`, {
    method: "POST",
    admin: true,
  });
}