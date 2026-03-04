function DisplacementComponent(props) {
    const { dc, loadScript, isFullTab, isInception, onToggleFullTab, styles, onCodeReloadRequest } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasContainerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [isRecording, setIsRecording] = useState(false);

    // THREE.js refs to cleanup later
    const refs = useRef({
        scene: null, camera: null, renderer: null, material: null, mesh: null, controls: null,
        texture: null, sourceElement: null, mediaRecorder: null, recordedChunks: [],
        animationId: null, recordBtnCtrl: null, gui: null,
        CONFIG: {
            videoURL: 'https://ik.imagekit.io/sqiqig7tz/e4d8fe34-ac0f-4485-9c56-716f218acdc1_hd.mp4',
            layers: 8,
            strength: 0.225,
            softness: 1,
            autoRotate: false,
            rotateSpeed: 1.0,
            bitrate: 25000000 // 25 Mbps
        }
    }).current;

    // THREE logic initialization
    useEffect(() => {
        let active = true;

        async function initThree() {
            try {
                // 1. Inject Import Map for THREE so ESM URL imports work
                let importMap = document.getElementById('three-import-map');
                if (!importMap) {
                    importMap = document.createElement('script');
                    importMap.id = 'three-import-map';
                    importMap.type = 'importmap';
                    importMap.textContent = JSON.stringify({
                        imports: {
                            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/",
                            "lil-gui": "https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js"
                        }
                    });
                    document.head.appendChild(importMap);
                }

                // Wait a small tick for import map to register
                await new Promise(r => setTimeout(r, 50));

                // 2. Load dependencies via LoadScript
                // We load them as ESM modules. LoadScript creates blob URLs or native dynamic imports.
                // Actually, since the user script uses native ESM imports from three and three/addons, we can just load a single "orchestrator" blob, 
                // OR we can fetch THREE and GUI via loadScript and attach to window.
                // We will load THREE directly as a module
                const THREE = await loadScript(dc, 'https://unpkg.com/three@0.160.0/build/three.module.js', { type: 'module' });
                const { OrbitControls } = await loadScript(dc, 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js', { type: 'module' });
                const GUI = await loadScript(dc, 'https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js', { type: 'module' });

                if (!active) return;
                setIsLoaded(true);

                const container = canvasContainerRef.current;
                if (!container) return;

                // Ensure clean slate
                container.innerHTML = '';

                // --- SHADERS ---
                const vertexShader = `
            uniform sampler2D uTexture;
            uniform float uDisplacementStrength;
            uniform float uLayers;
            uniform float uSoftness;
            varying vec2 vUv;

            float getLuminance(vec3 color) {
                return dot(color, vec3(0.299, 0.587, 0.114));
            }

            void main() {
                vUv = uv;
                vec4 color = texture2D(uTexture, uv);
                float brightness = getLuminance(color.rgb);
                
                float stepped = floor(brightness * uLayers) / uLayers;
                float smoothVal = brightness;
                float elevation = mix(stepped, smoothVal, uSoftness);

                vec3 newPos = position + normal * (elevation * uDisplacementStrength);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
            }
        `;

                const fragmentShader = `
            uniform sampler2D uTexture;
            varying vec2 vUv;
            void main() {
                gl_FragColor = texture2D(uTexture, vUv);
            }
        `;

                // --- INIT THREE ---
                const scene = new THREE.Scene();
                scene.background = new THREE.Color(0x050505);

                // Responsive aspects based on container, not window unless full tab
                const bounds = container.getBoundingClientRect();
                const aspect = bounds.width / bounds.height;
                const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
                camera.position.z = 2;

                const renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    preserveDrawingBuffer: true
                });
                renderer.setSize(bounds.width, bounds.height);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                container.appendChild(renderer.domElement);

                const controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;

                const geometry = new THREE.PlaneGeometry(1, 1, 400, 400);

                // Placeholder texture
                const cvs = document.createElement('canvas'); cvs.width = 2; cvs.height = 2;
                const ctx = cvs.getContext('2d'); ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 2, 2);
                const placeholderTex = new THREE.CanvasTexture(cvs);

                const material = new THREE.ShaderMaterial({
                    vertexShader,
                    fragmentShader,
                    uniforms: {
                        uTexture: { value: placeholderTex },
                        uDisplacementStrength: { value: refs.CONFIG.strength },
                        uLayers: { value: refs.CONFIG.layers },
                        uSoftness: { value: refs.CONFIG.softness }
                    },
                    side: THREE.DoubleSide
                });

                const mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh);

                // Save to refs
                refs.scene = scene;
                refs.camera = camera;
                refs.renderer = renderer;
                refs.material = material;
                refs.mesh = mesh;
                refs.controls = controls;
                refs.texture = placeholderTex;
                refs.THREE = THREE; // Store THREE instance

                // Setup GUI
                const gui = new GUI.default({ title: 'Controls' });
                refs.gui = gui;
                // Position GUI absolutely within our container bounds
                gui.domElement.style.position = 'absolute';
                gui.domElement.style.top = 'auto';
                gui.domElement.style.bottom = '20px';
                gui.domElement.style.right = '20px';
                container.appendChild(gui.domElement);

                const ef = gui.addFolder('Effect');
                ef.add(refs.CONFIG, 'layers', 2, 50, 1).onChange(v => { if (refs.material) refs.material.uniforms.uLayers.value = v; });
                ef.add(refs.CONFIG, 'strength', -2, 0.3).onChange(v => { if (refs.material) refs.material.uniforms.uDisplacementStrength.value = v; });
                ef.add(refs.CONFIG, 'softness', 0, 1).onChange(v => { if (refs.material) refs.material.uniforms.uSoftness.value = v; });

                const an = gui.addFolder('Animation');
                an.add(refs.CONFIG, 'autoRotate').name('Auto Sway').onChange(v => {
                    if (!v && mesh) mesh.rotation.y = 0;
                });
                an.add(refs.CONFIG, 'rotateSpeed', 0.1, 3);

                const io = gui.addFolder('Export');
                io.add(refs.CONFIG, 'videoURL').name('Video URL');
                io.add({ load: () => loadVideoFromURL(refs.CONFIG.videoURL) }, 'load').name('▶ Load URL');
                io.add({ load: () => document.getElementById('displacement-file-input').click() }, 'load').name('📂 Local File');
                io.add({ shot: takeScreenshot }, 'shot').name('📷 Screenshot');
                refs.recordBtnCtrl = io.add({ rec: toggleRecord }, 'rec').name('🔴 Start Recording');
                io.add(refs.CONFIG, 'bitrate', 1000000, 50000000, 1000000).name('Bitrate (bps)');

                ef.open();
                io.open();

                // --- MEDIA LOADING LOGIC ---
                function applyMedia(url, isVideoSource) {
                    const uiLayer = document.getElementById('displacement-ui-layer');
                    if (uiLayer) uiLayer.style.display = 'none';

                    if (refs.sourceElement && refs.sourceElement.tagName === 'VIDEO') {
                        refs.sourceElement.pause();
                        refs.sourceElement.src = '';
                        refs.sourceElement.load();
                    }
                    if (refs.texture && refs.texture !== placeholderTex) refs.texture.dispose();

                    if (isVideoSource) {
                        const vid = document.createElement('video');
                        vid.crossOrigin = 'anonymous';
                        vid.loop = true;
                        vid.muted = true;
                        vid.playsInline = true;
                        vid.src = url;

                        vid.onloadedmetadata = () => {
                            vid.play().catch(e => console.warn("Autoplay blocked:", e));
                            const newTex = new THREE.VideoTexture(vid);
                            newTex.minFilter = THREE.LinearFilter;
                            refs.texture = newTex;
                            fitScreen(vid.videoWidth, vid.videoHeight);
                        };
                        refs.sourceElement = vid;
                    } else {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.src = url;
                        img.onload = () => {
                            const newTex = new THREE.TextureLoader().load(url);
                            newTex.minFilter = THREE.LinearFilter;
                            refs.texture = newTex;
                            fitScreen(img.width, img.height);
                        };
                        img.onerror = () => {
                            alert("Error loading image. Check URL.");
                        };
                        refs.sourceElement = img;
                    }
                }

                function loadVideoFromURL(url) {
                    if (!url) return;
                    applyMedia(url, true);
                }

                refs.applyMedia = applyMedia;

                function fitScreen(w, h) {
                    refs.material.uniforms.uTexture.value = refs.texture;
                    const aspect = w / h;
                    refs.mesh.scale.set(aspect, 1, 1);

                    const vFov = refs.camera.fov * Math.PI / 180;
                    const dist = 0.6 / Math.tan(vFov / 2);
                    refs.camera.position.set(0, 0, dist);
                    refs.controls.target.set(0, 0, 0);
                }

                // Apply auto-start video
                if (refs.CONFIG.videoURL && refs.CONFIG.videoURL.trim() !== "") {
                    loadVideoFromURL(refs.CONFIG.videoURL);
                }

                // Resize handler
                const onResize = () => {
                    if (!container || !refs.renderer || !refs.camera) return;
                    const b = container.getBoundingClientRect();
                    refs.camera.aspect = b.width / b.height;
                    refs.camera.updateProjectionMatrix();
                    refs.renderer.setSize(b.width, b.height);
                };
                window.addEventListener('resize', onResize);
                const resizeObserver = new ResizeObserver(onResize);
                resizeObserver.observe(container);

                // Render loop
                const animate = () => {
                    refs.animationId = requestAnimationFrame(animate);
                    if (refs.controls) refs.controls.update();

                    if (refs.CONFIG.autoRotate && refs.mesh) {
                        const t = Date.now() * 0.001;
                        refs.mesh.rotation.y = Math.sin(t * refs.CONFIG.rotateSpeed) * THREE.MathUtils.degToRad(6);
                    }
                    if (refs.renderer && refs.scene && refs.camera) {
                        refs.renderer.render(refs.scene, refs.camera);
                    }
                };
                animate();

            } catch (e) {
                console.error("DisplacementView Init Error:", e);
                if (active) setError(e.message);
            }
        }

        initThree();

        return () => {
            active = false;
            if (refs.animationId) cancelAnimationFrame(refs.animationId);
            if (refs.gui) refs.gui.destroy();
            if (refs.renderer) {
                refs.renderer.dispose();
            }
            if (refs.material) refs.material.dispose();
            if (refs.mesh) refs.mesh.geometry.dispose();
            if (refs.sourceElement && refs.sourceElement.tagName === 'VIDEO') {
                refs.sourceElement.pause();
                refs.sourceElement.src = '';
            }
            if (refs.mediaRecorder && refs.mediaRecorder.state !== "inactive") {
                try { refs.mediaRecorder.stop(); } catch (e) { }
            }
            window.removeEventListener('resize', () => { });
        };
    }, []);

    // --- RECORDING / CAPTURE ---
    function getSupportedMimeType() {
        const candidates = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4;codecs="avc1.42E01E"',
            'video/mp4'
        ];
        if (!window.MediaRecorder) return null;
        if (typeof MediaRecorder.isTypeSupported !== 'function') return null;
        for (const mime of candidates) {
            try {
                if (MediaRecorder.isTypeSupported(mime)) return mime;
            } catch (e) { }
        }
        return null;
    }

    function startRecording() {
        const canvas = refs.renderer?.domElement;
        if (!canvas) return;

        refs.renderer.render(refs.scene, refs.camera);
        const stream = canvas.captureStream(30);

        let selectedMime = getSupportedMimeType();
        const optionSets = [];
        if (selectedMime) optionSets.push({ mimeType: selectedMime, videoBitsPerSecond: refs.CONFIG.bitrate });
        if (selectedMime) optionSets.push({ mimeType: selectedMime });
        optionSets.push({ videoBitsPerSecond: refs.CONFIG.bitrate });
        optionSets.push({});

        let recorder;
        let lastErr = null;
        for (const opts of optionSets) {
            try {
                recorder = new MediaRecorder(stream, opts);
                break;
            } catch (e) { lastErr = e; }
        }

        if (!recorder) {
            alert("Failed to initialize recorder.");
            return;
        }

        refs.mediaRecorder = recorder;
        refs.recordedChunks = [];

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) refs.recordedChunks.push(e.data);
        };

        recorder.onstop = saveVideo;

        try {
            recorder.start(1000);
            setIsRecording(true);
            if (refs.recordBtnCtrl) refs.recordBtnCtrl.name("⬛ Stop Recording");
        } catch (e) {
            console.error("Start error:", e);
            alert("Could not start recording.");
            setIsRecording(false);
            if (refs.recordBtnCtrl) refs.recordBtnCtrl.name("🔴 Start Recording");
        }
    }

    function stopRecording() {
        if (!refs.mediaRecorder || refs.mediaRecorder.state === "inactive") return;
        try { refs.mediaRecorder.stop(); } catch (e) { console.error(e); }
        setIsRecording(false);
        if (refs.recordBtnCtrl) refs.recordBtnCtrl.name("⏳ Saving...");
    }

    function toggleRecord() {
        if (isRecording) stopRecording();
        else startRecording();
    }

    function saveVideo() {
        if (!refs.recordedChunks || refs.recordedChunks.length === 0) {
            console.warn("Recording is empty.");
            if (refs.recordBtnCtrl) refs.recordBtnCtrl.name("🔴 Start Recording");
            setIsRecording(false);
            return;
        }

        const type = (refs.recordedChunks[0] && refs.recordedChunks[0].type) ? refs.recordedChunks[0].type : (refs.mediaRecorder?.mimeType || "");
        const blob = new Blob(refs.recordedChunks, { type: type || 'video/webm' });
        const url = URL.createObjectURL(blob);

        const t = (blob.type || '').toLowerCase();
        let ext = 'webm';
        if (t.includes('mp4')) ext = 'mp4';

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `displacement_record.${ext}`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (refs.recordBtnCtrl) refs.recordBtnCtrl.name("🔴 Start Recording");
            setIsRecording(false);
        }, 600);
    }

    function takeScreenshot() {
        if (!refs.renderer || !refs.scene || !refs.camera) return;
        refs.renderer.render(refs.scene, refs.camera);
        const a = document.createElement('a');
        a.href = refs.renderer.domElement.toDataURL('image/png');
        a.download = 'displacement_screenshot.png';
        a.click();
    }

    // File loading handler
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (refs.applyMedia) refs.applyMedia(url, file.type.startsWith('video'));
    };

    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0];
            const url = URL.createObjectURL(file);
            if (refs.applyMedia) refs.applyMedia(url, file.type.startsWith('video'));
        }
    };

    return (
        <div
            style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* File Input hidden */}
            <input type="file" id="displacement-file-input" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />

            {/* Rec Badge */}
            {isRecording && (
                <div style={{
                    position: 'absolute', top: '20px', left: '20px',
                    background: '#e74c3c', color: 'white', padding: '8px 12px', borderRadius: '4px',
                    fontWeight: 'bold', fontFamily: 'monospace',
                    boxShadow: '0 0 15px #e74c3c',
                    zIndex: 999,
                    animation: 'pulse 1s infinite'
                }}>
                    REC ●
                    <style>{`@keyframes pulse { 50% { opacity: 0.5; } }`}</style>
                </div>
            )}

            {/* Overlays */}
            {!isLoaded && !error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', zIndex: 10 }}>
                    <dc.Icon icon="loader" className="animate-spin" style={{ fontSize: '32px' }} />
                </div>
            )}
            {error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', zIndex: 10, padding: '20px', textAlign: 'center' }}>
                    Error loading Three.js or Shaders: {error}
                </div>
            )}

            <div id="displacement-ui-layer" style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                color: '#888', pointerEvents: 'none', textAlign: 'center', mixBlendMode: 'exclusion', zIndex: 5
            }}>
                <h2>Drag & Drop OR use URL</h2>
            </div>

            {/* Canvas container */}
            <div ref={canvasContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Expand/Contract Control */}
            {!isInception && (
                <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
                    <button
                        onClick={onToggleFullTab}
                        style={{ padding: '8px', background: 'rgba(0,0,0,0.6)', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
                    </button>
                </div>
            )}
        </div>
    );
}

return { DisplacementComponent };
