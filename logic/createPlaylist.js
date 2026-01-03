// logic/createPlaylist.js
import { spotify } from "../spotify/spotify.adapter.js";

export async function createMoodTunesPlaylist({ name, description, trackUris }) {
  const me = await spotify.getMe();

  const playlist = await spotify.createPlaylist({
    name,
    description: `${description}\nCreated for: ${me.display_name}`,
    isPublic: false,
  });

  const result = await spotify.addTracksToPlaylist({
    playlistId: playlist.id,
    uris: trackUris,
  });

  return { me, playlist, result };
}
