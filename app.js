// app.js

// Run when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Frontend is connected and app.js is running");

  // Example: change the heading color dynamically
  const heading = document.querySelector("h1");
  if (heading) {
    heading.style.color = "#ff6600"; // orange
  }
});
