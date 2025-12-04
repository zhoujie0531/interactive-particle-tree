export class VisionManager {
    constructor() {
        this.hands = null;
        this.faceMesh = null;
        this.camera = null;
        this.onUpdate = null;
    }

    async init(videoElement, callback) {
        this.onUpdate = callback;

        // Initialize Hands
        this.hands = new window.Hands({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }});
        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        this.hands.onResults(this.onHandsResults.bind(this));

        // Initialize Face Mesh
        this.faceMesh = new window.FaceMesh({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }});
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        this.faceMesh.onResults(this.onFaceResults.bind(this));

        // Initialize Camera
        // Note: MediaPipe's Camera Utils sometimes fail with certain constraints or contexts.
        // We will try to use it, but if it fails, we can fallback or provide better error logging.
        try {
            this.camera = new window.Camera(videoElement, {
                onFrame: async () => {
                    if(this.hands) await this.hands.send({image: videoElement});
                    if(this.faceMesh) await this.faceMesh.send({image: videoElement});
                },
                width: 640,
                height: 480
            });
            await this.camera.start();
            document.getElementById('loading').textContent = 'Camera Started!';
            setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
            }, 1000);
        } catch (e) {
            console.error("Camera failed to start:", e);
            document.getElementById('loading').textContent = 'Camera Error! See Console.';
        }
    }

    onHandsResults(results) {
        let distance = 1.0; // Default open
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Use the first detected hand
            const landmarks = results.multiHandLandmarks[0];
            
            // Calculate "Openness" based on finger extension
            // We use the ratio of (Wrist to Finger Tip) / (Wrist to Finger MCP)
            // Landmarks: 0=Wrist
            // Tips: 8(Index), 12(Middle), 16(Ring), 20(Pinky)
            // MCPs: 5, 9, 13, 17
            
            // We use Wrist(0) to MiddleMCP(9) as a reference scale for the hand size
            const wrist = landmarks[0];
            const middleMCP = landmarks[9];
            
            const scaleRef = Math.sqrt(
                Math.pow(wrist.x - middleMCP.x, 2) + 
                Math.pow(wrist.y - middleMCP.y, 2) + 
                Math.pow(wrist.z - middleMCP.z, 2)
            );
            
            // Calculate average distance from Wrist to Tips
            const tips = [8, 12, 16, 20];
            let avgTipDist = 0;
            
            tips.forEach(idx => {
                const tip = landmarks[idx];
                const d = Math.sqrt(
                    Math.pow(wrist.x - tip.x, 2) + 
                    Math.pow(wrist.y - tip.y, 2) + 
                    Math.pow(wrist.z - tip.z, 2)
                );
                avgTipDist += d;
            });
            avgTipDist /= tips.length;
            
            // Ratio: TipDist / ScaleRef
            // Open hand: Ratio is usually > 2.0 (Tips are far)
            // Fist: Ratio is usually < 1.2 (Tips are curled in)
            const ratio = avgTipDist / scaleRef;
            
            // Map Ratio to 0..1
            // Range approx 1.0 (Closed) to 2.2 (Open)
            // Adjusted for better sensitivity: make it easier to reach 0% and 100%
            const minR = 1.2; 
            const maxR = 1.9;
            
            distance = (ratio - minR) / (maxR - minR);
            distance = Math.min(Math.max(distance, 0), 1); // Clamp
            
        } else {
            // No hands detected? Keep previous or default?
            // Let's default to 1.0 (Open) so it doesn't disappear
             distance = 1.0;
        }
        
        this.lastHandDistance = distance;
        this.triggerUpdate();
    }

    onFaceResults(results) {
        let emotion = 'neutral';
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            // Key Landmarks
            // Face Width (Cheekbones): 234 (Left), 454 (Right)
            // Mouth: 13 (Upper Lip Top), 14 (Lower Lip Bottom), 61 (Left Corner), 291 (Right Corner)
            // Eyebrows: 66 (Left Inner), 296 (Right Inner), 105 (Left Top), 334 (Right Top)
            
            const leftCheek = landmarks[234];
            const rightCheek = landmarks[454];
            const faceWidth = Math.sqrt(
                Math.pow(rightCheek.x - leftCheek.x, 2) + 
                Math.pow(rightCheek.y - leftCheek.y, 2)
            );
            
            // 1. MOUTH OPENNESS (Surprise)
            const upperLip = landmarks[13];
            const lowerLip = landmarks[14];
            const mouthOpenDist = Math.sqrt(
                Math.pow(upperLip.x - lowerLip.x, 2) + 
                Math.pow(upperLip.y - lowerLip.y, 2)
            );
            const mouthOpenRatio = mouthOpenDist / faceWidth;
            
            // 2. SMILE / FROWN (Happy / Sad)
            // Compare mouth corners Y to upper lip Y.
            // Note: In screen coords, Y increases downwards.
            // Smile: Corners are HIGHER (smaller Y) than center.
            // Frown: Corners are LOWER (larger Y) than center.
            const leftCorner = landmarks[61];
            const rightCorner = landmarks[291];
            const avgCornerY = (leftCorner.y + rightCorner.y) / 2;
            const lipCenterY = upperLip.y;
            
            // Positive = Smile (Corners above center), Negative = Frown
            const smileVal = (lipCenterY - avgCornerY) / faceWidth; 
            
            // 3. BROW SQUEEZE (Angry)
            // Distance between inner eyebrows
            const leftBrowInner = landmarks[66];
            const rightBrowInner = landmarks[296];
            const browDist = Math.sqrt(
                Math.pow(rightBrowInner.x - leftBrowInner.x, 2) + 
                Math.pow(rightBrowInner.y - leftBrowInner.y, 2)
            );
            const browRatio = browDist / faceWidth;
            
            // --- DECISION TREE ---
            // Prioritize distinct expressions
            
            // Surprise: Significant mouth opening
            // Lowered threshold slightly to 0.08 (8%) to make it responsive but not too trigger-happy
            // If it was too easy before, maybe 0.15 was actually fine? 
            // User said "Only detects Neutral and Surprise", implies Surprise is working or over-working.
            // Let's keep it at 0.10 to balance.
            if (mouthOpenRatio > 0.12) {
                emotion = 'surprise';
            } 
            // Happy: Corners noticeably above center
            // Threshold 0.03 seems reasonable for a smile
            else if (smileVal > 0.03) {
                emotion = 'happy';
            }
            // Angry: Brows squeezed together
            // Normal ratio is around 0.25-0.30. Squeezed is < 0.22
            // Relaxed threshold: 0.24
            else if (browRatio < 0.25) {
                emotion = 'angry';
            }
            // Sad: Corners below center
            // Often hard to detect without exaggeration
            else if (smileVal < -0.02) {
                emotion = 'sad';
            }
            else {
                emotion = 'neutral';
            }
        }
        
        this.lastEmotion = emotion;
        this.triggerUpdate();
    }
    
    triggerUpdate() {
        if (this.onUpdate) {
            this.onUpdate({
                hands: { distance: this.lastHandDistance || 0.5 },
                face: { emotion: this.lastEmotion || 'neutral' }
            });
        }
    }
}
