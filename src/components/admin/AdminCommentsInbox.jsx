import { useEffect, useState } from "react";

/**
 * AdminCommentsInbox.jsx
 * iBand — Admin Comments Inbox (Option G3)
 *
 * Assumptions:
 * - Backend base URL is configured via VITE_API_URL
 * - ADMIN_KEY is provided manually for now (later via auth)
 *
 * This file is UI + fetch logic ONLY.
 * No tests. No deploy. No routing assumptions.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:10000";

export default function AdminCommentsInbox() {
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState("pending");
  const [artistId, setArtistId] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // TEMP: manual admin key (replace later)
  const ADMIN_KEY = localStorage.getItem("ADMIN_KEY") || "";

  async function fetchComments() {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (artistId) params.append("artistId", artistId);
    if (flaggedOnly) params.append("flagged", "true");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/comments?${params.toString()}`,
        {
          headers: {
            "x-admin-key": ADMIN_KEY,
          },
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setComments(data.comments || []);
    } catch (err) {
      setError(err.message || "Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComments();
  }, [status, artistId, flaggedOnly]);

  async function patchComment(id, body) {
    await fetch(`${API_BASE}/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY,
      },
      body: JSON.stringify(body),
    });
    fetchComments();
  }

  async function deleteComment(id) {
    if (!confirm("Delete this comment permanently?")) return;
    await fetch(`${API_BASE}/api/admin/comments/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-key": ADMIN_KEY,
      },
    });
    fetchComments();
  }

  async function flagComment(id) {
    await fetch(`${API_BASE}/api/admin/comments/${id}/flag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY,
      },
      body: JSON.stringify({
        code: "admin-flag",
        reason: "Flagged by admin",
      }),
    });
    fetchComments();
  }

  async function clearFlags(id) {
    await fetch(`${API_BASE}/api/admin/comments/${id}/flags/clear`, {
      method: "POST",
      headers: {
        "x-admin-key": ADMIN_KEY,
      },
    });
    fetchComments();
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin · Comments Inbox</h2>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="hidden">Hidden</option>
          <option value="rejected">Rejected</option>
        </select>

        <input
          placeholder="Artist ID"
          value={artistId}
          onChange={(e) => setArtistId(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
          />{" "}
          Flagged only
        </label>

        <button onClick={fetchComments}>Refresh</button>
      </div>

      {loading && <p>Loading comments…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && comments.length === 0 && <p>No comments found.</p>}

      {/* Table */}
      {comments.length > 0 && (
        <table width="100%" cellPadding={8} border="1">
          <thead>
            <tr>
              <th>Author</th>
              <th>Comment</th>
              <th>Artist</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((c) => (
              <tr key={c.id}>
                <td>{c.author}</td>
                <td>{c.text}</td>
                <td>{c.artistId}</td>
                <td>{c.status}</td>
                <td>{c.flags?.length || 0}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => patchComment(c.id, { status: "approved", moderatedBy: "Admin" })}>
                    Approve
                  </button>
                  <button onClick={() => patchComment(c.id, { status: "hidden", moderatedBy: "Admin" })}>
                    Hide
                  </button>
                  <button onClick={() => patchComment(c.id, { status: "rejected", moderatedBy: "Admin" })}>
                    Reject
                  </button>
                  <button onClick={() => flagComment(c.id)}>Flag</button>
                  <button onClick={() => clearFlags(c.id)}>Clear Flags</button>
                  <button onClick={() => deleteComment(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}