// Central API service for iBand frontend
// Single source of truth for all backend calls

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://iband-backend-first-1.onrender.com';

// ---------- helpers ----------

async function handleResponse(response) {
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || `API error ${response.status}`
    );
  }

  return data;
}

// ---------- public API ----------

export async function fetchArtists() {
  const res = await fetch(`${API_BASE_URL}/artists`);
  return handleResponse(res);
}

export async function fetchArtistById(id) {
  const res = await fetch(`${API_BASE_URL}/artists/${id}`);
  return handleResponse(res);
}

export async function voteForArtist(id) {
  const res = await fetch(`${API_BASE_URL}/artists/${id}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse(res);
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE_URL}/api/admin/stats`);
  return handleResponse(res);
}

// ---------- admin (future-safe) ----------

export async function adminCleanup(adminKey) {
  const res = await fetch(`${API_BASE_URL}/admin/cleanup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({}),
  });

  return handleResponse(res);
}