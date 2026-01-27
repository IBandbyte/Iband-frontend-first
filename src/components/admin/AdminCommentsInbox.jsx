import { useEffect, useMemo, useState } from "react";
import { api, API_BASE } from "../../services/api";

const STATUSES = ["pending", "approved", "hidden", "rejected"];

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 999,
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

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      value={value}
      type={type}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "12px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.25)",
        color: "white",
        outline: "none",
        fontSize: 15,
      }}
    />
  );
}

function SmallBtn({ children, onClick, variant = "soft", disabled }) {
  const styles = {
    soft: {
      background: "rgba(255,255,255,0.08)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.12)",
    },
    primary: {
      background:
        "linear-gradient(90deg, rgba(154,74,255,0.95), rgba(255,147,43,0.95))",
      color: "black",
      border: "1px solid rgba(255,255,255,0.12)",
    },
    danger: {
      background: "rgba(255,80,80,0.15)",
      color: "#ffd0d0",
      border: "1px solid rgba(255,80,80,0.35)",
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 14,
        padding: "10px 12px",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

export default function AdminCommentsInbox() {
  const [adminKey, setAdminKey] = useState(api.getAdminKey());
  const [status, setStatus] = useState("pending");
  const [artistId, setArtistId] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);

  const [flagCode, setFlagCode] = useState("spam");
  const [flagReason, setFlagReason] = useState("");

  const [noteApprove, setNoteApprove] = useState("Approved for display");
  const [noteHidden, setNoteHidden] = useState("Hidden by admin");
  const [noteRejected, setNoteRejected] = useState("Rejected by admin");

  const canUseAdmin = useMemo(() => safeText(adminKey).trim().length > 0, [adminKey]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      // ensure api uses latest admin key
      api.setAdminKey(adminKey);

      const res = await api.adminListComments({
        status,
        artistId: safeText(artistId).trim() || undefined,
        flagged: flaggedOnly || undefined,
      });

      setComments(Array.isArray(res?.comments) ? res.comments : []);
    } catch (e) {
      setComments([]);
      setError(safeText(e?.message) || "Failed to load admin comments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // auto-refresh when filters change (only if admin key present)
    if (canUseAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, flaggedOnly]);

  async function patchStatus(id, nextStatus, note) {
    setWorkingId(id);
    setError("");
    try {
      api.setAdminKey(adminKey);

      await api.adminPatchComment(id, {
        status: nextStatus,
        moderatedBy: "Admin",
        moderationNote: note,
      });

      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Failed to update comment status");
    } finally {
      setWorkingId("");
    }
  }

  async function del(id) {
    setWorkingId(id);
    setError("");
    try {
      api.setAdminKey(adminKey);
      await api.adminDeleteComment(id);
      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Failed to delete comment");
    } finally {
      setWorkingId("");
    }
  }

  async function flag(id) {
    setWorkingId(id);
    setError("");
    try {
      api.setAdminKey(adminKey);
      await api.adminFlagComment(id, {
        code: safeText(flagCode).trim() || "flag",
        reason: safeText(flagReason).trim(),
      });
      setFlagReason("");
      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Failed to flag comment");
    } finally {
      setWorkingId("");
    }
  }

  async function clearFlags(id) {
    setWorkingId(id);
    setError("");
    try {
      api.setAdminKey(adminKey);
      await api.adminClearFlags(id);
      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Failed to clear flags");
    } finally {
      setWorkingId("");
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px", color: "#fff" }}>
      <h1 style={{ fontSize: 46, margin: 0, letterSpacing: -1 }}>Admin · Comments Inbox</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>Backend: {API_BASE}</p>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Admin Key</div>
        <div style={{ marginTop: 10 }}>
          <Input
            value={adminKey}
            onChange={(v) => {
              setAdminKey(v);
              api.setAdminKey(v);
            }}
            placeholder="Paste x-admin-key here (stored locally)"
            type="password"
          />
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <SmallBtn
            variant="soft"
            onClick={() => {
              api.setAdminKey(adminKey);
              load();
            }}
            disabled={!canUseAdmin || loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </SmallBtn>

          <SmallBtn
            variant="danger"
            onClick={() => {
              api.clearAdminKey();
              setAdminKey("");
              setComments([]);
            }}
          >
            Clear Saved Key
          </SmallBtn>

          {!canUseAdmin ? (
            <span style={{ opacity: 0.75 }}>
              Add your admin key to enable moderation.
            </span>
          ) : (
            <span style={{ opacity: 0.75 }}>
              Key stored in this browser only.
            </span>
          )}
        </div>

        {error ? <div style={{ marginTop: 12, color: "#ffb3b3" }}>{error}</div> : null}
      </Card>

      <Card>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {STATUSES.map((s) => (
            <Pill key={s} active={status === s} onClick={() => setStatus(s)}>
              {s.toUpperCase()}
            </Pill>
          ))}

          <div style={{ flex: 1 }} />

          <label style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.9 }}>
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => setFlaggedOnly(e.target.checked)}
            />
            Flagged only
          </label>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Filter by Artist ID (optional)</div>
            <Input
              value={artistId}
              onChange={(v) => setArtistId(v)}
              placeholder="e.g. demo"
            />
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <SmallBtn
                variant="soft"
                onClick={() => {
                  if (!canUseAdmin) return;
                  load();
                }}
                disabled={!canUseAdmin || loading}
              >
                Apply Filter
              </SmallBtn>

              <SmallBtn
                variant="soft"
                onClick={() => {
                  setArtistId("");
                  if (canUseAdmin) load();
                }}
                disabled={loading}
              >
                Clear Filter
              </SmallBtn>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Flag tools (per comment)</div>
            <div style={{ display: "grid", gap: 10 }}>
              <Input value={flagCode} onChange={setFlagCode} placeholder="Flag code (e.g. spam)" />
              <Input value={flagReason} onChange={setFlagReason} placeholder="Reason (optional)" />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Results</div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          {loading ? "Loading…" : `${comments.length} comment(s)`}
        </div>

        {!loading && comments.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.75 }}>No comments in this state.</div>
        ) : null}

        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {comments.map((c) => {
            const id = safeText(c?.id);
            const flags = Array.isArray(c?.flags) ? c.flags : [];
            const isWorking = workingId === id;

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
                  <div style={{ fontWeight: 900 }}>
                    {safeText(c?.author || "Anonymous")}
                    <span style={{ opacity: 0.75, fontWeight: 800 }}>
                      {" "}
                      → {safeText(c?.artistId)}
                    </span>
                  </div>
                  <div style={{ opacity: 0.6, fontSize: 12 }}>
                    {c?.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                <div style={{ marginTop: 10, opacity: 0.95, lineHeight: 1.45 }}>
                  {safeText(c?.text)}
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ opacity: 0.8 }}>
                    Status: <b>{safeText(c?.status)}</b>
                  </span>
                  <span style={{ opacity: 0.8 }}>
                    ID: <b>{id}</b>
                  </span>
                </div>

                {flags.length > 0 ? (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 14,
                      border: "1px solid rgba(255,147,43,0.35)",
                      background: "rgba(255,147,43,0.10)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>Flags ({flags.length})</div>
                    <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                      {flags.slice(0, 5).map((f, idx) => (
                        <div key={`${id}-flag-${idx}`} style={{ opacity: 0.9, fontSize: 13 }}>
                          • <b>{safeText(f?.code)}</b> {safeText(f?.reason)}
                          <span style={{ opacity: 0.7 }}>
                            {" "}
                            {f?.at ? `(${new Date(f.at).toLocaleString()})` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {safeText(c?.status) !== "approved" ? (
                    <SmallBtn
                      variant="primary"
                      disabled={isWorking || !canUseAdmin}
                      onClick={() => patchStatus(id, "approved", noteApprove)}
                    >
                      {isWorking ? "Working…" : "Approve"}
                    </SmallBtn>
                  ) : null}

                  {safeText(c?.status) !== "hidden" ? (
                    <SmallBtn
                      variant="soft"
                      disabled={isWorking || !canUseAdmin}
                      onClick={() => patchStatus(id, "hidden", noteHidden)}
                    >
                      {isWorking ? "Working…" : "Hide"}
                    </SmallBtn>
                  ) : null}

                  {safeText(c?.status) !== "rejected" ? (
                    <SmallBtn
                      variant="soft"
                      disabled={isWorking || !canUseAdmin}
                      onClick={() => patchStatus(id, "rejected", noteRejected)}
                    >
                      {isWorking ? "Working…" : "Reject"}
                    </SmallBtn>
                  ) : null}

                  <SmallBtn
                    variant="soft"
                    disabled={isWorking || !canUseAdmin}
                    onClick={() => flag(id)}
                  >
                    {isWorking ? "Working…" : "Flag"}
                  </SmallBtn>

                  {flags.length > 0 ? (
                    <SmallBtn
                      variant="soft"
                      disabled={isWorking || !canUseAdmin}
                      onClick={() => clearFlags(id)}
                    >
                      {isWorking ? "Working…" : "Clear Flags"}
                    </SmallBtn>
                  ) : null}

                  <SmallBtn
                    variant="danger"
                    disabled={isWorking || !canUseAdmin}
                    onClick={() => del(id)}
                  >
                    {isWorking ? "Working…" : "Delete"}
                  </SmallBtn>
                </div>

                <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>
                  Notes:
                  <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                    <Input value={noteApprove} onChange={setNoteApprove} placeholder="Approve note" />
                    <Input value={noteHidden} onChange={setNoteHidden} placeholder="Hide note" />
                    <Input value={noteRejected} onChange={setNoteRejected} placeholder="Reject note" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}