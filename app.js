import { generatePlaylist } from "./logic/generator.js";
import { createMoodTunesPlaylist } from "./logic/createPlaylist.js";

const moodSelect = document.getElementById("mood");
const intentSelect = document.getElementById("intent");
const limitInput = document.getElementById("limit");

const btn = document.getElementById("btn");
const output = document.getElementById("output");
const tracksEl = document.getElementById("tracks");

const createBtn = document.getElementById("create");
const createdEl = document.getElementById("created");

let lastPlaylist = null;

function renderTracks(tracks) {
  tracksEl.innerHTML = "";
  tracks.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${t.title} — ${t.artist}`;
    tracksEl.appendChild(li);
  });
}

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

    createdEl.textContent = `Created ✅ (${result.added} tracks) — ${playlist.id}`;
    console.log("Mock created playlist:", playlist, result);
  } catch (err) {
    console.error(err);
    createdEl.textContent = "Error creating playlist.";
  } finally {
    createBtn.disabled = false;
  }
});
