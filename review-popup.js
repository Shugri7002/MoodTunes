const overlay = document.getElementById("reviewOverlay");
const yesBtn = document.getElementById("reviewYes");
const noBtn = document.getElementById("reviewNo");
const notNowBtn = document.getElementById("reviewNotNow");

function openReviewPopup() {
  if (!overlay) return;
  overlay.style.display = "flex";
}

function closeReviewPopup() {
  if (!overlay) return;
  overlay.style.display = "none";
}

if (yesBtn) {
  yesBtn.addEventListener("click", () => {
    // optional: save for research
    localStorage.setItem("reviewAnswer", "yes");
    closeReviewPopup();
  });
}

if (noBtn) {
  noBtn.addEventListener("click", () => {
    localStorage.setItem("reviewAnswer", "no");
    closeReviewPopup();
  });
}

if (notNowBtn) {
  notNowBtn.addEventListener("click", closeReviewPopup);
}

// clicking outside closes it too
if (overlay) {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeReviewPopup();
  });
}

window.showReviewPopup = openReviewPopup;
