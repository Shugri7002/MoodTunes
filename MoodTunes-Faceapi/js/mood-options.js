// js/mood-options.js
import { isAuthenticated } from "../spotify/spotify.auth.js";
import { spotify } from "../spotify/spotify.adapter.js";

const moodSelect = document.getElementById("mood");
const intentSelect = document.getElementById("intent");
const generateBtn = document.getElementById("generate-btn");
const userInfo = document.getElementById("user-info");
const errorEl = document.getElementById("error");

const OPTIONS_KEY = "playlistOptions";
const DEFAULT_LIMIT = 15;

function setError(msg) {
  if (errorEl) errorEl.textContent = msg || "";
}

function goToPlaylist() {
  window.location.assign("./playlist.html");
}

/** * NIEUW: Automatisch de gescande emotie verwerken 
 */
function prefillDetectedMood() {
  // Haal de data op uit de scan-pagina (bijv: "happy (95%)")
  const rawMoodData = localStorage.getItem("gescandeEmotie");

  if (rawMoodData && moodSelect) {
    // 1. Haal alleen het eerste woord op en zet naar kleine letters (bijv: "happy")
    const cleanMood = rawMoodData.split(' ')[0].toLowerCase();

    // 2. Controleer of deze emotie in onze dropdown-lijst staat
    const exists = [...moodSelect.options].some((o) => o.value === cleanMood);

    if (exists) {
      moodSelect.value = cleanMood;
      console.log("Mood automatisch ingesteld op: " + cleanMood);
    }

    // Optioneel: Cleanup na het instellen zodat hij niet 'blijft hangen' bij een volgende keer
    // localStorage.removeItem("gescandeEmotie"); 
  }
}

// Voer de check direct uit
prefillDetectedMood();

// Cleanup oude legacy keys (van je vorige code)
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