// src/services/api.js
// iBand Frontend API Client (LOCKED / single source of truth)
// - Works with Render backend mounted at /api/*
// - Keeps backwards-compatible exports for App.jsx + Artists.jsx + Submit.jsx + ArtistDetail.jsx + Admin UI
// - Auto-corrects common base URL mistakes (including "onrenderder")
// - Includes admin key header support (x-admin-key) stored locally
// - Adds safe fallbacks for minor backend route variations (reduces fix-loops)

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function stripTrailingSlash(s) {
  return safeText(s).trim().replace(/\/+$/, "");
}

function normalizeBase(raw) {
  let s = stripTrailingSlash(raw);

  // If someone pastes only domain without protocol, fix it
  if (s && !s.startsWith("http://") && !s.startsWith("https://")) {
    s = `https://${s}`;
  }

  // Auto-fix the common typo forever
  // onrenderder.com -> onrender.com
  s = s.replace("onrenderder.com", "onrender.com");

  return s;
}

// Default backend (Render)
const DEFAULT_API_BASE = normalizeBase(
  "https://iband-backend-first-1.onrender.com"
);

function getEnvApiBase() {
  // Vite: import.meta.env.VITE_API_BASE
  let envBase = "";
  try {
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE
    ) {
      envBase = import.meta.env.VITE_API_BASE;
    }
  } catch {
    // ignore
  }

  // Optional runtime override in browser:
  // window.__IBAND_API_BASE__ = "https://...."
  let runtimeBase = "";
  try {
    if (typeof window !== "undefined" && window.__IBAND_API_BASE__) {
      runtimeBase = window.__IBAND_API_BASE__;
    }
  } catch {
    // ignore
  }

  return normalizeBase(envBase) || normalizeBase(runtimeBase) || DEFAULT_API_BASE;
}

/**
 * Public constant used by UI components
 */
export const API_BASE = getEnvApiBase();

/**
 * Required by App.jsx (and useful everywhere)
 */
export function getApiBase() {
  return API_BASE;
}

/* -----------------------------
   Admin Key Storage
----------------------------- */

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

function adminHeaders(extra = {}) {
  const key = getAdminKey();
  return {
    ...(key ? { "x-admin-key": key } : {}),
    ...extra,
  };
}

/* -----------------------------
   Low-level Request Helpers
----------------------------- */

