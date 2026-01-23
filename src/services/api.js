// src/services/api.js
// iBand Frontend API Client (ESM)
// - Works on Vercel
// - Supports admin header x-admin-key via localStorage
// - Canonical routes are /api/*
// - Legacy fallback (no /api) supported where needed

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
    (typeofn
      typeof import.meta !== "undefined" &&
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

async function request(path, { method = "GET", body, admin = false } = {}) {
  const url = buildUrl(path);

  const opts = {
    method,
    headers: makeHeaders({ admin, json: body !== undefined }),
  };

  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);

  // Parse safely
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

// Try canonical /api route first, then fallback to legacy route if needed.
async function requestWithFallback(
  canonicalPath,
  legacyPath,
  { method = "GET", body, admin = false } = {}
) {
  try {
    return await request(canonicalPath, { method, body, admin });
  } catch (err) {
    // If canonical is missing, try legacy.
    // We only fallback on typical "not found" style messages.
    const msg = String(err?.message || "");
    const shouldFallback =
      msg.toLowerCase().includes("not found") ||
      msg.toLowerCase().includes("cannot") ||
      msg.toLowerCase().includes("route");

    if (!legacyPath || !shouldFallback) throw err;
    return request(legacyPath, { method, body, admin });
  }
}

/* -----------------------------
   Public (canonical /api)
----------------------------- */

export function getHealth() {
  return requestWithFallback("/api/health", "/health", { method: "GET" });
}

export function listArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const canon = qs ? `/api/artists?${qs}` : "/api/artists";
  const legacy = qs ? `/artists?${qs}` : "/artists";
  return requestWithFallback(canon, legacy, { method: "GET" });
}

export function submitArtist(payload) {
  return requestWithFallback("/api/artists", "/artists", {
    method: "POST",
    body: payload,
  });
}

export function voteArtist(id, amount = 1) {
  const safeId = encodeURIComponent(id);
  return requestWithFallback(`/api/artists/${safeId}/votes`, `/artists/${safeId}/votes`, {
    method: "POST",
    body: { amount },
  });
}

/* -----------------------------
   Comments (public)
----------------------------- */

export function createComment(payload) {
  return requestWithFallback("/api/comments", "/comments", {
    method: "POST",
    body: payload,
  });
}

export function getCommentsByArtist(artistId) {
  const safe = encodeURIComponent(artistId);
  return requestWithFallback(`/api/comments/by-artist/${safe}`, `/comments/by-artist/${safe}`, {
    method: "GET",
  });
}

/* -----------------------------
   Admin (canonical /api/admin)
----------------------------- */

export function adminListArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const canon = qs ? `/api/admin/artists?${qs}` : "/api/admin/artists";
  const legacy = qs ? `/admin/artists?${qs}` : "/admin/artists";
  return requestWithFallback(canon, legacy, { method: "GET", admin: true });
}

export function adminStats() {
  return requestWithFallback("/api/admin/stats", "/admin/stats", {
    method: "GET",
    admin: true,
  });
}

export function adminApproveArtist(id) {
  const safeId = encodeURIComponent(id);
  return requestWithFallback(`/api/admin/artists/${safeId}/approve`, `/admin/artists/${safeId}/approve`, {
    method: "POST",
    admin: true,
  });
}

export function adminRejectArtist(id) {
  const safeId = encodeURIComponent(id);
  return requestWithFallback(`/api/admin/artists/${safeId}/reject`, `/admin/artists/${safeId}/reject`, {
    method: "POST",
    admin: true,
  });
}

/* -----------------------------
   Admin Comments (canonical /api/admin/comments)
----------------------------- */

export function adminListComments(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const canon = qs ? `/api/admin/comments?${qs}` : "/api/admin/comments";
  const legacy = qs ? `/admin/comments?${qs}` : "/admin/comments";
  return requestWithFallback(canon, legacy, { method: "GET", admin: true });
}

export function adminGetComment(id) {
  const safeId = encodeURIComponent(id);
  return requestWithFallback(`/api/admin/comments/${safeId}`, `/admin/comments/${safeId}`, {
    method: "GET",
    admin: true,
  });
}

export function adminPatchComment(id, patch) {
  const safeId = encodeURIComponent(id);
  return requestWithFallback(`/api/admin/comments/${safeId}`, `/admin/comments/${safeId}`, {
    method: "PATCH",
    admin: true,
    body: patch,
  });
}

export function adminDeleteComment(id) {
  const safeId = encodeURIComponent(id);
  return requestWithFallback(`/api/admin/comments/${safeId}`, `/admin/comments/${safeId}`, {
    method: "DELETE",
    admin: true,
  });
}

export function adminFlagComment(id, payload) {
  const safeId = encodeURIComponent(id);
  return requestWithFallback(`/api/admin/comments/${safeId}/flag`, `/admin/comments/${safeId}/flag`, {
    method: "POST",
    admin: true,
    body: payload,
  });
}

export function adminClearFlags(id) {
  const safeId = encodeURIComponent(id);
  return requestWithFallback(`/api/admin/comments/${safeId}/flags/clear`, `/admin/comments/${safeId}/flags/clear`, {
    method: "POST",
    admin: true,
  });
}