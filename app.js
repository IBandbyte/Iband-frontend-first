const API_URL = "https://iband-backend-first-2.onrender.com/artists";

const state = {
  all: [],
  q: "",
};

// DOM elements
const artistListEl = document.getElementById("artist-list");
const searchEl = document.getElementById("search");
const refreshBtn = document.getElementById("refresh-btn");
const debugEl = document.getElementById("debug"); // debug panel

async function fetchArtists() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
    const data = await res.json();

    // Ensure only valid artists with a name
    state.all = data.filter(a => a.name && a.name.trim() !== "");
    debugEl.innerText = `✅ Loaded ${state.all.length} artists from backend`;
    applyFilter();
  } catch (err) {
    debugEl.innerText = `⚠️ Failed to fetch from backend: ${err.message}`;
    console.error("Fetch error:", err);

    // fallback data
    const fallback = [
      { name: "Aria Nova", genre: "No genre set" },
      { name: "Bad Bunny", genre: "Latin trap" },
      { name: "Billie Eilish", genre: "Alt pop" },
      { name: "Drake", genre: "Hip hop" },
    ];
    state.all = fallback;
    debugEl.innerText += " — Using fallback data.";
    applyFilter();
  }
}

function applyFilter() {
  const q = state.q.trim().toLowerCase();
  const filtered = !q
    ? state.all
    : state.all.filter(a => a.name.toLowerCase().includes(q));
  renderArtists(filtered);
}

function renderArtists(artists) {
  artistListEl.innerHTML = "";
  if (artists.length === 0) {
    artistListEl.innerHTML = "<p>No artists found.</p>";
    return;
  }

  artists.forEach(artist => {
    const card = document.createElement("div");
    card.className = "artist-card";

    const initials = artist.name ? artist.name.charAt(0).toUpperCase() : "?";

    card.innerHTML = `
      <div class="artist-avatar">${initials}</div>
      <div class="artist-info">
        <h3>${artist.name || "Unknown"}</h3>
        <p>${artist.genre || "No genre set"}</p>
      </div>
    `;
    artistListEl.appendChild(card);
  });
}

// Event listeners
searchEl.addEventListener("input", e => {
  state.q = e.target.value || "";
  applyFilter();
});

refreshBtn.addEventListener("click", () => {
  debugEl.innerText = "🔄 Refreshing...";
  fetchArtists();
});

// Kick off
fetchArtists();