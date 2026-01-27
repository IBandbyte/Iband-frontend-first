import { useEffect, useState } from "react";
import { api, API_BASE } from "../../services/api";

const STATUSES = ["pending", "active", "rejected"];

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

function Btn({ children, onClick, variant = "soft", disabled }) {
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

export default function AdminArtistsInbox() {
  const [adminKey, setAdminKey] = useState(api.getAdminKey());
  const [status, setStatus] = useState("pending");

  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [artists, setArtists] = useState([]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      api.setAdminKey(adminKey);

      const res = await api.adminListArtists(status);

      setArtists(Array.isArray(res?.artists) ? res.artists : []);
    } catch (e) {
      setArtists([]);
      setError(safeText(e?.message) || "Failed to load artists");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminKey) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function approve(id) {
    setWorkingId(id);
    setError("");

    try {
      api.setAdminKey(adminKey);
      await api.adminApproveArtist(id, "Approved by admin inbox ✅");
      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Approve failed");
    } finally {
      setWorkingId("");
    }
  }

  async function reject(id) {
    setWorkingId(id);
    setError("");

    try {
      api.setAdminKey(adminKey);
      await api.adminRejectArtist(id, "Rejected by admin inbox ❌");
      await load();
    } catch (e) {
      setError(safeText(e?.message) || "Reject failed");
    } finally {
      setWorkingId("");
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px", color: "#fff" }}>
      <h1 style={{ fontSize: 46, margin: 0 }}>Admin · Artists Inbox</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>Backend: {API_BASE}</p>

      <Card>
        <div style={{ fontWeight: 900 }}>Admin Key</div>
        <div style={{ marginTop: 10 }}>
          <Input
            value={adminKey}
            onChange={(v) => {
              setAdminKey(v);
              api.setAdminKey(v);
            }}
            placeholder="Paste x-admin-key here"
            type="password"
          />
        </div>

        {error ? <div style={{ marginTop: 12, color: "#ffb3b3" }}>{error}</div> : null}
      </Card>

      <Card>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {STATUSES.map((s) => (
            <Pill key={s} active={status === s} onClick={() => setStatus(s)}>
              {s.toUpperCase()}
            </Pill>
          ))}

          <div style={{ flex: 1 }} />

          <Btn variant="soft" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Btn>
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Artists</div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          {loading ? "Loading…" : `${artists.length} artist(s)`}
        </div>

        {artists.map((a) => {
          const id = safeText(a?.id);
          const isWorking = workingId === id;

          return (
            <div
              key={id}
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 18 }}>{safeText(a?.name)}</div>
              <div style={{ opacity: 0.8, marginTop: 4 }}>
                {safeText(a?.genre)} • {safeText(a?.location)}
              </div>

              <div style={{ marginTop: 10, opacity: 0.9 }}>
                {safeText(a?.bio).slice(0, 160)}
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {status !== "active" ? (
                  <Btn
                    variant="primary"
                    disabled={isWorking}
                    onClick={() => approve(id)}
                  >
                    {isWorking ? "Working…" : "Approve"}
                  </Btn>
                ) : null}

                {status !== "rejected" ? (
                  <Btn
                    variant="danger"
                    disabled={isWorking}
                    onClick={() => reject(id)}
                  >
                    {isWorking ? "Working…" : "Reject"}
                  </Btn>
                ) : null}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}