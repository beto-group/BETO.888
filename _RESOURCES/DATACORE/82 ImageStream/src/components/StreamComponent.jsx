function StreamComponent(props) {
    const { dc, loadScript, isFullTab, isInception, onToggleFullTab, styles, onCodeReloadRequest } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasContainerRef = useRef(null);
    const guiContainerRef = useRef(null);

    // Native file input refs
    const logoInputRef = useRef(null);
    const leftInputRef = useRef(null);
    const rightInputRef = useRef(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [loadingMsg, setLoadingMsg] = useState("Loading Assets...");

    // Ref bank for all THREE object persistence across React re-renders
    const refs = useRef({
        scene: null, camera: null, renderer: null,
        centerGroup: null, logoMesh: null, logoTexture: null,
        meshes: [], particles: [], dummy: null,
        leftAssets: [], rightAssets: [],
        animationId: null, gui: null, clock: null, THREE: null,
        vertexShader: '', fragmentShaderCombined: '',
        defaultUrls: [
            'https://picsum.photos/id/10/300/200',
            'https://picsum.photos/id/12/200/300',
            'https://picsum.photos/id/17/200/200',
            'https://picsum.photos/id/28/400/250',
            'https://picsum.photos/id/42/200/280'
        ],
        params: {
            backgroundColor: '#050505',
            quantity: 500,
            speed: 0.8,
            spreadEdge: 10.0,
            spreadCenter: 0.17,
            curvePower: 1.5,
            deformation: 0.38,
            baseSize: 1.0,
            minScale: 0.18,
            borderRadius: 0.1,
            logoSize: 1.5,
            grayLeft: true,
        },
        STREAM_LENGTH: 40.0,
        SCREEN_EDGE_X: 16
    }).current;

    // Core THREE Init
    useEffect(() => {
        let active = true;

        async function initThree() {
            try {
                // 1. Map ESM dependencies
                let importMap = document.getElementById('three-import-map-stream');
                if (!importMap) {
                    importMap = document.createElement('script');
                    importMap.id = 'three-import-map-stream';
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

                // 2. Load Modules
                const THREE = await loadScript(dc, 'https://unpkg.com/three@0.160.0/build/three.module.js', { type: 'module' });
                const GUI = await loadScript(dc, 'https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js', { type: 'module' });

                if (!active) return;
                setIsLoaded(true);
                refs.THREE = THREE;

                const container = canvasContainerRef.current;
                if (!container) return;
                container.innerHTML = '';

                // --- 3. Shaders ---
                refs.vertexShader = `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
                    }
                `;

                refs.fragmentShaderCombined = `
                    varying vec2 vUv;
                    uniform sampler2D map;
                    uniform float uGray;
                    uniform float uRadius;
                    uniform float uAspect;
                    
                    float sdRoundedBox(vec2 p, vec2 b, float r) {
                        vec2 q = abs(p) - b + r;
                        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
                    }

                    void main() {
                        vec4 color = texture2D(map, vUv);
                        
                        float grayVal = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                        vec3 finalColor = mix(color.rgb, vec3(grayVal), uGray);
                        
                        vec2 centered = vUv - 0.5;
                        centered.x *= uAspect;
                        vec2 halfSize = vec2(0.5 * uAspect, 0.5);
                        float r = clamp(uRadius, 0.0, 0.5);
                        float d = sdRoundedBox(centered, halfSize, r);
                        float alpha = 1.0 - smoothstep(0.0, 0.02, d);
                        
                        gl_FragColor = vec4(finalColor, color.a * alpha);
                        if (gl_FragColor.a < 0.01) discard;
                    }
                `;


                // --- 4. Scene & Renderer ---
                const scene = new THREE.Scene();
                scene.background = new THREE.Color(refs.params.backgroundColor);

                const bounds = container.getBoundingClientRect();
                const aspect = bounds.width / bounds.height;
                const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
                camera.position.set(0, 0, 14);

                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setSize(bounds.width, bounds.height);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                container.appendChild(renderer.domElement);

                refs.scene = scene;
                refs.camera = camera;
                refs.renderer = renderer;
                refs.clock = new THREE.Clock();
                refs.dummy = new THREE.Object3D();

                // --- 5. Logo Center ---
                const centerGroup = new THREE.Group();
                centerGroup.position.z = 2.0;
                scene.add(centerGroup);
                refs.centerGroup = centerGroup;

                const defaultLogoSvg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0id2hpdGUiIC8+Cjwvc3ZnPg==";
                new THREE.TextureLoader().load(defaultLogoSvg, (tex) => {
                    if (!active) return;
                    tex.colorSpace = THREE.SRGBColorSpace;
                    refs.logoTexture = tex;
                    updateCenterUI();
                });


                function updateCenterUI() {
                    if (refs.logoMesh) {
                        refs.centerGroup.remove(refs.logoMesh);
                        if (refs.logoMesh.geometry) refs.logoMesh.geometry.dispose();
                        if (refs.logoMesh.material) refs.logoMesh.material.dispose();
                        refs.logoMesh = null;
                    }

                    if (!refs.logoTexture || !refs.logoTexture.image) return;

                    const img = refs.logoTexture.image;
                    const aspect = img.width / img.height;
                    const geo = new THREE.PlaneGeometry(1.0 * aspect, 1.0);

                    const mat = new THREE.MeshBasicMaterial({
                        map: refs.logoTexture,
                        transparent: true,
                        side: THREE.DoubleSide,
                        color: 0xffffff
                    });

                    refs.logoMesh = new THREE.Mesh(geo, mat);
                    refs.centerGroup.add(refs.logoMesh);
                    refs.centerGroup.scale.set(refs.params.logoSize, refs.params.logoSize, 1);
                }
                refs.updateCenterUI = updateCenterUI;


                // --- 6. Helper Flow ---
                const loadTextureNode = (url) => {
                    return new Promise((resolve) => {
                        const loader = new THREE.TextureLoader();
                        loader.load(url, (tex) => {
                            const img = tex.image;
                            const assetAspect = img.width / img.height;
                            resolve({ texture: tex, aspect: assetAspect });
                        }, undefined, () => resolve(null));
                    });
                };

                const initStreamParticles = () => {
                    refs.meshes.forEach(mObj => {
                        if (mObj.mesh) {
                            refs.scene.remove(mObj.mesh);
                            if (mObj.mesh.geometry) mObj.mesh.geometry.dispose();
                            if (mObj.mesh.material) mObj.mesh.material.dispose();
                        }
                    });
                    refs.meshes = [];
                    refs.particles = [];

                    const totalQ = Math.floor(refs.params.quantity);
                    const countLeft = Math.floor(totalQ / 2);
                    const countRight = totalQ - countLeft;

                    if (refs.leftAssets.length > 0 && countLeft > 0) {
                        const spacing = refs.STREAM_LENGTH / countLeft;
                        const baseCountPerAsset = Math.ceil(countLeft / refs.leftAssets.length);

                        refs.leftAssets.forEach((asset, assetIndex) => {
                            const geo = new THREE.PlaneGeometry(1.0 * asset.aspect, 1.0);
                            const mat = new THREE.ShaderMaterial({
                                uniforms: {
                                    map: { value: asset.texture },
                                    uGray: { value: refs.params.grayLeft ? 1.0 : 0.0 },
                                    uRadius: { value: refs.params.borderRadius },
                                    uAspect: { value: asset.aspect }
                                },
                                vertexShader: refs.vertexShader,
                                fragmentShader: refs.fragmentShaderCombined,
                                side: THREE.DoubleSide,
                                transparent: true
                            });

                            const mesh = new THREE.InstancedMesh(geo, mat, baseCountPerAsset);
                            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                            refs.scene.add(mesh);
                            refs.meshes.push({ mesh: mesh, assetIndex: assetIndex, side: 'left' });
                        });

                        for (let i = 0; i < countLeft; i++) {
                            const assetIndex = i % refs.leftAssets.length;
                            const meshObj = refs.meshes.find(m => m.side === 'left' && m.assetIndex === assetIndex);
                            const instanceId = refs.particles.filter(p => p.mesh === meshObj.mesh).length;

                            if (instanceId < meshObj.mesh.count) {
                                refs.particles.push({
                                    mesh: meshObj.mesh,
                                    instanceId: instanceId,
                                    side: 'left',
                                    x: - (i * spacing),
                                    yFactor: (Math.random() - 0.5) * 2,
                                    zOffset: (Math.random() - 0.5) * 4,
                                    speedVar: 0.9 + Math.random() * 0.2,
                                    maxDist: refs.STREAM_LENGTH
                                });
                            }
                        }
                    }

                    if (refs.rightAssets.length > 0 && countRight > 0) {
                        const spacing = refs.STREAM_LENGTH / countRight;
                        const baseCountPerAsset = Math.ceil(countRight / refs.rightAssets.length);

                        refs.rightAssets.forEach((asset, assetIndex) => {
                            const geo = new THREE.PlaneGeometry(1.0 * asset.aspect, 1.0);
                            const mat = new THREE.ShaderMaterial({
                                uniforms: {
                                    map: { value: asset.texture },
                                    uGray: { value: 0.0 },
                                    uRadius: { value: refs.params.borderRadius },
                                    uAspect: { value: asset.aspect }
                                },
                                vertexShader: refs.vertexShader,
                                fragmentShader: refs.fragmentShaderCombined,
                                side: THREE.DoubleSide,
                                transparent: true
                            });

                            const mesh = new THREE.InstancedMesh(geo, mat, baseCountPerAsset);
                            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                            refs.scene.add(mesh);
                            refs.meshes.push({ mesh: mesh, assetIndex: assetIndex, side: 'right' });
                        });

                        for (let i = 0; i < countRight; i++) {
                            const assetIndex = i % refs.rightAssets.length;
                            const meshObj = refs.meshes.find(m => m.side === 'right' && m.assetIndex === assetIndex);
                            const instanceId = refs.particles.filter(p => p.mesh === meshObj.mesh).length;

                            if (instanceId < meshObj.mesh.count) {
                                refs.particles.push({
                                    mesh: meshObj.mesh,
                                    instanceId: instanceId,
                                    side: 'right',
                                    x: (i * spacing),
                                    yFactor: (Math.random() - 0.5) * 2,
                                    zOffset: (Math.random() - 0.5) * 4,
                                    speedVar: 0.9 + Math.random() * 0.2,
                                    maxDist: refs.STREAM_LENGTH
                                });
                            }
                        }
                    }
                };
                refs.initStreamParticles = initStreamParticles;

                // Load Defaults
                setLoadingMsg("Loading Default Assets...");
                const promises = refs.defaultUrls.map(url => loadTextureNode(url));
                const results = await Promise.all(promises);
                const loaded = results.filter(r => r !== null);

                if (!active) return;
                refs.leftAssets = [...loaded];
                refs.rightAssets = [...loaded];
                setLoadingMsg(null);
                initStreamParticles();

                // --- 7. GUI ---
                const gui = new GUI.default({
                    title: 'Stream Settings',
                    container: guiContainerRef.current
                });
                refs.gui = gui;

                const fGlobal = gui.addFolder('Global Settings');
                fGlobal.addColor(refs.params, 'backgroundColor').name('Background').onChange(c => {
                    refs.scene.background.set(c);
                });
                fGlobal.close();

                const fStream = gui.addFolder('Stream Specs');
                fStream.add(refs.params, 'quantity', 10, 1000, 10).name('Quantity').onFinishChange(() => setTimeout(refs.initStreamParticles, 10));
                fStream.add(refs.params, 'speed', 0.0, 5.0).name('Speed');
                fStream.add(refs.params, 'baseSize', 0.1, 3.0).name('Image Size').onFinishChange(() => setTimeout(refs.initStreamParticles, 10));
                fStream.add(refs.params, 'borderRadius', 0.0, 0.5).name('Border Radius');
                fStream.close();

                const fShape = gui.addFolder('Flow Shape');
                fShape.add(refs.params, 'curvePower', 1.0, 5.0).name('Curve Power');
                fShape.add(refs.params, 'spreadEdge', 2.0, 20.0).name('Width (Edge)');
                fShape.add(refs.params, 'spreadCenter', 0.0, 2.0).name('Width (Center)');
                fShape.add(refs.params, 'deformation', 0.1, 1.0).name('Squash (Center)');
                fShape.add(refs.params, 'minScale', 0.01, 1.0).name('Min Scale (Center)');
                fShape.close();

                const fCenter = gui.addFolder('Center Logo');
                fCenter.add(refs.params, 'logoSize', 0.1, 5.0).name('Size').onChange(v => refs.centerGroup.scale.set(v, v, 1));
                fCenter.close();

                const fContent = gui.addFolder('Asset Controls');
                fContent.add(refs.params, 'grayLeft').name('Gray Left Stream').onChange(v => {
                    refs.meshes.forEach(mObj => {
                        if (mObj.side === 'left') {
                            mObj.mesh.material.uniforms.uGray.value = v ? 1.0 : 0.0;
                            mObj.mesh.material.needsUpdate = true;
                        }
                    });
                });

                fContent.add({ uploadL: () => logoInputRef.current?.click() }, 'uploadL').name('📂 Upload Logo');
                fContent.add({ uploadA: () => leftInputRef.current?.click() }, 'uploadA').name('📂 Set Left Images (Bulk)');
                fContent.add({ uploadB: () => rightInputRef.current?.click() }, 'uploadB').name('📂 Set Right Images (Bulk)');
                fContent.close();

                // --- 8. Render Loop ---
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

                const animate = () => {
                    refs.animationId = requestAnimationFrame(animate);

                    const calculateTransform = (absX, zOffset) => {
                        let t = absX / refs.SCREEN_EDGE_X;
                        if (t > 1) t = 1;

                        const curveFactor = Math.pow(t, refs.params.curvePower);
                        const heightLimit = refs.params.spreadCenter + (refs.params.spreadEdge - refs.params.spreadCenter) * curveFactor;

                        const scaleFactor = refs.params.minScale + (1.0 - refs.params.minScale) * t;
                        const finalScale = scaleFactor * refs.params.baseSize;

                        const influence = Math.exp(-t * 12.0);
                        const squash = (refs.params.deformation * influence) + (1.0 * (1.0 - influence));

                        return { heightLimit, finalScale, squash };
                    };

                    refs.particles.forEach(p => {
                        p.x += refs.params.speed * p.speedVar * 0.02;

                        if (p.side === 'left') {
                            if (p.x > 0.0) {
                                p.x -= p.maxDist;
                                p.yFactor = (Math.random() - 0.5) * 2;
                            }
                        } else {
                            if (p.x > p.maxDist) {
                                p.x -= p.maxDist;
                                p.yFactor = (Math.random() - 0.5) * 2;
                            }
                        }

                        const dist = Math.abs(p.x);
                        const { heightLimit, finalScale, squash } = calculateTransform(dist, p.zOffset);

                        let renderScale = finalScale;
                        if (dist < 0.2) renderScale = 0.0;

                        const y = p.yFactor * heightLimit;
                        const z = p.zOffset * 0.5;

                        refs.dummy.position.set(p.x, y, z);
                        refs.dummy.rotation.set(0, 0, 0);
                        refs.dummy.scale.set(renderScale, renderScale * squash, 1);
                        refs.dummy.updateMatrix();

                        p.mesh.setMatrixAt(p.instanceId, refs.dummy.matrix);
                    });

                    refs.meshes.forEach(mObj => {
                        mObj.mesh.material.uniforms.uRadius.value = refs.params.borderRadius;
                        mObj.mesh.instanceMatrix.needsUpdate = true;
                    });

                    if (refs.renderer && refs.scene && refs.camera) {
                        refs.renderer.render(refs.scene, refs.camera);
                    }
                };
                animate();

            } catch (e) {
                console.error("StreamComponent Init Error:", e);
                if (active) setError(e.message);
            }
        }

        initThree();

        return () => {
            active = false;
            if (refs.animationId) cancelAnimationFrame(refs.animationId);
            if (refs.gui) refs.gui.destroy();

            // Unmount geometries
            try {
                if (refs.logoMesh) { refs.logoMesh.geometry?.dispose(); refs.logoMesh.material?.dispose(); }
                if (refs.logoTexture) refs.logoTexture.dispose();
                refs.leftAssets.forEach(a => a?.texture?.dispose());
                refs.rightAssets.forEach(a => a?.texture?.dispose());
                refs.meshes.forEach(m => { m.mesh?.geometry?.dispose(); m.mesh?.material?.dispose(); });
                if (refs.renderer) refs.renderer.dispose();
            } catch (e) { }

            window.removeEventListener('resize', () => { });
        };
    }, []);

    // --- File Interaction Handlers ---

    const processFileAsDataURL = (file) => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    };

    const processFileTexture = (url) => {
        return new Promise((resolve) => {
            if (!refs.THREE) return resolve(null);
            const loader = new refs.THREE.TextureLoader();
            loader.load(url, (tex) => {
                const aspect = tex.image.width / tex.image.height;
                resolve({ texture: tex, aspect: aspect });
            }, undefined, () => resolve(null));
        });
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !refs.THREE) return;

        const dataUrl = await processFileAsDataURL(file);
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            refs.logoTexture = new refs.THREE.Texture(img);
            refs.logoTexture.colorSpace = refs.THREE.SRGBColorSpace;
            refs.logoTexture.needsUpdate = true;
            if (refs.updateCenterUI) refs.updateCenterUI();
        }
        e.target.value = '';
    };

    const handleBulkUpload = async (e, isLeft) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setLoadingMsg("Processing Custom Images...");

        try {
            const promises = files.map(f => processFileAsDataURL(f).then(url => processFileTexture(url)));
            const results = await Promise.all(promises);
            const loaded = results.filter(r => r !== null);

            const oldAssets = isLeft ? refs.leftAssets : refs.rightAssets;
            oldAssets.forEach(a => { if (a && a.texture) a.texture.dispose(); });

            if (isLeft) refs.leftAssets = loaded;
            else refs.rightAssets = loaded;

            if (refs.initStreamParticles) refs.initStreamParticles();
        } catch (error) {
            console.error("Upload Error:", error);
            alert("Failed to load images.");
        } finally {
            setLoadingMsg(null);
            e.target.value = '';
        }
    };

    return (
        <div style={styles.fullTabWrapper}>
            {/* Hidden Input Racks */}
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            <input ref={leftInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleBulkUpload(e, true)} />
            <input ref={rightInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleBulkUpload(e, false)} />

            {loadingMsg && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontFamily: 'monospace', fontSize: '16px',
                    background: 'rgba(0,0,0,0.8)', padding: '12px 24px',
                    borderRadius: '8px', border: '1px solid #333', zIndex: 100
                }}>
                    {loadingMsg}
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
                <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
                    <button
                        onClick={onToggleFullTab}
                        style={{ padding: '8px', background: 'rgba(0,0,0,0.6)', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
                    </button>
                </div>
            )}

            <style>{`
                    .lil - gui {
                    font - family: -apple - system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans - serif;
                }
                `}</style>
        </div>
    );
}

return { StreamComponent };