async function requestJson(method, path, { body, headers, timeoutMs } = {}) {
  const p = safeText(path);
  const url = `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), Number(timeoutMs || 15000))
    : null;

  const finalHeaders = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers || {}),
  };

  try {
    const res = await fetch(url, {
      method,
      headers: finalHeaders,
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
    if (timer) clearTimeout(timer);
  }
}

// Try multiple endpoints (only continues for 404/405)
async function tryMany(method, paths, options = {}) {
  let lastErr = null;

  for (const p of paths) {
    try {
      return await requestJson(method, p, options);
    } catch (e) {
      lastErr = e;
      const status = Number(e?.status || 0);
      if (![404, 405].includes(status)) throw e;
    }
  }

  throw lastErr || new Error("Request failed");
}

/* -----------------------------
   PUBLIC (Used across the app)
----------------------------- */

export async function getHealth() {
  // server.js supports "/health" and "/"
  return await tryMany("GET", ["/health", "/"], { timeoutMs: 15000 });
}

export async function listArtists(params = {}) {
  const q = new URLSearchParams();

  if (params?.query) q.set("q", safeText(params.query));
  if (params?.search) q.set("q", safeText(params.search));
  if (params?.status) q.set("status", safeText(params.status));
  if (params?.page) q.set("page", safeText(params.page));
  if (params?.limit) q.set("limit", safeText(params.limit));

  const suffix = q.toString() ? `?${q.toString()}` : "";

  // Backend canonical: GET /api/artists?status=active
  return await tryMany("GET", [
    `/api/artists${suffix}`,
    `/api/artists/list${suffix}`,
    `/api/artists/active${suffix}`,
  ]);
}

export async function getArtist(id) {
  const aid = encodeURIComponent(safeText(id));
  // Backend canonical: GET /api/artists/:id
  return await tryMany("GET", [`/api/artists/${aid}`, `/api/artists?id=${aid}`]);
}

export async function submitArtist(payload) {
  // Backend canonical: POST /api/artists
  return await tryMany("POST", ["/api/artists", "/api/artists/submit", "/api/submit"], {
    body: payload,
  });
}

export async function voteArtist(artistId, amount = 1) {
  const aid = encodeURIComponent(safeText(artistId));

  // Backend canonical (in your project): votes router mounted at /api/votes
  // Most common patterns supported:
  // - POST /api/votes/:artistId { amount }
  // - POST /api/votes { artistId, amount }
  // - POST /api/artists/:id/votes { amount } (fallback)
  const bodyA = { amount: Number(amount) || 1 };
  const bodyB = { artistId: safeText(artistId), amount: Number(amount) || 1 };

  return await tryMany(
    "POST",
    [`/api/votes/${aid}`, "/api/votes", `/api/artists/${aid}/votes`],
    {
      body: undefined,
      // We'll try both body shapes by wrapping in a single attempt order
    }
  ).catch(async (e) => {
    const status = Number(e?.status || 0);
    if (![404, 405].includes(status)) throw e;

    // Retry with explicit bodies
    try {
      return await requestJson("POST", `/api/votes/${aid}`, { body: bodyA });
    } catch (e2) {
      const s2 = Number(e2?.status || 0);
      if (![404, 405].includes(s2)) throw e2;
      return await requestJson("POST", "/api/votes", { body: bodyB });
    }
  });
}

export async function listComments(artistId, params = {}) {
  const q = new URLSearchParams();
  q.set("artistId", safeText(artistId));
  if (params?.page) q.set("page", safeText(params.page));
  if (params?.limit) q.set("limit", safeText(params.limit));

  // Backend canonical: GET /api/comments?artistId=...
  return await tryMany("GET", [
    `/api/comments?${q.toString()}`,
    `/api/comments/${encodeURIComponent(safeText(artistId))}?${q.toString()}`,
  ]);
}

export async function addComment(payload) {
  // Backend canonical: POST /api/comments
  return await requestJson("POST", "/api/comments", { body: payload });
}

/* -----------------------------
   ADMIN (Used by Admin UI)
----------------------------- */

export async function adminStats() {
  // admin root: GET /api/admin
  return await tryMany("GET", ["/api/admin", "/api/admin/health", "/api/admin/stats"], {
    headers: adminHeaders(),
  });
}

export async function adminListArtists(params = {}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", safeText(params.status));
  if (params?.q) q.set("q", safeText(params.q));
  if (params?.query) q.set("q", safeText(params.query));
  if (params?.page) q.set("page", safeText(params.page));
  if (params?.limit) q.set("limit", safeText(params.limit));

  return await requestJson("GET", `/api/admin/artists?${q.toString()}`, {
    headers: adminHeaders(),
  });
}

export async function adminApproveArtist(artistId, moderationNote = "") {
  const aid = encodeURIComponent(safeText(artistId));
  const body = { status: "active", moderationNote: safeText(moderationNote) };

  // Support PATCH and POST approve flows
  return await tryMany(
    "PATCH",
    [`/api/admin/artists/${aid}`, `/api/admin/artists/${aid}/approve`],
    { body, headers: adminHeaders() }
  ).catch(async (e) => {
    const status = Number(e?.status || 0);
    if (![404, 405].includes(status)) throw e;

    return await requestJson("POST", `/api/admin/artists/${aid}/approve`, {
      body,
      headers: adminHeaders(),
    });
  });
}

export async function adminRejectArtist(artistId, moderationNote = "") {
  const aid = encodeURIComponent(safeText(artistId));
  const body = { status: "rejected", moderationNote: safeText(moderationNote) };

  return await tryMany(
    "PATCH",
    [`/api/admin/artists/${aid}`, `/api/admin/artists/${aid}/reject`],
    { body, headers: adminHeaders() }
  ).catch(async (e) => {
    const status = Number(e?.status || 0);
    if (![404, 405].includes(status)) throw e;

    return await requestJson("POST", `/api/admin/artists/${aid}/reject`, {
      body,
      headers: adminHeaders(),
    });
  });
}

export async function adminListComments(params = {}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", safeText(params.status));
  if (params?.artistId) q.set("artistId", safeText(params.artistId));
  if (params?.flagged !== undefined) q.set("flagged", String(!!params.flagged));
  if (params?.page) q.set("page", safeText(params.page));
  if (params?.limit) q.set("limit", safeText(params.limit));

  return await requestJson("GET", `/api/admin/comments?${q.toString()}`, {
    headers: adminHeaders(),
  });
}

export async function adminPatchComment(commentId, patch = {}) {
  const cid = encodeURIComponent(safeText(commentId));
  return await requestJson("PATCH", `/api/admin/comments/${cid}`, {
    body: patch,
    headers: adminHeaders(),
  });
}

export async function adminDeleteComment(commentId) {
  const cid = encodeURIComponent(safeText(commentId));
  return await requestJson("DELETE", `/api/admin/comments/${cid}`, {
    headers: adminHeaders(),
  });
}

export async function adminFlagComment(commentId, code = "flag", reason = "") {
  const cid = encodeURIComponent(safeText(commentId));
  return await requestJson("POST", `/api/admin/comments/${cid}/flag`, {
    body: { code: safeText(code) || "flag", reason: safeText(reason) },
    headers: adminHeaders(),
  });
}

export async function adminClearCommentFlags(commentId) {
  const cid = encodeURIComponent(safeText(commentId));
  return await requestJson("POST", `/api/admin/comments/${cid}/flags/clear`, {
    headers: adminHeaders(),
  });
}

export async function adminBulkCommentStatus(ids = [], status = "hidden", moderatedBy = "", moderationNote = "") {
  return await requestJson("POST", "/api/admin/comments/bulk/status", {
    body: {
      ids,
      status,
      moderatedBy: safeText(moderatedBy),
      moderationNote: safeText(moderationNote),
    },
    headers: adminHeaders(),
  });
}

export async function adminBulkDeleteComments(ids = []) {
  return await requestJson("POST", "/api/admin/comments/bulk/delete", {
    body: { ids },
    headers: adminHeaders(),
  });
}

/* -----------------------------
   Object-style client (used by components)
----------------------------- */

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
  adminStats,
  adminListArtists,
  adminApproveArtist,
  adminRejectArtist,

  adminListComments,
  adminPatchComment,
  adminDeleteComment,
  adminFlagComment,
  adminClearCommentFlags,
  adminBulkCommentStatus,
  adminBulkDeleteComments,
};