// app.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Frontend connected");

  // Fetch artists from backend
  fetch("https://iband-backend-first-2.onrender.com/artists")
    .then(response => response.json())
    .then(data => {
      console.log("🎵 Artists from backend:", data);

      const container = document.getElementById("artists-container");
      container.innerHTML = "<h2>Artists</h2>";

      if (data.length > 0) {
        const list = document.createElement("ul");

        data.forEach(artist => {
          const item = document.createElement("li");
          item.textContent = `${artist.name} — ${artist.genre || "No genre set"}`;
          list.appendChild(item);
        });

        container.appendChild(list);
      } else {
        container.innerHTML += "<p>No artists found.</p>";
      }
    })
    .catch(err => {
      console.error("❌ Error fetching artists:", err);
    });
});