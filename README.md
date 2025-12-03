# Interactive 3D Particle System

A real-time interactive 3D visualization project that responds to user gestures and facial expressions. Built with Three.js and MediaPipe.

## Features

*   **Dynamic Particle Models**: Transform particles into various shapes including Christmas Tree, Heart, Flower, Saturn, and Fireworks.
*   **Hand Gesture Control**: Use your hand to control the scale and dispersion of the particles.
    *   **Open Hand**: Particles expand/scale up.
    *   **Closed Fist**: Particles contract/scale down.
*   **Facial Expression Recognition**: The system detects your facial emotions and changes the particle colors accordingly.
    *   **Happy** → Sunny Yellow, Orange & Hot Pink mix
    *   **Surprise** → Lime Green & Magenta mix
    *   **Angry** → Red & Orange mix
    *   **Sad** → Deep Blue & Pale Grey mix
    *   **Neutral** → Original model colors
*   **High-Performance Rendering**: Optimized buffer geometry rendering 60,000+ particles.

## Technologies Used

*   **Three.js**: For 3D rendering and particle systems.
*   **MediaPipe (Google)**:
    *   `@mediapipe/hands`: For hand tracking and gesture recognition.
    *   `@mediapipe/face_mesh`: For facial landmark detection and emotion analysis.
*   **lil-gui**: For the on-screen control panel.

## Installation & Running

Since this project uses ES6 Modules, it requires a local web server to run (to avoid CORS issues with `file://` protocol).

1.  **Clone the repository** or download the source code.
2.  **Start a local server** inside the project directory.
    *   If you have Python installed:
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

## Project Structure

*   `index.html`: Entry point, imports dependencies and sets up the DOM.
*   `main.js`: Main application logic, scene initialization, and render loop.
*   `particles.js`: `ParticleSystem` class, handles particle generation, transitions, and shaders.
*   `vision.js`: `VisionManager` class, handles MediaPipe model initialization and inference logic.
*   `style.css`: Basic styling for UI elements.

## Controls

*   **Top Right Panel**: Use the GUI to manually switch shapes, change base colors, or toggle auto-rotation.
*   **Webcam Interaction**: Move your hand or change your facial expression to interact with the particles in real-time.

