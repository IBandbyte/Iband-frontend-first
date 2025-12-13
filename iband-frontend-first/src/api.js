// src/services/api.js
// iBandbyte Frontend API Client (future-proof, clean errors, mobile-friendly)

const DEFAULT_BASE_URL = "https://iband-backend-first-1.onrender.com/api";

function getBaseUrl() {
  const envUrl =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE_URL) ||
    "";
  const raw = (envUrl || DEFAULT_BASE_URL).trim();
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function getAdminKey() {
  const key =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_ADMIN_KEY) ||
    "";
  return String(key || "").trim();
}

function withTimeout(ms = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, clear: () => clearTimeout(id) };
}

async function safeReadText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function tryParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildError({ message, status, url, details }) {
  const err = new Error(message || "Request failed");
  err.status = status || 0;
  err.url = url || "";
  err.details = details || null;
  return err;
}

async function request(path, options = {}) {
  const baseUrl = getBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

  const {
    method = "GET",
    body,
    headers = {},
    timeoutMs = 15000,
    admin = false,
    authToken = "",
  } = options;

  const { controller, clear } = withTimeout(timeoutMs);

  const finalHeaders = {
    Accept: "application/json",
    ...headers,
  };

  // Set JSON headers automatically if body is a plain object
  let finalBody = body;
  const isPlainObject =
    body && typeof body === "object" && !(body instanceof FormData);
  if (isPlainObject) {
    finalHeaders["Content-Type"] = "application/json";
    finalBody = JSON.stringify(body);
  }

  // Optional bearer token support (future app auth)
  if (authToken) {
    finalHeaders.Authorization = `Bearer ${authToken}`;
  }

  // Optional admin key (ONLY if you explicitly set it in VITE_ADMIN_KEY)
  if (admin) {
    const key = getAdminKey();
    if (key) finalHeaders["x-admin-key"] = key;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal,
    });

    const text = await safeReadText(res);
    const json = tryParseJson(text);

    if (!res.ok) {
      const message =
        (json && (json.error || json.message)) ||
        `HTTP ${res.status} (${res.statusText})`;
      throw buildError({
        message,
        status: res.status,
        url,
        details: json || text,
      });
    }

    // Return JSON if possible, otherwise raw text
    return json !== null ? json : text;
  } catch (e) {
    if (e?.name === "AbortError") {
      throw buildError({
        message: "Request timed out. Try again.",
        status: 408,
        url,
        details: null,
      });
    }
    // Normalize unknown errors
    throw buildError({
      message: e?.message || "Network error",
      status: e?.status || 0,
      url: e?.url || url,
      details: e?.details || null,
    });
  } finally {
    clear();
  }
}

/* -------------------------------------------------------
   PUBLIC API (safe for users)
-------------------------------------------------------- */

export async function health() {
  // If your backend also exposes /health outside /api, you can swap this later.
  return request("/health", { method: "GET" });
}

export async function listArtists(params = {}) {
  const qs = new URLSearchParams();
  if (params.genre) qs.set("genre", params.genre);
  if (params.country) qs.set("country", params.country);
  if (params.search) qs.set("search", params.search);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request(`/artists${suffix}`, { method: "GET" });
}

export async function getArtist(id) {
  if (!id) throw new Error("Missing artist id");
  return request(`/artists/${encodeURIComponent(id)}`, { method: "GET" });
}

export async function voteForArtist(artistId, payload = {}) {
  if (!artistId) throw new Error("Missing artist id");
  // payload can include: { voterId, fingerprint, sessionId } later
  return request(`/votes`, {
    method: "POST",
    body: { artistId, ...payload },
  });
}

export async function listComments(artistId) {
  if (!artistId) throw new Error("Missing artist id");
  return request(`/comments?artistId=${encodeURIComponent(artistId)}`, {
    method: "GET",
  });
}

export async function addComment(artistId, comment) {
  if (!artistId) throw new Error("Missing artist id");
  if (!comment || typeof comment !== "string")
    throw new Error("Missing comment text");

  return request(`/comments`, {
    method: "POST",
    body: { artistId, text: comment },
  });
}

/* -------------------------------------------------------
   ADMIN API (requires x-admin-key if you set VITE_ADMIN_KEY)
   IMPORTANT: do NOT set a real secret in public production builds.
-------------------------------------------------------- */

export async function adminStats() {
  return request(`/admin/stats`, { method: "GET", admin: true });
}

export async function adminStatsByArtist() {
  return request(`/admin/stats/by-artist`, { method: "GET", admin: true });
}

export async function adminCleanup() {
  return request(`/admin/cleanup`, { method: "POST", admin: true, body: {} });
}

export async function adminCreateArtist(artist) {
  return request(`/admin/artists`, { method: "POST", admin: true, body: artist });
}

export async function adminUpdateArtist(id, patch) {
  if (!id) throw new Error("Missing artist id");
  return request(`/admin/artists/${encodeURIComponent(id)}`, {
    method: "PUT",
    admin: true,
    body: patch,
  });
}

export async function adminDeleteArtist(id) {
  if (!id) throw new Error("Missing artist id");
  return request(`/admin/artists/${encodeURIComponent(id)}`, {
    method: "DELETE",
    admin: true,
  });
}

export async function adminDeleteComment(commentId) {
  if (!commentId) throw new Error("Missing comment id");
  return request(`/admin/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
    admin: true,
  });
}