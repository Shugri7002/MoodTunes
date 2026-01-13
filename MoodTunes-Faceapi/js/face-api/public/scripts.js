const videoFeedEl = document.getElementById("video-feed");
const canvas = document.getElementById("canvas");
const continueButton = document.getElementById("continue-button");
const resultDisplay = document.getElementById("result-display");

let currentStream = null;
let detectionInterval = null;
let lastDetectedEmotion = "Nog geen emotie gedetecteerd";

// --- CONTINUE KNOP LOGICA ---
continueButton.addEventListener("click", () => {
  // Sla de emotie op voor de volgende pagina
  localStorage.setItem("gescandeEmotie", lastDetectedEmotion);
  window.location.href = "mood-options.html";
});

// --- INITIALISATIE ---
async function init() {
  resultDisplay.innerText = "Modellen laden...";
  try {
    // Zorg dat dit pad exact naar je modellen-map wijst
    const MODEL_URL = "../js/face-api/public/models";

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);

    resultDisplay.innerText = "Camera starten...";
    startCamera();
  } catch (err) {
    resultDisplay.innerText = "Fout bij laden modellen.";
    console.error("Modellen fout:", err);
  }
}

// --- CAMERA STARTEN ---
async function startCamera() {
  try {
    // We vragen een standaard resolutie aan, CSS regelt de weergave
    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user" // Forceert de selfie-camera op mobiel
      }
    };

    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoFeedEl.srcObject = currentStream;

    videoFeedEl.onloadedmetadata = () => {
      videoFeedEl.play();
      startDetection();
    };
  } catch (err) {
    resultDisplay.innerText = "Camera toegang geweigerd.";
    console.error("Camera fout:", err);
  }
}

// --- EMOTIE DETECTIE LUS ---
function startDetection() {
  // Functie om de canvas grootte exact gelijk te maken aan de video op het scherm
  const updateCanvasSize = () => {
    const rect = videoFeedEl.getBoundingClientRect();
    const displaySize = { width: rect.width, height: rect.height };
    faceapi.matchDimensions(canvas, displaySize);
    return displaySize;
  };

  let displaySize = updateCanvasSize();

  // Herbereken als het scherm gedraaid wordt of van grootte verandert
  window.addEventListener('resize', () => {
    displaySize = updateCanvasSize();
  });

  detectionInterval = setInterval(async () => {
    if (!videoFeedEl.srcObject || videoFeedEl.paused || videoFeedEl.ended) return;

    // Detectie uitvoeren
    const detections = await faceapi
      .detectAllFaces(
        videoFeedEl,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceExpressions();

    // Resultaten aanpassen aan de schermgrootte
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // Canvas schoonmaken
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (resizedDetections.length > 0) {
      const expressions = resizedDetections[0].expressions;

      // Boost logica voor bepaalde emoties
      const customExpressions = {
        ...expressions,
        angry: expressions.angry * 2.5,
        sad: expressions.sad * 1.5,
      };

      // Zoek de hoogste waarde
      const dominant = Object.keys(customExpressions).reduce((a, b) =>
        customExpressions[a] > customExpressions[b] ? a : b
      );

      const confidence = Math.round(Math.min(customExpressions[dominant] * 100, 100));

      // Update UI en variabele
      lastDetectedEmotion = dominant;
      resultDisplay.innerText = `Gedetecteerd: ${dominant.toUpperCase()} (${confidence}%)`;
      resultDisplay.style.color = "var(--purple)";

      // Teken de herkenningsbox en landmarks op het canvas
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    } else {
      resultDisplay.innerText = "Geen gezicht gevonden...";
      resultDisplay.style.color = "#888";
    }
  }, 200); // 200ms is stabieler voor mobiele processors
}

// Start het script
init();