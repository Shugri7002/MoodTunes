// spotify/spotify.adapter.js
// Direct export of Spotify API (no mock, only real API)

import * as api from "./spotify.api.js";

// Export Spotify API directly - requires authentication
export const spotify = {
  getMe: api.getMe,
  createPlaylist: api.createPlaylist,
  addTracksToPlaylist: api.addTracksToPlaylist,
};
