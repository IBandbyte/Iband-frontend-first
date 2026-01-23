import { useEffect, useMemo, useState } from "react";
import {
  adminListComments,
  adminPatchComment,
  adminDeleteComment,
  getAdminKey,
  setAdminKey,
  clearAdminKey,
  getApiBase,
} from "../../services/api.js";

const STATUSES = ["pending", "approved", "hidden", "rejected"];

export default function AdminCommentsInbox() {
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [filter, setFilter] = useState("pending");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const apiBase = useMemo(() => getApiBase(), []);

  function loadStoredKey() {
    const k = getAdminKey();
    setAdminKeyInput(k || "");
  }

  async function refresh(status = filter) {
    try {
      setLoading(true);
      setError("");

      const data = await adminListComments({ status });
      setComments(data?.comments || []);
    } catch (e) {
      setComments([]);
      setError(String(e?.message || "Failed to load comments."));
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(id, status, note) {
    try {
      setBusyId(id);
      setError("");

      await adminPatchComment(id, {
        status,
        moderatedBy: "Admin",
        moderationNote: note || "",
      });

      await refresh(filter);
    } catch (e) {
      setError(String(e?.message || "Failed to update comment."));
    } finally {
      setBusyId("");
    }
  }

  async function remove(id) {
    try {
      setBusyId(id);
      setError("");

      await adminDeleteComment(id);
      await refresh(filter);
    } catch (e) {
      setError(String(e?.message || "Failed to delete comment."));
    } finally {
      setBusyId("");
    }
  }

  useEffect(() => {
    loadStoredKey();
    // Auto-load pending on first mount
    refresh("pending");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function onSaveKey() {
    setAdminKey(adminKeyInput);
    refresh(filter);
  }

  function onClearKey() {
    clearAdminKey();
    setAdminKeyInput("");
    refresh(filter);
  }

  return (
    <div style={{ padding: 20, color: "#fff" }}>
      <h2 style={{ margin: 0, marginBottom: 8 }}>Admin Moderation</h2>
      <p style={{ marginTop: 0, opacity: 0.8, fontSize: 14 }}>
        API: <span style={{ opacity: 0.9 }}>{apiBase}</span>
      </p>

      <div
        style={{
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 14,
          background: "rgba(0,0,0,0.35)",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
          Uses header <code>x-admin-key</code> (stored locally). If your backend has no{" "}
          <code>ADMIN_KEY</code> set, it allows requests (dev mode).
        </div>

        <input
          value={adminKeyInput}
          onChange={(e) => setAdminKeyInput(e.target.value)}
          placeholder="Admin key (x-admin-key)"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #333",
            background: "#0b0b0f",
            color: "#fff",
            outline: "none",
            marginBottom: 10,
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onSaveKey}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #3a2a60",
              background: "#2b0f4a",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Save Key
          </button>
          <button
            onClick={onClearKey}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #333",
              background: "#15151a",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Clear
          </button>
          <button
            onClick={() => refresh(filter)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #333",
              background: "#15151a",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(255,80,80,0.35)",
              background: "rgba(255,80,80,0.12)",
              color: "#ffd6d6",
            }}
          >
            {error}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #333",
              background: filter === s ? "#2b0f4a" : "#15151a",
              color: "#fff",
              fontWeight: 700,
              opacity: filter === s ? 1 : 0.85,
            }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? <p style={{ opacity: 0.85 }}>Loading…</p> : null}

      {!loading && comments.length === 0 ? (
        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: 14,
            background: "rgba(0,0,0,0.25)",
            opacity: 0.85,
          }}
        >
          No records.
        </div>
      ) : null}

      {comments.map((c) => {
        const isBusy = busyId === c.id;
        return (
          <div
            key={c.id}
            style={{
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              padding: 14,
              background: "rgba(0,0,0,0.25)",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 800 }}>
                {c.author || "Anonymous"}{" "}
                <span style={{ opacity: 0.6, fontWeight: 600 }}>→</span>{" "}
                <span style={{ opacity: 0.85, fontWeight: 700 }}>{c.artistId}</span>
              </div>
              <div style={{ opacity: 0.8, fontSize: 12 }}>Status: {c.status}</div>
            </div>

            <div style={{ marginTop: 10, lineHeight: 1.35 }}>{c.text}</div>

            {Array.isArray(c.flags) && c.flags.length > 0 ? (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
                Flags:{" "}
                {c.flags.map((f, idx) => (
                  <span key={idx} style={{ marginRight: 8 }}>
                    <code>{f.code}</code>
                    {f.reason ? ` (${f.reason})` : ""}
                  </span>
                ))}
              </div>
            ) : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {c.status !== "approved" ? (
                <button
                  disabled={isBusy}
                  onClick={() => setStatus(c.id, "approved", "Approved via admin inbox")}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #2f5a3a",
                    background: "#0f2b18",
                    color: "#fff",
                    fontWeight: 700,
                    opacity: isBusy ? 0.6 : 1,
                  }}
                >
                  Approve
                </button>
              ) : null}

              {c.status !== "hidden" ? (
                <button
                  disabled={isBusy}
                  onClick={() => setStatus(c.id, "hidden", "Hidden via admin inbox")}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #444",
                    background: "#15151a",
                    color: "#fff",
                    fontWeight: 700,
                    opacity: isBusy ? 0.6 : 1,
                  }}
                >
                  Hide
                </button>
              ) : null}

              {c.status !== "rejected" ? (
                <button
                  disabled={isBusy}
                  onClick={() => setStatus(c.id, "rejected", "Rejected via admin inbox")}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,140,60,0.35)",
                    background: "rgba(255,140,60,0.12)",
                    color: "#fff",
                    fontWeight: 700,
                    opacity: isBusy ? 0.6 : 1,
                  }}
                >
                  Reject
                </button>
              ) : null}

              <button
                disabled={isBusy}
                onClick={() => remove(c.id)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,80,80,0.35)",
                  background: "rgba(255,80,80,0.12)",
                  color: "#ffd6d6",
                  fontWeight: 800,
                  opacity: isBusy ? 0.6 : 1,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}