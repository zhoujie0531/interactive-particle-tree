import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
// Note: MediaPipe imports are handled via global scripts in index.html for now due to potential ESM compatibility issues with CDN versions, 
// but we will try to use the import map versions if possible. 
// Actually, the importmap in index.html defines them. Let's try to dynamic import or assume global if they attach to window.
// However, standard practice with importmap is to import them.
// Let's assume we need to handle the logic in a separate module for clarity.

import { ParticleSystem } from './particles.js';
import { VisionManager } from './vision.js';

// State Management
const state = {
    particleCount: 50000,
    modelType: 'christmasTree',
    baseColor: '#ffffff',
    handDistance: 1.0, // 0.0 (closed) to 1.0 (open) -> affects spread
    emotion: 'neutral', // 'neutral', 'happy', 'surprise', 'angry', 'sad'
    autoRotate: true
};

// Init Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.002);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Particle System
const particleSystem = new ParticleSystem(scene, state.particleCount);
particleSystem.generateModel(state.modelType);
// Set initial scale to default hand distance mapping (1.0 -> 0.9)
particleSystem.setTargetScale(0.9);
particleSystem.scale = 0.9; // Force initial scale immediately

// Vision Manager (MediaPipe)
const visionManager = new VisionManager();
visionManager.init(document.querySelector('.input_video'), onVisionUpdate);

function onVisionUpdate(data) {
    // data contains { hands: { distance }, face: { emotion } }
    if (data.hands) {
        // Update scaling based on hand distance
        // Map distance 0..1 to scale
        // Widen the range significantly for more dramatic effect
        // 0.0 (Fist) -> 0.2 (Tiny)
        // 1.0 (Open) -> 1.1 (Large but manageable)
        const targetScale = THREE.MathUtils.mapLinear(data.hands.distance, 0, 1, 0.2, 1.1);
        particleSystem.setTargetScale(targetScale);

        // Update UI
        const distPercent = Math.round(data.hands.distance * 100);
        document.getElementById('gesture-display').innerHTML = `✋ Hand Open/Close: ${distPercent}%`;
    }

    if (data.face) {
        // Update color based on emotion if color is not manually overridden (we can add a lock or priority)
        // For now, let's just pass the emotion to particle system to decide target color
        particleSystem.setEmotion(data.face.emotion);
        
        // Update UI
        const emotionIcons = {
            'happy': '😄',
            'surprise': '😲',
            'angry': '😠',
            'sad': '😢',
            'neutral': '😐'
        };
        const icon = emotionIcons[data.face.emotion] || '😐';
        // Capitalize first letter
        const emotionText = data.face.emotion.charAt(0).toUpperCase() + data.face.emotion.slice(1);
        document.getElementById('emotion-display').innerHTML = `${icon} Emotion: ${emotionText}`;
    }
}

// UI
const gui = new GUI({ title: 'Controls' });

gui.addColor(state, 'baseColor')
    .name('Base Color')
    .onChange(val => particleSystem.setBaseColor(val));

gui.add(state, 'particleCount', 1000, 50000, 100)
    .name('Particle Count')
    .onFinishChange(val => particleSystem.updateParticleCount(val));

gui.add(state, 'autoRotate').name('Auto Rotate');

const obj = {
    fullscreen: () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
};
gui.add(obj, 'fullscreen').name('Toggle Fullscreen');


// Resize Handler
window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    controls.update();

    if (state.autoRotate) {
        particleSystem.mesh.rotation.y += 0.001;
    }

    particleSystem.update(delta, time);

    renderer.render(scene, camera);
}

animate();

// Remove loading text when ready (conceptually, vision might take longer)
// document.getElementById('loading').style.display = 'none';
