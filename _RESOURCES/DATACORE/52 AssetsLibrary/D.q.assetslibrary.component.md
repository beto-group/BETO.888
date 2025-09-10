




# ViewComponent

```jsx
const { useEffect, useRef, useState, useMemo, useCallback, useReducer } = dc;

// --- 1. Core & Shared ---
// This section contains global constants, shared state, utility functions, and the web worker logic.
const FOLDER_PATH = "_RESOURCES/ASSETS/888/ASSETS_.A";
const EXPORT_SCALE = 2;
const FONT_PATH = "_RESOURCES/FONTS/futura/Futura-CondensedLight.otf";
const EXPORT_PADDING = 15;
const EXCALIDRAW_CDN_URL = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/+esm";
const EXCALIDRAW_ASSET_PATH = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/prod/";
const LZ_STRING_CDN_URL = "https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js";
const MAX_CONCURRENCY = 1;

const Core = {
    // --- Shared State ---
    globalImageCache: new Map(),
    REMOVED_IMAGES_PATH: ".datacore/image-gallery/removed.json",

    // --- Persistence Helpers ---
    loadRemovedImagePaths: async () => {
        try {
            if (await dc.app.vault.adapter.exists(Core.REMOVED_IMAGES_PATH)) {
                const content = await dc.app.vault.adapter.read(Core.REMOVED_IMAGES_PATH);
                const paths = JSON.parse(content || "[]");
                return new Set(Array.isArray(paths) ? paths : []);
            }
        } catch (err) {
            console.error("Error loading removed images list:", err);
            new Notice("Could not load removed images list.");
        }
        return new Set();
    },
    saveRemovedImagePaths: async (removedPathsSet) => {
        try {
            const dir = Core.REMOVED_IMAGES_PATH.substring(0, Core.REMOVED_IMAGES_PATH.lastIndexOf("/"));
            if (!(await dc.app.vault.adapter.exists(dir))) {
                await dc.app.vault.adapter.mkdir(dir);
            }
            const pathsArray = Array.from(removedPathsSet);
            await dc.app.vault.adapter.write(Core.REMOVED_IMAGES_PATH, JSON.stringify(pathsArray, null, 2));
        } catch (err) {
            console.error("Error saving removed images list:", err);
            new Notice("Could not save removed images list.");
        }
    },

    // --- DOM Helpers ---
    findNearestAncestorWithClass: (element, className) => {
        if (!element) return null;
        let current = element.parentNode;
        while (current) {
            if (current.classList && current.classList.contains(className)) return current;
            current = current.parentNode;
        }
        return null;
    },
    findDirectChildByClass: (parent, className) => {
        if (!parent) return null;
        for (const child of parent.children) {
            if (child.classList && child.classList.contains(className)) return child;
        }
        return null;
    },

    // --- Web Worker Logic ---
    imageWorkerCode: self.onmessage = async (e) => {
        const { type, imagesToLoad } = e.data || {};
        if (type !== 'generate') return;
        const results = {}, transferable = [], fallback = [];
        for (const { path, svgText, targetWidth, targetHeight, isHires } of imagesToLoad) {
            const W = targetWidth || 240, H = targetHeight || 300;
            try {
                const blob = new Blob([svgText], { type: 'image/svg+xml' });
                const bmp = await createImageBitmap(blob);
                const c = new OffscreenCanvas(W, H);
                const ctx = c.getContext('2d', { alpha: true });
                const iw = Math.max(1, bmp.width || 1), ih = Math.max(1, bmp.height || 1);
                const s = Math.min(W / iw, H / ih);
                const dw = Math.max(1, Math.round(iw * s)), dh = Math.max(1, Math.round(ih * s));
                const dx = Math.floor((W - dw) / 2), dy = Math.floor((H - dh) / 2);
                ctx.clearRect(0, 0, W, H);
                ctx.drawImage(bmp, dx, dy, dw, dh);
                const out = c.transferToImageBitmap ? c.transferToImageBitmap() : await createImageBitmap(c);
                results[path] = { bitmap: out, isHires: !!isHires };
                transferable.push(out);
                bmp.close?.();
            } catch (err) {
                fallback.push({ path, svgText, isHires });
            }
        }
        self.postMessage({ type: 'generated', results, fallback }, transferable);
    },

    // --- Placeholder Drawing Function ---
    drawPlaceholder: (ctx, file, x, y, w, h, isError) => {
        ctx.fillStyle = isError ? '#401010' : '#2b1a20';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(200, 180, 220, 0.5)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const name = file.basename.replace('.svg', '');
        const maxChars = Math.floor(w / 7);
        const line1 = name.substring(0, maxChars);
        const line2 = name.length > maxChars ? name.substring(maxChars, maxChars * 2) + (name.length > maxChars * 2 ? '...' : '') : '';
        ctx.fillText(line1, x + w / 2, y + h / 2 - (line2 ? 8 : 0));
        if (line2) { ctx.fillText(line2, x + w / 2, y + h / 2 + 8); }
    },

    // --- SVG Conversion Logic ---
    Converter: {
        processFileWithLibrary: async (filePath, ExcalidrawModule, LZString, fontData, log) => {
            try {
                const mdContent = await dc.app.vault.adapter.read(filePath);
                const compressedRegex = /```compressed-json\n([\s\S]*?)\n```/;
                let match = mdContent.match(compressedRegex);
                let jsonString;

                if (match && match[1]) {
                    const compressedData = match[1].replace(/\s/g, '');
                    jsonString = LZString.decompressFromBase64(compressedData);
                    if (!jsonString) throw new Error("Decompression failure.");
                } else {
                    const fallbackRegex = /```(?:json|excalidraw)\n([\s\S]*?)\n```/;
                    match = mdContent.match(fallbackRegex);
                    if (match && match[1]) { jsonString = match[1]; }
                }

                if (!jsonString) {
                    if (mdContent.includes("excalidraw-plugin: parsed")) {
                        log(`Skipping empty drawing: ${filePath.split('/').pop()}`);
                        return { success: true, skipped: true, filePath };
                    } else {
                        return { success: true, skipped: true, filePath };
                    }
                }

                const sceneData = JSON.parse(jsonString);
                return await Core.Converter.exportScene(sceneData, filePath, ExcalidrawModule, fontData, log);
            } catch (error) {
                log(`FAIL: ${filePath.split('/').pop()} - ${error.message}`);
                console.error(`Excalidraw Error on file ${filePath}:`, error);
                return { success: false, error: error.message, filePath };
            }
        },
        exportScene: async (sceneData, filePath, ExcalidrawModule, fontData, log) => {
            if (!sceneData.elements || !sceneData.appState) { throw new Error("Invalid Excalidraw JSON."); }
            const svg = await ExcalidrawModule.exportToSvg({
                elements: sceneData.elements,
                appState: { ...sceneData.appState, exportBackground: false, viewBackgroundColor: 'transparent', exportScale: EXPORT_SCALE, exportEmbedScene: true },
                files: sceneData.files || {}, exportPadding: EXPORT_PADDING, getFontData: async () => fontData,
            });
            const svgPath = filePath.replace(/\.md$/i, '.svg');
            const svgString = new XMLSerializer().serializeToString(svg);
            if (!svgString || svgString.length < 200) { throw new Error("Generated SVG was invalid."); }
            await dc.app.vault.adapter.write(svgPath, svgString);
            log(`✔ Converted: ${filePath.split('/').pop()}`);
            return { success: true, filePath };
        },
        loadLegacyScript: (url, globalName) => {
            return new Promise((resolve, reject) => {
                if (window[globalName]) { return resolve(); }
                const script = document.createElement('script');
                script.src = url; script.async = true;
                script.onload = () => { if (window[globalName]) { resolve(); } else { reject(new Error(`Script loaded but global '${globalName}' not found.`)); } };
                script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
                document.head.appendChild(script);
            });
        }
    }
};

// --- 2. Custom Hooks ---

/**
 * A hook to manage entering and exiting a fullscreen-like mode for a component.
 */
const useFullscreenEffect = (containerRef, isFullTab) => {
    const stateRefs = useRef({}).current;
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullTab) return;
        const timer = setTimeout(() => {
            const t = Core.findNearestAncestorWithClass(container, "workspace-leaf-content");
            if (!t) return;
            const contentWrapper = Core.findDirectChildByClass(t, "view-content") || t;
            stateRefs.originalParent = container.parentNode;
            stateRefs.placeholder = document.createElement("div");
            if (container.parentNode) { container.parentNode.insertBefore(stateRefs.placeholder, container); }
            const originalPosition = window.getComputedStyle(contentWrapper).position;
            stateRefs.parentPositionInfo = { element: contentWrapper, originalInlinePosition: contentWrapper.style.position };
            if (originalPosition === "static") { contentWrapper.style.position = "relative"; }
            contentWrapper.appendChild(container);
            container.classList.add('fullscreen-active');
        }, 50);
        return () => {
            clearTimeout(timer);
            if (!stateRefs.originalParent || !container) return;
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
            } else if (stateRefs.originalParent) {
                stateRefs.originalParent.appendChild(container);
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || "";
            }
            container.classList.remove('fullscreen-active');
            Object.keys(stateRefs).forEach(k => delete stateRefs[k]);
        };
    }, [isFullTab, containerRef]);
};

/**
 * A hook to manage the web worker for image rasterization.
 */
const useImageWorker = (imagesToDisplay, onCacheUpdate) => {
    const [worker, setWorker] = useState(null);
    const [error, setError] = useState(null);
    const requestedRef = useRef(new Set());

    useEffect(() => {
        let workerInstance;
        try {
            const src = `self.onmessage = ${Core.imageWorkerCode.toString()}`;
            const blob = new Blob([src], { type: 'application/javascript' });
            workerInstance = new Worker(URL.createObjectURL(blob));
            setWorker(workerInstance);
        } catch (err) {
            console.error("Worker Initialization Failed:", err);
            new Notice(`CRITICAL ERROR: ${err.message}`, 15000);
            setError(err.message);
        }
        return () => { if (workerInstance) workerInstance.terminate(); };
    }, []);

    const rasterizeInMain = useCallback((svgText, targetWidth, targetHeight) => {
        const W = 240, H = 300;
        return new Promise((resolve) => { const w = targetWidth || W, h = targetHeight || H; const img = new Image(); const blob = new Blob([svgText], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob); img.decoding = 'async'; img.onload = async () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); const iw = Math.max(1, img.naturalWidth || 1), ih = Math.max(1, img.naturalHeight || 1); const s = Math.min(w / iw, h / ih); const dw = Math.max(1, Math.round(iw * s)), dh = Math.max(1, Math.round(ih * s)); const dx = Math.floor((w - dw) / 2), dy = Math.floor((h - dh) / 2); ctx.clearRect(0, 0, w, h); ctx.drawImage(img, dx, dy, dw, dh); URL.revokeObjectURL(url); const bmp = await createImageBitmap(c); resolve(bmp); }; img.onerror = () => { URL.revokeObjectURL(url); resolve(null); }; img.src = url; });
    }, []);

    useEffect(() => {
        if (!worker) return;
        const filesMap = new Map(imagesToDisplay.map(f => [f.path, f]));

        worker.onmessage = async (e) => {
            const { type, results, fallback } = e.data || {};
            if (type !== 'generated') return;
            let updated = false;

            if (results) {
                for (const path in results) {
                    const { bitmap, isHires } = results[path] || {};
                    if (!bitmap) continue;
                    const file = filesMap.get(path);
                    if (!file) continue;
                    const entry = Core.globalImageCache.get(path) || {};
                    if (isHires) { entry.hiresBitmap = bitmap; entry.hiresRequested = false; }
                    else { entry.bitmap = bitmap; entry.error = false; requestedRef.current.delete(path); }
                    entry.mtime = file.stat.mtime;
                    Core.globalImageCache.set(path, entry);
                    updated = true;
                }
            }

            if (fallback && fallback.length) {
                for (const { path, svgText, isHires } of fallback) {
                    const file = filesMap.get(path);
                    if (!file) continue;
                    const bmp = await rasterizeInMain(svgText, isHires ? 1000 : 240, isHires ? 1250 : 300);
                    const entry = Core.globalImageCache.get(path) || {};
                    if (isHires) { entry.hiresBitmap = bmp; entry.hiresRequested = false; }
                    else { entry.bitmap = bmp; entry.error = !bmp; requestedRef.current.delete(path); }
                    entry.mtime = file.stat.mtime;
                    Core.globalImageCache.set(path, entry);
                    updated = true;
                }
            }
            if (updated) onCacheUpdate();
        };
        return () => { if (worker) worker.onmessage = null; };
    }, [worker, imagesToDisplay, rasterizeInMain, onCacheUpdate]);

    const requestImages = useCallback((filesToLoad, isHires = false) => {
        if (!worker || filesToLoad.length === 0) return;

        const newLoads = filesToLoad.filter(f => !requestedRef.current.has(f.path));
        if (newLoads.length === 0) return;

        for (const f of newLoads) requestedRef.current.add(f.path);

        const fetchAndPost = async () => {
            const data = await Promise.all(newLoads.map(async f => ({
                path: f.path, svgText: await dc.app.vault.read(f), isHires,
                targetWidth: isHires ? 1000 : undefined,
                targetHeight: isHires ? 1250 : undefined,
            })));
            if (worker) worker.postMessage({ type: 'generate', imagesToLoad: data });
        };

        if ('requestIdleCallback' in window && !isHires) {
            window.requestIdleCallback(fetchAndPost, { timeout: 300 });
        } else {
            setTimeout(fetchAndPost, isHires ? 0 : 50);
        }
    }, [worker]);

    return { imageCache: Core.globalImageCache, requestImages, workerError: error, requestedSet: requestedRef.current };
};

/**
 * A hook that manages the rendering and interaction logic for the Grid View canvas.
 */
const useInteractiveCanvas = ({ containerRef, canvasRef, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, isTransitioning, initialPositions, onTransitionEnd }, isFullTab, onCardClick, imagesToDisplay, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection) => {
    const cameraState = useRef({ camX: 0, camY: 0, vX: 0, vY: 0, zoom: 1, zTarget: 1 });
    const stateRef = useRef({ isSearching, matchingImagePaths, isSelectionMode, selectedPaths }).current;
    Object.assign(stateRef, { isSearching, matchingImagePaths, isSelectionMode, selectedPaths });

    const gridItemsRef = useRef([]);
    const hoveredTileRef = useRef(null);

    const imagesToDisplayRef = useRef(imagesToDisplay);
    useEffect(() => {
        imagesToDisplayRef.current = imagesToDisplay;
    }, [imagesToDisplay]);


    const canvasSizeRef = useRef({ CW: 1, CH: 1 });
    const worldFromScreen = useCallback((sx, sy) => {
        const { camX, camY, zoom } = cameraState.current;
        const { CW, CH } = canvasSizeRef.current;
        if (zoom === 0 || CW === 0 || CH === 0) return { x: camX, y: camY };
        return { x: (sx - CW / 2) / zoom + camX, y: (sy - CH / 2) / zoom + camY };
    }, []);

    const requestRender = useCallback(() => { onCacheUpdate.current(); }, [onCacheUpdate]);

    useEffect(() => {
        if (isTransitioning && initialPositions) {
            gridItemsRef.current.forEach(item => {
                const pos = initialPositions.get(item.path);
                if (pos) {
                    item.animX = pos.x; item.animY = pos.y;
                    item.vx = (Math.random() - 0.5) * 20;
                    item.vy = (Math.random() - 0.5) * 20;
                    item.usePhysics = true;
                }
            });
            requestRender();
        }
    }, [isTransitioning, initialPositions, requestRender]);

    useEffect(() => {
        const CARD_W = 160, CARD_H = 200, GAP = 80, TILE_W = CARD_W + GAP, TILE_H = CARD_H + GAP;
        const cols = Math.max(1, Math.ceil(Math.sqrt(imagesToDisplay.length)));

        const gridW = cols * TILE_W;
        const gridH = Math.ceil(imagesToDisplay.length / cols) * TILE_H;

        const oldItemsByPath = new Map(gridItemsRef.current.map(item => [item.path, item]));
        const oldItemPositions = new Map(gridItemsRef.current.map((item, index) => [item.path, index]));

        const newGridItems = imagesToDisplay.map((file, i) => {
            const targetI = i % cols;
            const targetJ = Math.floor(i / cols);
            const targetX = targetI * TILE_W + GAP / 2;
            const targetY = targetJ * TILE_H + GAP / 2;
            const oldItem = oldItemsByPath.get(file.path);

            const needsToAnimateIn = !oldItem || oldItemPositions.get(file.path) !== i;

            if (oldItem) {
                oldItem.targetX = targetX;
                oldItem.targetY = targetY;

                if (needsToAnimateIn) {
                    const spawnSide = Math.floor(Math.random() * 4);
                    switch (spawnSide) {
                        case 0: oldItem.animX = Math.random() * gridW; oldItem.animY = -CARD_H * 2; break;
                        case 1: oldItem.animX = gridW + CARD_W * 2; oldItem.animY = Math.random() * gridH; break;
                        case 2: oldItem.animX = Math.random() * gridW; oldItem.animY = gridH + CARD_H * 2; break;
                        default: oldItem.animX = -CARD_W * 2; oldItem.animY = Math.random() * gridH; break;
                    }
                    oldItem.scale = 0;
                    oldItem.isActivated = false;
                }
                return oldItem;
            } else {
                let spawnX, spawnY;
                const spawnSide = Math.floor(Math.random() * 4);
                switch (spawnSide) {
                    case 0: spawnX = Math.random() * gridW; spawnY = -CARD_H * 2; break;
                    case 1: spawnX = gridW + CARD_W * 2; spawnY = Math.random() * gridH; break;
                    case 2: spawnX = Math.random() * gridW; spawnY = gridH + CARD_H * 2; break;
                    default: spawnX = -CARD_W * 2; spawnY = Math.random() * gridH; break;
                }

                return {
                    path: file.path, targetX, targetY,
                    animX: spawnX, animY: spawnY,
                    scale: 0,
                    isActivated: false,
                };
            }
        });
        const newPaths = new Set(imagesToDisplay.map(f => f.path));
        gridItemsRef.current = newGridItems.filter(item => newPaths.has(item.path));
        requestRender();
    }, [imagesToDisplay, requestRender]);

    useEffect(() => {
        if (!stateRef.prevIsSearching && isSearching && matchingImagePaths.size > 0) {
            const CARD_W = 160, CARD_H = 200, GAP = 80, TILE_W = CARD_W + GAP, TILE_H = CARD_H + GAP;
            const cols = Math.max(1, Math.ceil(Math.sqrt(imagesToDisplay.length)));
            const pathToIndexMap = new Map(imagesToDisplay.map((f, i) => [f.path, i]));
            let minI = Infinity, maxI = -Infinity, minJ = Infinity, maxJ = -Infinity;
            matchingImagePaths.forEach(path => {
                const index = pathToIndexMap.get(path);
                if (index !== undefined) {
                    const i = index % cols; const j = Math.floor(index / cols);
                    minI = Math.min(minI, i); maxI = Math.max(maxI, i);
                    minJ = Math.min(minJ, j); maxJ = Math.max(maxJ, j);
                }
            });
            if (isFinite(minI)) {
                const PADDING = 120;
                const resultsLeft = minI * TILE_W; const resultsTop = minJ * TILE_H;
                const resultsWidth = (maxI - minI + 1) * TILE_W; const resultsHeight = (maxJ - minJ + 1) * TILE_H;
                const canvas = canvasRef.current;
                if (cameraState.current && canvas) {
                    const CW = canvas.clientWidth, CH = canvas.clientHeight;
                    const zoomX = CW / (resultsWidth + PADDING); const zoomY = CH / (resultsHeight + PADDING);
                    cameraState.current.zTarget = Math.min(zoomX, zoomY, 3.0);
                    cameraState.current.camX = resultsLeft + resultsWidth / 2;
                    cameraState.current.camY = resultsTop + resultsHeight / 2;
                    interactingUntilRef.current = performance.now() + 400; requestRender();
                }
            }
        } else if (stateRef.prevIsSearching && !isSearching) {
            if (cameraState.current) { cameraState.current.zTarget = 1.0; interactingUntilRef.current = performance.now() + 400; requestRender(); }
        }
        stateRef.prevIsSearching = isSearching;
    }, [isSearching, matchingImagePaths, imagesToDisplay, stateRef, canvasRef, interactingUntilRef, requestRender]);

    useEffect(() => {
        if (resetViewKey > 0 && cameraState.current) {
            const CARD_W = 160, CARD_H = 200, GAP = 80, TILE_W = CARD_W + GAP, TILE_H = CARD_H + GAP;
            const { CW, CH } = canvasSizeRef.current;
            const numImages = imagesToDisplay.length;
            if (numImages === 0 || CW <= 1 || CH <= 1) return;
            const cols = Math.max(1, Math.ceil(Math.sqrt(numImages)));
            const rows = Math.ceil(numImages / cols);
            const gridW = cols * TILE_W; const gridH = rows * TILE_H;
            const PADDING = 80;

            const baseZoom = Math.min(CW / (gridW + PADDING), CH / (gridH + PADDING));
            const targetZoom = Math.min(baseZoom * 1.2, 1.0);

            cameraState.current.camX = gridW / 2; cameraState.current.camY = gridH / 2;
            cameraState.current.zTarget = targetZoom;
            interactingUntilRef.current = performance.now() + 400; requestRender();
        }
    }, [resetViewKey, imagesToDisplay.length, requestRender, interactingUntilRef]);

    useEffect(() => {
        if (!isFullTab) return;
        const root = containerRef.current, canvas = canvasRef.current; if (!canvas || !root) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        const back = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas');
        const bctx = back.getContext('2d', { alpha: false });

        let rafId = 0, running = false, CW = 1, CH = 1, DPR = 1;
        const CARD_W = 160, CARD_H = 200, GAP = 80, TILE_W = CARD_W + GAP, TILE_H = CARD_H + GAP;
        let hoverAnimState = { i: -1, j: -1, strength: 0 };

        let mx = 0, my = 0, dragging = false, dragPointerId = null, panKeyActive = false;
        let anchorWorld = { x: 0, y: 0 }, zoomAnchorWorld = null, zoomAnchorScreen = null;
        let zoomActiveUntil = 0, clickSuppressUntil = 0, dragAccum = 0;

        const internalRequestRender = () => { if (!running) { running = true; rafId = requestAnimationFrame(frame); } };
        onCacheUpdate.current = internalRequestRender;

        const frame = () => {
            const now = performance.now();
            const { camX, camY, vX, vY, zoom, zTarget } = cameraState.current;
            let nextVX = vX, nextVY = vY, nextCamX = camX, nextCamY = camY, nextZoom = zoom;

            const hovered = hoveredTileRef.current?.over ? hoveredTileRef.current : null;
            if (hovered && (hovered.i !== hoverAnimState.i || hovered.j !== hoverAnimState.j)) {
                hoverAnimState.i = hovered.i; hoverAnimState.j = hovered.j;
            }
            const targetStrength = hovered ? 1 : 0;
            hoverAnimState.strength += (targetStrength - hoverAnimState.strength) * 0.15;

            const currentCols = Math.max(1, Math.ceil(Math.sqrt(gridItemsRef.current.length)));
            const currentGridW = currentCols * TILE_W;
            const currentGridH = Math.ceil(gridItemsRef.current.length / currentCols) * TILE_H;

            let isStillAnimating = false;
            const toLoadLowRes = [];
            const localImagesToDisplay = imagesToDisplayRef.current;

            gridItemsRef.current.forEach((item) => {
                if (!imageCache.has(item.path) && !requestedSet.has(item.path)) {
                    const file = localImagesToDisplay.find(f => f.path === item.path);
                    if (file) toLoadLowRes.push(file);
                }

                if (!item.isActivated && imageCache.has(item.path)) {
                    item.isActivated = true;
                }

                if (item.isActivated) {
                    item.animX += (item.targetX - item.animX) * 0.08;
                    item.animY += (item.targetY - item.animY) * 0.08;
                    item.scale += (1 - item.scale) * 0.08;
                }

                if ((item.isActivated && item.scale < 0.99) || Math.abs(item.targetX - item.animX) > 0.1 || Math.abs(item.targetY - item.animY) > 0.1) {
                    isStillAnimating = true;
                }
            });

            if (toLoadLowRes.length > 0) {
                requestImages(toLoadLowRes.slice(0, 32), false);
            }

            nextVX *= 0.9; nextVY *= 0.9; nextCamX += nextVX; nextCamY += nextVY; nextZoom += (zTarget - nextZoom) * 0.40;
            if (zoomAnchorWorld && (now < zoomActiveUntil || Math.abs(zTarget - nextZoom) > 1e-3)) { nextCamX = zoomAnchorWorld.x - (zoomAnchorScreen.x - CW / 2) / nextZoom; nextCamY = zoomAnchorWorld.y - (zoomAnchorScreen.y - CH / 2) / nextZoom; } else { zoomAnchorWorld = null; zoomAnchorScreen = null; }
            const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
            nextCamX = clamp(nextCamX, -CW, currentGridW + CW); nextCamY = clamp(nextCamY, -CH, currentGridH + CH);
            cameraState.current = { camX: nextCamX, camY: nextCamY, vX: nextVX, vY: nextVY, zoom: nextZoom, zTarget };
            drawFrame();

            const moving = isStillAnimating || Math.abs(nextVX) > 0.01 || Math.abs(nextVY) > 0.01 || Math.abs(zTarget - nextZoom) > 0.001 || hoverAnimState.strength > 0.01 || (hovered && !stateRef.isSelectionMode);
            if (moving) rafId = requestAnimationFrame(frame); else running = false;
        };

        const drawFrame = () => {
            const now = performance.now();
            bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, back.width, back.height); bctx.setTransform(DPR, 0, 0, DPR, 0, 0); bctx.fillStyle = '#0f0a12'; bctx.fillRect(0, 0, CW, CH);
            const { camX, camY, zoom } = cameraState.current;
            const halfW = CW / (2 * zoom), halfH = CH / (2 * zoom); const view = { left: camX - halfW, right: camX + halfW, top: camY - halfH, bottom: camY + halfH };
            bctx.save(); bctx.translate(CW / 2, CH / 2); bctx.scale(zoom, zoom); bctx.translate(-camX, -camY);
            const toLoadHighRes = [], visibleHiresPaths = new Set();
            let hoveredItemToRedraw = null;
            const currentCols = Math.max(1, Math.ceil(Math.sqrt(gridItemsRef.current.length)));
            const localImagesToDisplay = imagesToDisplayRef.current;

            gridItemsRef.current.forEach((item) => {
                const { animX, animY, scale } = item;
                if (scale < 0.01) return;

                if (animX < view.left - (CARD_W * scale) || animX > view.right + (CARD_W * scale) || animY < view.top - (CARD_H * scale) || animY > view.bottom + (CARD_H * scale)) return;
                const file = localImagesToDisplay.find(f => f.path === item.path);
                if (!file) return;
                let entry = imageCache.get(item.path);
                if (entry && entry.mtime !== file.stat.mtime) { imageCache.delete(item.path); entry = undefined; }
                let pushX = 0, pushY = 0;
                if (hoverAnimState.strength > 0.01) {
                    const hovI = hoverAnimState.i, hovJ = hoverAnimState.j;
                    const idx = localImagesToDisplay.findIndex(f => f.path === item.path);
                    if (idx === -1) return;
                    const i = idx % currentCols, j = Math.floor(idx / currentCols);
                    const dx = i - hovI, dy = j - hovJ;
                    const distSq = dx * dx + dy * dy;
                    if (distSq > 0 && distSq < 16) { const dist = Math.sqrt(distSq); const maxPush = 50; const power = maxPush * hoverAnimState.strength; const pushAmount = power / (distSq + 0.5); pushX = (dx / dist) * pushAmount; pushY = (dy / dist) * pushAmount; }
                }
                const x = animX + pushX; const y = animY + pushY;
                const idx = localImagesToDisplay.findIndex(f => f.path === item.path);
                if (idx === -1) return;
                const i = idx % currentCols, j = Math.floor(idx / currentCols);
                const isHovered = hoveredTileRef.current && hoveredTileRef.current.i === i && hoveredTileRef.current.j === j && hoveredTileRef.current.over;
                const isSelected = stateRef.selectedPaths.has(item.path);
                const hoverScale = isHovered ? Math.min(2.5, 1.0 + 0.2 / zoom) : 1.0;
                const finalScale = scale * hoverScale;
                const drawW = CARD_W * finalScale; const drawH = CARD_H * finalScale;
                const drawX = x - (drawW - CARD_W) / 2; const drawY = y - (drawH - CARD_H) / 2;
                const drawPayload = { file, path: item.path, entry, item, x, y, drawX, drawY, drawW, drawH, isHovered, isSelected };
                if (isHovered) hoveredItemToRedraw = drawPayload; else drawCard(drawPayload);
            });
            if (hoveredItemToRedraw) drawCard(hoveredItemToRedraw);
            function drawCard({ file, path, entry, item, x, y, drawX, drawY, drawW, drawH, isHovered, isSelected }) {
                const isMatch = stateRef.isSearching && stateRef.matchingImagePaths.has(path);
                const isNotMatch = stateRef.isSearching && !isMatch;
                bctx.save();
                if (isNotMatch) { bctx.globalAlpha *= 0.15; }
                const useHires = zoom > 1.4 && entry?.hiresBitmap;
                const bitmapToDraw = useHires ? entry.hiresBitmap : entry?.bitmap;

                if (!bitmapToDraw) {
                    Core.drawPlaceholder(bctx, file, drawX, drawY, drawW, drawH, entry?.error);
                } else {
                    bctx.drawImage(bitmapToDraw, drawX, drawY, drawW, drawH);
                }
                if (useHires) visibleHiresPaths.add(path);

                if (isSelected) { bctx.fillStyle = 'rgba(135, 255, 197, 0.25)'; bctx.fillRect(drawX, drawY, drawW, drawH); bctx.strokeStyle = 'rgba(135, 255, 197, 0.8)'; bctx.lineWidth = 2 / zoom; bctx.strokeRect(drawX, drawY, drawW, drawH); }
                if (isMatch && !isSelected) { bctx.strokeStyle = 'rgba(170, 130, 255, 0.7)'; bctx.lineWidth = 2 / zoom; bctx.strokeRect(drawX - 1, drawY - 1, drawW + 2, drawH + 2); }
                if (isHovered && !stateRef.isSelectionMode && !isSelected) {
                    bctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; bctx.lineWidth = 1.5 / zoom;
                    const pulse = (Math.sin(now / 300) + 1) / 2;
                    const M_SIZE = (8 + pulse * 6) / zoom; const M_OFFSET = -8 / zoom;
                    bctx.beginPath();
                    bctx.moveTo(drawX + M_OFFSET, drawY + M_OFFSET + M_SIZE); bctx.lineTo(drawX + M_OFFSET, drawY + M_OFFSET); bctx.lineTo(drawX + M_OFFSET + M_SIZE, drawY + M_OFFSET);
                    bctx.moveTo(drawX + drawW - M_OFFSET - M_SIZE, drawY + M_OFFSET); bctx.lineTo(drawX + drawW - M_OFFSET, drawY + M_OFFSET); bctx.lineTo(drawX + drawW - M_OFFSET, drawY + M_OFFSET + M_SIZE);
                    bctx.moveTo(drawX + M_OFFSET, drawY + drawH - M_OFFSET - M_SIZE); bctx.lineTo(drawX + M_OFFSET, drawY + drawH - M_OFFSET); bctx.lineTo(drawX + M_OFFSET + M_SIZE, drawY + drawH - M_OFFSET);
                    bctx.moveTo(drawX + drawW - M_OFFSET - M_SIZE, drawY + drawH - M_OFFSET); bctx.lineTo(drawX + drawW - M_OFFSET, drawY + drawH - M_OFFSET); bctx.lineTo(drawX + drawW - M_OFFSET, drawY + drawH - M_OFFSET - M_SIZE);
                    bctx.stroke();
                }
                if (stateRef.isSelectionMode && isHovered && !isSelected) { bctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; bctx.lineWidth = 2 / zoom; bctx.beginPath(); bctx.arc(x + CARD_W / 2, y + CARD_H / 2, 30 / zoom, 0, 2 * Math.PI); bctx.stroke(); }
                if (isSelected) { bctx.fillStyle = 'rgba(135, 255, 197, 0.8)'; bctx.beginPath(); bctx.arc(x + CARD_W / 2, y + CARD_H / 2, 30 / zoom, 0, 2 * Math.PI); bctx.fill(); bctx.strokeStyle = '#0f0a12'; bctx.lineWidth = 2.5 / zoom; bctx.beginPath(); bctx.moveTo(x + CARD_W / 2 - 12 / zoom, y + CARD_H / 2); bctx.lineTo(x + CARD_W / 2 - 4 / zoom, y + CARD_H / 2 + 8 / zoom); bctx.lineTo(x + CARD_W / 2 + 12 / zoom, y + CARD_H / 2 - 7 / zoom); bctx.stroke(); }
                bctx.restore();
                if (zoom > 1.4 && entry?.bitmap && !entry.hiresBitmap && !entry.hiresRequested) { entry.hiresRequested = true; toLoadHighRes.push(file); }
            }
            if (toLoadHighRes.length) { requestImages(toLoadHighRes, true); }
            bctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(back, 0, 0, canvas.width, canvas.height);
            for (const [path, entry] of imageCache.entries()) { if (entry.hiresBitmap && !visibleHiresPaths.has(path)) { entry.hiresBitmap.close?.(); delete entry.hiresBitmap; entry.hiresRequested = false; } }
        };

        const setInteracting = (duration = 200) => { interactingUntilRef.current = performance.now() + duration; };
        const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
        const getTile = (wx, wy) => {
            const currentCols = Math.max(1, Math.ceil(Math.sqrt(gridItemsRef.current.length)));
            const i = Math.floor(wx / TILE_W), j = Math.floor(wy / TILE_H);
            const localX = wx - i * TILE_W, localY = wy - j * TILE_H;
            const over = localX >= GAP / 2 && localX <= GAP / 2 + CARD_W && localY >= GAP / 2 && localY <= GAP / 2 + CARD_H;
            return { i, j, over };
        };
        const sizeToContainer = () => {
            const r = root.getBoundingClientRect(), dpr = Math.min(1.75, window.devicePixelRatio || 1);
            if (CW !== r.width || CH !== r.height || DPR !== dpr) {
                CW = r.width; CH = r.height; DPR = dpr;
                canvasSizeRef.current = { CW, CH };
                canvas.width = Math.max(1, Math.floor(CW * DPR)); canvas.height = Math.max(1, Math.floor(CH * DPR));
                back.width = canvas.width; back.height = canvas.height;

                if (cameraState.current.camX === 0 && CW > 1 && CH > 1 && gridItemsRef.current.length > 0) {
                    const numImages = gridItemsRef.current.length;
                    const cols = Math.max(1, Math.ceil(Math.sqrt(numImages)));
                    const rows = Math.ceil(numImages / cols);
                    const gridW = cols * TILE_W; const gridH = rows * TILE_H;
                    const PADDING = 80;

                    const baseZoom = Math.min(CW / (gridW + PADDING), CH / (gridH + PADDING));
                    const initialZoom = Math.min(baseZoom * 1.2, 1.0);

                    cameraState.current = {
                        camX: gridW / 2, camY: gridH / 2,
                        vX: 0, vY: 0, zoom: initialZoom, zTarget: initialZoom,
                    };
                }
                internalRequestRender();
            }
        };

        const startDragIfAllowed = (e) => { const allow = e.button === 1 || e.button === 2 || panKeyActive; if (!allow) return false; const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; dragging = true; dragPointerId = e.pointerId; anchorWorld = worldFromScreen(mx, my); cameraState.current.vX = 0; cameraState.current.vY = 0; dragAccum = 0; setInteracting(); canvas.setPointerCapture?.(e.pointerId); canvas.style.cursor = 'grabbing'; return true; };
        const onPointerDown = (e) => { if (e.target !== canvas || document.querySelector('.panel-wrap') || document.querySelector('.image-gallery-searchbar')?.contains(e.target)) return; if (startDragIfAllowed(e)) { e.preventDefault(); internalRequestRender(); } };
        const onPointerMove = (e) => { const r = canvas.getBoundingClientRect(); const pMx = mx, pMy = my; mx = e.clientX - r.left; my = e.clientY - r.top; if (dragging && e.pointerId === dragPointerId) { const { camX: prevX, camY: prevY, zoom } = cameraState.current; let camX = anchorWorld.x - (mx - CW / 2) / zoom; let camY = anchorWorld.y - (my - CH / 2) / zoom; cameraState.current.vX = (camX - prevX) * 0.85; cameraState.current.vY = (camY - prevY) * 0.85; cameraState.current.camX = camX; cameraState.current.camY = camY; dragAccum += Math.hypot(mx - pMx, my - pMy); setInteracting(); internalRequestRender(); } else { const wp = worldFromScreen(mx, my); const hit = getTile(wp.x, wp.y); const old = hoveredTileRef.current; if (hit.i !== old?.i || hit.j !== old?.j || hit.over !== old?.over) { hoveredTileRef.current = hit; if (stateRef.isSelectionMode && hit.over) { canvas.style.cursor = 'pointer'; } else if (!panKeyActive) { canvas.style.cursor = 'default'; } internalRequestRender(); } } };
        const onPointerUp = (e) => { if (!dragging || e.pointerId !== dragPointerId) return; dragging = false; dragPointerId = null; canvas.releasePointerCapture?.(e.pointerId); canvas.style.cursor = panKeyActive ? 'grab' : (stateRef.isSelectionMode ? 'pointer' : 'default'); clickSuppressUntil = performance.now() + 250; internalRequestRender(); };
        const onPointerLeave = () => { if (hoveredTileRef.current) { hoveredTileRef.current = null; internalRequestRender(); } };
        const onContextMenu = (e) => { e.preventDefault(); };
        const onKeyDown = (e) => { if (e.code === 'Space') { if (!panKeyActive) { panKeyActive = true; if (!dragging) canvas.style.cursor = 'grab'; } } if (e.key === '+' || e.key === '=') { const cx = CW / 2, cy = CH / 2; zoomAnchorScreen = { x: cx, y: cy }; zoomAnchorWorld = worldFromScreen(cx, cy); cameraState.current.zTarget = clamp(cameraState.current.zoom * 1.8, 0.1, 5); zoomActiveUntil = performance.now() + 300; setInteracting(); internalRequestRender(); } if (e.key === '-') { const cx = CW / 2, cy = CH / 2; zoomAnchorScreen = { x: cx, y: cy }; zoomAnchorWorld = worldFromScreen(cx, cy); cameraState.current.zTarget = clamp(cameraState.current.zoom / 1.8, 0.1, 5); zoomActiveUntil = performance.now() + 300; setInteracting(); internalRequestRender(); } };
        const onKeyUp = (e) => { if (e.code === 'Space') { panKeyActive = false; if (!dragging) canvas.style.cursor = stateRef.isSelectionMode ? 'pointer' : 'default'; } };
        const onWheel = (e) => { if (document.querySelector('.panel-wrap') || document.querySelector('.image-gallery-searchbar')?.contains(e.target)) return; const isZoom = e.ctrlKey || e.metaKey; if (isZoom) { e.preventDefault(); const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; const factor = Math.exp(-e.deltaY * 0.0068); const zPrime = clamp(cameraState.current.zoom * factor, 0.1, 5); zoomAnchorScreen = { x: mx, y: my }; zoomAnchorWorld = worldFromScreen(mx, my); cameraState.current.zTarget = zPrime; zoomActiveUntil = performance.now() + 300; setInteracting(); internalRequestRender(); } else { e.preventDefault(); const k = 1 / cameraState.current.zoom; cameraState.current.camX += e.deltaX * k; cameraState.current.camY += e.deltaY * k; cameraState.current.vX = e.deltaX * 0.02 * k; cameraState.current.vY = e.deltaY * 0.02 * k; setInteracting(120); internalRequestRender(); } };
        let gestureLast = 1; const onGestureStart = (e) => { gestureLast = 1; const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; zoomAnchorScreen = { x: mx, y: my }; zoomAnchorWorld = worldFromScreen(mx, my); zoomActiveUntil = performance.now() + 400; }; const onGestureChange = (e) => { const PINCH_SENSITIVITY = 64; const scaleRatio = e.scale / gestureLast; const amplifiedRatio = 2 + (scaleRatio - 1) * PINCH_SENSITIVITY; gestureLast = e.scale; cameraState.current.zTarget = clamp(cameraState.current.zoom * amplifiedRatio, 0.1, 5); setInteracting(); internalRequestRender(); }; const onGestureEnd = () => { zoomActiveUntil = performance.now() + 200; };
        const onClick = async () => {
            if (performance.now() < clickSuppressUntil) return; if (dragAccum > 8) return; const wp = worldFromScreen(mx, my); const hit = getTile(wp.x, wp.y);
            const currentCols = Math.max(1, Math.ceil(Math.sqrt(gridItemsRef.current.length)));
            const idx = hit.j * currentCols + hit.i;
            const localImagesToDisplay = imagesToDisplayRef.current;
            if (!hit.over || idx < 0 || idx >= localImagesToDisplay.length) return;
            const file = localImagesToDisplay[idx];
            if (stateRef.isSelectionMode) { onToggleSelection(file.path); return; }
            if (stateRef.isSearching && !stateRef.matchingImagePaths.has(file.path)) return;
            const cached = imageCache.get(file.path); if (!cached?.bitmap) return;
            const tempCanvas = document.createElement('canvas'); tempCanvas.width = 16; tempCanvas.height = 20; tempCanvas.getContext('2d').drawImage(cached.bitmap, 0, 0, 16, 20);
            const lowResUrl = tempCanvas.toDataURL('image/jpeg', 0.1); const initialBitmap = cached.hiresBitmap || cached.bitmap; onCardClick({ path: file.path, lowResUrl, initialBitmap, i: hit.i, j: hit.j });
        };

        sizeToContainer(); internalRequestRender();
        let resizeRAF = 0; const ro = new ResizeObserver(() => { cancelAnimationFrame(resizeRAF); resizeRAF = requestAnimationFrame(sizeToContainer); }); ro.observe(root);

        canvas.addEventListener('pointerdown', onPointerDown); window.addEventListener('pointermove', onPointerMove, { passive: true }); window.addEventListener('pointerup', onPointerUp); canvas.addEventListener('pointerleave', onPointerLeave); canvas.addEventListener('contextmenu', onContextMenu); window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp); canvas.addEventListener('wheel', onWheel, { passive: false }); canvas.addEventListener('gesturestart', onGestureStart); canvas.addEventListener('gesturechange', onGestureChange); canvas.addEventListener('gestureend', onGestureEnd); canvas.addEventListener('click', onClick);
        return () => { ro.disconnect(); onCacheUpdate.current = () => { }; canvas.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('pointerleave', onPointerLeave); canvas.removeEventListener('contextmenu', onContextMenu); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('gesturestart', onGestureStart); canvas.removeEventListener('gesturechange', onGestureChange); canvas.removeEventListener('gestureend', onGestureEnd); canvas.removeEventListener('click', onClick); running = false; cancelAnimationFrame(rafId); };
    }, [isFullTab, onCardClick, onToggleSelection, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, containerRef, canvasRef, onTransitionEnd]);
};




const useGraphCanvas = ({ containerRef, canvasRef, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, nodesRef: nodesRefProp }, isFullTab, onCardClick, imagesToDisplay, a888aTagsMap, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection) => {
    const nodesRef = useRef([]);
    const cameraState = useRef({ camX: 0, camY: 0, vX: 0, vY: 0, zoom: 0.08, zTarget: 0.08 });
    const hoveredNodeRef = useRef(null);
    const draggedNodeRef = useRef(null);
    const effectsRef = useRef([]);
    const stateRef = useRef({}).current;
    Object.assign(stateRef, { isSearching, matchingImagePaths, isSelectionMode, selectedPaths, a888aTagsMap });
    const runPhysics = useRef(true);
    const requestRender = useCallback(() => { onCacheUpdate.current(); }, [onCacheUpdate]);
    const debugLoggedRef = useRef(false);

    useEffect(() => {
        const oldNodesByPath = new Map(nodesRef.current.map(node => [node.file.path, node]));
        const R = Math.sqrt(imagesToDisplay.length) * 160;
        const newNodes = imagesToDisplay.map((file, i) => {
            const oldNode = oldNodesByPath.get(file.path);
            if (oldNode) return oldNode;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(imagesToDisplay.length) * 100 * (1 + Math.random());
            return {
                file: file,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                vx: 0, vy: 0, w: 160, h: 160,
                scale: 0, scaleTarget: 1,
            };
        });
        const newPaths = new Set(imagesToDisplay.map(f => f.path));
        nodesRef.current = newNodes.filter(node => newPaths.has(node.file.path));
        if (imagesToDisplay.length > 0) {
            runPhysics.current = true;
            requestRender();
        }
    }, [imagesToDisplay, requestRender]);

    useEffect(() => {
        if (resetViewKey > 0 && cameraState.current) {
            cameraState.current.camX = 0;
            cameraState.current.camY = 0;
            cameraState.current.zTarget = 0.5;
            requestRender();
        }
    }, [resetViewKey, requestRender]);

    useEffect(() => {
        if (!isFullTab) return;
        const root = containerRef.current, canvas = canvasRef.current;
        if (!canvas || !root) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        const back = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas');
        const bctx = back.getContext('2d', { alpha: false });
        let rafId = 0, running = false, CW = 1, CH = 1, DPR = 1;
        const CARD_W = 160, CARD_H = 160;
        let mx = 0, my = 0, dragPointerId = null;
        let clickSuppressUntil = 0, dragAccum = 0;
        let zoomAnchorWorld = null, zoomAnchorScreen = null, zoomActiveUntil = 0;

        const internalRequestRender = () => { if (!running) { running = true; rafId = requestAnimationFrame(frame); } };
        onCacheUpdate.current = internalRequestRender;

        const frame = () => {
            const now = performance.now();
            let { camX, camY, vX, vY, zoom, zTarget } = cameraState.current;
            vX *= 0.9; vY *= 0.9; camX += vX; camY += vY;
            zoom += (zTarget - zoom) * 0.40;
            if (zoomAnchorWorld && (now < zoomActiveUntil || Math.abs(zTarget - zoom) > 1e-3)) {
                camX = zoomAnchorWorld.x - (zoomAnchorScreen.x - CW / 2) / zoom;
                camY = zoomAnchorWorld.y - (zoomAnchorScreen.y - CH / 2) / zoom;
            } else {
                zoomAnchorWorld = null; zoomAnchorScreen = null;
            }
            cameraState.current = { camX, camY, vX, vY, zoom, zTarget };
            const physicsMovement = physicsStep();
            drawFrame();
            if (nodesRefProp) {
                nodesRefProp.current = nodesRef.current;
            }
            const isScaling = nodesRef.current.some(n => Math.abs(n.scale - n.scaleTarget) > 0.01);
            const stillAnimating = physicsMovement > 0.1 || Math.abs(vX) > 0.01 || Math.abs(vY) > 0.01 || Math.abs(zTarget - zoom) > 0.001 || effectsRef.current.length > 0 || isScaling || hoveredNodeRef.current !== null;
            if (stillAnimating) {
                rafId = requestAnimationFrame(frame);
            } else {
                running = false;
            }
        };

        const drawFrame = () => {
            if (!debugLoggedRef.current && nodesRef.current.length > 0 && CW > 1) {
                console.clear();
                console.log("--- GRAPH DEBUG FRAME (ONE-TIME LOG) ---");
                console.log(`Canvas Dimensions: CW = ${CW}, CH = ${CH}`);
                const { camX, camY, zoom } = cameraState.current;
                console.log(`Camera State ("Where I am"): camX = ${camX.toFixed(2)}, camY = ${camY.toFixed(2)}, zoom = ${zoom.toFixed(4)}`);
                const firstNode = nodesRef.current[0];
                if (firstNode) {
                    console.log(`\nFirst Node Details: ${firstNode.file.basename}`);
                    console.log(`World Position: x = ${firstNode.x.toFixed(2)}, y = ${firstNode.y.toFixed(2)}`);
                    const relX = firstNode.x - camX;
                    const relY = firstNode.y - camY;
                    const screenX = (relX * zoom) + (CW / 2);
                    const screenY = (relY * zoom) + (CH / 2);
                    const nodeRadiusOnScreen = (firstNode.w / 2) * zoom;
                    const cornerTopLeftX = screenX - nodeRadiusOnScreen;
                    const cornerTopLeftY = screenY - nodeRadiusOnScreen;
                    const cornerBottomRightX = screenX + nodeRadiusOnScreen;
                    const cornerBottomRightY = screenY + nodeRadiusOnScreen;
                    console.log(`Expected Screen Center: x = ${screenX.toFixed(2)}, y = ${screenY.toFixed(2)}`);
                    console.log(` -> This should be near the middle of your screen [${(CW / 2).toFixed(2)}, ${(CH / 2).toFixed(2)}]`);
                    console.log("\nExpected Screen Corners (Bounding Box):");
                    console.log(` -> Top-Left: [${cornerTopLeftX.toFixed(2)}, ${cornerTopLeftY.toFixed(2)}]`);
                    console.log(` -> Bottom-Right: [${cornerBottomRightX.toFixed(2)}, ${cornerBottomRightY.toFixed(2)}]`);
                    if (CW < 100 || CH < 100) {
                        console.error("!!! CRITICAL: Canvas dimensions are too small or zero. This is likely the cause of the top-left issue. The centering math is failing.");
                    }
                }
                console.log("-----------------------------------------");
                debugLoggedRef.current = true;
            }

            if (CW < 2 || CH < 2) return;
            const now = performance.now();
            bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, back.width, back.height);
            bctx.setTransform(DPR, 0, 0, DPR, 0, 0); bctx.fillStyle = '#0f0a12'; bctx.fillRect(0, 0, CW, CH);
            const { camX, camY, zoom } = cameraState.current;
            bctx.save();
            bctx.translate(CW / 2, CH / 2);
            bctx.scale(zoom, zoom);
            bctx.translate(-camX, -camY);
            const toLoadLowRes = [], toLoadHighRes = [], visibleHiresPaths = new Set();
            const halfW = CW / (2 * zoom), halfH = CH / (2 * zoom);
            const view = { left: camX - halfW - CARD_W, right: camX + halfW + CARD_W, top: camY - halfH - CARD_H, bottom: camY + halfH + CARD_H };
            bctx.save();
            bctx.globalCompositeOperation = 'lighter';
            const EFFECT_DURATION = 600;
            effectsRef.current = effectsRef.current.filter(eff => {
                const age = now - eff.startTime;
                if (age > EFFECT_DURATION) return false;
                const { node } = eff;
                if (!node) return false;
                const progress = age / EFFECT_DURATION;
                const baseRadius = (node.w * node.scale / 2);
                const radius = baseRadius + progress * 80;
                const alpha = Math.sin(Math.PI * progress) * 0.5;
                const grad = bctx.createRadialGradient(node.x, node.y, radius * 0.5, node.x, node.y, radius);
                grad.addColorStop(0, `rgba(200, 160, 255, ${alpha})`);
                grad.addColorStop(1, `rgba(200, 160, 255, 0)`);
                bctx.fillStyle = grad;
                bctx.beginPath();
                bctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                bctx.fill();
                return true;
            });
            bctx.restore();
            nodesRef.current.sort((a, b) => a.scale - b.scale);
            nodesRef.current.forEach(node => {
                const isHovered = hoveredNodeRef.current === node;
                const hoverScaleFactor = Math.min(8.0, 1.8 + 0.8 / zoom);
                node.scaleTarget = isHovered ? hoverScaleFactor : 1.0;
                node.scale += (node.scaleTarget - node.scale) * 0.2;
                const path = node.file.path;
                let entry = imageCache.get(path);
                if (entry && entry.mtime !== node.file.stat.mtime) {
                    entry.bitmap?.close?.();
                    entry.hiresBitmap?.close?.();
                    imageCache.delete(path);
                    entry = undefined;
                }
                const scaledW = node.w * node.scale;
                if (node.x < view.left - scaledW || node.x > view.right + scaledW || node.y < view.top - scaledW || node.y > view.bottom + scaledW) return;
                const isMatch = stateRef.isSearching && stateRef.matchingImagePaths.has(path);
                const isNotMatch = stateRef.isSearching && !isMatch;
                const isSelected = stateRef.selectedPaths.has(path);
                if (isNotMatch) {
                    bctx.save();
                    bctx.globalAlpha = 0.15;
                }
                const useHires = (zoom > 0.6 || isHovered) && entry?.hiresBitmap;
                const bitmapToDraw = useHires ? entry.hiresBitmap : entry?.bitmap;
                bctx.save();
                bctx.beginPath();
                bctx.arc(node.x, node.y, scaledW / 2, 0, Math.PI * 2);
                bctx.clip();
                if (bitmapToDraw) {
                    if (useHires) visibleHiresPaths.add(path);
                    bctx.imageSmoothingEnabled = zoom > 0.6 * 0.9;
                    const IMAGE_PADDING = 0.9;
                    bctx.drawImage(bitmapToDraw, node.x - (scaledW * IMAGE_PADDING) / 2, node.y - (scaledW * IMAGE_PADDING) / 2, scaledW * IMAGE_PADDING, scaledW * IMAGE_PADDING);
                } else {
                    Core.drawPlaceholder(bctx, node.file, node.x - scaledW / 2, node.y - scaledW / 2, scaledW, scaledW, entry?.error);
                    if (!requestedSet.has(path)) toLoadLowRes.push(node.file);
                }
                bctx.restore();
                if ((zoom > 0.6 || isHovered) && entry?.bitmap && !entry.hiresBitmap && !entry.hiresRequested) {
                    entry.hiresRequested = true;
                    toLoadHighRes.push(node.file);
                }
                if (isSelected) {
                    bctx.strokeStyle = 'rgba(135, 255, 197, 0.8)';
                    bctx.lineWidth = 3 / zoom;
                    bctx.beginPath();
                    bctx.arc(node.x, node.y, scaledW / 2, 0, Math.PI * 2);
                    bctx.stroke();
                }
                if (isMatch && !isSelected) {
                    bctx.strokeStyle = 'rgba(170, 130, 255, 0.7)';
                    bctx.lineWidth = 3 / zoom;
                    bctx.beginPath();
                    bctx.arc(node.x, node.y, scaledW / 2, 0, Math.PI * 2);
                    bctx.stroke();
                }
                if (isHovered && !isSelected) {
                    bctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    bctx.lineWidth = 2.5 / zoom;
                    const radius = scaledW / 2 + 5 / zoom;
                    for (let i = 0; i < 8; i++) {
                        const rotation = (now / 2000 + i * 0.1) % (Math.PI * 2);
                        const pulse = (Math.sin(now / 350 + i * 0.7) + 1) / 2;
                        const baseArcLength = Math.PI / 24;
                        const arcLength = baseArcLength * (1 + pulse * 1.5);
                        const angle = rotation + i * (Math.PI / 4);
                        bctx.beginPath();
                        bctx.arc(node.x, node.y, radius, angle - arcLength / 2, angle + arcLength / 2);
                        bctx.stroke();
                    }
                }
                if (isNotMatch) {
                    bctx.restore();
                }
            });
            const hoveredNode = hoveredNodeRef.current;
            if (hoveredNode && hoveredNode.scale > 1.05) {
                const alpha = Math.min(1, (hoveredNode.scale - 1) / 0.4);
                const name = hoveredNode.file.basename.replace('.svg', '');
                const tags = stateRef.a888aTagsMap.get(hoveredNode.file.path);
                bctx.font = `${14 / zoom}px sans-serif`;
                bctx.textAlign = 'center';
                bctx.fillStyle = `rgba(230, 210, 255, ${alpha})`;
                bctx.fillText(name, hoveredNode.x, hoveredNode.y + (hoveredNode.h * hoveredNode.scale / 2) + (18 / zoom));
                if (tags && tags.length > 0) {
                    bctx.font = `${12 / zoom}px sans-serif`;
                    bctx.fillStyle = `rgba(200, 180, 220, ${alpha * 0.8})`;
                    bctx.fillText(tags.join(', '), hoveredNode.x, hoveredNode.y + (hoveredNode.h * hoveredNode.scale / 2) + (36 / zoom));
                }
            }
            if (toLoadLowRes.length) { requestImages(toLoadLowRes.slice(0, 16), false); }
            if (toLoadHighRes.length) { requestImages(toLoadHighRes, true); }
            bctx.restore();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(back, 0, 0, canvas.width, canvas.height);
            for (const [path, entry] of imageCache.entries()) {
                if (entry.hiresBitmap && !visibleHiresPaths.has(path)) {
                    entry.hiresBitmap.close?.();
                    delete entry.hiresBitmap;
                    entry.hiresRequested = false;
                }
            }
        };

        const physicsStep = () => {
            if (!runPhysics.current) return 0;
            const REPULSION = 80000;
            const CENTER_PULL = 0.001;
            const DAMPING = 0.90;
            const nodes = nodesRef.current;
            for (let i = 0; i < nodes.length; i++) {
                const n1 = nodes[i];
                if (n1 === draggedNodeRef.current) continue;
                n1.vx -= n1.x * CENTER_PULL;
                n1.vy -= n1.y * CENTER_PULL;
                for (let j = i + 1; j < nodes.length; j++) {
                    const n2 = nodes[j];
                    const dx = n1.x - n2.x;
                    const dy = n1.y - n2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const combinedRadius = (n1.w * n1.scale / 2) + (n2.w * n2.scale / 2);
                    if (dist < combinedRadius && dist > 0) {
                        const overlap = combinedRadius - dist;
                        const moveX = (overlap / 2) * (dx / dist);
                        const moveY = (overlap / 2) * (dy / dist);
                        n1.x += moveX;
                        n1.y += moveY;
                        n2.x -= moveX;
                        n2.y -= moveY;
                    }
                    if (dist > 0) {
                        const force = REPULSION / (dist * dist);
                        n1.vx += (dx / dist) * force;
                        n1.vy += (dy / dist) * force;
                        n2.vx -= (dx / dist) * force;
                        n2.vy -= (dy / dist) * force;
                    }
                }
            }
            let totalMovement = 0;
            for (const node of nodes) {
                if (node === draggedNodeRef.current) continue;
                node.vx *= DAMPING;
                node.vy *= DAMPING;
                node.x += node.vx;
                node.y += node.vy;
                totalMovement += Math.abs(node.vx) + Math.abs(node.vy);
            }
            if (totalMovement < 0.1 && !draggedNodeRef.current && !hoveredNodeRef.current) {
                runPhysics.current = false;
            }
            return totalMovement;
        };

        const setInteracting = (duration = 200) => { interactingUntilRef.current = performance.now() + duration; };
        const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
        const worldFromScreen = (sx, sy, z) => { const k = z ?? cameraState.current.zoom; return { x: (sx - CW / 2) / k + cameraState.current.camX, y: (sy - CH / 2) / k + cameraState.current.camY }; };
        const sizeToContainer = () => { const r = root.getBoundingClientRect(), dpr = Math.min(1.75, window.devicePixelRatio || 1); if (CW !== r.width || CH !== r.height || DPR !== dpr) { CW = r.width; CH = r.height; DPR = dpr; canvas.width = Math.max(1, Math.floor(CW * DPR)); canvas.height = Math.max(1, Math.floor(CH * DPR)); back.width = canvas.width; back.height = canvas.height; internalRequestRender(); } };

        const findNodeAt = (wx, wy) => { const sorted = [...nodesRef.current].sort((a, b) => b.scale - a.scale); for (const n of sorted) { const dx = wx - n.x; const dy = wy - n.y; if (dx * dx + dy * dy < (n.w * n.scale / 2) * (n.w * n.scale / 2)) return n; } return null; };

        const onPointerDown = (e) => {
            if (e.target !== canvas || document.querySelector('.panel-wrap') || document.querySelector('.image-gallery-searchbar')?.contains(e.target)) return;
            e.preventDefault();
            const r = canvas.getBoundingClientRect();
            mx = e.clientX - r.left;
            my = e.clientY - r.top;
            dragPointerId = e.pointerId;
            dragAccum = 0;
            const wp = worldFromScreen(mx, my);
            const hitNode = findNodeAt(wp.x, wp.y);
            if (hitNode) {
                draggedNodeRef.current = hitNode;
                hitNode.vx = 0;
                hitNode.vy = 0;
                runPhysics.current = true;
            }
            canvas.setPointerCapture?.(e.pointerId);
            internalRequestRender();
        };

        const onPointerMove = (e) => {
            if (dragPointerId && e.pointerId !== dragPointerId) return;
            const r = canvas.getBoundingClientRect();
            const pMx = mx, pMy = my;
            mx = e.clientX - r.left;
            my = e.clientY - r.top;
            if (dragPointerId) {
                dragAccum += Math.hypot(mx - pMx, my - pMy);
                if (draggedNodeRef.current) {
                    const draggedNode = draggedNodeRef.current;
                    const wp = worldFromScreen(mx, my);
                    const dragVx = wp.x - draggedNode.x;
                    const dragVy = wp.y - draggedNode.y;
                    draggedNode.x = wp.x;
                    draggedNode.y = wp.y;
                    draggedNode.vx = 0;
                    draggedNode.vy = 0;
                    const KICK_FORCE = 0.8;
                    for (const otherNode of nodesRef.current) {
                        if (otherNode === draggedNode) continue;
                        const dx = otherNode.x - draggedNode.x;
                        const dy = otherNode.y - draggedNode.y;
                        const distSq = dx * dx + dy * dy;
                        const combinedRadius = (otherNode.w * otherNode.scale / 2) + (draggedNode.w * draggedNode.scale / 2);
                        if (distSq < combinedRadius * combinedRadius) {
                            otherNode.vx += dragVx * KICK_FORCE;
                            otherNode.vy += dragVy * KICK_FORCE;
                        }
                    }
                    runPhysics.current = true;
                } else {
                    const dx = (mx - pMx) / cameraState.current.zoom;
                    const dy = (my - pMy) / cameraState.current.zoom;
                    cameraState.current.camX -= dx;
                    cameraState.current.camY -= dy;
                }
            } else {
                const wp = worldFromScreen(mx, my);
                const hitNode = findNodeAt(wp.x, wp.y);
                if (hoveredNodeRef.current !== hitNode) {
                    if (hitNode) {
                        effectsRef.current.push({ node: hitNode, startTime: performance.now() });
                        runPhysics.current = true;
                    }
                    hoveredNodeRef.current = hitNode;
                }
            }
            internalRequestRender();
        };

        const onPointerUp = (e) => {
            if (!dragPointerId || e.pointerId !== dragPointerId) return;
            if (draggedNodeRef.current) {
                draggedNodeRef.current = null;
                runPhysics.current = true;
            }
            dragPointerId = null;
            canvas.releasePointerCapture?.(e.pointerId);
            clickSuppressUntil = performance.now() + 250;
            if (dragAccum < 8) {
                onClick();
            }
            internalRequestRender();
        };

        const onPointerLeave = () => { hoveredNodeRef.current = null; internalRequestRender(); };
        const onWheel = (e) => { if (document.querySelector('.panel-wrap') || document.querySelector('.image-gallery-searchbar')?.contains(e.target)) return; const isZoom = e.ctrlKey || e.metaKey; if (isZoom) { e.preventDefault(); const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; const factor = Math.exp(-e.deltaY * 0.0068); const zPrime = clamp(cameraState.current.zoom * factor, 0.05, 5); zoomAnchorScreen = { x: mx, y: my }; zoomAnchorWorld = worldFromScreen(mx, my); cameraState.current.zTarget = zPrime; setInteracting(300); internalRequestRender(); } else { e.preventDefault(); const k = 1 / cameraState.current.zoom; cameraState.current.camX += e.deltaX * k; cameraState.current.camY += e.deltaY * k; cameraState.current.vX = e.deltaX * 0.02 * k; cameraState.current.vY = e.deltaY * 0.02 * k; setInteracting(120); internalRequestRender(); } };
        let gestureLast = 1; const onGestureStart = (e) => { gestureLast = 1; const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; zoomAnchorScreen = { x: mx, y: my }; zoomAnchorWorld = worldFromScreen(mx, my); zoomActiveUntil = performance.now() + 400; }; const onGestureChange = (e) => { const PINCH_SENSITIVITY = 64; const scaleRatio = e.scale / gestureLast; const amplifiedRatio = 2 + (scaleRatio - 1) * PINCH_SENSITIVITY; gestureLast = e.scale; cameraState.current.zTarget = clamp(cameraState.current.zoom * amplifiedRatio, 0.05, 5); setInteracting(); internalRequestRender(); }; const onGestureEnd = () => { zoomActiveUntil = performance.now() + 200; };
        const onClick = async () => { if (performance.now() < clickSuppressUntil) return; const wp = worldFromScreen(mx, my); const hitNode = findNodeAt(wp.x, wp.y); if (!hitNode) return; const file = hitNode.file; if (stateRef.isSelectionMode) { onToggleSelection(file.path); return; } if (stateRef.isSearching && !stateRef.matchingImagePaths.has(file.path)) return; const cached = imageCache.get(file.path); if (!cached?.bitmap) return; const tempCanvas = document.createElement('canvas'); tempCanvas.width = 16; tempCanvas.height = 20; tempCanvas.getContext('2d').drawImage(cached.bitmap, 0, 0, 16, 20); const lowResUrl = tempCanvas.toDataURL('image/jpeg', 0.1); const initialBitmap = cached.hiresBitmap || cached.bitmap; onCardClick({ path: file.path, lowResUrl, initialBitmap }); };

        sizeToContainer();
        internalRequestRender();
        let resizeRAF = 0;
        const ro = new ResizeObserver(() => { cancelAnimationFrame(resizeRAF); resizeRAF = requestAnimationFrame(sizeToContainer); });
        ro.observe(root);

        canvas.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointerleave', onPointerLeave);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('gesturestart', onGestureStart);
        canvas.addEventListener('gesturechange', onGestureChange);
        canvas.addEventListener('gestureend', onGestureEnd);

        return () => {
            ro.disconnect();
            onCacheUpdate.current = () => { };
            cancelAnimationFrame(rafId);
            running = false;
            canvas.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointerleave', onPointerLeave);
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('gesturestart', onGestureStart);
            canvas.removeEventListener('gesturechange', onGestureChange);
            canvas.removeEventListener('gestureend', onGestureEnd);
        };
    }, [isFullTab, onCardClick, onToggleSelection, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, containerRef, canvasRef, nodesRefProp]);

};

/**
 * A hook to manage dynamic SVG conversion.
 */


const useExcalidrawConverter = () => {
    const [status, setStatus] = useState('loading'); // loading, ready, error
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const dependenciesRef = useRef(null);

    // --- CORRECTED ---
    // Switched to the UMD (Universal Module Definition) version of Excalidraw.
    // This version is a single script file designed for direct browser use and avoids module resolution issues.
    const EXCALIDRAW_UMD_URL = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/excalidraw.production.min.js";


    const log = useCallback((message) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 100)]);
    }, []);

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                log('Loading dependencies...');
                window.EXCALIDRAW_ASSET_PATH = EXCALIDRAW_ASSET_PATH;

                // --- CORRECTED ---
                // We now load all dependencies using the same robust legacy script loader.
                // The browser's own HTTP cache will handle storing and retrieving the script after the first load.
                const excalidrawPromise = Core.Converter.loadLegacyScript(EXCALIDRAW_UMD_URL, "ExcalidrawLib");
                const lzStringPromise = Core.Converter.loadLegacyScript(LZ_STRING_CDN_URL, "LZString");
                const fontDataPromise = dc.app.vault.adapter.readBinary(FONT_PATH);

                // Wait for all dependencies to be loaded.
                const [_, __, fontData] = await Promise.all([excalidrawPromise, lzStringPromise, fontDataPromise]);

                // The UMD script attaches the Excalidraw library to window.ExcalidrawLib
                dependenciesRef.current = {
                    ExcalidrawModule: window.ExcalidrawLib,
                    LZString: window.LZString,
                    fontData: fontData
                };

                log('Dependencies loaded successfully.');
                setStatus('ready');
            } catch (err) {
                console.error("Failed to load Excalidraw dependencies:", err);
                log(`ERROR: ${err.message}`);
                setError(err.message);
                setStatus('error');
            }
        };
        loadDependencies();
    }, [log]);

    const runConversionCheck = useCallback(async (onComplete) => {
        if (status !== 'ready' || !dependenciesRef.current) {
            log('Converter not ready.');
            onComplete?.(false);
            return;
        }
        log('Starting conversion check...');

        try {
            const allFiles = dc.app.vault.getFiles();
            const filesInFolder = allFiles.filter(f => f.path.startsWith(FOLDER_PATH));
            const mdFiles = filesInFolder.filter(f => f.extension === 'md');
            const svgFilesMap = new Map(filesInFolder.filter(f => f.extension === 'svg').map(f => [f.path.replace(/\.svg$/i, ''), f]));

            const filesToConvert = [];
            const MTIME_GRACE_PERIOD_MS = 2000; // 2-second grace period

            for (const mdFile of mdFiles) {
                const basePath = mdFile.path.replace(/\.md$/i, '');
                const correspondingSvg = svgFilesMap.get(basePath);

                if (!correspondingSvg) {
                    // Condition 1: SVG does not exist. Always convert.
                    filesToConvert.push(mdFile);
                    continue;
                }

                // Condition 2 (BUG FIX): MD file is newer than the SVG file, accounting for a grace period.
                // This prevents re-conversion if timestamps are too close together due to fast file writes or filesystem resolution limits.
                if (mdFile.stat.mtime > correspondingSvg.stat.mtime + MTIME_GRACE_PERIOD_MS) {
                    filesToConvert.push(mdFile);
                }
            }

            if (filesToConvert.length === 0) {
                log('All assets are up-to-date.');
                onComplete?.(false);
                return;
            }

            log(`Found ${filesToConvert.length} files to convert/update.`);
            new Notice(`Converting ${filesToConvert.length} Excalidraw files...`);

            const queue = [...filesToConvert];

            const worker = async () => {
                while (queue.length > 0) {
                    const file = queue.shift();
                    if (!file) continue;
                    await Core.Converter.processFileWithLibrary(file.path, dependenciesRef.current.ExcalidrawModule, dependenciesRef.current.LZString, dependenciesRef.current.fontData, log);
                }
            };

            await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, queue.length) }, worker));

            log('Conversion check complete.');
            new Notice(`Conversion complete.`);
            onComplete?.(true);
        } catch (err) {
            console.error('Error during conversion check:', err);
            log(`ERROR: ${err.message}`);
            new Notice(`Conversion failed. See console.`);
            onComplete?.(false);
        }
    }, [status, log]);

    return { status, error, logs, runConversionCheck };
};

// --- 3. View Components ---

/**
 * Renders the Grid View canvas.
 */
const GridView = ({ isFullTab, imagesToDisplay, onCardClick, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, isTransitioning, initialPositions, onTransitionEnd }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);

    useInteractiveCanvas(
        { containerRef, canvasRef, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, isTransitioning, initialPositions, onTransitionEnd },
        isFullTab, onCardClick, imagesToDisplay, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection
    );

    return (
        <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
            <canvas ref={canvasRef} className="interactive-canvas" />
        </div>
    );
};

/**
 * Renders the Graph View canvas.
 */
const GraphView = ({ isFullTab, imagesToDisplay, onCardClick, a888aTagsMap, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, nodesRef }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);

    useGraphCanvas(
        { containerRef, canvasRef, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, nodesRef },
        isFullTab, onCardClick, imagesToDisplay, a888aTagsMap, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection
    );

    return (
        <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
            <canvas ref={canvasRef} className="interactive-canvas" />
        </div>
    );
};

const ConverterLoadingView = ({ logs }) => (
    <div style={{ padding: '20px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f0a12' }}>
        <h3 style={{ color: '#d1bfff' }}>Initializing Asset Engine...</h3>
        <p style={{ color: '#8a7c9c', fontSize: '13px', maxWidth: '400px' }}>Loading Excalidraw libraries and preparing for SVG conversion. This is a one-time process. </p>
        <div style={{ height: '200px', width: 'clamp(300px, 80%, 600px)', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', borderRadius: '6px', padding: '10px', overflowY: 'auto', fontSize: '11px', textAlign: 'left', fontFamily: 'monospace', color: '#aaa', marginTop: '20px' }}>
            {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
    </div>
);

const ConverterErrorView = ({ error }) => (
    <div style={{ padding: '20px', textAlign: 'center', color: '#ff8a8a', background: '#0f0a12', height: '100%', display: 'grid', placeContent: 'center' }}>
        <h3>Critical Initialization Error</h3>
        <p>Could not load required libraries for Excalidraw conversion.</p>
        <p style={{ color: '#aaa', fontSize: '12px', marginTop: '10px', fontFamily: 'monospace' }}>{error}</p>
    </div>
);


// --- 4. UI Components ---

const DropdownBase = ({ buttonContent, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { setIsOpen(false); } };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className="dropdown-container" ref={dropdownRef}>
            <button className="dropdown-btn" onClick={() => setIsOpen(!isOpen)}>
                {buttonContent(isOpen)}
            </button>
            {isOpen && <div className="dropdown-menu">{children(setIsOpen)}</div>}
        </div>
    );
};

const SortDropdown = ({ options, value, onChange }) => {
    const selectedOption = options.find(opt => opt.value === value);
    return (
        <DropdownBase buttonContent={(isOpen) => (
            <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <span>{selectedOption?.label || 'Sort By'}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </>
        )}>
            {(setIsOpen) => options.map(option => (
                <div key={option.value} className={`dropdown-item ${value === option.value ? 'active' : ''}`} onClick={() => { onChange(option.value); setIsOpen(false); }}>
                    {option.label}
                </div>
            ))}
        </DropdownBase>
    );
};

const ViewDropdown = ({ value, onChange }) => {
    const options = [
        { value: 'grid', label: 'Grid', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
        { value: 'graph', label: 'Graph', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg> }
    ];
    const selectedOption = options.find(opt => opt.value === value);
    return (
        <DropdownBase buttonContent={(isOpen) => (
            <>
                {selectedOption.icon}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </>
        )}>
            {(setIsOpen) => options.map(option => (
                <div key={option.value} className={`dropdown-item with-icon ${value === option.value ? 'active' : ''}`} onClick={() => { onChange(option.value); setIsOpen(false); }}>
                    {option.icon} <span>{option.label}</span>
                </div>
            ))}
        </DropdownBase>
    );
};

const TagsPanel = ({ tags, onTagClick, onClose }) => {
    if (!tags || tags.length === 0) {
        return <div className="tags-panel">No tags found.</div>;
    }
    return (
        <div className="tags-panel">
            {tags.map(tag => (
                <button key={tag} className="tag-btn" onClick={() => onTagClick(tag)}>
                    {tag}
                </button>
            ))}
        </div>
    );
};

const SearchBar = ({ searchTerm, onSearchChange, onClear, onInputMount, sortOption, onSortChange, sortOptions, viewType, onViewChange, isSelectionMode, onToggleSelectionMode, allTags, onTagClick, onResetView }) => {
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isFocused, setIsFocused] = useState(false);
    const [isTagsPanelOpen, setIsTagsPanelOpen] = useState(false);
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0, moveHandler: null, upHandler: null });
    const barRef = useRef(null);
    const localInputRef = useRef(null);
    const STORAGE_KEY = 'image-gallery-searchbar-pos';
    useEffect(() => { if (localInputRef.current && onInputMount) { onInputMount(localInputRef.current); } }, [onInputMount]);

    useEffect(() => {
        try {
            const savedPos = localStorage.getItem(STORAGE_KEY);
            if (savedPos) { setPosition(JSON.parse(savedPos)); }
        } catch (e) {
            console.error("Could not load search bar position:", e);
        }
    }, []);

    useEffect(() => { const ref = dragRef.current; return () => { window.removeEventListener('pointermove', ref.moveHandler); window.removeEventListener('pointerup', ref.upHandler); }; }, []);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (barRef.current && !barRef.current.contains(event.target)) {
                setIsFocused(false);
                setIsTagsPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onPointerDown = (e) => {
        if (e.target.closest('input') || e.target.closest('button') || e.target.closest('.dropdown-container')) return;
        e.stopPropagation();
        const moveHandler = (moveEvent) => {
            if (!dragRef.current.isDragging) return;
            const dx = moveEvent.clientX - dragRef.current.startX;
            const dy = moveEvent.clientY - dragRef.current.startY;
            setPosition({ x: dragRef.current.initialX + dx, y: dragRef.current.initialY + dy });
        };
        const upHandler = () => {
            dragRef.current.isDragging = false;
            setPosition(currentPos => {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPos));
                } catch (e) {
                    console.error("Could not save search bar position:", e);
                }
                return currentPos;
            });
            window.removeEventListener('pointermove', moveHandler);
            window.removeEventListener('pointerup', upHandler);
        };
        dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initialX: position.x, initialY: position.y };
        window.addEventListener('pointermove', moveHandler);
        window.addEventListener('pointerup', upHandler);
    };
    const isCollapsed = !isFocused && !searchTerm && !isSelectionMode;
    const handleBarClick = (e) => {
        if (isCollapsed) {
            setIsFocused(true);
            localInputRef.current?.focus();
        } else if (e.target.closest('.action-menu-icon')) {
            setIsFocused(false);
            setIsTagsPanelOpen(false);
        }
    };
    const handleTagButtonClick = (tag) => {
        onTagClick(tag);
        setIsTagsPanelOpen(false);
        setIsFocused(true);
    };
    return (
        <div ref={barRef} className={`image-gallery-searchbar ${isCollapsed ? 'collapsed' : ''}`} style={{ transform: `translate(${position.x}px, ${position.y}px)` }} onClick={handleBarClick}>
            <svg className="action-menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" onPointerDown={onPointerDown} title="Drag to move controls">
                <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            <div className="search-bar-divider"></div>
            <ViewDropdown value={viewType} onChange={onViewChange} />
            <div className="search-bar-divider"></div>
            <input ref={localInputRef} type="text" placeholder="Search..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} onFocus={() => setIsFocused(true)} />
            {searchTerm && (<button className="clear-btn" onClick={onClear}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>)}
            <div className="search-bar-divider"></div>
            <SortDropdown options={sortOptions} value={sortOption} onChange={onSortChange} />
            <div className="search-bar-divider"></div>
            <button className="select-btn" onClick={onResetView} title="Reset View"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 21v-2M21 12h-2M12 3V1M3 12H1m17.66 6.34l-1.42-1.42M4.76 4.76L3.34 3.34m14.32 0l-1.42 1.42M4.76 19.24l-1.42 1.42"></path></svg></button>
            <div className="search-bar-divider"></div>
            <button className={`select-btn tag-btn-toggle ${isTagsPanelOpen ? 'active' : ''}`} onClick={() => setIsTagsPanelOpen(!isTagsPanelOpen)} title="Browse Tags"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg></button>
            <div className="search-bar-divider"></div>
            <button className={`select-btn ${isSelectionMode ? 'active' : ''}`} onClick={onToggleSelectionMode} title="Toggle Selection Mode"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></button>

            {isTagsPanelOpen && <TagsPanel tags={allTags} onTagClick={handleTagButtonClick} />}
        </div>
    );
};

const MassEditPanel = ({ selectedCount, onApplyPreset, onApplyA888a, onApplyCustom, onClear, onClose }) => {
    const [key, setKey] = useState('data-tag');
    const [value, setValue] = useState('');
    return (
        <div className="mass-edit-panel">
            <div className="mass-edit-header">
                <h3>Edit {selectedCount} Image{selectedCount > 1 ? 's' : ''}</h3>
                <button onClick={onClose} className="close-btn">×</button>
            </div>
            <div className="mass-edit-body">
                <div className="mass-edit-section">
                    <label>Quick Presets (A888a)</label>
                    <div className="mass-edit-presets">
                        <button className="preset-btn" onClick={() => onApplyA888a('hot+')}>hot+</button>
                        <button className="preset-btn" onClick={() => onApplyA888a('one')}>one</button>
                    </div>
                </div>
                <div className="mass-edit-divider"></div>
                <div className="mass-edit-section">
                    <label>Quick Presets (data-aaa-tags)</label>
                    <div className="mass-edit-presets">
                        <button className="preset-btn" onClick={() => onApplyPreset('hot+')}>hot+</button>
                        <button className="preset-btn" onClick={() => onApplyPreset('old')}>old</button>
                    </div>
                </div>
                <div className="mass-edit-divider"></div>
                <div className="mass-edit-section">
                    <p>Or, add/update a custom property.</p>
                    <div className="input-group">
                        <label>Property Name</label>
                        <input type="text" value={key} onChange={e => setKey(e.target.value)} placeholder="e.g., data-color" />
                    </div>
                    <div className="input-group">
                        <label>Property Value</label>
                        <input type="text" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g., blue" />
                    </div>
                </div>
            </div>
            <div className="mass-edit-footer">
                <button className="btn ghost" onClick={onClear}>Clear Selection</button>
                <button className="btn" onClick={() => onApplyCustom(key, value)} disabled={!key.trim()}>Apply Custom</button>
            </div>
        </div>
    );
};

const ProgressiveImage = ({ lowResSrc, initialBitmap, highResPath, alt }) => {
    const [highResSvgUrl, setHighResSvgUrl] = useState(null);
    const canvasRef = useRef(null);
    useEffect(() => {
        setHighResSvgUrl(null);
        const canvas = canvasRef.current;
        if (canvas && initialBitmap) {
            canvas.width = initialBitmap.width;
            canvas.height = initialBitmap.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(initialBitmap, 0, 0);
        }
    }, [initialBitmap]);
    useEffect(() => {
        let isCancelled = false; let objectUrl = null;
        const loadHighRes = async () => {
            try {
                const file = dc.app.vault.getAbstractFileByPath(highResPath);
                if (!file) return;
                const svgText = await dc.app.vault.read(file);
                const blob = new Blob([svgText], { type: 'image/svg+xml' });
                objectUrl = URL.createObjectURL(blob);
                if (!isCancelled) { setHighResSvgUrl(objectUrl); }
            } catch (err) { console.error("Failed to load high-res image:", err); }
        };
        loadHighRes();
        return () => { isCancelled = true; if (objectUrl) { URL.revokeObjectURL(objectUrl); } };
    }, [highResPath]);
    const isFinal = !!highResSvgUrl;
    return (
        <div className="progressive-image-container">
            <img src={lowResSrc} alt={alt} className="panel-img low-res" style={{ opacity: isFinal ? 0 : 1 }} />
            <canvas ref={canvasRef} className="panel-img med-res" style={{ opacity: isFinal ? 0 : 1 }} />
            {highResSvgUrl && (<img src={highResSvgUrl} alt={alt} className="panel-img high-res" style={{ opacity: isFinal ? 1 : 0 }} />)}
        </div>
    );
};

const ZoomableImage = ({ lowResUrl, initialBitmap, highResPath, alt }) => {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [panning, setPanning] = useState(false);
    const last = useRef({ x: 0, y: 0 });
    const MIN = 1, MAX = 8;
    useEffect(() => { setScale(1); setPos({ x: 0, y: 0 }); }, [highResPath]);
    useEffect(() => { if (contentRef.current) { contentRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${scale})`; } }, [scale, pos]);
    const zoomAt = (factor, cx, cy) => {
        const rect = containerRef.current.getBoundingClientRect();
        const mx = cx === undefined ? rect.width / 2 : cx - rect.left;
        const my = cy === undefined ? rect.height / 2 : cy - rect.top;
        const prev = scale; const next = Math.max(MIN, Math.min(MAX, prev * factor)); const s = next / prev;
        const dx = (pos.x - (mx - rect.width / 2)) * s + (mx - rect.width / 2);
        const dy = (pos.y - (my - rect.height / 2)) * s + (my - rect.height / 2);
        setScale(next); setPos({ x: dx, y: dy });
    };
    const onWheel = (e) => { e.preventDefault(); if (e.ctrlKey || e.metaKey) { const factor = Math.exp(-e.deltaY * 0.0015); zoomAt(factor, e.clientX, e.clientY); } else { setPos((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY })); } };
    const onPointerDown = (e) => { if (e.target.closest('button')) return; setPanning(true); last.current = { x: e.clientX, y: e.clientY }; containerRef.current.setPointerCapture?.(e.pointerId); };
    const onPointerMove = (e) => { if (!panning) return; const dx = e.clientX - last.current.x; const dy = e.clientY - last.current.y; last.current = { x: e.clientX, y: e.clientY }; setPos((p) => ({ x: p.x + dx, y: p.y + dy })); };
    const onPointerUp = (e) => { if (!panning) return; setPanning(false); containerRef.current.releasePointerCapture?.(e.pointerId); };
    const handleZoomIn = (e) => { e.stopPropagation(); zoomAt(1.4); };
    const handleZoomOut = (e) => { e.stopPropagation(); zoomAt(1 / 1.4); };
    const handleReset = (e) => { e.stopPropagation(); setScale(1); setPos({ x: 0, y: 0 }); };
    return (
        <div ref={containerRef} className="zoom-container" onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onDoubleClick={(e) => zoomAt(1.5, e.clientX, e.clientY)}>
            <div ref={contentRef} className="zoom-content-wrapper">
                <ProgressiveImage lowResSrc={lowResUrl} initialBitmap={initialBitmap} highResPath={highResPath} alt={alt} />
            </div>
            <div className="zoom-controls">
                <button className="panel-icon-btn" onClick={handleZoomOut} title="Zoom Out"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                <button className="panel-icon-btn" onClick={handleReset} title="Reset Zoom"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /></svg></button>
                <button className="panel-icon-btn" onClick={handleZoomIn} title="Zoom In"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
            </div>
        </div>
    );
};


