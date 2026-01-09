const videoFeedEl = document.getElementById("video-feed");
const canvas = document.getElementById("canvas");
const continueButton = document.getElementById("continue-button");

let currentStream = null;
let detectionInterval = null;
let lastDetectedEmotion = "Nog geen emotie gedetecteerd";

// --- CONTINUE KNOP LOGICA (Slechts één keer nodig) ---
continueButton.addEventListener("click", () => {
  // Sla de laatst gemeten emotie op
  localStorage.setItem("gescandeEmotie", lastDetectedEmotion);

  // Stuur de gebruiker naar de volgende pagina
  // Kies hier de juiste pagina (bijv. mood-options.html)
  window.location.href = "mood-options.html";
});

// --- INITIALISATIE ---
async function init() {
  console.log("Modellen laden...");
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("../js/face-api/public/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri(
        "../js/face-api/public/models"
      ),
      faceapi.nets.faceRecognitionNet.loadFromUri(
        "../js/face-api/public/models"
      ),
      faceapi.nets.ageGenderNet.loadFromUri("../js/face-api/public/models"),
      faceapi.nets.faceExpressionNet.loadFromUri(
        "../js/face-api/public/models"
      ),
    ]);
    console.log("Modellen klaar. Camera starten...");
    startCamera();
  } catch (err) {
    console.error("Fout bij laden modellen:", err);
  }
}

// --- CAMERA STARTEN ---
async function startCamera() {
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoFeedEl.srcObject = currentStream;

    videoFeedEl.onloadedmetadata = () => {
      startDetection();
      console.log("Detectie gestart");
    };
  } catch (err) {
    console.error("Camera fout:", err);
  }
}

// --- EMOTIE DETECTIE LUS ---
function startDetection() {
  const displaySize = { width: videoFeedEl.width, height: videoFeedEl.height };
  faceapi.matchDimensions(canvas, displaySize);

  detectionInterval = setInterval(async () => {
    if (!videoFeedEl.srcObject || videoFeedEl.paused || videoFeedEl.ended)
      return;

    const detections = await faceapi
      .detectAllFaces(
        videoFeedEl,
        new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.5,
          maxResults: 1,
        })
      )
      .withFaceLandmarks()
      .withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    resizedDetections.forEach((detection) => {
      const expressions = detection.expressions;

      // Jouw boost logica
      const customExpressions = {
        ...expressions,
        angry: expressions.angry * 2.5,
        sad: expressions.sad * 1.5,
      };

      const dominantExpression = Object.keys(customExpressions).reduce((a, b) =>
        customExpressions[a] > customExpressions[b] ? a : b
      );

      const confidence = Math.round(
        Math.min(customExpressions[dominantExpression] * 100, 100)
      );

      // Werk de variabele bij die we gebruiken bij het klikken op 'Continue'
      lastDetectedEmotion = `${dominantExpression} (${confidence}%)`;

      // Teken de resultaten op het canvas
      faceapi.draw.drawDetections(canvas, resizedDetections);
      new faceapi.draw.DrawTextField(
        [`Emotie: ${dominantExpression} (${confidence}%)`],
        detection.detection.box.topLeft
      ).draw(canvas);
    });
  }, 100);
}

// Start het proces
init();
