// js/playlist.js
// Handles the playlist results page - displays generated playlist
import { generatePlaylist } from "../logic/generator.js";
import { createMoodTunesPlaylist } from "../logic/createPlaylist.js";
import { isAuthenticated } from "../spotify/spotify.auth.js";
import { spotify } from "../spotify/spotify.adapter.js";

const playlistNameEl = document.getElementById("playlist-name");
const tracksEl = document.getElementById("tracks");
const createBtn = document.getElementById("create-btn");
const customizeBtn = document.getElementById("customize-btn");
const createdEl = document.getElementById("created");
const userInfo = document.getElementById("user-info");

let currentPlaylist = null;

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

function renderTracks(tracks) {
  tracksEl.innerHTML = "";
  tracks.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${t.title} — ${t.artist}`;
    tracksEl.appendChild(li);
  });
}

// Load playlist options from localStorage and generate playlist
function loadAndGeneratePlaylist() {
  const optionsStr = localStorage.getItem("playlistOptions");
  if (!optionsStr) {
    // No options found, redirect to customize
    window.location.href = "mood-options.html";
    return;
  }

  const options = JSON.parse(optionsStr);
  const { mood, intent, limit } = options;

  // Generate playlist
  const playlist = generatePlaylist({ mood, intent, limit });
  currentPlaylist = playlist;

  // Display playlist
  playlistNameEl.textContent = `${playlist.name} — ${playlist.tracks.length} tracks`;
  renderTracks(playlist.tracks);

  // Clear options from localStorage
  localStorage.removeItem("playlistOptions");
}

// Create playlist on Spotify
createBtn.addEventListener("click", async () => {
  if (!currentPlaylist) return;

  createBtn.disabled = true;
  createdEl.textContent = "Creating playlist...";

  try {
    const trackUris = currentPlaylist.tracks.map((t) => t.uri);
    const { playlist, result } = await createMoodTunesPlaylist({
      name: currentPlaylist.name,
      description: currentPlaylist.description,
      trackUris,
    });

    if (isAuthenticated()) {
      createdEl.innerHTML = `✅ Created! <a href="${playlist.external_urls.spotify}" target="_blank">Open in Spotify</a>`;
    } else {
      createdEl.textContent = `✅ Created (${result.added} tracks)`;
    }
  } catch (err) {
    console.error(err);
    createdEl.textContent = `❌ Error: ${err.message}`;
  } finally {
    createBtn.disabled = false;
  }
});

// Go back to customize
customizeBtn.addEventListener("click", () => {
  window.location.href = "mood-options.html";
});

// Initialize on page load
loadAndGeneratePlaylist();
