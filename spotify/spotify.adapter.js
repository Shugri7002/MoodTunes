// spotify/spotify.adapter.js
import * as api from "./spotify.api.js";
import { isAuthenticated } from "./spotify.auth.js";

function assertAuth() {
  if (!isAuthenticated()) {
    throw new Error(
      "Spotify not authenticated. Complete the auth flow (login) first."
    );
  }
}

export const spotify = {
  setAccessToken(token) {
    if (typeof api.setAccessToken === "function") api.setAccessToken(token);
  },

  async getMe(...args) {
    assertAuth();
    return api.getMe(...args);
  },

  async createPlaylist(params) {
    assertAuth();
    return api.createPlaylist(params);
  },

  async addTracksToPlaylist(params) {
    assertAuth();
    return api.addTracksToPlaylist(params);
  },

  async searchTracks(query, limit) {
    assertAuth();
    return api.searchTracks(query, limit);
  },

  async getTopArtists(limit, time_range) {
    assertAuth();
    return api.getTopArtists(limit, time_range);
  },

  // ✅ needed by your generator
  async getTopTracks(limit, time_range) {
    assertAuth();
    return api.getTopTracks(limit, time_range);
  },

  // ✅ needed by your generator
  async getRecentlyPlayed(limit) {
    assertAuth();
    return api.getRecentlyPlayed(limit);
  },

  // ✅ needed by your generator
  async getRecommendations(params) {
    assertAuth();
    return api.getRecommendations(params);
  },
};

