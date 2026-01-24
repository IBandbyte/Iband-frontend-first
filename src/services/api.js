// src/services/api.js
// iBand Frontend API Client (Stable + Vercel Ready + Backwards Compatible)

const LS_API_BASE = "iband_api_base";
const LS_ADMIN_KEY = "iband_admin_key";

// Default backend (Render)
const DEFAULT_API_BASE = "https://iband-backend-first-1.onrender.com";

/* -----------------------------
   Helpers
----------------------------- */

function normalizeBase(u) {
  return String(u || "").trim().replace(/\/+$/, "");
}

export function getApiBase() {
  const envBase = (import.meta.env && import.meta.env.VITE_API_BASE) || "";
  const stored = localStorage.getItem(LS_API_BASE) || "";
  return normalizeBase(envBase) || normalizeBase(stored) || DEFAULT_API_BASE;
}

export function setApiBase(base) {
  localStorage.setItem(LS_API_BASE, normalizeBase(base));
}

export function clearApiBase() {
  localStorage.removeItem(LS_API_BASE);
}

export function getAdminKey() {
  return (localStorage.getItem(LS_ADMIN_KEY) || "").trim();
}

export function setAdminKey(key) {
  localStorage.setItem(LS_ADMIN_KEY, String(key || "").trim());
}

export function clearAdminKey() {
  localStorage.removeItem(LS_ADMIN_KEY);
}

function buildUrl(path) {
  const base = getApiBase();
  const p = String(path || "");
  return p.startsWith("/") ? `${base}${p}` : `${base}/${p}`;
}

function makeHeaders({ admin = false, json = true } = {}) {
  const h = {};
  if (json) h["Content-Type"] = "application/json";

  if (admin) {
    const k = getAdminKey();
    if (k) h["x-admin-key"] = k;
  }
  return h;
}

async function request(path, { method = "GET", body, admin = false } = {}) {
  const url = buildUrl(path);

  const opts = {
    method,
    headers: makeHeaders({ admin, json: body !== undefined }),
  };

  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);

  // Parse JSON safely
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

/* -----------------------------
   Canonical routes (+ legacy fallback)
   - Your backend now uses /api/*
   - If anything still calls old /artists etc, we auto-fallback.
----------------------------- */

async function requestWithLegacyFallback(
  canonicalPath,
  legacyPath,
  opts = {}
) {
  try {
    return await request(canonicalPath, opts);
  } catch (err) {
    // If the canonical path 404s, try legacy
    const msg = String(err?.message || "");
    if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
      return request(legacyPath, opts);
    }
    throw err;
  }
}

/* -----------------------------
   Public
----------------------------- */

export function getHealth() {
  // canonical is /api/health, legacy was /health
  return requestWithLegacyFallback("/api/health", "/health", { method: "GET" });
}

export function listArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const canonical = qs ? `/api/artists?${qs}` : "/api/artists";
  const legacy = qs ? `/artists?${qs}` : "/artists";
  return requestWithLegacyFallback(canonical, legacy, { method: "GET" });
}

export function submitArtist(payload) {
  return requestWithLegacyFallback("/api/artists", "/artists", {
    method: "POST",
    body: payload,
  });
}

export function voteArtist(id, amount = 1) {
  // canonical: /api/artists/:id/votes  (legacy: /artists/:id/votes)
  const safeId = encodeURIComponent(id);
  return requestWithLegacyFallback(
    `/api/artists/${safeId}/votes`,
    `/artists/${safeId}/votes`,
    {
      method: "POST",
      body: { amount },
    }
  );
}

/* -----------------------------
   Comments (Public)
----------------------------- */

export function postComment(payload) {
  return requestWithLegacyFallback("/api/comments", "/comments", {
    method: "POST",
    body: payload,
  });
}

export function listComments(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const canonical = qs ? `/api/comments?${qs}` : "/api/comments";
  const legacy = qs ? `/comments?${qs}` : "/comments";
  return requestWithLegacyFallback(canonical, legacy, { method: "GET" });
}

/* -----------------------------
   Admin (Artists)
----------------------------- */

export function adminListArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const canonical = qs ? `/api/admin/artists?${qs}` : "/api/admin/artists";
  const legacy = qs ? `/admin/artists?${qs}` : "/admin/artists";

  return requestWithLegacyFallback(canonical, legacy, {
    method: "GET",
    admin: true,
  });
}

export function adminStats() {
  return requestWithLegacyFallback("/api/admin/stats", "/admin/stats", {
    method: "GET",
    admin: true,
  });
}

export function adminApproveArtist(id) {
  const safeId = encodeURIComponent(id);
  return requestWithLegacyFallback(
    `/api/admin/artists/${safeId}/approve`,
    `/admin/artists/${safeId}/approve`,
    { method: "POST", admin: true }
  );
}

export function adminRejectArtist(id) {
  const safeId = encodeURIComponent(id);
  return requestWithLegacyFallback(
    `/api/admin/artists/${safeId}/reject`,
    `/admin/artists/${safeId}/reject`,
    { method: "POST", admin: true }
  );
}

/* -----------------------------
   Admin (Comments Moderation)
----------------------------- */

export function adminListComments(status = "pending") {
  return requestWithLegacyFallback(
    `/api/admin/comments?status=${encodeURIComponent(status)}`,
    `/admin/comments?status=${encodeURIComponent(status)}`,
    { method: "GET", admin: true }
  );
}

export function adminUpdateComment(id, payload) {
  const safeId = encodeURIComponent(id);
  return requestWithLegacyFallback(
    `/api/admin/comments/${safeId}`,
    `/admin/comments/${safeId}`,
    { method: "PATCH", body: payload, admin: true }
  );
}

export function adminDeleteComment(id) {
  const safeId = encodeURIComponent(id);
  return requestWithLegacyFallback(
    `/api/admin/comments/${safeId}`,
    `/admin/comments/${safeId}`,
    { method: "DELETE", admin: true }
  );
}