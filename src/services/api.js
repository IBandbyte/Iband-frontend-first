// src/services/api.js
// iBand Frontend API Client (single source of truth)
// - Works with Render backend mounted at /api/*
// - Auto-corrects common base URL mistakes (e.g. "onrenderder" typo)
// - Normalizes responses so UI never “guesses” shapes again
// - Keeps backwards-compatible exports for App.jsx + Artists.jsx + Submit.jsx + ArtistDetail.jsx + Admin UI
// - Includes admin key header support (x-admin-key) stored locally

const DEFAULT_API_BASE_RAW = "https://iband-backend-first-1.onrender.com";

/* ------------------------ tiny utils ------------------------ */
function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}
function stripTrailingSlash(s) {
  return safeText(s).replace(/\/+$/, "");
}
function ensureProtocol(url) {
  const u = safeText(url).trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}
function sanitizeApiBase(raw) {
  let u = ensureProtocol(raw);

  // Hard-correct the exact typo that cost us time:
  // https://iband-backend-first-1.onrenderder.com -> https://iband-backend-first-1.onrender.com
  u = u.replace(/onrenderder\.com/gi, "onrender.com");

  // Also handle accidental double dots or spaces
  u = u.replace(/\s+/g, "");
  u = u.replace(/\.{2,}/g, ".");

  return stripTrailingSlash(u);
}

/* ------------------------ API base resolution ------------------------ */
function getEnvApiBase() {
  // Vite: import.meta.env.VITE_API_BASE
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) {
      return sanitizeApiBase(import.meta.env.VITE_API_BASE);
    }
  } catch {
    // ignore
  }

  // Optional runtime override in browser:
  try {
    if (typeof window !== "undefined" && window.__IBAND_API_BASE__) {
      return sanitizeApiBase(window.__IBAND_API_BASE__);
    }
  } catch {
    // ignore
  }

  return sanitizeApiBase(DEFAULT_API_BASE_RAW);
}

/**
 * Public constant used by UI
 */
export const API_BASE = getEnvApiBase();

/**
 * Required by App.jsx
 */
export function getApiBase() {
  return API_BASE;
}

/* ------------------------ admin key helpers ------------------------ */
const ADMIN_KEY_STORAGE = "iband_admin_key";

export function setAdminKey(key) {
  try {
    const v = safeText(key).trim();
    if (!v) return false;
    localStorage.setItem(ADMIN_KEY_STORAGE, v);
    return true;
  } catch {
    return false;
  }
}

export function clearAdminKey() {
  try {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    return true;
  } catch {
    return false;
  }
}

export function getAdminKey() {
  try {
    return safeText(localStorage.getItem(ADMIN_KEY_STORAGE)).trim();
  } catch {
    return "";
  }
}

/* ------------------------ response normalization ------------------------ */
function normalizeArtistsPayload(res) {
  // Accept a few possible shapes, return ONE authoritative shape:
  // { success: true, count: number, artists: [] }
  const artists = Array.isArray(res?.artists)
    ? res.artists
    : Array.isArray(res?.data?.artists)
      ? res.data.artists
      : Array.isArray(res?.items)
        ? res.items
        : [];

  const count =
    Number(res?.count) ||
    Number(res?.total) ||
    Number(res?.data?.count) ||
    Number(artists.length) ||
    0;

  return { success: true, count, artists };
}

function normalizeArtistPayload(res) {
  // Return ONE shape:
  // { success: true, artist: {...} }
  const artist =
    res?.artist ||
    res?.data?.artist ||
    res?.data ||
    (res && typeof res === "object" && (res.id || res._id || res.name) ? res : null);

  return { success: true, artist: artist || null };
}

function normalizeCommentsPayload(res) {
  // Return ONE shape:
  // { success: true, count: number, comments: [] }
  const comments = Array.isArray(res?.comments)
    ? res.comments
    : Array.isArray(res?.data?.comments)
      ? res.data.comments
      : Array.isArray(res?.items)
        ? res.items
        : [];

  const count =
    Number(res?.count) ||
    Number(res?.total) ||
    Number(res?.data?.count) ||
    Number(comments.length) ||
    0;

  return { success: true, count, comments };
}

