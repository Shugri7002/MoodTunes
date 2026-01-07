// js/mood-options.js
import { isAuthenticated } from "../spotify/spotify.auth.js";
import { spotify } from "../spotify/spotify.adapter.js";

const moodSelect = document.getElementById("mood");
const intentSelect = document.getElementById("intent");
const generateBtn = document.getElementById("generate-btn");
const userInfo = document.getElementById("user-info");
const errorEl = document.getElementById("error"); // optional in HTML

const OPTIONS_KEY = "playlistOptions";
const DEFAULT_LIMIT = 15; // ✅ always 15

function setError(msg) {
  if (errorEl) errorEl.textContent = msg || "";
}

function goToPlaylist() {
  window.location.assign("./playlist.html");
}

// Prefill mood from scan/face page if present
const detectedMood =
  localStorage.getItem("selectedMood") ||
  localStorage.getItem("moodtunes_detected_mood") ||
  sessionStorage.getItem("mood");

if (detectedMood && moodSelect) {
  const exists = [...moodSelect.options].some((o) => o.value === detectedMood);
  if (exists) moodSelect.value = detectedMood;
}

// cleanup old keys
localStorage.removeItem("selectedMood");
localStorage.removeItem("moodtunes_detected_mood");

// Show user info if authenticated
(async function showUserInfo() {
  if (!userInfo) return;

  if (!isAuthenticated()) {
    userInfo.textContent = "Not logged in";
    return;
  }

  try {
    const user = await spotify.getMe();
    userInfo.textContent = `Logged in as: ${user.display_name || user.id}`;
  } catch (err) {
    console.error(err);
    userInfo.textContent = "";
  }
})();

// Generate
generateBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  try {
    setError("");

    const mood = moodSelect?.value || "neutral";
    const intent = intentSelect?.value || "go-with-flow";

    // ✅ always 15
    const limit = DEFAULT_LIMIT;

    localStorage.setItem(OPTIONS_KEY, JSON.stringify({ mood, intent, limit }));
    goToPlaylist();
  } catch (err) {
    console.error(err);
    setError("Something went wrong. Check console.");
  }
});
