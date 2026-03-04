function ClothComponent(props) {
    const { dc, loadScript, isFullTab, isInception, onToggleFullTab, styles, onCodeReloadRequest } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasContainerRef = useRef(null);
    const guiContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // THREE.js refs to cleanup later
    const refs = useRef({
        scene: null, camera: null, renderer: null, material: null, mesh: null, controls: null,
        texture: null, sourceElement: null, currentVideoElement: null,
        animationId: null, gui: null, clock: null, THREE: null,
        params: {
            bgColor: '#111111',
            windForce: 0.2,
            fabricDetail: 0.45,
            shadowOpacity: 0.4,
            edgeScale: 8.8,
            edgeAmp: 0.07,
            frameSize: 0.0,
            photoInset: 0.013,
            paperColor: '#f0ebe0',
            edgeShadowColor: '#000000',
            edgeShadowOpacity: 0.071,
            scratchAmp: 0.0106272,
            grainAmp: 0.034925,
            vignette: 0.0,
            seed: 0.0
        }
    }).current;

    // THREE logic initialization
    useEffect(() => {
        let active = true;

        async function initThree() {
            try {
                // 1. Inject Import Map for THREE so ESM URL imports work
                let importMap = document.getElementById('three-import-map-cloth');
                if (!importMap) {
                    importMap = document.createElement('script');
                    importMap.id = 'three-import-map-cloth';
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

                // Wait a small tick for import map to register properly in the DOM
                await new Promise(r => setTimeout(r, 50));

                // 2. Load dependencies via LoadScript
                const THREE = await loadScript(dc, 'https://unpkg.com/three@0.160.0/build/three.module.js', { type: 'module' });
                const { OrbitControls } = await loadScript(dc, 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js', { type: 'module' });
                const GUI = await loadScript(dc, 'https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js', { type: 'module' });

                if (!active) return;
                setIsLoaded(true);
                refs.THREE = THREE;

                const container = canvasContainerRef.current;
                if (!container) return;
                container.innerHTML = ''; // Ensure clean slate

                // --- SHADERS ---
                const vertexShader = `
                    uniform float uTime;
                    uniform float uWindStrength;
                    uniform float uFabricFreq;
                    
                    varying vec2 vUv;
                    varying float vZ;

                    void main() {
                        vUv = uv;
                        vec3 pos = position;

                        // WIND LOGIC
                        float looseFactor = 1.0 - uv.y; 
                        float pinInfluence = pow(looseFactor, 1.8);

                        float wave1 = sin(uv.x * 5.0 + uTime * 2.0);
                        float wave2 = sin(uv.x * 12.0 + uTime * 4.0 + uv.y * 5.0); 
                        float wave3 = sin(uTime * 1.5); 
                        
                        float ripples = (wave1 * 0.5 + wave2 * 0.2 + wave3 * 0.3);

                        float displacement = (uWindStrength * 2.0 + ripples * uFabricFreq) * pinInfluence;
                        
                        pos.y += (sin(displacement) * 0.1) * pinInfluence;
                        pos.z += displacement;

                        vZ = displacement;

                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `;

                const fragmentShader = `
                    uniform sampler2D uTexture;
                    uniform float uRatio; 
                    
                    // Geometry
                    uniform float uEdgeScale;
                    uniform float uEdgeAmp;
                    uniform float uFrameSize;
                    uniform float uPhotoInset;
                    uniform vec3 uPaperColor;
                    
                    // FX
                    uniform float uScratchAmp;
                    uniform float uGrainAmp;
                    uniform float uVignette;
                    uniform float uSeed;
                    uniform float uShadowOpacity; 
                    
                    // EDGE SHADOW
                    uniform vec3 uEdgeShadowColor; 
                    uniform float uEdgeShadowOpacity; 
                    
                    varying vec2 vUv;
                    varying float vZ;

                    // --- Noise Utils ---
                    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                    float snoise(vec2 v){
                        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                        vec2 i  = floor(v + dot(v, C.yy) );
                        vec2 x0 = v - i + dot(i, C.xx);
                        vec2 i1;
                        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                        vec4 x12 = x0.xyxy + C.xxzz;
                        x12.xy -= i1;
                        i = mod(i, 289.0);
                        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                        m = m*m ;
                        m = m*m ;
                        vec3 x = 2.0 * fract(p * C.www) - 1.0;
                        vec3 h = abs(x) - 0.5;
                        vec3 ox = floor(x + 0.5);
                        vec3 a0 = x - ox;
                        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                        vec3 g;
                        g.x  = a0.x  * x0.x  + h.x  * x0.y;
                        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                        return 130.0 * dot(m, g);
                    }
                    float fbm(vec2 x) {
                        float v = 0.0; float a = 0.5; vec2 shift = vec2(100.0);
                        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
                        for (int i = 0; i < 5; ++i) { v += a * snoise(x + uSeed); x = rot * x * 2.0 + shift; a *= 0.5; }
                        return v;
                    }

                    void main() {
                        vec2 uv = vUv - 0.5;
                        vec2 aspectUV = uv;
                        aspectUV.x *= uRatio; 

                        // 1. SHAPE
                        float noise = fbm(aspectUV * uEdgeScale); 
                        float dist = max(abs(uv.x), abs(uv.y));
                        float raggedDist = dist + noise * uEdgeAmp;

                        float borderLimit = 0.5 - uFrameSize; 
                        float alpha = 1.0 - smoothstep(borderLimit, borderLimit + 0.01, raggedDist);
                        if (alpha < 0.01) discard;

                        // 2. PAPER
                        float paperGrain = fbm(vUv * 60.0);
                        vec3 paperCol = uPaperColor - paperGrain * 0.05;

                        // 3. PHOTO/VIDEO
                        vec4 photoTex = texture2D(uTexture, vUv);
                        float photoNoise = snoise(aspectUV * 30.0) * 0.005;
                        float photoDist = max(abs(uv.x), abs(uv.y)) + photoNoise;
                        float photoLimit = borderLimit - uPhotoInset;
                        float photoMask = 1.0 - smoothstep(photoLimit, photoLimit + 0.02, photoDist);

                        // 4. GRUNGE
                        float scratches = snoise(vec2(vUv.x * 300.0, vUv.y * 3.0));
                        float dust = fbm(vUv * 40.0 + uSeed);
                        
                        vec3 grungePhoto = photoTex.rgb;
                        grungePhoto = mix(grungePhoto, vec3(0.6, 0.5, 0.4), dust * uGrainAmp); 
                        grungePhoto -= scratches * uScratchAmp;
                        float len = length(uv); 
                        grungePhoto -= len * uVignette;

                        // Mix Paper and Photo
                        vec3 finalRGB = mix(paperCol, grungePhoto, photoMask);

                        // 5. CLOTH SHADOWS
                        finalRGB += vZ * uShadowOpacity;

                        // 6. EDGE SHADOW
                        float edgeShadowFactor = smoothstep(borderLimit - 0.05, borderLimit, raggedDist);
                        finalRGB = mix(finalRGB, uEdgeShadowColor, edgeShadowFactor * uEdgeShadowOpacity);

                        gl_FragColor = vec4(finalRGB, 1.0);
                    }
                `;

                // --- INIT SCENE ---
                const scene = new THREE.Scene();
                scene.background = new THREE.Color(refs.params.bgColor);

                const bounds = container.getBoundingClientRect();
                const aspect = bounds.width / bounds.height;
                const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
                camera.position.set(0, 0, 2.5);

                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setSize(bounds.width, bounds.height);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                container.appendChild(renderer.domElement);

                const controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;

                const geometry = new THREE.PlaneGeometry(1, 1, 64, 64);

                // Placeholder texture
                const cvs = document.createElement('canvas'); cvs.width = 2; cvs.height = 2;
                const ctx = cvs.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 2, 2);
                const placeholderTex = new THREE.CanvasTexture(cvs);

                const material = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    uniforms: {
                        uTexture: { value: placeholderTex },
                        uRatio: { value: 1.0 },
                        uTime: { value: 0 },

                        uWindStrength: { value: refs.params.windForce },
                        uFabricFreq: { value: refs.params.fabricDetail },
                        uShadowOpacity: { value: refs.params.shadowOpacity },

                        uEdgeScale: { value: refs.params.edgeScale },
                        uEdgeAmp: { value: refs.params.edgeAmp },
                        uFrameSize: { value: refs.params.frameSize },
                        uPhotoInset: { value: refs.params.photoInset },
                        uPaperColor: { value: new THREE.Color(refs.params.paperColor) },

                        uScratchAmp: { value: refs.params.scratchAmp },
                        uGrainAmp: { value: refs.params.grainAmp },
                        uVignette: { value: refs.params.vignette },
                        uSeed: { value: refs.params.seed },

                        uEdgeShadowColor: { value: new THREE.Color(refs.params.edgeShadowColor) },
                        uEdgeShadowOpacity: { value: refs.params.edgeShadowOpacity }
                    },
                    side: THREE.DoubleSide,
                    transparent: true
                });

                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = 0.0;
                scene.add(mesh);

                refs.scene = scene;
                refs.camera = camera;
                refs.renderer = renderer;
                refs.material = material;
                refs.mesh = mesh;
                refs.controls = controls;
                refs.texture = placeholderTex;
                refs.clock = new THREE.Clock();

                // --- GUI ---
                const gui = new GUI.default({
                    title: 'Settings',
                    container: guiContainerRef.current
                });
                refs.gui = gui;

                const fScene = gui.addFolder('Scene');
                fScene.addColor(refs.params, 'bgColor').name('Background Color').onChange(v => scene.background.set(v));
                fScene.close();

                const fWind = gui.addFolder('🌬 WIND (Cloth)');
                fWind.add(refs.params, 'windForce', 0.0, 2.0).name('Wind Force');
                fWind.add(refs.params, 'fabricDetail', 0.0, 1.0).name('Fabric Detail').onChange(v => material.uniforms.uFabricFreq.value = v);
                fWind.add(refs.params, 'shadowOpacity', 0.0, 1.0).name('Cloth Shadow Opacity').onChange(v => material.uniforms.uShadowOpacity.value = v);
                fWind.close();

                const fShape = gui.addFolder('Frame & Shape');
                fShape.add(refs.params, 'edgeScale', 1.0, 20.0).name('Edge Scale').onChange(v => material.uniforms.uEdgeScale.value = v);
                fShape.add(refs.params, 'edgeAmp', 0.0, 0.2).name('Edge Amplitude').onChange(v => material.uniforms.uEdgeAmp.value = v);
                fShape.add(refs.params, 'frameSize', 0.0, 0.2).name('Frame Crop').onChange(v => material.uniforms.uFrameSize.value = v);
                fShape.add(refs.params, 'photoInset', 0.0, 0.2).name('Inner Border').onChange(v => material.uniforms.uPhotoInset.value = v);
                fShape.addColor(refs.params, 'paperColor').name('Cloth Color').onChange(v => material.uniforms.uPaperColor.value.set(v));
                fShape.close();

                const fEdge = fShape.addFolder('Torn Edge Shadow');
                fEdge.addColor(refs.params, 'edgeShadowColor').name('Color').onChange(v => material.uniforms.uEdgeShadowColor.value.set(v));
                fEdge.add(refs.params, 'edgeShadowOpacity', 0.0, 1.0).name('Opacity').onChange(v => material.uniforms.uEdgeShadowOpacity.value = v);
                fEdge.close();

                const fFx = gui.addFolder('Grunge FX');
                fFx.add(refs.params, 'grainAmp', 0.0, 0.275).name('Grain Strength').onChange(v => material.uniforms.uGrainAmp.value = v);
                fFx.add(refs.params, 'scratchAmp', 0.0, 0.0648).name('Scratches').onChange(v => material.uniforms.uScratchAmp.value = v);
                fFx.add(refs.params, 'vignette', 0.0, 1.0).name('Vignette').onChange(v => material.uniforms.uVignette.value = v);
                fFx.add(refs.params, 'seed', 0.0, 5.0).name('Variation (Seed)').onChange(v => material.uniforms.uSeed.value = v);
                fFx.close();

                gui.add({ loadFile: () => fileInputRef.current?.click() }, 'loadFile').name('📷 🎥 Load Media...');


                // --- MEDIA LOADING LOGIC ---
                function applyTexture(texture, width, height) {
                    if (refs.texture && refs.texture !== placeholderTex) refs.texture.dispose();
                    refs.texture = texture;
                    material.uniforms.uTexture.value = texture;

                    const aspect = width / height;
                    material.uniforms.uRatio.value = aspect;

                    const baseHeight = 1.3;
                    mesh.scale.set(baseHeight * aspect, baseHeight, 1);
                }
                refs.applyTexture = applyTexture;

                const textureLoader = new THREE.TextureLoader();
                // Load default image initially
                textureLoader.load('https://iili.io/fvTp5sS.md.jpg', (tex) => {
                    if (!active) return;
                    tex.colorSpace = THREE.SRGBColorSpace;
                    applyTexture(tex, tex.image.width, tex.image.height);
                });

                // Resize observer
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

                    const time = refs.clock.getElapsedTime();
                    refs.material.uniforms.uTime.value = time;

                    let gust = (Math.sin(time * 0.7) + Math.sin(time * 2.3) * 0.5) + 0.5;
                    gust = Math.max(0.0, gust);
                    refs.material.uniforms.uWindStrength.value = gust * refs.params.windForce * 0.3;

                    if (refs.controls) refs.controls.update();

                    if (refs.renderer && refs.scene && refs.camera) {
                        refs.renderer.render(refs.scene, refs.camera);
                    }
                };
                animate();

            } catch (e) {
                console.error("TornCloth Init Error:", e);
                if (active) setError(e.message);
            }
        }

        initThree();

        return () => {
            active = false;
            if (refs.animationId) cancelAnimationFrame(refs.animationId);
            if (refs.gui) refs.gui.destroy();
            if (refs.renderer) refs.renderer.dispose();
            if (refs.material) refs.material.dispose();
            if (refs.mesh) refs.mesh.geometry.dispose();
            if (refs.currentVideoElement) {
                refs.currentVideoElement.pause();
                refs.currentVideoElement.src = '';
                refs.currentVideoElement.remove();
            }
            if (refs.texture) refs.texture.dispose();
            window.removeEventListener('resize', () => { });
        };
    }, []);

    // Handlers
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (refs.currentVideoElement) {
            refs.currentVideoElement.pause();
            refs.currentVideoElement.removeAttribute('src');
            refs.currentVideoElement.load();
            refs.currentVideoElement = null;
        }

        const objectUrl = URL.createObjectURL(file);

        if (file.type.startsWith('video')) {
            const video = document.createElement('video');
            video.src = objectUrl;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = "anonymous";
            video.play().catch(e => console.warn("Video play error:", e));

            refs.currentVideoElement = video;

            if (refs.THREE) {
                const videoTexture = new refs.THREE.VideoTexture(video);
                videoTexture.minFilter = refs.THREE.LinearFilter;
                videoTexture.magFilter = refs.THREE.LinearFilter;
                videoTexture.format = refs.THREE.RGBAFormat;
                videoTexture.colorSpace = refs.THREE.SRGBColorSpace;

                video.addEventListener('loadedmetadata', () => {
                    refs.applyTexture(videoTexture, video.videoWidth, video.videoHeight);
                });
            }

        } else {
            if (refs.THREE) {
                const textureLoader = new refs.THREE.TextureLoader();
                textureLoader.load(objectUrl, (tex) => {
                    tex.colorSpace = refs.THREE.SRGBColorSpace; // Map colors properly
                    refs.applyTexture(tex, tex.image.width, tex.image.height);
                });
            }
        }
    };

    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) {
            handleFileChange({ target: { files: [e.dataTransfer.files[0]] } });
        }
    };

    return (
        <div style={styles.fullTabWrapper} onDragOver={handleDragOver} onDrop={handleDrop}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {!isLoaded && !error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', zIndex: 10 }}>
                    <dc.Icon icon="loader" className="animate-spin" style={{ fontSize: '32px' }} />
                </div>
            )}

            {error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', zIndex: 10, padding: '20px', textAlign: 'center' }}>
                    Error loading Component: {error}
                </div>
            )}

            <div ref={canvasContainerRef} style={styles.canvas} />

            <div ref={guiContainerRef} style={styles.guiContainer} />

            {!isInception && (
                <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                    <button
                        onClick={onToggleFullTab}
                        style={{ padding: '8px', background: 'rgba(0,0,0,0.6)', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
                    </button>
                </div>
            )}

            <style>{`
                .lil-gui { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                }
            `}</style>
        </div>
    );
}

return { ClothComponent };
