// spotify/spotify.config.example.js
// Example configuration file
//
// To set up:
// 1. Copy this file to spotify.config.local.js for local use
// 2. Fill in your Spotify credentials from https://developer.spotify.com/dashboard
// 3. Make sure the REDIRECT_URI matches what you registered in Spotify Dashboard

export const SPOTIFY_CONFIG = {
  // Get this from: https://developer.spotify.com/dashboard > Your App
  CLIENT_ID: "YOUR_CLIENT_ID_HERE",

  // Client Secret (optional for PKCE, only needed for server-side flows)
  CLIENT_SECRET: "YOUR_CLIENT_SECRET_HERE",

  // Must match EXACTLY what you registered in Spotify Developer Dashboard
  // Go to: Your App > Edit Settings > Redirect URIs
  REDIRECT_URI: "REDIRECT_URI_HERE",

  // Scopes needed for the app
  SCOPES: "SCOPES_HERE",
};
