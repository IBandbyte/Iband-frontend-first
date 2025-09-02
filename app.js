// iBand frontend — single-file version (drop-in replacement for app.js)
// - Fetches artists from your backend
// - Caches results for 10 mins
// - Search + Refresh
// - Graceful offline fallback

(() => {
  // If index.html sets window.API_URL, use it; otherwise default to your live backend
  const ENDPOINT =
    (typeof window !== "undefined" && window.API_URL) ||
    "https://iband-backend-first-2.onrender.com/artists";

  // Grab elements (these IDs should already exist in your index.html)
  const artistsEl = document.getElementById("artists");
  const searchEl = document.getElementById("search");
  const refreshBtn = document.getElementById("refresh");
  const statusEl = document.getElementById("status") || { textContent: "", dataset: {} };

  // Simple cache (localStorage) – 10 minutes
  const CACHE_KEY = "iband:artists:v1";
  const CACHE_TTL_MS = 10 * 60 * 1000;

  const state = { all: [], q: "" };

  function setStatus(msg, type = "info") {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.dataset.type = type;
  }

  function getCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL_MS) return null;
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  }

  function setCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch {}
  }

  async function fetchArtists({ noCache = false } = {}) {
    if (!noCache) {
      const cached = getCache();
      if (cached) {
        state.all = cached;
        renderFiltered();
        setStatus("Loaded from cache • tap Refresh to re-fetch");
        return;
      }
    }

    setStatus("Loading artists…");
    try {
      const res = await fetch(ENDPOINT, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Normalize to { name, genre }
      const normalized = (Array.isArray(data) ? data : []).map((a) => ({
        name: a?.name ?? "Unknown Artist",
        genre: a?.genre ?? "No genre set",
      }));

      // De-dupe by name (case-insensitive)
      const map = new Map();
      normalized.forEach((a) => map.set((a.name || "").toLowerCase(), a));
      const unique = [...map.values()];

      state.all = unique;
      setCache(unique);
      renderFiltered();
      setStatus(`Loaded ${unique.length} artists`);
    } catch (err) {
      console.error(err);
      if (!state.all.length) {
        // Fallback sample for first load if backend unreachable
        state.all = [
          { name: "Aria Nova", genre: "No genre set" },
          { name: "Neon Harbor", genre: "No genre set" },
          { name: "Stone & Sparrow", genre: "No genre set" },
          { name: "Bad Bunny", genre: "Latin trap" },
          { name: "Billie Eilish", genre: "Alt pop" },
          { name: "Drake", genre: "Hip hop" },
        ];
        renderFiltered();
        setStatus("Offline fallback shown (backend unreachable)", "warn");
      } else {
        setStatus("Couldn’t refresh — showing cached results", "warn");
      }
    }
  }

  function renderArtists(list) {
    if (!artistsEl) return;
    if (!list.length) {
      artistsEl.innerHTML = `<div class="empty">No artists found</div>`;
      return;
    }
    artistsEl.innerHTML = list
      .map(
        (a) => `
        <article class="card">
          <div class="avatar" aria-hidden="true">${(a.name || "?").charAt(0)}</div>
          <h3 class="name">${a.name}</h3>
          <p class="genre">${a.genre || "No genre set"}</p>
        </article>`
      )
      .join("");
  }

  function renderFiltered() {
    const q = (state.q || "").trim().toLowerCase();
    const filtered = !q
      ? state.all
      : state.all.filter(
          (a) =>
            (a.name || "").toLowerCase().includes(q) ||
            (a.genre || "").toLowerCase().includes(q)
        );
    renderArtists(filtered);
  }

  // Events (guard if elements don’t exist)
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      state.q = e.target.value || "";
      renderFiltered();
    });
  }
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => fetchArtists({ noCache: true }));
  }

  // Kickoff
  fetchArtists();
})();