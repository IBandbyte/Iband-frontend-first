/**
 * iBand Frontend API Client (FOUNDATION)
 * - Single source of truth for backend calls
 * - Safe on mobile + Vercel
 * - Normalized errors + timeouts + JSON parsing
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
 * Backend endpoints confirmed (so far):
 * - GET  /health
 * - GET  /artists
 * - GET  /artists/:id
 * - POST /artists/:id/votes  { amount: 1 }
 * - GET  /comments?artistId=demo
 * - POST /comments  { artistId, name, text }
 *
 * Submission endpoints may vary by backend iteration.
 * We support BOTH patterns safely:
 * - POST /artists/submissions
 * - POST /artists   (with { status:"pending" } if backend accepts)
 */
export const api = {
  // Health
  health: () => apiFetch("/health"),

  // Artists
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

  voteArtist: (artistId, amount = 1) =>
    apiFetch(`/artists/${encodeURIComponent(artistId)}/votes`, {
      method: "POST",
      body: { amount },
    }),

  // Comments
  listComments: (artistId) =>
    apiFetch(`/comments?artistId=${encodeURIComponent(artistId)}`),

  addComment: ({ artistId, name, text }) =>
    apiFetch("/comments", {
      method: "POST",
      body: { artistId, name, text },
    }),

  /**
   * Artist Submission (Phase 2.2.2)
   * Primary: POST /artists/submissions
   * Fallback: POST /artists (with status=pending)
   */
  submitArtist: async (payload) => {
    // Try canonical endpoint first
    try {
      return await apiFetch("/artists/submissions", { method: "POST", body: payload });
    } catch (e) {
      // If backend doesn't have /artists/submissions, fallback to /artists
      // (Some builds treat POST /artists as submissions)
      if (e?.status === 404) {
        const fallbackPayload =
          payload && typeof payload === "object"
            ? { ...payload, status: payload.status || "pending" }
            : payload;

        return apiFetch("/artists", { method: "POST", body: fallbackPayload });
      }
      throw e;
    }
  },

  /**
   * Future-proof admin hooks (Phase 2.2.3+)
   * These are SAFE to exist even if unused.
   */
  listPendingArtists: (params = {}) =>
    apiFetch(
      `/admin/artists?${new URLSearchParams({ status: "pending", ...params }).toString()}`
    ),

  approveArtist: (id) =>
    apiFetch(`/admin/artists/${encodeURIComponent(id)}/approve`, { method: "POST" }),

  rejectArtist: (id, reason = "") =>
    apiFetch(`/admin/artists/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      body: { reason },
    }),
};