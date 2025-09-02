// iBand frontend — full upgraded version
// - Fetches artists from backend
// - Cache with localStorage
// - Search + Refresh
// - Offline fallback

(() => {
  const ENDPOINT =
    (typeof window !== "undefined" && window.API_URL) ||
    "https://iband-backend-first-2.onrender.com/artists";

  const artistsEl = document.getElementById("artists");
  const searchEl = document.getElementById("search");
  const refreshBtn = document.getElementById("refresh");
  const statusEl = document.getElementById("status");

  const CACHE_KEY = "iband:artists:v1";
  const CACHE_TTL = 10 * 60 * 1000; // 10 mins
  const state = { all: [], q: "" };

  function setStatus(msg, type = "info") {
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.dataset.type = type;
    }
  }

  function getCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) return null;
      return data;
    } catch {
      return null;
    }
  }

  function setCache(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  }

  async function fetchArtists({ noCache = false } = {}) {
    if (!noCache) {
      const cached = getCache();
      if (cached) {
        state.all = cached;
        renderFiltered();
        setStatus("Loaded from cache");
        return;
      }
    }

    setStatus("Loading…");
    try {
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const normalized = data.map((a) => ({
        name: a?.name ?? "Unknown",
        genre: a?.genre ?? "No genre set",
      }));

      const map = new Map();
      normalized.forEach((a) => map.set(a.name.toLowerCase(), a));
      const unique = [...map.values()];

      state.all = unique;
      setCache(unique);
      renderFiltered();
      setStatus(`Loaded ${unique.length} artists`);
    } catch (err) {
      console.error(err);
      if (!state.all.length) {
        state.all = [
          { name: "Aria Nova", genre: "No genre set" },
          { name: "Neon Harbor", genre: "No genre set" },
          { name: "Stone & Sparrow", genre: "No genre set" },
          { name: "Bad Bunny", genre: "Latin trap" },
          { name: "Billie Eilish", genre: "Alt pop" },
          { name: "Drake", genre: "Hip hop" },
        ];
        renderFiltered();
        setStatus("Offline fallback", "warn");
      } else {
        setStatus("Showing cached results", "warn");
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
          <div class="avatar">${a.name.charAt(0)}</div>
          <h3 class="name">${a.name}</h3>
          <p class="genre">${a.genre}</p>
        </article>`
      )
      .join("");
  }

  function renderFiltered() {
    const q = state.q.toLowerCase();
    const filtered = !q
      ? state.all
      : state.all.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.genre.toLowerCase().includes(q)
        );
    renderArtists(filtered);
  }

  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      state.q = e.target.value;
      renderFiltered();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => fetchArtists({ noCache: true }));
  }

  fetchArtists();
})();