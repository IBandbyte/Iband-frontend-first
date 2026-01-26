// src/services/api.js
// ✅ iBand Frontend API Client — FINAL CANONICAL VERSION
// Public routes:      /artists, /comments
// Admin routes:       /api/admin/*
// Compatible exports: getHealth, listArtists, submitArtist, voteArtist, api object

const LS_ADMIN_KEY = "iband_admin_key";

// ✅ Default backend (Render)
export const API_BASE = "https://iband-backend-first-1.onrender.com";

// -----------------------------
// Helpers
// -----------------------------
function adminKey() {
  return localStorage.getItem(LS_ADMIN_KEY) || "";
}

function headers({ admin = false } = {}) {
  const h = { "Content-Type": "application/json" };
  if (admin && adminKey()) {
    h["x-admin-key"] = adminKey();
  }
  return h;
}

async function request(path, { method = "GET", body, admin = false } = {}) {
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers: headers({ admin }),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "API route not found.");
  }

  return data;
}

// -----------------------------
// ✅ Public API Routes
// -----------------------------

export function getHealth() {
  return request("/health");
}

export function listArtists() {
  // ✅ BACKEND: /artists
  return request("/artists");
}

export function submitArtist(payload) {
  // ✅ BACKEND: /artists
  return request("/artists", {
    method: "POST",
    body: payload,
  });
}

export function voteArtist(id, amount = 1) {
  // ✅ BACKEND: /artists/:id/votes
  return request(`/artists/${id}/votes`, {
    method: "POST",
    body: { amount },
  });
}

// ✅ Artist Detail
export function getArtist(id) {
  return request(`/artists/${id}`);
}

// -----------------------------
// ✅ Comments API
// -----------------------------

export function addComment(payload) {
  // ✅ BACKEND: /comments
  return request("/comments", {
    method: "POST",
    body: payload,
  });
}

export function listComments(artistId) {
  // ✅ BACKEND: /comments?artistId=demo
  return request(`/comments?artistId=${artistId}`);
}

// -----------------------------
// ✅ Admin API Routes
// -----------------------------

export function adminStats() {
  return request("/api/admin/stats", {
    admin: true,
  });
}

export function adminListArtists(status = "pending") {
  return request(`/api/admin/artists?status=${status}`, {
    admin: true,
  });
}

export function adminListComments(status = "pending") {
  return request(`/api/admin/comments?status=${status}`, {
    admin: true,
  });
}

export function adminApproveArtist(id) {
  return request(`/api/admin/artists/${id}/approve`, {
    method: "POST",
    admin: true,
  });
}

export function adminRejectArtist(id) {
  return request(`/api/admin/artists/${id}/reject`, {
    method: "POST",
    admin: true,
  });
}

export function adminUpdateComment(id, status, note) {
  return request(`/api/admin/comments/${id}`, {
    method: "PATCH",
    admin: true,
    body: {
      status,
      moderatedBy: "Admin",
      moderationNote: note,
    },
  });
}

export function adminDeleteComment(id) {
  return request(`/api/admin/comments/${id}`, {
    method: "DELETE",
    admin: true,
  });
}

// -----------------------------
// ✅ Backwards Compatible API Object
// -----------------------------

export const api = {
  getHealth,
  listArtists,
  submitArtist,
  voteArtist,
  getArtist,
  addComment,
  listComments,
  adminStats,
  adminListArtists,
  adminListComments,
  adminUpdateComment,
  adminDeleteComment,
};