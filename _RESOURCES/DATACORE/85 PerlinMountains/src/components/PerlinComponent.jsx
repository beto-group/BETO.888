function PerlinComponent(props) {
    const { dc, loadScript, isFullTab, isInception, onToggleFullTab, styles, onCodeReloadRequest } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasContainerRef = useRef(null);
    const guiContainerRef = useRef(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // --- Singleton Persistence ---
    const refs = useRef({
        p5Instance: null,
        gui: null,
        p5Lib: null,
        GUI: null,

        // --- Perlin Config ---
        CONFIG: {
            noiseScale: 0.004,
            charSize: 10,
            edgeDistance: 100,
            brightnessThreshold: 0.05,
            octaveNum: 4,
            freqMultiplier: 2.2,
            ampMultiplier: 0.45,
            frameRateVal: 30,
            asciiChars: [" ", ".", ":", "-", "~", "+", "=", "^", "*", "#", "@", "█"],
            speed: 0.001
        },
        noiseOffsetX: 0,
        noiseOffsetY: 0,

        // --- Caches ---
        prevCols: 0,
        prevRows: 0,
        noiseCache: [],
        fadeCache: [],

        // We calculate frequencies/amplitudes up front
        frequencies: [],
        amplitudes: [],
        maxNoiseVal: 0
    }).current;

    // Helper to calc noise parameters
    const recalcNoiseVars = () => {
        refs.frequencies = Array(refs.CONFIG.octaveNum).fill(0).map((_, i) => Math.pow(refs.CONFIG.freqMultiplier, i));
        refs.amplitudes = Array(refs.CONFIG.octaveNum).fill(0).map((_, i) => Math.pow(refs.CONFIG.ampMultiplier, i));
        refs.maxNoiseVal = refs.amplitudes.reduce((sum, amp) => sum + amp, 0);
    };

    useEffect(() => {
        let active = true;

        async function init() {
            try {
                // 1. Loading Dependencies
                const p5Load = await loadScript(dc, 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js');
                const GUI = await loadScript(dc, 'https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js', { type: 'module' });

                if (!active) return;
                setIsLoaded(true);

                // p5 binds mapped to window, GUI is from module
                refs.p5Lib = window.p5;
                refs.GUI = GUI.default || GUI;

                const container = canvasContainerRef.current;
                if (!container) return;
                container.innerHTML = '';

                recalcNoiseVars();

                // --- 2. p5.js Instance Mode ---
                const sketch = (p) => {

                    function getRidgedNoise(x, y) {
                        let noiseVal = 0;
                        for (let i = 0; i < refs.CONFIG.octaveNum; i++) {
                            const frequency = refs.frequencies[i];
                            const amplitude = refs.amplitudes[i];
                            let n = 1 - Math.abs(p.noise(
                                x * frequency * refs.CONFIG.noiseScale + refs.noiseOffsetX,
                                y * frequency * refs.CONFIG.noiseScale + refs.noiseOffsetY
                            ));
                            n = 1 - Math.abs(n * 2 - 1);
                            n = n * n * n;
                            noiseVal += n * amplitude;
                        }
                        return noiseVal / refs.maxNoiseVal;
                    }

                    function updateCaches(cols, rows) {
                        if (cols !== refs.prevCols || rows !== refs.prevRows || refs.noiseCache.length === 0) {
                            refs.noiseCache = new Array(cols * rows);
                            refs.fadeCache = new Array(cols * rows);
                            refs.prevCols = cols;
                            refs.prevRows = rows;

                            const halfCharSize = refs.CONFIG.charSize / 2;
                            for (let col = 0; col < cols; col++) {
                                const x = col * refs.CONFIG.charSize + halfCharSize;
                                const fadeX = Math.min(x, p.width - x) / refs.CONFIG.edgeDistance;
                                for (let row = 0; row < rows; row++) {
                                    const y = row * refs.CONFIG.charSize + halfCharSize;
                                    const fadeY = Math.min(y, p.height - y) / refs.CONFIG.edgeDistance;
                                    refs.fadeCache[col * rows + row] = p.constrain(fadeX, 0, 1) * p.constrain(fadeY, 0, 1);
                                }
                            }
                        }

                        // Update noise values for each cell (flat index)
                        for (let col = 0; col < cols; col++) {
                            for (let row = 0; row < rows; row++) {
                                refs.noiseCache[col * rows + row] = getRidgedNoise(col, row);
                            }
                        }
                    }

                    p.setup = () => {
                        const bounds = container.getBoundingClientRect();
                        p.createCanvas(bounds.width, bounds.height);
                        p.textFont("Courier New");
                        p.textSize(refs.CONFIG.charSize);
                        p.textAlign(p.CENTER, p.CENTER);
                        p.frameRate(refs.CONFIG.frameRateVal);
                    };

                    p.draw = () => {
                        p.background(0);

                        const cols = p.floor(p.width / refs.CONFIG.charSize);
                        const rows = p.floor(p.height / refs.CONFIG.charSize);
                        const halfCharSize = refs.CONFIG.charSize / 2;

                        updateCaches(cols, rows);

                        let currentBrightness = -1;

                        for (let col = 0; col < cols; col++) {
                            const x = col * refs.CONFIG.charSize + halfCharSize;
                            for (let row = 0; row < rows; row++) {
                                const y = row * refs.CONFIG.charSize + halfCharSize;
                                const index = col * rows + row;

                                let noiseVal = refs.noiseCache[index];
                                const fadeFactor = refs.fadeCache[index];

                                if (fadeFactor < refs.CONFIG.brightnessThreshold) continue;

                                noiseVal = p.constrain(p.map(noiseVal, 0, 1, -0.2, 1.2), 0, 1);
                                noiseVal = p.pow(noiseVal, 1.5);

                                const brightness = p.pow(noiseVal, 0.8) * 255 * fadeFactor;

                                if (Math.abs(brightness - currentBrightness) > 1) {
                                    p.fill(brightness);
                                    currentBrightness = brightness;
                                }

                                const charIndex = p.floor(p.map(noiseVal, 0, 1, 0, refs.CONFIG.asciiChars.length - 0.01));
                                p.text(refs.CONFIG.asciiChars[charIndex], x, y);
                            }
                        }

                        refs.noiseOffsetX += refs.CONFIG.speed;
                        refs.noiseOffsetY += refs.CONFIG.speed;
                    };

                    p.windowResized = () => {
                        if (!container) return;
                        const bounds = container.getBoundingClientRect();
                        p.resizeCanvas(bounds.width, bounds.height);
                        refs.prevCols = 0; // force cache rebuild
                    };
                };

                // Instantiate p5
                refs.p5Instance = new refs.p5Lib(sketch, container);

                // --- 3. GUI ---
                const gui = new refs.GUI({ title: 'Config', container: guiContainerRef.current });
                refs.gui = gui;
                gui.close();

                const rebuildAndResize = () => {
                    if (refs.p5Instance && container) {
                        refs.p5Instance.textSize(refs.CONFIG.charSize);
                        refs.prevCols = 0; // force cache rebuild
                    }
                };

                const updateMath = () => {
                    recalcNoiseVars();
                    refs.prevCols = 0; // rebuild
                };

                const fCore = gui.addFolder('Core Settings');
                fCore.add(refs.CONFIG, 'charSize', 5, 40, 1).name('Character Size').onChange(rebuildAndResize);
                fCore.add(refs.CONFIG, 'frameRateVal', 1, 60, 1).name('Framerate').onChange(v => {
                    if (refs.p5Instance) refs.p5Instance.frameRate(v);
                });
                fCore.add(refs.CONFIG, 'speed', 0.0001, 0.01).name('Anim Speed');

                const fNoise = gui.addFolder('Noise Generator');
                fNoise.add(refs.CONFIG, 'noiseScale', 0.001, 0.02).name('Scale').onChange(updateMath);
                fNoise.add(refs.CONFIG, 'octaveNum', 1, 8, 1).name('Octaves').onChange(updateMath);
                fNoise.add(refs.CONFIG, 'freqMultiplier', 1.0, 4.0).name('Frequency Mult').onChange(updateMath);
                fNoise.add(refs.CONFIG, 'ampMultiplier', 0.1, 1.0).name('Amplitude Mult').onChange(updateMath);

                const fVisuals = gui.addFolder('Visuals');
                fVisuals.add(refs.CONFIG, 'edgeDistance', 10, 300).name('Vignette Fade').onChange(() => refs.prevCols = 0);
                fVisuals.add(refs.CONFIG, 'brightnessThreshold', 0.0, 0.5).name('Visibility Threshold');

                // We want to observe resizing on the div, as p.windowResized only triggers on window
                const resizeObserver = new ResizeObserver(() => {
                    if (refs.p5Instance && container) {
                        refs.p5Instance.windowResized();
                    }
                });
                resizeObserver.observe(container);
                refs.cleanupListeners = () => resizeObserver.disconnect();

            } catch (e) {
                console.error("PerlinComponent Init Error:", e);
                if (active) setError(e.message);
            }
        }

        init();

        return () => {
            active = false;
            if (refs.gui) refs.gui.destroy();

            // Safely remove p5 instance and its canvases
            if (refs.p5Instance) {
                refs.p5Instance.remove();
            }
            if (refs.cleanupListeners) refs.cleanupListeners();
        };
    }, []);

    return (
        <div style={styles.fullTabWrapper}>
            {!isLoaded && !error && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'monospace' }}>
                    Loading p5.js and Addons...
                </div>
            )}

            {error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', zIndex: 10, padding: '20px', textAlign: 'center' }}>
                    Error loading Component: {error}
                </div>
            )}

            <div ref={canvasContainerRef} style={styles.canvasContainer} />

            <div ref={guiContainerRef} style={{ ...styles.guiContainer, '--background-color': '#0d0d0d', '--text-color': '#eee' }} />

            {!isInception && (
                <button
                    onClick={onToggleFullTab}
                    style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, padding: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
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

return { PerlinComponent };
