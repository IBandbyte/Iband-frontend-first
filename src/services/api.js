// src/services/api.js
// iBand Frontend API Client (single source of truth)
// - Hardens API base resolution (fixes "onrenderder" typo even if env is wrong)
// - Works with Render backend mounted at /api/*
// - Keeps backwards-compatible exports for App.jsx + ArtistDetail.jsx + Artists.jsx + Submit.jsx + Admin
// - Adds safe fallbacks for route variations
// - Includes admin key header support (x-admin-key) stored locally

const FALLBACK_RENDER_BASE = "https://iband-backend-first-1.onrender.com";

// ✅ We keep your legacy default but harden it anyway
const DEFAULT_API_BASE = "https://iband-backend-first-1.onrenderder.com";

// -------------------- small helpers --------------------
function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function stripTrailingSlash(s) {
  return safeText(s).replace(/\/+$/, "");
}

function ensureHttps(url) {
  const u = safeText(url).trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  // If user accidentally sets "iband-backend-first-1.onrender.com"
  return `https://${u}`;
}

function normalizeApiBase(input) {
  // 1) Trim
  let base = safeText(input).trim();

  // 2) If empty -> return empty (caller will fallback)
  if (!base) return "";

  // 3) Fix common typo no matter where it appears
  base = base.replaceAll("onrenderder.com", "onrender.com");
  base = base.replaceAll("onrenderder", "onrender");

  // 4) Ensure protocol + remove trailing slashes
  base = stripTrailingSlash(ensureHttps(base));

  // 5) Basic sanity: must look like http(s)://something.something
  const ok = /^https?:\/\/[^/\s]+\.[^/\s]+/i.test(base);
  if (!ok) return "";

  return base;
}

function pickApiBase() {
  // Priority:
  // 1) Vite env VITE_API_BASE
  // 2) runtime override window.__IBAND_API_BASE__
  // 3) hard fallback Render base

  let candidate = "";

  // Vite: import.meta.env.VITE_API_BASE
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) {
      candidate = import.meta.env.VITE_API_BASE;
    }
  } catch {
    // ignore
  }

  // optional runtime override
  if (!candidate) {
    try {
      if (typeof window !== "undefined" && window.__IBAND_API_BASE__) {
        candidate = window.__IBAND_API_BASE__;
      }
    } catch {
      // ignore
    }
  }

  // normalize env candidate
  const normalizedCandidate = normalizeApiBase(candidate);

  // normalize DEFAULT + FALLBACK too
  const normalizedDefault = normalizeApiBase(DEFAULT_API_BASE);
  const normalizedFallback = normalizeApiBase(FALLBACK_RENDER_BASE);

  // If env candidate is valid, use it
  if (normalizedCandidate) return normalizedCandidate;

  // Otherwise use default (even if typo, normalizeApiBase fixes it)
  if (normalizedDefault) return normalizedDefault;

  // Absolute last resort
  return normalizedFallback;
}

/**
 * Public constant used by UI
 */
export const API_BASE = pickApiBase();

/**
 * Required by App.jsx
 */
export function getApiBase() {
  return API_BASE;
}

// -------------------- Admin key helpers --------------------
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

// -------------------- Low-level request helper --------------------
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

// Try multiple endpoints (prevents “guessing”, reduces back-and-forth)
async function tryMany(method, paths, options = {}) {
  let lastErr = null;
  for (const p of paths) {
    try {
      return await requestJson(method, p, options);
    } catch (e) {
      lastErr = e;
      const status = Number(e?.status || 0);
      // Only continue on common “route mismatch” errors
      if (![404, 405].includes(status)) throw e;
    }
  }
  throw lastErr || new Error("Request failed");
}

// -------------------- Public API functions required by frontend --------------------
export async function getHealth() {
  // server supports "/" and "/health"
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

  return await tryMany("GET", [
    `/api/artists${suffix}`,
    `/api/artists/active${suffix}`,
    `/api/artists/list${suffix}`,
  ]);
}

export async function getArtist(id) {
  const aid = encodeURIComponent(safeText(id));
  return await tryMany("GET", [`/api/artists/${aid}`, `/api/artists?id=${aid}`]);
}

export async function submitArtist(payload) {
  return await tryMany("POST", ["/api/artists/submit", "/api/submit", "/api/artists"], { body: payload });
}

export async function voteArtist(artistId, amount = 1) {
  const aid = encodeURIComponent(safeText(artistId));
  const body = { artistId: safeText(artistId), amount: Number(amount) || 1 };

  return await tryMany("POST", [`/api/votes/${aid}`, "/api/votes", `/api/artists/${aid}/vote`], { body });
}

export async function listComments(artistId, params = {}) {
  const aid = encodeURIComponent(safeText(artistId));
  const q = new URLSearchParams();
  q.set("artistId", safeText(artistId));
  if (params?.page) q.set("page", safeText(params.page));
  if (params?.limit) q.set("limit", safeText(params.limit));

  return await tryMany("GET", [`/api/comments?${q.toString()}`, `/api/comments/${aid}?${q.toString()}`]);
}

export async function addComment(payload) {
  return await tryMany("POST", ["/api/comments"], { body: payload });
}

// -------------------- Admin API --------------------
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
  return await requestJson("GET", `/api/admin/artists?${q.toString()}`, {
    headers: adminHeaders(),
  });
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

  return await requestJson("GET", `/api/admin/comments?${q.toString()}`, {
    headers: adminHeaders(),
  });
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

export async function adminApproveArtist(artistId, moderationNote = "") {
  const aid = encodeURIComponent(safeText(artistId));
  const body = { status: "active", moderationNote: safeText(moderationNote) };

  return await tryMany(
    "PATCH",
    [`/api/admin/artists/${aid}`, `/api/admin/artists/${aid}/approve`],
    { body, headers: adminHeaders() }
  ).catch(async (e) => {
    if (Number(e?.status) === 405 || Number(e?.status) === 404) {
      return await tryMany("POST", [`/api/admin/artists/${aid}/approve`], {
        body,
        headers: adminHeaders(),
      });
    }
    throw e;
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
    if (Number(e?.status) === 405 || Number(e?.status) === 404) {
      return await tryMany("POST", [`/api/admin/artists/${aid}/reject`], {
        body,
        headers: adminHeaders(),
      });
    }
    throw e;
  });
}

// Object-style client used by components
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