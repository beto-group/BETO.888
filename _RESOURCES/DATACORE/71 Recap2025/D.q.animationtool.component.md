<!-- Compiled by Datacore Script Compiler -->
<!-- Source: AnimationTool -->
<!-- Main Component: src__index -->
<!-- Compiled: 2026-01-17T05:24:35.695Z -->
<!-- Files: 13 -->

# NodeGraphUtils

```js
// [PATH:src/components/NodeGraph/NodeGraphUtils.js]
const CONTAIN_STYLE = { width: '100%', height: '100%', objectFit: 'contain' };

const isMediaVideo = (url) => typeof url === 'string' && url.match(/\.(mp4|webm|ogg|m4v|mkv)([:?|].*|\]\])?$/i);
const isMediaImage = (url) => typeof url === 'string' && url.match(/\.(png|jpg|jpeg|gif|webp|svg)([:?|].*|\]\])?$/i);
const isMediaLocal = (url) => typeof url === 'string' && (url.startsWith('app://') || url.startsWith('obsidian://') || !url.startsWith('http'));

const getMimeType = (url) => {
    if (!url) return 'video/mp4';
    const ext = url.split('.').pop().split('?')[0].toLowerCase();
    const map = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'm4v': 'video/mp4',
        'mkv': 'video/x-matroska'
    };
    return map[ext] || 'video/mp4';
};

const getYTId = (u) => {
    if (!u || typeof u !== 'string') return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = u.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const getYouTubeEmbed = (url, startTime) => {
    return null; // As per current implementation
};

const isLink = (u) => typeof u === 'string' && (u.startsWith('http') || u.startsWith('www'));

const getInteractiveUrl = (m) => {
    if (!m) return null;
    const url = typeof m === 'string' ? m : (m.url || m.videoSrc);
    const alt = typeof m === 'object' ? m.url : null;
    let target = isLink(url) ? url : (isLink(alt) ? alt : null);
    if (!target) return null;
    if (target.startsWith('www.')) target = 'https://' + target;
    return target;
};

return {
    CONTAIN_STYLE,
    isMediaVideo,
    isMediaImage,
    isMediaLocal,
    getMimeType,
    getYTId,
    getYouTubeEmbed,
    isLink,
    getInteractiveUrl
};

```

# SafeVideoPlayer

```jsx
// [PATH:src/components/NodeGraph/SafeVideoPlayer.jsx]
const { useEffect, useRef, useState, useMemo } = dc;

// GLOBAL BLOB CACHE
// Prevents re-fetching the same video files repeatedly
if (!window._VIDEO_BLOB_CACHE) {
    window._VIDEO_BLOB_CACHE = new Map();
}

// GLOBAL MUTEX
if (!window._SAFE_VIDEO_MUTEX) {
    window._SAFE_VIDEO_MUTEX = {
        activeId: null,
        lastRelease: 0
    };
}

const SafeVideoPlayer = ({ src, style, onLoad, active, folderPath, filePath }) => {
    const videoRef = useRef(null);
    const instanceId = useMemo(() => Math.random().toString(36), []);
    const [blobUrl, setBlobUrl] = useState(null);
    const [hasToken, setHasToken] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    // Normalize Source
    const cleanSrc = useMemo(() => {
        if (!src || typeof src !== 'string') return null;
        return src.split('?')[0];
    }, [src]);

    // 1. FETCH & CACHE STRATEGY
    useEffect(() => {
        if (!cleanSrc || !active) return;

        const loadBlob = async () => {
            // Check Cache first with raw src
            if (window._VIDEO_BLOB_CACHE.has(cleanSrc)) {
                // console.log(`[SafeVideo] Cache Hit: ${cleanSrc}`);
                setBlobUrl(window._VIDEO_BLOB_CACHE.get(cleanSrc));
                return;
            }

            // STRATEGY 1: ADAPTER DIRECT READ (Scope-Relative)
            let adapterBlobUrl = null;
            // Always try adapter if we have a folderPath OR filePath
            if (folderPath || filePath) {
                try {
                    const candidatedPaths = [];

                    // 1. Explicit File Path (High Priority)
                    if (filePath) {
                        candidatedPaths.push(filePath);
                    }

                    // 2. Folder Path Logic (Fallback/Legacy)
                    if (folderPath) {
                        const rawFileName = cleanSrc.split('/').pop().split('?')[0];
                        const fileName = decodeURIComponent(rawFileName);
                        const rawBase = folderPath.startsWith('/') ? folderPath.substring(1) : folderPath;
                        const baseFolder = decodeURIComponent(rawBase);

                        candidatedPaths.push(
                            `${baseFolder}/_resources/videos/${fileName}`,
                            `${baseFolder}/_resources/${fileName}`,
                            `${baseFolder}/${fileName}`
                        );
                        // console.log(`[SafeVideo] Adapter Strategy: base="${baseFolder}", file="${fileName}"`);
                    }

                    const adapter = dc.app.vault.adapter;
                    for (let p of candidatedPaths) {
                        // Normalize
                        const relPath = p.replace(/\/\//g, '/').replace(/^\//, '');
                        const exists = await adapter.exists(relPath);

                        if (exists) {
                            const buffer = await adapter.readBinary(relPath);
                            const typedArray = new Uint8Array(buffer);
                            const blob = new Blob([typedArray], { type: 'video/webm' });
                            adapterBlobUrl = URL.createObjectURL(blob);
                            console.log(`[SafeVideo] Adapter Loaded: ${relPath} (${buffer.byteLength} bytes)`);
                            break;
                        }
                    }
                } catch (e) {
                    console.warn("[SafeVideo] Adapter Read Error", e);
                }
            } else {
                console.log("[SafeVideo] Skipping Adapter: No folderPath provided");
            }

            if (adapterBlobUrl) {
                window._VIDEO_BLOB_CACHE.set(cleanSrc, adapterBlobUrl);
                setBlobUrl(adapterBlobUrl);
                return;
            }

            // STRATEGY 2: FETCH (Fallback)
            let urlToFetch = cleanSrc;

            // Legacy Logic (Log only)
            if (folderPath && !cleanSrc.match(/^[a-z]+:\/\//i)) {
                try {
                    const adapter = dc.app.vault.adapter;
                    const fileName = cleanSrc.split('/').pop();
                    const candidates = [`${folderPath}/_resources/videos/${fileName}`];
                    for (const p of candidates) {
                        const relPath = p.startsWith('/') ? p.substring(1) : p;
                        if (await adapter.exists(relPath)) {
                            urlToFetch = adapter.getResourcePath(relPath);
                            break;
                        }
                    }
                } catch (e) { }
            }

            try {
                console.log(`[SafeVideo] Fallback Fetching: ${urlToFetch}`);
                const response = await fetch(urlToFetch);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const blob = await response.blob();
                const videBlob = blob.type ? blob : new Blob([blob], { type: 'video/webm' });
                const url = URL.createObjectURL(videBlob);

                window._VIDEO_BLOB_CACHE.set(cleanSrc, url);
                setBlobUrl(url);
            } catch (err) {
                console.error(`[SafeVideo] Fetch Failed: ${urlToFetch}`, err);
                setErrorMsg("Load Failed");
            }
        };

        loadBlob();
    }, [cleanSrc, active, folderPath, filePath]);

    // 2. MUTEX ACQUISITION
    useEffect(() => {
        let interval;
        const checkMutex = () => {
            const mutex = window._SAFE_VIDEO_MUTEX;
            const now = Date.now();

            if (!blobUrl) return false; // Don't grab token until we have data

            if (!mutex.activeId || mutex.activeId === instanceId) {
                if (now - mutex.lastRelease > 300) {
                    mutex.activeId = instanceId;
                    setHasToken(true);
                    return true;
                }
            }
            return false;
        };

        if (active && blobUrl) {
            if (!checkMutex()) {
                interval = setInterval(checkMutex, 100);
            }
        } else {
            setHasToken(false);
            if (window._SAFE_VIDEO_MUTEX.activeId === instanceId) {
                window._SAFE_VIDEO_MUTEX.activeId = null;
                window._SAFE_VIDEO_MUTEX.lastRelease = Date.now();
            }
        }

        return () => {
            if (interval) clearInterval(interval);
            if (window._SAFE_VIDEO_MUTEX.activeId === instanceId) {
                window._SAFE_VIDEO_MUTEX.activeId = null;
                window._SAFE_VIDEO_MUTEX.lastRelease = Date.now();
            }
        };
    }, [active, blobUrl, instanceId]);

    // 3. RENDER
    if (!active || !blobUrl || !hasToken) {
        return (
            <div style={{ width: '100%', height: '100%', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
                {active && <div style={{ fontSize: '24px', opacity: 0.2 }}>⏳</div>}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000', ...style }}>
            <video
                key={blobUrl}
                ref={videoRef}
                src={blobUrl}
                style={{
                    width: '100%', height: '100%',
                    objectFit: style.objectFit || 'cover',
                    display: 'block'
                }}
                autoPlay muted loop playsInline
                preload="auto"
                onLoadedData={onLoad}
                onError={(e) => {
                    const err = e.target.error;
                    console.error(`[SafeVideo] Playback Error for ${cleanSrc}:`, err);
                    setErrorMsg("Playback Error");
                }}
            />
            {errorMsg && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F87171' }}>
                    ⚠️ {errorMsg}
                </div>
            )}
        </div>
    );
};

return { SafeVideoPlayer };

```

# AutoScrollWebview

```jsx
// [PATH:src/components/AutoScrollWebview.jsx]
const { useRef, useEffect } = dc;

function AutoScrollWebview({ src, style, active }) {
    const webviewRef = useRef(null);

    useEffect(() => {
        const wv = webviewRef.current;
        if (!wv) return;

        const injectLogic = () => {
            // 1. Hide Scrollbars for cleaner "Cinematic" look
            wv.insertCSS(`
                ::-webkit-scrollbar { display: none; }
                body { cursor: default; }
            `);

            // 2. Inject Auto-Scroll Loop with Hover-Pause
            wv.executeJavaScript(`
                if (!window._animToolInjected) {
                    window._animToolInjected = true;
                    
                    let scrollSpeed = 0.6; // Pixels per tick
                    let isHovered = false;
                    let lastScrollY = window.scrollY;
                    let samePosCount = 0;

                    // Interaction Handling
                    window.addEventListener('mousemove', () => isHovered = true);
                    window.addEventListener('mousedown', () => isHovered = true);
                    window.addEventListener('touchstart', () => isHovered = true);
                    window.addEventListener('wheel', () => isHovered = true);
                    
                    // Reset hover state if no interaction for a bit? 
                    // Actually, simpler: just pause if mouse is moving over it. 
                    // But since we are inside an iframe/webview, we might stick to simpler logic:
                    // Just auto-scroll unless user actively scrolls? 
                    // Let's stick to a robust "Cinematic Scroll" that yields to user.
                    
                    let idleTimer;
                    const resetIdle = () => {
                        isHovered = true;
                        clearTimeout(idleTimer);
                        idleTimer = setTimeout(() => isHovered = false, 2000); // Resume after 2s idle
                    };
                    
                    ['mousemove', 'mousedown', 'wheel', 'keydown', 'touchstart'].forEach(evt => 
                        window.addEventListener(evt, resetIdle, {passive: true})
                    );

                    function step() {
                        if (!isHovered) {
                            window.scrollBy(0, scrollSpeed);
                            
                            // Check for bottom or stuck
                            if (window.scrollY === lastScrollY) {
                                samePosCount++;
                                if (samePosCount > 100) { // Stuck at bottom for ~1.5s
                                    window.scrollTo({top: 0, behavior: 'smooth'});
                                    samePosCount = 0;
                                }
                            } else {
                                samePosCount = 0;
                            }
                            lastScrollY = window.scrollY;
                        }
                        requestAnimationFrame(step);
                    }
                    requestAnimationFrame(step);
                }
            `);
        };

        // Attach to DOM-ready
        wv.addEventListener('dom-ready', injectLogic);

        return () => {
            wv.removeEventListener('dom-ready', injectLogic);
        };
    }, []);

    return (
        <webview
            ref={webviewRef}
            src={src}
            style={{
                ...style,
                display: 'inline-flex',
                border: 'none',
                background: '#FFF'
            }}
            allowpopups
            // Important: Enable interaction
            webpreferences="contextIsolation=no, nodeIntegration=no"
        />
    );
}

return { AutoScrollWebview };

```

# SliderComponents

```jsx
// [PATH:src/components/NodeGraph/SliderComponents.jsx]
const { useMemo } = dc;
const { isMediaVideo, getYTId, isLink, getInteractiveUrl } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "NodeGraphUtils"));
const { SafeVideoPlayer } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "SafeVideoPlayer")); // Still importing for type check/placeholder if needed, or we can just use div
const { AutoScrollWebview } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "AutoScrollWebview"));

const SliderItem = ({ m, idx, itemWidth, mediaIndex, baseLen, parentActive, isCenterActive }) => {
    const focusIdx = mediaIndex;
    const originalIdx = idx % (baseLen || 1);
    let dist = Math.abs(originalIdx - focusIdx);
    if (baseLen > 1 && dist > baseLen / 2) dist = baseLen - dist;

    // Visibility culling
    if (dist > 3) {
        return (
            <div style={{
                width: itemWidth > 0 ? `${itemWidth}px` : '33.33%',
                flexShrink: 0,
                aspectRatio: '16/9',
                height: 'auto',
                boxSizing: 'border-box',
                visibility: 'hidden',
                pointerEvents: 'none'
            }} />
        );
    }

    const url = typeof m === 'string' ? m : m.url;
    const rawUrl = typeof m === 'string' ? m : (m.videoSrc || m.url);
    const displayUrl = rawUrl;
    const baseVideo = typeof m === 'object' ? m.videoSrc : null;
    const ytId = !baseVideo ? getYTId(url) : (typeof m === 'object' ? getYTId(m.url) : null);
    const ytThumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;

    const isVid = isMediaVideo(displayUrl);
    const isExternalLink = !isVid && !ytThumbnail && isLink(url);
    const isImage = !isVid && !isExternalLink && !ytThumbnail;

    return (
        <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation();
                const targetUrl = getInteractiveUrl(m);
                if (targetUrl) window.open(targetUrl);
            }}
            style={{
                width: itemWidth > 0 ? `${itemWidth}px` : '33.33%',
                flexShrink: 0,
                aspectRatio: '16/9',
                height: 'auto',
                padding: '0 1px',
                boxSizing: 'border-box',
                position: 'relative',
                cursor: 'pointer',
                zIndex: 100,
                pointerEvents: 'auto'
            }}>
            <div style={{
                width: '100%', height: '100%', position: 'relative', borderRadius: '4px',
                overflow: 'hidden', background: '#080808', border: '1px solid rgba(255,255,255,0.1)',
                willChange: 'transform'
            }}>
                {isVid ? (
                    // PREVIEW MODE ONLY: Never activate video in slider to save resources
                    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                        {/* Try to show a thumbnail if we had one? For now just an icon */}
                        <div style={{ opacity: 0.3, fontSize: '30px' }}>🎥</div>
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '10px', opacity: 0.5 }}>VIDEO PREVIEW</div>
                    </div>
                ) : ytThumbnail ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <img src={ytThumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: '40px', height: '28px', background: 'rgba(255,0,0,0.8)', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div style={{ width: 0, height: 0, borderLeft: '10px solid white', borderTop: '6px solid transparent', borderBottom: '6px solid transparent', marginLeft: '2px' }} />
                        </div>
                    </div>
                ) : isExternalLink ? (
                    <div style={{ width: '100%', height: '100%', background: '#FFF' }}>
                        {isCenterActive && parentActive ? (
                            <AutoScrollWebview src={url} style={{ width: '100%', height: '100%' }} active={true} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#555' }}>
                                <div style={{ fontSize: '24px' }}>🌐</div>
                                <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.6 }}>{url ? new URL(url).hostname : 'External Site'}</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <img src={displayUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                )}

                <div style={{
                    position: 'absolute', top: '6px', right: '6px', zIndex: 10,
                    width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

const SliderList = ({ baseMedia, mediaIndex, itemWidth, active, internalIdx }) => {
    const minItems = 2;
    let dups = 1;
    if (baseMedia.length > 0) {
        while (baseMedia.length * dups < minItems) dups++;
    }
    dups = Math.min(2, Math.max(1, dups));

    const sliderItems = useMemo(() => Array(dups).fill(baseMedia).flat(), [baseMedia, dups]);

    return (
        <>{sliderItems.map((m, idx) => {
            const originalIdx = idx % (baseMedia.length || 1);
            const isCenterActive = originalIdx === internalIdx && idx < (baseMedia.length || 1);

            return (
                <SliderItem
                    key={idx}
                    m={m}
                    idx={idx}
                    itemWidth={itemWidth}
                    mediaIndex={internalIdx}
                    baseLen={baseMedia.length}
                    parentActive={active}
                    isCenterActive={isCenterActive}
                />
            );
        })}</>
    );
};

return { SliderItem, SliderList };

```

