// js/playlist.js
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

const OPTIONS_KEY = "playlistOptions";
const FINAL_LIMIT = 15;

let currentPlaylist = null;

function setStatus(msg, ok = false) {
  if (!createdEl) return;
  if (!msg) {
    createdEl.textContent = "";
    createdEl.innerHTML = "";
    return;
  }
  createdEl.innerHTML = ok
    ? `${msg} <span class="status-badge" aria-hidden="true"></span>`
    : msg;
}

function msToTime(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return "";
  const totalSec = Math.floor(n / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function showUserInfo() {
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
    userInfo.textContent = "Logged in";
  }
}

function getOptions() {
  const raw = localStorage.getItem(OPTIONS_KEY);
  if (!raw) return null;

  try {
    const obj = JSON.parse(raw);
    return {
      mood: obj?.mood || "neutral",
      intent: obj?.intent || "go-with-flow",
      limit: FINAL_LIMIT,
    };
  } catch (e) {
    console.error("Failed to parse playlistOptions:", e);
    return null;
  }
}

function renderTracks(tracks = []) {
  if (!tracksEl) return;
  tracksEl.innerHTML = "";

  if (!Array.isArray(tracks) || tracks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No tracks found.";
    tracksEl.appendChild(li);
    return;
  }

  tracks.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = "track-row";

    const num = document.createElement("div");
    num.className = "track-num";
    num.textContent = String(i + 1);

    const cover = document.createElement("div");
    cover.className = "cover";
    if (t?.imageUrl) {
      const img = document.createElement("img");
      img.src = t.imageUrl;
      img.alt = `${t?.name || "Track"} cover`;
      cover.appendChild(img);
    }

    const main = document.createElement("div");
    main.className = "track-main";

    const title = document.createElement("div");
    title.className = "track-title";
    title.textContent = t?.name || "Unknown title";

    const artist = document.createElement("div");
    artist.className = "track-artist";
    artist.textContent = t?.artists || "";

    main.appendChild(title);
    main.appendChild(artist);

    const time = document.createElement("div");
    time.className = "track-time";
    time.textContent = msToTime(t?.duration_ms);

    li.appendChild(num);
    li.appendChild(cover);
    li.appendChild(main);
    li.appendChild(time);

    tracksEl.appendChild(li);
  });
}

async function loadAndGeneratePlaylist() {
  try {
    const opts = getOptions();
    if (!opts) {
      window.location.assign("./mood-options.html");
      return;
    }

    setStatus(isAuthenticated() ? "Generating playlist..." : "Not logged in — preview only...");

    const playlist = await generatePlaylist(opts);
    currentPlaylist = playlist || null;

    const tracks = currentPlaylist?.tracks || [];

    if (!tracks.length) {
      playlistNameEl.textContent = "No playlist generated";
      renderTracks([]);
      if (createBtn) createBtn.disabled = true;
      setStatus(isAuthenticated() ? "No tracks returned. Try another mood/intent." : "Login required for Spotify tracks.");
      return;
    }

    // ✅ playlist name visible
    playlistNameEl.textContent = `${currentPlaylist.name || "Playlist"} — ${tracks.length} tracks`;

    renderTracks(tracks);

    const hasUris = tracks.some((x) => !!x?.uri);
    const canCreate = isAuthenticated() && hasUris;

    if (createBtn) createBtn.disabled = !canCreate;

    setStatus(
      canCreate
    );
  } catch (err) {
    console.error("Error generating playlist:", err);
    playlistNameEl.textContent = "Error generating playlist";
    renderTracks([]);
    if (createBtn) createBtn.disabled = true;
    setStatus(`❌ ${err?.message || String(err)}`);
  }
}

async function handleCreate() {
  if (!currentPlaylist?.tracks?.length) return;

  if (!isAuthenticated()) {
    setStatus("Please login to add to Spotify.");
    return;
  }

  const trackUris = currentPlaylist.tracks.map((t) => t?.uri).filter(Boolean);
  if (trackUris.length === 0) {
    setStatus("❌ Tracks missing URIs (cannot add to Spotify).");
    return;
  }

  createBtn.disabled = true;
  setStatus("Creating playlist in Spotify...");

  try {
    const res = await createMoodTunesPlaylist({
      name: currentPlaylist.name || "MoodTunes Playlist",
      description: currentPlaylist.description || "Generated by MoodTunes",
      trackUris,
    });

    const created = res?.playlist || res;
    const url = created?.external_urls?.spotify || "";

    setStatus(
      `Created! ${url ? `<a href="${url}" target="_blank" rel="noreferrer">Open in Spotify</a>` : ""}`,
      true
    );
  } catch (err) {
    console.error(err);
    setStatus(`❌ Failed to create playlist: ${err?.message || String(err)}`);
  } finally {
    createBtn.disabled = false;
  }
}

createBtn?.addEventListener("click", handleCreate);
customizeBtn?.addEventListener("click", () => window.location.assign("./mood-options.html"));

(async function init() {
  await showUserInfo();
  await loadAndGeneratePlaylist();
})();
