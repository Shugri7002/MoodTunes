// js/auth.js
import {
  isAuthenticated,
  initiateLogin,
  handleCallback,
  logout as spotifyLogout,
} from "../spotify/spotify.auth.js";
import { spotify } from "../spotify/spotify.adapter.js";

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const continueBtn = document.getElementById("continue-btn");
const userInfo = document.getElementById("user-info");
const userName = document.getElementById("user-name");

// Handle OAuth callback
async function initAuth() {
  try {
    const handled = await handleCallback();
    if (handled) {
      await updateAuthUI();
    } else {
      await updateAuthUI();
    }
  } catch (err) {
    console.error("Authentication error:", err);
  }
}

async function updateAuthUI() {
  const authenticated = isAuthenticated();

  if (authenticated) {
    try {
      const user = await spotify.getMe();
      userName.textContent = user.display_name || user.id;
      loginBtn.style.display = "none";
      userInfo.style.display = "block";
    } catch (err) {
      console.error("Failed to get user info:", err);
      loginBtn.style.display = "block";
      userInfo.style.display = "none";
    }
  } else {
    loginBtn.style.display = "block";
    userInfo.style.display = "none";
  }
}

loginBtn.addEventListener("click", () => {
  initiateLogin();
});

logoutBtn.addEventListener("click", () => {
  spotifyLogout();
  updateAuthUI();
});

continueBtn.addEventListener("click", () => {
  window.location.href = "scan.html";
});

// Initialize on page load
initAuth();
