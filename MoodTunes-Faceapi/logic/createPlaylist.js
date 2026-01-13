// logic/createPlaylist.js
import { spotify } from "../spotify/spotify.adapter.js";

export async function createMoodTunesPlaylist({ name, description = "", trackUris = [] } = {}) {
  if (!name) throw new Error("Playlist name is required");
  if (!Array.isArray(trackUris)) throw new Error("trackUris must be an array");

  // Must be logged in
  const me = await spotify.getMe();

  // ✅ Spotify expects: { name, description, public: boolean }
  const playlist = await spotify.createPlaylist({
    name,
    description: `${description ? description + " " : ""}Created for: ${me.display_name || me.id}`,
    public: false,
  });

  if (!playlist?.id) throw new Error("Invalid playlist response from Spotify");

  // Add tracks (max 100 per request)
  const BATCH_SIZE = 100;
  let totalAdded = 0;
  let lastSnapshotId = null;

  for (let i = 0; i < trackUris.length; i += BATCH_SIZE) {
    const chunk = trackUris.slice(i, i + BATCH_SIZE).filter(Boolean);
    if (chunk.length === 0) continue;

    const res = await spotify.addTracksToPlaylist({
      playlistId: playlist.id,
      uris: chunk,
    });

    totalAdded += chunk.length;
    if (res?.snapshot_id) lastSnapshotId = res.snapshot_id;
  }

  return {
    me,
    playlist,
    result: { added: totalAdded, snapshot_id: lastSnapshotId },
  };
}
