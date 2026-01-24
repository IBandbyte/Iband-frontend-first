// src/services/api.js
// iBand Frontend API Client — Vercel Safe + Canonical /api routes
// Restores legacy exports used by src/App.jsx (voteArtist, submitArtist, adminListArtists, adminStats, etc.)

const DEFAULT_API_BASE = "https://iband-backend-first-1.onrender.com";

const LS_API_BASE = "iband_api_base";
const LS_ADMIN_KEY = "iband_admin_key";

const isBrowser = typeof window !== "undefined";

/* -------------------- Helpers -------------------- */

function normalizeBase(url) {
  return String(url || "")
    .trim()
    .replace(/\/+$/, "");
}

function safeGet(key) {
  if (!isBrowser) return "";
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeSet(key, value) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(key) {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/* -------------------- API Base -------------------- */

export function getApiBase() {
  const envBase = (import.meta.env.VITE_API_BASE || "").trim();
  const storedBase = safeGet(LS_API_BASE);

  return (
    normalizeBase(envBase) ||
    normalizeBase(storedBase) ||
    DEFAULT_API_BASE
  );
}

export function setApiBase(base) {
  safeSet(LS_API_BASE, normalizeBase(base));
}

export function clearApiBase() {
  safeRemove(LS_API_BASE);
}

/* -------------------- Admin Key -------------------- */

export function getAdminKey() {
  return safeGet(LS_ADMIN_KEY).trim();
}

export function setAdminKey(key) {
  safeSet(LS_ADMIN_KEY, String(key || "").trim());
}

export function clearAdminKey() {
  safeRemove(LS_ADMIN_KEY);
}

/* -------------------- Core Request -------------------- */

function buildUrl(path) {
  const base = getApiBase();
  const clean = String(path || "").startsWith("/") ? String(path) : `/${path}`;
  return `${base}${clean}`;
}

async function request(path, { method = "GET", body, admin = false } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (admin) {
    const key = getAdminKey();
    if (key) headers["x-admin-key"] = key;
  }

  const res = await fetch(buildUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

/* -----------------------------
   Public (Canonical)
----------------------------- */

export function getHealth() {
  return request("/health");
}

export function listArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/api/artists?${qs}` : "/api/artists");
}

export function getArtist(id) {
  return request(`/api/artists/${encodeURIComponent(id)}`);
}

export function submitArtist(payload) {
  return request("/api/artists", { method: "POST", body: payload });
}

export function voteArtist(id, amount = 1) {
  return request(`/api/artists/${encodeURIComponent(id)}/votes`, {
    method: "POST",
    body: { amount },
  });
}

/* -----------------------------
   Comments (Public)
----------------------------- */

export function createComment(payload) {
  return request("/api/comments", { method: "POST", body: payload });
}

export function listCommentsByArtist(artistId) {
  return request(`/api/comments/by-artist/${encodeURIComponent(artistId)}`);
}

/* -----------------------------
   Admin (Artists) — keep exports used by App.jsx
----------------------------- */

export function adminListArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/api/admin/artists?${qs}` : "/api/admin/artists", {
    method: "GET",
    admin: true,
  });
}

export function adminStats() {
  return request("/api/admin/stats", { method: "GET", admin: true });
}

export function adminApproveArtist(id) {
  return request(`/api/admin/artists/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    admin: true,
  });
}

export function adminRejectArtist(id) {
  return request(`/api/admin/artists/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    admin: true,
  });
}

/* -----------------------------
   Admin (Comments)
----------------------------- */

export function adminListComments(status = "pending") {
  return request(`/api/admin/comments?status=${encodeURIComponent(status)}`, {
    method: "GET",
    admin: true,
  });
}

export function adminPatchComment(id, payload) {
  return request(`/api/admin/comments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
    admin: true,
  });
}

export function adminDeleteComment(id) {
  return request(`/api/admin/comments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    admin: true,
  });
}