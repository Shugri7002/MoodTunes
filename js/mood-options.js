// js/customize.js
// Handles the customize page - mood/intent selection

import { isAuthenticated } from "../spotify/spotify.auth.js";
import { spotify } from "../spotify/spotify.adapter.js";

const moodSelect = document.getElementById("mood");
const intentSelect = document.getElementById("intent");
const limitInput = document.getElementById("limit");
const generateBtn = document.getElementById("generate-btn");
const userInfo = document.getElementById("user-info");

// Check if user came from face detection
const detectedMood = localStorage.getItem("selectedMood");
if (detectedMood) {
  moodSelect.value = detectedMood;
  localStorage.removeItem("selectedMood");
}

// Show user info
async function showUserInfo() {
  if (isAuthenticated()) {
    try {
      const user = await spotify.getMe();
      userInfo.textContent = `Logged in as: ${user.display_name || user.id}`;
    } catch (err) {
      console.error(err);
    }
  }
}

showUserInfo();

// Generate playlist and navigate to playlist page
generateBtn.addEventListener("click", () => {
  const mood = moodSelect.value;
  const intent = intentSelect.value;
  const limit = Math.max(
    1,
    Math.min(30, Number.parseInt(limitInput.value || "8", 10))
  );

  // Store playlist options in localStorage
  localStorage.setItem(
    "playlistOptions",
    JSON.stringify({ mood, intent, limit })
  );

  // Navigate to playlist page
  window.location.href = "playlist.html";
});