/* ------------------------ low-level request helper ------------------------ */
async function requestJson(method, path, { body, headers, timeoutMs } = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = controller ? setTimeout(() => controller.abort(), Number(timeoutMs || 15000)) : null;

  const finalHeaders = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(headers || {}),
  };

  try {
    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
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
      const msg = safeText(data?.message) || safeText(data?.error) || `Request failed (${res.status})`;
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

// Try multiple endpoints (reduces back-and-forth if backend route changes)
async function tryMany(method, paths, options = {}) {
  let lastErr = null;
  for (const p of paths) {
    try {
      return await requestJson(method, p, options);
    } catch (e) {
      lastErr = e;
      const status = Number(e?.status || 0);
      // continue only on common “route mismatch” errors
      if (![404, 405].includes(status)) throw e;
    }
  }
  throw lastErr || new Error("Request failed");
}

/* ------------------------ public API functions ------------------------ */

export async function getHealth() {
  // server.js supports "/" and "/health"
  return await tryMany("GET", ["/health", "/"], { timeoutMs: 15000 });
}

/**
 * ✅ SINGLE SOURCE OF TRUTH: always returns
 * { success: true, count: number, artists: [] }
 */
export async function listArtists(params = {}) {
  const q = new URLSearchParams();

  const query = safeText(params?.query || params?.search || "").trim();
  const status = safeText(params?.status || "").trim();

  if (query) q.set("q", query);
  if (status) q.set("status", status);
  if (params?.page) q.set("page", safeText(params.page));
  if (params?.limit) q.set("limit", safeText(params.limit));

  const suffix = q.toString() ? `?${q.toString()}` : "";

  const res = await tryMany("GET", [
    `/api/artists${suffix}`,
    `/api/artists/list${suffix}`,
    `/api/artists/active${suffix}`, // legacy fallback
  ]);

  return normalizeArtistsPayload(res);
}

/**
 * ✅ Always returns { success: true, artist: {...}|null }
 */
export async function getArtist(id) {
  const aid = encodeURIComponent(safeText(id));
  const res = await tryMany("GET", [`/api/artists/${aid}`, `/api/artists?id=${aid}`]);
  return normalizeArtistPayload(res);
}

export async function submitArtist(payload) {
  // Keep broad compatibility; backend may accept /api/artists or /api/artists/submit
  return await tryMany("POST", ["/api/artists/submit", "/api/submit", "/api/artists"], { body: payload });
}

export async function voteArtist(artistId, amount = 1) {
  const aid = encodeURIComponent(safeText(artistId));
  const body = { artistId: safeText(artistId), amount: Number(amount) || 1 };

  // Return whatever backend returns, but keep it stable for UI
  return await tryMany("POST", [`/api/votes/${aid}`, "/api/votes", `/api/artists/${aid}/vote`], { body });
}

/**
 * ✅ Always returns { success: true, count: number, comments: [] }
 */
export async function listComments(artistId, params = {}) {
  const aid = encodeURIComponent(safeText(artistId));
  const q = new URLSearchParams();
  q.set("artistId", safeText(artistId));
  if (params?.page) q.set("page", safeText(params.page));
  if (params?.limit) q.set("limit", safeText(params.limit));

  const res = await tryMany("GET", [`/api/comments?${q.toString()}`, `/api/comments/${aid}?${q.toString()}`]);
  return normalizeCommentsPayload(res);
}

export async function addComment(payload) {
  return await tryMany("POST", ["/api/comments"], { body: payload });
}

/* ------------------------ admin API ------------------------ */
function adminHeaders(extra = {}) {
  const key = getAdminKey();
  return {
    ...(key ? { "x-admin-key": key } : {}),
    ...extra,
  };
}

export async function adminListArtists(status = "pending") {
  const q = new URLSearchParams();
  if (status) q.set("status", safeText(status));

  const res = await requestJson("GET", `/api/admin/artists?${q.toString()}`, {
    headers: adminHeaders(),
  });

  // normalize so Admin UI is also stable
  return normalizeArtistsPayload(res);
}

export async function adminStats() {
  return await tryMany("GET", ["/api/admin/stats", "/api/admin/health", "/api/admin"], {
    headers: adminHeaders(),
  });
}

export async function adminListComments(status = "pending", params = {}) {
  const q = new URLSearchParams();
  if (status) q.set("status", safeText(status));
  if (params?.page) q.set("page", safeText(params.page));
  if (params?.limit) q.set("limit", safeText(params.limit));

  const res = await requestJson("GET", `/api/admin/comments?${q.toString()}`, {
    headers: adminHeaders(),
  });

  return normalizeCommentsPayload(res);
}

export async function adminModerateComment(commentId, action = "approve", moderationNote = "") {
  const cid = encodeURIComponent(safeText(commentId));
  const a = safeText(action).toLowerCase();

  const body = {
    action: a,
    status: a === "reject" || a === "rejected" ? "rejected" : "approved",
    moderationNote: safeText(moderationNote),
  };

  return await tryMany("PATCH", [`/api/admin/comments/${cid}`, `/api/admin/comments/${cid}/${a}`], {
    body,
    headers: adminHeaders(),
  });
}

/**
 * ✅ REQUIRED BY App.jsx:
 * Approve an artist (moves pending -> active)
 */
export async function adminApproveArtist(artistId, moderationNote = "") {
  const aid = encodeURIComponent(safeText(artistId));
  const body = { status: "active", moderationNote: safeText(moderationNote) };

  return await tryMany("PATCH", [`/api/admin/artists/${aid}`, `/api/admin/artists/${aid}/approve`], {
    body,
    headers: adminHeaders(),
  }).catch(async (e) => {
    if (Number(e?.status) === 405 || Number(e?.status) === 404) {
      return await tryMany("POST", [`/api/admin/artists/${aid}/approve`], {
        body,
        headers: adminHeaders(),
      });
    }
    throw e;
  });
}

/**
 * ✅ REQUIRED BY App.jsx:
 * Reject an artist (moves pending -> rejected)
 */
export async function adminRejectArtist(artistId, moderationNote = "") {
  const aid = encodeURIComponent(safeText(artistId));
  const body = { status: "rejected", moderationNote: safeText(moderationNote) };

  return await tryMany("PATCH", [`/api/admin/artists/${aid}`, `/api/admin/artists/${aid}/reject`], {
    body,
    headers: adminHeaders(),
  }).catch(async (e) => {
    if (Number(e?.status) === 405 || Number(e?.status) === 404) {
      return await tryMany("POST", [`/api/admin/artists/${aid}/reject`], {
        body,
        headers: adminHeaders(),
      });
    }
    throw e;
  });
}

/* ------------------------ object-style client used by components ------------------------ */
export const api = {
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
  adminListArtists,
  adminStats,
  adminListComments,
  adminModerateComment,
  adminApproveArtist,
  adminRejectArtist,
};