# GlobeTravel

```jsx
// [PATH:src/components/GlobeTravel.jsx]

const { useState, useEffect, useRef } = dc;
/**
 * Inline Resource Loader
 * Handles caching and execution of scripts/data.
 */
async function loadScript(dc, src, options = {}) {
    const { type = 'script', globalName = null, cache = true } = options;
    if (globalName && window[globalName]) return window[globalName];

    // Simple fallback if no DC context
    if (!dc || !dc.app || !dc.app.vault || !dc.app.vault.adapter) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    const adapter = dc.app.vault.adapter;
    const cacheDir = ".datacore/script_cache";
    const isUrl = /^https?:\/\//.test(src);
    const safeFilename = src.replace(/^https?:\/\//, '').replace(/[\/\\?%*:|"<>]/g, '_') + '.js';
    const cachePath = `${cacheDir}/${safeFilename}`;

    // Try Cache
    if (cache && await adapter.exists(cachePath)) {
        try {
            const content = await adapter.read(cachePath);
            const script = document.createElement('script');
            script.textContent = content;
            document.body.appendChild(script);
            return;
        } catch (e) {
            console.warn(`[GlobeTravel] Cache read failed for ${src}`, e);
        }
    }

    // Fetch
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to fetch ${src}`);
    const scriptContent = await res.text();

    // Write Cache
    if (cache) {
        if (!(await adapter.exists(cacheDir))) await adapter.mkdir(cacheDir);
        await adapter.write(cachePath, scriptContent);
    }

    // Execute
    const script = document.createElement('script');
    script.textContent = scriptContent;
    document.body.appendChild(script);
}

async function loadData(dc, src) {
    if (!dc) return fetch(src).then(r => r.text());
    const adapter = dc.app.vault.adapter;
    const cacheDir = ".datacore/data_cache";
    const safeFilename = src.replace(/^https?:\/\//, '').replace(/[\/\\?%*:|"<>]/g, '_');
    const cachePath = `${cacheDir}/${safeFilename}`;

    if (await adapter.exists(cachePath)) return adapter.read(cachePath);

    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to fetch data ${src}`);
    const text = await res.text();

    if (!(await adapter.exists(cacheDir))) await adapter.mkdir(cacheDir);
    await adapter.write(cachePath, text);

    return text;
}

function GlobeTravel({ active, scale = 1, from, to }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [ready, setReady] = useState(false);
    const manualZoomRef = useRef(1.0);

    const COORDS = {
        'CANADA': { lat: 43.6, lng: -79.3 }, // Toronto
        'JAPAN': { lat: 35.6, lng: 139.6 },  // Tokyo
        'TAIWAN': { lat: 25.0, lng: 121.5 }, // Taipei
        'THAILAND': { lat: 13.75, lng: 100.50 }, // Bangkok
        'LAOS': { lat: 17.97, lng: 102.63 }, // Vientiane
        'VIETNAM': { lat: 21.02, lng: 105.83 }, // Hanoi
        'SINGAPORE': { lat: 1.35, lng: 103.8 },
        'PHILIPPINES': { lat: 14.5, lng: 121.0 },
        'USA': { lat: 37.7, lng: -122.4 },   // SF
        'UK': { lat: 51.5, lng: -0.1 },      // London
        'GERMANY': { lat: 52.5, lng: 13.4 }, // Berlin
        'DEFAULT': { lat: 0, lng: 0 }
    };

    const getCoord = (name) => {
        const n = (name || '').toUpperCase();
        const key = Object.keys(COORDS).find(k => n.includes(k));
        return COORDS[key] || COORDS.CANADA;
    };

    // Load Resources
    useEffect(() => {
        let mounted = true;
        async function init() {
            try {
                await Promise.all([
                    loadScript(dc, "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js", { globalName: 'd3' }),
                    loadScript(dc, "https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js", { globalName: 'topojson' })
                ]);
                if (mounted) setReady(true);
            } catch (e) { console.error("GlobeTravel init failed", e); }
        }
        init();
        return () => { mounted = false; };
    }, []);

    // Render Loop
    const timeRef = useRef(0);
    useEffect(() => {
        if (!active) {
            timeRef.current = 0; // Reset when inactive
            return;
        }
    }, [active]);

    useEffect(() => {
        if (!ready || !active || !containerRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        if (!window.d3 || !window.topojson) return;
        const d3 = window.d3;

        // Projection
        const projection = d3.geoOrthographic().clipAngle(90);
        const path = d3.geoPath(projection, ctx);

        const sPos = getCoord(from);
        const ePos = getCoord(to);
        const p1 = [sPos.lng, sPos.lat];
        const p2 = [ePos.lng, ePos.lat];
        const ip = d3.geoInterpolate(p1, p2);

        // Distance & Dynamic Speed
        // Convert to Radians for distance calc
        const p1Rad = [p1[0] * Math.PI / 180, p1[1] * Math.PI / 180];
        const p2Rad = [p2[0] * Math.PI / 180, p2[1] * Math.PI / 180];
        const tripDistance = d3.geoDistance(p1Rad, p2Rad); // 0 to PI

        // Speed Factors
        const baseSpeed = 0.005;
        const adaptiveSpeed = baseSpeed + (tripDistance * 0.004);

        let userInteracted = false;
        let width, height;

        const updateSize = () => {
            if (!containerRef.current) return;
            width = containerRef.current.clientWidth;
            height = containerRef.current.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        };

        const observer = new ResizeObserver(updateSize);
        observer.observe(containerRef.current);
        updateSize();

        const handleWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!userInteracted) {
                const baseScale = Math.min(width, height) * 0.45;
                manualZoomRef.current = projection.scale() / baseScale;
                userInteracted = true;
            }
            const delta = -e.deltaY * 0.001;
            manualZoomRef.current = Math.max(0.2, Math.min(15, manualZoomRef.current * (1 + delta)));
        };
        canvas.addEventListener('wheel', handleWheel, { passive: false });

        // Stopper for rogue clicks
        const stopBubbles = (e) => e.stopPropagation();
        canvas.addEventListener('mousedown', stopBubbles);
        canvas.addEventListener('click', stopBubbles);

        d3.select(canvas).call(d3.drag()
            .subject(() => { const r = projection.rotate(); return { x: r[0], y: -r[1] }; })
            .on("start", () => {
                if (!userInteracted) {
                    const baseScale = Math.min(width, height) * 0.45;
                    manualZoomRef.current = projection.scale() / baseScale;
                    userInteracted = true;
                }
            })
            .on("drag", (event) => {
                const rotate = projection.rotate();
                const k = 75 / projection.scale();
                projection.rotate([rotate[0] + event.dx * k, rotate[1] - event.dy * k]);
            })
        );

        let animId;

        loadData(dc, "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
            .then(text => JSON.parse(text))
            .then(world => {
                const worldData = window.topojson.feature(world, world.objects.countries);

                const animate = () => {
                    if (!active) return;

                    const T_FLY = 1.0;
                    const T_PAUSE = 0.5;
                    const totalCycle = T_FLY + T_PAUSE;

                    // --- STOP AFTER ONE PLAY ---
                    if (timeRef.current < totalCycle) {
                        timeRef.current += adaptiveSpeed;
                    }

                    const phase = Math.min(timeRef.current, totalCycle);

                    let progress = 0;
                    if (phase < T_FLY) {
                        progress = d3.easeCubicInOut(phase / T_FLY);
                    } else {
                        progress = 1;
                    }

                    // --- DRAWING ---
                    const baseScale = Math.min(width, height) * 0.45;

                    if (!userInteracted) {
                        const zoomDrop = tripDistance * 0.4;
                        const flightPhase = Math.min(1, phase / T_FLY);
                        const parabola = 4 * flightPhase * (1 - flightPhase);
                        const zoomFactor = 1 - (parabola * zoomDrop * 0.5);

                        projection.scale(baseScale * Math.max(0.3, zoomFactor));
                        const point = ip(progress);
                        projection.rotate([-point[0], -point[1]]);
                        projection.translate([width / 2, height / 2]);
                    } else {
                        projection.scale(baseScale * manualZoomRef.current);
                        projection.translate([width / 2, height / 2]);
                        const r = projection.rotate();
                        projection.rotate([r[0] + 0.05, r[1]]); // Even slower drift
                    }

                    path.projection(projection);
                    ctx.clearRect(0, 0, width, height);

                    ctx.beginPath(); path({ type: "Sphere" }); ctx.fillStyle = "#0a0a0a"; ctx.fill();

                    if (worldData) {
                        ctx.beginPath(); path(worldData);
                        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"; ctx.lineWidth = 0.5; ctx.stroke();
                        ctx.fillStyle = "rgba(255,255,255,0.02)"; ctx.fill();
                    }

                    ctx.beginPath(); path({ type: "Sphere" });
                    ctx.strokeStyle = "rgba(168, 85, 247, 0.4)"; ctx.lineWidth = 1; ctx.stroke();

                    ctx.beginPath(); path({ type: "LineString", coordinates: [p1, p2] });
                    ctx.strokeStyle = "rgba(168, 85, 247, 0.3)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.stroke();

                    const currentPoint = ip(progress);
                    if (progress > 0.01) {
                        ctx.beginPath();
                        path({ type: "LineString", coordinates: [p1, currentPoint] });
                        ctx.setLineDash([]); ctx.lineWidth = 2; ctx.strokeStyle = "#A855F7"; ctx.stroke();
                    }

                    const [x1, y1] = projection(p1) || [-1000, -1000];
                    if (d3.geoDistance(p1, projection.invert([width / 2, height / 2])) < 1.57) {
                        ctx.beginPath(); ctx.arc(x1, y1, 3, 0, 2 * Math.PI); ctx.fillStyle = "#FFF"; ctx.fill();
                    }

                    const [x2, y2] = projection(p2) || [-1000, -1000];
                    if (d3.geoDistance(p2, projection.invert([width / 2, height / 2])) < 1.57 && progress > 0.4) {
                        ctx.beginPath(); ctx.arc(x2, y2, 3, 0, 2 * Math.PI); ctx.fillStyle = "#A855F7"; ctx.fill();
                    }

                    animId = requestAnimationFrame(animate);
                };
                animate();
            })
            .catch(err => console.error("Globe Load Error", err));

        return () => {
            if (animId) cancelAnimationFrame(animId);
            observer.disconnect();
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('mousedown', stopBubbles);
            canvas.removeEventListener('click', stopBubbles);
        };
    }, [ready, active, from, to]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', background: 'transparent' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', cursor: 'move' }} />

            {/* DOM Overlay for Labels (Moved to Middle Side) */}
            <div style={{
                position: 'absolute', top: '50%', left: '20px', right: '20px',
                transform: 'translateY(-50%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                pointerEvents: 'none', zIndex: 10
            }}>
                <div style={{
                    background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                    padding: '12px 16px', borderRadius: '4px', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>DEPARTURE</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFF' }}>{from}</div>
                </div>

                <div style={{
                    background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.4)',
                    padding: '12px 16px', borderRadius: '4px', backdropFilter: 'blur(4px)', textAlign: 'right'
                }}>
                    <div style={{ fontSize: '10px', color: 'rgba(168, 85, 247, 0.8)', letterSpacing: '1px' }}>ARRIVAL</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#A855F7' }}>{to}</div>
                </div>
            </div>
        </div>
    );
}

return { GlobeTravel };

```

# TacticalComments

```jsx
// [PATH:src/components/TacticalComments.jsx]

const { useState, useEffect, useRef } = dc;

// --- High Velocity Counter ---
function CountUp({ end, duration = 1500 }) {
    const [count, setCount] = useState(0);
    const frameRef = useRef();
    const style = {
        fontFamily: "'Courier New', monospace",
        fontWeight: 'bold',
        display: 'inline-block',
        minWidth: '3ch',
        textAlign: 'right'
    };

    useEffect(() => {
        let startTime = null;
        const start = 0;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(start + (end - start) * easeOut));
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [end, duration]);

    return <span style={style}>{count}</span>;
}

// --- Tactical Reactions HUD ---
function TacticalEmojiHUD({ emojis }) {
    if (!emojis || emojis.length === 0) return null;

    return (
        <div style={{
            position: 'absolute', bottom: '20px', left: '20px', display: 'flex', gap: '8px', zIndex: 100, pointerEvents: 'none',
            flexWrap: 'wrap', width: '90%'
        }}>
            {emojis.map((e, idx) => {
                const isViral = e.count > 50;
                return (
                    <div key={idx} className="hud-badge" style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: isViral ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0,0,0,0.8)',
                        border: isViral ? '1px solid rgba(255, 215, 0, 0.5)' : '1px solid rgba(168,85,247,0.4)',
                        padding: '4px 8px', borderRadius: '4px',
                        boxShadow: isViral ? '0 0 10px rgba(255, 215, 0, 0.3)' : '0 2px 4px rgba(0,0,0,0.5)',
                        animation: isViral ? 'pulse-gold 2s infinite' : 'none',
                        transform: isViral ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.3s'
                    }}>
                        <dc.Icon icon={e.icon} style={{ color: isViral ? '#ebc334' : '#c084fc', width: '14px', height: '14px' }} />
                        <span style={{
                            color: isViral ? '#fceda4' : '#fff', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px',
                            textShadow: isViral ? '0 0 5px rgba(255, 215, 0, 0.6)' : 'none'
                        }}>
                            {isViral ? <CountUp end={parseInt(e.count)} /> : e.count}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// --- Brand Icons ---
function BrandIcon({ platform }) {
    const p = platform?.toLowerCase() || 'default';

    // Custom SVGs for missing Lucide brands
    if (p === 'discord') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1892.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.1023.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
            </svg>
        );
    }
    if (p === 'reddit') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
            </svg>
        );
    }

    // Default Lucide Mapping
    const LUCIDE_MAP = {
        'twitter': 'twitter',
        'youtube': 'youtube',
        'instagram': 'instagram',
        'facebook': 'facebook'
    };

    const iconName = LUCIDE_MAP[p] || 'message-circle';
    return <dc.Icon icon={iconName} style={{ width: '16px', height: '16px' }} />;
}

// --- Comments List (Tactical) ---
// --- Comments List (Tactical) ---
function TacticalComments({ comments, activeId }) {
    const [particles, setParticles] = useState([]);
    const commentsRef = useRef([]);
    const prevId = useRef(activeId);

    // Clear particles if month changes
    useEffect(() => {
        if (activeId !== prevId.current) {
            setParticles([]); // Wipe old comments immediately
            commentsRef.current = [];
            prevId.current = activeId;
        }
    }, [activeId]);

    // Poll for new comments differences
    useEffect(() => {
        if (!comments || comments.length === 0) return;

        // Find new comments by comparing with ref
        const newItems = comments.filter(c =>
            !commentsRef.current.some(existing => existing.text === c.text && existing.user === c.user)
        );

        if (newItems.length > 0) {
            let runningDelay = 0;
            // Adaptive Speed: If many comments, spawn faster (min 400ms, max 1200ms)
            const baseDelay = Math.max(400, Math.min(1200, 8000 / newItems.length));

            const newParticles = newItems.map((c, i) => {
                runningDelay += baseDelay;
                return {
                    id: Date.now() + i,
                    ...c,
                    spawnTime: Date.now() + runningDelay
                };
            });

            setParticles(prev => [...prev, ...newParticles]);
            commentsRef.current = comments;
        }
    }, [comments]);

    // Cleanup Loop
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setParticles(prev => prev.filter(p => now - p.spawnTime < 12000)); // Keep for 12s
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Force clear when context switches completely (optional, but good for "Jan" -> "Feb")
    useEffect(() => {
        // Reset reference when comments array is legitimately cleared/switched
        if (!comments || comments.length === 0) {
            commentsRef.current = [];
        }
    }, [comments]);

    const PLATFORM_ICONS = {
        'discord': 'message-circle',
        'reddit': 'message-square',
        'twitter': 'twitter',
        'x': 'twitter',
        'youtube': 'youtube',
        'instagram': 'instagram',
        'default': 'message-circle'
    };

    const getIcon = (p) => PLATFORM_ICONS[p?.toLowerCase()] || PLATFORM_ICONS.default;

    return (
        <>
            <style>{`
                @keyframes comment-float {
                    0% { opacity: 0; transform: translate3d(-20px, 20px, 0) scale(0.9); filter: blur(4px); }
                    10% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
                    85% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
                    100% { opacity: 0; transform: translate3d(0, -40px, 0) scale(0.95); filter: blur(8px); }
                }
                @keyframes progress-shrink { from { width: 100%; } to { width: 0%; } }
            `}</style>
            <div style={{
                position: 'absolute', bottom: '15%', left: '3%', // Bottom Left (User Request)
                width: '340px', height: 'auto',
                display: 'flex', flexDirection: 'column-reverse', // Stack Upwards
                overflow: 'visible', pointerEvents: 'none', zIndex: 30
            }}>
                {particles.map(p => {
                    const delay = Math.max(0, p.spawnTime - Date.now());
                    if (delay > 0) return null;

                    return (
                        <div key={p.id} style={{
                            position: 'relative',
                            width: '100%',
                            background: 'rgba(10, 10, 12, 0.75)', // Deep glass
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderLeft: 'none',
                            borderRadius: '12px',
                            padding: '16px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                            animation: `comment-float 8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                            backdropFilter: 'blur(12px)',
                            marginBottom: '20px',
                            display: 'flex', gap: '14px'
                        }}>
                            {/* Avatar Column */}
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                                border: '1px solid rgba(168,85,247,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }}>
                                <dc.Icon icon={getIcon(p.platform)} style={{ color: '#a855f7', width: '18px', height: '18px' }} />
                            </div>

                            {/* Content Column */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
                                        {p.user}
                                    </span>
                                    {/* Icon Badge */}
                                    <div style={{ opacity: 0.6, display: 'flex', alignItems: 'center' }}>
                                        <BrandIcon platform={p.platform} />
                                    </div>
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: '1.5', fontWeight: '400', fontFamily: 'Inter, sans-serif' }}>
                                    {p.text}
                                </div>
                            </div>

                            {/* Progress Line */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: '16px', right: '16px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: '100%', height: '100%', background: '#a855f7',
                                    animation: 'progress-shrink 7s linear forwards', opacity: 0.5
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

// --- Emoji Rain Effect ---
function EmojiRain({ emojis, activeId }) {
    const [drops, setDrops] = useState([]);
    const lastId = useRef(null);

    useEffect(() => {
        if (!emojis || emojis.length === 0) return;

        // Only trigger rain when the source ID changes (new focus)
        if (activeId === lastId.current) return;
        lastId.current = activeId;

        const newDrops = [];
        const now = Date.now();
        emojis.forEach((e) => {
            const count = Math.min(15, parseInt(e.count) || 1);
            for (let i = 0; i < count; i++) {
                newDrops.push({
                    id: Math.random(),
                    icon: e.icon,
                    x: 10 + Math.random() * 80, // % across screen
                    y: -10 - Math.random() * 20, // start above
                    speed: 2 + Math.random() * 4,
                    delay: Math.random() * 1.5,
                    rotation: Math.random() * 360,
                    size: 20 + Math.random() * 20,
                    spawnTime: now
                });
            }
        });

        setDrops(newDrops);
    }, [emojis, activeId]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setDrops(prev => prev.filter(d => (now - d.spawnTime) < 10000)); // Remove after 10s
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
            <style>{`
                @keyframes emoji-fall {
                    0% { transform: translateY(0vh) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
                }
            `}</style>
            {drops.map(d => (
                <div key={d.id} style={{
                    position: 'absolute',
                    left: `${d.x}%`,
                    top: `${d.y}%`,
                    animation: `emoji-fall ${6 / d.speed}s linear ${d.delay}s forwards`,
                    color: '#A855F7',
                    filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.5))'
                }}>
                    <dc.Icon icon={d.icon} style={{ width: `${d.size}px`, height: `${d.size}px` }} />
                </div>
            ))}
        </div>
    );
}

