// spotify/spotify.adapter.js
// Use mock for now, switch to real API when authenticated

import * as mock from "./spotify.mock.js";
import * as api from "./spotify.api.js";
import { isAuthenticated } from "./spotify.auth.js";

// Use real API if authenticated, otherwise use mock
export const spotify = {
  getMe: async () => {
    if (isAuthenticated()) {
      return api.getMe();
    }
    return mock.getMe();
  },
  createPlaylist: async (params) => {
    if (isAuthenticated()) {
      return api.createPlaylist(params);
    }
    return mock.createPlaylist(params);
  },
  addTracksToPlaylist: async (params) => {
    if (isAuthenticated()) {
      return api.addTracksToPlaylist(params);
    }
    return mock.addTracksToPlaylist(params);
  },
};
