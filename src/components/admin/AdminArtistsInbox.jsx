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

function normalizeArtistsPayload(payload) {
  // Our api.js tryMany returns backend JSON. We standardize here so UI never breaks.
  if (!payload) return [];
  if (Array.isArray(payload.artists)) return payload.artists;

  // Some backends might wrap as { data: { artists: [...] } }
  if (payload.data && Array.isArray(payload.data.artists)) return payload.data.artists;

  // Some might return { items: [...] }
  if (Array.isArray(payload.items)) return payload.items;

  return [];
}

export default function AdminArtistsInbox() {
  const [status, setStatus] = useState("pending"); // pending | active | rejected
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState("");
  const [error, setError] = useState("");
  const [artists, setArtists] = useState([]);

  const canSearch = useMemo(() => safeText(q).trim().length >= 0, [q]);

  async function load() {
    if (!canSearch) return;

    setLoading(true);
    setError("");

    try {
      // Our api.js adminListArtists() currently accepts either params OR status;
      // we pass status plus query as params to be future-proof.
      const res = await api.adminListArtists({ status, query: safeText(q).trim() });
      setArtists(normalizeArtistsPayload(res));
    } catch (e) {
      setArtists([]);
      setError(safeText(e?.message) || "Failed to load artists (admin).");
    } finally {
      setLoading(false);
    }
  }

  async function approveArtist(id) {
    const aid = safeText(id);
    if (!aid) return;

    setActingId(aid);
    setError("");

    try {
      await api.adminApproveArtist(aid, "Approved via Admin UI");
      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Approve failed.");
    } finally {
      setActingId("");
    }
  }

  async function rejectArtist(id) {
    const aid = safeText(id);
    if (!aid) return;

    const note = prompt("Rejection note (optional):", "Rejected via Admin UI") || "";
    setActingId(aid);
    setError("");

    try {
      await api.adminRejectArtist(aid, note);
      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Reject failed.");
    } finally {
      setActingId("");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div style={{ marginTop: 14 }}>
      <Card>
        <div style={{ fontWeight: 900, fontSize: 24 }}>Artists Inbox</div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          Approve / Reject artist submissions • Hoppscotch optional
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <TabBtn active={status === "pending"} onClick={() => setStatus("pending")}>
            Pending
          </TabBtn>
          <TabBtn active={status === "active"} onClick={() => setStatus("active")}>
            Active
          </TabBtn>
          <TabBtn active={status === "rejected"} onClick={() => setStatus("rejected")}>
            Rejected
          </TabBtn>
        </div>

        <div style={{ marginTop: 14 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (name, genre, location)…"
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
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <ActionBtn onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </ActionBtn>
        </div>

        {error ? (
          <div style={{ marginTop: 12, opacity: 0.9, color: "#ffb3b3" }}>{error}</div>
        ) : null}
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Results</div>

        {loading ? <div style={{ marginTop: 12, opacity: 0.8 }}>Loading…</div> : null}

        {!loading && (!artists || artists.length === 0) ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>No artists found.</div>
        ) : null}

        {!loading && artists && artists.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {artists.map((a) => {
              const id = safeText(a?.id || a?._id || a?.slug);
              const name = safeText(a?.name || "Unnamed Artist");
              const genre = safeText(a?.genre || "");
              const location = safeText(a?.location || "");
              const bio = safeText(a?.bio || "");
              const s = safeText(a?.status || status);

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
                      <div style={{ fontWeight: 900, fontSize: 18 }}>{name}</div>
                      <div style={{ opacity: 0.8, marginTop: 6 }}>
                        {genre} {genre && location ? "•" : ""} {location}{" "}
                        <b>{s ? `• ${s}` : ""}</b>
                      </div>
                      {bio ? (
                        <div style={{ opacity: 0.9, marginTop: 10, lineHeight: 1.45 }}>
                          {bio.slice(0, 220)}
                          {bio.length > 220 ? "…" : ""}
                        </div>
                      ) : null}

                      <div style={{ opacity: 0.65, marginTop: 10, fontSize: 12 }}>
                        ID: <b>{id || "(missing id)"}</b>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                      {status === "pending" ? (
                        <>
                          <ActionBtn
                            variant="primary"
                            onClick={() => approveArtist(id)}
                            disabled={!id || actingId === id}
                          >
                            {actingId === id ? "Approving…" : "Approve"}
                          </ActionBtn>

                          <ActionBtn
                            variant="danger"
                            onClick={() => rejectArtist(id)}
                            disabled={!id || actingId === id}
                          >
                            {actingId === id ? "Rejecting…" : "Reject"}
                          </ActionBtn>
                        </>
                      ) : null}

                      {status !== "pending" ? (
                        <ActionBtn onClick={() => alert("This view is read-only for now.")}>
                          View
                        </ActionBtn>
                      ) : null}
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