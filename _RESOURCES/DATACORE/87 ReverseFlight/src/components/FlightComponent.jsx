function FlightComponent(props) {
    const { dc, loadScript, isFullTab, isInception, onToggleFullTab, styles, onCodeReloadRequest } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasContainerRef = useRef(null);
    const guiContainerRef = useRef(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // --- Singleton Persistence ---
    const refs = useRef({
        scene: null, camera: null, renderer: null,
        planeLine: null, planeMesh: null, gui: null, animationId: null, clock: null, geometry: null, material: null,
        dirLight: null, hemiLight: null, spotLight: null,
        THREE: null,
        GUI: null,
        // --- Custom Perlin Noise Function Port ---
        Noise: (function () {
            var p = new Uint8Array(512);
            var permutation = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
            for (var i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i];
            var fade = function (t) { return t * t * t * (t * (t * 6 - 15) + 10); };
            var lerp = function (t, a, b) { return a + t * (b - a); };
            var grad = function (hash, x, y, z) {
                var h = hash & 15; var u = h < 8 ? x : y, v = h < 4 ? y : h == 12 || h == 14 ? x : z;
                return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
            };
            return {
                perlin3: function (x, y, z) {
                    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
                    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
                    var u = fade(x), v = fade(y), w = fade(z);
                    var A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z, B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
                    return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)), lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))), lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)), lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))));
                }
            };
        })(),
        params: {
            flyMode: true,
            flySpeed: 10.0,
            stopWaveAnimation: false,
            waveSpeed: 0.2,
            surfaceColor: 0x111111,
            fogColor: 0x999999,
            roughness: 0.15,
            metalness: 0.9,
            wireframe: false,
            spotLightColor: 0xffffff,
            spotIntensity: 600,
            height: 9.0,
            scaleX: 0.02,
            scaleY: 0.03,
            detailHeight: 2.0,
            detailScale: 0.08,
            camHeight: 12,
            camDist: 35,
            fov: 60
        },
        waveTimeAccumulator: 0,
        flightOffsetAccumulator: 0
    }).current;

    useEffect(() => {
        let active = true;

        async function init() {
            try {
                // 1. Map ESM dependencies
                let importMap = document.getElementById('three-import-map-flight');
                if (!importMap) {
                    importMap = document.createElement('script');
                    importMap.id = 'three-import-map-flight';
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
                const { GUI } = await loadScript(dc, 'https://unpkg.com/three@0.160.0/examples/jsm/libs/lil-gui.module.min.js', { type: 'module' });

                if (!active) return;
                setIsLoaded(true);
                refs.THREE = THREE;
                refs.GUI = GUI;

                const container = canvasContainerRef.current;
                if (!container) return;
                container.innerHTML = '';

                // --- 3. Scene Setup ---
                const scene = new THREE.Scene();
                scene.background = new THREE.Color(refs.params.fogColor);
                scene.fog = new THREE.FogExp2(refs.params.fogColor, 0.015);
                refs.scene = scene;

                const bounds = container.getBoundingClientRect();
                const aspect = bounds.width / bounds.height;
                const camera = new THREE.PerspectiveCamera(refs.params.fov, aspect, 0.1, 1000);
                camera.position.set(0, refs.params.camHeight, refs.params.camDist);
                camera.lookAt(0, 0, -10);
                refs.camera = camera;

                const renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(bounds.width, bounds.height);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                container.appendChild(renderer.domElement);
                refs.renderer = renderer;

                // --- 4. Lights ---
                const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 0.4);
                scene.add(hemiLight);
                refs.hemiLight = hemiLight;

                const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
                dirLight.position.set(-50, 30, -20);
                dirLight.castShadow = true;
                dirLight.shadow.mapSize.set(2048, 2048);
                dirLight.shadow.camera.left = -100; dirLight.shadow.camera.right = 100;
                dirLight.shadow.camera.top = 100; dirLight.shadow.camera.bottom = -100;
                scene.add(dirLight);
                refs.dirLight = dirLight;

                const spotLight = new THREE.SpotLight(refs.params.spotLightColor, refs.params.spotIntensity);
                spotLight.position.set(0, 40, 10);
                spotLight.angle = Math.PI / 5;
                spotLight.penumbra = 0.4;
                spotLight.decay = 1.5;
                spotLight.distance = 150;
                spotLight.castShadow = true;
                spotLight.target.position.set(0, 0, -20);
                scene.add(spotLight);
                scene.add(spotLight.target);
                refs.spotLight = spotLight;

                // --- 5. Terrain Mesh ---
                const geometry = new THREE.PlaneGeometry(200, 200, 400, 400);
                const material = new THREE.MeshStandardMaterial({
                    color: refs.params.surfaceColor,
                    roughness: refs.params.roughness,
                    metalness: refs.params.metalness,
                    wireframe: refs.params.wireframe,
                    side: THREE.DoubleSide
                });
                const plane = new THREE.Mesh(geometry, material);
                plane.rotation.x = -Math.PI / 2;
                plane.receiveShadow = true;
                scene.add(plane);

                refs.geometry = geometry;
                refs.material = material;
                refs.planeMesh = plane;

                // --- 6. GUI ---
                const gui = new GUI({ title: 'System Engine', container: guiContainerRef.current });
                refs.gui = gui;
                gui.close();

                const updateCamera = () => {
                    camera.position.set(0, refs.params.camHeight, refs.params.camDist);
                    camera.lookAt(0, 0, -10);
                };

                const folderFlight = gui.addFolder('Flight & Animation');
                folderFlight.add(refs.params, 'flyMode').name('✈️ Fly Mode (Reverse)');
                folderFlight.add(refs.params, 'flySpeed', 0, 150).name('Fly Speed');
                folderFlight.add(refs.params, 'stopWaveAnimation').name('Stop Wave Morph');
                folderFlight.add(refs.params, 'waveSpeed', 0, 1.0).name('Wave Morph Speed');

                const folderGeo = gui.addFolder('Terrain Detail');
                folderGeo.add(refs.params, 'height', 0, 20).name('Main Wave Height');
                folderGeo.add(refs.params, 'scaleX', 0.001, 0.1).name('Wave Scale X');
                folderGeo.add(refs.params, 'scaleY', 0.001, 0.1).name('Wave Scale Y');
                folderGeo.add(refs.params, 'detailHeight', 0, 10).name('Detail Height');
                folderGeo.add(refs.params, 'detailScale', 0.01, 0.5).name('Detail Scale');

                const folderVis = gui.addFolder('Appearance');
                folderVis.addColor(refs.params, 'surfaceColor').name('Surface Color').onChange(v => material.color.setHex(v));
                folderVis.addColor(refs.params, 'fogColor').name('Fog Color').onChange(v => {
                    scene.background.setHex(v);
                    scene.fog.color.setHex(v);
                });
                folderVis.addColor(refs.params, 'spotLightColor').name('Light Color').onChange(v => spotLight.color.setHex(v));
                folderVis.add(refs.params, 'roughness', 0, 1).onChange(v => material.roughness = v);
                folderVis.add(refs.params, 'metalness', 0, 1).onChange(v => material.metalness = v);
                folderVis.add(refs.params, 'wireframe').onChange(v => material.wireframe = v);

                const folderCam = gui.addFolder('Camera Controls');
                folderCam.add(refs.params, 'camHeight', 1, 50).onChange(updateCamera);
                folderCam.add(refs.params, 'camDist', 10, 100).onChange(updateCamera);
                folderCam.add(refs.params, 'fov', 20, 120).onChange(() => {
                    camera.fov = refs.params.fov;
                    camera.updateProjectionMatrix();
                });

                folderVis.close();
                folderCam.close();

                // --- 7. Event Listeners ---
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

                // --- 8. Render Loop ---
                const clock = new THREE.Clock();
                refs.clock = clock;

                const animate = () => {
                    refs.animationId = requestAnimationFrame(animate);

                    if (refs.clock && refs.geometry && refs.renderer) {
                        const delta = refs.clock.getDelta();

                        if (!refs.params.stopWaveAnimation) {
                            refs.waveTimeAccumulator += delta * refs.params.waveSpeed;
                        }

                        if (refs.params.flyMode) {
                            refs.flightOffsetAccumulator += delta * refs.params.flySpeed;
                        }

                        const pos = refs.geometry.attributes.position;

                        for (let i = 0; i < pos.count; i++) {
                            const x = pos.getX(i);
                            const y = pos.getY(i);
                            const noiseY = y + refs.flightOffsetAccumulator;

                            let z = 0;
                            // Layer 1: Waves
                            z += refs.Noise.perlin3(x * refs.params.scaleX, noiseY * refs.params.scaleY, refs.waveTimeAccumulator) * refs.params.height;
                            // Layer 2: Details 
                            z += refs.Noise.perlin3(x * refs.params.detailScale, noiseY * refs.params.detailScale, refs.waveTimeAccumulator * 0.5 + 10) * refs.params.detailHeight;

                            // Edge fading vignette
                            const dist = Math.sqrt(x * x + y * y);
                            const radius = 90;
                            const edgeFactor = Math.max(0, (radius - dist) / radius);
                            const smoothEdge = edgeFactor * edgeFactor * (3 - 2 * edgeFactor);

                            pos.setZ(i, z * smoothEdge);
                        }

                        pos.needsUpdate = true;
                        refs.geometry.computeVertexNormals();
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
                console.error("FlightComponent Init Error:", e);
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
                if (refs.dirLight) refs.scene.remove(refs.dirLight);
                if (refs.spotLight) refs.scene.remove(refs.spotLight);
                if (refs.hemiLight) refs.scene.remove(refs.hemiLight);
                if (refs.renderer) refs.renderer.dispose();
            } catch (e) { console.error("Dispose error", e); }
        };
    }, []);

    return (
        <div style={styles.fullTabWrapper}>
            {!isLoaded && !error && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'monospace' }}>
                    Loading Flight Engine...
                </div>
            )}

            {error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', zIndex: 10, padding: '20px', textAlign: 'center' }}>
                    Error loading Component: {error}
                </div>
            )}

            <div ref={canvasContainerRef} style={styles.canvas} />
            <div ref={guiContainerRef} style={{ ...styles.guiContainer, '--background-color': '#1a1a1a', '--text-color': '#eee' }} />

            {!isInception && (
                <button
                    onClick={onToggleFullTab}
                    style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, padding: '8px', background: 'rgba(0,0,0,0.6)', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
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

return { FlightComponent };
