// spotify/spotify.auth.js
// Spotify OAuth authentication with PKCE flow (SPA-friendly)

import { SPOTIFY_CONFIG } from "./spotify.config.js";

const STORAGE = {
  accessToken: "spotify_access_token",
  expiresAt: "spotify_token_expires_at",
  refreshToken: "spotify_refresh_token",
  codeVerifier: "spotify_code_verifier",
  tokenScope: "spotify_token_scope",
};

// Generate a random string for PKCE
function generateRandomString(length) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Generate code verifier and challenge for PKCE
async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function storeVerifier(verifier) {
  sessionStorage.setItem(STORAGE.codeVerifier, verifier);
}

function getVerifier() {
  return sessionStorage.getItem(STORAGE.codeVerifier);
}

function clearVerifier() {
  sessionStorage.removeItem(STORAGE.codeVerifier);
}

export function storeAccessToken(token, expiresIn, scope = "") {
  const expiresAt = Date.now() + Number(expiresIn || 0) * 1000;
  localStorage.setItem(STORAGE.accessToken, token);
  localStorage.setItem(STORAGE.expiresAt, String(expiresAt));
  if (scope) localStorage.setItem(STORAGE.tokenScope, scope);
}

export function getAccessToken() {
  const token = localStorage.getItem(STORAGE.accessToken);
  const expiresAt = localStorage.getItem(STORAGE.expiresAt);

  if (!token || !expiresAt) return null;

  // expired?
  if (Date.now() >= Number(expiresAt)) {
    // don't nuke refresh token here; refreshAccessToken might still work
    localStorage.removeItem(STORAGE.accessToken);
    localStorage.removeItem(STORAGE.expiresAt);
    return null;
  }

  return token;
}

export function clearAccessToken() {
  localStorage.removeItem(STORAGE.accessToken);
  localStorage.removeItem(STORAGE.expiresAt);
  localStorage.removeItem(STORAGE.tokenScope);
}

export function storeRefreshToken(token) {
  if (token) localStorage.setItem(STORAGE.refreshToken, token);
}

export function getRefreshToken() {
  return localStorage.getItem(STORAGE.refreshToken);
}

export function isAuthenticated() {
  return getAccessToken() !== null;
}

// Initiate OAuth login flow
export async function initiateLogin() {
  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);

  storeVerifier(verifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CONFIG.CLIENT_ID,
    scope: SPOTIFY_CONFIG.SCOPES,
    redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.assign(`${SPOTIFY_CONFIG.AUTH_URL}?${params.toString()}`);
}

// Handle OAuth callback and exchange code for token
export async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const error = urlParams.get("error");

  if (error) {
    throw new Error(`Spotify authorization error: ${error}`);
  }

  if (!code) {
    return false; // not a callback
  }

  const verifier = getVerifier();
  if (!verifier) {
    throw new Error("Code verifier not found. Please try logging in again.");
  }

  try {
    const response = await fetch(SPOTIFY_CONFIG.TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        code_verifier: verifier,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${data.error_description || data.error || "unknown_error"}`);
    }

    storeAccessToken(data.access_token, data.expires_in, data.scope || "");
    if (data.refresh_token) storeRefreshToken(data.refresh_token);

    clearVerifier();

    // ✅ Clean up URL after success
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  } catch (err) {
    clearVerifier();
    throw err;
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available. Please log in again.");
  }

  try {
    const response = await fetch(SPOTIFY_CONFIG.TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${data.error_description || data.error || "unknown_error"}`);
    }

    storeAccessToken(data.access_token, data.expires_in, data.scope || "");
    // Spotify often does NOT return refresh_token on refresh; only store if present
    if (data.refresh_token) storeRefreshToken(data.refresh_token);

    return data.access_token;
  } catch (err) {
    // if refresh fails, clear access token but keep refresh token? safer to clear all and force login
    clearAccessToken();
    localStorage.removeItem(STORAGE.refreshToken);
    throw err;
  }
}

// Logout
export function logout() {
  clearAccessToken();
  localStorage.removeItem(STORAGE.refreshToken);
  clearVerifier();

  // also clear moodtunes flow keys (nice for demos)
  localStorage.removeItem("playlistOptions");
  sessionStorage.removeItem("mood");
  sessionStorage.removeItem("intent");
  sessionStorage.removeItem("trackCount");
}
