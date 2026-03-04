function KineticComponent(props) {
    const { dc, loadScript, isFullTab, isInception, onToggleFullTab, styles, onCodeReloadRequest } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasContainerRef = useRef(null);
    const guiContainerRef = useRef(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // --- Singleton Persistence ---
    const refs = useRef({
        scene: null, camera: null, renderer: null,
        mesh: null, gui: null, animationId: null, clock: null, geometry: null, material: null, controls: null,
        texture: null, hiddenCanvas: null,
        THREE: null,
        GUI: null,
        OrbitControls: null,
        params: {
            text: "ENDLESS",
            fontSize: 200,
            fontWeight: 900,
            textColor: "#ffffff",
            bgColor: "#000000",
            repeatX: 6.0,
            repeatY: 3.0,
            speedX: 1.0,
            speedY: 0.0,
            wireframe: false
        }
    }).current;

    // Dynamically regenerate the Canvas texture whenever text/colors change
    const updateCanvasTexture = () => {
        if (!refs.hiddenCanvas) {
            refs.hiddenCanvas = document.createElement('canvas');
        }
        const canvas = refs.hiddenCanvas;
        // Adjust resolution for better packing
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = refs.params.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Text
        ctx.font = `${refs.params.fontWeight} ${refs.params.fontSize}px sans-serif`;
        ctx.fillStyle = refs.params.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Adjust vertically to ensure text sits cleanly in the middle of the texture repeating row
        ctx.fillText(refs.params.text, canvas.width / 2, canvas.height / 2 + (refs.params.fontSize * 0.1));

        if (refs.texture) {
            refs.texture.needsUpdate = true;
        } else if (refs.THREE) {
            refs.texture = new refs.THREE.CanvasTexture(canvas);
            refs.texture.wrapS = refs.THREE.RepeatWrapping;
            refs.texture.wrapT = refs.THREE.RepeatWrapping;
            refs.texture.generateMipmaps = true;
            refs.texture.minFilter = refs.THREE.LinearMipmapLinearFilter;
        }
    };

    useEffect(() => {
        let active = true;

        async function init() {
            try {
                // 1. Map ESM dependencies
                let importMap = document.getElementById('three-import-map-kinetic');
                if (!importMap) {
                    importMap = document.createElement('script');
                    importMap.id = 'three-import-map-kinetic';
                    importMap.type = 'importmap';
                    importMap.textContent = JSON.stringify({
                        imports: {
                            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
                        }
                    });
                    document.head.appendChild(importMap);
                }

                await new Promise(r => setTimeout(r, 50));

                // 2. Load Modules
                const THREE = await loadScript(dc, 'https://unpkg.com/three@0.160.0/build/three.module.js', { type: 'module' });
                const { OrbitControls } = await loadScript(dc, 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js', { type: 'module' });
                const { GUI } = await loadScript(dc, 'https://unpkg.com/three@0.160.0/examples/jsm/libs/lil-gui.module.min.js', { type: 'module' });

                if (!active) return;
                setIsLoaded(true);
                refs.THREE = THREE;
                refs.GUI = GUI;
                refs.OrbitControls = OrbitControls;

                const container = canvasContainerRef.current;
                if (!container) return;
                container.innerHTML = '';

                // Prep Texture
                updateCanvasTexture();

                // --- 3. Scene Setup ---
                const scene = new THREE.Scene();
                refs.scene = scene;

                const bounds = container.getBoundingClientRect();
                const aspect = bounds.width / bounds.height;
                const camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
                camera.position.z = 60;
                refs.camera = camera;

                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setSize(bounds.width, bounds.height);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                renderer.setClearColor(0x000000, 1);
                container.appendChild(renderer.domElement);
                refs.renderer = renderer;

                const controls = new OrbitControls(camera, renderer.domElement);
                refs.controls = controls;

                // --- 4. Custom Shader Geometry ---
                // The Torus Knot needs specific sizing to match the reference text wrapping style
                const geometry = new THREE.TorusKnotGeometry(9, 3, 768, 3, 4, 3);
                refs.geometry = geometry;

                const vertexShader = `
                  varying vec2 vUv;
                  varying vec3 vPos;

                  void main() {
                    vUv = uv;
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
                  }
                `;

                const fragmentShader = `
                  varying vec2 vUv;
                  varying vec3 vPos;

                  uniform sampler2D uTexture;
                  uniform float uTime;
                  uniform vec2 uRepeat;
                  uniform vec2 uSpeed;

                  void main() {
                    float time = uTime * 0.5;
                    vec2 repeat = -uRepeat;
                    // Fragment wrapping over time
                    vec2 uv = fract(vUv * repeat - (uSpeed * time)); 

                    // Fake depth shadow
                    float shadow = clamp(vPos.z / 5., 0., 1.);
                    vec3 texture = texture2D(uTexture, uv).rgb;

                    gl_FragColor = vec4(texture * shadow, 1.);
                  }
                `;

                const material = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    uniforms: {
                        uTime: { value: 0 },
                        uTexture: { value: refs.texture },
                        uRepeat: { value: new THREE.Vector2(refs.params.repeatX, refs.params.repeatY) },
                        // The reference spins on the X axis negatively
                        uSpeed: { value: new THREE.Vector2(-refs.params.speedX, refs.params.speedY) }
                    },
                    wireframe: refs.params.wireframe
                });
                refs.material = material;

                const mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh);
                refs.mesh = mesh;

                // --- 5. GUI ---
                const gui = new GUI({ title: 'Typography Config', container: guiContainerRef.current });
                refs.gui = gui;
                gui.close();

                const triggerTextureUpdate = () => {
                    updateCanvasTexture();
                };

                const updateUniforms = () => {
                    if (refs.material) {
                        refs.material.uniforms.uRepeat.value.set(refs.params.repeatX, refs.params.repeatY);
                        refs.material.uniforms.uSpeed.value.set(refs.params.speedX, refs.params.speedY);
                        refs.material.wireframe = refs.params.wireframe;
                    }
                };

                const fText = gui.addFolder('Text Source');
                fText.add(refs.params, 'text').name('Content').onChange(triggerTextureUpdate);
                fText.add(refs.params, 'fontSize', 40, 300).name('Font Size').onChange(triggerTextureUpdate);
                fText.add(refs.params, 'fontWeight', 100, 900, 100).name('Font Weight').onChange(triggerTextureUpdate);
                fText.addColor(refs.params, 'textColor').name('Color').onChange(triggerTextureUpdate);
                fText.addColor(refs.params, 'bgColor').name('Background').onChange(triggerTextureUpdate);

                const fShader = gui.addFolder('Shader Mapping');
                fShader.add(refs.params, 'repeatX', 1, 30).name('Repeat X').onChange(updateUniforms);
                fShader.add(refs.params, 'repeatY', 1, 15).name('Repeat Y').onChange(updateUniforms);
                fShader.add(refs.params, 'speedX', -5.0, 5.0).name('Speed X').onChange(updateUniforms);
                fShader.add(refs.params, 'speedY', -5.0, 5.0).name('Speed Y').onChange(updateUniforms);
                fShader.add(refs.params, 'wireframe').name('Wireframe mode').onChange(updateUniforms);

                // --- 6. Event Listeners ---
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

                // --- 7. Render Loop ---
                const clock = new THREE.Clock();
                refs.clock = clock;

                const animate = () => {
                    refs.animationId = requestAnimationFrame(animate);

                    if (refs.clock && refs.material && refs.renderer) {
                        refs.controls.update();
                        refs.material.uniforms.uTime.value = refs.clock.getElapsedTime();
                        refs.renderer.render(refs.scene, refs.camera);
                    }
                };
                animate();

                // Store cleanup listeners to explicit unmount hook function
                refs.cleanupListeners = () => {
                    window.removeEventListener('resize', onResize);
                    resizeObserver.disconnect();
                }

            } catch (e) {
                console.error("KineticComponent Init Error:", e);
                if (active) setError(e.message);
            }
        }

        init();

        return () => {
            active = false;
            if (refs.animationId) cancelAnimationFrame(refs.animationId);
            if (refs.gui) refs.gui.destroy();
            if (refs.cleanupListeners) refs.cleanupListeners();

            // Dispose geometries and materials
            try {
                if (refs.geometry) refs.geometry.dispose();
                if (refs.material) refs.material.dispose();
                if (refs.texture) refs.texture.dispose();
                if (refs.renderer) refs.renderer.dispose();
            } catch (e) { console.error("Dispose error", e); }
        };
    }, []);

    return (
        <div style={styles.fullTabWrapper}>
            {!isLoaded && !error && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'monospace' }}>
                    Loading Shader Engine...
                </div>
            )}

            {error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', zIndex: 10, padding: '20px', textAlign: 'center' }}>
                    Error loading Component: {error}
                </div>
            )}

            <div ref={canvasContainerRef} style={styles.canvas} />
            <div ref={guiContainerRef} style={{ ...styles.guiContainer, '--background-color': '#111', '--text-color': '#eee' }} />

            {!isInception && (
                <button
                    onClick={onToggleFullTab}
                    style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, padding: '8px', background: 'rgba(50,50,50,0.6)', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                >
                    <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
                </button>
            )}

            <style>{`
                .lil-gui { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                }
            `}</style>
        </div>
    );
}

return { KineticComponent };
