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
    autoRotate: true,
    enableFaceExpression: true, // New flag
    enableGesture: true // Hand gesture control
};



// Raycaster for interaction (Defined early to avoid ReferenceError)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Init Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.002);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 75; // Increased from 50 to 75 to fit the taller tree

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

// --- Envelopes / Decorations System ---
const envelopeGroup = new THREE.Group();
const envelopeMeshes = []; // Array to track decoration meshes
scene.add(envelopeGroup);

// Invisible Hit Cone for placement
// Updated to match the refined 3-layer fat tree model
// Tree spans approx Y: -22 to +33, Widest Radius ~35
const hitConeGeo = new THREE.ConeGeometry(35, 55, 32, 1, true); // Open ended
const hitConeMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
const hitCone = new THREE.Mesh(hitConeGeo, hitConeMat);
hitCone.position.y = 5; // Center of the cone
scene.add(hitCone);

// Add simple lighting for standard material
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); 
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 2, 100); 
pointLight.position.set(10, 20, 20);
scene.add(pointLight);
const pointLight2 = new THREE.PointLight(0xffffff, 1, 100);
pointLight2.position.set(-10, 10, -20);
scene.add(pointLight2);

const wishMessages = [
    "Merry Christmas and Happy New Year! 🎄\n圣诞快乐，新年大吉！",
    "Wishing you good health and prosperity. 🧧\n祝您身体健康，恭喜发财。",
    "May all your dreams come true this year. ✨\n愿您今年美梦成真。",
    "Peace, love, and joy to you and yours. ❤️\n愿平安、爱与喜悦伴随您和家人。",
    "Wishing you a year filled with laughter. 😄\n祝您拥有充满欢笑的一年。",
    "May the magic of the season fill your heart. 🌟\n愿节日的魔力充满您的心间。",
    "Good luck and great success in the coming year. 🚀\n祝来年好运连连，事业有成。",
    "Warmest thoughts and best wishes. 🎁\n致以最温暖的思念和最美好的祝福。",
    "May your home be filled with warmth and love. 🏠\n愿您的家充满温暖与爱。",
    "Cheers to a fresh start and new beginnings! 🥂\n为全新的开始干杯！",
    "May prosperity and fortune be with you. 💰\n愿财源广进，福气相随。",
    "Wishing you peace and happiness. 🕊️\n祝您平安喜乐。",
    "May this season bring you endless joy. 🎊\n愿这个节日带给您无尽的快乐。",
    "Sending you hugs and warm wishes. 🤗\n送上拥抱和温暖的祝福。",
    "May your days be painted in gold. 🌞\n愿您的日子金光闪闪，前程似锦。",
    "Wishing you a year of abundance. 🌾\n祝您拥有丰收富足的一年。",
    "Stay safe, stay happy, stay blessed. 🙏\n平安健康，幸福吉祥。",
    "May your heart be light and days be bright. 🕯️\n愿心情轻松，岁月明媚。",
    "Best wishes for a glorious New Year. 🎇\n祝愿您迎来一个辉煌的新年。",
    "May you find happiness in every moment. 🍀\n愿您在每时每刻都发现幸福。",
    "Wishing you harmonious family life. 👨‍👩‍👧‍👦\n祝您家庭和睦，万事兴。",
    "Shine bright like a star this year. 💎\n愿您今年如星辰般闪耀。",
    "May good luck follow you everywhere. 🌈\n愿好运常伴左右。",
    "Everything will go smoothly for you. 🍎\n祝您万事顺遂，平平安安。",
    "Happy holidays from our heart to yours. 💌\n祝您节日快乐，心想事成。",
    "May fortune smile upon you. 😺\n愿幸运女神对您微笑。",
    "Wishing you a year of fun and joy. 🎈\n祝您新的一年充满乐趣和喜悦。",
    "Let the spirit of love fill your home. 💗\n让爱的精神充满家园。",
    "May you achieve all your heart's desires. 🎯\n愿您心想事成，得偿所愿。",
    "Have a sparkling New Year! ✨\n祝您度过一个闪闪发光的新年！"
];

// --- Resource Factories ---
const textures = {};
const geometries = {};
const materials = {};

