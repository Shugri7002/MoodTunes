import { generatePlaylist } from "./logic/generator.js";
import { createMoodTunesPlaylist } from "./logic/createPlaylist.js";

const btn = document.getElementById("btn");
const output = document.getElementById("output");
const tracksEl = document.getElementById("tracks");

const createBtn = document.getElementById("create");
const createdEl = document.getElementById("created");

let lastPlaylist = null;

btn.addEventListener("click", () => {
  const playlist = generatePlaylist({
    mood: "happy",
    intent: "turn-it-up",
    limit: 8,
  });

  lastPlaylist = playlist;

  output.textContent = `${playlist.name} — ${playlist.tracks.length} tracks`;

  tracksEl.innerHTML = "";
  playlist.tracks.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${t.title} — ${t.artist}`;
    tracksEl.appendChild(li);
  });

  createdEl.textContent = ""; // reset
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
