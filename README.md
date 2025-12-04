# Interactive 3D Particle System

A real-time interactive 3D visualization project that responds to user gestures and facial expressions. Built with Three.js and MediaPipe.

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

## Deploy to EdgeOne Pages
[![Deploy to EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fzhoujie0531%2Fpayload-mongodb-starter)

## 📂 Project Structure

*   `index.html`: Entry point, imports dependencies and sets up the DOM.
*   `main.js`: Main application logic, scene initialization, and render loop.
*   `particles.js`: `ParticleSystem` class, handles particle generation, transitions, and shaders.
*   `vision.js`: `VisionManager` class, handles MediaPipe model initialization and inference logic.
*   `style.css`: Basic styling for UI elements.




