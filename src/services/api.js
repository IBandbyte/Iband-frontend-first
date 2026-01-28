// src/services/api.js
// iBand Frontend API Client (single source of truth)
//
// Goals:
// - Always hit the correct Render backend (even if env var has typos like "onrenderder")
// - Keep backwards-compatible exports used by App.jsx / Artists.jsx / Submit.jsx / ArtistDetail.jsx / Admin
// - Provide safe fallbacks for route variations (tryMany)
// - Support admin key via localStorage "x-admin-key"

const DEFAULT_API_BASE_RAW = "https://iband-backend-first-1.onrender.com";

// ---------- tiny utils ----------
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
  // If someone put just domain in env var, we force https
  return `https://${u}`;
}

/**
 * Normalize API base to avoid common misconfig:
 * - Fix "onrenderder" -> "onrender"
 * - Force https
 * - Remove trailing slashes
 * - Remove trailing "/api" if user included it
 */
function normalizeApiBase(input) {
  let v = safeText(input).trim();

  // Nothing? return empty; caller will fallback.
  if (!v) return "";

  // Fix the most common typo (your screenshots show it)
  v = v.replace(/onrenderder\.com/gi, "onrender.com");

  // Force https if missing
  v = ensureHttps(v);

  // Remove trailing slash
  v = stripTrailingSlash(v);

  // If someone set base as ".../api", strip it (we add /api in routes)
  v = v.replace(/\/api$/i, "");

  // Safety: remove trailing slash again after stripping /api
  v = stripTrailingSlash(v);

  return v;
}

/**
 * Pull base from env, window override, else default.
 * NOTE: Even if VITE_API_BASE is wrong, normalizeApiBase() fixes it.
 */
function getEnvApiBase() {
  // 1) Vite env
  try {
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE
    ) {
      const normalized = normalizeApiBase(import.meta.env.VITE_API_BASE);
      if (normalized) return normalized;
    }
  } catch {
    // ignore
  }

  // 2) runtime override (optional)
  try {
    if (typeof window !== "undefined" && window.__IBAND_API_BASE__) {
      const normalized = normalizeApiBase(window.__IBAND_API_BASE__);
      if (normalized) return normalized;
    }
  } catch {
    // ignore
  }

  // 3) default
  return normalizeApiBase(DEFAULT_API_BASE_RAW);
}

/**
 * Public constant used by UI (displayed in App/Artists etc.)
 * This is authoritative after normalization.
 */
export const API_BASE = getEnvApiBase();

/**
 * Required by App.jsx (backwards-compatible)
 */
export function getApiBase() {
  return API_BASE;
}

// ---------- Admin key helpers ----------
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

// ---------- Low-level request helper ----------
async function requestJson(method, path, { body, headers, timeoutMs } = {}) {
  const base = API_BASE; // already normalized
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;

  const t = controller
    ? setTimeout(() => controller.abort(), Number(timeoutMs || 15000))
    : null;

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

// Try multiple endpoints to reduce back-and-forth route guessing.
async function tryMany(method, paths, options = {}) {
  let lastErr = null;

  for (const p of paths) {
    try {
      return await requestJson(method, p, options);
    } catch (e) {
      lastErr = e;
      const status = Number(e?.status || 0);

      // Only continue on common mismatch errors
      if (![404, 405].includes(status)) throw e;
    }
  }

  throw lastErr || new Error("Request failed");
}

// ---------- Public API (used by frontend pages) ----------
export async function getHealth() {
  // backend supports "/" and "/health" (based on your tests)
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
  return await tryMany(
    "POST",
    ["/api/artists/submit", "/api/submit", "/api/artists"],
    { body: payload }
  );
}

export async function voteArtist(artistId, amount = 1) {
  const aid = encodeURIComponent(safeText(artistId));
  const body = { artistId: safeText(artistId), amount: Number(amount) || 1 };

  return await tryMany(
    "POST",
    [`/api/votes/${aid}`, "/api/votes", `/api/artists/${aid}/vote`],
    { body }
  );
}

export async function listComments(artistId, params = {}) {
  const aid = encodeURIComponent(safeText(artistId));
  const q = new URLSearchParams();
  q.set("artistId", safeText(artistId));
  if (params?.page) q.set("page", safeText(params.page));
  if (params?.limit) q.set("limit", safeText(params.limit));

  return await tryMany("GET", [
    `/api/comments?${q.toString()}`,
    `/api/comments/${aid}?${q.toString()}`,
  ]);
}

export async function addComment(payload) {
  return await tryMany("POST", ["/api/comments"], { body: payload });
}

// ---------- Admin API ----------
export async function adminStats() {
  return await tryMany("GET", ["/api/admin/stats", "/api/admin/health", "/api/admin"], {
    headers: adminHeaders(),
  });
}

export async function adminListArtists(status = "pending") {
  const q = new URLSearchParams();
  if (status) q.set("status", safeText(status));

  return await requestJson("GET", `/api/admin/artists?${q.toString()}`, {
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

// ---------- Object-style client used by some components ----------
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
  adminListComments,
  adminModerateComment,
  adminApproveArtist,
  adminRejectArtist,
};