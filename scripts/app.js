// iBand frontend — mobile-first, fetches artists from your Render backend

const API_BASE = "https://iband-backend-first-2.onrender.com";
const ENDPOINTS = {
  health: `${API_BASE}/health`,
  artists: `${API_BASE}/artists`,
};

// ---------- DOM ----------
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const listEl = document.getElementById("artistsList");
const msgEl = document.getElementById("message");
const searchEl = document.getElementById("q");
const refreshBtn = document.getElementById("refreshBtn");

// ---------- Utils ----------
function setStatus(ok, text) {
  statusDot.classList.toggle("ok", ok);
  statusDot.classList.toggle("bad", !ok);
  statusText.textContent = text || (ok ? "Backend: OK" : "Backend: offline");
}

function showMessage(text, kind = "info") {
  msgEl.textContent = text;
  msgEl.dataset.kind = kind;
  msgEl.hidden = !text;
}

async function fetchJSON(url, opts = {}, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function normalizeArtists(raw) {
  // Handle arrays or objects accidentally returned
  const arr = Array.isArray(raw) ? raw : raw?.data ?? [];
  const clean = arr
    .map(a => ({
      name: (a.name ?? "").toString().trim(),
      genre: (a.genre ?? "No genre set").toString().trim(),
    }))
    .filter(a => a.name);

  // De-dupe by name
  const byName = new Map();
  clean.forEach(a => byName.set(a.name.toLowerCase(), a));
  return [...byName.values()];
}

function renderArtists(artists) {
  listEl.innerHTML = "";
  if (!artists.length) {
    showMessage("No artists found.", "info");
    listEl.setAttribute("aria-busy", "false");
    return;
  }
  showMessage("");
  const frag = document.createDocumentFragment();
  artists.forEach(a => {
    const li = document.createElement("li");
    li.className = "card";
    li.innerHTML = `
      <div class="card-title">${escapeHtml(a.name)}</div>
      <div class="card-sub">${escapeHtml(a.genre || "No genre set")}</div>
    `;
    frag.appendChild(li);
  });
  listEl.appendChild(frag);
  listEl.setAttribute("aria-busy", "false");
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}

// ---------- Data flow ----------
async function checkHealth() {
  try {
    const data = await fetchJSON(ENDPOINTS.health);
    setStatus(true, data?.message || "Backend: OK");
  } catch {
    setStatus(false, "Backend: offline");
  }
}

async function loadArtists({ quiet = false } = {}) {
  listEl.setAttribute("aria-busy", "true");
  if (!quiet) showMessage("Loading artists…", "info");
  try {
    const raw = await fetchJSON(ENDPOINTS.artists);
    const artists = normalizeArtists(raw);
    state.all = artists;
    applyFilter(); // renders
  } catch (err) {
    console.error(err);
    showMessage("Could not load artists. Showing sample data.", "warn");
    const fallback = [
      { name: "Aria Nova", genre: "No genre set" },
      { name: "Neon Harbor", genre: "No genre set" },
      { name: "Stone & Sparrow", genre: "No genre set" },
      { name: "Bad Bunny", genre: "Latin trap" },
      { name: "Billie Eilish", genre: "Alt pop" },
      { name: "Drake", genre: "Hip hop" },
    ];
    state.all = fallback;
    applyFilter();
  }
}

const state = {
  all: [],
  q: "",
};

function applyFilter() {
  const q = state.q.trim().toLowerCase();
  const filtered = !q
    ? state.all
    : state.all.filter(a => a.name.toLowerCase().includes(q) || (a.genre || "").toLowerCase().includes(q));
  renderArtists(filtered);
}

// ---------- Events ----------
searchEl.addEventListener("input", (e) => {
  state.q = e.target.value || "";
  applyFilter();
});

refreshBtn.addEventListener("click", () => loadArtists({ quiet: true }));

// ---------- Boot ----------
(async function init() {
  await checkHealth();
  await loadArtists();
})();