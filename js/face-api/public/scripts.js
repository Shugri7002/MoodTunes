const startButton = document.getElementById("start-camera");
const stopButton = document.getElementById("stop-camera");
const videoFeedEl = document.getElementById("video-feed");
const canvas = document.getElementById("canvas");

let currentStream = null;
let detectionInterval = null;

async function loadModels() {
  console.log("Modellen laden...");
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("../js/face-api/public/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("../js/face-api/public/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("../js/face-api/public/models"),
    faceapi.nets.ageGenderNet.loadFromUri("../js/face-api/public/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("../js/face-api/public/models"),
  ]);
  console.log("Modellen klaar.");
}
loadModels();

startButton.addEventListener("click", async () => {
  try {
    startButton.disabled = true;
    startButton.innerText = "Laden...";
    currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoFeedEl.srcObject = currentStream;

    // Wacht tot de video echt speelt voordat we detectie starten
    videoFeedEl.onloadedmetadata = () => {
      startDetection();
      startButton.innerText = "Camera Actief";
      stopButton.disabled = false;
    };
  } catch (err) {
    console.error("Fout:", err);
    startButton.disabled = false;
    startButton.innerText = "Start Camera";
  }
});

stopButton.addEventListener("click", () => {
  if (detectionInterval) clearInterval(detectionInterval);
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }
  videoFeedEl.srcObject = null;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  startButton.disabled = false;
  startButton.innerText = "Start Camera";
  stopButton.disabled = true;
});

function startDetection() {
  const displaySize = { width: videoFeedEl.width, height: videoFeedEl.height };
  // De 'true' zorgt dat het canvas element ook echt die pixels krijgt
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
      .withFaceExpressions()
      .withAgeAndGender();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    resizedDetections.forEach((detection) => {
      const expressions = detection.expressions;

      // De boost logica
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

      faceapi.draw.drawDetections(canvas, resizedDetections);
      //   faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      // Bovenkant box: Emotie
      new faceapi.draw.DrawTextField(
        [`Emotie: ${dominantExpression} (${confidence}%)`],
        detection.detection.box.topLeft
      ).draw(canvas);

      // Onderkant box: Leeftijd en Geslacht
      //   new faceapi.draw.DrawTextField(
      //     [
      //       `${Math.round(detection.age)} jaar`,
      //       `${detection.gender} (${Math.round(
      //         detection.genderProbability * 100
      //       )}%)`,
      //     ],
      //     detection.detection.box.bottomLeft
      //   ).draw(canvas);
    });
  }, 100);
}
