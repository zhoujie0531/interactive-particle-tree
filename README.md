# Interactive 3D Particle System

A real-time interactive 3D visualization project that responds to user gestures and facial expressions. Built with Three.js and MediaPipe.

## Deploy to EdgeOne Pages
One-click deployment to EdgeOne Pages provides an instant access link!

[![Deploy to EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fzhoujie0531%2Finteractive-particle-tree)


## 🎮 Controls

*   **Top Right Panel**:
    *   `Base Color`: Manually set base color (overrides emotion colors).
    *   `Particle Count`: Adjust particle count (Press Enter to confirm).
    *   `Auto Rotate`: Toggle auto-rotation.
*   **Webcam Interaction**:
    *   Face your palm to the camera, try opening and closing your hand.
    *   Make exaggerated expressions (laugh, surprise, frown) to the camera and observe the color changes.

## ✨ Features

*   **Hand Gesture Control**: Use your hand to control the scale and dispersion of the particles.
    *   **Open Hand**: Particles expand/scale up.
    *   **Closed Fist**: Particles contract/scale down.
*   **Facial Expression Recognition**: The system detects your facial emotions and changes the particle colors accordingly.
    *   **😐 Neutral**: Dreamy mix of White & Soft Pink.
    *   **😄 Happy**: Restores the original colorful Christmas tree (Green leaves, lights, gold star).
    *   **😲 Surprise**: Bright mix of Sunny Yellow, Vibrant Orange & Hot Pink.
    *   **😠 Angry**: Warning mix of Red & Orange.
    *   **😢 Sad**: Melancholic mix of Deep Blue & Pale Blue-Grey.
*   **High-Performance Rendering**: Optimized buffer geometry rendering 60,000+ particles for a delicate visual experience.

## 🛠️ Tech Stack

*   **Three.js**: Core 3D rendering engine.
*   **MediaPipe (Google)**:
    *   `@mediapipe/hands`: High-precision hand tracking.
    *   `@mediapipe/face_mesh`: Face mesh and landmark detection.
*   **lil-gui**: Lightweight on-screen parameter control panel.

## 🚀 Local Development

Since this project uses ES6 Modules, it requires a local web server to run (to avoid CORS issues with `file://` protocol).

1.  **Clone the repository** or download the source code.
2.  **Start a local server** inside the project directory.
    *   If you have Python installed (Recommended):
        ```bash
        # Python 3
        python3 -m http.server 8000
        ```
    *   Or using Node.js `http-server`:
        ```bash
        npx http-server
        ```
    *   Or using VS Code:
        *   Install "Live Server" extension.
        *   Right-click `index.html` and choose "Open with Live Server".
3.  **Open your browser** to `http://localhost:8000` (or the port shown).
4.  **Allow Camera Access**: The application requires webcam access to track gestures and expressions.

## 📂 Project Structure

*   `index.html`: Entry point, imports dependencies and sets up the DOM.
*   `main.js`: Main application logic, scene initialization, and render loop.
*   `particles.js`: `ParticleSystem` class, handles particle generation, transitions, and shaders.
*   `vision.js`: `VisionManager` class, handles MediaPipe model initialization and inference logic.
*   `style.css`: Basic styling for UI elements.

## Suggested Prompt
```text

Role Setting: You are a senior front-end engineer proficient in WebGL (Three.js) and computer vision (MediaPipe).

Objective: Develop a web-based interactive 3D particle system project, centered around a 3D Christmas tree composed of tens of thousands of particles. The system should be capable of altering the Christmas tree’s form and color in real time by capturing user gestures and facial expressions via a camera.

Core Requirements:

3D Particle Rendering (Three.js):

Create a 3D scene with 50,000+ particles.

Use THREE.Points and a custom ShaderMaterial to render particles, achieving high performance and a glowing effect.

Model Form: The core model is a Christmas Tree, with particles forming a clear trunk, three layers of conical foliage, and decorative accents.

Dynamic Effects: Particles should have subtle floating animations and transition smoothly via Lerp interpolation during state changes.

Gesture Interaction (MediaPipe Hands):

Integrate the MediaPipe Hands library to track the user’s hand in real time via the camera.

Function: Calculate the degree of hand openness (0% clenched fist - 100% fully open).

Interaction Logic: The degree of hand openness directly controls the Christmas tree’s size/scale (clenched fist makes it smaller, open hand makes it larger).

Emotion Recognition Interaction (MediaPipe Face Mesh):

Integrate the MediaPipe Face Mesh library to analyze user facial landmarks in real time.

Recognize the following 5 emotions and change the particle color theme accordingly:

😐 Neutral: The entire tree adopts a dreamy white + soft pink style (no yellow star at the top).

😄 Happy: Restores the classic Christmas tree colors green foliage, brown trunk, colorful lights, golden top star.

😲 Surprise: Switches to a bright warm palette of sunny yellow + vibrant orange + hot pink.

😠 Angry: Switches to a cautionary palette of red + orange (optimize eyebrow recognition thresholds for easier triggering).

😢 Sad: Switches to a cool palette of midnight dark blue + steel blue.

UI Interface:

Top-left display: Real-time hand openness percentage (✋ Hand Open/Close).

Top-right display: Currently detected emotional state (😄 Emotion).

Control Panel (GUI): Includes "Base Color," "Particle Count," "Auto Rotate," "Toggle Fullscreen."

Note: No model shape switching functionality is provided; the focus is solely on the Christmas tree.

Tech Stack & Specifications:

Front-end Framework: Vanilla JS (ES6 modules) or a simple HTML/CSS/JS structure.

Libraries: Three.js (rendering), MediaPipe (vision), lil-gui (control panel).

Style: Dark background (#050505), glowing particles, combining a modern tech aesthetic with festive ambiance.
```




