// src/services/api.js
// iBand Frontend API Client (LOCKED / single source of truth)
// - Keeps backwards compatibility for existing frontend files
// - Supports artist/admin/comment flows already in the app
// - Adds H45-H50 feed intelligence methods for frontend phase
// - Auto-corrects common base URL mistakes
// - Includes admin key header support (x-admin-key) stored locally

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function stripTrailingSlash(s) {
  return safeText(s).trim().replace(/\/+$/, "");
}

function normalizeBase(raw) {
  let s = stripTrailingSlash(raw);

  if (s && !s.startsWith("http://") && !s.startsWith("https://")) {
    s = `https://${s}`;
  }

  s = s.replace("onrenderder.com", "onrender.com");

  return s;
}

const DEFAULT_API_BASE = normalizeBase(
  "https://iband-backend-first-1.onrender.com"
);

function getEnvApiBase() {
  let envBase = "";

  try {
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL)
    ) {
      envBase =
        import.meta.env.VITE_API_BASE ||
        import.meta.env.VITE_API_BASE_URL ||
        "";
    }
  } catch {
    // ignore
  }

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
    ...extra
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
    ...(headers || {})
  };

  try {
    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller ? controller.signal : undefined
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
  return await tryMany("GET", ["/health", "/"], { timeoutMs: 15000 });
}

export async function getApiRoot() {
  return await tryMany("GET", ["/api", "/"], { timeoutMs: 15000 });
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
    `/api/artists/list${suffix}`,
    `/api/artists/active${suffix}`
  ]);
}

export async function getArtist(id) {
  const aid = encodeURIComponent(safeText(id));
  return await tryMany("GET", [
    `/api/artists/${aid}`,
    `/api/artists?id=${aid}`
  ]);
}

export async function submitArtist(payload) {
  return await tryMany(
    "POST",
    ["/api/artists", "/api/artists/submit", "/api/submit"],
    {
      body: payload
    }
  );
}

