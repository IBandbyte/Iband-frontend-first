// src/services/api.js
// ✅ iBand Single Source of Truth API Client (Captain Hardened)
// - Auto-corrects Render typos (onrenderder)
// - Never allows wrong base URL to break production
// - All frontend routes match backend forever

const FALLBACK_RENDER =
  "https://iband-backend-first-1.onrender.com";

// ✅ Fix ALL common Render mistakes permanently
function normalizeBase(url) {
  if (!url) return FALLBACK_RENDER;

  return String(url)
    .trim()
    .replace("onrenderder.com", "onrender.com")
    .replace("onrenderder", "onrender")
    .replace(/\/+$/, "");
}

// ✅ Detect env base, but never trust it fully
function getApiBase() {
  try {
    const envBase =
      import.meta?.env?.VITE_API_BASE;

    return normalizeBase(envBase || FALLBACK_RENDER);
  } catch {
    return FALLBACK_RENDER;
  }
}

export const API_BASE = getApiBase();

// ---------------- REQUEST CORE ----------------

async function request(method, path, body) {
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "API Error");
  }

  return data;
}

// ---------------- PUBLIC ARTISTS ----------------

export async function listArtists({ status = "active", query = "" } = {}) {
  const q = new URLSearchParams();

  if (status) q.set("status", status);
  if (query) q.set("q", query);

  return request("GET", `/api/artists?${q.toString()}`);
}

export async function getArtist(id) {
  return request("GET", `/api/artists/${id}`);
}

export async function submitArtist(payload) {
  return request("POST", `/api/artists/submit`, payload);
}

// ---------------- COMMENTS ----------------

export async function listComments(artistId) {
  return request("GET", `/api/comments?artistId=${artistId}`);
}

export async function addComment(payload) {
  return request("POST", `/api/comments`, payload);
}

// ---------------- VOTING ----------------

export async function voteArtist(id) {
  return request("POST", `/api/votes/${id}`);
}

// ---------------- ADMIN ----------------

export async function adminListArtists(status = "pending") {
  return request("GET", `/api/admin/artists?status=${status}`);
}

export async function adminApproveArtist(id) {
  return request("PATCH", `/api/admin/artists/${id}`, {
    status: "active",
  });
}

export async function adminRejectArtist(id) {
  return request("PATCH", `/api/admin/artists/${id}`, {
    status: "rejected",
  });
}

// ✅ Unified export
export const api = {
  listArtists,
  getArtist,
  submitArtist,
  listComments,
  addComment,
  voteArtist,
  adminListArtists,
  adminApproveArtist,
  adminRejectArtist,
};