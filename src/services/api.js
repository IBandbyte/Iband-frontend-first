// src/services/api.js
// iBand Frontend API Client (SINGLE SOURCE OF TRUTH)
// - Matches backend routes mounted in server.js:
//   /api/artists, /api/votes, /api/comments, /api/admin/*
// - Keeps stable exports used across App/Artists/Submit/ArtistDetail/Admin
// - Supports localStorage overrides for API base + admin key
// - Always throws clean Error(message) on non-2xx

const LS_API_BASE = "iband_api_base";
const LS_ADMIN_KEY = "iband_admin_key";

// Render backend (default)
const DEFAULT_API_BASE = "https://iband-backend-first-1.onrender.com";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function normalizeBase(u) {
  const s = safeText(u).trim();
  if (!s) return "";
  return s.replace(/\/+$/, "");
}

export function getApiBase() {
  // Vite env override
  let envBase = "";
  try {
    envBase =
      (typeof import.meta !== "undefined" &&
        import.meta.env &&
        import.meta.env.VITE_API_BASE) ||
      "";
  } catch {
    envBase = "";
  }

  // localStorage override
  let stored = "";
  try {
    stored = localStorage.getItem(LS_API_BASE) || "";
  } catch {
    stored = "";
  }

  return normalizeBase(envBase) || normalizeBase(stored) || DEFAULT_API_BASE;
}

export function setApiBase(base) {
  try {
    localStorage.setItem(LS_API_BASE, normalizeBase(base));
    return true;
  } catch {
    return false;
  }
}

export function clearApiBase() {
  try {
    localStorage.removeItem(LS_API_BASE);
    return true;
  } catch {
    return false;
  }
}

// Constant for UI display (note: getApiBase() is the runtime truth)
export const API_BASE = getApiBase();

/* -----------------------
   Admin key helpers
------------------------ */
export function getAdminKey() {
  try {
    return safeText(localStorage.getItem(LS_ADMIN_KEY)).trim();
  } catch {
    return "";
  }
}

export function setAdminKey(key) {
  try {
    const v = safeText(key).trim();
    if (!v) return false;
    localStorage.setItem(LS_ADMIN_KEY, v);
    return true;
  } catch {
    return false;
  }
}

export function clearAdminKey() {
  try {
    localStorage.removeItem(LS_ADMIN_KEY);
    return true;
  } catch {
    return false;
  }
}

/* -----------------------
   Core request layer
------------------------ */
function buildUrl(path) {
  const base = getApiBase();
  const p = safeText(path);
  if (!p.startsWith("/")) return `${base}/${p}`;
  return `${base}${p}`;
}

function makeHeaders({ json = true, admin = false, extra = {} } = {}) {
  const h = {
    Accept: "application/json",
    ...extra,
  };

  if (json) h["Content-Type"] = "application/json";

  if (admin) {
    const k = getAdminKey();
    if (k) h["x-admin-key"] = k;
  }

  return h;
}

