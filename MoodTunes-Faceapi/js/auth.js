// js/auth.js
import { initiateLogin, handleCallback, isAuthenticated, logout } from "../spotify/spotify.auth.js";

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const statusEl = document.getElementById("status");
const continueBtn = document.getElementById("continue-btn"); // optional in HTML

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg || "";
}

// Helper: safe redirect (same folder)
function goToMoodOptions() {
  window.location.assign("./scan.html");
}

async function init() {
  try {
    // 1) If we returned from Spotify, handle callback once
    const didCallback = await handleCallback();
    if (didCallback) {
      setStatus("✅ Login gelukt! Doorsturen...");
      goToMoodOptions();
      return;
    }

    // 2) Normal page load
    if (isAuthenticated()) {
      setStatus("✅ Ingelogd. Je kunt doorgaan.");
      if (continueBtn) continueBtn.style.display = "inline-block";
    } else {
      setStatus("Niet ingelogd");
      if (continueBtn) continueBtn.style.display = "none";
    }
  } catch (e) {
    console.error(e);
    setStatus(`❌ Auth error: ${e?.message || String(e)}`);
  }
}

// Click handlers
loginBtn?.addEventListener("click", async () => {
  try {
    setStatus("Redirecting to Spotify...");
    await initiateLogin(); // this redirects
  } catch (e) {
    console.error(e);
    setStatus(`❌ Login failed: ${e?.message || String(e)}`);
  }
});

logoutBtn?.addEventListener("click", () => {
  logout();
  setStatus("Uitgelogd + tokens gewist. Refresh de pagina.");
  if (continueBtn) continueBtn.style.display = "none";
});

continueBtn?.addEventListener("click", () => {
  if (isAuthenticated()) goToMoodOptions();
});

init();