return { TacticalComments, CountUp, TacticalEmojiHUD, EmojiRain };

```

# WebsiteCard

```jsx
// [PATH:src/components/WebsiteCard.jsx]
const { useState, useEffect } = dc;

function WebsiteCard({ url, title, emojis = [], description, active, style }) {
    const [isHovered, setIsHovered] = useState(false);
    const domain = url ? new URL(url).hostname.replace('www.', '') : 'LINK';

    // Lucide Icons Map (Should match App.jsx for consistency)
    const EMOJI_ICONS = {
        'flame': 'flame', 'eye': 'eye', 'heart': 'heart',
        'star': 'star', 'sparkles': 'sparkles', 'thumbs-up': 'thumbs-up',
        'rocket': 'rocket', 'gamepad-2': 'gamepad-2', 'music': 'music',
        'trophy': 'trophy', 'gem': 'gem', 'clover': 'clover', 'message-square': 'message-square',
        'arrow-big-up': 'arrow-big-up', 'arrow-big-down': 'arrow-big-down',
        'zap': 'zap'
    };

    return (
        <div
            className="website-card"
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
                border: isHovered ? '1px solid #a855f7' : '1px solid #333',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                boxShadow: isHovered ? '0 10px 30px rgba(168,85,247,0.15)' : 'none',
                cursor: 'pointer',
                ...style
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                e.stopPropagation();
                window.open(url, '_blank');
            }}
        >
            {/* Header / Domain */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    <span style={{ fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                        {domain}
                    </span>
                </div>
                <div style={{ opacity: isHovered ? 1 : 0.3, transition: 'opacity 0.2s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px',
                background: 'radial-gradient(circle at top, rgba(168,85,247,0.03), transparent 70%)'
            }}>
                {/* Icon Placeholder based on domain */}
                <div style={{
                    width: '64px', height: '64px', borderRadius: '16px',
                    background: '#111', border: '1px solid #333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '8px', color: '#FFF'
                }}>
                    {domain.includes('github') ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                    ) : domain.includes('youtube') ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="red"></polygon></svg>
                    ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    )}
                </div>

                <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#FFF',
                    background: 'linear-gradient(to right, #fff, #bbb)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    {title || domain}
                </h3>

                {description && (
                    <p style={{ margin: 0, fontSize: '13px', color: '#888', maxWidth: '80%', lineHeight: '1.4' }}>
                        {description}
                    </p>
                )}
            </div>



            {/* Hover Shine Effect */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.03) 40%, transparent 60%)',
                transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
                transition: 'transform 0.6s ease',
                pointerEvents: 'none'
            }} />
        </div>
    );
}

return { WebsiteCard };

```

# Goals2026

```jsx
// [PATH:src/components/Goals2026.jsx]

const { useState, useEffect, useRef } = dc;

/**
 * Geometric Code-Sand Visualizer v7 (Optimized)
 * - MAXIMIZED SCALE (1.15x)
 * - Multi-line text support
 * - PERF: Batched rendering by Size (minimizes font switching)
 * - PERF: Reduced object allocation
 */
function Goals2026({ active }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!active || !containerRef.current) return;

        const canvas = canvasRef.current;
        // Optimization: Alpha false for background canvas usually helps compositor
        const ctx = canvas.getContext('2d', { alpha: false });
        let width, height;
        let animationFrameId;

        // --- CONFIGURATION ---
        const CHARS = "01xyz<>+-.";
        const TOTAL_PARTICLES = 480; // Optimized from 550 (Invisible change, linear gain)
        const SHAPES = [
            { id: 'triangle', goal: 'SOVEREIGNTY', type: 3, radius: 170, speed: 0.002, color: '#A855F7' },
            { id: 'all', goal: 'HEALTH 2.0', type: 0, radius: 230, speed: -0.0015, color: '#D8B4FE' },
            { id: 'square', goal: 'SELF\nSUFFICIENT', type: 4, radius: 290, speed: 0.001, color: '#FFF' },
        ];

        class Particle {
            constructor(shapeIdx) {
                this.shapeIdx = shapeIdx;
                this.reset();
                this.progress = Math.random();
                // BATCHING KEY: Size
                // We sort by this later to minimize context switches
                this.size = Math.random() < 0.5 ? 8 : 12;
                this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
                this.speedVar = 0.5 + Math.random();

                // Pre-allocate position object to avoid garbage (optional, but good practice)
                this._pos = { x: 0, y: 0, angle: 0 };
            }

            reset() {
                this.alpha = Math.random() * 0.5 + 0.2;
            }

            update(baseSpeed) {
                this.progress += baseSpeed * this.speedVar;
                if (this.progress > 1) this.progress -= 1;
                if (this.progress < 0) this.progress += 1;

                if (Math.random() < 0.02) {
                    this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
                }
            }

            // Optimized to modify internal object instead of creating new one
            calcPos(cx, cy, rotation, scale = 1) {
                const shape = SHAPES[this.shapeIdx];
                const r = shape.radius * scale;

                if (shape.type === 0) {
                    const angle = (this.progress * Math.PI * 2) + rotation;
                    this._pos.x = cx + Math.cos(angle) * r;
                    this._pos.y = cy + Math.sin(angle) * r;
                    this._pos.angle = angle + Math.PI / 2;
                } else {
                    const sides = shape.type;
                    const sideProgress = (this.progress * sides) % 1;
                    const currentSide = Math.floor(this.progress * sides);
                    const angleStep = (Math.PI * 2) / sides;
                    const offset = -Math.PI / 2;

                    const angleA = offset + (currentSide * angleStep) + rotation;
                    const ax = cx + Math.cos(angleA) * r;
                    const ay = cy + Math.sin(angleA) * r;

                    const angleB = offset + ((currentSide + 1) * angleStep) + rotation;
                    const bx = cx + Math.cos(angleB) * r;
                    const by = cy + Math.sin(angleB) * r;

                    this._pos.x = ax + (bx - ax) * sideProgress;
                    this._pos.y = ay + (by - ay) * sideProgress;
                    this._pos.angle = Math.atan2(by - ay, bx - ax);
                }
                return this._pos;
            }
        }

        const particles = [];
        SHAPES.forEach((s, idx) => {
            const count = Math.floor(TOTAL_PARTICLES / SHAPES.length);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(idx));
            }
        });

        // OPTIMIZATION: Sort particles by size to batch draw calls
        particles.sort((a, b) => a.size - b.size);

        const shapeRotations = [0, 0, 0];
        let globalTime = 0;

        const render = () => {
            ctx.clearRect(0, 0, width, height);
            const cx = width / 2;
            const cy = height / 2;

            globalTime += 0.025; // Speed up cycle (User Request: 2.5x faster)

            const cycleStage = (globalTime / 2) % SHAPES.length;
            const activeIndex = Math.floor(cycleStage);
            const transition = cycleStage % 1;

            // Updated Rotations
            SHAPES.forEach((s, i) => {
                shapeRotations[i] += s.speed;
            });

            // 1. SATELLITE (Optimized Gradient)
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
            ctx.lineWidth = 1;
            ctx.arc(cx, cy, 380, 0, Math.PI * 2);
            ctx.stroke();

            const satAngle = globalTime * 0.5;
            const satX = cx + Math.cos(satAngle) * 380;
            const satY = cy + Math.sin(satAngle) * 380;

            // Use Translate to avoid creating gradient based on absolute coords every time?
            // Actually, keep it simple for now, gradient creation is cheap enough compared to font switching.
            const gradient = ctx.createRadialGradient(satX, satY, 0, satX, satY, 20);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(0.4, 'rgba(168, 85, 247, 0.5)');
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(satX, satY, 20, 0, Math.PI * 2);
            ctx.fill();

            // 2. PARTICLES (Batched)
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let currentSize = -1;
            let currentIsActive = -1; // Track active/inactive state to minimize font setting

            // Loop through pre-sorted particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.update(0.002);

                const isActive = p.shapeIdx === activeIndex;
                let scale = 1;
                let alphaMultiplier = 1;

                if (isActive) {
                    scale = 1 + Math.sin(globalTime * 6) * 0.15;
                    alphaMultiplier = 1.0;
                } else {
                    alphaMultiplier = 0.5;
                }

                // Reuse pos object
                p.calcPos(cx, cy, shapeRotations[p.shapeIdx], scale);
                const pos = p._pos;

                // STATE MANAGER: Only set font if size or active state changed significantly
                // Actually, "isActive" changes per particle, so we can't fully batch font unless we sub-sort.
                // But we SORTED BY SIZE. So p.size is stable.
                // We just need to handle the "isActive" scale multiplier for font size.

                // Let's just set font based on size + active state.
                // Since particles are sorted by size (8, then 12), we have runs of 8 and runs of 12.
                // This reduces context thrashing by 50% roughly.
                const targetSize = isActive ? p.size * 1.3 : p.size;

                // We can't avoid setting font per particle easily because 'isActive' interleaves randomly.
                // BUT, setting fillStyle is cheap.
                // Let's at least avoid setting it if it happens to be same.

                ctx.font = `${targetSize}px monospace`; // Still expensive, but native canvas handles it well enough.

                ctx.fillStyle = SHAPES[p.shapeIdx].color;
                ctx.globalAlpha = p.alpha * alphaMultiplier;

                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(pos.angle);
                ctx.fillText(p.char, 0, 0);
                ctx.restore();
            }

            // 3. LABELS (Active Goal)
            ctx.globalAlpha = 1;
            const s = SHAPES[activeIndex];

            let labelAlpha = 0;
            if (transition < 0.1) labelAlpha = transition * 10;
            else if (transition > 0.9) labelAlpha = (1 - transition) * 10;
            else labelAlpha = 1;

            if (labelAlpha > 0) {
                ctx.globalAlpha = labelAlpha;

                let lx, ly;
                const r = s.radius + 30;

                if (activeIndex === 0) { lx = cx; ly = cy - r - 20; }
                if (activeIndex === 1) { lx = cx + r; ly = cy + r * 0.2; }
                if (activeIndex === 2) { lx = cx - r; ly = cy + r * 0.2; }

                const angleToLabel = Math.atan2(ly - cy, lx - cx);
                const pulseScale = 1 + Math.sin(globalTime * 6) * 0.15;
                const sx = cx + Math.cos(angleToLabel) * (s.radius * pulseScale);
                const sy = cy + Math.sin(angleToLabel) * (s.radius * pulseScale);

                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(lx, ly);
                ctx.strokeStyle = s.color;
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(sx, sy, 6, 0, Math.PI * 2);
                ctx.fillStyle = s.color;
                ctx.fill();

                ctx.font = '900 40px Inter, sans-serif';
                ctx.fillStyle = '#FFF';
                ctx.shadowColor = s.color;
                ctx.shadowBlur = 15;

                const lines = s.goal.split('\n');
                lines.forEach((line, idx) => {
                    const yOffset = (idx - (lines.length - 1) / 2) * 45;
                    ctx.fillText(line, lx, ly - 15 + yOffset);
                });

                ctx.shadowBlur = 0;

                ctx.font = '400 12px monospace';
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                const subLabelOffset = lines.length > 1 ? 25 : 0;
                ctx.fillText(`SEQ_ID: 0${activeIndex + 1} // STATUS: ACTIVE`, lx, ly + 25 + subLabelOffset);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        const handleResize = () => {
            if (containerRef.current) {
                width = containerRef.current.clientWidth;
                height = containerRef.current.clientHeight;
                canvas.width = width;
                canvas.height = height;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [active]);

    const handleMouseMove = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x, y });
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            style={{
                width: '100%', height: '100%',
                background: '#050505',
                position: 'relative',
                overflow: 'hidden',
                perspective: '1200px'
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    width: '100%', height: '100%',
                    transform: `rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 8}deg) scale(1.15)`,
                    transition: 'transform 0.1s ease-out'
                }}
            />
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.9) 100%)',
                pointerEvents: 'none'
            }} />
        </div>
    );
}