const viewStyling = `
/* --- STYLES --- */
.tags-panel { position: absolute; top: 110%; left: 0; max-height: 300px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 8px; width: 400px; background: rgba(30, 20, 35, 0.9); border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 8px; padding: 12px; z-index: 20; }
.tag-btn { all: unset; box-sizing: border-box; cursor: pointer; padding: 6px 12px; border-radius: 14px; background: rgba(255,255,255,0.1); font-size: 13px; transition: all .2s; }
.tag-btn:hover { background: rgba(135, 88, 255, 0.4); color: white; }
.tag-btn-toggle.active { color: #87ffc5; background: rgba(135, 255, 197, 0.15); box-shadow: 0 0 8px rgba(135, 255, 197, 0.5); }
.full-tab-wrapper { position: relative; height: 100%; width: 100%; background: #0f0a12; border-radius: 10px; overflow: hidden; }
.interactive-canvas { display: block; width: 100%; height: 100%; cursor: default; touch-action: none; background-color: #0f0a12; }
.overlay { position: absolute; inset: 0; pointer-events: none; }
.subtle-icon { position: absolute; top: 14px; right: 18px; color: rgba(200, 180, 220, 0.6); cursor: pointer; opacity: 0.5; transform: scale(.95); transition: all .2s; z-index: 10; pointer-events: auto; }
.full-tab-wrapper:hover .subtle-icon { opacity: 1; transform: scale(1); }
.fullscreen-active { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 9998; }
.panel-wrap { box-sizing: border-box; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(12px) saturate(1.2); pointer-events: auto; animation: fadeIn 0.4s cubic-bezier(0.25, 1, 0.5, 1); z-index: 100; padding: 2.5rem; }
.panel { display: flex; flex-direction: column; width: min(100%, 95vw); max-width: 1200px; height: min(100%, 90vh); background: rgba(24, 15, 28, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; box-shadow: 0 0 80px -20px rgba(200, 160, 255, 0.3); animation: scaleIn 0.4s cubic-bezier(0.25, 1, 0.5, 1); overflow: hidden; }
.panel-img-box { flex-grow: 1; position: relative; background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03), transparent 70%); }
.panel-img { display: block; width: 100%; height: 100%; object-fit: contain; }
.panel-controls { display: flex; align-items: center; gap: 16px; padding: 12px 24px; border-top: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }
.panel-info { flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.panel-title { font-size: 16px; font-weight: 600; color: rgba(230, 210, 255, 0.95); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.panel-row { font-size: 12px; color: rgba(200, 180, 220, 0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.panel-tags { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 4px; }
.panel-tag { background: rgba(255, 255, 255, 0.1); color: rgba(200, 180, 220, 0.8); padding: 3px 8px; font-size: 11px; border-radius: 10px; font-weight: 500; }
.btn-group { display: flex; gap: 10px; }
.panel-icon-btn { all: unset; box-sizing: border-box; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.05); color: rgba(200, 180, 220, 0.6); cursor: pointer; transition: all 0.2s; }
.panel-icon-btn:hover { background: rgba(255,255,255,0.1); color: rgba(230, 210, 255, 0.95); }
.panel-icon-btn.danger:hover { color: #ff8080; }
.panel-icon-btn.active { color: #87ffc5; }
.compact-wrapper { padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; border: 1px dashed var(--background-modifier-border); border-radius: 8px; background-color: var(--background-primary-alt); }
.compact-controls .btn { padding: 10px 14px; font-size: 12px; border-radius: 12px; border: 1px solid rgba(200, 160, 255, .35); background: rgba(22, 15, 28, .9); color: rgb(200, 160, 255); }
.compact-controls .btn.ghost { border-color: rgba(200, 160, 255, .2); background: transparent; color: rgba(200, 160, 255, .85); }
.zoom-container { position: relative; width: 100%; height: 100%; overflow: hidden; cursor: grab; }
.zoom-container:active { cursor: grabbing; }
.zoom-content-wrapper { width: 100%; height: 100%; will-change: transform; transform-origin: center center; position: relative; }
.zoom-controls { position: absolute; right: 16px; bottom: 16px; display: flex; gap: 8px; pointer-events: auto; background: rgba(24, 15, 28, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 4px; backdrop-filter: blur(8px); }
.progressive-image-container { width: 100%; height: 100%; }
.progressive-image-container .panel-img { position: absolute; top:0; left:0; width:100%; height:100%; will-change: opacity; transition: opacity 0.4s ease-in-out; padding: 16px; box-sizing: border-box; }
.progressive-image-container .low-res { filter: blur(12px); transform: scale(1.05); }
.progressive-image-container .med-res { object-fit: contain; }
.progressive-image-container .high-res { opacity: 0; }
@keyframes glow-animation { 0% { box-shadow: 0 0 8px rgba(170, 130, 255, 0.4); } 50% { box-shadow: 0 0 16px rgba(170, 130, 255, 0.7); } 100% { box-shadow: 0 0 8px rgba(170, 130, 255, 0.4); } }
.image-gallery-searchbar { position: absolute; top: 0; left: 0; display: flex; align-items: center; gap: 8px; background: rgba(24, 15, 28, 0.75); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); z-index: 10; touch-action: none; user-select: none; pointer-events: auto; border-radius: 22px; padding: 6px 8px; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s, border-radius 0.3s, box-shadow 0.3s, height 0.3s; }
.image-gallery-searchbar.collapsed { width: 40px; height: 40px; box-sizing: border-box; cursor: pointer; animation: glow-animation 3s infinite ease-in-out; padding: 4px; }
.image-gallery-searchbar.collapsed:hover { box-shadow: 0 0 18px rgba(190, 160, 255, 0.8); animation-play-state: paused; }
.image-gallery-searchbar > * { transition: opacity 0.2s, width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s; }
.image-gallery-searchbar .action-menu-icon { color: rgba(200, 180, 220, 0.6); flex-shrink: 0; cursor: move; box-sizing: border-box; width: 32px; height: 32px; display: grid; place-items: center; }
.image-gallery-searchbar.collapsed .action-menu-icon { color: rgba(200, 180, 220, 0.8); width: 100%; height: 100%; }
.image-gallery-searchbar input { all: unset; width: 120px; color: rgba(230, 210, 255, 0.95); cursor: text; user-select: text; padding: 0 4px; }
.image-gallery-searchbar.collapsed > *:not(.action-menu-icon) { width: 0; opacity: 0; pointer-events: none; white-space: nowrap; transform: scaleX(0); margin-left: -8px; }
.image-gallery-searchbar .clear-btn { all: unset; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.1); color: rgba(200, 180, 220, 0.6); cursor: pointer; }
.image-gallery-searchbar .select-btn { all: unset; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.05); color: rgba(200, 180, 220, 0.6); cursor: pointer; transition: all 0.2s; }
.image-gallery-searchbar .select-btn:hover { background: rgba(255,255,255,0.15); }
.image-gallery-searchbar .select-btn.active { color: #87ffc5; background: rgba(135, 255, 197, 0.15); box-shadow: 0 0 8px rgba(135, 255, 197, 0.5); }
.search-bar-divider { width: 1px; height: 18px; background: rgba(255, 255, 255, 0.1); margin: 0 4px; }
.dropdown-container, .dropdown-menu, .select-btn { pointer-events: auto; }
.dropdown-container { position: relative; }
.dropdown-btn { all: unset; display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 16px; background: rgba(255,255,255,0.05); color: rgba(200, 180, 220, 0.7); cursor: pointer; transition: all .2s; }
.dropdown-btn:hover { background: rgba(255,255,255,0.15); color: rgba(230, 210, 255, 0.95); }
.dropdown-menu { position: absolute; top: 110%; left: 0; background: rgba(30, 20, 35, 0.9); border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 8px; padding: 6px; z-index: 20; min-width: 180px; }
.dropdown-item { padding: 8px 12px; border-radius: 6px; cursor: pointer; color: rgba(200, 180, 220, 0.8); font-size: 13px; }
.dropdown-item.with-icon { display: flex; align-items: center; gap: 8px; }
.dropdown-item:hover { background: rgba(255,255,255,0.1); color: white; }
.dropdown-item.active { background: rgba(135, 88, 255, 0.3); color: white; font-weight: 500; }
.search-no-results { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 12px 20px; background: rgba(24, 15, 28, 0.85); border-radius: 8px; color: #ccc; z-index: 5; }
.mass-edit-panel { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); width: clamp(300px, 50vw, 500px); background: rgba(30, 20, 35, 0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; backdrop-filter: blur(12px); z-index: 20; pointer-events: auto; animation: fadeIn 0.3s; color: #eee; }
.mass-edit-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.mass-edit-header h3 { margin: 0; font-size: 16px; }
.mass-edit-header .close-btn { all: unset; cursor: pointer; font-size: 20px; color: #999; }
.mass-edit-body { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.mass-edit-section p { font-size: 13px; color: #aaa; margin: 0 0 12px; }
.input-group { margin-bottom: 12px; }
.input-group label, .mass-edit-section > label { display: block; font-size: 12px; color: #ccc; margin-bottom: 6px; }
.input-group input { width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: #eee; padding: 8px; border-radius: 4px; }
.mass-edit-presets { display: flex; gap: 10px; flex-wrap: wrap; }
.preset-btn { all: unset; box-sizing: border-box; cursor: pointer; padding: 6px 12px; border-radius: 14px; background: rgba(255,255,255,0.1); font-size: 13px; transition: all .2s; }
.preset-btn:hover { background: rgba(255,255,255,0.2); color: white; }
.mass-edit-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0; }
.mass-edit-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.1); }
.mass-edit-footer .btn { all: unset; box-sizing: border-box; cursor: pointer; padding: 8px 16px; border-radius: 6px; background: #8758FF; color: white; transition: background 0.2s; }
.mass-edit-footer .btn:disabled { background: #555; cursor: not-allowed; }
.mass-edit-footer .btn.ghost { background: transparent; border: 1px solid #888; color: #ccc; }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes scaleIn { from { transform: scale(.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }`;


