// spotify/spotify.auth.js
// Spotify OAuth authentication with PKCE flow

import { SPOTIFY_CONFIG } from "./spotify.config.local.js";

// Generate a random string for PKCE
function generateRandomString(length) {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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

// Store PKCE verifier in sessionStorage
function storeVerifier(verifier) {
  sessionStorage.setItem("spotify_code_verifier", verifier);
}

// Get stored verifier
function getVerifier() {
  return sessionStorage.getItem("spotify_code_verifier");
}

// Clear stored verifier
function clearVerifier() {
  sessionStorage.removeItem("spotify_code_verifier");
}

// Store access token
export function storeAccessToken(token, expiresIn) {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem("spotify_access_token", token);
  localStorage.setItem("spotify_token_expires_at", expiresAt.toString());
}

// Get stored access token
export function getAccessToken() {
  const token = localStorage.getItem("spotify_access_token");
  const expiresAt = localStorage.getItem("spotify_token_expires_at");

  if (!token || !expiresAt) {
    return null;
  }

  // Check if token is expired
  if (Date.now() >= parseInt(expiresAt, 10)) {
    clearAccessToken();
    return null;
  }

  return token;
}

// Clear access token
export function clearAccessToken() {
  localStorage.removeItem("spotify_access_token");
  localStorage.removeItem("spotify_token_expires_at");
  localStorage.removeItem("spotify_refresh_token");
}

// Store refresh token
export function storeRefreshToken(token) {
  localStorage.setItem("spotify_refresh_token", token);
}

// Get refresh token
export function getRefreshToken() {
  return localStorage.getItem("spotify_refresh_token");
}

// Check if user is authenticated
export function isAuthenticated() {
  return getAccessToken() !== null;
}

// Initiate OAuth login flow
export async function initiateLogin() {
  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);

  storeVerifier(verifier);

  const redirectUri = SPOTIFY_CONFIG.REDIRECT_URI;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CONFIG.CLIENT_ID,
    scope: SPOTIFY_CONFIG.SCOPES,
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.href = `${SPOTIFY_CONFIG.AUTH_URL}?${params.toString()}`;
}

// Handle OAuth callback and exchange code for token
export async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const error = urlParams.get("error");

  // Clean up URL
  window.history.replaceState({}, document.title, window.location.pathname);

  if (error) {
    throw new Error(`Spotify authorization error: ${error}`);
  }

  if (!code) {
    return false; // No code in URL, user hasn't authorized yet
  }

  const verifier = getVerifier();
  if (!verifier) {
    throw new Error("Code verifier not found. Please try logging in again.");
  }

  try {
    const response = await fetch(SPOTIFY_CONFIG.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        code_verifier: verifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Token exchange failed: ${
          errorData.error_description || errorData.error
        }`
      );
    }

    const data = await response.json();

    storeAccessToken(data.access_token, data.expires_in);
    if (data.refresh_token) {
      storeRefreshToken(data.refresh_token);
    }

    clearVerifier();

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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Token refresh failed: ${
          errorData.error_description || errorData.error
        }`
      );
    }

    const data = await response.json();

    storeAccessToken(data.access_token, data.expires_in);
    if (data.refresh_token) {
      storeRefreshToken(data.refresh_token);
    }

    return data.access_token;
  } catch (err) {
    clearAccessToken();
    throw err;
  }
}

// Logout
export function logout() {
  clearAccessToken();
  clearVerifier();
}
