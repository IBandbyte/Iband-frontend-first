// src/services/api.js
// iBand Frontend API Client (ESM)
// - Works on Vercel
// - Supports admin header x-admin-key via localStorage
// - Uses VITE_API_BASE if set, otherwise stored API base, otherwise Render default

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
  const envBase =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE) ||
    "";

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

  // Try parse JSON, but don't crash if backend returns plain text
  let data = null;
  const text = await res.text();
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
   Public
----------------------------- */

export function getHealth() {
  return request("/health", { method: "GET" });
}

export function listArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/artists?${qs}` : "/artists", { method: "GET" });
}

export function submitArtist(payload) {
  return request("/artists", { method: "POST", body: payload });
}

export function voteArtist(id, amount = 1) {
  return request(`/artists/${encodeURIComponent(id)}/votes`, {
    method: "POST",
    body: { amount },
  });
}

/* -----------------------------
   Admin
----------------------------- */

export function adminListArtists(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/admin/artists?${qs}` : "/admin/artists", {
    method: "GET",
    admin: true,
  });
}

export function adminStats() {
  return request("/admin/stats", { method: "GET", admin: true });
}

export function adminApproveArtist(id) {
  return request(`/admin/artists/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    admin: true,
  });
}

export function adminRejectArtist(id) {
  return request(`/admin/artists/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    admin: true,
  });
}