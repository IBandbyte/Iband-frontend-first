// src/services/api.js
// iBand Frontend API Client (ESM)
// Works on Vercel (Vite)
// - API base uses VITE_API_BASE if set, else localStorage override, else Render default
// - Admin key uses localStorage (iband_admin_key) so you can toggle it without redeploy

const LS_API_BASE = "iband_api_base";
const LS_ADMIN_KEY = "iband_admin_key";

// Default backend (Render)
const DEFAULT_API_BASE = "https://iband-backend-first-1.onrender.com";

function normalizeBase(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  return s.replace(/\/+$/, "");
}

export function getApiBase() {
  const envBase = (import.meta?.env?.VITE_API_BASE || "").trim();
  const stored = (typeof window !== "undefined" && window.localStorage)
    ? (localStorage.getItem(LS_API_BASE) || "").trim()
    : "";

  return normalizeBase(envBase) || normalizeBase(stored) || DEFAULT_API_BASE;
}

export function setApiBase(base) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_API_BASE, normalizeBase(base));
}

export function clearApiBase() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_API_BASE);
}

export function getAdminKey() {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(LS_ADMIN_KEY) || "").trim();
}

export function setAdminKey(key) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_ADMIN_KEY, String(key || "").trim());
}

export function clearAdminKey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_ADMIN_KEY);
}

export const API_BASE = getApiBase();

function buildUrl(path) {
  const base = getApiBase();
  const p = String(path || "");
  if (!p) return base;
  if (p.startsWith("http")) return p;
  if (!p.startsWith("/")) return `${base}/${p}`;
  return `${base}${p}`;
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

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

/* -----------------------------
   Public API
----------------------------- */

function getHealth() {
  return request("/health", { method: "GET" });
}

function listArtists() {
  return request("/api/artists", { method: "GET" });
}

function getArtist(id) {
  return request(`/api/artists/${encodeURIComponent(id)}`, { method: "GET" });
}

// Voting varies per backend version — this keeps frontend stable.
// If /api/votes exists: POST /api/votes { artistId, amount }
// If not, fallback: POST /api/artists/:id/votes { amount }
async function voteArtist(id, amount = 1) {
  try {
    return await request("/api/votes", {
      method: "POST",
      body: { artistId: id, amount },
    });
  } catch {
    return request(`/api/artists/${encodeURIComponent(id)}/votes`, {
      method: "POST",
      body: { amount },
    });
  }
}

/* -----------------------------
   Public Comments (backend accurate)
----------------------------- */

function addComment({ artistId, author, text }) {
  return request("/api/comments", {
    method: "POST",
    body: { artistId, author, text },
  });
}

function listCommentsByArtist(artistId) {
  return request(`/api/comments/by-artist/${encodeURIComponent(artistId)}`, {
    method: "GET",
  });
}

/* -----------------------------
   Admin API
----------------------------- */

function adminRoot() {
  return request("/api/admin", { method: "GET", admin: true });
}

function adminListComments(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/api/admin/comments?${qs}` : "/api/admin/comments", {
    method: "GET",
    admin: true,
  });
}

function adminPatchComment(id, patch) {
  return request(`/api/admin/comments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    admin: true,
    body: patch,
  });
}

function adminDeleteComment(id) {
  return request(`/api/admin/comments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    admin: true,
  });
}

/* -----------------------------
   Exported API surface
----------------------------- */

export const api = {
  // base helpers
  getApiBase,
  setApiBase,
  clearApiBase,
  getAdminKey,
  setAdminKey,
  clearAdminKey,

  // public
  getHealth,
  listArtists,
  getArtist,
  voteArtist,

  // public comments
  addComment,
  listCommentsByArtist,

  // admin
  adminRoot,
  adminListComments,
  adminPatchComment,
  adminDeleteComment,
};