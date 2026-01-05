import { generatePlaylist } from "./logic/generator.js";
import { createMoodTunesPlaylist } from "./logic/createPlaylist.js";
import {
  isAuthenticated,
  initiateLogin,
  handleCallback,
  logout as spotifyLogout,
} from "./spotify/spotify.auth.js";
import { getMe } from "./spotify/spotify.api.js";
import { spotify } from "./spotify/spotify.adapter.js";

// UI elements
const moodSelect = document.getElementById("mood");
const intentSelect = document.getElementById("intent");
const limitInput = document.getElementById("limit");
const btn = document.getElementById("btn");
const output = document.getElementById("output");
const tracksEl = document.getElementById("tracks");
const createBtn = document.getElementById("create");
const createdEl = document.getElementById("created");

// Auth UI elements
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");
const userName = document.getElementById("user-name");

let lastPlaylist = null;

function renderTracks(tracks) {
  tracksEl.innerHTML = "";
  tracks.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${t.title} — ${t.artist}`;
    tracksEl.appendChild(li);
  });
}

// Generate playlist
btn.addEventListener("click", () => {
  const mood = moodSelect.value;
  const intent = intentSelect.value;
  const limit = Math.max(
    1,
    Math.min(30, Number.parseInt(limitInput.value || "8", 10))
  );

  const playlist = generatePlaylist({ mood, intent, limit });
  lastPlaylist = playlist;

  output.textContent = `${playlist.name} — ${playlist.tracks.length} tracks`;
  renderTracks(playlist.tracks);
  createdEl.textContent = "";
});

// Update UI based on authentication status
async function updateAuthUI() {
  const authenticated = isAuthenticated();

  if (authenticated) {
    try {
      const currentUser = await getMe();
      userName.textContent = `Logged in as: ${
        currentUser.display_name || currentUser.id
      }`;
      loginBtn.style.display = "none";
      userInfo.style.display = "block";
      createBtn.disabled = false;
    } catch (err) {
      console.error("Failed to get user info:", err);
      loginBtn.style.display = "block";
      userInfo.style.display = "none";
      createBtn.disabled = true;
    }
  } else {
    loginBtn.style.display = "block";
    userInfo.style.display = "none";
    createBtn.disabled = true;
  }
}

// Handle login
loginBtn.addEventListener("click", () => {
  initiateLogin();
});

// Handle logout
logoutBtn.addEventListener("click", () => {
  spotifyLogout();
  updateAuthUI();
});

// Handle OAuth callback on page load
async function initAuth() {
  try {
    const handled = await handleCallback();
    if (handled) {
      await updateAuthUI();
    } else {
      await updateAuthUI();
    }
  } catch (err) {
    console.error("Authentication error:", err);
    await updateAuthUI();
  }
}

// Initialize authentication on page load
initAuth();

// Create playlist (works with mock if not authenticated, real API if authenticated)
createBtn.addEventListener("click", async () => {
  if (!lastPlaylist) {
    createdEl.textContent = "Generate a playlist first.";
    return;
  }

  createBtn.disabled = true;
  createdEl.textContent = "Creating playlist...";

  try {
    const trackUris = lastPlaylist.tracks.map((t) => t.uri);

    const { playlist, result } = await createMoodTunesPlaylist({
      name: lastPlaylist.name,
      description: lastPlaylist.description,
      trackUris,
    });

    if (isAuthenticated()) {
      createdEl.textContent = `Created ✅ (${result.added} tracks) — View: ${playlist.external_urls.spotify}`;
    } else {
      createdEl.textContent = `Created ✅ (${result.added} tracks) — ${playlist.id} (mock)`;
    }
    console.log("Created playlist:", playlist, result);
  } catch (err) {
    console.error(err);
    createdEl.textContent = `Error creating playlist: ${err.message}`;
  } finally {
    createBtn.disabled = false;
  }
});
