// spotify/spotify.adapter.js
import * as api from "./spotify.api.js";
import { isAuthenticated } from "./spotify.auth.js";

function assertAuth() {
  if (!isAuthenticated()) {
    throw new Error(
      "Spotify not authenticated. Please log in first."
    );
  }
}

export const spotify = {
  // Optional: allow manual token set (debug/testing)
  setAccessToken(token) {
    if (typeof api.setAccessToken === "function") {
      api.setAccessToken(token);
    }
  },

  // ---------- Profile ----------
  async getMe() {
    assertAuth();
    if (typeof api.getMe !== "function") {
      throw new Error("spotify.api.getMe not implemented");
    }
    return api.getMe();
  },

  // ---------- Playlist ----------
  async createPlaylist(params) {
    assertAuth();
    if (typeof api.createPlaylist !== "function") {
      throw new Error("spotify.api.createPlaylist not implemented");
    }
    return api.createPlaylist(params);
  },

  async addTracksToPlaylist(params) {
    assertAuth();
    if (typeof api.addTracksToPlaylist !== "function") {
      throw new Error("spotify.api.addTracksToPlaylist not implemented");
    }
    return api.addTracksToPlaylist(params);
  },

  // ---------- Discovery ----------
  async searchTracks(query, limit) {
    assertAuth();
    if (typeof api.searchTracks !== "function") {
      throw new Error("spotify.api.searchTracks not implemented");
    }
    return api.searchTracks(query, limit);
  },

  async getTopArtists(limit = 10, time_range = "medium_term") {
    assertAuth();
    if (typeof api.getTopArtists !== "function") {
      throw new Error("spotify.api.getTopArtists not implemented");
    }
    return api.getTopArtists(limit, time_range);
  },

  // ✅ Used by generator if available
  async getRecommendations(params) {
    assertAuth();
    if (typeof api.getRecommendations !== "function") {
      throw new Error("spotify.api.getRecommendations not implemented");
    }
    return api.getRecommendations(params);
  },
  async getTopTracks(...args) {
  assertAuth();
  return api.getTopTracks?.(...args);
},

async getRecentlyPlayed(...args) {
  assertAuth();
  return api.getRecentlyPlayed?.(...args);
},

};
