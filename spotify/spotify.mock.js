// spotify/spotify.mock.js
// MVP mock Spotify client (no OAuth needed)

export async function getMe() {
  return { id: "mock-user", display_name: "Mock User" };
}

export async function createPlaylist({ name, description, isPublic = false }) {
  // pretend we created a playlist
  const id = `mock-playlist-${Math.random().toString(16).slice(2)}`;
  return {
    id,
    name,
    description,
    public: isPublic,
    external_urls: { spotify: `https://open.spotify.com/playlist/${id}` },
  };
}

export async function addTracksToPlaylist({ playlistId, uris }) {
  // pretend we added tracks
  return {
    playlistId,
    added: uris.length,
    snapshot_id: `mock-snapshot-${Date.now()}`,
  };
}
