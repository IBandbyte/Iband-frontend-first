import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminCommentsInbox() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadComments() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/admin/comments", {
        headers: {
          "x-admin-key": import.meta.env.VITE_ADMIN_KEY,
        },
      });

      setComments(res.data.comments || []);
    } catch (err) {
      setError("Failed to load admin comments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, []);

  if (loading) return <p style={{ padding: 16 }}>Loading comments…</p>;
  if (error) return <p style={{ padding: 16, color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Admin Comments Inbox</h2>

      {comments.length === 0 && <p>No comments found.</p>}

      {comments.map((c) => (
        <div
          key={c.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <p><strong>Author:</strong> {c.author}</p>
          <p><strong>Artist:</strong> {c.artistId}</p>
          <p><strong>Status:</strong> {c.status}</p>
          <p>{c.text}</p>

          {c.flags?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong>Flags:</strong>
              <ul>
                {c.flags.map((f, i) => (
                  <li key={i}>
                    {f.code} — {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <small>
            Created: {new Date(c.createdAt).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
}