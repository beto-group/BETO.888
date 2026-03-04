function CubesComponent(props) {
    const { dc, loadScript, isFullTab, onToggleFullTab, styles, domUtils } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasContainerRef = useRef(null);
    const guiContainerRef = useRef(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    const refs = useRef({
        scene: null, camera: null, renderer: null, controls: null,
        animationId: null, gui: null, clock: null, THREE: null,
        pointer: null, raycaster: null,
        cubes: [], oPositions: [],
        params: {
            bgColor: '#151520',
            gap: 0.2,
            stride: 5,
            displacement: 3,
            intensity: 1.5,
            easeSpeed: 0.1
        }
    }).current;

    useEffect(() => {
        let active = true;

        async function init() {
            try {
                // 1. Support for Hot-Reload Import Map
                let importMap = document.getElementById('three-import-map-template');
                if (!importMap) {
                    importMap = document.createElement('script');
                    importMap.id = 'three-import-map-template';
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
                await new Promise(r => setTimeout(r, 50));

                // 2. Load Visual Libraries
                const THREE = await loadScript(dc, 'https://unpkg.com/three@0.160.0/build/three.module.js', { type: 'module' });
                const orbitModule = await loadScript(dc, 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js', { type: 'module' });
                const OrbitControls = orbitModule.OrbitControls || orbitModule.default?.OrbitControls || orbitModule.default;
                const guiModule = await loadScript(dc, 'https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js', { type: 'module' });
                const GUI = guiModule.GUI || guiModule.default?.GUI || guiModule.default;

                if (!active) return;
                refs.THREE = THREE;
                refs.pointer = new THREE.Vector2();
                refs.raycaster = new THREE.Raycaster();

                // 3. Initialize Render Engine
                const container = canvasContainerRef.current;
                container.innerHTML = '';

                let width = container.clientWidth;
                let height = container.clientHeight;

                if (width === 0 || height === 0) {
                    await new Promise(r => setTimeout(r, 500));
                    width = container.clientWidth || 800;
                    height = container.clientHeight || 600;
                }

                const scene = new THREE.Scene();
                scene.background = new THREE.Color(refs.params.bgColor);
                refs.scene = scene;

                const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
                camera.position.set(12, 12, 12);
                refs.camera = camera;

                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setSize(width, height);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                container.appendChild(renderer.domElement);
                refs.renderer = renderer;

                const controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                refs.controls = controls;

                scene.add(new THREE.AmbientLight(0xffffff, 0.5));
                const pointLight = new THREE.PointLight(0x8b5cf6, 200, 100);
                pointLight.position.set(10, 10, 10);
                scene.add(pointLight);

                // Grid Logic
                const buildGrid = () => {
                    refs.cubes.forEach(c => {
                        scene.remove(c);
                        c.geometry.dispose();
                        c.material.dispose();
                    });
                    refs.cubes = [];
                    refs.oPositions = [];

                    const { stride, gap } = refs.params;
                    const size = 0.8;
                    const geometry = new THREE.BoxGeometry(size, size, size);
                    const centerOffset = (stride - 1) * (1 + gap) / 2;

                    for (let x = 0; x < stride; x++) {
                        for (let y = 0; y < stride; y++) {
                            for (let z = 0; z < stride; z++) {
                                const material = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.2 });
                                const cube = new THREE.Mesh(geometry, material);
                                const posX = x * (1 + gap) - centerOffset;
                                const posY = y * (1 + gap) - centerOffset;
                                const posZ = z * (1 + gap) - centerOffset;
                                cube.position.set(posX, posY, posZ);
                                scene.add(cube);
                                refs.cubes.push(cube);
                                refs.oPositions.push(new THREE.Vector3(posX, posY, posZ));
                            }
                        }
                    }
                };
                buildGrid();

                // 4. GUI Integration
                if (GUI) {
                    const gui = new GUI({ title: 'CubesHover Controls', container: guiContainerRef.current });
                    refs.gui = gui;
                    const gridFolder = gui.addFolder('Grid Settings');
                    gridFolder.add(refs.params, 'stride', 2, 8, 1).name('Grid Size').onChange(buildGrid);
                    gridFolder.add(refs.params, 'gap', 0, 1).name('Gap').onChange(buildGrid);
                    gridFolder.add(refs.params, 'easeSpeed', 0.01, 0.5).name('Smoothing');
                    const physFolder = gui.addFolder('Physics');
                    physFolder.add(refs.params, 'displacement', 1, 10).name('Repulsion Radius');
                    physFolder.add(refs.params, 'intensity', 0.1, 5).name('Repulsion Strength');
                    gui.addColor(refs.params, 'bgColor').name('Background').onChange(c => scene.background.set(c));
                    gui.close();
                }

                const onMouseMove = (e) => {
                    const rect = container.getBoundingClientRect();
                    refs.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    refs.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                };
                container.addEventListener('mousemove', onMouseMove);

                const onResize = () => {
                    if (!container) return;
                    const w = container.clientWidth;
                    const h = container.clientHeight;
                    if (w === 0 || h === 0) return;
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                    renderer.setSize(w, h);
                };
                window.addEventListener('resize', onResize);

                // 5. Physics Simulation Loop
                refs.clock = new THREE.Clock();
                const tempVec = new THREE.Vector3();
                const mouseWorldPos = new THREE.Vector3();

                const animate = () => {
                    if (!active) return;
                    refs.animationId = requestAnimationFrame(animate);
                    if (refs.controls) refs.controls.update();

                    refs.raycaster.setFromCamera(refs.pointer, camera);
                    const distance = camera.position.length();
                    mouseWorldPos.copy(camera.position).add(refs.raycaster.ray.direction.clone().multiplyScalar(distance));

                    for (let i = 0; i < refs.cubes.length; i++) {
                        const cube = refs.cubes[i];
                        const origin = refs.oPositions[i];
                        tempVec.copy(origin).sub(mouseWorldPos);
                        const dist = origin.distanceTo(mouseWorldPos);
                        const targetPos = new THREE.Vector3().copy(origin);
                        if (dist < refs.params.displacement) {
                            const force = (refs.params.displacement - dist) / refs.params.displacement;
                            targetPos.add(tempVec.normalize().multiplyScalar(force * refs.params.intensity));
                            cube.material.color.lerp(new THREE.Color(0x8b5cf6), refs.params.easeSpeed);
                        } else {
                            cube.material.color.lerp(new THREE.Color(0xffffff), refs.params.easeSpeed);
                        }
                        cube.position.lerp(targetPos, refs.params.easeSpeed);
                        cube.rotation.x += 0.01;
                        cube.rotation.y += 0.01;
                    }
                    renderer.render(scene, camera);
                };
                animate();
                setIsLoaded(true);

            } catch (e) {
                if (active) setError(e.message);
                console.error("CubesComponent Error:", e);
            }
        }

        init();

        return () => {
            active = false;
            if (refs.animationId) cancelAnimationFrame(refs.animationId);
            if (refs.gui) refs.gui.destroy();
            try {
                if (refs.renderer) {
                    refs.renderer.dispose();
                    if (refs.renderer.domElement?.parentNode) refs.renderer.domElement.parentNode.removeChild(refs.renderer.domElement);
                }
                refs.cubes.forEach(c => { c.geometry.dispose(); c.material.dispose(); });
            } catch (e) { }
            window.removeEventListener('resize', () => { });
        };
    }, []);

    return (
        <div style={styles.fullTabWrapper}>
            {!isLoaded && !error && (
                <div style={{ color: "white", padding: "20px", height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                    Initializing Cubes Experience...
                </div>
            )}
            {error && <div style={{ color: "red", padding: "20px", zIndex: 1000, position: 'relative' }}>Error: {error}</div>}

            <div ref={canvasContainerRef} style={styles.canvas} />
            <div ref={guiContainerRef} style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 100 }} />

            <div style={styles.overlay}>
                <button onClick={onToggleFullTab} style={styles.button} title={isFullTab ? "Exit Fullscreen" : "Fullscreen"}>
                    <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
                </button>
            </div>
        </div>
    );
}

return { CubesComponent };