const ConsentScreen = ({ onAccept }) => {
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Enter') {
                onAccept();
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [onAccept]);

    const style = `
    /* -- Animation Keyframes -- */
    @keyframes pulse-dot {
        0% { box-shadow: 0 0 6px #bf3fff, 0 0 12px rgba(191,63,255,.5); }
        50% { box-shadow: 0 0 10px #bf3fff, 0 0 20px rgba(191,63,255,.7); }
        100% { box-shadow: 0 0 6px #bf3fff, 0 0 12px rgba(191,63,255,.5); }
    }

    @keyframes draw-arrow {
        from { stroke-dashoffset: 24; }
        to { stroke-dashoffset: 0; }
    }

    /* -- Main Styles -- */
    .consent-wrap{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;
        background:#000;color:#fff;font-family:"IBM Plex Mono",monospace;overflow:hidden}
    .consent-wrap:before{content:"";position:absolute;inset:-30%;background:
        radial-gradient(circle at 50% 0%, rgba(191,63,255,0.04), transparent 40%);
        pointer-events:none}
    .consent-wrap:after{content:"";position:absolute;inset:0;
        background:repeating-linear-gradient(0deg,rgba(255,255,255,.008) 0px,rgba(255,255,255,.008) 1px,transparent 1px,transparent 2px);
        mix-blend:overlay;pointer-events:none}
    .card{position:relative;width:min(600px,90vw);border-radius:12px;padding:30px;
        backdrop-filter:blur(20px) saturate(1.1);
        background:rgba(10,10,10,.8);
        border:1px solid rgba(255,255,255,.1);
        box-shadow:0 20px 60px rgba(0,0,0,.8);
        transition: border-color .3s ease, box-shadow .3s ease;
    }
    .card:hover {
        border-color: rgba(191,63,255,.3);
        box-shadow:0 20px 60px rgba(0,0,0,.9), 0 0 25px rgba(191,63,255,.15);
    }
    .title{display:flex;align-items:center;gap:10px;font-size:11px;letter-spacing:.18em;
        text-transform:uppercase;color:#888;margin-bottom:20px;}
    .title .dot{width:6px;height:6px;border-radius:50%;background:#bf3fff;
        animation: pulse-dot 3s ease-in-out infinite;}
    .headline{margin:0 0 10px 0;font-size:22px;line-height:1.3;
        color:#eee;letter-spacing:.1em;
        font-variant: small-caps;}
    .sub{color:#999;font-size:13px;line-height:1.7;margin-bottom:25px;
        font-variant: small-caps;} /* <<< CORRECTION APPLIED HERE */
    
    .meta-info{display:flex;flex-direction:column;gap:8px;margin-bottom:30px;
        font-size:16px;letter-spacing:.05em;color:#777;
        font-variant: small-caps;}
    .meta-info span { color: #bbb; }
        
    .cta-row{display:flex;align-items:center;justify-content:center;margin-top:15px}
    .cta{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:10px;padding:13px 22px;border-radius:10px;
        color:#aaa;background:transparent;
        border:1px solid rgba(255,255,255,.2);
        font-weight:600;letter-spacing:.1em;
        font-variant: small-caps;
        transition: all .2s ease;
    }
    .cta:hover{
        transform:translateY(-2px);
        color:#fff;
        background: rgba(191,63,255,.1);
        border-color: rgba(191,63,255,.5);
        box-shadow: 0 0 15px rgba(191,63,255,.3);
    }
    .cta .arrow-icon {stroke:#aaa;width:15px;height:15px;transition:stroke .2s ease, transform .2s ease;}
    .cta:hover .arrow-icon {stroke:#fff;}
    .cta .arrow-icon path {stroke-dasharray: 24;stroke-dashoffset: 24;}
    .cta:hover .arrow-icon path {animation: draw-arrow 0.3s ease-out forwards;}

    /* --- CHANGE: Added styles for the new height toggle --- */
.gallery-container-minified {
    height: 180px !important; /* The desired "perfect" height for the collapsed view */
    min-height: 120px;
    transition: height 0.3s ease-in-out;
}
.gallery-container-expanded {
    height: 100%;
}
.full-tab-wrapper {
    /* Ensure the wrapper uses the container's height */
    height: 100%; 
}


    `
    return (
        <div className="consent-wrap">
            <style>{style}</style>
            <div className="card">
                <div className="title"><span className="dot" />System // Resource Allocation</div>
                <div className="headline">Initiate Protocol?</div>
                {/* Text is now sentence case for the effect to work */}
                <div className="sub">
                    Converting Drawings. Local processing will commence upon confirmation.
                </div>

                <div className="meta-info">
                    <div>Est. Duration: <span>&lt; 5 Minutes</span></div>
                    <div>Footprint: <span>&lt; 1 GB</span></div>
                </div>

                <div className="cta-row">
                    <button className="cta" onClick={onAccept}>
                        Confirm // Engage
                        <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M13 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

// --- 5. Main Component (Corrected and Integrated) ---

const AssetsLibrary = () => {
    // Path to store the consent confirmation
    const CONSENT_FILE_PATH = ".datacore/image-gallery/consent.json";

    // State now starts at null to indicate we're checking for consent
    const [hasConsented, setHasConsented] = useState(null);
    const [isFullTab, setIsFullTab] = useState(true);
    const [panel, setPanel] = useState(null);
    const [removedImages, setRemovedImages] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('path_asc');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPaths, setSelectedPaths] = useState(new Set());
    const [viewType, setViewType] = useState('grid');
    const [fileListVersion, setFileListVersion] = useState(0);
    const [resetViewKey, setResetViewKey] = useState(0);

    const [imageFiles, setImageFiles] = useState(null);
    const [potentialMdFileCount, setPotentialMdFileCount] = useState(0);

    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionInitialPositions, setTransitionInitialPositions] = useState(null);
    const graphNodesRef = useRef(null);

    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const interactingUntilRef = useRef(0);
    const onCacheUpdateRef = useRef(() => { });

    const { status: converterStatus, error: converterError, logs: converterLogs, runConversionCheck } = useExcalidrawConverter();

    // Check for persisted consent status when the component mounts
    useEffect(() => {
        const checkConsent = async () => {
            try {
                if (await dc.app.vault.adapter.exists(CONSENT_FILE_PATH)) {
                    const content = await dc.app.vault.adapter.read(CONSENT_FILE_PATH);
                    const data = JSON.parse(content || "{}");
                    setHasConsented(data.consented === true);
                } else {
                    setHasConsented(false);
                }
            } catch (err) {
                console.error("Error checking consent status:", err);
                setHasConsented(false); // Default to false if there's an error
            }
        };
        checkConsent();
    }, []);

    // This function now saves the consent to a file and updates the state
    const handleConsent = async () => {
        try {
            const dir = CONSENT_FILE_PATH.substring(0, CONSENT_FILE_PATH.lastIndexOf("/"));
            if (!(await dc.app.vault.adapter.exists(dir))) {
                await dc.app.vault.adapter.mkdir(dir);
            }
            await dc.app.vault.adapter.write(CONSENT_FILE_PATH, JSON.stringify({ consented: true }, null, 2));
            setHasConsented(true);
        } catch (err) {
            console.error("Error saving consent:", err);
            new Notice("Could not save consent preference.");
            // Allow the user to proceed for the current session even if saving fails
            setHasConsented(true);
        }
    };


    useEffect(() => {
        if (!hasConsented) return;
        if (converterStatus === 'ready') {
            runConversionCheck((newFilesCreated) => {
                if (newFilesCreated) {
                    setFileListVersion(v => v + 1);
                }
            });
        }
    }, [converterStatus, runConversionCheck, hasConsented]);

    useEffect(() => {
        if (!hasConsented || converterStatus !== 'ready') return;
        const handleFileChange = (file) => {
            if (file.path.startsWith(FOLDER_PATH) && file.extension === 'md') {
                console.log(`Detected change in ${file.path}, triggering conversion check.`);
                runConversionCheck((newFilesCreated) => {
                    if (newFilesCreated) {
                        setFileListVersion(v => v + 1);
                    }
                });
            }
        };
        const eventRef = dc.app.metadataCache.on('changed', handleFileChange);
        return () => dc.app.metadataCache.offref(eventRef);
    }, [converterStatus, runConversionCheck, hasConsented]);

    const sortOptions = [{ value: "path_asc", label: "Path (A-Z)" }, { value: "path_desc", label: "Path (Z-A)" }, { value: "name_asc", label: "Name (A-Z)" }, { value: "name_desc", label: "Name (Z-A)" }, { value: "mtime_desc", label: "Date Modified (Newest)" }, { value: "mtime_asc", label: "Date Modified (Oldest)" }, { value: "ctime_desc", label: "Date Created (Newest)" }, { value: "ctime_asc", label: "Date Created (Oldest)" }, { value: "size_desc", label: "Size (Largest)" }, { value: "size_asc", label: "Size (Smallest)" }];

    useEffect(() => {
        if (!hasConsented) return;
        try {
            const allFiles = dc.app.vault.getFiles();
            const filesInPath = allFiles.filter(file => file.path.startsWith(FOLDER_PATH));

            const svgFiles = filesInPath.filter(file => file.extension === 'svg');
            const mdFiles = new Set(filesInPath.filter(f => f.extension === 'md').map(f => f.path.replace(/\.md$/i, '')));
            const svgBasePaths = new Set(svgFiles.map(f => f.path.replace(/\.svg$/i, '')));

            let potentialCount = 0;
            for (const mdBasePath of mdFiles) {
                if (!svgBasePaths.has(mdBasePath)) {
                    potentialCount++;
                }
            }
            setPotentialMdFileCount(potentialCount);
            setImageFiles(svgFiles);

        } catch (e) {
            console.error("[Image Gallery] CRITICAL ERROR during file search:", e);
            new Notice("Could not load SVG files.", 5000);
            setImageFiles([]);
            setPotentialMdFileCount(0);
        }
    }, [fileListVersion, hasConsented]);

    const visibleImageFiles = useMemo(() => {
        if (!imageFiles) return [];
        if (!removedImages || removedImages.size === 0) return imageFiles;
        return imageFiles.filter(f => !removedImages.has(f.path));
    }, [imageFiles, removedImages]);

    const sortedAndVisibleImageFiles = useMemo(() => {
        const [key, direction] = sortOption.split('_');
        const sorted = [...visibleImageFiles];
        sorted.sort((a, b) => { let valA, valB; switch (key) { case 'mtime': valA = a.stat.mtime; valB = b.stat.mtime; break; case 'ctime': valA = a.stat.ctime; valB = b.stat.ctime; break; case 'size': valA = a.stat.size; valB = b.stat.size; break; case 'name': valA = a.basename.toLowerCase(); valB = b.basename.toLowerCase(); break; default: valA = a.path.toLowerCase(); valB = b.path.toLowerCase(); break; } if (typeof valA === 'string') { return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA); } else { return direction === 'asc' ? valA - valB : valB - valA; } });
        return sorted;
    }, [visibleImageFiles, sortOption]);

    const [imageTagsMap, setImageTagsMap] = useState(new Map());
    useEffect(() => {
        if (!hasConsented) return;
        const timer = setTimeout(() => {
            const map = new Map();
            const pathToMdPath = (svgPath) => svgPath.replace(/\.svg$/i, '.md');
            const tagKeys = ['A888a', 'data-aaa-tags', 'tags'];
            for (const file of visibleImageFiles) {
                const mdPath = pathToMdPath(file.path);
                const mdFile = dc.app.vault.getAbstractFileByPath(mdPath);
                if (mdFile) {
                    const cache = dc.app.metadataCache.getFileCache(mdFile);
                    const fm = cache?.frontmatter;
                    if (fm) {
                        const fileTags = new Set();
                        tagKeys.forEach(key => {
                            const val = fm[key];
                            if (val) {
                                const tagsToAdd = Array.isArray(val) ? val : String(val).split(/, ?/);
                                tagsToAdd.forEach(tag => { if (typeof tag === 'string' && tag.trim()) fileTags.add(tag.trim()); });
                            }
                        });
                        if (fileTags.size > 0) map.set(file.path, Array.from(fileTags));
                    }
                }
            }
            setImageTagsMap(map);
        }, 100);
        return () => clearTimeout(timer);
    }, [visibleImageFiles, hasConsented]);

    const matchingImagePaths = useMemo(() => {
        if (!searchTerm) return new Set();
        const lowerCaseTerm = searchTerm.toLowerCase();
        const filtered = sortedAndVisibleImageFiles.filter(file => {
            if (file.path.toLowerCase().includes(lowerCaseTerm)) return true;
            const tags = imageTagsMap.get(file.path);
            if (tags) { return tags.some(tag => tag.toLowerCase().includes(lowerCaseTerm)); }
            return false;
        });
        return new Set(filtered.map(f => f.path));
    }, [sortedAndVisibleImageFiles, searchTerm, imageTagsMap]);

    const isSearching = searchTerm.length > 0;

    const { imageCache, requestImages, workerError, requestedSet } = useImageWorker(sortedAndVisibleImageFiles, () => onCacheUpdateRef.current());
    const bgQueueRef = useRef([]);
    const bgRunningRef = useRef(false);
    const cancelledRef = useRef(false);

    const startBackgroundPreload = useCallback(() => {
        if (bgRunningRef.current) return;
        bgRunningRef.current = true;
        cancelledRef.current = false;
        const schedule = (fn) => ('requestIdleCallback' in window) ? window.requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 200);
        const refill = () => {
            const queuedOrRequested = new Set([...bgQueueRef.current.map(f => f.path), ...requestedSet]);
            for (const f of sortedAndVisibleImageFiles) { if (!queuedOrRequested.has(f.path) && !imageCache.has(f.path)) { bgQueueRef.current.push(f); } }
        };
        const pump = async () => {
            if (cancelledRef.current) { bgRunningRef.current = false; return; }
            if (performance.now() < interactingUntilRef.current) { schedule(pump); return; }
            refill();
            const batch = [];
            while (bgQueueRef.current.length > 0 && batch.length < 24) {
                const f = bgQueueRef.current.shift();
                if (!f || imageCache.has(f.path) || requestedSet.has(f.path)) continue;
                batch.push(f);
            }
            if (batch.length > 0) requestImages(batch, false);
            if (bgQueueRef.current.length === 0 && Array.from(requestedSet).every(p => imageCache.has(p))) { bgRunningRef.current = false; return; }
            schedule(pump);
        };
        schedule(pump);
    }, [sortedAndVisibleImageFiles, requestImages, imageCache, requestedSet]);

    useEffect(() => {
        if (!hasConsented) return;
        startBackgroundPreload();
        const visListener = () => { if (document.visibilityState === 'visible') startBackgroundPreload(); };
        document.addEventListener('visibilitychange', visListener);
        return () => { cancelledRef.current = true; document.removeEventListener('visibilitychange', visListener); };
    }, [startBackgroundPreload, hasConsented]);

    const allUniqueTags = useMemo(() => {
        const tagSet = new Set();
        for (const tags of imageTagsMap.values()) {
            for (const tag of tags) { tagSet.add(tag); }
        }
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    }, [imageTagsMap]);

    useFullscreenEffect(containerRef, isFullTab);
    const pathToMdPath = (svgPath) => svgPath.replace(/\.svg$/i, '.md');
    const onCardClick = useCallback(async (panelData) => {
        if (!imageFiles) return;
        const mdPath = pathToMdPath(panelData.path);
        const mdFile = dc.app.vault.getAbstractFileByPath(mdPath);
        let tags = [];
        if (mdFile) {
            const cache = dc.app.metadataCache.getFileCache(mdFile);
            const fm = cache?.frontmatter;
            if (fm) {
                const tagSet = new Set();
                ['tags', 'A888a', 'data-aaa-tags'].forEach(key => {
                    const val = fm[key];
                    if (val) { (Array.isArray(val) ? val : String(val).split(/, ?/)).forEach(tag => { if (typeof tag === 'string' && tag.trim()) tagSet.add(tag.trim()); }); }
                });
                tags = Array.from(tagSet);
            }
        }
        setPanel({ ...panelData, tags });
    }, [imageFiles]);

    const handleViewChange = useCallback((newView) => {
        if (viewType === 'graph' && newView === 'grid' && graphNodesRef.current) {
            const positions = new Map(
                graphNodesRef.current.map(node => [node.file.path, { x: node.x, y: node.y }])
            );
            setTransitionInitialPositions(positions);
            setIsTransitioning(true);
        } else {
            setTransitionInitialPositions(null);
        }
        setViewType(newView);
    }, [viewType]);

    const handleTransitionEnd = useCallback(() => {
        setIsTransitioning(false);
        setTransitionInitialPositions(null);
    }, []);

    const handleTagSearch = useCallback((tag) => {
        if (searchTerm === tag) { setSearchTerm(''); }
        else { setSearchTerm(tag); }
    }, [searchTerm]);

    const handleToggleSelection = useCallback((path) => { const newSelection = new Set(selectedPaths); if (newSelection.has(path)) { newSelection.delete(path); } else { newSelection.add(path); } setSelectedPaths(newSelection); }, [selectedPaths]);
    const handleToggleSelectionMode = () => { if (isSelectionMode) { setSelectedPaths(new Set()); } setIsSelectionMode(!isSelectionMode); };
    useEffect(() => { const handleKeydown = (e) => { if (e.key === "Escape") { if (panel) { setPanel(null); } else if (selectedPaths.size > 0) { setSelectedPaths(new Set()); } else if (isSelectionMode) { setIsSelectionMode(false); } else if (searchTerm) { setSearchTerm(''); } } }; window.addEventListener("keydown", handleKeydown); return () => window.removeEventListener("keydown", handleKeydown); }, [panel, searchTerm, isSelectionMode, selectedPaths]);
    useEffect(() => { const handleSearchShortcut = (e) => { if (e.key === 'f' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); searchInputRef.current?.focus(); } }; window.addEventListener('keydown', handleSearchShortcut); return () => window.removeEventListener('keydown', handleSearchShortcut); }, []);

    useEffect(() => {
        if (!hasConsented) return;
        Core.loadRemovedImagePaths().then(setRemovedImages);
    }, [hasConsented]);

    const ensureMarkdownTwin = async (svgPath) => {
        const mdPath = pathToMdPath(svgPath);
        let mdFile = dc.app.vault.getAbstractFileByPath(mdPath);
        if (!mdFile || mdFile.extension !== 'md') {
            try { await dc.app.vault.create(mdPath, `---\n---\n`); mdFile = dc.app.vault.getAbstractFileByPath(mdPath); }
            catch (e) { console.error(`Failed to create ${mdPath}:`, e); new Notice(`Could not create ${mdPath}`, 4000); return null; }
        }
        return mdFile;
    };
    const modifyFrontmatter = async (paths, modificationFn) => {
        new Notice(`Applying properties to ${paths.size} images...`, 3000);
        let successCount = 0;
        try {
            for (const svgPath of paths) {
                const mdFile = await ensureMarkdownTwin(svgPath);
                if (!mdFile) continue;
                await dc.app.fileManager.processFrontMatter(mdFile, modificationFn);
                successCount++;
            }
            new Notice(`Successfully updated ${successCount} of ${paths.size} images.`, 4000);
        } catch (err) { console.error("Error during mass frontmatter edit:", err); new Notice("An error occurred during the update process. Check console.", 5000); }
        setSelectedPaths(new Set()); setIsSelectionMode(false); setFileListVersion(v => v + 1);
    };
    const handleApplyListPreset = async (listKey, presetValue) => { modifyFrontmatter(selectedPaths, (fm) => { fm[listKey] = fm[listKey] || []; if (!Array.isArray(fm[listKey])) { fm[listKey] = [fm[listKey]]; } const set = new Set(fm[listKey]); set.add(presetValue); fm[listKey] = Array.from(set); }); };
    const handleApplyPreset = async (presetValue) => { await handleApplyListPreset('data-aaa-tags', presetValue); };
    const handleApplyA888a = async (presetValue) => { await handleApplyListPreset('A888a', presetValue); };
    const handleApplyCustom = async (key, value) => { if (!key.trim()) return; modifyFrontmatter(selectedPaths, (fm) => { fm[key.trim()] = value.trim(); }); };
    const handleExitFullTab = (e) => { e.stopPropagation(); setIsFullTab(false) }, handleEnterFullTab = () => setIsFullTab(true), handleToggleHide = () => { if (!panel?.path) return; const e = new Set(removedImages); e.has(panel.path) ? e.delete(panel.path) : e.add(panel.path), setRemovedImages(e), Core.saveRemovedImagePaths(e) }, restoreAllHidden = async () => { const e = new Set; setRemovedImages(e), await Core.saveRemovedImagePaths(e), new Notice("Restored all hidden images", 2e3) }, handleCopyMarkdown = () => { if (!panel?.path) return; const e = panel.path.split("/").pop().replace(".svg", ""); navigator.clipboard.writeText(`![[${e}]]`), new Notice("Copied Markdown link!", 2e3) }, handleCopySvgContent = async () => { if (!panel?.path || !imageFiles) return; const e = imageFiles.find(e => e.path === panel.path); if (!e) return; const t = await dc.app.vault.read(e); navigator.clipboard.writeText(t), new Notice("Copied SVG content!", 2e3) }, handleCopyFile = async () => { if (!panel?.path || !imageFiles) return; try { const e = imageFiles.find(e => e.path === panel.path); if (!e) throw new Error("File not found"); const t = await dc.app.vault.read(e), r = (new DOMParser).parseFromString(t, "image/svg+xml"), s = r.documentElement; if (s.tagName.toLowerCase().includes("parsererror")) throw new Error("Failed to parse SVG."); if (!s.getAttribute("width") || !s.getAttribute("height")) { const e = s.getAttribute("viewBox"); if (e) { const t = e.trim().split(/\s+/); 4 === t.length && (s.getAttribute("width") || s.setAttribute("width", t[2]), s.getAttribute("height") || s.setAttribute("height", t[3])) } } const a = (new XMLSerializer).serializeToString(r), o = new Blob([a], { type: "image/svg+xml" }); await navigator.clipboard.write([new ClipboardItem({ "image/svg+xml": o })]), new Notice("Copied file to clipboard!", 2e3) } catch (e) { console.error("Failed to copy file:", e), new Notice("Could not copy file.", 3e3) } };

    // While checking for consent, render a blank screen to avoid flicker
    if (hasConsented === null) {
        return <div style={{ height: '100%', width: '100%', background: '#0f0a12' }}></div>;
    }

    // If consent has not been given, show the consent screen
    if (!hasConsented) {
        return <ConsentScreen onAccept={handleConsent} />;
    }

    if (converterStatus === 'loading') {
        return <ConverterLoadingView logs={converterLogs} />;
    }
    if (converterStatus === 'error') {
        return <ConverterErrorView error={converterError} />;
    }

    if (imageFiles === null) {
        return (<div style={{ padding: '16px', textAlign: 'center' }}><p>Scanning for images...</p></div>);
    }

    if (workerError) { return (<div style={{ padding: '16px', textAlign: 'center' }}><p style={{ color: '#ff8a8a' }}>Worker Failed</p><p style={{ color: '#aaa', fontSize: '12px' }}>{workerError}</p></div>) }

    if (imageFiles.length === 0 && potentialMdFileCount === 0 && isFullTab) {
        return (
            <div style={{ padding: '16px', textAlign: 'center', height: '100%', display: 'grid', placeContent: 'center' }}>
                <p>No SVG or Excalidraw files found in</p>
                <p style={{ color: '#888', fontSize: '12px' }}>{FOLDER_PATH}</p>
                <p style={{ color: '#aaa', fontSize: '12px', marginTop: '20px' }}>Add .svg or .md Excalidraw files to this folder to see them here.</p>
            </div>
        );
    }

    if (visibleImageFiles.length === 0 && imageFiles.length > 0 && isFullTab) { return (<div style={{ padding: '16px', textAlign: 'center' }}><p>All images hidden.</p><button className="btn" onClick={restoreAllHidden}>Restore All</button></div>) }

    const viewProps = {
        isFullTab, onCardClick, imagesToDisplay: sortedAndVisibleImageFiles,
        a888aTagsMap: imageTagsMap,
        isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection: handleToggleSelection,
        imageCache, requestImages, requestedSet, onCacheUpdate: onCacheUpdateRef, interactingUntilRef,
        resetViewKey
    };

    return (
        <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
            <style>{`${viewStyling}`}</style>
            {isFullTab ? (
                <div className="full-tab-wrapper">
                    <span className="subtle-icon" title="Exit Full View" onClick={handleExitFullTab}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg></span>

                    {viewType === 'grid' && <GridView {...viewProps} isTransitioning={isTransitioning} initialPositions={transitionInitialPositions} onTransitionEnd={handleTransitionEnd} />}
                    {viewType === 'graph' && <GraphView {...viewProps} nodesRef={graphNodesRef} />}

                    <div className="overlay">
                        <SearchBar
                            onInputMount={(node) => searchInputRef.current = node}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            onClear={() => setSearchTerm('')}
                            sortOption={sortOption}
                            onSortChange={setSortOption}
                            sortOptions={sortOptions}
                            viewType={viewType}
                            onViewChange={handleViewChange}
                            isSelectionMode={isSelectionMode}
                            onToggleSelectionMode={handleToggleSelectionMode}
                            allTags={allUniqueTags}
                            onTagClick={handleTagSearch}
                            onResetView={() => setResetViewKey(k => k + 1)}
                        />
                        {isSearching && matchingImagePaths.size === 0 && (<div className="search-no-results">No results for "{searchTerm}"</div>)}
                        {isSelectionMode && selectedPaths.size > 0 && (
                            <MassEditPanel selectedCount={selectedPaths.size} onApplyPreset={handleApplyPreset} onApplyA888a={handleApplyA888a} onApplyCustom={handleApplyCustom} onClear={() => setSelectedPaths(new Set())} onClose={handleToggleSelectionMode} />
                        )}
                        {panel && (
                            <div className="panel-wrap" onClick={(e) => { if (e.target === e.currentTarget) setPanel(null); }}>
                                <div className="panel">
                                    <div className="panel-img-box"><ZoomableImage lowResUrl={panel.lowResUrl} initialBitmap={panel.initialBitmap} highResPath={panel.path} alt={panel.path} /></div>
                                    <div className="panel-controls">
                                        <div className="panel-info">
                                            <div className="panel-title">{panel.path.split('/').pop().replace('.svg', '')}</div>
                                            <div className="panel-row">Path: {panel.path}</div>
                                            {panel.tags && panel.tags.length > 0 && (<div className="panel-tags">{panel.tags.map(tag => <span key={tag} className="panel-tag">{tag}</span>)}</div>)}
                                        </div>
                                        <div className="btn-group">
                                            <button className="panel-icon-btn" onClick={handleCopyMarkdown} title="Copy Markdown Link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg></button>
                                            <button className="panel-icon-btn" onClick={handleCopySvgContent} title="Copy SVG Content"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></button>
                                            <button className="panel-icon-btn" onClick={handleCopyFile} title="Copy File"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
                                            {removedImages.has(panel.path) ? (<button className="panel-icon-btn active" onClick={handleToggleHide} title="Unhide Image"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>) : (<button className="panel-icon-btn danger" onClick={handleToggleHide} title="Hide Image"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg></button>)}
                                            <button className="panel-icon-btn" onClick={() => setPanel(null)} title="Close Panel (Esc)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="compact-wrapper">
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 4px ' }}>Image Gallery</p>
                    <div className="compact-controls">
                        <button className="btn" onClick={handleEnterFullTab}>Open Full View</button>
                        {removedImages.size > 0 && <button className="btn ghost" onClick={restoreAllHidden}>Restore Hidden ({removedImages.size})</button>}
                    </div>
                </div>
            )}
        </div>
    );
};

return { AssetsLibrary };
```