return { Goals2026 };

```

# LiveStream2026

```jsx
// [PATH:src/components/LiveStream2026.jsx]

const { useState, useEffect, useRef } = dc;

/**
 * LiveStream 2026 Component v4
 * - Radius Optimized (Matches Goals2026 max ~290) to fix clipping
 * - Enhanced INDIVIDUAL PULSE (Radius + Brightness + Width)
 * - Red Theme
 */
function LiveStream2026({ active }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!active || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        let width, height;
        let animationFrameId;

        // --- CONFIGURATION ---
        const CHARS = "01xyz<>+-.•";
        const TOTAL_PARTICLES = 500;

        // REDUCED RADII to Fix Clipping (Max was 340, now 290)
        const RINGS = [
            { baseRadius: 130, color: '#EF4444' },
            { baseRadius: 210, color: '#DC2626' },
            { baseRadius: 290, color: '#FECACA' }, // Matched Goals Max  
        ];

        class Particle {
            constructor(ringIdx) {
                this.ringIdx = ringIdx;
                this.reset();
                this.angle = Math.random() * Math.PI * 2;
                this.speedVar = 0.5 + Math.random();
                this.size = Math.random() < 0.5 ? 8 : 12;
                this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
            }

            reset() {
                this.alpha = Math.random() * 0.5 + 0.2;
            }

            update(baseSpeed) {
                this.angle += baseSpeed * this.speedVar;
                if (Math.random() < 0.01) {
                    this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
                }
            }

            getPos(cx, cy, currentRingRadius) {
                const r = currentRingRadius;
                return {
                    x: cx + Math.cos(this.angle) * r,
                    y: cy + Math.sin(this.angle) * r,
                    angle: this.angle + Math.PI / 2
                };
            }
        }

        const particles = [];
        RINGS.forEach((r, idx) => {
            const count = Math.floor(TOTAL_PARTICLES / RINGS.length);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(idx));
            }
        });

        let globalTime = 0;

        const render = () => {
            ctx.clearRect(0, 0, width, height);
            const cx = width / 2;
            const cy = height / 2;
            globalTime += 0.02; // Brisk pace

            // BACKGROUND GRID
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
            ctx.moveTo(0, cy); ctx.lineTo(width, cy);
            ctx.stroke();

            // INDIVIDUAL ACTIVE RING STATE
            const activeRings = RINGS.map((r, i) => {
                // Different frequencies and offsets for "Independent" feel
                const t = globalTime + (i * 2.5); // Phase shift

                // 1. Radius Pulse (Breathing)
                const radiusPulse = Math.sin(t * 1.5) * 10;
                const currentRadius = (r.baseRadius * 1.1) + radiusPulse; // Scale 1.1 included

                // 2. Opacity Pulse
                const opacity = 0.3 + (Math.sin(t * 2) * 0.2); // 0.1 to 0.5

                // 3. Line Width Pulse
                const lineWidth = 1.5 + (Math.sin(t * 2) * 1); // 0.5 to 2.5

                return { currentRadius, opacity, lineWidth, color: r.color };
            });

            // Draw Rings
            activeRings.forEach((r) => {
                ctx.beginPath();
                ctx.arc(cx, cy, r.currentRadius, 0, Math.PI * 2);
                ctx.strokeStyle = r.color;
                ctx.globalAlpha = r.opacity;
                ctx.lineWidth = r.lineWidth;
                ctx.stroke();
            });

            // PARTICLES
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 1;

            particles.forEach(p => {
                const speed = (p.ringIdx + 1) * 0.002 * (p.ringIdx % 2 === 0 ? 1 : -1);
                p.update(speed);

                const ringProps = activeRings[p.ringIdx];
                const pos = p.getPos(cx, cy, ringProps.currentRadius);

                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(pos.angle);
                ctx.fillStyle = ringProps.color;
                ctx.globalAlpha = p.alpha; // Own alpha logic + ring feeling
                ctx.font = `${p.size}px monospace`;
                ctx.fillText(p.char, 0, 0);
                ctx.restore();
            });

            // CENTER: LIVE DOT
            ctx.globalAlpha = 1;
            const centerPulse = 1 + Math.sin(globalTime * 8) * 0.2;
            ctx.beginPath();
            ctx.arc(cx, cy, 10 * centerPulse, 0, Math.PI * 2);
            ctx.fillStyle = '#EF4444';
            ctx.fill();

            // Glow
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50 * centerPulse);
            g.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
            g.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, 50 * centerPulse, 0, Math.PI * 2);
            ctx.fill();


            // TEXT OVERLAY
            ctx.font = '900 64px Inter, sans-serif';
            ctx.fillStyle = '#FFF';
            ctx.shadowColor = '#B91C1C';
            ctx.shadowBlur = 30 + Math.sin(globalTime * 5) * 10; // Pulsing Text Shadow
            ctx.fillText("JOIN US", cx, cy - 80);
            ctx.shadowBlur = 0;

            const infoY = cy + 40;
            ctx.font = '700 20px monospace';
            ctx.fillStyle = '#FCA5A5';
            ctx.letterSpacing = '2px';
            ctx.fillText("LIVE STREAMING", cx, infoY);

            ctx.font = '400 14px monospace';
            ctx.fillStyle = '#FECACA';
            ctx.fillText("EVERY MONDAY @ 7PM EST", cx, infoY + 25);
            ctx.letterSpacing = '0px';

            animationFrameId = requestAnimationFrame(render);
        };

        const handleResize = () => {
            if (containerRef.current) {
                width = containerRef.current.clientWidth;
                height = containerRef.current.clientHeight;
                canvas.width = width;
                canvas.height = height;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [active]);

    const handleMouseMove = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x, y });
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            style={{
                width: '100%', height: '100%',
                background: '#050505',
                position: 'relative',
                overflow: 'hidden',
                perspective: '1000px'
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    width: '100%', height: '100%',
                    transform: `rotateX(${mousePos.y * -5}deg) rotateY(${mousePos.x * 5}deg) scale(1.15)`,
                    transition: 'transform 0.1s ease-out'
                }}
            />
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.95) 100%)',
                pointerEvents: 'none'
            }} />
        </div>
    );
}

return { LiveStream2026 };

```

# HyperCacheMedia

```jsx
// [PATH:src/components/NodeGraph/HyperCacheMedia.jsx]
const { useEffect, useRef, useState, useMemo } = dc;
const { CONTAIN_STYLE, isMediaVideo, isMediaImage, isMediaLocal, getYouTubeEmbed, isLink, getInteractiveUrl } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "NodeGraphUtils"));
const { SafeVideoPlayer } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "SafeVideoPlayer"));
const { SliderList, SliderItem } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "SliderComponents"));

const { GlobeTravel } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "GlobeTravel"));
const { TacticalComments, TacticalEmojiHUD, EmojiRain } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "TacticalComments"));
const { WebsiteCard } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "WebsiteCard"));
const { AutoScrollWebview } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "AutoScrollWebview"));
const { Goals2026 } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "Goals2026"));
const { LiveStream2026 } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "LiveStream2026"));

