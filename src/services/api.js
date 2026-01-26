// src/services/api.js
// ✅ iBand Frontend API Client — CANONICAL + BACKWARDS COMPATIBLE
// Public routes:      /artists, /comments, /health
// Admin routes:       /api/admin/*
// Keeps legacy exports used by App.jsx and older components.

const LS_ADMIN_KEY = "iband_admin_key";

// ✅ Default backend (Render)
export const API_BASE = "https://iband-backend-first-1.onrender.com";

// -----------------------------
// Admin key helpers (legacy + UI)
// -----------------------------
export function setAdminKey(key) {
  const v = String(key || "").trim();
  if (v) localStorage.setItem(LS_ADMIN_KEY, v);
  return v;
}

export function clearAdminKey() {
  localStorage.removeItem(LS_ADMIN_KEY);
}

export function getAdminKey() {
  return localStorage.getItem(LS_ADMIN_KEY) || "";
}

// Legacy helper expected by App.jsx
export function getApiBase() {
  return API_BASE;
}

// -----------------------------
// Low-level request
// -----------------------------
function headers({ admin = false } = {}) {
  const h = { "Content-Type": "application/json" };
  if (admin) {
    const k = getAdminKey();
    if (k) h["x-admin-key"] = k;
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
    // Keep message format consistent with UI
    const msg = data?.message || data?.error || "API route not found.";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// -----------------------------
// ✅ Public API Routes (CANONICAL)
// -----------------------------
export function getHealth() {
  return request("/health");
}

export function listArtists() {
  // ✅ BACKEND: /artists
  return request("/artists");
}

export function getArtist(id) {
  // ✅ BACKEND: /artists/:id
  return request(`/artists/${encodeURIComponent(id)}`);
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
  return request(`/artists/${encodeURIComponent(id)}/votes`, {
    method: "POST",
    body: { amount },
  });
}

// -----------------------------
// ✅ Comments (CANONICAL)
// -----------------------------
export function addComment(payload) {
  // ✅ BACKEND: /comments
  return request("/comments", {
    method: "POST",
    body: payload,
  });
}

export function listComments(artistId, { limit, page } = {}) {
  // ✅ BACKEND: /comments?artistId=demo
  // Backend may ignore limit/page — we still support them for future-proofing.
  const qs = new URLSearchParams();
  if (artistId) qs.set("artistId", artistId);
  if (limit) qs.set("limit", String(limit));
  if (page) qs.set("page", String(page));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request(`/comments${suffix}`);
}

// -----------------------------
// ✅ Admin API Routes (CANONICAL)
// -----------------------------
export function adminStats() {
  return request("/api/admin/stats", { admin: true });
}

export function adminListArtists(status = "pending") {
  return request(`/api/admin/artists?status=${encodeURIComponent(status)}`, {
    admin: true,
  });
}

export function adminListComments(status = "pending") {
  return request(`/api/admin/comments?status=${encodeURIComponent(status)}`, {
    admin: true,
  });
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

export function adminUpdateComment(id, status, note) {
  return request(`/api/admin/comments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    admin: true,
    body: {
      status,
      moderatedBy: "Admin",
      moderationNote: note || null,
    },
  });
}

export function adminDeleteComment(id) {
  return request(`/api/admin/comments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    admin: true,
  });
}

// -----------------------------
// ✅ Legacy API object (used in ArtistDetail.jsx)
// -----------------------------
export const api = {
  // public
  getHealth,
  listArtists,
  getArtist,
  submitArtist,
  voteArtist,
  addComment,
  listComments,

  // admin
  adminStats,
  adminListArtists,
  adminListComments,
  adminUpdateComment,
  adminDeleteComment,
};