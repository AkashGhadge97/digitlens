# DigitLens

DigitLens is a browser-only webcam finger counter. Show one or two hands to your camera and it displays the number of extended fingers from **0 to 10**.

All detection happens in your browser. The application does not upload or store camera video.

## Features

- Counts fingers across up to two hands (0–10).
- Draws detected hand landmarks over the live video preview.
- Supports palm-facing and back-of-hand-facing views by measuring finger-joint angles.
- Uses a short stability filter to reduce one-frame count flicker.
- Lets you start and stop the webcam and choose whether to mirror the preview.

## Requirements

- A modern version of **Google Chrome** or **Microsoft Edge**.
- A working webcam.
- Python installed only to start a simple local web server. No virtual environment, `pip install`, or Python packages are needed.
- Internet access when opening the app so the browser can load the MediaPipe hand-tracking model and WebAssembly runtime.

## Run the application

1. Open PowerShell in the project folder:

   ```powershell
   cd C:\AG_GIT_WS\digitlens
   ```

2. Start a local web server:

   ```powershell
   python -m http.server 8000
   ```

3. Open this address in Chrome or Edge:

   ```text
   http://localhost:8000
   ```

4. Select **Start camera** and choose **Allow** when the browser requests camera permission.

5. Hold one or both hands in frame. The number in the “Fingers detected” card updates from 0 to 10.

6. When finished, select **Stop camera**. To stop the local server, return to PowerShell and press `Ctrl+C`.

> Do not open `index.html` by double-clicking it or with a `file:///` URL. Browser security rules block JavaScript modules and camera features in that mode. Always use `http://localhost:8000`.

## Controls

| Control | What it does |
| --- | --- |
| **Start camera** | Requests webcam permission and begins live hand tracking. |
| **Stop camera** | Stops the webcam stream immediately. |
| **Mirror preview** | Shows a selfie-style, left-right reversed preview. This only changes the display. |

## How finger counting works

DigitLens loads MediaPipe’s browser hand-landmark model. For each detected hand, it identifies 21 hand points and assesses whether the thumb, index, middle, ring, and little finger are extended.

For the four long fingers, it evaluates the bend at the finger joints rather than only comparing vertical position. This is more reliable when you rotate the hand or show the palm versus the back of the hand. The thumb is assessed from its joint angle and its distance from the index-finger base. Counts from both hands are combined and briefly smoothed before display.

## Tips for best detection

- Face the camera with your palm or the back of your hand; keep fingers clearly separated.
- Keep the hand approximately upright and fully inside the camera view.
- Use even, bright front lighting and avoid a strong light source behind you.
- Keep your hand 30–80 cm from the camera so the landmarks are clear.
- For 6–10, show both hands without one covering the other.
- The thumb may be less reliable when it is only partly extended; open it distinctly away from your palm.

## Troubleshooting

### I see a `file:///` or CORS error in DevTools

The page was opened directly from the file system. Start the local server and use `http://localhost:8000` as described above.

### The browser says the camera is unavailable or permission is denied

Check the camera icon in the browser address bar and allow access for `localhost`. Also ensure another application such as Teams, Zoom, or Camera is not currently using the webcam. Refresh the page after changing permission.

### The app shows no hands

Check lighting, move closer to the camera, and keep the full hand in frame. Reload the page with `Ctrl+F5` to ensure the latest browser code is loaded.

### Finger counts are inaccurate

Keep the fingers separated and fully extended. Avoid motion blur, partial hands, overlapping hands, or pointing hands directly toward the lens. Try disabling **Mirror preview** if the display orientation feels confusing; it does not affect the model’s calculations.

### `python` is not recognized

Install Python from [python.org](https://www.python.org/downloads/) and reopen PowerShell, or use any other static web server you already have available. The DigitLens application itself remains browser-only.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and user interface. |
| `styles.css` | Responsive visual styling. |
| `app.js` | Camera control, MediaPipe browser model setup, landmark rendering, and finger counting. |

## Technology

- HTML, CSS, and vanilla JavaScript
- Browser `getUserMedia` webcam API
- MediaPipe Tasks Vision (loaded from a CDN)

## Privacy

Your video stream remains in the browser tab. DigitLens processes landmarks locally in the browser and does not include an application server, account system, recording feature, or upload endpoint.
