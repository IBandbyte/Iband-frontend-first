/**
 * iBand Frontend API Client (SINGLE SOURCE OF TRUTH)
 * - One client for ALL backend calls
 * - Mobile-safe timeouts + normalized errors
 * - Supports optional admin auth via VITE_ADMIN_KEY (sent as x-admin-key)
 */

export const API_BASE =
  (import.meta?.env?.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "") ||
  "https://iband-backend-first-1.onrender.com";

const DEFAULT_TIMEOUT_MS = 15000;

function joinUrl(base, path) {
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  const cleanBase = String(base || "").replace(/\/+$/, "");
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

function makeError(message, status, data, url) {
  const err = new Error(message);
  err.status = status ?? 0;
  err.data = data ?? null;
  err.url = url ?? null;
  return err;
}

function getAdminKey() {
  const k = String(import.meta?.env?.VITE_ADMIN_KEY || "").trim();
  return k || "";
}

export async function apiFetch(path, options = {}) {
  const url = joinUrl(API_BASE, path);

  const timeoutMs =
    typeof options.timeoutMs === "number" ? options.timeoutMs : DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  // Optional admin key header (only when provided)
  if (options.useAdminKey) {
    const adminKey = getAdminKey();
    if (adminKey) headers["x-admin-key"] = adminKey;
  }

  const hasBody = options.body !== undefined && options.body !== null;

  let body = options.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (hasBody && !isFormData && typeof body === "object" && !(body instanceof Blob)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  } else if (hasBody && typeof body === "string") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: hasBody ? body : undefined,
      signal: controller.signal,
      mode: "cors",
      credentials: "omit",
    });

    const text = await res.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && (data.error || data.message)) ||
        `Request failed (${res.status})`;
      throw makeError(msg, res.status, data, url);
    }

    return data;
  } catch (e) {
    if (e?.name === "AbortError") {
      throw makeError("Request timed out", 408, null, url);
    }
    if (e?.status) throw e;
    throw makeError(e?.message || "Network error", 0, null, url);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Backend endpoints in play:
 * Public:
 * - GET  /health
 * - GET  /artists
 * - GET  /artists/:id
 * - POST /artists
 * - POST /artists/:id/votes  { amount }
 * Comments:
 * - GET  /comments?artistId=:id
 * - POST /comments
 * - GET  /artists/:id/comments
 * - POST /artists/:id/comments
 * Admin (Phase 2.2.3):
 * - GET    /admin/artists?status=pending
 * - POST   /admin/artists/:id/approve
 * - POST   /admin/artists/:id/reject
 * - POST   /admin/artists/:id/restore
 * - DELETE /admin/artists/:id
 * - GET    /admin/stats
 */

export const api = {
  // ----------------------
  // Health
  // ----------------------
  health: () => apiFetch("/health"),

  // ----------------------
  // Artists (public)
  // ----------------------
  listArtists: (params = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      const s = String(v).trim();
      if (!s) continue;
      q.set(k, s);
    }
    const qs = q.toString();
    return apiFetch(qs ? `/artists?${qs}` : "/artists");
  },

  getArtist: (id) => apiFetch(`/artists/${encodeURIComponent(id)}`),

  createArtist: (payload) =>
    apiFetch("/artists", {
      method: "POST",
      body: payload,
    }),

  // submission helper (defaults status to pending if not provided)
  submitArtist: (payload) => {
    const body = { ...(payload || {}) };
    if (!body.status) body.status = "pending";
    return apiFetch("/artists", { method: "POST", body });
  },

  voteArtist: (artistId, amount = 1) =>
    apiFetch(`/artists/${encodeURIComponent(artistId)}/votes`, {
      method: "POST",
      body: { amount },
    }),

  // ----------------------
  // Comments
  // ----------------------
  listComments: (artistId, params = {}) => {
    const q = new URLSearchParams();
    if (artistId) q.set("artistId", String(artistId));
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      const s = String(v).trim();
      if (!s) continue;
      q.set(k, s);
    }
    return apiFetch(`/comments?${q.toString()}`);
  },

  addComment: ({ artistId, name, text }) =>
    apiFetch("/comments", {
      method: "POST",
      body: { artistId, name, text },
    }),

  listArtistComments: (artistId, params = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      const s = String(v).trim();
      if (!s) continue;
      q.set(k, s);
    }
    const qs = q.toString();
    return apiFetch(
      qs
        ? `/artists/${encodeURIComponent(artistId)}/comments?${qs}`
        : `/artists/${encodeURIComponent(artistId)}/comments`
    );
  },

  addArtistComment: (artistId, { name, text }) =>
    apiFetch(`/artists/${encodeURIComponent(artistId)}/comments`, {
      method: "POST",
      body: { name, text },
    }),

  // ----------------------
  // Admin (moderation)
  // ----------------------
  adminListArtists: (params = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      const s = String(v).trim();
      if (!s) continue;
      q.set(k, s);
    }
    const qs = q.toString();
    return apiFetch(qs ? `/admin/artists?${qs}` : "/admin/artists", {
      useAdminKey: true,
    });
  },

  adminGetArtist: (id) =>
    apiFetch(`/admin/artists/${encodeURIComponent(id)}`, { useAdminKey: true }),

  adminApproveArtist: (id) =>
    apiFetch(`/admin/artists/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      useAdminKey: true,
    }),

  adminRejectArtist: (id) =>
    apiFetch(`/admin/artists/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      useAdminKey: true,
    }),

  adminRestoreArtist: (id) =>
    apiFetch(`/admin/artists/${encodeURIComponent(id)}/restore`, {
      method: "POST",
      useAdminKey: true,
    }),

  adminDeleteArtist: (id) =>
    apiFetch(`/admin/artists/${encodeURIComponent(id)}`, {
      method: "DELETE",
      useAdminKey: true,
    }),

  adminStats: () => apiFetch("/admin/stats", { useAdminKey: true }),
};