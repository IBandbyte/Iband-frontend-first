import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function Card({ children }) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.35)",
        boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
}

function TabBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 16,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(154,74,255,0.25)" : "rgba(255,255,255,0.08)",
        color: "white",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function ActionBtn({ children, onClick, variant = "soft", disabled }) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  const bg = isPrimary
    ? "linear-gradient(90deg, rgba(154,74,255,0.95), rgba(255,147,43,0.95))"
    : isDanger
    ? "rgba(255,90,90,0.20)"
    : "rgba(255,255,255,0.08)";

  const color = isPrimary ? "black" : "white";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 16,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: bg,
        color,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

function normalizeCommentsPayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.comments)) return payload.comments;
  if (payload.data && Array.isArray(payload.data.comments)) return payload.data.comments;
  if (payload.data && Array.isArray(payload.data.items)) return payload.data.items;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function parseFlags(flags) {
  if (!Array.isArray(flags) || flags.length === 0) return [];
  return flags
    .map((f) => ({
      code: safeText(f?.code || ""),
      reason: safeText(f?.reason || ""),
      at: safeText(f?.at || ""),
    }))
    .filter((f) => f.code || f.reason || f.at);
}

export default function AdminCommentsInbox() {
  const [status, setStatus] = useState("pending"); // pending | approved | hidden | rejected
  const [q, setQ] = useState(""); // search within author/text (client-side filter)
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState("");
  const [error, setError] = useState("");

  const [comments, setComments] = useState([]);

  const filtered = useMemo(() => {
    const term = safeText(q).trim().toLowerCase();
    const rows = Array.isArray(comments) ? comments : [];

    return rows.filter((c) => {
      const author = safeText(c?.author || c?.name || "").toLowerCase();
      const text = safeText(c?.text || "").toLowerCase();
      const flags = parseFlags(c?.flags);

      const termOk = !term || author.includes(term) || text.includes(term);
      const flaggedOk = !flaggedOnly || flags.length > 0;

      return termOk && flaggedOk;
    });
  }, [comments, q, flaggedOnly]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      // If backend supports flagged=true, api.js should pass it through (safe if ignored).
      const res = await api.adminListComments(status, { flagged: flaggedOnly });
      setComments(normalizeCommentsPayload(res));
    } catch (e) {
      setComments([]);
      setError(safeText(e?.message) || "Failed to load comments (admin).");
    } finally {
      setLoading(false);
    }
  }

  async function patchStatus(id, nextStatus, note) {
    const cid = safeText(id);
    if (!cid) return;

    setActingId(cid);
    setError("");

    try {
      // Prefer direct PATCH endpoint (canonical backend)
      if (typeof api.adminPatchComment === "function") {
        await api.adminPatchComment(cid, {
          status: nextStatus,
          moderatedBy: "Admin",
          moderationNote: safeText(note),
        });
      } else {
        // Fallback to older generic helper if present
        if (typeof api.adminModerateComment === "function") {
          const action =
            nextStatus === "approved"
              ? "approve"
              : nextStatus === "hidden"
              ? "hide"
              : nextStatus === "rejected"
              ? "reject"
              : "set";
          await api.adminModerateComment(cid, action, safeText(note));
        } else {
          // If neither exists, throw clear error.
          throw new Error("Admin comment moderation API is missing (api.js).");
        }
      }

      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Moderation failed.");
    } finally {
      setActingId("");
    }
  }

  async function deleteComment(id) {
    const cid = safeText(id);
    if (!cid) return;

    const ok = window.confirm("Delete this comment permanently?");
    if (!ok) return;

    setActingId(cid);
    setError("");

    try {
      if (typeof api.adminDeleteComment === "function") {
        await api.adminDeleteComment(cid);
      } else {
        throw new Error("Admin delete comment API is missing (api.js).");
      }

      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Delete failed.");
    } finally {
      setActingId("");
    }
  }

  async function flagComment(id) {
    const cid = safeText(id);
    if (!cid) return;

    const code = prompt("Flag code (e.g. spam, abuse):", "spam") || "flag";
    const reason = prompt("Flag reason (optional):", "Flagged via Admin UI") || "";

    setActingId(cid);
    setError("");

    try {
      if (typeof api.adminFlagComment === "function") {
        await api.adminFlagComment(cid, { code, reason });
      } else {
        throw new Error("Admin flag comment API is missing (api.js).");
      }

      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Flag failed.");
    } finally {
      setActingId("");
    }
  }

  async function clearFlags(id) {
    const cid = safeText(id);
    if (!cid) return;

    setActingId(cid);
    setError("");

    try {
      if (typeof api.adminClearCommentFlags === "function") {
        await api.adminClearCommentFlags(cid);
      } else {
        throw new Error("Admin clear flags API is missing (api.js).");
      }

      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Clear flags failed.");
    } finally {
      setActingId("");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, flaggedOnly]);

  return (
    <div style={{ marginTop: 14 }}>
      <Card>
        <div style={{ fontWeight: 900, fontSize: 24 }}>Comments Inbox</div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          Moderate pending/approved/hidden/rejected • flag + clear flags • delete
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["pending", "approved", "hidden", "rejected"].map((s) => (
            <TabBtn key={s} active={status === s} onClick={() => setStatus(s)}>
              {s.toUpperCase()}
            </TabBtn>
          ))}
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search author/text (client-side)…"
            style={{
              width: "100%",
              padding: "14px 14px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              color: "white",
              outline: "none",
              fontSize: 16,
            }}
          />

          <label style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.9 }}>
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => setFlaggedOnly(Boolean(e.target.checked))}
            />
            Show flagged only
          </label>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ActionBtn onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </ActionBtn>
          </div>
        </div>

        {error ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>{error}</div>
        ) : null}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Results</div>

        {loading ? <div style={{ marginTop: 12, opacity: 0.8 }}>Loading…</div> : null}

        {!loading && filtered.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>No comments found.</div>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {filtered.map((c) => {
              const id = safeText(c?.id || c?._id);
              const author = safeText(c?.author || c?.name || "Anonymous");
              const text = safeText(c?.text || "");
              const artistId = safeText(c?.artistId || "");
              const s = safeText(c?.status || status);
              const flags = parseFlags(c?.flags);

              return (
                <div
                  key={id || Math.random()}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>
                        {author}{" "}
                        <span style={{ opacity: 0.7 }}>
                          → {artistId ? `artist: ${artistId}` : "artist: (missing)"}
                        </span>
                      </div>

                      <div style={{ opacity: 0.85, marginTop: 10, lineHeight: 1.45 }}>{text}</div>

                      <div style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
                        Status: <b>{s || "(missing)"}</b> • ID: <b>{id || "(missing)"}</b>
                      </div>

                      {flags.length > 0 ? (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontWeight: 900, fontSize: 13, opacity: 0.9 }}>
                            Flags ({flags.length})
                          </div>
                          <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                            {flags.slice(0, 4).map((f, idx) => (
                              <div
                                key={`${id}-flag-${idx}`}
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: 12,
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  background: "rgba(255,255,255,0.06)",
                                  fontSize: 12,
                                  opacity: 0.9,
                                }}
                              >
                                <b>{f.code || "flag"}</b>
                                {f.reason ? ` • ${f.reason}` : ""}
                                {f.at ? ` • ${f.at}` : ""}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                      {s !== "approved" ? (
                        <ActionBtn
                          variant="primary"
                          onClick={() => patchStatus(id, "approved", "Approved via Admin UI")}
                          disabled={!id || actingId === id}
                        >
                          {actingId === id ? "Working…" : "Approve"}
                        </ActionBtn>
                      ) : null}

                      {s !== "hidden" ? (
                        <ActionBtn
                          onClick={() => patchStatus(id, "hidden", "Hidden via Admin UI")}
                          disabled={!id || actingId === id}
                        >
                          {actingId === id ? "Working…" : "Hide"}
                        </ActionBtn>
                      ) : null}

                      {s !== "rejected" ? (
                        <ActionBtn
                          variant="danger"
                          onClick={() =>
                            patchStatus(
                              id,
                              "rejected",
                              prompt("Rejection note (optional):", "Rejected via Admin UI") || ""
                            )
                          }
                          disabled={!id || actingId === id}
                        >
                          {actingId === id ? "Working…" : "Reject"}
                        </ActionBtn>
                      ) : null}

                      <ActionBtn onClick={() => flagComment(id)} disabled={!id || actingId === id}>
                        {actingId === id ? "Working…" : "Flag"}
                      </ActionBtn>

                      <ActionBtn onClick={() => clearFlags(id)} disabled={!id || actingId === id}>
                        {actingId === id ? "Working…" : "Clear Flags"}
                      </ActionBtn>

                      <ActionBtn
                        variant="danger"
                        onClick={() => deleteComment(id)}
                        disabled={!id || actingId === id}
                      >
                        {actingId === id ? "Working…" : "Delete"}
                      </ActionBtn>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </Card>
    </div>
  );
}