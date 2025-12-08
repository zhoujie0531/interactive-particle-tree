import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene, maxParticleCount) {
        this.scene = scene;
        this.maxParticleCount = maxParticleCount;
        this.currentCount = maxParticleCount;
        
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.maxParticleCount * 3);
        this.targetPositions = new Float32Array(this.maxParticleCount * 3);
        this.colors = new Float32Array(this.maxParticleCount * 3);
        this.targetColors = new Float32Array(this.maxParticleCount * 3);
        this.originalColors = new Float32Array(this.maxParticleCount * 3); // Store base model colors
        this.sizes = new Float32Array(this.maxParticleCount); // For variation
        
        this.currentModel = 'christmasTree';
        this.trunkEndIndex = 0; // Index where trunk particles end
        this.scale = 0.9; // Default optimized scale
        this.targetScale = 0.9;
        
        // Initialize
        for (let i = 0; i < this.maxParticleCount; i++) {
            this.sizes[i] = Math.random() * 1.5 + 1.0; // Smaller particles (1.0 to 2.5)
            // Start with random positions
            this.positions[i * 3] = (Math.random() - 0.5) * 100;
            this.positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            this.positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
            
            // Default white
            this.colors[i * 3] = 1;
            this.colors[i * 3 + 1] = 1;
            this.colors[i * 3 + 2] = 1;

            this.targetColors[i * 3] = 1;
            this.targetColors[i * 3 + 1] = 1;
            this.targetColors[i * 3 + 2] = 1;
        }
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
        
        // Shader Material for better looking particles
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png') }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    // Decreased size for finer, sand-like particles
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(vColor, 1.0);
                    gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
                    // Boost alpha/brightness for distinct look
                    if (gl_FragColor.a < 0.3) discard; // Stricter alpha cut
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            vertexColors: true
        });
        
        this.mesh = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.mesh);

        this.emotionColorMap = {
            'happy': [new THREE.Color(1.0, 0.4, 0.7), new THREE.Color(1.0, 0.0, 0.5)], // Hot Pink + Magenta Pink
            'surprise': [new THREE.Color(1.0, 0.9, 0.1), new THREE.Color(1.0, 0.4, 0.1), new THREE.Color(1.0, 0.2, 0.6)], // Old Happy colors (Sunny Yellow + Orange + Hot Pink)
            'angry': [new THREE.Color(1.0, 0.0, 0.0), new THREE.Color(1.0, 0.5, 0.0)], // Red + Orange
            'sad': [new THREE.Color(0.05, 0.05, 0.4), new THREE.Color(0.2, 0.3, 0.5)], // Dark Midnight Blue + Steel Blue
            'neutral': [new THREE.Color(1, 1, 1), new THREE.Color(1.0, 0.75, 0.8)] // White + Soft Pink
        };
        
        this.isManualColor = false;
    }

    generateModel(type) {
        this.currentModel = type;
        const positions = [];
        const colors = []; // Temporary color array
        const count = this.currentCount;
        
        // Reset trunk index
        this.trunkEndIndex = 0;

        // Helper to add pos and color
        const addPoint = (x, y, z, r, g, b) => {
            positions.push(x, y, z);
            colors.push(r, g, b);
        };
        
        // Generate shapes
        switch (type) {
            case 'christmasTree':
                // Refined Christmas Tree Model based on reference image
                // Features: 3 distinct wide layers (fat & layered), thick trunk, bright star
                
                const trunkH = 16; // Taller trunk to ensure connection
                const trunkW = 6; // Thicker trunk
                
                const trunkCount = Math.floor(count * 0.1); 
                this.trunkEndIndex = trunkCount; // Store for color protection

                const starCount = Math.floor(count * 0.05);
                const leavesCount = count - trunkCount - starCount;
                
                // 1. Trunk (Thick & Brown)
                for(let i=0; i<trunkCount; i++) {
                    const h = Math.random() * trunkH;
                    const theta = Math.random() * Math.PI * 2;
                    // Uniform disk with bias to surface
                    const r = trunkW * Math.pow(Math.random(), 0.5); 
                    
                    // Brighter golden brown
                    const brightness = 0.8 + 0.4 * Math.random();
                    
                    addPoint(
                        r * Math.cos(theta),
                        h - 24, // Base lowered to -24 to give more grounding
                        r * Math.sin(theta),
                        0.6 * brightness, 0.3 * brightness, 0.05 * brightness
                    );
                }
                
                // 2. Leaves (3 Distinct, Wide Conical Layers)
                // To achieve the "layered" look, we need gap/overlap logic.
                // Image shows 3 distinct umbrellas.
                const tiers = [
                    // Bottom Tier: Raised yBottom to -11 to reveal trunk (was -18)
                    // Also adjusted yTop slightly
                    { yBottom: -11, yTop: -1, rBottom: 35, rTop: 12, density: 0.4 },
                    // Middle Tier
                    { yBottom: -6, yTop: 14, rBottom: 28, rTop: 8, density: 0.35 },
                    // Top Tier
                    { yBottom: 10, yTop: 32, rBottom: 18, rTop: 0.1, density: 0.25 }
                ];
                
                let particlesUsed = 0;
                
                for(let tIdx=0; tIdx < tiers.length; tIdx++) {
                    const tier = tiers[tIdx];
                    // Allocate particles based on volume/surface area approximation
                    const tierCount = (tIdx === tiers.length - 1) 
                        ? (leavesCount - particlesUsed) 
                        : Math.floor(leavesCount * tier.density);
                    particlesUsed += tierCount;

                    for(let i=0; i < tierCount; i++) {
                        // Height logic
                        const h_frac = Math.random();
                        const y = tier.yBottom + h_frac * (tier.yTop - tier.yBottom);
                        
                        // Radius logic (Linear cone)
                        const rMax = tier.rBottom + h_frac * (tier.rTop - tier.rBottom);
                        
                        // Volume distribution:
                        // To make layers look distinct, we need high density at the bottom edge (the "skirt")
                        // and surface density.
                        
                        let r;
                        const rand = Math.random();
                        if (rand < 0.2) {
                            // 20% Fill the volume (internal branches)
                            r = rMax * Math.random();
                        } else {
                            // 80% Surface (Outer shape)
                            r = rMax * (0.8 + 0.2 * Math.random());
                        }
                        
                        // Scallop/Wavy Bottom Edge to simulate hanging branches
                        // Especially for the bottom of each tier
                        const theta = Math.random() * Math.PI * 2;
                        let yMod = y;
                        
                        // Stronger scallop at the bottom of the tier
                        if (h_frac < 0.2) {
                            const waves = 8 + tIdx * 2; // More waves on higher tiers
                            const amp = 1.5;
                            // Drop y based on angle
                            yMod -= Math.abs(Math.cos(theta * waves * 0.5)) * amp * (1.0 - h_frac/0.2);
                        }
                        
                        // Color Logic
                        let cr, cg, cb;
                        // Depth relative to max radius at this height
                        const depth = r / rMax; 
                        
                        // Standard Green
                        cr = 0.05 + 0.1 * depth;
                        cg = 0.3 + 0.6 * depth;
                        cb = 0.05 + 0.1 * depth;
                        
                        // Highlight edges to separate layers
                        if (h_frac < 0.05 && depth > 0.9) {
                            // The very bottom rim of each layer -> Lighter Green/Yellowish
                            cg += 0.2; cr += 0.1;
                        }
                        
                        // Decorations (Randomly scattered on surface)
                        if (depth > 0.85 && Math.random() < 0.03) {
                             const decRand = Math.random();
                             if(decRand<0.3) { cr=1.0; cg=0.2; cb=0.2; } // Red
                             else if(decRand<0.6) { cr=1.0; cg=0.85; cb=0.1; } // Gold
                             else if(decRand<0.8) { cr=0.2; cg=0.5; cb=1.0; } // Blue
                             else { cr=1.0; cg=1.0; cb=1.0; } // White
                        }
                        
                        addPoint(
                            r * Math.cos(theta),
                            yMod,
                            r * Math.sin(theta),
                            cr, cg, cb
                        );
                    }
                }
                
                // 3. Star (Yellow) - Top of tree (y ~32)
                for(let i=0; i<starCount; i++) {
                    let px, py, pz;
                    let valid = false;
                    const starR = 4.5; // Slightly larger
                    const innerR = 1.8; 
                    
                    // Simple rejection sampling for star shape (2D extrusion)
                    while(!valid) {
                         px = (Math.random() - 0.5) * 2 * starR;
                         py = (Math.random() - 0.5) * 2 * starR;
                         pz = (Math.random() - 0.5) * 3.0; // Thicker
                         
                         const ang = Math.atan2(py, px) + Math.PI/2;
                         const r_p = Math.sqrt(px*px + py*py);
                         
                         // Star shape function
                         const sharpness = Math.pow(0.5 + 0.5 * Math.cos(5 * ang), 2); 
                         const boundary = innerR + (starR - innerR) * sharpness;
                         
                         // Taper Z
                         if (r_p < boundary && Math.abs(pz) < 1.5 * (1 - r_p/starR)) {
                             valid = true;
                         }
                         
                         // Fallback breaker
                         if (Math.random() < 0.001) valid = true;
                    }

                    // Bright Gold
                    let cr = 1.0, cg = 0.85, cb = 0.1;
                    // Sparkle
                    if (Math.random() > 0.8) { cr=1.0; cg=1.0; cb=1.0; }
                    
                     addPoint(
                        px,
                        33 + py, // Move up to tip
                        pz, 
                        cr, cg, cb 
                    );
                }
                break;
                
            // Old Christmas Tree removed/merged
            
            case 'heart':
                for (let i = 0; i < count; i++) {
                    // Heart formula
                    const t = Math.random() * Math.PI * 2;
                    const s = 1.5;
                    const x = 16 * Math.pow(Math.sin(t), 3);
                    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
                    const z = (Math.random() - 0.5) * 10; 
                    
                    addPoint(x * s, y * s, z, 1, 1, 1); // Default white
                }
                break;

            case 'flower':
                 for (let i = 0; i < count; i++) {
                    const u = Math.random() * Math.PI * 2;
                    const v = Math.random() * Math.PI;
                    const radius = 15 + 8 * Math.cos(5 * u) * Math.sin(v); 
                    addPoint(
                        radius * Math.sin(v) * Math.cos(u),
                        radius * Math.sin(v) * Math.sin(u),
                        radius * Math.cos(v),
                        1, 1, 1
                    );
                 }
                break;
                
            case 'saturn':
                const ringCount = Math.floor(count * 0.4);
                const sphereCount = count - ringCount;
                for(let i=0; i<sphereCount; i++) {
                    const r = 12 * (0.8 + 0.2 * Math.random()); 
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    addPoint(
                        r * Math.sin(phi) * Math.cos(theta),
                        r * Math.sin(phi) * Math.sin(theta),
                        r * Math.cos(phi),
                        1, 1, 1
                    );
                }
                for(let i=0; i<ringCount; i++) {
                    const r = 20 + Math.random() * 8; 
                    const theta = Math.random() * Math.PI * 2;
                    addPoint(
                        r * Math.cos(theta),
                        (Math.random() - 0.5) * 1, 
                        r * Math.sin(theta),
                        1, 1, 1
                    );
                }
                break;
                
            case 'fireworks':
                 for (let i = 0; i < count; i++) {
                    const r = Math.pow(Math.random(), 0.5) * 40;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI;
                    addPoint(
                        r * Math.sin(phi) * Math.cos(theta),
                        r * Math.sin(phi) * Math.sin(theta),
                        r * Math.cos(phi),
                        1, 1, 1
                    );
                 }
                break;
        }
        
        // Update positions and ORIGINAL colors
        for (let i = 0; i < count; i++) {
             if (i * 3 + 2 < this.targetPositions.length && i * 3 + 2 < positions.length) {
                this.targetPositions[i * 3] = positions[i * 3];
                this.targetPositions[i * 3 + 1] = positions[i * 3 + 1];
                this.targetPositions[i * 3 + 2] = positions[i * 3 + 2];
                
                // Update original color store and current target color if neutral
                this.originalColors[i * 3] = colors[i * 3];
                this.originalColors[i * 3 + 1] = colors[i * 3 + 1];
                this.originalColors[i * 3 + 2] = colors[i * 3 + 2];
                
                // Immediately apply these colors if not in emotion override
                if (!this.isManualColor) {
                    this.targetColors[i * 3] = colors[i * 3];
                    this.targetColors[i * 3 + 1] = colors[i * 3 + 1];
                    this.targetColors[i * 3 + 2] = colors[i * 3 + 2];
                }
             }
        }
    }

    transitionTo(type) {
        this.generateModel(type);
        // Re-apply current emotion color logic after model change
        // Because generateModel resets targetColors to originalColors (which are neutral-ish white)
        // We need to check what the current emotion is supposed to be.
        // But we don't have access to 'state.emotion' here easily unless we store it.
        // Let's just let the next update loop handle it? 
        // No, setEmotion is called by VisionManager.
        // However, VisionManager calls setEmotion every frame?
        // In main.js: onVisionUpdate calls particleSystem.setEmotion(data.face.emotion) every frame.
        // So it should correct itself immediately in the next frame.
        
        // ISSUE: generateModel sets `this.isManualColor`? No.
        // generateModel sets `this.targetColors` to `colors` (which are white).
        
        // Wait, why did Heart look white?
        // 1. User switches to Heart.
        // 2. generateModel('heart') runs.
        //    -> Heart generated white.
        //    -> originalColors = White.
        //    -> targetColors = White.
        // 3. Next frame, onVisionUpdate runs.
        //    -> setEmotion('happy') runs.
        //    -> if (emotion === 'happy') { if not tree -> animateToColor(pink) }
        //    -> This SHOULD work.
        
        // Maybe the issue is that `animateToColor` picks random colors but if the target is white, it might not be obvious?
        // Or maybe `emotionColorMap['happy']` is not being picked up correctly?
        // Let's debug by ensuring we force an update if we know the emotion. 
        // But we don't store current emotion in ParticleSystem.
    }

    updateParticleCount(count) {
        // In a real app, we would rebuild buffers. 
        // For simplicity, we max out at init and just use 'count' range, or re-init.
        // Let's warn or just ignore for this demo if it exceeds max, or re-init.
        // Re-init is safer.
        if (count > this.maxParticleCount) count = this.maxParticleCount;
        this.currentCount = count;
        this.generateModel(this.currentModel);
    }

    setTargetScale(scale) {
        this.targetScale = scale;
    }

    setEmotion(emotion) {
        if (this.isManualColor) return; // Skip if user manually set color
        
        // Store current emotion
        this.currentEmotion = emotion;
        
        if (emotion === 'happy') {
             if (this.currentModel === 'christmasTree') {
                this.restoreOriginalColors();
             } else {
                // Explicitly log or ensure this path is hit
                const color = this.emotionColorMap['happy'];
                this.animateToColor(color);
             }
             return;
        }

        const color = this.emotionColorMap[emotion] || this.emotionColorMap['neutral'];
        this.animateToColor(color);
    }

    setBaseColor(hex) {
        this.isManualColor = true;
        const color = new THREE.Color(hex);
        this.animateToColor(color);
    }
    
    restoreOriginalColors() {
         for (let i = 0; i < this.currentCount; i++) {
             this.targetColors[i * 3] = this.originalColors[i * 3];
             this.targetColors[i * 3 + 1] = this.originalColors[i * 3 + 1];
             this.targetColors[i * 3 + 2] = this.originalColors[i * 3 + 2];
        }
    }

    animateToColor(colorOrColors) {
        const isArray = Array.isArray(colorOrColors);
        const colors = isArray ? colorOrColors : [colorOrColors];
        
        // Removed trunk protection logic:
        // When not in "original" (Happy/Green Tree) mode, the trunk should also change color 
        // to match the emotion/theme (e.g. Red for Angry, Blue for Sad).
        
        for (let i = 0; i < this.currentCount; i++) {
             // Simple random distribution or based on position?
             // Let's use random for "mixed" look
             const color = colors[Math.floor(Math.random() * colors.length)];
             
             this.targetColors[i * 3] = color.r;
             this.targetColors[i * 3 + 1] = color.g;
             this.targetColors[i * 3 + 2] = color.b;
        }
    }

    update(delta, time) {
        // Lerp Scale
        this.scale += (this.targetScale - this.scale) * 5.0 * delta;
        
        // Update Attribute Arrays
        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;
        
        // Speed of transition
        const lerpSpeed = 2.0 * delta; 
        const colorLerpSpeed = 2.0 * delta;

        for (let i = 0; i < this.currentCount; i++) {
            const idx = i * 3;
            
            // Position Lerp
            // Apply scale to target
            const tx = this.targetPositions[idx] * this.scale;
            const ty = this.targetPositions[idx+1] * this.scale;
            const tz = this.targetPositions[idx+2] * this.scale;
            
            positions[idx] += (tx - positions[idx]) * lerpSpeed;
            positions[idx+1] += (ty - positions[idx+1]) * lerpSpeed;
            positions[idx+2] += (tz - positions[idx+2]) * lerpSpeed;

            // Add some noise/floating effect
            positions[idx] += Math.sin(time + i) * 0.02;
            positions[idx+1] += Math.cos(time + i * 0.5) * 0.02;
            
            // Color Lerp
            colors[idx] += (this.targetColors[idx] - colors[idx]) * colorLerpSpeed;
            colors[idx+1] += (this.targetColors[idx+1] - colors[idx+1]) * colorLerpSpeed;
            colors[idx+2] += (this.targetColors[idx+2] - colors[idx+2]) * colorLerpSpeed;
        }
        
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
    }
}
