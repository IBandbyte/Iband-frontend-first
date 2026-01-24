// src/services/api.js
// iBand Frontend API Client (Stable + Vercel Ready)

const LS_API_BASE = "iband_api_base";
const LS_ADMIN_KEY = "iband_admin_key";

const DEFAULT_API_BASE = "https://iband-backend-first-1.onrender.com";

/* -----------------------------
   Helpers
----------------------------- */

function normalizeBase(u) {
  return String(u || "").trim().replace(/\/+$/, "");
}

export function getApiBase() {
  const envBase =
    (import.meta.env && import.meta.env.VITE_API_BASE) || "";

  const stored = localStorage.getItem(LS_API_BASE) || "";
  return normalizeBase(envBase) || normalizeBase(stored) || DEFAULT_API_BASE;
}

export function getAdminKey() {
  return (localStorage.getItem(LS_ADMIN_KEY) || "").trim();
}

export function setAdminKey(key) {
  localStorage.setItem(LS_ADMIN_KEY, String(key || "").trim());
}

function buildUrl(path) {
  const base = getApiBase();
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

function makeHeaders({ admin = false } = {}) {
  const h = { "Content-Type": "application/json" };

  if (admin) {
    const k = getAdminKey();
    if (k) h["x-admin-key"] = k;
  }

  return h;
}

async function request(path, { method = "GET", body, admin = false } = {}) {
  const url = buildUrl(path);

  const res = await fetch(url, {
    method,
    headers: makeHeaders({ admin }),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "API route not found.");
  }

  return data;
}

/* -----------------------------
   Public Artist Endpoints
----------------------------- */

export function listArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/api/artists?${qs}` : "/api/artists");
}

export function submitArtist(payload) {
  return request("/api/artists", {
    method: "POST",
    body: payload,
  });
}

export function voteArtist(id) {
  return request(`/api/artists/${id}/votes`, {
    method: "POST",
  });
}

/* -----------------------------
   Comments (Public)
----------------------------- */

export function postComment(payload) {
  return request("/api/comments", {
    method: "POST",
    body: payload,
  });
}

/* -----------------------------
   Admin Moderation Endpoints
----------------------------- */

export function adminListComments(status = "pending") {
  return request(`/api/admin/comments?status=${status}`, {
    method: "GET",
    admin: true,
  });
}

export function adminUpdateComment(id, payload) {
  return request(`/api/admin/comments/${id}`, {
    method: "PATCH",
    body: payload,
    admin: true,
  });
}

export function adminDeleteComment(id) {
  return request(`/api/admin/comments/${id}`, {
    method: "DELETE",
    admin: true,
  });
}