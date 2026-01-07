// spotify/spotify.api.js
import { SPOTIFY_CONFIG } from "./spotify.config.js";
import { getAccessToken, refreshAccessToken } from "./spotify.auth.js";

function safeParseJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function apiRequest(endpoint, options = {}) {
  let token = getAccessToken();
  if (!token) {
    try {
      token = await refreshAccessToken();
    } catch {
      throw new Error("Not authenticated. Please log in to Spotify.");
    }
  }

  const url = `${SPOTIFY_CONFIG.API_BASE_URL}${endpoint}`;

  const req = {
    method: options.method || "GET",
    headers: { ...(options.headers || {}) },
  };

  req.headers.Authorization = `Bearer ${token}`;

  if (options.body !== undefined) {
    req.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    req.headers["Content-Type"] = req.headers["Content-Type"] || "application/json";
  }

  const fetchOptions = { ...options, ...req, headers: req.headers };

  console.debug("Spotify API request:", { url, method: fetchOptions.method, body: fetchOptions.body });

  const response = await fetch(url, fetchOptions);
  const text = await response.text();
  const body = safeParseJson(text);

  // auto-retry on 401
  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      const retryOptions = {
        ...fetchOptions,
        headers: { ...fetchOptions.headers, Authorization: `Bearer ${newToken}` },
      };

      console.debug("Retrying Spotify API request with refreshed token", { url, method: retryOptions.method });

      const retryRes = await fetch(url, retryOptions);
      const retryText = await retryRes.text();
      const retryBody = safeParseJson(retryText);

      if (!retryRes.ok) {
        throw new Error(
          `Spotify API retry failed: ${retryRes.status} ${retryRes.statusText} - ${JSON.stringify(retryBody)}`
        );
      }
      return retryBody;
    } catch {
      throw new Error("Authentication failed. Please log in again.");
    }
  }

  if (!response.ok) {
    const errPayload = body && body.error ? body.error : body;
    console.error("Spotify API error", {
      status: response.status,
      statusText: response.statusText,
      body: errPayload,
      request: { endpoint, method: fetchOptions.method, body: fetchOptions.body },
    });
    throw new Error(`API request failed: ${response.status} - ${JSON.stringify(errPayload)}`);
  }

  return body;
}

// -------------------- Exports --------------------

export async function getMe() {
  return apiRequest("/me");
}

/**
 * ✅ Create playlist
 * Spotify requires: POST /v1/users/{user_id}/playlists
 * Supports both:
 *  - createPlaylist(userId, payload)
 *  - createPlaylist(payload) -> uses /me internally
 */
export async function createPlaylist(userIdOrPayload, maybePayload) {
  let userId;
  let payload;

  if (typeof userIdOrPayload === "string") {
    userId = userIdOrPayload;
    payload = maybePayload || {};
  } else {
    payload = userIdOrPayload || {};
    const me = await getMe();
    userId = me?.id;
  }

  const {
    name,
    description = "",
    // allow either key
    public: publicFromPublic,
    isPublic = false,
  } = payload;

  const publicFlag = publicFromPublic !== undefined ? Boolean(publicFromPublic) : Boolean(isPublic);

  if (!name?.trim()) throw new Error("Playlist name is required");
  if (!userId) throw new Error("Missing userId for playlist creation");

  return apiRequest(`/users/${encodeURIComponent(userId)}/playlists`, {
    method: "POST",
    body: { name, description, public: publicFlag },
  });
  
}

/**
 * ✅ Add tracks
 * POST /v1/playlists/{playlist_id}/tracks
 * Supports both:
 *  - addTracksToPlaylist(playlistId, uris)
 *  - addTracksToPlaylist({ playlistId, uris, position })
 */
export async function addTracksToPlaylist(arg1, arg2) {
  let playlistId, uris, position;

  if (typeof arg1 === "string") {
    playlistId = arg1;
    uris = arg2 || [];
  } else {
    playlistId = arg1?.playlistId;
    uris = arg1?.uris || [];
    position = arg1?.position;
  }

  if (!playlistId) throw new Error("playlistId is required");
  if (!Array.isArray(uris) || uris.length === 0) return null;

  const body = { uris };
  if (typeof position === "number") body.position = position;

  return apiRequest(`/playlists/${encodeURIComponent(playlistId)}/tracks`, {
    method: "POST",
    body,
  });
}

export async function searchTracks(query, limit = 20) {
  if (!query) return { tracks: { items: [] } };

  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: String(Math.min(50, Math.max(1, Number(limit) || 20))),
  });

  return apiRequest(`/search?${params.toString()}`);
}

export async function getTopArtists(limit = 20, time_range = "medium_term") {
  const params = new URLSearchParams({
    limit: String(Math.min(50, Math.max(1, Number(limit) || 20))),
    time_range,
  });

  return apiRequest(`/me/top/artists?${params.toString()}`);
}

export async function getRecommendations({ seed_genres, limit = 20, target_valence, target_energy } = {}) {
  if (!seed_genres || !Array.isArray(seed_genres) || seed_genres.length === 0) {
    throw new Error("seed_genres is required (array)");
  }

  const params = new URLSearchParams({
    seed_genres: seed_genres.slice(0, 5).join(","),
    limit: String(Math.min(100, Math.max(1, Number(limit) || 20))),
  });

  if (target_valence != null) params.set("target_valence", String(target_valence));
  if (target_energy != null) params.set("target_energy", String(target_energy));

  return apiRequest(`/recommendations?${params.toString()}`);
}
export async function getTopTracks(limit = 20, time_range = "medium_term") {
  const params = new URLSearchParams({
    limit: String(Math.min(50, Math.max(1, Number(limit) || 20))),
    time_range,
  });
  return apiRequest(`/me/top/tracks?${params.toString()}`);
}

export async function getRecentlyPlayed(limit = 20) {
  const params = new URLSearchParams({
    limit: String(Math.min(50, Math.max(1, Number(limit) || 20))),
  });
  return apiRequest(`/me/player/recently-played?${params.toString()}`);
}