function initResources() {
    // Textures
    // textures.envelope = createEnvelopeTexture(); // Removed
    textures.bow = createBowTexture();
    textures.snowflake = createSnowflakeTexture();
    textures.star = createStarTexture();
    textures.gingerbread = createGingerbreadTexture();
    textures.candycane = createCandyCaneTexture();
    textures.wreath = createWreathTexture('#2e8b57'); // Default Green for Icon
    textures.goldBow = createGoldBowTexture(); 
    textures.photoPlaceholder = createPhotoPlaceholderTexture(); // New Placeholder
    textures.customPhoto = null; // Will hold user texture
    
    // Wreath Variations
    textures.wreaths = [
        createWreathTexture('#2e8b57'), // Green
        createWreathTexture('#c0392b'), // Red
        createWreathTexture('#ffd700'), // Gold
        createWreathTexture('#ecf0f1'), // White/Silver
        createWreathTexture('#8e44ad')  // Purple
    ];
    
    // Gift Textures (Variant Array)
    textures.gifts = [
        createGiftTexture('#c0392b', '#ffd700'), // Red + Gold (Matches Icon)
        createGiftTexture('#27ae60', '#ecf0f1'),
        createGiftTexture('#2980b9', '#bdc3c7'),
        createGiftTexture('#f1c40f', '#c0392b')
    ];

    // Geometries
    // geometries.envelope = new THREE.PlaneGeometry(3.0, 1.8); // Removed
    geometries.box = new THREE.BoxGeometry(2.0, 2.0, 2.0);
    geometries.bow = new THREE.PlaneGeometry(2.5, 2.5);
    geometries.giftBow = new THREE.PlaneGeometry(2.0, 2.0); // Slightly smaller for gift top
    geometries.bell = new THREE.CylinderGeometry(0.3, 0.8, 1.0, 16, 1, true);
    geometries.bellTongue = new THREE.SphereGeometry(0.25, 8, 8);
    geometries.snowflake = new THREE.PlaneGeometry(2.0, 2.0);
    geometries.star = new THREE.PlaneGeometry(2.2, 2.2);
    geometries.gingerbread = new THREE.PlaneGeometry(2.0, 2.5);
    geometries.candycane = new THREE.PlaneGeometry(1.5, 3.0);
    geometries.wreath = new THREE.PlaneGeometry(2.5, 2.5);
    geometries.photo = new THREE.PlaneGeometry(2.4, 3.0); // Polaroid Ratio (approx 1:1.25)
    
    geometries.snowBody = new THREE.SphereGeometry(0.7, 16, 16);
    geometries.snowHead = new THREE.SphereGeometry(0.5, 16, 16);
    geometries.snowNose = new THREE.ConeGeometry(0.08, 0.4, 8);
    geometries.snowEye = new THREE.SphereGeometry(0.06, 8, 8);
    geometries.snowButton = new THREE.SphereGeometry(0.07, 8, 8);
    geometries.snowHatBrim = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 16);
    geometries.snowHatTop = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 16);
    geometries.snowScarf = new THREE.TorusGeometry(0.45, 0.1, 8, 16);
    geometries.snowArm = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    
    // Ball Decoration
    // geometries.ball = new THREE.SphereGeometry(1.2, 32, 32);
    // geometries.ballCap = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16);
    // geometries.ballLoop = new THREE.TorusGeometry(0.2, 0.05, 8, 16);

    // Materials
    materials.envelope = new THREE.MeshBasicMaterial({ map: textures.envelope, side: THREE.DoubleSide, transparent: true });
    materials.bow = new THREE.MeshBasicMaterial({ map: textures.bow, side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 });
    materials.bell = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide });
    materials.bellTongue = new THREE.MeshBasicMaterial({ color: 0xcc9900 });
    materials.snowflake = new THREE.MeshBasicMaterial({ map: textures.snowflake, transparent: true, side: THREE.DoubleSide, opacity: 0.9 });
    materials.star = new THREE.MeshBasicMaterial({ map: textures.star, transparent: true, side: THREE.DoubleSide });
    materials.gingerbread = new THREE.MeshBasicMaterial({ map: textures.gingerbread, transparent: true, side: THREE.DoubleSide });
    materials.candycane = new THREE.MeshBasicMaterial({ map: textures.candycane, transparent: true, side: THREE.DoubleSide });
    // materials.wreath = new THREE.MeshBasicMaterial({ map: textures.wreath, transparent: true, side: THREE.DoubleSide });
    materials.wreaths = textures.wreaths.map(tex => new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));

    materials.snowWhite = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Snow
    materials.snowOrange = new THREE.MeshBasicMaterial({ color: 0xff8c00 }); // Nose
    materials.snowBlack = new THREE.MeshBasicMaterial({ color: 0x111111 }); // Eyes/Buttons/Hat
    materials.snowRed = new THREE.MeshBasicMaterial({ color: 0xd42426 }); // Scarf
    materials.snowBrown = new THREE.MeshBasicMaterial({ color: 0x8b4513 }); // Arms
    materials.goldBow = new THREE.MeshBasicMaterial({ map: textures.goldBow, side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 });
    
    materials.gifts = textures.gifts.map(tex => new THREE.MeshBasicMaterial({ map: tex }));
}

