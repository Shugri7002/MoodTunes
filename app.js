import { generatePlaylist } from "./logic/generator.js";

const btn = document.getElementById("btn");
const output = document.getElementById("output");
const tracksEl = document.getElementById("tracks");

btn.addEventListener("click", () => {
  const playlist = generatePlaylist({
    mood: "happy",
    intent: "turn-it-up",
    limit: 8,
  });

  output.textContent = `${playlist.name} — ${playlist.tracks.length} tracks`;

  tracksEl.innerHTML = "";
  playlist.tracks.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${t.title} — ${t.artist}`;
    tracksEl.appendChild(li);
  });
});
