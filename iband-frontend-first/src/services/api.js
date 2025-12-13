/**
 * iBand Frontend API Client
 * Single source of truth for backend communication
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://iband-backend-first-2.onrender.com";

/**
 * Generic request wrapper
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);

    const text = await res.text();
    let data;

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = text;
    }

    if (!res.ok) {
      throw new Error(
        data?.error || `Request failed with status ${res.status}`
      );
    }

    return data;
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
}

/* =========================
   Artists
========================= */

export async function getArtists() {
  return request("/artists");
}

export async function getArtistById(id) {
  return request(`/artists/${id}`);
}

export async function voteForArtist(id) {
  return request(`/artists/${id}/vote`, {
    method: "POST",
  });
}

/* =========================
   Health / Meta
========================= */

export async function getHealth() {
  return request("/health");
}

/* =========================
   Admin (future-safe)
========================= */

export async function adminCleanup(adminKey) {
  return request("/admin/cleanup", {
    method: "POST",
    headers: {
      "x-admin-key": adminKey,
    },
  });
}