// Helper to create a specific decoration instance
function createDecorationInstance(type) {
    let mesh;
    if (type === 'gift') {
        const group = new THREE.Group();
        
        // 1. Box - Random Color (Restored)
        const mat = materials.gifts[Math.floor(Math.random() * materials.gifts.length)];
        const box = new THREE.Mesh(geometries.box, mat);
        group.add(box);
        
        // 2. Gold Bow on Top
        const bow1 = new THREE.Mesh(geometries.giftBow, materials.goldBow);
        bow1.position.y = 1; // Slightly lower than 1.56 to ensure it sits snugly
        
        // Add two crossed planes to make it visible from multiple angles
        const bow2 = bow1.clone();
        bow2.rotation.y = Math.PI / 2;
        bow2.position.y = 1.2;
        
        group.add(bow1);
        group.add(bow2);
        
        // Random rotation for the whole gift
        group.rotation.set(Math.random(), Math.random(), Math.random());
        
        mesh = group;
    } else if (type === 'envelope') {
        mesh = new THREE.Mesh(geometries.envelope, materials.envelope);
        mesh.rotation.z = (Math.random() - 0.5) * 0.5;
        // Planes need to face out, dealt with after orientation
    } else if (type === 'bow') {
        mesh = new THREE.Mesh(geometries.bow, materials.bow);
    } else if (type === 'bell') {
        const group = new THREE.Group();
        const body = new THREE.Mesh(geometries.bell, materials.bell);
        const tongue = new THREE.Mesh(geometries.bellTongue, materials.bellTongue);
        tongue.position.y = -0.3;
        group.add(body);
        group.add(tongue);
        group.rotation.x = 0.2; 
        mesh = group;
    } else if (type === 'snowflake') {
        mesh = new THREE.Mesh(geometries.snowflake, materials.snowflake);
    } else if (type === 'star') {
        mesh = new THREE.Mesh(geometries.star, materials.star);
    } else if (type === 'gingerbread') {
        mesh = new THREE.Mesh(geometries.gingerbread, materials.gingerbread);
    } else if (type === 'snowman') {
        const group = new THREE.Group();
        
        // 1. Body (Bottom Sphere)
        const body = new THREE.Mesh(geometries.snowBody, materials.snowWhite);
        body.position.y = -0.6;
        
        // 2. Head (Top Sphere)
        const head = new THREE.Mesh(geometries.snowHead, materials.snowWhite);
        head.position.y = 0.5;
        
        // 3. Scarf (Red Torus) - Placed between head and body
        const scarf = new THREE.Mesh(geometries.snowScarf, materials.snowRed);
        scarf.position.y = 0.05;
        scarf.rotation.x = Math.PI / 2;
        // Add a scarf tail
        const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.05), materials.snowRed);
        scarfTail.position.set(0.3, -0.2, 0.35);
        scarfTail.rotation.set(0.2, 0, -0.2);
        
        // 4. Hat (Top Hat)
        const hatBrim = new THREE.Mesh(geometries.snowHatBrim, materials.snowBlack);
        hatBrim.position.y = 0.95;
        const hatTop = new THREE.Mesh(geometries.snowHatTop, materials.snowBlack);
        hatTop.position.y = 1.25;
        
        // 5. Face Details
        // Nose (Carrot) - Pushed out to ensure visibility
        const nose = new THREE.Mesh(geometries.snowNose, materials.snowOrange);
        nose.position.set(0, 0.5, 0.6); // Moved z from 0.5 to 0.6
        nose.rotation.x = Math.PI / 2;
        
        // Eyes - Pushed out to sit on surface
        const eye1 = new THREE.Mesh(geometries.snowEye, materials.snowBlack);
        eye1.position.set(-0.18, 0.6, 0.52); // Moved z from 0.48 to 0.52 to ensure visibility
        const eye2 = new THREE.Mesh(geometries.snowEye, materials.snowBlack);
        eye2.position.set(0.18, 0.6, 0.52);
        
        // 6. Buttons (On Body)
        const btn1 = new THREE.Mesh(geometries.snowButton, materials.snowBlack);
        btn1.position.set(0, -0.3, 0.75); // Pushed out further (Body R=0.7)
        const btn2 = new THREE.Mesh(geometries.snowButton, materials.snowBlack);
        btn2.position.set(0, -0.6, 0.78); // Pushed out further
        
        // 7. Arms (Twigs)
        const armL = new THREE.Mesh(geometries.snowArm, materials.snowBrown);
        armL.position.set(-0.65, -0.2, 0);
        armL.rotation.z = Math.PI / 3;
        const armR = new THREE.Mesh(geometries.snowArm, materials.snowBrown);
        armR.position.set(0.65, -0.2, 0);
        armR.rotation.z = -Math.PI / 3;

        group.add(body); 
        group.add(head);
        group.add(scarf); group.add(scarfTail);
        group.add(hatBrim); group.add(hatTop);
        group.add(nose); group.add(eye1); group.add(eye2);
        group.add(btn1); group.add(btn2);
        group.add(armL); group.add(armR);
        
        // Scale down slightly as it's a bit tall
        group.scale.setScalar(0.85);
        
        mesh = group;
    } else if (type === 'candycane') {
        mesh = new THREE.Mesh(geometries.candycane, materials.candycane);
        // Add a slight random tilt
        mesh.rotation.z = (Math.random() - 0.5) * 0.5;
    } else if (type === 'wreath') {
        const mat = materials.wreaths[Math.floor(Math.random() * materials.wreaths.length)];
        mesh = new THREE.Mesh(geometries.wreath, mat);
        mesh.rotation.z = Math.random() * Math.PI * 0.1;
    } else if (type === 'photo') {
        // Use current custom photo or placeholder
        const tex = textures.customPhoto || textures.photoPlaceholder;
        const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
        mesh = new THREE.Mesh(geometries.photo, mat);
        // Add a slight random tilt
        mesh.rotation.z = (Math.random() - 0.5) * 0.2;
    }
    
    // Add common properties
    mesh.userData = { 
        type: type,
        isEnvelope: true, // Clickable
        message: wishMessages[Math.floor(Math.random() * wishMessages.length)]
    };
    
    return mesh;
}

// Initialize resources
initResources();
updatePaletteIcons(); // Add this to update UI

function updatePaletteIcons() {
    // Generate icons for 3D objects that don't have direct textures
    const bellIcon = createBellIcon();
    const snowIcon = createSnowmanIcon();
    const giftIcon = createGiftIcon();
    
    // Map types to their image sources (Canvas or DataURL)
    const iconMap = {
        'gift': giftIcon, 
        // 'envelope': textures.envelope.image, // Removed
        'bow': textures.bow.image,
        'bell': bellIcon,
        'snowflake': textures.snowflake.image,
        'star': textures.star.image,
        'gingerbread': textures.gingerbread.image,
        'snowman': snowIcon,
        'candycane': textures.candycane.image,
        'wreath': textures.wreath.image,
        'photo': null // Handled manually or uses placeholder?
        // 'delete' uses emoji, no change needed
    };
    
    // Set Photo Placeholder
    const photoItem = document.querySelector('.palette-item[data-type="photo"]');
    if (photoItem) {
        // We preserve the inner HTML structure (camera icon + upload btn)
        // Only set background image if we have one
    }

    document.querySelectorAll('.palette-item').forEach(item => {
        const type = item.getAttribute('data-type');
        if (iconMap[type]) {
            // Set background image
            item.style.backgroundImage = `url(${iconMap[type].toDataURL()})`;
            item.style.backgroundSize = 'contain';
            item.style.backgroundRepeat = 'no-repeat';
            item.style.backgroundPosition = 'center';
            item.textContent = ''; // Clear emoji
        }
    });
}


function createGiftIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Draw in center. 
    // Box dimensions: w=36, h=36. x=14, y=20 (leaving room for bow on top)
    // This creates padding so it doesn't fill the circular button
    
    const x = 14;
    const y = 20;
    const size = 36;
    
    // Box Base
    ctx.fillStyle = '#c0392b'; // Deep Red
    ctx.fillRect(x, y, size, size);
    
    // Vertical Ribbon
    ctx.fillStyle = '#ffd700'; // Gold
    ctx.fillRect(x + size/2 - 4, y, 8, size);
    
    // Horizontal Ribbon
    ctx.fillRect(x, y + size/2 - 4, size, 8);
    
    // Subtle Border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
    
    // Bow on top
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#b7950b'; // Darker gold for outline
    ctx.lineWidth = 1;

    // Left loop
    ctx.beginPath();
    ctx.ellipse(32 - 7, y, 7, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Right loop
    ctx.beginPath();
    ctx.ellipse(32 + 7, y, 7, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Center knot
    ctx.beginPath();
    ctx.arc(32, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700'; 
    ctx.fill();
    ctx.stroke();

    return canvas;
}

function createBellIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Draw Bell Shape
    ctx.fillStyle = '#ffd700'; // Gold
    ctx.beginPath();
    ctx.moveTo(32, 10);
    ctx.quadraticCurveTo(50, 50, 50, 50);
    ctx.lineTo(14, 50);
    ctx.quadraticCurveTo(14, 50, 32, 10);
    ctx.fill();
    
    // Rim
    ctx.beginPath();
    ctx.ellipse(32, 50, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Tongue
    ctx.fillStyle = '#cc9900';
    ctx.beginPath();
    ctx.arc(32, 54, 4, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas;
}

function createSnowmanIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Body
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(32, 48, 14, 0, Math.PI * 2); // Bottom
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.arc(32, 28, 10, 0, Math.PI * 2); // Top
    ctx.fill();
    
    // Scarf (Red)
    ctx.fillStyle = '#d42426';
    ctx.beginPath();
    ctx.rect(22, 36, 20, 4);
    ctx.fill();
    
    // Hat (Black)
    ctx.fillStyle = '#111';
    ctx.fillRect(22, 18, 20, 2); // Brim
    ctx.fillRect(26, 8, 12, 10); // Top
    
    // Face
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(29, 26, 1, 0, Math.PI*2); // Eye
    ctx.arc(35, 26, 1, 0, Math.PI*2); // Eye
    ctx.fill();
    
    // Nose (Orange)
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(32, 28);
    ctx.lineTo(38, 29);
    ctx.lineTo(32, 30);
    ctx.fill();

    return canvas;
}

// Start with Empty Tree (Decorate yourself!)
// envelopeGroup.clear(); // Already empty on init

// --- Interaction Logic ---
let selectedDecorationType = null;
const paletteItems = document.querySelectorAll('.palette-item');

// Bind upload button explicitly
const photoItem = document.querySelector('.palette-item[data-type="photo"]');
const uploadBtn = photoItem.querySelector('.upload-btn');
if (uploadBtn) {
    uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent toggling selection
        document.getElementById('photo-upload').click();
    });
}

paletteItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // Toggle selection
        const type = item.getAttribute('data-type');
        
        // Check if we are deselecting the current one
        if (selectedDecorationType === type) {
            // Deselect
            selectedDecorationType = null;
            state.autoRotate = true; // Resume rotation
            item.classList.remove('selected');
        } else {
            // Select new one
            // First, deselect all others
            paletteItems.forEach(el => el.classList.remove('selected'));
            
            // Select this one
            selectedDecorationType = type;
            item.classList.add('selected');
            state.autoRotate = false; // Pause rotation to easier placing
            
            // Special Case: Photo
            if (type === 'photo') {
                // If no photo loaded yet, trigger input automatically on first select
                if (!textures.customPhoto) {
                     document.getElementById('photo-upload').click();
                }
            }
        }
    });
});