async function request(path, { method = "GET", body, admin = false, timeoutMs = 15000 } = {}) {
  const url = buildUrl(path);

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(url, {
      method,
      headers: makeHeaders({ json: body !== undefined, admin }),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller ? controller.signal : undefined,
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

    return data;
  } finally {
    if (t) clearTimeout(t);
  }
}

async function tryMany(method, paths, options = {}) {
  let lastErr = null;

  for (const p of paths) {
    try {
      return await request(p, { ...options, method });
    } catch (e) {
      lastErr = e;
      const status = Number(e?.status || 0);

      // Only continue on common route mismatch cases
      if (![404, 405].includes(status)) throw e;
    }
  }

  throw lastErr || new Error("Request failed");
}

/* -----------------------
   PUBLIC API (frontend)
------------------------ */

// Required by App.jsx
export function getHealth() {
  // backend supports /health and /
  return tryMany("GET", ["/health", "/"], { timeoutMs: 15000 });
}

// Artists list (public)
export function listArtists(params = {}) {
  const q = new URLSearchParams();

  const query = safeText(params.query || params.search || params.q).trim();
  const status = safeText(params.status).trim();
  const page = safeText(params.page).trim();
  const limit = safeText(params.limit).trim();

  if (query) q.set("q", query);
  if (status) q.set("status", status);
  if (page) q.set("page", page);
  if (limit) q.set("limit", limit);

  const suffix = q.toString() ? `?${q.toString()}` : "";

  return tryMany("GET", [`/api/artists${suffix}`], { timeoutMs: 15000 });
}

// Single artist
export function getArtist(id) {
  const aid = encodeURIComponent(safeText(id));
  return tryMany("GET", [`/api/artists/${aid}`], { timeoutMs: 15000 });
}

// Submit artist (public)
export function submitArtist(payload) {
  return tryMany("POST", ["/api/artists"], { body: payload, timeoutMs: 15000 });
}

// Vote artist (public)
export function voteArtist(artistId, amount = 1) {
  const aid = encodeURIComponent(safeText(artistId));
  const body = { artistId: safeText(artistId), amount: Number(amount) || 1 };

  // Support common vote route variations (keeps frontend resilient)
  return tryMany(
    "POST",
    [
      `/api/votes/${aid}`,     // common
      "/api/votes",            // body-driven
      `/api/artists/${aid}/votes`, // alternative
      `/api/artists/${aid}/vote`,  // alternative
    ],
    { body, timeoutMs: 15000 }
  );
}

// List public comments for an artist (backend may filter approved)
export function listComments(artistId, params = {}) {
  const q = new URLSearchParams();
  const aid = safeText(artistId);

  q.set("artistId", aid);

  const page = safeText(params.page).trim();
  const limit = safeText(params.limit).trim();
  if (page) q.set("page", page);
  if (limit) q.set("limit", limit);

  return tryMany("GET", [`/api/comments?${q.toString()}`], { timeoutMs: 15000 });
}

// Add comment (public) — backend expects: { artistId, author, text }
export function addComment(payload) {
  return tryMany("POST", ["/api/comments"], { body: payload, timeoutMs: 15000 });
}

/* -----------------------
   ADMIN API (frontend)
------------------------ */

export function adminListArtists(params = {}) {
  const q = new URLSearchParams();

  const status = safeText(params.status || "pending").trim();
  const page = safeText(params.page).trim();
  const limit = safeText(params.limit).trim();

  if (status) q.set("status", status);
  if (page) q.set("page", page);
  if (limit) q.set("limit", limit);

  return request(`/api/admin/artists?${q.toString()}`, {
    method: "GET",
    admin: true,
    timeoutMs: 15000,
  });
}

// App.jsx expects this to exist (even if backend doesn't implement stats yet)
export function adminStats() {
  // Prefer /api/admin (always exists) and allow /api/admin/stats if you add it later
  return tryMany("GET", ["/api/admin/stats", "/api/admin"], {
    admin: true,
    timeoutMs: 15000,
  });
}

export function adminApproveArtist(artistId, moderationNote = "") {
  const aid = encodeURIComponent(safeText(artistId));

  // Future-proof: support both PATCH and POST style approvals
  return tryMany(
    "POST",
    [`/api/admin/artists/${aid}/approve`],
    { admin: true, body: { moderationNote: safeText(moderationNote) }, timeoutMs: 15000 }
  ).catch((e) => {
    const status = Number(e?.status || 0);
    if ([404, 405].includes(status)) {
      return request(`/api/admin/artists/${aid}`, {
        method: "PATCH",
        admin: true,
        timeoutMs: 15000,
        body: { status: "active", moderationNote: safeText(moderationNote) },
      });
    }
    throw e;
  });
}

export function adminRejectArtist(artistId, moderationNote = "") {
  const aid = encodeURIComponent(safeText(artistId));

  return tryMany(
    "POST",
    [`/api/admin/artists/${aid}/reject`],
    { admin: true, body: { moderationNote: safeText(moderationNote) }, timeoutMs: 15000 }
  ).catch((e) => {
    const status = Number(e?.status || 0);
    if ([404, 405].includes(status)) {
      return request(`/api/admin/artists/${aid}`, {
        method: "PATCH",
        admin: true,
        timeoutMs: 15000,
        body: { status: "rejected", moderationNote: safeText(moderationNote) },
      });
    }
    throw e;
  });
}

export function adminListComments(params = {}) {
  const q = new URLSearchParams();

  const status = safeText(params.status || "pending").trim();
  const artistId = safeText(params.artistId).trim();
  const flagged = params.flagged === true ? "true" : "";

  if (status) q.set("status", status);
  if (artistId) q.set("artistId", artistId);
  if (flagged) q.set("flagged", flagged);

  return request(`/api/admin/comments?${q.toString()}`, {
    method: "GET",
    admin: true,
    timeoutMs: 15000,
  });
}

export function adminPatchComment(id, patch = {}) {
  const cid = encodeURIComponent(safeText(id));
  return request(`/api/admin/comments/${cid}`, {
    method: "PATCH",
    admin: true,
    timeoutMs: 15000,
    body: patch,
  });
}

export function adminDeleteComment(id) {
  const cid = encodeURIComponent(safeText(id));
  return request(`/api/admin/comments/${cid}`, {
    method: "DELETE",
    admin: true,
    timeoutMs: 15000,
  });
}

export function adminFlagComment(id, { code = "flag", reason = "" } = {}) {
  const cid = encodeURIComponent(safeText(id));
  return request(`/api/admin/comments/${cid}/flag`, {
    method: "POST",
    admin: true,
    timeoutMs: 15000,
    body: { code, reason },
  });
}

export function adminClearFlags(id) {
  const cid = encodeURIComponent(safeText(id));
  return request(`/api/admin/comments/${cid}/flags/clear`, {
    method: "POST",
    admin: true,
    timeoutMs: 15000,
  });
}

/* -----------------------
   Object-style client (used across components)
------------------------ */
export const api = {
  // config
  getApiBase,
  setApiBase,
  clearApiBase,

  // health
  getHealth,

  // artists
  listArtists,
  getArtist,
  submitArtist,
  voteArtist,

  // comments
  listComments,
  addComment,

  // admin
  getAdminKey,
  setAdminKey,
  clearAdminKey,
  adminListArtists,
  adminStats,
  adminApproveArtist,
  adminRejectArtist,
  adminListComments,
  adminPatchComment,
  adminDeleteComment,
  adminFlagComment,
  adminClearFlags,
};