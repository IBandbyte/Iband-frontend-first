const backendUrl = "https://iband-backend-first-2.onrender.com/artists";

async function fetchArtists() {
  const debugLog = document.getElementById("debug-log");
  try {
    const res = await fetch(backendUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const artists = await res.json();

    debugLog.textContent = "✅ Data fetched from backend:\n" + JSON.stringify(artists, null, 2);
    renderArtists(artists);
  } catch (err) {
    console.error("Backend fetch failed:", err);
    debugLog.textContent = "⚠️ Backend fetch failed, using fallback.\nError: " + err;

    const fallback = [
      { name: "Aria Nova", genre: "Indie Pop" },
      { name: "Neon Harbor", genre: "Synthwave" },
      { name: "Stone & Sparrow", genre: "Folk Rock" },
    ];
    renderArtists(fallback);
  }
}

function renderArtists(artists) {
  const container = document.getElementById("artists");
  container.innerHTML = "";
  artists.forEach((artist) => {
    const card = document.createElement("div");
    card.className = "artist-card";
    card.innerHTML = `
      <h3>${artist.name}</h3>
      <p>${artist.genre}</p>
    `;
    container.appendChild(card);
  });
}

fetchArtists();