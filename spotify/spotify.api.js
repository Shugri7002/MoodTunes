// spotify/spotify.api.js
// Real Spotify Web API client

import { SPOTIFY_CONFIG } from "./spotify.config.local.js";
import { getAccessToken, refreshAccessToken } from "./spotify.auth.js";

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
  let token = getAccessToken();

  // If no token, try to refresh
  if (!token) {
    try {
      token = await refreshAccessToken();
    } catch (err) {
      throw new Error("Not authenticated. Please log in to Spotify.");
    }
  }

  const url = `${SPOTIFY_CONFIG.API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // If token expired, try refreshing and retry once
  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${newToken}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({}));
        throw new Error(
          `API request failed: ${retryResponse.status} ${
            retryResponse.statusText
          } - ${errorData.error?.message || ""}`
        );
      }

      return retryResponse.json();
    } catch (err) {
      throw new Error("Authentication failed. Please log in again.");
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${
        errorData.error?.message || ""
      }`
    );
  }

  return response.json();
}

// Get current user's profile
export async function getMe() {
  return apiRequest("/me");
}

// Create a new playlist for the current user
export async function createPlaylist({ name, description, isPublic = false }) {
  const me = await getMe();

  return apiRequest(`/users/${me.id}/playlists`, {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      public: isPublic,
    }),
  });
}

// Add tracks to a playlist
export async function addTracksToPlaylist({ playlistId, uris }) {}

// Search for tracks (useful for future features)
export async function searchTracks(query, limit = 20) {}
