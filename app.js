// app.js — iBandbyte front-end (clean list + dedupe + filter)

(() => {
  // Use .env variable (fallback to Render if not set)
  const API_BASE = import.meta.env.VITE_API_URL || "https://iband-backend-first-2.onrender.com";

  // ---- DOM ----
  const listEl = document.getElementById("artists");
  const searchEl = document.getElementById("search");
  const refreshBtn = document.getElementById("refreshBtn");
  const statusEl = document.getElementById("status"); // optional debug/status

  const state = {
    all: [],
    q: ""
  };

  // ---- helpers ----
  const setStatus = (text) => { if (statusEl) statusEl.textContent = text; };

  const normalizeName = (s) => (s || "").toString().trim();
  const hasName = (a) => typeof a?.name === "string" && normalizeName(a.name).length > 0;

  const sanitizeAndDedupe = (arr) => {
    // 1) keep only items with a real name
    const valid = arr.filter(hasName).map(a => ({
      name: normalizeName(a.name),
      genre: normalizeName(a.genre) || "No genre set"
    }));

    // 2) de-duplicate by normalized lowercased name
    const seen = new Set();
    const unique = [];
    for (const a of valid) {
      const key = a.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(a);
      }
    }

    // 3) sort A→Z
    unique.sort((a, b) => a.name.localeCompare(b.name));
    return unique;
  };

  const renderArtists = (items) => {
    listEl.innerHTML = "";
    if (!items.length) {
      listEl.innerHTML = `<li class="empty">No artists found.</li>`;
      return;
    }
    const frag = document.createDocumentFragment();
    for (const a of items) {
      const li = document.createElement("li");
      li.className = "card";
      li.innerHTML = `
        <div class="avatar">${(a.name[0] || "?").toUpperCase()}</div>
        <div class="meta">
          <div class="name">${a.name}</div>
          <div class="genre">${a.genre || "No genre set"}</div>
        </div>
      `;
      frag.appendChild(li);
    }
    listEl.appendChild(frag);
  };

  const applyFilter = () => {
    const q = state.q.toLowerCase();
    const filtered = q
      ? state.all.filter(a => a.name.toLowerCase().includes(q))
      : state.all;
    renderArtists(filtered);
  };

  const fetchArtists = async () => {
    setStatus("Loading from API…");
    try {
      const res = await fetch(`${API_BASE}/artists`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();

      state.all = sanitizeAndDedupe(Array.isArray(raw) ? raw : []);
      setStatus(`Loaded ${state.all.length} unique artists`);
      applyFilter();
    } catch (err) {
      console.error(err);
      setStatus("Failed to load — showing nothing");
      state.all = [];
      applyFilter();
    }
  };

  // ---- events ----
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      state.q = e.target.value || "";
      applyFilter();
    });
  }
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      setStatus("Refreshing…");
      fetchArtists();
    });
  }

  // boot
  fetchArtists();
})();