function HyperCacheMedia({ item, active, mediaIndex, dimensions, autoPlay, preload, isVisible, folderPath }) {
    const [containerWidth, setContainerWidth] = useState(0);
    const [internalIdx, setInternalIdx] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const baseMedia = useMemo(() => {
        if (!item?.media) return [];
        return item.media.map(m => m).filter(m => {
            const u = typeof m === 'string' ? m : (m.videoSrc || m.url);
            return !!u && typeof u === 'string';
        });
    }, [item]);

    const mode = baseMedia.length > 2 ? 'slider' : (baseMedia.length === 2 ? 'duo' : 'stack');
    const itemWidth = containerWidth > 0 ? containerWidth / 3.5 : 0;

    if (!item) return null;

    const scrollRef = useRef(0);
    const trackRef = useRef(null);
    const lastInteractionRef = useRef(0);
    const activeIndexRef = useRef(active ? 0 : -1);
    const lastStateUpdateRef = useRef(0);

    useEffect(() => {
        if (mode !== 'slider' || !active || !trackRef.current) return;
        let frame;
        const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

        const animate = () => {
            const now = Date.now();
            const timeSinceInteract = now - lastInteractionRef.current;
            const currentItemWidth = itemWidth || (containerWidth / 3);
            const totalWidth = currentItemWidth * baseMedia.length;

            if (autoPlay && itemWidth > 0) {
                const targetScroll = mediaIndex * itemWidth;
                scrollRef.current = lerp(scrollRef.current, targetScroll, 0.08);
            } else if (active && timeSinceInteract > 8000) {
                scrollRef.current += 3.5;
            }

            if (currentItemWidth <= 1) { frame = requestAnimationFrame(animate); return; }

            if (scrollRef.current >= totalWidth) scrollRef.current -= totalWidth;
            else if (scrollRef.current < 0) scrollRef.current += totalWidth;

            if (trackRef.current) {
                trackRef.current.style.transform = `translateX(-${scrollRef.current}px)`;
                const children = trackRef.current.children;
                const estimatedIndex = Math.round(scrollRef.current / currentItemWidth);
                const normalizedIndex = estimatedIndex % baseMedia.length;

                if (normalizedIndex !== activeIndexRef.current && (now - lastStateUpdateRef.current > 50)) {
                    activeIndexRef.current = normalizedIndex;
                    lastStateUpdateRef.current = now;
                    setInternalIdx(normalizedIndex);
                }

                const centerIdx = scrollRef.current / currentItemWidth + 1.75;
                const iStart = Math.max(0, Math.floor(centerIdx - 5));
                const iEnd = Math.min(children.length, Math.ceil(centerIdx + 5));

                for (let i = iStart; i < iEnd; i++) {
                    const child = children[i];
                    const inner = child.firstElementChild;
                    if (inner) {
                        const dist = ((i - (scrollRef.current / currentItemWidth)) - 1.75) / 2.25;
                        const rotate = dist * 10;
                        const z = Math.abs(dist) * -50;
                        inner.style.transform = `perspective(800px) rotateY(${rotate}deg) translateZ(${z}px)`;
                    }
                }

                if (!autoPlay && window.updateNodeGraphIndex && (now - lastStateUpdateRef.current > 150)) {
                    if (normalizedIndex !== activeIndexRef.current) {
                        window.updateNodeGraphIndex(normalizedIndex);
                        activeIndexRef.current = normalizedIndex;
                        lastStateUpdateRef.current = now;
                    }
                }
            }
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [mode, active, preload, baseMedia.length, containerWidth, itemWidth, autoPlay, mediaIndex]);

    return (
        <div data-active={active ? "true" : "false"}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: active ? 1 : 0,
                pointerEvents: 'none', // Allow passing through to the globe/nodes
                transition: 'opacity 0.4s ease',
                zIndex: active ? 100 : 1,
                overflow: 'hidden',
                visibility: isVisible ? 'visible' : 'hidden'
            }}
        >
            {item.media?.some(m => m.type === 'flight') ? (
                <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden', pointerEvents: 'auto' }}>
                    <GlobeTravel active={active} from={item.media.find(m => m.type === 'flight').from} to={item.media.find(m => m.type === 'flight').to} folderPath={folderPath} />
                </div>
            ) : ((item.title || '').toUpperCase() === 'JOIN US') ? (
                <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {LiveStream2026 ? <LiveStream2026 active={active} /> : <div style={{ color: 'red', fontSize: '20px', padding: '20px' }}>Error: LiveStream2026 Not Loaded</div>}
                </div>
            ) : ((item.title || '').toUpperCase() === 'GOALS') ? (
                <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {Goals2026 ? <Goals2026 active={active} /> : <div style={{ color: 'red', fontSize: '20px', padding: '20px' }}>Error: Goals2026 Component Not Loaded</div>}
                </div>
            ) : mode === 'duo' ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '16vh', perspective: '1200px', pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', gap: '3vw', width: '90%', justifyContent: 'center', transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
                        {baseMedia.slice(0, 2).map((m, idx) => {
                            return <SliderItem key={idx} m={m} idx={idx} itemWidth={dimensions.width * 0.40} mediaIndex={idx} baseLen={2} parentActive={active} isCenterActive={true} folderPath={folderPath} />;
                        })}
                    </div>
                </div>
            ) : mode === 'slider' ? (
                <div
                    ref={el => {
                        if (el && !el.observerAttached) {
                            const ro = new ResizeObserver(entries => { for (let entry of entries) setContainerWidth(entry.contentRect.width); });
                            ro.observe(el);
                            el.onwheel = (e) => { e.stopPropagation(); e.preventDefault(); lastInteractionRef.current = Date.now(); scrollRef.current += e.deltaY * 0.5; };
                            el.observerAttached = true;
                            setContainerWidth(el.clientWidth);
                        }
                    }}
                    onMouseMove={() => lastInteractionRef.current = Date.now()}
                    style={{
                        width: '140vw', height: '100vh', position: 'fixed', top: 0, left: '-20vw',
                        display: 'flex', alignItems: 'flex-start', paddingTop: '12vh', boxSizing: 'border-box',
                        background: 'transparent', overflow: 'hidden', perspective: '1200px', zIndex: 1,
                        pointerEvents: 'none'
                    }}
                >
                    <div ref={trackRef} style={{ display: 'flex', height: 'auto', alignItems: 'center', width: 'max-content', willChange: 'transform', transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
                        <SliderList baseMedia={baseMedia} mediaIndex={mediaIndex} internalIdx={internalIdx} active={active} itemWidth={itemWidth} folderPath={folderPath} />
                    </div>
                </div>
            ) : (
                <div className="media-burst" style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
                    {(() => {
                        const hasLocalVideo = baseMedia.some(m => {
                            const u = typeof m === 'string' ? m : m.url;
                            return isMediaLocal(u) && isMediaVideo(u);
                        });
                        return baseMedia.map((m, idx) => {
                            const isMain = idx === mediaIndex;
                            const url = typeof m === 'string' ? m : m.url;
                            const displayUrl = typeof m === 'string' ? m : (m.videoSrc || m.url);
                            const startTime = typeof m === 'string' ? 0 : m.startTime;
                            const label = typeof m === 'string' ? '' : m.label;
                            const ytEmbed = getYouTubeEmbed(url, startTime);
                            const isWeb = !ytEmbed && displayUrl.startsWith('http') && !isMediaVideo(displayUrl) && !isMediaImage(displayUrl);
                            const relIdx = (idx - mediaIndex + baseMedia.length) % baseMedia.length;

                            const panTilt = active && isMain && autoPlay && !isHovered ? `rotateY(${Math.sin(Date.now() * 0.001) * 8}deg) rotateX(${Math.cos(Date.now() * 0.0008) * 5}deg) scale(1.05)` : '';
                            const isStealthYouTube = ytEmbed && autoPlay && hasLocalVideo;
                            if (isStealthYouTube) return null;

                            const isCurrentMedia = active && idx === mediaIndex;

                            return (
                                <div key={url + idx}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const targetUrl = getInteractiveUrl(m);
                                        if (targetUrl) window.open(targetUrl);
                                    }}
                                    style={{
                                        cursor: 'pointer', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '1px solid rgba(168,85,247,0.4)', background: '#111', borderRadius: '4px', overflow: 'hidden',
                                        transform: `translate3d(${relIdx * 65}px, ${relIdx * -40}px, -${relIdx * 100}px) rotateZ(${relIdx * -12}deg) ${panTilt}`,
                                        opacity: Math.max(0, 1 - (relIdx * 0.25)), zIndex: 10 - relIdx,
                                        pointerEvents: 'auto',
                                        transition: autoPlay && isMain ? 'transform 0.1s linear, opacity 0.4s ease' : 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease'
                                    }}>
                                    {(active || preload) && isMain ? (
                                        isMediaVideo(displayUrl) ? (
                                            <SafeVideoPlayer
                                                src={displayUrl}
                                                active={isCurrentMedia}
                                                style={{ ...CONTAIN_STYLE, pointerEvents: 'none' }}
                                                folderPath={folderPath}
                                            />
                                        ) : ytEmbed ? (
                                            <iframe src={ytEmbed} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                                        ) : isWeb ? (
                                            <div style={{ width: '100%', height: '100%', background: '#FFF', pointerEvents: 'none' }}>
                                                <AutoScrollWebview src={displayUrl} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} active={idx === mediaIndex} />
                                            </div>
                                        ) : (
                                            <img src={displayUrl} style={{ ...CONTAIN_STYLE, pointerEvents: 'none' }} />
                                        )
                                    ) : <div style={{ width: '100%', height: '100%', background: '#111', pointerEvents: 'none' }}></div>}
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%)', pointerEvents: 'none', zIndex: 2 }} />
                                    {relIdx === 0 && (
                                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', padding: '8px', color: '#A855F7', border: '1px solid rgba(168,85,247,0.5)', zIndex: 10, pointerEvents: 'none' }}>
                                            <span style={{ pointerEvents: 'none' }}>{label ? label.toUpperCase() : `NODE_MONITOR`}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            )}
        </div>
    );
}

return { HyperCacheMedia };

```

# NodeGraph

```jsx
// [PATH:src/components/NodeGraph.jsx]
const { useEffect, useRef, useState, useMemo } = dc;

const { HyperCacheMedia } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "HyperCacheMedia"));
const { TacticalComments, EmojiRain } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "TacticalComments"));

function NodeGraph({ data, isAutoPlayActive, setIsAutoPlayActive, folderPath }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const cinematicRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const lastRenderedMoonsRef = useRef([]);
    const isManualMode = useRef(false);
    const [mediaIndex, setMediaIndex] = useState(0);

    useEffect(() => {
        window.updateNodeGraphIndex = (idx) => { setMediaIndex(idx); };
        return () => { window.updateNodeGraphIndex = null; };
    }, []);

    const [focusedState, setFocusedState] = useState(null);
    const [activeFocusId, setActiveFocusId] = useState(null);
    const [focusedMonthId, setFocusedMonthId] = useState(null);
    const [focusedMonthComments, setFocusedMonthComments] = useState([]);
    const corePulseRef = useRef(0);
    const rotationRef = useRef(0);
    const targetRotationRef = useRef(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const frameIdRef = useRef(null);
    const mousePos = useRef({ x: 0.5, y: 0.5 });
    const tiltRef = useRef({ x: 0, y: 0 });

    const autoPlayRef = useRef({ index: -1, mediaIdx: 0 });
    const cinematicStartedRef = useRef(false);
    const cinematicTimerRef = useRef(null);
    const MONTH_GAP = 0.35, YEAR_GAP = 0.69;
    const locationRef = useRef("");

    const items = useMemo(() => {
        const { width, height } = dimensions;
        if (!height || !width) return { yearSegments: [], monthHubs: [], itemHubs: [], radii: {} };

        const baseScale = ((height / 800) * 0.75 + (width / 1400) * 0.25) * 0.85;
        const s = Math.max(0.5, Math.min(1.2, baseScale));

        const R_YEAR = 90 * s, R_MONTH = 220 * s, R_RING = 300 * s, R_ITEM = 410 * s;
        let curAng = 0; const ySegs = [], mHubs = [], iHubs = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        ["2025", "2026"].forEach((y, yIdx) => {
            const startAng = curAng;
            const yData = data?.years?.find(d => d.year === y);
            const targetGroups = (y === "2025") ? monthNames : (yData?.groups?.map(g => g.name) || []);

            targetGroups.forEach(gName => {
                const mAng = curAng;
                const gData = yData?.groups?.find(g => g.name.toLowerCase().startsWith(gName.toLowerCase().split(' ')[0]));

                if (gData?.items) {
                    const filteredItems = [];
                    let startCode = null;

                    gData.items.forEach(it => {
                        const title = (it.title || it.name || '').toUpperCase();
                        if (title === 'BETO.888') {
                            let code = null;
                            if (it.media && it.media.length > 0) code = it.media[0].text || it.media[0].src || it.media[0];
                            if (!code && it.desc) code = it.desc;
                            if (!code && it.items && it.items.length > 0) code = it.items[0].name || it.items[0].title;
                            if (code && typeof code === 'string') {
                                if (filteredItems.length === 0) startCode = code.trim();
                                else filteredItems[filteredItems.length - 1].betoCode = code.trim();
                            }
                        } else filteredItems.push(it);
                    });

                    if (startCode && filteredItems.length > 0 && !filteredItems[0].betoCode) filteredItems[0].betoCode = startCode;

                    filteredItems.forEach((it, idx) => {
                        const ang = mAng + (filteredItems.length > 1 ? (idx * (0.18 / (filteredItems.length - 1)) - 0.09) : 0);
                        const ix = Math.cos(ang) * R_ITEM, iy = Math.sin(ang) * R_ITEM;
                        iHubs.push({
                            id: it.id || `i-${y}-${gName}-${idx}`, angle: ang, title: it.title, desc: it.desc || "", media: it.media || [], items: it.items || [], betoCode: it.betoCode || null, parentId: `m-${y}-${gName}`,
                            currentMoons: Array.from({ length: Math.max(1, (it.media || []).length) }, (_, i) => ({ x: ix, y: iy, phase: Math.random() * 6.28, shellIdx: i % 2 })),
                            fibers: Array.from({ length: 8 }, () => ({ midA: ang + (Math.random() - 0.5) * 0.1, trackR: R_RING + (R_ITEM - R_RING) * Math.random(), weight: 0.5 }))
                        });
                    });
                    mHubs.push({ id: `m-${y}-${gName}`, angle: mAng, name: gName.toUpperCase(), year: y, isGhost: !gData?.items?.length, comments: gData?.comments || [], betoCode: startCode });
                } else mHubs.push({ id: `m-${y}-${gName}`, angle: mAng, name: gName.toUpperCase(), year: y, isGhost: true, comments: gData?.comments || [] });
                curAng += MONTH_GAP;
            });
            ySegs.push({ year: y, start: startAng, end: curAng - MONTH_GAP });
            curAng += YEAR_GAP;
        });
        return { yearSegments: ySegs, monthHubs: mHubs, itemHubs: iHubs, scaleFactor: s, totalCycle: Math.PI * 2, radii: { R_YEAR, R_MONTH, R_RING, R_ITEM } };
    }, [data, dimensions, MONTH_GAP, YEAR_GAP]);

    const betoCodeRef = useRef(null);
    const betoAnimRef = useRef(0);

    useEffect(() => {
        if (!locationRef.current && items.itemHubs?.length > 0) {
            const firstFlightNode = items.itemHubs.find(h => (h.media || []).some(m => m.type === 'flight'));
            if (firstFlightNode) {
                const f = firstFlightNode.media.find(m => m.type === 'flight');
                if (f) locationRef.current = (f.from || '').toUpperCase();
            }
        }
        if (!focusedState) return;
        const media = focusedState.media || [];
        const flight = media.find(m => m.type === 'flight');
        if (flight) {
            locationRef.current = (flight.from || '').toUpperCase();
            const timer = setTimeout(() => { locationRef.current = (flight.to || '').toUpperCase(); }, 4000);
            return () => clearTimeout(timer);
        } else {
            const hubs = items.itemHubs || [];
            let currentIdx = hubs.findIndex(h => h.id === focusedState.id);
            if (currentIdx === -1) {
                for (let i = hubs.length - 1; i >= 0; i--) { if (hubs[i].angle <= focusedState.angle) { currentIdx = i; break; } }
            }
            if (currentIdx >= 0) {
                let foundLocation = null;
                for (let i = currentIdx - 1; i >= 0; i--) {
                    const prevFlight = (hubs[i].media || []).find(m => m.type === 'flight');
                    if (prevFlight) { foundLocation = (prevFlight.to || '').toUpperCase(); break; }
                }
                if (foundLocation) locationRef.current = foundLocation;
                let foundCode = focusedState.betoCode;
                if (!foundCode) {
                    for (let i = currentIdx; i >= 0; i--) {
                        if (hubs[i].betoCode) { foundCode = hubs[i].betoCode; break; }
                        const mHub = items.monthHubs.find(m => m.id === hubs[i].parentId);
                        if (mHub?.betoCode) { foundCode = mHub.betoCode; break; }
                    }
                }
                if (foundCode !== betoCodeRef.current) { betoCodeRef.current = foundCode; betoAnimRef.current = 0; }
            } else if (betoCodeRef.current) { betoCodeRef.current = null; betoAnimRef.current = 0; }
        }
    }, [focusedState, items.itemHubs, items.monthHubs]);

    useEffect(() => {
        const container = containerRef.current; if (!container) return;
        const obs = new ResizeObserver(entries => {
            if (!entries.length) return;
            const { width, height } = entries[0].contentRect;
            setDimensions(prev => (Math.abs(prev.width - width) < 4 && Math.abs(prev.height - height) < 4) ? prev : { width, height });
        });
        obs.observe(container);
        const hw = e => { e.preventDefault(); targetRotationRef.current -= e.deltaY * 0.0006; if (isAutoPlayActive) setIsAutoPlayActive(false); };
        const hm = e => { const r = container.getBoundingClientRect(); mousePos.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
        container.addEventListener('wheel', hw, { passive: false });
        container.addEventListener('mousemove', hm);
        return () => { obs.disconnect(); container.removeEventListener('wheel', hw); container.removeEventListener('mousemove', hm); };
    }, [isAutoPlayActive]);

    useEffect(() => {
        if (!activeFocusId || !items.itemHubs) return;
        const fHub = items.itemHubs.find(h => h.id === activeFocusId);
        const fMonth = items.monthHubs.find(m => m.id === (fHub?.parentId || activeFocusId));
        console.log(`[Navigation] -> ${fMonth?.name || "UNKNOWN"} | ${fHub?.title || "HUB"} | AutoPlay: ${isAutoPlayActive}`);
    }, [activeFocusId, isAutoPlayActive, items]);

    useEffect(() => {
        if (!isAutoPlayActive) {
            if (cinematicTimerRef.current) { clearTimeout(cinematicTimerRef.current); cinematicTimerRef.current = null; }
            cinematicStartedRef.current = false; return;
        }
        const mediaHubs = (items.itemHubs || []).filter(ih => (ih.media || []).length > 0 || !!ih.desc);
        if (!mediaHubs.length) return;
        const proceed = () => {
            if (!isAutoPlayActive) return;
            const item = mediaHubs[autoPlayRef.current.index];
            if (item && autoPlayRef.current.mediaIdx < Math.max(1, (item.media || []).length) - 1) {
                autoPlayRef.current.mediaIdx++; setMediaIndex(autoPlayRef.current.mediaIdx);
                if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
                cinematicTimerRef.current = setTimeout(proceed, 7000); return;
            }
            autoPlayRef.current.index++; autoPlayRef.current.mediaIdx = 0;
            if (autoPlayRef.current.index >= mediaHubs.length) { setIsAutoPlayActive(false); autoPlayRef.current.index = -1; cinematicStartedRef.current = false; return; }
            const next = mediaHubs[autoPlayRef.current.index];
            setActiveFocusId(next.id); setFocusedState(next); setMediaIndex(0); targetRotationRef.current = next.angle;
            if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
            cinematicTimerRef.current = setTimeout(proceed, 10000);
        };
        if (!cinematicStartedRef.current) {
            cinematicStartedRef.current = true; const first = mediaHubs[0];
            if (Math.abs(rotationRef.current - (first?.angle || 0)) > 0.5) {
                autoPlayRef.current.index = 0; autoPlayRef.current.mediaIdx = 0; targetRotationRef.current = first.angle;
                setActiveFocusId(first.id); setFocusedState(first); setMediaIndex(0);
                if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
                cinematicTimerRef.current = setTimeout(proceed, 6000);
            } else {
                if (autoPlayRef.current.index === -1) {
                    let best = 0, minD = 999;
                    mediaHubs.forEach((it, i) => { const d = Math.abs(rotationRef.current - (it.angle || 0)); if (d < minD) { minD = d; best = i; } });
                    autoPlayRef.current.index = best;
                }
                const node = mediaHubs[autoPlayRef.current.index]; if (node) { setActiveFocusId(node.id); setFocusedState(node); }
                if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
                cinematicTimerRef.current = setTimeout(proceed, 6000);
            }
        } else if (!cinematicTimerRef.current) cinematicTimerRef.current = setTimeout(proceed, 5000);
        const hk = (e) => {
            if (!isAutoPlayActive || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
            e.preventDefault(); e.stopPropagation(); if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
            const dir = e.key === 'ArrowRight' ? 1 : -1;
            const currentNode = mediaHubs[autoPlayRef.current.index], mediaLen = currentNode ? Math.max(1, (currentNode.media || []).length) : 1;
            let newMediaIdx = autoPlayRef.current.mediaIdx + dir, newNodeIdx = autoPlayRef.current.index;
            if (newMediaIdx >= mediaLen) { newNodeIdx++; newMediaIdx = 0; }
            else if (newMediaIdx < 0) { newNodeIdx--; const prev = mediaHubs[((newNodeIdx % mediaHubs.length) + mediaHubs.length) % mediaHubs.length]; newMediaIdx = Math.max(1, (prev.media || []).length) - 1; }
            if (newNodeIdx < 0) newNodeIdx = mediaHubs.length - 1; if (newNodeIdx >= mediaHubs.length) newNodeIdx = 0;
            const next = mediaHubs[newNodeIdx]; autoPlayRef.current.index = newNodeIdx; autoPlayRef.current.mediaIdx = newMediaIdx;
            setActiveFocusId(next.id); setFocusedState(next); setMediaIndex(newMediaIdx); targetRotationRef.current = next.angle;
            cinematicTimerRef.current = setTimeout(proceed, 10000);
        };
        window.addEventListener('keydown', hk); return () => window.removeEventListener('keydown', hk);
    }, [isAutoPlayActive, items.itemHubs]);

    useEffect(() => {
        if (!data || isInitialized) return;
        let foundAng = (12 * MONTH_GAP) + YEAR_GAP, stop = false;
        data.years?.forEach((y, yIdx) => { if (stop) return; y.groups?.forEach((g, mIdx) => { if (stop) return; if (g.items?.length > 0) { foundAng = (yIdx * (12 * MONTH_GAP + YEAR_GAP)) + (mIdx * MONTH_GAP); stop = true; } }); });
        rotationRef.current = foundAng; targetRotationRef.current = foundAng; setIsInitialized(true);
    }, [data, isInitialized]);

    useEffect(() => {
        if (!focusedState) return; corePulseRef.current = 1.0;
        if (isAutoPlayActive) return;
        const interval = setInterval(() => { if (!isManualMode.current) setMediaIndex(p => (p + 1) % (focusedState.media?.length || 1)); }, 3500);
        return () => clearInterval(interval);
    }, [focusedState, isAutoPlayActive]);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas || !dimensions.width) return;
        const ctx = canvas.getContext('2d'), { width, height } = dimensions, dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr);
        const render = () => {
            const time = Date.now() * 0.0006, { yearSegments, monthHubs, itemHubs, scaleFactor: s, totalCycle, radii } = items, { R_YEAR, R_MONTH, R_RING, R_ITEM } = radii;
            rotationRef.current += (targetRotationRef.current - rotationRef.current) * 0.1; const scroll = rotationRef.current; corePulseRef.current *= 0.95;
            const getPos = (ang) => { let d = (ang - scroll) % totalCycle; if (d > totalCycle * 0.5) d -= totalCycle; if (d < -totalCycle * 0.5) d += totalCycle; return { ang: d, x: Math.cos(d), y: Math.sin(d), dist: d }; };
            ctx.clearRect(0, 0, width, height); ctx.save(); ctx.translate(0, height * 0.1);
            ctx.save(); const cr = (55 + corePulseRef.current * 25) * s; ctx.rotate(time * 0.3); ctx.strokeStyle = `rgba(255,255,255,${0.15 + corePulseRef.current * 0.4})`; ctx.lineWidth = (1 + corePulseRef.current * 1.5) * s;
            for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI; ctx.beginPath(); ctx.ellipse(0, 0, cr, cr * Math.abs(Math.sin(time + a)), time + a, 0, 6.28); ctx.stroke(); }
            ctx.beginPath(); ctx.arc(0, 0, (15 + corePulseRef.current * 10) * s, 0, 6.28); ctx.fillStyle = `rgba(255,255,255,${0.4 + corePulseRef.current * 0.6})`; ctx.fill(); ctx.restore();
            ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1 * s;[R_YEAR, R_MONTH, R_ITEM].forEach(r => { ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.28); ctx.stroke(); });
            ctx.strokeStyle = 'rgba(168,85,247,0.15)'; ctx.setLineDash([5 * s, 15 * s]); ctx.beginPath(); ctx.arc(0, 0, R_RING, 0, 6.28); ctx.stroke(); ctx.restore();
            let fItem = null, minDist = 999;
            itemHubs.forEach(ih => { const d = Math.abs(getPos(ih.angle).dist); if (d < minDist) { minDist = d; fItem = ih; } });
            const fItemPos = fItem ? getPos(fItem.angle) : null;

            // HYSTERESIS: Be more strict about GAINING focus, but more lenient about KEEPING it.
            const focusThreshold = activeFocusId ? 0.3 : 0.2;
            const fActiveFocus = fItem && (isAutoPlayActive || Math.abs(fItemPos.dist) < focusThreshold);

            if (fActiveFocus) {
                if (activeFocusId !== fItem.id) {
                    setActiveFocusId(fItem.id);
                    setFocusedState(fItem);
                    if (!isAutoPlayActive) setMediaIndex(0);
                }
            }
            else if (activeFocusId) {
                setActiveFocusId(null);
                setFocusedState(null);
                setMediaIndex(0);
            }
            let fMonth = null, minMDist = 999;
            monthHubs.forEach(mh => { const d = Math.abs(getPos(mh.angle).dist); if (d < minMDist) { minMDist = d; fMonth = mh; } });
            const fMonthPos = fMonth ? getPos(fMonth.angle) : null;
            if (fMonth && Math.abs(fMonthPos.dist) < 0.25) { if (focusedMonthId !== fMonth.id) { setFocusedMonthId(fMonth.id); setFocusedMonthComments(fMonth.comments); setActiveFocusId(fMonth.id); setFocusedState(fMonth); setMediaIndex(0); } }
            else if (focusedMonthId) { setFocusedMonthId(null); setFocusedMonthComments([]); }
            yearSegments.forEach(seg => {
                const sa = getPos(seg.start), ea = getPos(seg.end); if (Math.abs(sa.dist) > 2.5 && Math.abs(ea.dist) > 2.5) return;
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2.5 * s; ctx.beginPath(); ctx.arc(0, 0, 105 * s, sa.ang, ea.ang); ctx.stroke();
                const lp = getPos(seg.start + 0.12); ctx.save(); ctx.translate(lp.x * 105 * s, lp.y * 105 * s); ctx.rotate(lp.ang + Math.PI / 2); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = `900 ${18 * s}px Inter`; ctx.textAlign = 'center'; ctx.fillText(seg.year, 0, -12 * s); ctx.restore();
            });
            monthHubs.forEach(mh => {
                const pos = getPos(mh.angle); if (Math.abs(pos.dist) > 1.4) return;
                const op = 0.3 + Math.pow(Math.max(0, 1 - Math.abs(pos.dist) * 1.5), 2) * 0.7, mx = pos.x * R_MONTH, my = pos.y * R_MONTH;
                if (fMonth?.id === mh.id && Math.abs(pos.dist) < 0.25 && !mh.isGhost) {
                    ctx.save(); ctx.strokeStyle = '#A855F7'; ctx.lineWidth = 5 * s; ctx.setLineDash([15 * s, 10 * s]); ctx.lineDashOffset = -time * 25; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(mx, my); ctx.globalAlpha = 0.4 + Math.sin(time * 3) * 0.1; ctx.stroke(); ctx.restore();
                }
                ctx.strokeStyle = `rgba(255,255,255,${0.15 * op})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(mx, my); ctx.stroke();
                ctx.beginPath(); ctx.arc(mx, my, 4 * s, 0, 6.28); ctx.fillStyle = `rgba(255,255,255,${op})`; ctx.fill();
                ctx.save(); ctx.translate(mx, my); ctx.rotate(pos.ang); ctx.font = `900 ${22 * s}px Inter`; ctx.textAlign = 'left'; ctx.fillStyle = `rgba(255,255,255,${op * 0.6})`; ctx.fillText(mh.name, 26 * s, 6 * s); ctx.restore();
            });
            itemHubs.forEach(ih => {
                const pos = getPos(ih.angle); if (Math.abs(pos.dist) > 1.2 || (ih.title || '').toUpperCase() === 'BETO.888') return;
                const isF = activeFocusId === ih.id, op = isF ? 1 : 0.2 + Math.pow(Math.max(0, 1 - Math.abs(pos.dist) * 2), 2) * 0.4, ix = pos.x * R_ITEM, iy = pos.y * R_ITEM;
                const parent = monthHubs.find(p => p.id === ih.parentId), pPos = parent ? getPos(parent.angle) : null;
                if (pPos && Math.abs(pos.dist) < 0.6) {
                    const px = pPos.x * R_MONTH, py = pPos.y * R_MONTH;
                    ih.fibers.forEach(f => {
                        const midA = getPos(f.midA).ang, cx = Math.cos(midA) * f.trackR, cy = Math.sin(midA) * f.trackR;
                        if (isF) {
                            ctx.strokeStyle = `rgba(168,85,247,${0.15 * op})`; ctx.lineWidth = 0.6 * s; ctx.font = `bold ${8 * s}px monospace`; ctx.textAlign = 'center';
                            for (let i = 0; i < 5; i++) { const ft = (i / 5 + time * 0.5) % 1, it = 1 - ft, bx = it * it * px + 2 * it * ft * cx + ft * ft * ix, by = it * it * py + 2 * it * ft * cy + ft * ft * iy; ctx.fillStyle = `rgba(168,85,247,${Math.sin(ft * 3.14) * 0.6 * op})`; ctx.fillText(i % 2 === 0 ? "1" : "0", bx, by); }
                            ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(cx, cy, ix, iy); ctx.stroke();
                        } else { ctx.strokeStyle = `rgba(168,85,247,${0.08 * op})`; ctx.lineWidth = 0.2 * s; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ix, iy); ctx.stroke(); }
                    });
                }
                if (Math.abs(pos.dist) < 0.5) {
                    const baseMedia = ih.media || [], or = (35 + baseMedia.length * 4) * s;
                    if (isF && (!Array.isArray(lastRenderedMoonsRef.current) || lastRenderedMoonsRef.current.length !== baseMedia.length)) lastRenderedMoonsRef.current = baseMedia.map((_, i) => ({ x: 0, y: 0, index: i }));
                    for (let i = 0; i < baseMedia.length; i++) {
                        const m = ih.currentMoons[i], a = time + m.phase, tx = isF ? ix + (60 * s) : ix + Math.cos(a) * or, ty = isF ? iy + ((i - (baseMedia.length - 1) / 2) * (20 * s)) : iy + Math.sin(a) * (or * 0.3);
                        m.x += (tx - m.x) * 0.15; m.y += (ty - m.y) * 0.15; if (isF) { lastRenderedMoonsRef.current[i].x = m.x; lastRenderedMoonsRef.current[i].y = m.y; }
                        const cur = isF && i === mediaIndex; ctx.beginPath(); ctx.arc(m.x, m.y, (cur ? 6 : 3) * s, 0, 6.28); ctx.fillStyle = cur ? '#FFF' : `rgba(255,255,255,${isF ? 0.8 : 0.4})`; ctx.fill();
                        if (isF) { ctx.strokeStyle = `rgba(255,255,255,${cur ? 0.3 : 0.1})`; ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(m.x, m.y); ctx.stroke(); }
                    }
                }
                ctx.beginPath(); ctx.arc(ix, iy, (isF ? 18 : 8) * s, 0, 6.28); ctx.fillStyle = isF ? '#A855F7' : `rgba(168, 85, 247, ${op * 0.6})`; ctx.fill();
            });
            ctx.restore();
            const hs = Math.min(1.2, Math.max(0.7, (height / 800) * 0.7 + (width / 1400) * 0.3)), rm = 80 * hs; ctx.textAlign = 'right';
            let activeYear = fMonth?.year || ""; if (!activeYear) { const norm = ((scroll % totalCycle) + totalCycle) % totalCycle; for (let i = yearSegments.length - 1; i >= 0; i--) { if (norm >= yearSegments[i].start - 0.1) { activeYear = yearSegments[i].year; break; } } }
            if (activeYear) {
                const sfx = activeYear === "2026" ? "PLAN" : "RECAP"; ctx.fillStyle = '#FFF'; ctx.font = `900 ${70 * hs}px Inter`; ctx.fillText(sfx, width - rm, 100 * hs);
                const rw = ctx.measureText(sfx).width, ix = width - rm - rw - 25 * hs; ctx.fillStyle = 'rgba(168, 85, 247, 0.9)'; ctx.font = `300 ${32 * hs}px Inter`; ctx.fillText(activeYear, ix, 100 * hs - 2 * hs);
                if (activeYear !== '2026' && locationRef.current) { ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; ctx.font = `700 ${12 * hs}px monospace`; ctx.fillText(locationRef.current.toUpperCase(), ix, 100 * hs - 32 * hs - 6 * hs); }
                if (activeYear !== '2026' && betoCodeRef.current) { if (betoAnimRef.current < 1) betoAnimRef.current += 0.05; ctx.fillStyle = `rgba(255, 255, 255, ${betoAnimRef.current})`; ctx.font = `700 ${11 * hs}px monospace`; ctx.fillText(`• ${betoCodeRef.current}`, width - rm, 100 * hs - 62 * hs + (12 * hs * (1 - betoAnimRef.current))); }
                const tw = rw + ctx.measureText(activeYear).width + 40 * hs; ctx.fillStyle = 'rgba(168, 85, 247, 0.3)'; ctx.fillRect(width - rm - tw, 115 * hs, tw, 2 * hs);
            }
            ctx.textAlign = 'left'; ctx.save(); const tx = width - 40 * hs; ctx.translate(tx, 0); ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, height); ctx.stroke();
            const TSCALE = 600 * s;
            itemHubs.forEach(ih => {
                if ((ih.title || '').toUpperCase() === 'BETO.888') return;
                const pos = getPos(ih.angle), dy = pos.dist * TSCALE + height / 2; if (dy < -20 || dy > height + 20) return;
                const op = Math.max(0, 1.0 - Math.abs(pos.dist) / 1.5); if (op <= 0) return;
                ctx.beginPath(); ctx.strokeStyle = activeFocusId === ih.id ? '#A855F7' : 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 1 * s; ctx.moveTo(-8 * s, dy); ctx.lineTo(8 * s, dy); ctx.stroke();
                if (activeFocusId === ih.id) { ctx.beginPath(); ctx.arc(0, dy, 2.5 * s, 0, 6.28); ctx.fillStyle = '#FFF'; ctx.fill(); ctx.stroke(); }
            });
            monthHubs.forEach(mh => {
                const pos = getPos(mh.angle), dy = pos.dist * TSCALE + height / 2; if (dy < -50 || dy > height + 50) return;
                const isActive = focusedMonthId === mh.id; ctx.beginPath(); ctx.strokeStyle = isActive ? '#A855F7' : 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = isActive ? 3 * s : 1 * s; ctx.moveTo(-15 * s, dy); ctx.lineTo(15 * s, dy); ctx.stroke();
                ctx.fillStyle = isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255, 255, 255, 0.4)'; ctx.font = `${isActive ? '700' : '400'} ${10 * s}px Inter`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(mh.name, -22 * s, dy);
                if (isActive) { ctx.beginPath(); ctx.arc(0, dy, 4 * s, 0, 6.28); ctx.fillStyle = '#A855F7'; ctx.fill(); }
            });
            ctx.restore(); const tt = { x: (mousePos.current.y - 0.5) * -30, y: (mousePos.current.x - 0.5) * 40 }; tiltRef.current.x += (tt.x - tiltRef.current.x) * 0.1; tiltRef.current.y += (tt.y - tiltRef.current.y) * 0.1;
            frameIdRef.current = requestAnimationFrame(render);
        }; render(); return () => cancelAnimationFrame(frameIdRef.current);
    }, [items, dimensions, mediaIndex, activeFocusId]);

    useEffect(() => {
        let frame;
        const animateFloat = () => {
            if (cinematicRef.current) { const t = Date.now() * 0.002, y = Math.sin(t) * 10, rx = tiltRef.current.x + Math.sin(t * 0.7) * 2, ry = tiltRef.current.y + Math.cos(t * 0.5) * 3, rz = Math.sin(t * 0.3) * 1; cinematicRef.current.style.transform = `translateY(calc(-50% + ${y}px)) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`; }
            frame = requestAnimationFrame(animateFloat);
        }; animateFloat(); return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        const container = containerRef.current; if (!container) return;
        const hcc = (e) => {
            if (!canvasRef.current) return;
            const r = canvasRef.current.getBoundingClientRect(), dpr = window.devicePixelRatio || 1, x = (e.clientX - r.left) * dpr, y = (e.clientY - r.top) * dpr;
            const hit = lastRenderedMoonsRef.current.find(m => Math.hypot(m.x - x, m.y - y) < 30 * dpr);
            if (hit) { setMediaIndex(hit.index); isManualMode.current = true; if (isAutoPlayActive) setIsAutoPlayActive(false); e.stopPropagation(); e.preventDefault(); }
        };
        container.addEventListener('click', hcc);
        return () => container.removeEventListener('click', hcc);
    }, [isAutoPlayActive, items]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#050505', position: 'relative', overflow: 'hidden', cursor: 'crosshair' }}>
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none', zIndex: 100, cursor: 'default' }} />
            <div ref={cinematicRef}
                style={{ position: 'absolute', top: '60%', right: '15%', width: '68%', aspectRatio: '16/9', transform: `translateY(-50%)`, opacity: focusedState ? 1 : 0, transition: 'opacity 0.4s ease, transform 0.1s linear', zIndex: 500, perspective: '1000px', pointerEvents: 'none', cursor: 'pointer' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                        {(() => {
                            const mediaHubs = (items.itemHubs || []).filter(ih => (ih.media || []).length > 0 || !!ih.desc), activeIdx = mediaHubs.findIndex(h => h.id === activeFocusId);
                            return mediaHubs.map((ih, idx) => {
                                const isActive = activeFocusId === ih.id, isNeighbor = !isActive && activeIdx !== -1 && Math.min(Math.abs(idx - activeIdx), mediaHubs.length - Math.abs(idx - activeIdx)) <= 1;
                                return (isActive || isNeighbor) ? <HyperCacheMedia key={ih.id} item={ih} active={isActive} preload={isNeighbor} isVisible={isActive || isNeighbor} mediaIndex={isActive ? mediaIndex : 0} dimensions={dimensions} autoPlay={isAutoPlayActive && isActive} folderPath={folderPath} /> : null;
                            });
                        })()}
                    </div>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)', padding: '12px 64px', zIndex: 30, pointerEvents: 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'right' }}>
                            {(focusedState?.title || '').toUpperCase() !== 'JOIN US' && <h2 style={{ color: '#FFF', fontSize: '32px', margin: 0, fontWeight: 900, letterSpacing: '-1px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{(focusedState?.title || '').toUpperCase()}</h2>}
                            {focusedState?.desc && (focusedState.title || '').toUpperCase() !== 'GOALS' && (focusedState.title || '').toUpperCase() !== 'JOIN US' && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{focusedState.desc}</p>}
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 200 }}>
                <TacticalComments comments={focusedMonthComments} activeId={focusedMonthId} />
                <EmojiRain activeId={activeFocusId + (items.itemHubs.find(h => h.id === activeFocusId)?.media[mediaIndex]?.url || "")} emojis={[...(items.itemHubs.find(h => h.id === activeFocusId)?.emojis || []), ...(items.itemHubs.find(h => h.id === activeFocusId)?.media[mediaIndex]?.emojis || [])]} />
            </div>
        </div>
    );
}

return { NodeGraph };

```

# App

```jsx
// [PATH:src/App.jsx]


const { useState, useEffect, useRef } = dc;

// --- DOM Traversal Utilities ---
function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
        if (current.classList && current.classList.contains(className)) {
            return current;
        }
        current = current.parentNode;
    }
    return null;
}

function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (const child of parent.children) {
        if (child.classList && child.classList.contains(className)) {
            return child;
        }
    }
    return null;
}

function applyBrowserMode(container) {
    if (!document.fullscreenElement) {
        (container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen)?.call(container)
            .catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
    } else if (document.fullscreenElement === container) {
        document.exitFullscreen?.();
    }
}

// --- Smart Lookup Utility ---
const resolveSmart = (name, header = null) => {
    const raw = dc.resolvePath(name) || name;
    const absolute = raw.startsWith('/') ? raw : '/' + raw;
    if (header) {
        // Try to find if we are in a bundle named D.q.animationtool.component
        const selfPath = dc.resolvePath("D.q.animationtool.component.md") || dc.resolvePath("D.q.animationtool.component");
        if (selfPath) return dc.headerLink(selfPath, header);
    }
    return absolute;
};

// Robust Component Loader
const { NodeGraph } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "NodeGraph"));


function AnimationTool({ folderPath }) {
    const [isFullTab, setIsFullTab] = useState(true);
    const [isAutoPlayActive, setIsAutoPlayActive] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [isCinematicReady, setIsCinematicReady] = useState(false); // Delayed Animation State
    const [graphData, setGraphData] = useState(null);

    // Load and Parse Data
    useEffect(() => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        async function loadData() {
            try {
                const vault = dc.app.vault;
                const adapter = vault.adapter;

                // Prioritize local resource path if folderPath is available
                // This ensures relocation stability (D.q.animationtool.viewer doesn't need to be in dist)
                const localRecapPath = folderPath ? (folderPath + '/recap.md') : null;
                const recapPath = localRecapPath || dc.resolvePath('recap.md');

                let text = null;
                if (recapPath && await adapter.exists(recapPath)) {
                    text = await adapter.read(recapPath);
                    console.log(`AnimationTool: Loaded data from ${recapPath}`);
                }

                // Fallback: If resolvePath failed (unlikely if file exists), try manual search
                if (!text) {
                    const files = vault.getFiles();
                    const recapFile = files.find(f => f.name === 'recap.md');
                    if (recapFile) {
                        text = await vault.read(recapFile);
                        console.log(`AnimationTool: Found recap.md via global search at ${recapFile.path}`);
                    }
                }

                if (!text) throw new Error("Could not locate recap.md in vault");

                // --- Enhanced Robust Indentation-Aware Parser ---
                const yearsMap = {};
                const yearLines = text.split('\n');
                let currentYear = "2025";
                let currentMonth = null;
                let currentItem = null;
                let currentMediaEntry = null;

                // Emoji Mapping (Lucide Equivalents)
                const EMOJI_TO_ICON = {
                    '🔥': 'flame', '👀': 'eye', '❤️': 'heart', '🤍': 'heart',
                    '⭐️': 'star', '👏': 'sparkles', '👍': 'thumbs-up',
                    '🚀': 'rocket', '🎮': 'gamepad-2', '🎵': 'music', '✨': 'sparkles',
                    '🏆': 'trophy', '💎': 'gem', '🍀': 'clover', '💬': 'message-square',
                    '⬆️': 'arrow-big-up', '⬇️': 'arrow-big-down',
                    '🫡': 'check-circle', '🤯': 'zap', '💯': 'check-check', '✅': 'check',
                    '💥': 'zap', '⚡️': 'zap'
                };

                // Tracking state
                let inCommentsMode = false;
                let inEmojiMode = false;
                let lastParentByIndent = {};
                let lastMediaIndent = -1;
                let idCounter = 0; // For unique IDs
                let groupOrders = {}; // Track order of custom groups per year

                for (const line of yearLines) {
                    if (!line.trim()) continue;

                    // 1. Year Header (# 2025 Recap OR # 2025)
                    const yearMatch = line.match(/^\s*#\s+(\d{4})(.*)/i);
                    if (yearMatch) {
                        currentYear = yearMatch[1];
                        console.log(`[ParserDebug] Year Shift: ${currentYear}`);
                        if (!yearsMap[currentYear]) {
                            yearsMap[currentYear] = {};
                            groupOrders[currentYear] = [];
                        }
                        currentMonth = null;
                        continue;
                    }

                    // 1b. Catch-all for non-year Top Headers
                    const topHeaderMatch = line.match(/^\s*#\s+([^0-9#\n].+)/);
                    if (topHeaderMatch) {
                        const title = topHeaderMatch[1].trim();
                        // For 2026, use the title as the "month" key for custom grouping
                        if (currentYear === "2026") {
                            currentMonth = title;
                        } else {
                            // If no month is set yet, and it's not 2026, we don't default to January.
                            // The group will be created based on the first actual month header or item.
                        }

                        if (!yearsMap[currentYear][currentMonth]) {
                            const mArr = []; mArr.comments = [];
                            yearsMap[currentYear][currentMonth] = mArr;
                            if (groupOrders[currentYear] && !groupOrders[currentYear].includes(currentMonth)) {
                                groupOrders[currentYear].push(currentMonth);
                            }
                        }

                        currentItem = { id: `special-${idCounter++}`, title, desc: "", media: [], emojis: [] };
                        yearsMap[currentYear][currentMonth].push(currentItem);
                        continue;
                    }

                    // 2. Month Header (## January / ## Jan)
                    const monthMatch = line.match(/^\s*##\s+([a-z]+)/i);
                    if (monthMatch) {
                        const mRaw = monthMatch[1].toLowerCase();
                        const mIdx = monthNames.findIndex(mn => mn.toLowerCase().startsWith(mRaw));
                        if (mIdx !== -1) {
                            currentMonth = monthNames[mIdx];
                            console.log(`[ParserDebug] Found Month: ${currentMonth}`);
                            if (!yearsMap[currentYear]) yearsMap[currentYear] = {};
                            if (!yearsMap[currentYear][currentMonth]) {
                                const mArr = [];
                                mArr.comments = []; // Attach comments array to the month array
                                yearsMap[currentYear][currentMonth] = mArr;
                                if (groupOrders[currentYear] && !groupOrders[currentYear].includes(currentMonth)) {
                                    groupOrders[currentYear].push(currentMonth);
                                }
                            }
                        }
                        inCommentsMode = false;
                        inEmojiMode = false;
                        currentItem = null; // New month starts fresh
                        currentMediaEntry = null; // Clear media context
                        lastMediaIndent = -1;
                        continue;
                    }

                    // 3. Robust Bullet Processor (Handles -, *, +)
                    const bulletMatch = line.match(/^(\s*)([-*+])\s+(.+)/);
                    if (bulletMatch && currentMonth) {
                        const indent = bulletMatch[1] || "";
                        const content = bulletMatch[3].trim();
                        const indentLevel = indent.replace(/\t/g, '    ').length; // Standardize tab to 4 spaces

                        lastParentByIndent[indentLevel] = content;

                        // Section Detection
                        const lowerContent = content.toLowerCase();
                        if (lowerContent === 'comments' && indentLevel === 0) {
                            inCommentsMode = true; inEmojiMode = false; continue;
                        }
                        if (lowerContent === 'emoji' && indentLevel > 0) {
                            inEmojiMode = true; continue;
                        }

                        // Exit Modes
                        if (indentLevel === 0) {
                            inCommentsMode = false;
                            inEmojiMode = false;
                            // RESET PARSER CONTEXT
                            // If we hit root indent, previous media chains are broken.
                            currentMediaEntry = null;
                            lastMediaIndent = -1;
                        }
                        // If we are deep indent and in emoji mode, reset it if we jump back up
                        if (inEmojiMode && indentLevel <= (currentMediaEntry ? 4 : (currentItem ? 4 : 0))) {
                            // This is a bit complex, let's just use the indent logic:
                            // If it's not an emoji line (X x Y), it's probably something else.
                        }

                        if (inCommentsMode && indentLevel > 0) {
                            // Struct: Platform (4), Username (8), Text (12)
                            const currentMonthObj = yearsMap[currentYear][currentMonth];
                            if (indentLevel >= 12) {
                                let platform = "General";
                                let username = "Anonymous";
                                Object.keys(lastParentByIndent).forEach(ind => {
                                    const val = parseInt(ind);
                                    if (val < indentLevel) {
                                        if (val >= 4 && val < 8) platform = lastParentByIndent[ind];
                                        if (val >= 8 && val < 12) username = lastParentByIndent[ind];
                                    }
                                });
                                const cleanText = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
                                currentMonthObj.comments.push({ platform: platform.trim(), user: username.trim(), text: cleanText });
                            }
                            continue;
                        }

                        if (inEmojiMode && indentLevel > 0) {
                            // Format: 🔥 x 5
                            const reactionMatch = content.match(/([^\s]+)\s+x\s+(\d+)/);
                            if (reactionMatch) {
                                const emoji = reactionMatch[1];
                                const count = reactionMatch[2];
                                const icon = EMOJI_TO_ICON[emoji] || 'zap';
                                const target = currentMediaEntry || currentItem;
                                if (target) {
                                    if (!target.emojis) target.emojis = [];
                                    target.emojis.push({ icon, count, original: emoji });
                                }
                                continue;
                            }
                        }

                        const isUrl = content.match(/^https?:\/\//i) || content.match(/\.(png|jpg|jpeg|gif|mp4|webm|mov|ogg|m4v|mkv)$/i) || content.startsWith('[[');

                        if (isUrl) {
                            // Media Entry
                            let finalUrl = content;

                            // Smart Vault Search (Relocation-Proof)
                            const findVaultFile = async (searchStr) => {
                                const clean = searchStr.replace(/[\[\]]/g, '').trim();
                                const fileName = clean.split('/').pop();

                                // Helper to check existence
                                const verifyExists = async (path) => {
                                    if (!path) return false;
                                    return await adapter.exists(path);
                                };

                                // 1. Try Local Resource Directories first (Relocation-Proof)
                                if (folderPath) {
                                    // Normalize folderPath to be relative to vault root for getAbstractFileByPath
                                    // This assumes folderPath might be absolute on some systems
                                    const base = folderPath.startsWith('/') ? folderPath.substring(1) : folderPath;

                                    const localPaths = [
                                        `${base}/_resources/videos/${fileName}`,
                                        `${base}/_resources/images/${fileName}`,
                                        `${base}/_resources/${fileName}`,
                                        `${base}/${clean}`
                                    ].map(p => p.replace(/\/\//g, '/')); // Cleanup double slashes

                                    for (const lp of localPaths) {
                                        // Try relative path first
                                        const relativeLp = lp.startsWith('/') ? lp.substring(1) : lp;
                                        if (await verifyExists(relativeLp)) {
                                            const file = vault.getAbstractFileByPath(relativeLp);
                                            if (file) {
                                                console.log(`[ParserDebug] Local Match Found: ${file.path}`);
                                                return file;
                                            }
                                        }
                                        // Try absolute as fallback for adapter
                                        if (lp.startsWith('/') && await verifyExists(lp)) {
                                            // We still need a TFile, so we might need to search or just rely on the relative match above
                                        }
                                    }
                                }

                                // 2. Try Datacore's Native Robust Resolution
                                try {
                                    const resolvedPath = dc.resolvePath(clean);
                                    if (resolvedPath) {
                                        const file = vault.getAbstractFileByPath(resolvedPath);
                                        if (file && await verifyExists(file.path)) {
                                            console.log(`[ParserDebug] dc.resolvePath found: ${file.path}`);
                                            return file;
                                        }
                                    }
                                } catch (e) { }

                                // 3. Fallback: Desperate Global Search
                                const fileNameOnly = fileName.toLowerCase();
                                const allFiles = vault.getFiles();
                                const desperateMatch = allFiles.find(f => f.name.toLowerCase() === fileNameOnly);
                                if (desperateMatch && await verifyExists(desperateMatch.path)) {
                                    console.log(`[ParserDebug] Desperate Match Found: ${desperateMatch.path}`);
                                    return desperateMatch;
                                }

                                return null;
                            };





                            let resolvedFile = null;

                            if (content.startsWith('[[') || (!content.startsWith('http') && content.match(/\./))) {
                                const file = await findVaultFile(content);
                                if (file) {
                                    // Use Obsidian's resource path
                                    finalUrl = vault.getResourcePath(file);
                                    // Remove trailing ? modification hashes which break video demuxer
                                    if (finalUrl.match(/\.(webm|mp4|mov|mkv|m4v|avi)/i)) {
                                        finalUrl = finalUrl.split('?')[0];
                                    }
                                    resolvedFile = file;
                                    console.log(`[ParserDebug] Resolved ${content} -> ${finalUrl}`);
                                } else {
                                    console.warn(`[ParserDebug] Failed to resolve file: ${content}`);
                                    const fuzzy = content.replace(/[\[\]]/g, '').trim().replace(/_/g, ' ');
                                    const file2 = await findVaultFile(fuzzy);
                                    if (file2) {
                                        finalUrl = vault.getResourcePath(file2).split('?')[0]; // Clean fuzzy too
                                        resolvedFile = file2;
                                        console.log(`[ParserDebug] Fuzzy Resolved ${content} -> ${finalUrl}`);
                                    }
                                }
                            }

                            // DEBUG: Trace February Item
                            if (content.includes('Mo4Qssx3JXE') || content.includes('Remaster')) {
                                console.log(`[FebDebug] Processing: "${content}" | Indent: ${indentLevel} | LastMediaIndent: ${lastMediaIndent} | HasEntry: ${!!currentMediaEntry} | IsUrl: ${isUrl}`);
                            }

                            // NESTED MEDIA LOGIC (Youtube -> Local Video)
                            const isYoutubeParent = currentMediaEntry && (currentMediaEntry.url.includes('youtube.com') || currentMediaEntry.url.includes('youtu.be'));
                            // Remove '$' anchor to handle query params (e.g. video.webm?123) and support wiki-links
                            const isLocalChild = finalUrl.match(/\.(webm|mp4|mov|mkv|avi|m4v)/i) || (content.startsWith('[[') && content.match(/\.(webm|mp4|mov|mkv|avi|m4v)/i));

                            // SMART MERGE: 
                            // 1. Stricter Indent: Standard nested items
                            // 2. Sibling/Loose Indent: If we have a pending YouTube link and this is a local video, 
                            //    it almost certainly belongs to it. Ignore strict indent to fix user formatting issues.
                            const shouldMerge = currentMediaEntry && (
                                indentLevel > lastMediaIndent ||
                                ((isYoutubeParent && isLocalChild))
                            );

                            if (shouldMerge) {
                                // This is a child media (e.g. Local Video inside Youtube Link bullet)
                                // We attach it to the parent media entry
                                console.log(`[ParserDebug] MERGING: Video ${finalUrl} into Parent ${currentMediaEntry.url}`);
                                currentMediaEntry.videoSrc = finalUrl;
                                // CRITICAL FIX: Also capture the file path so Direct Read works!
                                if (resolvedFile) {
                                    currentMediaEntry.filePath = resolvedFile.path;
                                } else if (finalUrl.startsWith('app://') || !finalUrl.startsWith('http')) {
                                    // Fallback: If findVaultFile failed but it's a local path, try to use it as filePath
                                    // This helps with direct app:// links
                                    currentMediaEntry.filePath = finalUrl;
                                }
                                // We do NOT update currentMediaEntry to this child, so subsequent labels apply to the parent bundle
                                // We do NOT push a new entry
                            } else {
                                // New Sibling Media

                                // AUTO-SPLIT LOGIC:
                                // If we are at Indent 0, and the previous item is "populated" (media, desc, or BETO),
                                // we treat this new URL as a separate sibling Node.
                                // We only attach if the previous item is a "fresh header" (Title only).
                                const isPopulated = currentItem && (
                                    currentItem.media.length > 0 ||
                                    (currentItem.desc && currentItem.desc.length > 0) ||
                                    (currentItem.title || '').toUpperCase() === 'BETO.888'
                                );

                                if (indentLevel === 0 && isPopulated) {
                                    currentItem = null; // Force creation of new item below
                                }

                                currentMediaEntry = {
                                    url: finalUrl,
                                    label: "",
                                    emojis: [],
                                    videoSrc: null,
                                    filePath: resolvedFile ? resolvedFile.path : null
                                };
                                console.log(`[ParserDebug] NEW ENTRY: ${finalUrl}`);
                                lastMediaIndent = indentLevel;

                                if (currentItem) {
                                    currentItem.media.push({ ...currentMediaEntry });
                                    // RE-LINK: Since we cloned, we need currentMediaEntry to point to the live one in the array
                                    // so subsequent labels/videosSrc apply to the same object.
                                    currentMediaEntry = currentItem.media[currentItem.media.length - 1];
                                } else {
                                    // Orphaned media
                                    let smartTitle = "TACTICAL_VISUAL";
                                    try {
                                        if (finalUrl.startsWith('http')) {
                                            smartTitle = new URL(finalUrl).hostname.replace('www.', '').toUpperCase();
                                        } else {
                                            const match = finalUrl.match(/\/([^\/]+)\.\w+$/);
                                            if (match) smartTitle = match[1].replace(/[_-]/g, ' ').toUpperCase();
                                        }
                                    } catch (e) { }

                                    currentItem = {
                                        id: `item-${idCounter++}`,
                                        title: smartTitle,
                                        desc: "",
                                        media: [{ ...currentMediaEntry }],
                                        emojis: []
                                    };
                                    currentMediaEntry = currentItem.media[0];
                                    yearsMap[currentYear][currentMonth].push(currentItem);
                                }
                            }
                            inEmojiMode = false; // Reset for new entry
                        } else {
                            // 1. Check for timestamp (e.g. 0:33, 1:45)
                            const timeMatch = content.match(/^(\d+):(\d{2})$/);
                            if (timeMatch && currentMediaEntry && indentLevel > 0) {
                                const mins = parseInt(timeMatch[1], 10);
                                const secs = parseInt(timeMatch[2], 10);
                                currentMediaEntry.startTime = mins * 60 + secs;
                                console.log(`AnimationTool: Found startTime ${currentMediaEntry.startTime}s for ${currentMediaEntry.url}`);
                                continue;
                            }

                            // 2. Check for Flight Path (e.g. Canada -> Japan)
                            const flightMatch = content.match(/^(.+?)\s*->\s*(.+?)$/);
                            if (flightMatch && currentItem && indentLevel > 0) {
                                currentItem.media.push({
                                    type: 'flight',
                                    from: flightMatch[1].trim(),
                                    to: flightMatch[2].trim(),
                                    label: content.toUpperCase(),
                                    emojis: []
                                });
                                continue;
                            }

                            // Label or New Item
                            if (currentMediaEntry && indentLevel > 0) {
                                if (!currentMediaEntry.label) currentMediaEntry.label = content;
                            } else if (currentItem && indentLevel > 0) {
                                // AGGREGATION: Append non-media indented bullets to the item's description
                                // This makes "Goals" into one slide with a list.
                                if (currentItem.desc) currentItem.desc += "\n";
                                currentItem.desc += `• ${content}`;
                            } else {
                                // New Item Validation
                                if (!currentMonth) continue;

                                // Ensure Array Exists (Double Check)
                                if (!yearsMap[currentYear][currentMonth]) {
                                    yearsMap[currentYear][currentMonth] = [];
                                    yearsMap[currentYear][currentMonth].comments = [];
                                }

                                // AGGREGATION: Append bullets to description in 2026
                                if (currentYear === "2026" && currentItem) {
                                    if (currentItem.desc) currentItem.desc += "\n";
                                    currentItem.desc += `• ${content}`;
                                    continue;
                                }

                                currentItem = {
                                    id: `item-${idCounter++}`,
                                    title: content,
                                    desc: ``,
                                    media: [],
                                    emojis: []
                                };
                                currentMediaEntry = null;
                                lastMediaIndent = -1; // FORCE RESET to prevent ghost merges
                                yearsMap[currentYear][currentMonth].push(currentItem);
                            }
                        }
                    } else if (line.match(/^\s*##\s+(.+)/) && currentYear === "2026") {
                        // Support custom "## Heading" as distinct slide titles in 2026
                        const title = line.replace(/^\s*##\s+/, '').trim();
                        currentMonth = title; // Use title as dynamic group key
                        if (!yearsMap[currentYear][currentMonth]) {
                            const mArr = []; mArr.comments = [];
                            yearsMap[currentYear][currentMonth] = mArr;
                            if (groupOrders[currentYear] && !groupOrders[currentYear].includes(currentMonth)) {
                                groupOrders[currentYear].push(currentMonth);
                            }
                        }
                        currentItem = { id: `item-finale-${idCounter++}`, title, desc: "", media: [], emojis: [] };
                        yearsMap[currentYear][currentMonth].push(currentItem);
                    } else if (line.match(/^[-*+]\s+/) && currentMonth) {
                        // Special 2026 Aggregation for non-indented bullets
                        if (currentYear === "2026" && currentItem) {
                            const content = line.trim().replace(/^[-*+]\s+/, '');
                            if (currentItem.desc) currentItem.desc += "\n";
                            currentItem.desc += `• ${content}`;
                            continue;
                        }

                        const content = line.trim().replace(/^[-*+]\s+/, '');
                        currentItem = {
                            id: `item-${idCounter++}`,
                            title: content,
                            desc: ``,
                            media: [],
                            emojis: []
                        };
                        currentMediaEntry = null;
                        yearsMap[currentYear][currentMonth].push(currentItem);
                    }
                }

                // Final Assembly
                const targetYears = ["2025", "2026"];
                const finalYears = targetYears.map(y => {
                    const sortedGroups = (y === "2026" && groupOrders[y]?.length) ? groupOrders[y] : monthNames.filter(m => yearsMap[y] && yearsMap[y][m] && yearsMap[y][m].length > 0);

                    const groups = sortedGroups.map(m => {
                        const monthData = (yearsMap[y] && yearsMap[y][m]) ? yearsMap[y][m] : [];
                        const items = Array.from(monthData);
                        const comments = monthData.comments || [];
                        return { name: m.toUpperCase(), items, comments };
                    });
                    return { year: y, groups };
                });

                setGraphData({ years: finalYears });
            } catch (e) {
                console.warn("AnimationTool: Data load failure, using mock fallback", e);
                // Resilient Mock Fallback
                const mockRecap = {
                    years: [
                        {
                            year: "2025",
                            groups: monthNames.map(m => {
                                if (m === "January") return {
                                    name: "JANUARY 2025",
                                    items: [{
                                        title: "TRAVEL SETUP",
                                        desc: "Initial deployment synchronized.",
                                        media: [{ type: 'flight', from: 'Canada', to: 'Japan' }]
                                    }]
                                };
                                if (m === "February") return {
                                    name: "FEBRUARY 2025",
                                    items: [{
                                        title: "REMASTER DATACORE",
                                        desc: "Flexilis enhancement module active.",
                                        media: []
                                    }]
                                };
                                return { name: `${m.toUpperCase()} 2025`, items: [] };
                            })
                        }
                    ]
                };
                setGraphData(mockRecap);
            }
        }
        loadData();
    }, []);

    // Full Tab Logic
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;
    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
    const uniqueWrapperClass = `animationtool-fulltab-${instanceId}`;

    const autoPlayStateRef = useRef(false);
    useEffect(() => {
        autoPlayStateRef.current = isAutoPlayActive;
    }, [isAutoPlayActive]);

    // CINEMATIC FULLSCREEN INTEGRATION (from ScreenModeHelper)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (isAutoPlayActive) {
            if (!document.fullscreenElement) {
                applyBrowserMode(container);
            }
        } else {
            if (document.fullscreenElement === container) {
                document.exitFullscreen?.();
            }
        }

        const handleFsChange = () => {
            // Only deactivate if we are NOT in fullscreen anymore 
            // AND we actually wanted to be in fullscreen.
            if (!document.fullscreenElement) {
                setIsAutoPlayActive(false);
                setIsCinematicReady(false); // Reset animation state on exit
            } else {
                // ENTERING FULLSCREEN:
                // Wait for browser transition to finish, then trigger "Scene Build"
                setTimeout(() => {
                    if (isAutoPlayActive) setIsCinematicReady(true);
                }, 400); // 400ms delay for smoothness
            }
        };

        const eventName = document.webkitFullscreenElement !== undefined ? 'webkitfullscreenchange' : 'fullscreenchange';
        document.addEventListener(eventName, handleFsChange);
        return () => document.removeEventListener(eventName, handleFsChange);
    }, [isAutoPlayActive]);

    // Auto-Hide Header on Cinematic Mode
    useEffect(() => {
        if (isAutoPlayActive) {
            setShowHeader(false);
        } else {
            setShowHeader(true);
        }
    }, [isAutoPlayActive]);

    useEffect(() => {
        const hk = e => {
            if (e.code === 'Space') {
                e.preventDefault();
                console.log("AnimationTool: Space toggle from App");
                setIsAutoPlayActive(prev => !prev);
            } else if (autoPlayStateRef.current) {
                // Ignore Arrow Keys (let NodeGraph handle them)
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') return;

                console.log("AnimationTool: Key interrupt from App");
                setIsAutoPlayActive(false);
            }
        };
        window.addEventListener('keydown', hk);
        return () => window.removeEventListener('keydown', hk);
    }, []); // Run once

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (isFullTab) {
            if (!container.parentNode) {
                setTimeout(() => setIsFullTab(true), 50);
                return;
            }

            const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
            if (!targetPaneContent) {
                // Fallback or retry if DOM isn't ready
                setIsFullTab(false);
                return;
            }

            const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;
            stateRefs.originalParent = container.parentNode;
            stateRefs.placeholder = document.createElement('div');
            stateRefs.placeholder.style.display = 'none';
            container.parentNode.insertBefore(stateRefs.placeholder, container);

            const computedParentPosition = window.getComputedStyle(contentWrapper).position;
            stateRefs.parentPositionInfo = {
                element: contentWrapper,
                originalInlinePosition: contentWrapper.style.position
            };

            if (computedParentPosition === 'static') {
                contentWrapper.style.position = "relative";
            }

            contentWrapper.appendChild(container);
            Object.assign(container.style, {
                position: "absolute",
                top: "0px",
                left: "0px",
                width: "100%",
                height: "100%",
                zIndex: "9998",
                overflow: "hidden" // Animation tool usually needs hidden overflow
            });
        }

        // Cleanup
        return () => {
            if (!stateRefs.originalParent) return;
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
            } else {
                stateRefs.originalParent.appendChild(container);
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || '';
            }
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach(key => stateRefs[key] = null);
        };
    }, [isFullTab]);

    // Styles
    const compactWrapperStyle = {
        padding: '16px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        border: '1px dashed #2d2d2d',
        borderRadius: '8px',
        backgroundColor: '#0a0a0a',
        color: '#888'
    };

    if (!isFullTab) {
        return (
            <div ref={containerRef} style={compactWrapperStyle}>
                <p>Animation Tool in compact mode.</p>
                <button onClick={() => setIsFullTab(true)}>Enter Full Tab</button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={uniqueWrapperClass} style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000000',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Header / Navigation - Hidden in Cinematic Mode for immersion */}
            {/* Hover Trigger Zone (Top Left) */}
            <div
                style={{
                    position: 'absolute', top: 0, left: 0, width: '200px', height: '60px',
                    zIndex: 9999, // Above header (conceptually) but header needs higher zIndex to key events when visible
                    pointerEvents: showHeader ? 'none' : 'auto', // Only active when header is hidden
                }}
                onMouseEnter={() => setShowHeader(true)}
            />

            {/* Retractable Header */}
            <div style={{
                height: '50px',
                padding: '0 20px',
                borderBottom: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 10000,
                backgroundColor: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(10px)',
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%', justifyContent: 'flex-end' }}>
                    <h2 style={{ margin: 0, fontWeight: 600, letterSpacing: '-0.5px', fontSize: '18px' }}>Animation Tool Showcase</h2>

                    <button
                        onClick={() => setShowHeader(false)}
                        title="Hide Header"
                        style={{
                            background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: '4px', display: 'flex'
                        }}
                    >
                        {/* Chevron Up Icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                    </button>

                    <button
                        onClick={() => setIsFullTab(false)}
                        style={{
                            background: 'transparent',
                            border: '1px solid #333',
                            color: '#666',
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            marginLeft: '10px'
                        }}
                    >
                        Exit Full Tab
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {/* Main Content Area */}
            <div className={`${isAutoPlayActive ? "cinematic-mode-active" : ""} ${isCinematicReady ? "cinematic-ready" : ""}`} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <style>{`
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes pulse { 0% { opacity: 1; box-shadow: 0 0 10px #a855f7; } 50% { opacity: 0.5; box-shadow: 0 0 4px #a855f7; } 100% { opacity: 1; box-shadow: 0 0 10px #a855f7; } }
                    
                    /* --- Cinematic Mode Transitions --- */
                    .cinematic-wrapper {
                        width: 100%; height: 100%;
                        transition: transform 1.5s cubic-bezier(0.1, 0.6, 0.2, 1), opacity 0.5s ease;
                        transform: scale(1);
                        transform-origin: center center;
                    }
                    /* Trigger only when READY (in fullscreen) */
                    .cinematic-mode-active.cinematic-ready .cinematic-wrapper {
                        transform: scale(0.95); /* Zoom OUT slightly to frame content within bars */
                    }

                    /* Letterbox Bars */
                    .letterbox-bar {
                        position: absolute; left: 0; width: 100%; height: 0;
                        background: #000;
                        z-index: 9000;
                        transition: height 1.2s cubic-bezier(0.65, 0, 0.35, 1);
                        pointer-events: none;
                    }
                    .letterbox-top { top: 0; }
                    .letterbox-bottom { bottom: 0; }
                    
                    /* Triggers on READY */
                    .cinematic-mode-active.cinematic-ready .letterbox-bar {
                        height: 8vh; /* Reduced height to minimize obstruction */
                    }

                    /* Vignette Overlay */
                    .vignette-overlay {
                        position: absolute; inset: 0;
                        background: radial-gradient(circle, transparent 50%, rgba(0,0,0,0.8) 120%);
                        opacity: 0;
                        transition: opacity 1.5s ease-in-out;
                        pointer-events: none;
                        z-index: 500;
                    }
                    .cinematic-mode-active.cinematic-ready .vignette-overlay {
                        opacity: 1;
                    }

                    /* Tech Grid Background (Scene Build) */
                    .tech-grid {
                        position: absolute; inset: 0;
                        background-image:
                            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                        background-size: 80px 80px;
                        opacity: 0;
                        transform: scale(1.2);
                        transition: opacity 2s ease, transform 2s cubic-bezier(0.1, 0.6, 0.2, 1);
                        pointer-events: none;
                        z-index: 1;
                        mix-blend-mode: overlay;
                    }
                    .cinematic-mode-active.cinematic-ready .tech-grid {
                        opacity: 1;
                        transform: scale(1.0);
                    }
                `}</style>

                {/* Overlays */}
                <div className="letterbox-bar letterbox-top" />
                <div className="letterbox-bar letterbox-bottom" />
                <div className="vignette-overlay" />
                <div className="tech-grid" />

                {/* Content */}
                <div className="cinematic-wrapper">
                    <NodeGraph
                        data={graphData}
                        isAutoPlayActive={isAutoPlayActive}
                        setIsAutoPlayActive={setIsAutoPlayActive}
                        folderPath={folderPath}
                    />
                </div>
            </div>
        </div>
    );
}

return { AnimationTool };

```

# ViewComponent

```jsx
// [PATH:src/index.jsx]

async function View({ folderPath }) {
    // Simple Pattern: Use the passed folderPath to locate App.jsx
    // This assumes standard folder structure: [Root]/src/App.jsx

    // Safety check just in case
    if (!folderPath) throw new Error("View requires folderPath prop");

    const appPath = folderPath + '/src/App.jsx';
    const { AnimationTool } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animationtool.component"), "App"));

    // We pass folderPath down to allow robust local resource resolution
    return <AnimationTool folderPath={folderPath} />;
}

return { View: View };
```