// Photo Upload Handler
document.getElementById('photo-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            const img = new Image();
            img.onload = function() {
                // Create Texture
                const texture = new THREE.Texture(img);
                texture.needsUpdate = true;
                texture.colorSpace = THREE.SRGBColorSpace; // Correct color
                
                // Create Composite Texture (Polaroid Frame)
                // We draw it onto a canvas
                const canvas = document.createElement('canvas');
                // Target size: 256x300 (Aspect ~0.8)
                const w = 256;
                const h = 320;
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                
                // White Background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0,0,w,h);
                
                // Shadow / Border effect?
                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 2;
                ctx.strokeRect(1,1,w-2,h-2);
                
                // Draw Image (Centered Top)
                // Padding 20px
                const pad = 20;
                const imgW = w - pad*2; // 216
                const imgH = imgW; // Square aspect for photo part usually, or maintain aspect?
                // Let's force square crop for uniformity or fit?
                // Fit is safer.
                
                // Draw Image
                // We want to fill the square area (pad, pad, imgW, imgH)
                // Calculate aspect
                const imgAspect = img.width / img.height;
                let drawW = imgW;
                let drawH = imgW / imgAspect;
                
                // Crop Logic (Center Crop)
                // If landscape
                let sx=0, sy=0, sWidth=img.width, sHeight=img.height;
                
                if (imgAspect > 1) { // Landscape
                    sWidth = img.height;
                    sx = (img.width - img.height) / 2;
                } else { // Portrait
                    sHeight = img.width;
                    sy = (img.height - img.width) / 2;
                }
                
                ctx.drawImage(img, sx, sy, sWidth, sHeight, pad, pad, imgW, imgW);
                
                // Text at bottom?
                // ctx.font = '24px Handwriting';
                // ctx.fillStyle = '#333';
                // ctx.fillText('Christmas 2024', w/2, h - 30);
                
                const frameTexture = new THREE.CanvasTexture(canvas);
                frameTexture.colorSpace = THREE.SRGBColorSpace;
                
                textures.customPhoto = frameTexture;
                
                // Update Material
                // We need a specific material for this user photo.
                // BUT, if user uploads multiple photos, do we want to support multiple?
                // Current architecture: materials.customPhoto is one shared material?
                // No, createDecorationInstance should create a new material if we want multiple distinct photos.
                // For simplicity: One "active" photo at a time. Placed photos keep their texture?
                // If we update `textures.customPhoto`, old meshes using it will update?
                // YES, because they reference the same Texture object if we reused it.
                // SOLUTION: Clone material/texture for each placement? 
                // Better: Create a new Texture for each upload. 
                // For now, let's update the "current" texture and let user place it.
                // If they change it, previously placed photos might change if they share texture.
                // To avoid this: In `createDecorationInstance`, we clone the texture/material?
                // Texture cloning is cheap? No, texture data is large.
                // Actually, if we overwrite the texture CONTENT, it changes.
                // If we create NEW texture object, old ones persist.
                // So: `textures.customPhoto = frameTexture` (New Object).
                // Old meshes refer to Old Texture Object. Safe.
                
                // Update UI Icon
                const photoItem = document.querySelector('.palette-item[data-type="photo"]');
                if (photoItem) {
                    photoItem.style.backgroundImage = `url(${frameTexture.image.toDataURL()})`;
                }
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Advanced Interaction: Drag & Drop + Click to Place + Click to Open
let draggedObject = null;
let isDragging = false;
let dragStartPos = new THREE.Vector2();
let dragStartTime = 0;
let wasAutoRotate = false;

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

// Remove old listeners to avoid conflict
// window.removeEventListener('click', onMouseClick);
// window.removeEventListener('touchstart', onTouchStart);

function updateMouse(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onPointerDown(event) {
    updateMouse(event);
    
    // Always record start position to distinguish Click vs Drag (Camera Rotation)
    dragStartPos.set(event.clientX, event.clientY);
    dragStartTime = Date.now();
    
    // 1. If Placing Mode (Palette Selected):
    // Let OrbitControls handle rotation, we place on Click (PointerUp).
    // But we don't want to start dragging existing items.
    if (selectedDecorationType) return;

    // 2. Interaction Mode (No Palette):
    // Check if we hit an existing decoration
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(envelopeGroup.children, true);
    
    if (intersects.length > 0) {
        // Find the root object of the decoration
        let target = intersects[0].object;
        while(target.parent && target.parent !== envelopeGroup) {
            target = target.parent;
        }
        
        if (target.userData.isEnvelope) {
            // Hit a decoration! Start Dragging.
            isDragging = true;
            draggedObject = target;
            // dragStartPos/Time already set above
            
            // Disable Controls so we don't rotate camera while dragging object
            controls.enabled = false;
            
            // Pause AutoRotate during interaction
            wasAutoRotate = state.autoRotate;
            state.autoRotate = false;
        }
    }
}

function onPointerMove(event) {
    updateMouse(event);
    
    if (isDragging && draggedObject) {
        // Dragging Logic
        // Raycast against the Hit Cone to find new position
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(hitCone);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            const point = hit.point; // World Position
            
            // Update Position
            // Note: draggedObject is child of envelopeGroup. 
            // We need to convert World Point to Local Point because envelopeGroup might be rotated.
            envelopeGroup.worldToLocal(point);
            draggedObject.position.copy(point);
            
            // Update Rotation (Face Outwards)
            // Local Space LookAt: We want to look away from (0, y, 0)
            // But lookAt works in Local space if parent is scene, or somewhat complex if parent rotated.
            // Simpler: use the stored rotation logic.
            // Vector from (0, y, 0) to (x, y, z) is the "Out" vector.
            draggedObject.lookAt(0, point.y, 0); // Faces Center
            
            // Adjust based on type
            const type = draggedObject.userData.type;
            if (type === 'envelope' || type === 'bow' || type === 'snowflake' || type === 'star' || type === 'gingerbread') {
                draggedObject.rotateY(Math.PI); // Face Out
            } else if (type === 'bell') {
                draggedObject.rotateX(Math.PI / 4);
            } else if (type === 'gift') {
                // Keep random rotation? Or re-randomize? 
                // Let's keep existing relative rotation? 
                // Actually lookAt resets rotation. 
                // Let's just give it a random spin if it looks too uniform, or fixed offset.
                // For now, face center is fine, maybe tilt a bit.
            }
        }
    }
}

function onPointerUp(event) {
    updateMouse(event);

    // End Dragging
    if (isDragging) {
        controls.enabled = true; // Re-enable camera
        isDragging = false;
        if (wasAutoRotate) state.autoRotate = true; // Restore rotation
        
        // Check if this was a Click (Drag distance < 5px & Time < 200ms)
        const dist = dragStartPos.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
        const timeDiff = Date.now() - dragStartTime;
        
        if (dist < 5 && timeDiff < 300) {
            // It was a click -> Open Letter or Photo
            const type = draggedObject.userData.type;
            
            if (type === 'photo') {
                // Get image from texture
                // draggedObject is a Mesh, material is MeshBasicMaterial, map is CanvasTexture
                if (draggedObject.material && draggedObject.material.map) {
                    const imgData = draggedObject.material.map.image.toDataURL();
                    showLetter(null, imgData);
                }
            } else if (draggedObject.userData.message) {
                showLetter(draggedObject.userData.message);
            }
        }
        
        draggedObject = null;
        return; // Don't process placement logic
    }

    // Placing / Deleting Logic (Only if Palette Selected)
    if (selectedDecorationType) {
        // Validation: Was this a click or a camera drag?
        // If distance moved is > 5px, assume camera rotation -> Cancel placement
        const dist = dragStartPos.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
        if (dist > 5) {
            return;
        }

        if (selectedDecorationType === 'delete') {
            // Deletion Mode: Check intersection with existing decorations
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(envelopeGroup.children, true);
            
            if (intersects.length > 0) {
                // Find root object (direct child of envelopeGroup)
                let target = intersects[0].object;
                while(target.parent && target.parent !== envelopeGroup) {
                    target = target.parent;
                }
                
                // Remove it
                envelopeGroup.remove(target);
                
                // Remove from tracking array
                const index = envelopeMeshes.indexOf(target);
                if (index > -1) {
                    envelopeMeshes.splice(index, 1);
                }
            }
        } else {
            // Placement Mode
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(hitCone);
            
            if (intersects.length > 0) {
                // Check if we actually clicked the background/tree, NOT another decoration (handled by controls usually, but let's be safe)
                // Actually, if we overlap, it's fine.
                
                const hit = intersects[0];
                const point = hit.point;
                
                const decoration = createDecorationInstance(selectedDecorationType);
                
                // Convert World to Local for the Group
                envelopeGroup.worldToLocal(point);
                decoration.position.copy(point);
                
                decoration.lookAt(0, point.y, 0);
                
                const type = decoration.userData.type;
                if (type === 'envelope' || type === 'bow' || type === 'snowflake' || type === 'star' || type === 'gingerbread') {
                    decoration.rotateY(Math.PI); 
                } else if (type === 'bell') {
                    decoration.rotateX(Math.PI / 4);
                } else if (type === 'gift') {
                     decoration.rotation.set(Math.random(), Math.random(), Math.random());
                }
                
                envelopeGroup.add(decoration);
                envelopeMeshes.push(decoration);
            }
        }
    }
}

// Modal Logic
const modal = document.getElementById('letter-modal');
const modalContent = document.querySelector('.letter-content');
const modalText = document.getElementById('letter-text');
const modalImage = document.getElementById('letter-image'); // New Image Element
const closeBtn = document.querySelector('.close-btn');

function showLetter(message, imageSrc = null) {
    if (imageSrc) {
        modalText.style.display = 'none';
        modalImage.src = imageSrc;
        modalImage.style.display = 'block';
        modalContent.classList.add('image-mode');
    } else {
        modalText.textContent = message;
        modalText.style.display = 'block';
        modalImage.style.display = 'none';
        modalContent.classList.remove('image-mode');
    }
    modal.classList.remove('hidden');
    // state.autoRotate = false; // Pause rotation while reading // Already handled or desired?
}

closeBtn.onclick = () => {
    modal.classList.add('hidden');
    // Resume rotation only if palette is not selected
    if (!selectedDecorationType) {
        state.autoRotate = true; 
    }
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.classList.add('hidden');
        if (!selectedDecorationType) {
            state.autoRotate = true;
        }
    }
};

function createEnvelopeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Background (Creamy White)
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, 256, 128);
    
    // Border (Gold)
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 124);
    
    // Envelope Flap Lines (V Shape)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(128, 64);
    ctx.lineTo(256, 0);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Wax Seal (Orange Circle)
    ctx.beginPath();
    ctx.arc(128, 64, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#fbcf74'; // Orange
    ctx.fill();
    
    // Seal Detail (Gold Star)
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 128, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function createGiftTexture(primaryColor, ribbonColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Base Color
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, 128, 128);
    
    // Ribbon (Vertical)
    ctx.fillStyle = ribbonColor;
    ctx.fillRect(54, 0, 20, 128);
    
    // Ribbon (Horizontal)
    ctx.fillRect(0, 54, 128, 20);
    
    // Border for definition
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0,0,128,128);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function createBowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.clearRect(0, 0, 128, 128);
    
    ctx.fillStyle = '#ff0000'; // Red Bow
    ctx.strokeStyle = '#990000';
    ctx.lineWidth = 2;

    drawBowShape(ctx, '#ff0000', '#cc0000');

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function createGoldBowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.clearRect(0, 0, 128, 128);
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#b7950b'; // Dark Gold

    drawBowShape(ctx, '#ffd700', '#e6c200');

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function drawBowShape(ctx, mainColor, centerColor) {
    ctx.fillStyle = mainColor;
    
    // Left Loop
    ctx.beginPath();
    ctx.ellipse(40, 50, 25, 20, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right Loop
    ctx.beginPath();
    ctx.ellipse(88, 50, 25, 20, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Center Knot
    ctx.beginPath();
    ctx.arc(64, 50, 8, 0, Math.PI * 2);
    ctx.fillStyle = centerColor;
    ctx.fill();
    
    // Ribbons Tails
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(64, 55);
    ctx.lineTo(40, 100);
    ctx.lineTo(55, 100);
    ctx.lineTo(64, 60);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(64, 55);
    ctx.lineTo(88, 100);
    ctx.lineTo(73, 100);
    ctx.lineTo(64, 60);
    ctx.fill();
}

function createSnowflakeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.clearRect(0,0,128,128);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    ctx.translate(64, 64);
    
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -50);
        ctx.stroke();
        
        // Branch decorations
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(-15, -45);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(15, -45);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-10, -25);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(10, -25);
        ctx.stroke();
        
        ctx.rotate(Math.PI / 3);
    }

    return new THREE.CanvasTexture(canvas);
}

