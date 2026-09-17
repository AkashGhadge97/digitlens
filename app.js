import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm";

const video = document.querySelector("#webcam");
const canvas = document.querySelector("#overlay");
const context = canvas.getContext("2d");
const countEl = document.querySelector("#count");
const countLabel = document.querySelector("#countLabel");
const handCountEl = document.querySelector("#handCount");
const trackingState = document.querySelector("#trackingState");
const statusEl = document.querySelector("#cameraStatus");
const emptyState = document.querySelector("#emptyState");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const mirrorToggle = document.querySelector("#mirrorToggle");

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";
const CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
let handLandmarker, stream, animationFrame, lastVideoTime = -1;
const recentCounts = [];

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }

function angle(a, vertex, b) {
  const first = [a.x - vertex.x, a.y - vertex.y, a.z - vertex.z];
  const second = [b.x - vertex.x, b.y - vertex.y, b.z - vertex.z];
  const dot = first.reduce((sum, value, index) => sum + value * second[index], 0);
  const size = Math.hypot(...first) * Math.hypot(...second);
  return Math.acos(Math.max(-1, Math.min(1, dot / size))) * 180 / Math.PI;
}

function isFingerExtended(landmarks, mcp, pip, dip, tip) {
  // Joint angles work with the palm or back of the hand facing the camera.
  return angle(landmarks[mcp], landmarks[pip], landmarks[dip]) > 150
    && angle(landmarks[pip], landmarks[dip], landmarks[tip]) > 145;
}

function isThumbExtended(landmarks) {
  const straight = angle(landmarks[2], landmarks[3], landmarks[4]) > 150;
  // A tucked thumb is close to the index-finger base; an open thumb is not.
  return straight && distance(landmarks[4], landmarks[5]) > distance(landmarks[3], landmarks[5]) * 1.1;
}

function countFingers(landmarks) {
  let count = isThumbExtended(landmarks) ? 1 : 0;
  [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]].forEach((finger) => {
    if (isFingerExtended(landmarks, ...finger)) count += 1;
  });
  return count;
}

function drawHand(landmarks) {
  const width = canvas.width, height = canvas.height;
  context.strokeStyle = "#56ddff"; context.lineWidth = 3; context.lineCap = "round";
  CONNECTIONS.forEach(([a, b]) => { context.beginPath(); context.moveTo(landmarks[a].x * width, landmarks[a].y * height); context.lineTo(landmarks[b].x * width, landmarks[b].y * height); context.stroke(); });
  landmarks.forEach((point) => { context.beginPath(); context.arc(point.x * width, point.y * height, 4, 0, Math.PI * 2); context.fillStyle = "#ffffff"; context.fill(); context.strokeStyle = "#257da3"; context.lineWidth = 1.5; context.stroke(); });
}

function render() {
  if (!stream) return;
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const result = handLandmarker.detectForVideo(video, performance.now());
    context.clearRect(0, 0, canvas.width, canvas.height);
    let rawCount = 0;
    result.landmarks.forEach((landmarks) => { rawCount += countFingers(landmarks); drawHand(landmarks); });
    recentCounts.push(rawCount); if (recentCounts.length > 7) recentCounts.shift();
    const stable = [...new Set(recentCounts)].reduce((best, value) => recentCounts.filter((item) => item === value).length > recentCounts.filter((item) => item === best).length ? value : best, 0);
    countEl.textContent = stable; countLabel.textContent = stable === 1 ? "finger" : "fingers";
    handCountEl.textContent = `${result.landmarks.length} / 2`;
    trackingState.textContent = result.landmarks.length ? "Tracking" : "Looking…";
  }
  animationFrame = requestAnimationFrame(render);
}

async function startCamera() {
  try {
    startButton.disabled = true; statusEl.textContent = "Loading detector…";
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm");
    handLandmarker ??= await HandLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: MODEL_URL }, runningMode: "VIDEO", numHands: 2, minHandDetectionConfidence: 0.65, minHandPresenceConfidence: 0.65, minTrackingConfidence: 0.6 });
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    video.srcObject = stream; await video.play();
    video.classList.toggle("mirrored", mirrorToggle.checked); canvas.classList.toggle("mirrored", mirrorToggle.checked);
    emptyState.hidden = true; statusEl.textContent = "Camera on"; stopButton.disabled = false; render();
  } catch (error) { statusEl.textContent = "Camera unavailable"; document.querySelector("#hint").textContent = `Could not start camera: ${error.message}`; startButton.disabled = false; }
}

function stopCamera() { cancelAnimationFrame(animationFrame); stream?.getTracks().forEach((track) => track.stop()); stream = undefined; video.srcObject = null; context.clearRect(0, 0, canvas.width, canvas.height); emptyState.hidden = false; statusEl.textContent = "Camera off"; handCountEl.textContent = "0 / 2"; trackingState.textContent = "Waiting"; startButton.disabled = false; stopButton.disabled = true; }
startButton.addEventListener("click", startCamera); stopButton.addEventListener("click", stopCamera);
mirrorToggle.addEventListener("change", () => { video.classList.toggle("mirrored", mirrorToggle.checked); canvas.classList.toggle("mirrored", mirrorToggle.checked); });