export async function voteArtist(artistId, amount = 1) {
  const aid = encodeURIComponent(safeText(artistId));

  const bodyA = { amount: Number(amount) || 1 };
  const bodyB = { artistId: safeText(artistId), amount: Number(amount) || 1 };

  return await tryMany(
    "POST",
    [`/api/votes/${aid}`, "/api/votes", `/api/artists/${aid}/votes`],
    {
      body: undefined
    }
  ).catch(async (e) => {
    const status = Number(e?.status || 0);
    if (![404, 405].includes(status)) throw e;

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

  return await tryMany("GET", [
    `/api/comments?${q.toString()}`,
    `/api/comments/${encodeURIComponent(safeText(artistId))}?${q.toString()}`
  ]);
}

export async function addComment(payload) {
  return await requestJson("POST", "/api/comments", { body: payload });
}

/* -----------------------------
   H45-H50 FEED / DISCOVERY METHODS
----------------------------- */

export async function fetchSmartFeed() {
  return await tryMany("GET", [
    "/api/smart-feed/list",
    "/api/smart-feed"
  ]);
}

export async function fetchSmartFeedPriority() {
  return await tryMany("GET", [
    "/api/smart-feed/priority",
    "/api/smart-feed/list"
  ]);
}

export async function fetchPersonalisedFeed() {
  return await tryMany("GET", [
    "/api/personalised-feed/list",
    "/api/personalised-feed"
  ]);
}

export async function fetchPersonalisedFeedHighEngagement() {
  return await tryMany("GET", [
    "/api/personalised-feed/high-engagement",
    "/api/personalised-feed/list"
  ]);
}

export async function fetchFeedDiversity() {
  return await tryMany("GET", [
    "/api/feed-diversity/list",
    "/api/feed-diversity"
  ]);
}

export async function fetchFeedDiversityHighWeight() {
  return await tryMany("GET", [
    "/api/feed-diversity/high-weight",
    "/api/feed-diversity/list"
  ]);
}

export async function fetchEngagementOptimiser() {
  return await tryMany("GET", [
    "/api/engagement-optimiser/list",
    "/api/engagement-optimiser"
  ]);
}

export async function fetchEngagementOptimiserStrong() {
  return await tryMany("GET", [
    "/api/engagement-optimiser/strong",
    "/api/engagement-optimiser/list"
  ]);
}

export async function fetchSessionLearning() {
  return await tryMany("GET", [
    "/api/session-learning/list",
    "/api/session-learning"
  ]);
}

export async function fetchSessionById(sessionId) {
  const sid = encodeURIComponent(safeText(sessionId));
  return await requestJson("GET", `/api/session-learning/${sid}`);
}

export async function recordSessionEvent(payload) {
  return await requestJson("POST", "/api/session-learning", {
    body: payload
  });
}

export async function fetchPredictiveFeed() {
  return await tryMany("GET", [
    "/api/predictive-feed/list",
    "/api/predictive-feed"
  ]);
}

export async function fetchPredictiveFeedHighConfidence() {
  return await tryMany("GET", [
    "/api/predictive-feed/high-confidence",
    "/api/predictive-feed/list"
  ]);
}

export async function fetchArtistMomentum() {
  return await tryMany("GET", [
    "/api/artist-momentum/list",
    "/api/artist-momentum"
  ]);
}

export async function fetchArtistMomentumTop() {
  return await tryMany("GET", [
    "/api/artist-momentum/top",
    "/api/artist-momentum/list"
  ]);
}

export async function fetchArtistRanking() {
  return await tryMany("GET", [
    "/api/artist-ranking/list",
    "/api/artist-ranking"
  ]);
}

export async function fetchArtistRankingTop() {
  return await tryMany("GET", [
    "/api/artist-ranking/top",
    "/api/artist-ranking/list"
  ]);
}

export async function fetchDiscoveryBrain() {
  return await tryMany("GET", [
    "/api/discovery-brain/list",
    "/api/discovery-brain"
  ]);
}

export async function fetchDiscoveryBrainPriority() {
  return await tryMany("GET", [
    "/api/discovery-brain/priority",
    "/api/discovery-brain/list"
  ]);
}

export async function fetchDiscoveryMap() {
  return await tryMany("GET", [
    "/api/discovery-map/list",
    "/api/discovery-map"
  ]);
}

export async function fetchDiscoveryMapHotspots() {
  return await tryMany("GET", [
    "/api/discovery-map/hotspots",
    "/api/discovery-map/list"
  ]);
}

export async function fetchGlobalHeatmap() {
  return await tryMany("GET", [
    "/api/global-heatmap/list",
    "/api/global-heatmap"
  ]);
}

export async function fetchGlobalHeatmapHot() {
  return await tryMany("GET", [
    "/api/global-heatmap/hot",
    "/api/global-heatmap/list"
  ]);
}

/* -----------------------------
   ADMIN (Used by Admin UI)
----------------------------- */

export async function adminStats() {
  return await tryMany("GET", ["/api/admin", "/api/admin/health", "/api/admin/stats"], {
    headers: adminHeaders()
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
    headers: adminHeaders()
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
    const status = Number(e?.status || 0);
    if (![404, 405].includes(status)) throw e;

    return await requestJson("POST", `/api/admin/artists/${aid}/approve`, {
      body,
      headers: adminHeaders()
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
      headers: adminHeaders()
    });
  });
}

export async function adminListComments(arg1 = {}, arg2 = {}) {
  let params = {};

  if (typeof arg1 === "string") {
    params = { ...(arg2 || {}), status: arg1 };
  } else {
    params = arg1 || {};
  }

  const q = new URLSearchParams();
  if (params?.status) q.set("status", safeText(params.status));
  if (params?.artistId) q.set("artistId", safeText(params.artistId));
  if (params?.flagged !== undefined) q.set("flagged", String(!!params.flagged));
  if (params?.page) q.set("page", safeText(params.page));
  if (params?.limit) q.set("limit", safeText(params.limit));

  return await requestJson("GET", `/api/admin/comments?${q.toString()}`, {
    headers: adminHeaders()
  });
}

export async function adminPatchComment(commentId, patch = {}) {
  const cid = encodeURIComponent(safeText(commentId));
  return await requestJson("PATCH", `/api/admin/comments/${cid}`, {
    body: patch,
    headers: adminHeaders()
  });
}

export async function adminDeleteComment(commentId) {
  const cid = encodeURIComponent(safeText(commentId));
  return await requestJson("DELETE", `/api/admin/comments/${cid}`, {
    headers: adminHeaders()
  });
}

export async function adminFlagComment(commentId, payload = {}) {
  const cid = encodeURIComponent(safeText(commentId));
  const code = safeText(payload?.code || "flag") || "flag";
  const reason = safeText(payload?.reason || "");

  return await requestJson("POST", `/api/admin/comments/${cid}/flag`, {
    body: { code, reason },
    headers: adminHeaders()
  });
}

export async function adminClearCommentFlags(commentId) {
  const cid = encodeURIComponent(safeText(commentId));
  return await requestJson("POST", `/api/admin/comments/${cid}/flags/clear`, {
    headers: adminHeaders()
  });
}

export async function adminBulkCommentStatus(
  ids = [],
  status = "hidden",
  moderatedBy = "",
  moderationNote = ""
) {
  return await requestJson("POST", "/api/admin/comments/bulk/status", {
    body: {
      ids,
      status,
      moderatedBy: safeText(moderatedBy),
      moderationNote: safeText(moderationNote)
    },
    headers: adminHeaders()
  });
}

export async function adminBulkDeleteComments(ids = []) {
  return await requestJson("POST", "/api/admin/comments/bulk/delete", {
    body: { ids },
    headers: adminHeaders()
  });
}

/* -----------------------------
   Object-style client (used by components)
----------------------------- */

export const api = {
  // base / health
  API_BASE,
  getApiBase,
  getHealth,
  getApiRoot,

  // artists
  listArtists,
  getArtist,
  submitArtist,
  voteArtist,

  // comments
  listComments,
  addComment,

  // feed / discovery
  fetchSmartFeed,
  fetchSmartFeedPriority,
  fetchPersonalisedFeed,
  fetchPersonalisedFeedHighEngagement,
  fetchFeedDiversity,
  fetchFeedDiversityHighWeight,
  fetchEngagementOptimiser,
  fetchEngagementOptimiserStrong,
  fetchSessionLearning,
  fetchSessionById,
  recordSessionEvent,
  fetchPredictiveFeed,
  fetchPredictiveFeedHighConfidence,
  fetchArtistMomentum,
  fetchArtistMomentumTop,
  fetchArtistRanking,
  fetchArtistRankingTop,
  fetchDiscoveryBrain,
  fetchDiscoveryBrainPriority,
  fetchDiscoveryMap,
  fetchDiscoveryMapHotspots,
  fetchGlobalHeatmap,
  fetchGlobalHeatmapHot,

  // admin key helpers
  setAdminKey,
  clearAdminKey,
  getAdminKey,

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
  adminBulkDeleteComments
};

export default api;