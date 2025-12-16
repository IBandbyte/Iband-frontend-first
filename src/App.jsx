import { useEffect, useState } from "react";
import { api } from "./services/api";

export default function App() {
  const [health, setHealth] = useState(null);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const h = await api.health();
      setHealth(h);

      const a = await api.listArtists();
      setArtists(a.artists || a || []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>iBandbyte</h1>

      {loading && <p>Loading…</p>}
      {error && <p style={styles.error}>{error}</p>}

      {health && (
        <p style={styles.health}>
          Backend status: <strong>ONLINE</strong>
        </p>
      )}

      <button onClick={load} style={styles.button}>
        Refresh
      </button>

      <ul style={styles.list}>
        {artists.map((a) => (
          <li key={a.id || a._id} style={styles.card}>
            <strong>{a.name}</strong>
            <div style={styles.meta}>{a.genre}</div>
            <div>Votes: {a.votes ?? 0}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  page: {
    padding: 24,
    fontFamily: "system-ui, sans-serif",
    background: "#0f0f0f",
    minHeight: "100vh",
    color: "#fff",
  },
  title: {
    fontSize: 32,
    marginBottom: 12,
  },
  health: {
    color: "#7CFF7C",
  },
  error: {
    color: "#ff7c7c",
  },
  button: {
    margin: "12px 0",
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(90deg,#6a11cb,#ff6600)",
    color: "#fff",
    cursor: "pointer",
  },
  list: {
    listStyle: "none",
    padding: 0,
  },
  card: {
    background: "#161616",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  meta: {
    opacity: 0.7,
    fontSize: 14,
  },
};