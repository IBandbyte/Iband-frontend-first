// src/services/api.js
// iBand Frontend API Client (ESM)
// - Public endpoints: /health, /artists, /comments (if present)
// - Admin endpoints: /admin/artists, /admin/stats, /admin/artists/:id/approve, /reject
//
// Admin key handling:
// - Stored in localStorage under "IBAND_ADMIN_KEY"
// - Sent as header "x-admin-key" ONLY for /admin/* calls

const DEFAULT_BASE =
  "https://iband-backend-first-1.onrender.com"; // safe fallback

const API_BASE =
  (import.meta?.env?.VITE_API_BASE_URL ||
    import.meta?.env?.VITE_API_URL ||
    "").trim() || DEFAULT_BASE;

function joinUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { success: false, error: "Invalid JSON response", raw: text };
  }

  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      `Request failed (${res.status} ${res.statusText})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

// ----------------------
// Admin Key Helpers
// ----------------------
export function getAdminKey() {
  try {
    return localStorage.getItem("IBAND_ADMIN_KEY") || "";
  } catch {
    return "";
  }
}

export function setAdminKey(key) {
  try {
    localStorage.setItem("IBAND_ADMIN_KEY", String(key || "").trim());
    return true;
  } catch {
    return false;
  }
}

export function clearAdminKey() {
  try {
    localStorage.removeItem("IBAND_ADMIN_KEY");
    return true;
  } catch {
    return false;
  }
}

function adminHeaders(extra = {}) {
  const key = getAdminKey().trim();
  return {
    "Content-Type": "application/json",
    ...(key ? { "x-admin-key": key } : {}),
    ...extra,
  };
}

// ----------------------
// Health
// ----------------------
export async function getHealth() {
  return fetchJson(joinUrl(API_BASE, "/health"), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
}

// ----------------------
// Artists (Public)
// ----------------------
export async function listArtists(params = {}) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }

  const url = joinUrl(
    API_BASE,
    `/artists${usp.toString() ? `?${usp.toString()}` : ""}`
  );

  return fetchJson(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
}

export async function getArtist(id) {
  const url = joinUrl(API_BASE, `/artists/${encodeURIComponent(String(id))}`);
  return fetchJson(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
}

export async function submitArtist(payload) {
  // For your current backend, POST /artists creates an artist.
  // If you want submissions to be "pending" by default, send status:"pending".
  const url = joinUrl(API_BASE, "/artists");
  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function voteArtist(id, amount = 1) {
  const url = joinUrl(
    API_BASE,
    `/artists/${encodeURIComponent(String(id))}/votes`
  );
  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
}

// ----------------------
// Admin (Moderation)
// ----------------------
export async function adminListArtists(params = {}) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }

  const url = joinUrl(
    API_BASE,
    `/admin/artists${usp.toString() ? `?${usp.toString()}` : ""}`
  );

  return fetchJson(url, {
    method: "GET",
    headers: adminHeaders(),
  });
}

export async function adminStats() {
  const url = joinUrl(API_BASE, "/admin/stats");
  return fetchJson(url, {
    method: "GET",
    headers: adminHeaders(),
  });
}

export async function adminApproveArtist(id) {
  const url = joinUrl(
    API_BASE,
    `/admin/artists/${encodeURIComponent(String(id))}/approve`
  );
  return fetchJson(url, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({}), // keep body valid for Hoppscotch-style servers
  });
}

export async function adminRejectArtist(id) {
  const url = joinUrl(
    API_BASE,
    `/admin/artists/${encodeURIComponent(String(id))}/reject`
  );
  return fetchJson(url, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({}),
  });
}

// ----------------------
// Export base (optional use in UI)
// ----------------------
export function getApiBase() {
  return API_BASE;
}