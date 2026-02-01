
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
