// lib/apiClient.ts
// Centralised client for talking to the iBand backend on Render.
// Uses NEXT_PUBLIC_API_URL so it works in dev and on Vercel.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://iband-backend-first-1.onrender.com/api";

/**
 * Helper to safely parse JSON and throw nice errors.
 */
async function handleResponse(res: Response) {
  const rawText = await res.text();
  let data: any = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      // Not valid JSON, keep the raw text
      data = rawText;
    }
  }

  if (!res.ok) {
    const message =
      (data &&
        (data.message ||
          data.error ||
          (typeof data === "string" ? data : null))) ||
      `Request failed with status ${res.status}`;

    throw new Error(message);
  }

  return data;
}

/**
 * Simple health check: GET /
 * (You might not use this in the UI, but it's handy for debugging.)
 */
export async function pingBackend() {
  const res = await fetch(`${API_BASE}/`, {
    method: "GET",
  });

  return handleResponse(res);
}

/**
 * Public: GET /api/artists
 * Returns { success, count, artists: [...] }
 */
export async function fetchArtists() {
  const res = await fetch(`${API_BASE}/artists`, {
    method: "GET",
    // You can add cache: "no-store" if you want always-fresh
  });

  return handleResponse(res);
}

/**
 * Public: GET /api/artists/:id
 * Returns { success, artist }
 */
export async function fetchArtistById(id: string | number) {
  const res = await fetch(`${API_BASE}/artists/${id}`, {
    method: "GET",
  });

  return handleResponse(res);
}

/**
 * Public: POST /api/votes/:artistId
 * Body: (none)
 * Returns { success, artistId, votes }
 */
export async function voteForArtist(artistId: string | number) {
  const res = await fetch(`${API_BASE}/votes/${artistId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return handleResponse(res);
}

/**
 * Public: POST /api/comments/:artistId
 * Body: { user, text }
 * Returns { success, comment }
 */
export async function createComment(
  artistId: string | number,
  payload: { user: string; text: string }
) {
  const res = await fetch(`${API_BASE}/comments/${artistId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

/**
 * Public: GET /api/comments/:artistId
 * Returns { success, artistId, count, comments: [...] }
 */
export async function fetchComments(artistId: string | number) {
  const res = await fetch(`${API_BASE}/comments/${artistId}`, {
    method: "GET",
  });

  return handleResponse(res);
}