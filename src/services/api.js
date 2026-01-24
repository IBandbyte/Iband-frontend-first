// src/services/api.js
// iBand Frontend API Client (ESM)
// - Works on Vercel (Vite)
// - Supports admin header x-admin-key via localStorage
// - Uses VITE_API_BASE if set, otherwise stored API base, otherwise Render default
// - Canonical routes are /api/* with legacy fallback (non-/api) for older backends

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

  const stored =
    (typeof localStorage !== "undefined" && localStorage.getItem(LS_API_BASE)) ||
    "";

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

function ensureApiPrefix(path) {
  const p = String(path || "");
  if (!p.startsWith("/")) return ensureApiPrefix(`/${p}`);
  if (p.startsWith("/api/")) return p;
  if (p === "/api") return p;
  return `/api${p}`;
}

function looksLikeLegacyCandidate(path) {
  const p = String(path || "");
  return p.startsWith("/api/") || p === "/api";
}

function makeHeaders({ admin = false, json = false } = {}) {
  const h = {};
  if (json) h["Content-Type"] = "application/json";
  if (admin) {
    const k = getAdminKey();
    if (k) h["x-admin-key"] = k;
  }
  return h;
}

async function parseResponse(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

async function requestOnce(path, { method = "GET", body, admin = false } = {}) {
  const url = buildUrl(path);

  const hasBody = body !== undefined;
  const opts = {
    method,
    headers: makeHeaders({ admin, json: hasBody }),
  };

  if (hasBody) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await parseResponse(res);

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      (typeof data?.raw === "string" && data.raw.trim()) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Canonical: try /api/* first, if 404 then fallback to non-/api (legacy)
async function request(path, opts = {}) {
  const canonical = ensureApiPrefix(path);

  try {
    return await requestOnce(canonical, opts);
  } catch (err) {
    const is404 = Number(err?.status) === 404;
    const canFallback = is404 && looksLikeLegacyCandidate(canonical);
    if (!canFallback) throw err;

    const legacy = canonical.replace(/^\/api/, "") || "/";
    return await requestOnce(legacy, opts);
  }
}

/* -----------------------------
   Public
----------------------------- */

export function getHealth() {
  // canonical: /api/health (fallback: /health)
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
   Comments (Public)
----------------------------- */

export function createComment(payload) {
  // POST /api/comments
  return request("/comments", { method: "POST", body: payload });
}

export function listComments(params = {}) {
  // GET /api/comments?artistId=demo
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/comments?${qs}` : "/comments", { method: "GET" });
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

/* -----------------------------
   Admin Comments (Moderation)
----------------------------- */

export function adminListComments(params = {}) {
  // GET /api/admin/comments?status=pending
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `/admin/comments?${qs}` : "/admin/comments", {
    method: "GET",
    admin: true,
  });
}

export function adminUpdateComment(id, payload) {
  // PATCH /api/admin/comments/:id
  return request(`/admin/comments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    admin: true,
    body: payload,
  });
}

export function adminDeleteComment(id) {
  // DELETE /api/admin/comments/:id
  return request(`/admin/comments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    admin: true,
  });
}