function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.clearRect(0,0,128,128);

    // Draw Star
    const cx = 64;
    const cy = 64;
    const spikes = 5;
    const outerRadius = 50;
    const innerRadius = 25;
    
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d4af37'; // Gold outline
    ctx.stroke();
    ctx.fillStyle = '#ffd700'; // Yellow Gold fill
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

function createGingerbreadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.clearRect(0,0,128,128);

    // Color
    const bodyColor = '#8b4513'; // SaddleBrown

    // Simple shape drawing
    ctx.fillStyle = bodyColor;
    
    // Head
    ctx.beginPath();
    ctx.arc(64, 30, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Body (Rounded Rect approx)
    ctx.beginPath();
    ctx.roundRect(44, 45, 40, 50, 10);
    ctx.fill();
    
    // Arms
    ctx.beginPath();
    ctx.roundRect(15, 50, 35, 15, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(78, 50, 35, 15, 7);
    ctx.fill();
    
    // Legs
    ctx.beginPath();
    ctx.roundRect(44, 90, 15, 30, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(69, 90, 15, 30, 7);
    ctx.fill();
    
    // Face
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(56, 25, 3, 0, Math.PI * 2); // Eye L
    ctx.fill();
    ctx.beginPath();
    ctx.arc(72, 25, 3, 0, Math.PI * 2); // Eye R
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(64, 32, 8, 0, Math.PI); // Smile
    ctx.stroke();
    
    // Buttons
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(64, 60, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.arc(64, 75, 4, 0, Math.PI*2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

function createCandyCaneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.clearRect(0,0,128,256);
    
    // Draw Candy Cane Shape Path
    ctx.beginPath();
    // Hook part
    ctx.arc(64, 64, 40, Math.PI, 0); 
    // Straight part
    ctx.lineTo(104, 230);
    ctx.arc(84, 230, 20, 0, Math.PI); // Bottom round cap
    ctx.lineTo(64, 230);
    // Inner hook
    ctx.lineTo(64, 64); // Close inner? No.
    // Let's stroke a thick line instead, easier for stripes
    
    // Reset and use clipping
    const path = new Path2D();
    path.moveTo(44, 64);
    path.lineTo(44, 220); // Left vertical
    path.arc(64, 220, 20, Math.PI, 0, true); // Bottom cap
    path.lineTo(84, 64); // Right vertical
    path.arc(64, 64, 20, 0, Math.PI, true); // Inner arch (top) ??
    
    // Simpler: Draw thick stroke and clip
    ctx.lineCap = 'round';
    ctx.lineWidth = 40;
    ctx.strokeStyle = '#fff';
    
    ctx.beginPath();
    ctx.moveTo(64, 230);
    ctx.lineTo(64, 64);
    ctx.arc(34, 64, 30, 0, Math.PI, true); // Hook to left
    
    // Define the shape for clipping
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(84, 230); // Right side bottom
    ctx.lineTo(84, 64);
    ctx.arc(34, 64, 50, 0, Math.PI, true); // Outer hook
    ctx.lineTo(-16, 64);
    ctx.arc(34, 64, 10, Math.PI, 0, false); // Inner hook tip cap
    // This path is getting complex manually. 
    
    // Use composite operations
    // 1. Draw White Base
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 36;
    ctx.beginPath();
    ctx.moveTo(84, 240);
    ctx.lineTo(84, 80);
    ctx.arc(44, 80, 40, 0, Math.PI, true); // Hook left
    ctx.stroke();
    
    // 2. Set Composite to Source-Atop (draw only on existing pixels)
    ctx.globalCompositeOperation = 'source-atop';
    
    // 3. Draw Red Stripes
    ctx.strokeStyle = '#d42426'; // Red
    ctx.lineWidth = 15;
    
    for(let i=-50; i<300; i+=25) {
        ctx.beginPath();
        ctx.moveTo(-20, i);
        ctx.lineTo(150, i - 60); // Diagonal
        ctx.stroke();
    }
    
    // 4. Shadow/Highlight for 3D effect
    // Gradient overlay
    const grad = ctx.createLinearGradient(0, 0, 128, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0.1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,128,256);
    
    ctx.restore();
    
    return new THREE.CanvasTexture(canvas);
}

function createWreathTexture(baseColor = '#2e8b57') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.clearRect(0,0,128,128);
    
    // Draw Donut/Wreath Base (Green Cookie)
    ctx.beginPath();
    ctx.arc(64, 64, 55, 0, Math.PI*2);
    ctx.arc(64, 64, 25, 0, Math.PI*2, true); // Hole
    ctx.fillStyle = baseColor; 
    ctx.fill();
    // Border slightly darker
    // Simple logic to darken: if hex, difficult. Let's just use semi-transparent black overlay for border or fixed dark green
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Icing / Details
    // Zigzag frosting? Or Dots.
    ctx.fillStyle = '#fff';
    for(let i=0; i<12; i++) {
        const theta = (i / 12) * Math.PI * 2;
        const r = 40;
        const x = 64 + r * Math.cos(theta);
        const y = 64 + r * Math.sin(theta);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI*2);
        // Vary colors
        if (i % 3 === 0) ctx.fillStyle = '#d42426'; // Red
        else if (i % 3 === 1) ctx.fillStyle = '#ffd700'; // Gold
        else ctx.fillStyle = '#fff'; // White
        ctx.fill();
    }
    
    // Red Bow at bottom
    ctx.translate(64, 110);
    ctx.fillStyle = '#d42426';
    
    // Left loop
    ctx.beginPath();
    ctx.ellipse(-15, -5, 12, 8, -0.4, 0, Math.PI*2);
    ctx.fill();
    // Right loop
    ctx.beginPath();
    ctx.ellipse(15, -5, 12, 8, 0.4, 0, Math.PI*2);
    ctx.fill();
    // Knot
    ctx.beginPath();
    ctx.arc(0, -5, 5, 0, Math.PI*2);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
}

function createPhotoPlaceholderTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#eee';
    ctx.fillRect(0, 0, 128, 128);
    
    // Icon
    ctx.font = '48px Arial';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📷', 64, 64);
    
    return new THREE.CanvasTexture(canvas);
}

// Raycaster for interaction (Defined early to avoid ReferenceError)
// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector2();

// Replaced with Pointer Events Logic above
// window.addEventListener('click', onMouseClick, false);
// window.addEventListener('touchstart', onTouchStart, false);

// ... old handlers removed/commented out to prevent errors ... 
/*
function onMouseClick(event) {
    // ...
}

function onTouchStart(event) {
    // ...
}

function checkIntersection() {
    // ...
}
*/

// Vision Manager (MediaPipe)
const visionManager = new VisionManager();
visionManager.init(document.querySelector('.input_video'), onVisionUpdate);

function onVisionUpdate(data) {
    // data contains { hands: { distance }, face: { emotion } }
    if (data.hands) {
        if (state.enableGesture) {
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
    }

    if (data.face) {
        if (!state.enableFaceExpression) return; // Skip if disabled

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

// UI - GUI Restored per user request
const gui = new GUI({ title: 'Settings' });

// Tree Color Control - Dropdown
const colorOptions = {
    'Natural (Happy)': 'natural',
    'Classic White': '#ffffff',
    'Warm Gold': '#ffd700',
    'Festive Red': '#d42426',
    'Winter Blue': '#00bfff',
    'Pine Green': '#2e8b57',
    'Midnight Purple': '#4b0082',
    'Pink & White Dream': 'pink_white_mix',
    'White & Blue': 'white_blue_mix'
};

// Find the key for the current baseColor to set initial value, or default to Natural
// Since the tree starts as Natural (via generateModel), we default to that.
const initialColorKey = 'Natural (Happy)';

// Create a proxy object for GUI to bind to
const guiState = {
    colorName: initialColorKey
};

const treeColorCtrl = gui.add(guiState, 'colorName', Object.keys(colorOptions))
    .name('Tree Color')
    .onChange(name => {
        const val = colorOptions[name];
        if (val === 'natural') {
            particleSystem.isManualColor = true;
            particleSystem.restoreOriginalColors();
        } else if (val === 'pink_white_mix') {
            particleSystem.isManualColor = true;
            // Top Star Pink, Rest White
            particleSystem.animateToSegmentColors(
                new THREE.Color(0xFFFFFF), // Base (White)
                new THREE.Color(0xFFB7C5)  // Star (Pink)
            );
        } else if (val === 'white_blue_mix') {
            particleSystem.isManualColor = true;
            // Top Star Blue, Rest White
            particleSystem.animateToSegmentColors(
                new THREE.Color(0xFFFFFF), // Base (White)
                new THREE.Color(0x7EC0EE)  // Star (Blue)
            );
        } else {
            state.baseColor = val;
            particleSystem.setBaseColor(state.baseColor);
        }
    });

// Auto Rotate Control
gui.add(state, 'autoRotate').name('Auto Rotate');

// Gesture Control
gui.add(state, 'enableGesture').name('Hand Gesture').onChange(enabled => {
    if (!enabled) {
        particleSystem.setTargetScale(1.1); // Reset to Open (100% / 1.1 scale)
        document.getElementById('gesture-display').innerHTML = `✋ Hand Gesture: Disabled (100%)`;
    } else {
        document.getElementById('gesture-display').innerHTML = `✋ Hand Gesture: Detecting...`;
    }
});

// Face Expression Control
gui.add(state, 'enableFaceExpression').name('Face AI').onChange(enabled => {
    if (!enabled) {
        // Disabled: Force Happy Mode (Green Tree)
        particleSystem.isManualColor = false; // Force allow change
        particleSystem.setEmotion('happy');
        document.getElementById('emotion-display').innerHTML = `😄 Emotion: Happy (Default)`;
        // Show Tree Color option when Face AI is off
        treeColorCtrl.show();
    } else {
        document.getElementById('emotion-display').innerHTML = `😐 Emotion: Detecting...`;
        // Hide Tree Color option when Face AI is on (Emotion takes over)
        treeColorCtrl.hide();
    }
});

// Set initial visibility
if (state.enableFaceExpression) {
    treeColorCtrl.hide();
}

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
        // Sync envelopes rotation
        envelopeGroup.rotation.y = particleSystem.mesh.rotation.y;
    }

    particleSystem.update(delta, time);
    
    // Sync envelopes scale with particles
    envelopeGroup.scale.setScalar(particleSystem.scale);

    renderer.render(scene, camera);
}

animate();

// Remove loading text when ready (conceptually, vision might take longer)
// document.getElementById('loading').style.display = 'none';
