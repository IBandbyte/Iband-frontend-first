// app.js

// When the page loads, fetch artists from your backend
window.addEventListener("DOMContentLoaded", () => {
  fetch("https://iband-backend-first-2.onrender.com/artists")
    .then(response => response.json())
    .then(data => {
      console.log("Artists from backend:", data);

      const container = document.createElement("div");
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

      document.body.appendChild(container);
    })
    .catch(error => {
      console.error("Error fetching artists:", error);
      const errorMsg = document.createElement("p");
      errorMsg.textContent = "⚠️ Could not load artists.";
      document.body.appendChild(errorMsg);
    });
});