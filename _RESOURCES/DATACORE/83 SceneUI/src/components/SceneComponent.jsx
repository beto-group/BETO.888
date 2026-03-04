function SceneComponent(props) {
    const { dc, loadScript, isFullTab, isInception, onToggleFullTab, styles, onCodeReloadRequest } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasContainerRef = useRef(null);
    const guiContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // --- Singleton Persistence ---
    const refs = useRef({
        scene: null, camera: null, renderer: null, stageGroup: null,
        layers: [], gui: null, animationId: null,
        THREE: null, gsap: null, GUI: null,
        CANVAS_PADDING: 150, RESOLUTION_SCALE: 3,
        mouse: { x: 0, y: 0 },
        globalShadowParams: { color: '#000000', blur: 100, opacity: 0.25, x: 5, y: 20 },
        globalRenderParams: { borderRadius: 20 },
        globalParams: {
            bgColor: '#ffffff',
            globalScale: 2.0,
            groupRotX: 0.08,
            groupRotY: -0.3,
            animDuration: 3.5,
        },
        layersConfig: [
            { type: 'bg', imageUrl: '', w: 1920, h: 1080, col: '#1e1e24', x: 0, y: 0, z: -15, s: 1.25, op: 1 },
            { type: 'sidebar', imageUrl: '', w: 300, h: 1000, col: '#25252e', x: -20, y: 0, z: -5, s: 1, op: 0.95 },
            { type: 'header', imageUrl: '', w: 1500, h: 120, col: '#25252e', x: 2, y: 8, z: 0, s: 1, op: 1 },
            { type: 'chart', imageUrl: '', w: 1000, h: 500, col: '#2a2a35', x: -2, y: 1, z: 5, s: 1, op: 1 },
            { type: 'cards', imageUrl: '', w: 400, h: 250, col: '#3a3a4a', x: 14, y: 1, z: 10, s: 1, op: 1 },
            { type: 'cards', imageUrl: '', w: 400, h: 250, col: '#3a3a4a', x: 14, y: -4.5, z: 10, s: 1, op: 1 },
            { type: 'table', imageUrl: '', w: 1000, h: 400, col: '#2a2a35', x: -2, y: -8.5, z: 5, s: 1, op: 1 },
            { type: 'circle-btn', imageUrl: '', w: 100, h: 100, col: '#007aff', x: 21, y: -6.25, z: 25, s: 1, op: 1 },
            { type: 'chart', imageUrl: '', w: 600, h: 400, col: '#15151a', x: 0, y: 0, z: 30, s: 1, op: 0.95 },
            { type: 'notification', imageUrl: '', w: 300, h: 100, col: '#ff3b30', x: 22, y: 8, z: 28, s: 0.7, op: 0.95 },
        ],
        currentLayerIndex: -1
    }).current;

    useEffect(() => {
        let active = true;

        async function init() {
            try {
                // 1. Map ESM dependencies
                let importMap = document.getElementById('three-import-map-sceneui');
                if (!importMap) {
                    importMap = document.createElement('script');
                    importMap.id = 'three-import-map-sceneui';
                    importMap.type = 'importmap';
                    importMap.textContent = JSON.stringify({
                        imports: {
                            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                            "gsap": "https://unpkg.com/gsap@3.12.5/index.js",
                            "lil-gui": "https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js"
                        }
                    });
                    document.head.appendChild(importMap);
                }

                await new Promise(r => setTimeout(r, 50));

                // 2. Load Modules
                const THREE = await loadScript(dc, 'https://unpkg.com/three@0.160.0/build/three.module.js', { type: 'module' });
                const gsapModule = await loadScript(dc, 'https://unpkg.com/gsap@3.12.5/index.js', { type: 'module' });
                const GUI = await loadScript(dc, 'https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js', { type: 'module' });

                if (!active) return;
                setIsLoaded(true);
                refs.THREE = THREE;
                refs.gsap = gsapModule.gsap || gsapModule.default || gsapModule;
                refs.GUI = GUI.default || GUI;

                const container = canvasContainerRef.current;
                if (!container) return;
                container.innerHTML = '';

                // --- 3. Scene Setup ---
                const scene = new THREE.Scene();
                scene.background = new THREE.Color(refs.globalParams.bgColor);

                const bounds = container.getBoundingClientRect();
                const aspect = bounds.width / bounds.height;
                const camera = new THREE.PerspectiveCamera(40, aspect, 1, 2000);
                camera.position.set(0, 0, 150);

                const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", alpha: true });
                renderer.setSize(bounds.width, bounds.height);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                container.appendChild(renderer.domElement);

                refs.scene = scene;
                refs.camera = camera;
                refs.renderer = renderer;

                const stageGroup = new THREE.Group();
                stageGroup.rotation.x = refs.globalParams.groupRotX;
                stageGroup.rotation.y = refs.globalParams.groupRotY;
                stageGroup.scale.set(refs.globalParams.globalScale, refs.globalParams.globalScale, refs.globalParams.globalScale);
                scene.add(stageGroup);
                refs.stageGroup = stageGroup;

                // --- 4. Logic Functions ---
                function createUIElement(config, shadowConfig, index, radius, customImageObj = null) {
                    const realW = config.w;
                    const realH = config.h;

                    const canvasW = (realW + refs.CANVAS_PADDING * 2) * refs.RESOLUTION_SCALE;
                    const canvasH = (realH + refs.CANVAS_PADDING * 2) * refs.RESOLUTION_SCALE;

                    const canvas = document.createElement('canvas');
                    canvas.width = canvasW;
                    canvas.height = canvasH;
                    const ctx = canvas.getContext('2d');

                    ctx.scale(refs.RESOLUTION_SCALE, refs.RESOLUTION_SCALE);
                    ctx.clearRect(0, 0, canvasW / refs.RESOLUTION_SCALE, canvasH / refs.RESOLUTION_SCALE);

                    const x = refs.CANVAS_PADDING;
                    const y = refs.CANVAS_PADDING;
                    const isCircle = config.type === 'circle-btn';
                    const effectiveRadius = isCircle ? realW / 2 : radius;

                    ctx.save();
                    ctx.beginPath();
                    if (isCircle) {
                        ctx.arc(x + realW / 2, y + realH / 2, effectiveRadius, 0, Math.PI * 2);
                    } else {
                        ctx.roundRect(x, y, realW, realH, effectiveRadius);
                    }

                    const r = new THREE.Color(shadowConfig.color).r * 255;
                    const g = new THREE.Color(shadowConfig.color).g * 255;
                    const b = new THREE.Color(shadowConfig.color).b * 255;

                    ctx.shadowColor = "rgba(" + r + ", " + g + ", " + b + ", " + shadowConfig.opacity + ")";
                    ctx.shadowBlur = shadowConfig.blur;
                    ctx.shadowOffsetX = shadowConfig.x;
                    ctx.shadowOffsetY = shadowConfig.y;
                    ctx.fillStyle = config.col;
                    ctx.fill();
                    ctx.restore();

                    ctx.save();
                    ctx.translate(refs.CANVAS_PADDING, refs.CANVAS_PADDING);

                    ctx.beginPath();
                    if (isCircle) {
                        ctx.arc(realW / 2, realH / 2, effectiveRadius, 0, Math.PI * 2);
                    } else {
                        ctx.roundRect(0, 0, realW, realH, effectiveRadius);
                    }
                    ctx.clip();

                    if (customImageObj) {
                        ctx.drawImage(customImageObj, 0, 0, realW, realH);
                    } else {
                        ctx.fillStyle = config.col;
                        ctx.fill();
                        ctx.fillStyle = "rgba(255,255,255,0.08)";

                        if (config.type === 'sidebar') {
                            for (let i = 0; i < 8; i++) ctx.fillRect(30, 50 + i * 70, realW - 60, 40);
                        }
                        else if (config.type === 'header') {
                            ctx.fillRect(40, 30, 300, 40);
                            ctx.beginPath(); ctx.arc(realW - 60, 50, 25, 0, Math.PI * 2); ctx.fill();
                        }
                        else if (config.type === 'chart') {
                            ctx.strokeStyle = "rgba(100, 200, 255, 0.8)";
                            ctx.lineWidth = 6;
                            ctx.beginPath();
                            ctx.moveTo(40, realH - 60);
                            for (let i = 1; i < 10; i++) ctx.lineTo(40 + i * (realW / 10), realH - 60 - Math.random() * 100);
                            ctx.stroke();
                        }
                        else if (config.type === 'cards') {
                            ctx.font = 'bold 60px Arial';
                            ctx.fillStyle = "#fff";
                            ctx.fillText("84k", 40, 90);
                            ctx.fillStyle = "#4caf50";
                            ctx.font = '30px Arial';
                            ctx.fillText("+12%", 40, 140);
                        }
                        else if (config.type === 'notification') {
                            ctx.fillStyle = "#fff";
                            ctx.font = 'bold 24px Arial';
                            ctx.fillText("Message", 20, 40);
                            ctx.fillStyle = "rgba(255,255,255,0.6)";
                            ctx.font = '18px Arial';
                            ctx.fillText("Task #420 updated", 20, 70);
                        }
                        else if (config.type === 'circle-btn') {
                            ctx.fillStyle = "#fff";
                            ctx.font = 'bold 60px Arial';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText("+", realW / 2, realH / 2 + 5);
                        }
                        else if (config.type === 'table') {
                            for (let i = 0; i < 5; i++) {
                                ctx.fillStyle = (i % 2 === 0) ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)";
                                ctx.fillRect(20, 60 + i * 50, realW - 40, 35);
                            }
                        }

                        if (index !== undefined && !isCircle) {
                            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                            ctx.font = "bold 24px Consolas, monospace";
                            ctx.fillText("#" + (index + 1), 15, 30);
                        }
                    }

                    ctx.restore();

                    const texture = new THREE.CanvasTexture(canvas);
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.anisotropy = 16;
                    texture.colorSpace = THREE.SRGBColorSpace;
                    return texture;
                }

                function updateLayerTexture(index) {
                    const layer = refs.layers[index];
                    if (!layer || !layer.mesh) return;
                    if (layer.mesh.material.map) layer.mesh.material.map.dispose();

                    const newTex = createUIElement(
                        layer.baseConfig,
                        refs.globalShadowParams,
                        layer.id,
                        refs.globalRenderParams.borderRadius,
                        layer.customImage
                    );
                    layer.mesh.material.map = newTex;
                    layer.mesh.material.needsUpdate = true;
                }

                function updateAllTextures() {
                    refs.layers.forEach((layer, i) => updateLayerTexture(i));
                }

                function updateLayerGeometryWithImage(index, img) {
                    const layer = refs.layers[index];
                    if (!layer) return;

                    const aspect = img.width / img.height;
                    const baseWidth = 30; // Standard unit width in 3D
                    const newHeight = baseWidth / aspect;

                    layer.baseConfig.w = baseWidth * 50;
                    layer.baseConfig.h = newHeight * 50;

                    if (layer.mesh.geometry) layer.mesh.geometry.dispose();
                    layer.mesh.geometry = new THREE.PlaneGeometry(
                        (layer.baseConfig.w + refs.CANVAS_PADDING * 2) / 50,
                        (layer.baseConfig.h + refs.CANVAS_PADDING * 2) / 50
                    );

                    layer.customImage = img;
                    updateLayerTexture(index);
                    layer.mesh.material.color.setHex(0xffffff);
                }
                refs.updateLayerGeometryWithImage = updateLayerGeometryWithImage;

                function playAnimation(force = false) {
                    if (!refs.gsap || !active) return;
                    const duration = refs.globalParams.animDuration;

                    refs.layers.forEach((layer, i) => {
                        const mesh = layer.mesh;
                        const target = layer.config;

                        if (force) {
                            refs.gsap.killTweensOf(mesh.position);
                            refs.gsap.killTweensOf(mesh.rotation);
                            refs.gsap.killTweensOf(mesh.scale);
                            refs.gsap.killTweensOf(mesh.material);
                        }

                        mesh.material.opacity = 0;
                        mesh.scale.set(0, 0, 0);

                        const startZ = target.z + 1;
                        const startX = (Math.random() - 0.5) * 400;
                        const startY = (Math.random() - 0.5) * 300;

                        refs.gsap.fromTo(mesh.position,
                            { x: startX, y: startY, z: startZ },
                            { x: target.x, y: target.y, z: target.z, duration: duration, ease: "power3.out", delay: i * 0.05 }
                        );

                        refs.gsap.fromTo(mesh.rotation,
                            { x: (Math.random() - 0.5) * Math.PI, y: Math.random() * Math.PI * 6, z: (Math.random() - 0.5) * Math.PI * 0.5 },
                            { x: 0, y: 0, z: 0, duration: duration * 1.2, ease: "elastic.out(1, 0.6)" }
                        );

                        refs.gsap.to(mesh.scale, {
                            x: target.scale, y: target.scale, z: target.scale,
                            duration: duration * 0.8, ease: "back.out(1.2)", delay: i * 0.05
                        });

                        refs.gsap.to(mesh.material, {
                            opacity: target.opacity,
                            duration: duration * 0.5,
                            delay: i * 0.05
                        });
                    });
                }

                // --- 5. Generate Initial Layers ---
                refs.layersConfig.forEach((conf, i) => {
                    const geoW = (conf.w + refs.CANVAS_PADDING * 2) / 50;
                    const geoH = (conf.h + refs.CANVAS_PADDING * 2) / 50;
                    const geometry = new THREE.PlaneGeometry(geoW, geoH);

                    const texture = createUIElement(conf, refs.globalShadowParams, i, refs.globalRenderParams.borderRadius, null);

                    const material = new THREE.MeshBasicMaterial({
                        map: texture,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: conf.op,
                        depthTest: true,
                        depthWrite: false
                    });

                    const mesh = new THREE.Mesh(geometry, material);
                    refs.stageGroup.add(mesh);

                    const layerObj = {
                        id: i,
                        mesh: mesh,
                        baseConfig: conf,
                        customImage: null,
                        config: { x: conf.x, y: conf.y, z: conf.z, scale: conf.s, opacity: conf.op }
                    };
                    refs.layers.push(layerObj);

                    if (conf.imageUrl && conf.imageUrl.trim() !== '') {
                        const img = new Image();
                        img.crossOrigin = "Anonymous";
                        img.onload = () => {
                            if (active) updateLayerGeometryWithImage(i, img);
                        };
                        img.src = conf.imageUrl;
                    }
                });

                playAnimation(false);

                // --- 6. Controls (Lil-GUI) ---
                const gui = new refs.GUI({ title: 'Scene Config', container: guiContainerRef.current });
                refs.gui = gui;
                gui.close(); // Collapse root

                const sceneFolder = gui.addFolder('Global Scene');
                sceneFolder.addColor(refs.globalParams, 'bgColor').name('Background').onChange(v => scene.background.set(v));
                sceneFolder.add(refs.globalParams, 'globalScale', 0.1, 4).name('Scale').onChange(v => refs.stageGroup.scale.set(v, v, v));
                sceneFolder.add(refs.globalParams, 'animDuration', 0.5, 10).name('Anim Time (s)');
                sceneFolder.add(refs.globalParams, 'groupRotX', -1, 1).name('Tilt X'); // Mouse loop overrides this if not careful, but we merge logic in loop
                sceneFolder.add(refs.globalParams, 'groupRotY', -1, 1).name('Tilt Y');
                sceneFolder.add(refs.globalRenderParams, 'borderRadius', 0, 100).name('Border Radius').onChange(updateAllTextures);
                sceneFolder.add({ explode: () => playAnimation(true) }, 'explode').name('▶ REPLAY ANIMATION');
                sceneFolder.close();

                const shadowFolder = gui.addFolder('Shadows');
                shadowFolder.addColor(refs.globalShadowParams, 'color').name('Color').onChange(updateAllTextures);
                shadowFolder.add(refs.globalShadowParams, 'blur', 0, 120).name('Blur Size').onChange(updateAllTextures);
                shadowFolder.add(refs.globalShadowParams, 'opacity', 0, 1).name('Intensity').onChange(updateAllTextures);
                shadowFolder.add(refs.globalShadowParams, 'x', -100, 100).name('Offset X').onChange(updateAllTextures);
                shadowFolder.add(refs.globalShadowParams, 'y', -100, 100).name('Offset Y').onChange(updateAllTextures);
                shadowFolder.close();

                refs.layers.forEach((layer, i) => {
                    const folder = gui.addFolder("Layer " + (i + 1));
                    const lParams = {
                        upload: () => { refs.currentLayerIndex = i; fileInputRef.current?.click(); },
                        x: layer.config.x, y: layer.config.y, z: layer.config.z,
                        scale: layer.config.scale, opacity: layer.config.opacity
                    };
                    folder.add(lParams, 'upload').name('📂 Upload Image');
                    folder.add(lParams, 'x', -50, 50).onChange(v => { layer.mesh.position.x = v; layer.config.x = v; });
                    folder.add(lParams, 'y', -30, 30).onChange(v => { layer.mesh.position.y = v; layer.config.y = v; });
                    folder.add(lParams, 'z', -40, 40).onChange(v => { layer.mesh.position.z = v; layer.config.z = v; });
                    folder.add(lParams, 'scale', 0, 5).name('Size').onChange(v => { layer.mesh.scale.set(v, v, v); layer.config.scale = v; });
                    folder.add(lParams, 'opacity', 0, 1).onChange(v => { layer.mesh.material.opacity = v; layer.config.opacity = v; });
                    folder.close();
                });

                // --- 7. Event Listeners ---
                const onMouseMove = (ev) => {
                    refs.mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
                    refs.mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
                };
                window.addEventListener('mousemove', onMouseMove);

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
                const animate = () => {
                    refs.animationId = requestAnimationFrame(animate);

                    const parallaxX = refs.globalParams.groupRotX + (refs.mouse.y * 0.03);
                    const parallaxY = refs.globalParams.groupRotY + (refs.mouse.x * 0.03);

                    if (refs.stageGroup) {
                        refs.stageGroup.rotation.x += (parallaxX - refs.stageGroup.rotation.x) * 0.05;
                        refs.stageGroup.rotation.y += (parallaxY - refs.stageGroup.rotation.y) * 0.05;
                    }

                    if (refs.renderer && refs.scene && refs.camera) {
                        refs.renderer.render(refs.scene, refs.camera);
                    }
                };
                animate();

                // Store cleanup listeners to explicit unmount hook function
                refs.cleanupListeners = () => {
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('resize', onResize);
                    resizeObserver.disconnect();
                }

            } catch (e) {
                console.error("SceneComponent Init Error:", e);
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
                if (refs.gsap) {
                    refs.layers.forEach(l => {
                        refs.gsap.killTweensOf(l.mesh.position);
                        refs.gsap.killTweensOf(l.mesh.rotation);
                        refs.gsap.killTweensOf(l.mesh.scale);
                        refs.gsap.killTweensOf(l.mesh.material);
                    });
                }
                refs.layers.forEach(l => {
                    if (l.mesh) {
                        if (l.mesh.geometry) l.mesh.geometry.dispose();
                        if (l.mesh.material) {
                            if (l.mesh.material.map) l.mesh.material.map.dispose();
                            l.mesh.material.dispose();
                        }
                    }
                });
                if (refs.renderer) refs.renderer.dispose();
            } catch (e) { console.error("Dispose error", e); }
        };
    }, []);

    // --- File Input Handler ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file && refs.currentLayerIndex >= 0 && refs.updateLayerGeometryWithImage) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    refs.updateLayerGeometryWithImage(refs.currentLayerIndex, img);
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    return (
        <div style={styles.fullTabWrapper}>
            <input ref={fileInputRef} type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleFileUpload} />

            {!isLoaded && !error && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'monospace' }}>
                    Loading ThreeJS, GSAP, and Lil-GUI...
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
                <button
                    onClick={onToggleFullTab}
                    style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, padding: '8px', background: 'rgba(0,0,0,0.6)', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                >
                    <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
                </button>
            )}

            <style>{`
                        .lil - gui {
                        font - family: -apple - system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans - serif;
                    }
                    `}</style>
        </div>
    );
}

return { SceneComponent };
