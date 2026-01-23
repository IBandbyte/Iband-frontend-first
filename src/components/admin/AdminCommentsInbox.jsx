import { useEffect, useState } from "react";

const API_BASE = "https://iband-backend-first-1.onrender.com";

export default function AdminCommentsInbox() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [error, setError] = useState(null);

  const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY;

  async function fetchComments(status) {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_BASE}/api/admin/comments?status=${status}`,
        {
          headers: {
            "x-admin-key": ADMIN_KEY,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load comments");

      setComments(data.comments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status, note) {
    await fetch(`${API_BASE}/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY,
      },
      body: JSON.stringify({
        status,
        moderatedBy: "Admin",
        moderationNote: note,
      }),
    });

    fetchComments(filter);
  }

  async function deleteComment(id) {
    await fetch(`${API_BASE}/api/admin/comments/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-key": ADMIN_KEY,
      },
    });

    fetchComments(filter);
  }

  useEffect(() => {
    fetchComments(filter);
  }, [filter]);

  return (
    <div style={{ padding: "20px", color: "#fff" }}>
      <h2>Admin · Comments Inbox</h2>

      <div style={{ marginBottom: "16px" }}>
        {["pending", "approved", "hidden", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              marginRight: "8px",
              padding: "6px 12px",
              background: filter === s ? "#7c3aed" : "#222",
              color: "#fff",
              border: "1px solid #444",
              cursor: "pointer",
            }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && <p>Loading comments…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && comments.length === 0 && (
        <p>No comments in this state.</p>
      )}

      {comments.map((c) => (
        <div
          key={c.id}
          style={{
            border: "1px solid #333",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "6px",
            background: "#111",
          }}
        >
          <p>
            <strong>{c.author}</strong> → <em>{c.artistId}</em>
          </p>
          <p>{c.text}</p>

          <small>Status: {c.status}</small>

          <div style={{ marginTop: "10px" }}>
            {c.status !== "approved" && (
              <button
                onClick={() =>
                  updateStatus(c.id, "approved", "Approved via admin inbox")
                }
                style={{ marginRight: "8px" }}
              >
                Approve
              </button>
            )}

            {c.status !== "hidden" && (
              <button
                onClick={() =>
                  updateStatus(c.id, "hidden", "Hidden via admin inbox")
                }
                style={{ marginRight: "8px" }}
              >
                Hide
              </button>
            )}

            <button
              onClick={() => deleteComment(c.id)}
              style={{ color: "red" }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}