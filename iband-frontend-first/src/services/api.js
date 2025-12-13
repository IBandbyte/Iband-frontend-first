/**
 * iBand Frontend API Client
 * - Single source of truth for backend calls
 * - Works on mobile + Vercel
 * - Normalizes errors and JSON parsing
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

  // Auto JSON encode plain objects (unless already string/FormData)
  let body = options.body;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

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
 * Typed-ish convenience wrappers
 * (If your backend uses /api prefix, this still works because we call absolute paths below.)
 */
export const api = {
  // Health
  health: () => apiFetch("/health"),

  // Artists
  listArtists: () => apiFetch("/artists"),
  getArtist: (id) => apiFetch(`/artists/${encodeURIComponent(id)}`),

  // Votes (supports common patterns; backend can accept either)
  vote: (artistId) =>
    apiFetch("/votes", { method: "POST", body: { artistId } }),

  // Comments (supports common patterns; backend can accept either)
  listComments: (artistId) =>
    apiFetch(`/comments?artistId=${encodeURIComponent(artistId)}`),

  addComment: ({ artistId, name, text }) =>
    apiFetch("/comments", {
      method: "POST",
      body: { artistId, name, text },
    }),

  // Admin stats (optional; safe if route exists)
  adminStats: () => apiFetch("/api/admin/stats"),
};