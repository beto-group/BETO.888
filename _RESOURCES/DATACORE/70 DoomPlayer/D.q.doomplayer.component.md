


# src__styles__styles

```jsx
/**
 * Styles for the Doom Player component
 */
const STYLES = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#000',
        color: '#fff',
        fontFamily: '"Inter", sans-serif',
        overflow: 'hidden',
        position: 'relative'
    },

    centeredContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '40px',
        textAlign: 'center'
    },

    card: {
        background: '#18181b', // zinc-900
        border: '1px solid #27272a', // zinc-800
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },

    title: {
        fontSize: '24px',
        fontWeight: '700',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },

    text: {
        color: '#a1a1aa', // zinc-400
        fontSize: '14px',
        lineHeight: '1.6',
        marginBottom: '24px'
    },

    button: {
        padding: '12px 24px',
        background: '#fff',
        color: '#000',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    },

    progressContainer: {
        width: '100%',
        height: '6px',
        background: '#27272a',
        borderRadius: '3px',
        overflow: 'hidden',
        marginTop: '16px'
    },

    progressBar: {
        height: '100%',
        background: '#fff',
        transition: 'width 0.3s ease'
    },

    canvas: {
        imageRendering: 'pixelated',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
        margin: '0 auto',
        boxShadow: '0 0 100px rgba(160, 118, 249, 0.1)',
        cursor: 'crosshair',
        outline: 'none'
    },

    errorText: {
        color: '#ef4444',
        fontSize: '12px',
        marginTop: '12px'
    },

    loadingSpinner: {
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },

    // Screen Mode Controls
    controlsContainer: {
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        gap: '8px',
        padding: '6px',
        borderRadius: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        transition: 'all 0.3s ease'
    },
    modeButton: {
        width: '40px',
        height: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'rgba(255, 255, 255, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
    },
    modeButtonActive: {
        backgroundColor: 'rgba(160, 118, 249, 0.15)',
        color: '#a076f9',
        border: '1px solid rgba(160, 118, 249, 0.4)',
        boxShadow: '0 0 12px rgba(160, 118, 249, 0.2)',
    },
    modeIcon: {
        fontSize: '16px',
        lineHeight: '1'
    },
    modeLabel: {
        fontSize: '8px',
        marginTop: '2px',
        fontWeight: '700',
        letterSpacing: '0.5px'
    }
};

// Add keyframes for spinner
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .mode-button:hover {
        background-color: rgba(255, 255, 255, 0.15) !important;
        color: #fff !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
        transform: translateY(-1px);
    }
    .mode-button:active {
        transform: translateY(0px) scale(0.95);
    }
  `;
    document.head.appendChild(styleSheet);
}

return { STYLES };

```

# src__utils__assetManager

```jsx
const path = require('path');
const fs = require('fs');

/**
 * Manages Doom WASM assets and WAD files
 */
class AssetManager {
    constructor(folderPath) {
        this.folderPath = folderPath;
        this.vaultPath = dc.app.vault.adapter.basePath;
        this.assetsDir = path.join(this.vaultPath, folderPath, '.doom-assets');

        // Assets to download (Updated to reliable source with embedded WAD)
        this.assets = [
            {
                name: 'doom.wasm',
                url: 'https://raw.githubusercontent.com/diekmann/wasm-fizzbuzz/gh-pages/doom/doom.wasm',
                description: 'Doom WebAssembly binary (Shareware WAD embedded)'
            }
        ];
    }

    async checkAssets() {
        try {
            if (!fs.existsSync(this.assetsDir)) return false;

            for (const asset of this.assets) {
                const assetPath = path.join(this.assetsDir, asset.name);
                if (!fs.existsSync(assetPath)) return false;
            }

            return true;
        } catch (e) {
            console.error('[Doom AssetManager] Error checking assets:', e);
            return false;
        }
    }

    async downloadAssets(onProgress) {
        if (!fs.existsSync(this.assetsDir)) {
            fs.mkdirSync(this.assetsDir, { recursive: true });
        }

        let completed = 0;
        for (const asset of this.assets) {
            const assetPath = path.join(this.assetsDir, asset.name);

            onProgress({
                message: `Downloading ${asset.name}...`,
                progress: (completed / this.assets.length) * 100
            });

            try {
                const response = await fetch(asset.url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const buffer = await response.arrayBuffer();
                fs.writeFileSync(assetPath, Buffer.from(buffer));

                completed++;
            } catch (e) {
                console.error(`[Doom AssetManager] Failed to download ${asset.name}:`, e);
                throw e;
            }
        }

        onProgress({ message: 'Installation complete!', progress: 100 });
    }

    getAssetUrl(name) {
        // Return a local URL that the browser can load
        // Datacore/Obsidian usually handles this via dc.app.vault.adapter.getResourcePath
        const assetPath = path.join(this.folderPath, '.doom-assets', name);
        return dc.app.vault.adapter.getResourcePath(assetPath);
    }

    getAssetsDir() {
        return this.assetsDir;
    }
}

return { AssetManager };

```

# src__components__Installer

```jsx
/**
 * Installer component for downloading Doom assets
 */
function Installer({ assetManager, onComplete, styles }) {
    const { useState } = dc;
    const [installing, setInstalling] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);

    const startInstall = async () => {
        setInstalling(true);
        setError(null);
        try {
            await assetManager.downloadAssets((update) => {
                setMessage(update.message);
                setProgress(update.progress);
            });
            // Small delay for UX
            setTimeout(onComplete, 1000);
        } catch (e) {
            setError(e.message);
            setInstalling(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Doom Installation</h2>
                <p style={styles.text}>
                    To play Doom, we need to download the official shareware assets and the WebAssembly engine (~3MB).
                    These will be stored locally in your vault.
                </p>

                {!installing ? (
                    <button style={styles.button} onClick={startInstall}>
                        Install Doom Assets
                    </button>
                ) : (
                    <div>
                        <div style={{ ...styles.text, textAlign: 'left', marginBottom: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
                            {message}
                        </div>
                        <div style={styles.progressContainer}>
                            <div style={{ ...styles.progressBar, width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {error && <div style={styles.errorText}>Error: {error}</div>}
            </div>
        </div>
    );
}

return { Installer };

```

# src__components__DoomPlayer

```jsx

/**
 * DoomPlayer component that initializes and runs the custom WASM engine
 */
function DoomPlayer({ assetManager, styles, ScreenModeHelper, folderPath, openDebugWindow, useDoomScanner }) {
    const { useEffect, useRef, useState, useCallback } = dc;
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [screenMode, setScreenMode] = useState('fullTab');

    // Extracted Hook (manages scanner, scores, stats)
    const engineRef = useRef({
        memory: null,
        instance: null,
        loopId: null
    });

    const {
        scannerStatus,
        scores,
        captureNotice,
        showCaptureNotice,
        triggerStatCapture,
        handleHunt,
        handleTakeBaseline,
        handleCompareBaseline,
        handleFilter,
        handleFreeze,
        handleCalibrate,
        memoryScannerRef,
        debugData
    } = useDoomScanner(engineRef, folderPath, !loading);

    // Initial hunter state for sync/diagnostics
    if (!window.doomHunter) {
        window.doomHunter = {
            baseline: null,
            matches: [],
            lastTarget: null
        };
    }

    const [externalWindowId, setExternalWindowId] = useState(null);
    const [hunterValue, setHunterValue] = useState('');
    const [, forceUpdate] = useState({});
    const [inspectOffset, setInspectOffset] = useState(null);

    // Refs
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isFocused, setIsFocused] = useState(true);
    const [isDebugging, setIsDebugging] = useState(false);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const activeKeysRef = useRef(new Set());
    const shufflingFocusRef = useRef(false);
    const isFocusedRef = useRef(true);
    const isDebuggingRef = useRef(false);
    const isLeaderboardOpenRef = useRef(false);

    useEffect(() => {
        isFocusedRef.current = isFocused && !isLeaderboardOpen;
        isDebuggingRef.current = isDebugging;
        isLeaderboardOpenRef.current = isLeaderboardOpen;
    }, [isFocused, isLeaderboardOpen, isDebugging]);

    // Sync isDebugging with externalWindowId (keep it true while window exists)
    useEffect(() => {
        if (externalWindowId) {
            setIsDebugging(true);
        }
    }, [externalWindowId]);

    // Unified focus strategy (managed via effects)

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const doom_screen_width = 320 * 2;
        const doom_screen_height = 200 * 2;

        // Set canvas dimensions
        canvas.width = doom_screen_width;
        canvas.height = doom_screen_height;

        // Music setup
        const audio = new Audio('https://ia800501.us.archive.org/27/items/doom-ost/01.%20At%20Doom%27s%20Gate.mp3');
        audio.loop = true;
        audio.volume = 0.3;

        const startMusic = () => {
            audio.play().catch(e => console.warn('[Doom] Music autoplay blocked or failed:', e));
        };

        // Sound FX setup
        const sfxCache = {};
        const playSfx = (name) => {
            const soundName = name.toLowerCase().trim();
            if (!sfxCache[soundName]) {
                const url = `https://raw.githubusercontent.com/fabiensanglard/chocolate-doom/master/src/d_french.h/../../sounds/wav/${soundName}.wav`;
                // Note: Using a more direct GitHub raw source for common sounds if possible
                // For now, let's use a very reliable archive pattern
                sfxCache[soundName] = new Audio(`https://ia800501.us.archive.org/27/items/doom-sfx/${soundName}.mp3`);
            }
            const s = sfxCache[soundName].cloneNode();
            s.volume = 0.4;
            s.play().catch(() => { });
        };

        const initWasm = async () => {
            try {
                const memory = new WebAssembly.Memory({ initial: 108 });
                engineRef.current.memory = memory;

                const importObject = {
                    js: {
                        js_console_log: (offset, length) => {
                            // const str = readWasmString(memory, offset, length);
                            // console.log('[Doom]', str);
                        },
                        js_stdout: (offset, length) => {
                            // const str = readWasmString(memory, offset, length);
                            // console.log('[Doom Stdout]', str);
                        },
                        js_stderr: (offset, length) => {
                            const text = readWasmString(memory, offset, length);

                            // Trigger stat capture on intermission sound
                            if (text.includes('barexp')) {
                                console.log('[Doom] Intermission detected via sound!');
                                triggerStatCapture();
                            }

                            // INTERCEPT SOUND CALLS
                            if (text.includes('S_StartSoundAtVolume:')) {
                                const parts = text.split(':');
                                if (parts[1]) {
                                    const soundName = parts[1].split(' ')[1]; // Get 'dspistol' from ' dspistol at 127'
                                    if (soundName) playSfx(soundName);
                                }
                                return;
                            }

                            if (text.includes('S_StartSoundAtVolume') ||
                                text.includes('S_Init') ||
                                text.includes('S_StartMusic')) return; // Filter spam
                            console.error(`[Doom Engine]`, text);
                        },
                        js_milliseconds_since_start: () => performance.now(),
                        js_draw_screen: (ptr) => {
                            const doom_screen = new Uint8ClampedArray(memory.buffer, ptr, doom_screen_width * doom_screen_height * 4);
                            const render_screen = new ImageData(doom_screen, doom_screen_width, doom_screen_height);
                            const ctx = canvas.getContext('2d');
                            ctx.putImageData(render_screen, 0, 0);
                        },
                    },
                    env: {
                        memory: memory
                    }
                };

                const wasmUrl = assetManager.getAssetUrl('doom.wasm');
                const response = await fetch(wasmUrl);
                const buffer = await response.arrayBuffer();
                const obj = await WebAssembly.instantiate(buffer, importObject);

                engineRef.current.instance = obj.instance;
                setLoading(false);

                // Initialize Doom
                obj.instance.exports.main();
                startMusic();

                // Main game loop
                const step = () => {
                    if (!engineRef.current.instance) return;
                    obj.instance.exports.doom_loop_step();
                    engineRef.current.loopId = window.requestAnimationFrame(step);
                };
                engineRef.current.loopId = window.requestAnimationFrame(step);

            } catch (e) {
                console.error('[Doom Engine] Initialization failed:', e);
                setError(e.message);
                setLoading(false);
            }
        };

        initWasm();

        return () => {
            if (engineRef.current.loopId) window.cancelAnimationFrame(engineRef.current.loopId);
            engineRef.current.instance = null;
            audio.pause();
            audio.src = '';
        };
    }, [assetManager, triggerStatCapture]);

    useEffect(() => {
        // GLOBAL CAPTURE BLOCKER (Advanced isolation)
        const aggressiveBlocker = (e) => {
            if (!isFocusedRef.current) return;

            // Check if this is a game key
            const code = doomKeyCode(e.keyCode);
            const isGameKey = e.keyCode === 27 || // Escape
                e.keyCode === 9 || // Tab
                code !== e.keyCode || // Mapped keys (WASD, etc)
                [37, 38, 39, 40, 17, 32, 13, 90, 88, 16, 65, 68, 87, 83].includes(e.keyCode);

            if (isGameKey) {
                // TRIPLE KILL: perfectly isolate from Obsidian
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();

                if (engineRef.current.instance) {
                    const eventType = e.type === 'keydown' ? 0 : 1;

                    if (e.type === 'keydown') {
                        // Only send KeyDown if this action isn't already active from another key
                        const isAlreadyActive = Array.from(activeKeysRef.current).some(k => doomKeyCode(k) === code);
                        activeKeysRef.current.add(e.keyCode);
                        if (!isAlreadyActive) {
                            engineRef.current.instance.exports.add_browser_event(0, code);
                        }
                    } else {
                        activeKeysRef.current.delete(e.keyCode);
                        // Only send KeyUp if no other physical keys for this action are still held
                        const stillActive = Array.from(activeKeysRef.current).some(k => doomKeyCode(k) === code);
                        if (!stillActive) {
                            engineRef.current.instance.exports.add_browser_event(1, code);
                        }
                    }
                }
                return false;
            }
        };

        window.addEventListener('keydown', aggressiveBlocker, { capture: true });
        window.addEventListener('keyup', aggressiveBlocker, { capture: true });

        return () => {
            window.removeEventListener('keydown', aggressiveBlocker, { capture: true });
            window.removeEventListener('keyup', aggressiveBlocker, { capture: true });
        };
    }, []);

    const handleFocus = (e) => {
        setIsFocused(true);
        // Note: We no longer reset isDebugging(false) here, 
        // as the debug window might still be open and we want to keep that state.
    };

    const handleHardBlur = () => {
        console.log(`[Doom Focus] Hard Blur Triggered! Debugging: ${isDebuggingRef.current}, Leaderboard: ${isLeaderboardOpenRef.current}`);

        // Robust check for Electron environment
        let isFocusInDebugWindow = false;
        try {
            const remote = window.require ? window.require('@electron/remote') : require('@electron/remote');
            const focusedWin = remote.BrowserWindow.getFocusedWindow();
            if (focusedWin && externalWindowId && focusedWin.id === externalWindowId) {
                console.log('[Doom Focus] Focus shifted to Debug Window - suppressing pause.');
                isFocusInDebugWindow = true;
            }
        } catch (e) { }

        setIsFocused(false);
        if (!engineRef.current.instance) return;

        // Release all active keys to prevent "stuck" movement
        activeKeysRef.current.forEach(keyCode => {
            const code = doomKeyCode(keyCode);
            engineRef.current.instance.exports.add_browser_event(1 /*KeyUp*/, code);
        });
        activeKeysRef.current.clear();

        // Auto-pause ONLY if not debugging, checking leaderboard, or focus moved to debug window
        if (!isDebuggingRef.current && !isLeaderboardOpenRef.current && !isFocusInDebugWindow) {
            console.log('[Doom Focus] PAUSING GAME (Sending Escape)');
            const ESC_CODE = 27;
            engineRef.current.instance.exports.add_browser_event(0 /*KeyDown*/, ESC_CODE);
            engineRef.current.instance.exports.add_browser_event(1 /*KeyUp*/, ESC_CODE);
        } else {
            console.log('[Doom Focus] PAUSE SKIPPED (User is debugging/interacting/in debug window)');
        }
    };

    useEffect(() => {
        const handleWindowBlur = () => {
            handleHardBlur();
        };

        const handleDocumentClick = (e) => {
            // If shuffling DOM, don't trigger blur
            if (shufflingFocusRef.current) return;

            const isInside = containerRef.current && containerRef.current.contains(e.target);
            if (isInside) {
                // If clicking inside while blurred, refocus
                if (!isFocused) {
                    handleFocus();
                }
            } else {
                // Clicked outside!
                if (isFocused) {
                    handleHardBlur();
                }
            }
        };

        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('mousedown', handleDocumentClick, { capture: true });

        return () => {
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('mousedown', handleDocumentClick, { capture: true });
        };
    }, [isFocused]);

    // --- IPC & CROSS-WINDOW SYNC ---
    // Initial hunter state for sync/diagnostics
    if (!window.doomHunter) {
        window.doomHunter = {
            baseline: null,
            matches: [],
            lastTarget: null,
            watchlist: []
        };
    }

    const handleSendKeys = (keys) => {
        if (!engineRef.current.instance) return;
        // console.log(`[Doom Input] Injecting keys: ${keys}`);
        const chars = keys.split('');
        chars.forEach((char, i) => {
            const lower = char.toLowerCase();
            const code = lower.charCodeAt(0);
            setTimeout(() => {
                engineRef.current.instance.exports.add_browser_event(0 /*KeyDown*/, code);
                setTimeout(() => {
                    engineRef.current.instance.exports.add_browser_event(1 /*KeyUp*/, code);
                }, 50);
            }, i * 150);
        });
    };

    useEffect(() => {
        let ipcRenderer;
        let remote;
        try {
            const electron = window.require ? window.require('electron') : require('electron');
            ipcRenderer = electron.ipcRenderer;
            remote = window.require ? window.require('@electron/remote') : require('@electron/remote');
        } catch (e) { }

        const handleCommand = (data) => {
            // console.log(`[Doom IPC] Command: ${data.type}`, data);
            if (data.type === 'DOOM_HUNT') handleHunt(data.bitType, data.value);
            if (data.type === 'DOOM_HUNT_FILTER') handleFilter(data.value);
            if (data.type === 'DOOM_BASELINE') handleTakeBaseline();
            if (data.type === 'DOOM_COMPARE') handleCompareBaseline(hunterValue);
            if (data.type === 'DOOM_WATCH_ADD') handleWatchAdd(data.address, data.bitType, data.label);
            if (data.type === 'DOOM_WATCH_REMOVE') handleWatchRemove(data.address);
            if (data.type === 'DOOM_INSPECT_PAGE') setInspectOffset(data.offset);
            if (data.type === 'DOOM_MEMORY_WRITE') handleMemoryWrite(data.address, data.value, data.bitType);
            if (data.type === 'DOOM_FREEZE') handleFreeze(data.address, data.value, data.bitType, data.enabled);
            if (data.type === 'DOOM_SEND_KEYS') handleSendKeys(data.keys);
            if (data.type === 'DOOM_CALIBRATE_STATS') handleCalibrate(data.kills, data.time);
            if (data.type === 'DOOM_DUMP_REQUEST') handleSaveScore();
            if (data.type === 'DOOM_PING') {
                // console.log('[Doom] Terminal PING received');
            }
        };

        // --- UNIVERSAL IPC HANDLER (The ViewsControl Pattern) ---
        // Instead of peer-to-peer, we hijack the Main Process to route messages.
        let cleanupIpc = () => { };

        try {
            const electron = window.require ? window.require('electron') : require('electron');
            const remote = window.require ? window.require('@electron/remote') : require('@electron/remote');

            // Standard renderer-to-renderer listener
            if (electron.ipcRenderer) {
                const onIpcMsg = (event, data) => {
                    if (data && (data.protocol === 'DOOM_IPC' || data.type?.startsWith('DOOM_'))) {
                        handleCommand(data);
                    }
                };
                electron.ipcRenderer.on('DOOM_COMMAND', onIpcMsg);
                cleanupIpc = () => {
                    try { electron.ipcRenderer.removeListener('DOOM_COMMAND', onIpcMsg); } catch (e) { }
                };
            }

            // Also listen to Main process routing if needed
            const ipcMain = remote.ipcMain || (remote.require ? remote.require('electron').ipcMain : null);
            if (ipcMain) {
                const onDoomCmd = (event, data) => handleCommand(data);
                ipcMain.on('DOOM_COMMAND', onDoomCmd);
                const prevCleanup = cleanupIpc;
                cleanupIpc = () => {
                    prevCleanup();
                    try { ipcMain.removeListener('DOOM_COMMAND', onDoomCmd); } catch (e) { }
                };
            }
        } catch (e) {
            console.warn('[Doom] Failed to hook ipcMain:', e);
        }

        // Fallback for same-window testing
        const browserHandler = (e) => {
            if (e.data && e.data.protocol === 'DOOM_IPC') handleCommand(e.data);
        };
        window.addEventListener('message', browserHandler);

        const syncInterval = setInterval(() => {
            if (!externalWindowId) return;

            try {
                let win = null;
                if (remote) {
                    win = remote.BrowserWindow.fromId(externalWindowId);
                    if (!win || win.isDestroyed()) {
                        setExternalWindowId(null);
                        return;
                    }
                }
                if (!win) return;

                if (engineRef.current.memory) {
                    const view = new Int32Array(engineRef.current.memory.buffer);
                    const mem8 = new Uint8Array(engineRef.current.memory.buffer);
                    const hbBase = memoryScannerRef.current.gameticAddr || 0;

                    const inspectBase = inspectOffset !== null ? inspectOffset : hbBase;
                    const inspectSlice = Array.from(mem8.slice(inspectBase, inspectBase + 256));

                    const watches = window.doomHunter?.watchlist || [];
                    const watchValues = watches.map(w => {
                        let val = 0;
                        try {
                            if (w.type === 'Int32') val = view[w.addr / 4];
                            else if (w.type === 'Int16') val = new Int16Array(engineRef.current.memory.buffer)[w.addr / 2];
                            else val = mem8[w.addr];
                        } catch (e) { }
                        return { ...w, val };
                    });

                    const payload = JSON.parse(JSON.stringify({
                        type: 'DOOM_MEMORY_SYNC',
                        hbBase: hbBase,
                        scannerStatus: String(scannerStatus),
                        scores: scores,
                        hunter: {
                            baselineActive: !!window.doomHunter?.baseline,
                            matches: (window.doomHunter?.matches || []).map(m => {
                                const type = window.doomHunter?.lastType || 'Int32';
                                let val = 0;
                                try {
                                    if (type === 'Int32') val = view[m / 4];
                                    else if (type === 'Int16') val = new Int16Array(engineRef.current.memory.buffer)[m / 2];
                                    else val = new Uint8Array(engineRef.current.memory.buffer)[m];
                                } catch (e) { }
                                return { addr: m, val };
                            }),
                            lastTarget: window.doomHunter?.lastTarget
                        },
                        watchValues: watchValues,
                        inspect: {
                            base: inspectBase,
                            data: inspectSlice
                        },
                        structSlice: Array.from(view.slice(hbBase / 4, hbBase / 4 + 40))
                    }));

                    win.webContents.send('DOOM_MEMORY_SYNC', payload);
                }
            } catch (e) {
                console.warn('[Doom Sync] Loop error:', e);
            }
        }, 200);

        // --- LINK DOOM HUNTER TO IPC ---
        const sendToDebugWindow = (msg) => {
            if (remote && externalWindowId) {
                try {
                    const win = remote.BrowserWindow.fromId(externalWindowId);
                    if (win && !win.isDestroyed()) {
                        win.webContents.send('DOOM_MEMORY_SYNC', {
                            type: 'DOOM_MEMORY_SYNC',
                            ...msg
                        });
                    }
                } catch (e) { }
            }
        };
        if (window.doomHunter) {
            window.doomHunter.sendToUI = sendToDebugWindow;

            // Ensure Default Stats are in Watchlist
            if (!window.doomHunter.watchlist) window.doomHunter.watchlist = [];
            const defaults = [
                { addr: 0x6532ac, type: 'Int32', label: 'TIME' },
                { addr: 0x653280, type: 'Int32', label: 'KILL' },
                { addr: 0x653270, type: 'Int32', label: 'ITEM' },
                { addr: 0x6532a8, type: 'Int32', label: 'PAR' },
                { addr: 0x653260, type: 'Int32', label: 'SECRET' }
            ];
            defaults.forEach(d => {
                if (!window.doomHunter.watchlist.some(w => w.addr === d.addr)) {
                    window.doomHunter.watchlist.push(d);
                }
            });
        }

        return () => {
            clearInterval(syncInterval);
            window.removeEventListener('message', browserHandler);
            cleanupIpc();
            if (window.doomHunter) window.doomHunter.sendToUI = null;
        };
    }, [externalWindowId, scannerStatus, scores, inspectOffset]);

    const handleSaveScore = async () => {
        // DEBUG FUNCTION: Dump memory around gametic 
        if (!engineRef.current.memory || !memoryScannerRef.current.gameticAddr) {
            console.log('[Doom Debug] Cannot dump - Gametic not found yet.');
            return;
        }

        const view = new Int32Array(engineRef.current.memory.buffer);
        const baseIdx = memoryScannerRef.current.gameticAddr / 4;
        const range = 300; // Expanded to find distant stats

        console.log('--- DOOM MEMORY DUMP (Gametic +/- 300) ---');
        let dump = {};
        for (let i = -range; i <= range; i++) {
            const val = view[baseIdx + i];
            if (val !== 0) dump[i] = val; // Only log non-zero for clarity
        }
        console.log(dump);
        console.log('-----------------------------------------');
        showCaptureNotice('DUMPED (SEE CONSOLE)');
    };

    const handleWatchAdd = (addr, type, label = '') => {
        if (!window.doomHunter.watchlist) window.doomHunter.watchlist = [];
        // Prevent duplicates
        if (window.doomHunter.watchlist.some(w => w.addr === addr)) return;
        window.doomHunter.watchlist.push({ addr, type, label });
        forceUpdate({});
    };

    const handleWatchRemove = (addr) => {
        if (!window.doomHunter.watchlist) return;
        window.doomHunter.watchlist = window.doomHunter.watchlist.filter(w => w.addr !== addr);
        forceUpdate({});
    };

    const handleMemoryWrite = (address, value, type) => {
        if (!engineRef.current.memory) return;
        const buffer = engineRef.current.memory.buffer;
        try {
            const addr = parseInt(address);
            const val = parseInt(value);
            console.log(`[Doom Memory] WRITE REQ: 0x${addr.toString(16)} = ${val} (${type})`);

            if (type === 'Int32') new Int32Array(buffer)[addr / 4] = val;
            else if (type === 'Int16') new Int16Array(buffer)[addr / 2] = val;
            else new Uint8Array(buffer)[addr] = val;

            console.log(`[Doom Memory] WRITE SUCCESS: 0x${addr.toString(16)} now reads ${new Int32Array(buffer)[addr / 4]}`);
            showCaptureNotice('MEM WRITE OK');
        } catch (e) {
            console.error('[Doom Memory] Write failed:', e);
        }
    };

    const toggleScreenMode = (mode) => {
        shufflingFocusRef.current = true;
        setTimeout(() => { shufflingFocusRef.current = false; }, 500);
        setScreenMode(mode);
    };




    // Removed redundant handleBlur (consolidated above)

    return (
        <div
            ref={containerRef}
            style={{ ...styles.container, position: 'relative', backgroundColor: '#000' }}
            onFocus={handleFocus}
            tabIndex="0"
        >
            <ScreenModeHelper
                containerRef={containerRef}
                styles={styles}
                onModeChange={toggleScreenMode}
                onOpenDebug={() => {
                    console.log('[Doom Debug] User requested Debug Window');
                    isDebuggingRef.current = true; // FORCE IMMEDIATE UPDATE
                    setIsDebugging(true);
                    openDebugWindow(setExternalWindowId, folderPath);
                }}
                onOpenLeaderboard={() => {
                    console.log('[Doom Debug] User opened Leaderboard');
                    isLeaderboardOpenRef.current = true; // FORCE IMMEDIATE UPDATE
                    toggleScreenMode('leaderboard');
                    setIsLeaderboardOpen(true);
                }}
            />

            {/* Leaderboard Modal */}
            {isLeaderboardOpen && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(10, 10, 15, 0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10001,
                    backdropFilter: 'blur(8px)',
                    fontFamily: '"Outfit", "Inter", sans-serif',
                }}>
                    <div style={{
                        width: '90%',
                        maxWidth: '800px',
                        height: '80%',
                        maxHeight: '600px',
                        backgroundColor: '#1a1a20',
                        border: '1px solid #4ade80',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 0 40px rgba(74, 222, 128, 0.1)',
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '20px 30px',
                            borderBottom: '1px solid rgba(74, 222, 128, 0.2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'linear-gradient(90deg, rgba(74,222,128,0.05), transparent)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <dc.Icon icon="trophy" style={{ color: '#4ade80', fontSize: '24px' }} />
                                <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', letterSpacing: '1px' }}>LEADERBOARD</h2>
                            </div>
                            <button
                                onClick={() => setIsLeaderboardOpen(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer',
                                    padding: '5px'
                                }}
                            >
                                <dc.Icon icon="x" />
                            </button>
                        </div>

                        {/* List */}
                        <div style={{ flex: 1, overflow: 'auto', padding: '0 0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#1a1a20', zIndex: 1 }}>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        <th style={{ padding: '15px 30px', textAlign: 'left', width: '60px' }}>#</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Level</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Kills</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Secrets</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Time</th>
                                        <th style={{ padding: '15px 30px', textAlign: 'right' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scores && scores.length > 0 ? (
                                        scores.map((s, i) => (
                                            <tr key={i} style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                                            }}>
                                                <td style={{ padding: '12px 30px', color: i < 3 ? '#4ade80' : '#888', fontWeight: 'bold' }}>{i + 1}</td>
                                                <td style={{ padding: '12px 15px', color: '#fff' }}>{s.level || 'E1M1'}</td>
                                                <td style={{ padding: '12px 15px', textAlign: 'right', fontFamily: 'monospace' }}>{s.kills}%</td>
                                                <td style={{ padding: '12px 15px', textAlign: 'right', fontFamily: 'monospace' }}>{s.secrets}%</td>
                                                <td style={{ padding: '12px 15px', textAlign: 'right', fontFamily: 'monospace' }}>{s.time}s</td>
                                                <td style={{ padding: '12px 30px', textAlign: 'right', fontSize: '12px', opacity: 0.5 }}>
                                                    {new Date(s.timestamp).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '50px', textAlign: 'center', opacity: 0.5 }}>
                                                No records found yet. Go slay some demons!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '15px 30px',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '11px',
                            color: '#666',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <span>LOCAL RECORDS (.doom-assets/scores.json)</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span>BETO NEXUS CONNECTED</span>
                                {debugData && debugData.length > 0 && (
                                    <div style={{
                                        marginTop: '10px',
                                        background: 'rgba(0,0,0,0.5)',
                                        padding: '10px',
                                        borderRadius: '4px',
                                        maxHeight: '100px',
                                        overflowY: 'auto',
                                        fontSize: '10px',
                                        fontFamily: 'monospace',
                                        textAlign: 'left',
                                        width: '100%',
                                        maxWidth: '400px'
                                    }}>
                                        <div style={{ color: '#aaa', marginBottom: '5px' }}>MEMORY DUMP (Gametic Neighborhood):</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                            {debugData.map((d, i) => (
                                                <span key={i} style={{ color: d.value === 1 ? '#4ade80' : d.value === 3 ? '#a076f9' : '#555' }}>
                                                    {d.offset >= 0 ? '+' : ''}{d.offset}:{d.value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading && !error && (
                <div style={styles.centeredContainer}>
                    <div style={styles.loadingSpinner}></div>
                    <p style={styles.text}>Initializing engine...</p>
                </div>
            )}

            {error ? (
                <div style={styles.card}>
                    <h2 style={styles.title}>Error</h2>
                    <p style={styles.errorText}>{error}</p>
                </div>
            ) : (
                <>
                    <canvas
                        ref={canvasRef}
                        tabIndex="0"
                        style={{
                            ...styles.canvas,
                            display: loading ? 'none' : 'block',
                            boxShadow: isFocused ? '0 0 30px rgba(160, 118, 249, 0.4)' : styles.canvas.boxShadow,
                            outline: 'none'
                        }}
                    />

                    {/* Focus Overlay */}
                    {!loading && !error && !isFocused && !isDebugging && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFocus();
                                if (containerRef.current) containerRef.current.focus();
                            }}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(4px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 10000,
                                color: '#a076f9',
                                gap: '15px',
                                borderRadius: styles.canvas.borderRadius
                            }}
                        >
                            <dc.Icon icon="mouse-pointer-2" style={{ fontSize: '32px' }} />
                            <span style={{ fontWeight: '600', letterSpacing: '1px' }}>CLICK TO RESUME ACTION</span>
                            <span style={{ fontSize: '11px', opacity: 0.6, color: '#fff' }}>Input is locked to game while active</span>
                        </div>
                    )}
                </>
            )}

            {!loading && !error && (
                <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(10, 10, 20, 0.75)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    padding: '10px 24px',
                    borderRadius: '24px',
                    fontSize: '10px',
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    fontWeight: '700',
                    letterSpacing: '1.2px',
                    pointerEvents: 'none',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(160, 118, 249, 0.3)',
                    display: 'flex',
                    gap: '20px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(160, 118, 249, 0.1)',
                    zIndex: 9998,
                    textTransform: 'uppercase'
                }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <span style={{ color: '#a076f9', opacity: 1 }}>WS / ↑↓</span>
                        <span style={{ opacity: 0.4 }}>MOVE</span>
                    </div>
                    <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <span style={{ color: '#a076f9', opacity: 1 }}>AD</span>
                        <span style={{ opacity: 0.4 }}>STRAFE</span>
                    </div>
                    <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <span style={{ color: '#a076f9', opacity: 1 }}>← →</span>
                        <span style={{ opacity: 0.4 }}>LOOK</span>
                    </div>
                    <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <span style={{ color: '#a076f9', opacity: 1 }}>Z / K / SHIFT</span>
                        <span style={{ opacity: 0.4 }}>FIRE</span>
                    </div>
                    <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <span style={{ color: '#a076f9', opacity: 1 }}>SPACE / L</span>
                        <span style={{ opacity: 0.4 }}>OPEN</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helpers
function readWasmString(memory, offset, length) {
    const bytes = new Uint8Array(memory.buffer, offset, length);
    return new TextDecoder('utf8').decode(bytes);
}

function doomKeyCode(keyCode) {
    switch (keyCode) {
        case 8: return 127; // KEY_BACKSPACE
        case 17: return (0x80 + 0x1d); // KEY_RCTRL
        case 90: // Z
        case 75: // K
        case 16: // Shift
            return (0x80 + 0x1d); // Fire (Ctrl)
        case 10: return 13; // Enter
        case 13: return 13; // Enter
        case 18: return (0x80 + 0x38); // KEY_RALT
        case 88: // X
        case 74: return (0x80 + 0x38); // J -> Strafe (Alt)
        case 32: // Space
        case 76: return 32; // L -> Open (Space)
        case 37: return 0xac; // Left Arrow -> Turn Left
        case 39: return 0xae; // Right Arrow -> Turn Right
        case 38: // Up Arrow
        case 87: return 0xad; // W -> Forward
        case 40: // Down Arrow
        case 83: return 0xaf; // S -> Backward
        case 65: return 44;   // A -> ASCII ',' (Strafe Left)
        case 68: return 46;   // D -> ASCII '.' (Strafe Right)
        default:
            if (keyCode >= 65 && keyCode <= 90) return keyCode + 32; // lower case
            if (keyCode >= 112 && keyCode <= 123) return keyCode + 75; // KEY_F1
            return keyCode;
    }
}

return { DoomPlayer };

```

# src__components__ScreenModeHelper

```jsx
/**
 * ScreenModeHelper component for handling Full Tab and Fullscreen modes
 */
function ScreenModeHelper({ containerRef, styles, onModeChange, onOpenDebug, onOpenLeaderboard }) {
    const { useState, useEffect, useRef, useCallback } = dc;
    const [activeMode, setActiveMode] = useState('fullTab'); // Start in fullTab as requested
    const [isFullscreen, setIsFullscreen] = useState(false);
    const stateRefs = useRef({
        placeholder: null,
        parentPositionInfo: null,
    }).current;

    // DOM Helpers
    const findNearestAncestorWithClass = (element, className) => {
        if (!element) return null;
        let current = element.parentNode;
        while (current) {
            if (current.classList && current.classList.contains(className)) return current;
            current = current.parentNode;
        }
        return null;
    };

    const findDirectChildByClass = (parent, className) => {
        if (!parent) return null;
        for (const child of parent.children) {
            if (child.classList && child.classList.contains(className)) return child;
        }
        return null;
    };

    const applyFullTab = useCallback((container) => {
        const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
        if (!targetPaneContent) return false;

        const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;

        // Save original state
        stateRefs.placeholder = document.createElement("div");
        stateRefs.placeholder.style.display = "none";
        container.parentNode.insertBefore(stateRefs.placeholder, container);

        stateRefs.parentPositionInfo = {
            element: contentWrapper,
            original: window.getComputedStyle(contentWrapper).position,
        };

        if (stateRefs.parentPositionInfo.original === "static") {
            contentWrapper.style.position = "relative";
        }

        contentWrapper.appendChild(container);
        Object.assign(container.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            zIndex: "9998",
            overflow: "hidden",
            backgroundColor: 'var(--background-primary)'
        });
        return true;
    }, []);

    const resetFullTab = useCallback((container) => {
        if (stateRefs.placeholder?.parentNode) {
            stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
        }
        if (stateRefs.parentPositionInfo?.element) {
            stateRefs.parentPositionInfo.element.style.position =
                stateRefs.parentPositionInfo.original === "static" ? "" : stateRefs.parentPositionInfo.original;
        }
        container.removeAttribute("style");
        stateRefs.placeholder = null;
        stateRefs.parentPositionInfo = null;
    }, []);

    const applyFullscreen = useCallback((container) => {
        if (container.requestFullscreen) container.requestFullscreen();
        else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
        else if (container.msRequestFullscreen) container.msRequestFullscreen();
    }, []);

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        document.addEventListener('msfullscreenchange', handleFsChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
            document.removeEventListener('msfullscreenchange', handleFsChange);
        };
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (activeMode === 'fullTab') {
            applyFullTab(container);
        } else {
            resetFullTab(container);
        }

        if (onModeChange) onModeChange(activeMode);

        return () => {
            if (activeMode === 'fullTab') resetFullTab(container);
        };
    }, [activeMode, containerRef, applyFullTab, resetFullTab, onModeChange]);

    const toggleFullscreen = (e) => {
        e.stopPropagation();
        const container = containerRef.current;
        if (!container) return;

        if (isFullscreen) {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        } else {
            applyFullscreen(container);
        }
    };

    const toggleFullTab = (e) => {
        e.stopPropagation();
        setActiveMode(prev => prev === 'fullTab' ? 'default' : 'fullTab');
    };

    return (
        <div style={styles.controlsContainer}>
            {/* Leaderboard Button */}
            <button
                className="mode-button"
                style={styles.modeButton}
                onClick={(e) => {
                    e.stopPropagation();
                    if (containerRef.current) containerRef.current.focus();
                    if (onOpenLeaderboard) onOpenLeaderboard();
                }}
                title="View Achievements / Leaderboard"
            >
                <dc.Icon icon="trophy" style={styles.modeIcon} />
                <span style={styles.modeLabel}>RANK</span>
            </button>

            {/* Debug Button */}
            <button
                className="mode-button"
                style={styles.modeButton}
                onClick={(e) => {
                    e.stopPropagation();
                    if (containerRef.current) containerRef.current.focus();
                    if (onOpenDebug) onOpenDebug();
                }}
                title="Toggle Diagnostics / Open External"
            >
                <dc.Icon icon="terminal" style={styles.modeIcon} />
                <span style={styles.modeLabel}>DEBUG</span>
            </button>

            {/* FullTab Button */}
            <button
                className="mode-button"
                style={{
                    ...styles.modeButton,
                    ...(activeMode === 'fullTab' ? styles.modeButtonActive : {})
                }}
                onClick={(e) => {
                    if (containerRef.current) containerRef.current.focus();
                    toggleFullTab(e);
                }}
                title="Toggle Full Tab (Fill Pane)"
            >
                <dc.Icon icon="maximize-2" style={styles.modeIcon} />
                <span style={styles.modeLabel}>TAB</span>
            </button>

            {/* Fullscreen Button */}
            <button
                className="mode-button"
                style={{
                    ...styles.modeButton,
                    ...(isFullscreen ? styles.modeButtonActive : {})
                }}
                onClick={(e) => {
                    if (containerRef.current) containerRef.current.focus();
                    toggleFullscreen(e);
                }}
                title="Toggle System Fullscreen"
            >
                <dc.Icon icon="maximize" style={styles.modeIcon} />
                <span style={styles.modeLabel}>FULL</span>
            </button>
        </div>
    );
}

return { ScreenModeHelper };

```

# src__components__DoomDebug__DebugWindowManager

```js

// Helper to interact with filesystem
const writeTempHtml = (html) => {
    try {
        const fs = window.require ? window.require('fs') : require('fs');
        const path = window.require ? window.require('path') : require('path');
        const os = window.require ? window.require('os') : require('os');

        // Use system temp dir to avoid path/permission issues
        const tmpDir = os.tmpdir();
        const filePath = path.join(tmpDir, 'doom_debug.html');

        fs.writeFileSync(filePath, html, 'utf8');
        return 'file://' + filePath;
    } catch (e) {
        console.error('[Doom] FS Write Failed:', e);
        return null;
    }
};

const openDebugWindow = (setExternalWindowId, folderPath) => {
    let BrowserWindow;
    try {
        const electron = require('@electron/remote') || require('electron').remote || {};
        BrowserWindow = electron.BrowserWindow;
    } catch (e) { }

    if (!BrowserWindow) {
        console.error('[Doom] BrowserWindow not available for external mode.');
        // Fallback for non-electron environments
        const win = window.open('', 'DoomDiagnostics', 'width=450,height=900');
        setupExternalContent(win, null, null, folderPath);
        return;
    }

    let mainWinId = null;
    let mainVcId = null;
    try {
        const remote = window.require ? window.require('@electron/remote') : require('@electron/remote');
        const curr = remote.getCurrentWindow();
        mainWinId = curr.id;
        mainVcId = curr.webContents.id;
    } catch (e) {
        console.error('[Doom] ID lookup failed:', e);
    }

    // Load saved bounds
    let bounds = { width: 400, height: 560 };
    try {
        const saved = localStorage.getItem('doom-debug-bounds');
        if (saved) {
            const parsed = JSON.parse(saved);
            bounds = { ...bounds, ...parsed };
        }
    } catch (e) { }

    const win = new BrowserWindow({
        ...bounds,
        title: 'DOOM MEMORY DIAGNOSTICS [BETA]',
        backgroundColor: '#0d0d1a',
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
            enableRemoteModule: true,
            webSecurity: false
        }
    });

    // Save bounds on change
    const saveBounds = () => {
        try {
            const b = win.getBounds();
            localStorage.setItem('doom-debug-bounds', JSON.stringify(b));
        } catch (e) { }
    };
    win.on('move', saveBounds);
    win.on('resize', saveBounds);

    try {
        const remote = window.require ? window.require('@electron/remote') : require('@electron/remote');
        remote.require('@electron/remote/main').enable(win.webContents);
    } catch (e) { }

    setupExternalContent(win, mainWinId, mainVcId, folderPath);
    setExternalWindowId(win.id);
};

const setupExternalContent = (target, mainWinId, mainVcId, folderPath) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'unsafe-eval' file: data: *; style-src 'self' 'unsafe-inline' *;">
            <style>
                body { background: #0d0d1a; color: #eee; font-family: 'Consolas', 'Monaco', monospace; margin: 0; padding: 10px; font-size: 11px; overflow-x: hidden; }
                .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #333; margin-bottom: 15px; }
                .brand { color: #a076f9; font-weight: bold; letter-spacing: 2px; }
                .status { color: #4f4; }
                
                /* TABS */
                .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
                .tab { padding: 6px 12px; background: rgba(255,255,255,0.05); cursor: pointer; border-radius: 4px; border: 1px solid transparent; opacity: 0.6; }
                .tab.active { background: #a076f9; color: white; opacity: 1; font-weight: bold; }
                
                .view { display: none; }
                .view.active { display: block; }
                
                /* COMPONENTS */
                button { background: #a076f9; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-family: inherit; font-weight: bold; }
                button.dim { background: rgba(255,255,255,0.1); }
                input { background: #1a1a2e; border: 1px solid #333; color: white; padding: 6px; border-radius: 4px; font-family: inherit; }
                
                .panel { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; border: 1px solid #333; margin-bottom: 10px; }
                
                /* HEX INSPECTOR */
                .hex-row { display: flex; font-size: 10px; font-family: 'Courier New', monospace; padding: 2px 0; border-bottom: 1px solid #111; }
                .hex-addr { color: #a076f9; width: 60px; margin-right: 10px; opacity: 0.8; }
                .hex-bytes { display: grid; grid-template-columns: repeat(16, 1fr); gap: 2px; width: 220px; }
                .byte { text-align: center; color: #eee; cursor: pointer; border-radius: 2px; }
                .byte:hover { background: #a076f9; color: white; font-weight: bold; }
                .hex-ascii { margin-left: 10px; color: #aaa; letter-spacing: 1px; }

                /* WATCHLIST */
                .watch-item { display: flex; justify-content: space-between; align-items: center; padding: 6px; background: rgba(255,255,255,0.03); margin-bottom: 4px; border-left: 3px solid #a076f9; }
                .watch-val { font-size: 13px; font-weight: bold; color: #4f4; }
                
                .matches-list { max-height: 150px; overflow-y: auto; margin-top: 10px; }
                .match-row { display: flex; justify-content: space-between; padding: 4px; background: rgba(0,0,0,0.2); margin-bottom: 2px; cursor: pointer; }
                .match-row:hover { background: rgba(160,118,249,0.2); }
            </style>
        </head>
        <body>
            <div class="header">
                <span class="brand">DOOM::DEBUG</span>
                <div style="text-align: right">
                    <span id="status" class="status">CONNECTING...</span>
                    <div id="scanner-status" style="font-size: 8px; color: #a076f9; opacity: 0.8; margin-top: 2px;">Scanner: Initializing...</div>
                </div>
            </div>
            <div id="debug-log" style="font-family:monospace; font-size:9px; color:#aaa; max-height:100px; overflow-y:auto; border-bottom:1px solid #333; margin-bottom:10px;"></div>

            <div class="panel" id="editPanel" style="display:none; border: 1px solid #a076f9; background: rgba(160, 118, 249, 0.1); margin-bottom: 15px;">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <div style="opacity:0.7;">MODIFY ADDR: <span id="editAddr" style="color:#a076f9; font-weight:bold;"></span></div>
                    <button class="dim" style="padding: 2px 8px; font-size: 10px;" onclick="el('editPanel').style.display='none'">CANCEL</button>
                </div>
                
                <!-- DATA INSPECTOR -->
                <div style="background:rgba(0,0,0,0.3); padding:5px; margin-bottom:10px; border-radius:4px; font-size:10px; font-family:monospace;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2px;">
                        <div style="color:#aaa;">Uint8: <span id="valU8" style="color:#4f4;">-</span></div>
                        <div style="color:#aaa;">Int8: <span id="valI8" style="color:#4f4;">-</span></div>
                        <div style="color:#aaa;">Int16: <span id="valI16" style="color:#adf;">-</span></div>
                        <div style="color:#aaa;">Int32: <span id="valI32" style="color:#fa4;">-</span></div>
                    </div>
                    <div style="margin-top:4px; padding-top:4px; border-top:1px solid #333; color:#aaa;">
                        ASCII: <span id="valAscii" style="color:#fff; font-weight:bold;">-</span>
                        <div style="font-size:8px; opacity:0.5; margin-top:2px;">(Right column shows ASCII representation)</div>
                    </div>
                </div>

                <div style="display:flex; gap:5px;">
                    <input id="editVal" type="number" style="flex:1" placeholder="Value...">
                    <select id="editType" style="background:#1a1a2e; color:white; border:1px solid #333;">
                        <option value="Int32">Int32</option>
                        <option value="Int16">Int16</option>
                        <option value="Int8">Byte</option>
                    </select>
                    <button onclick="commitEdit()">WRITE</button>
                </div>
                <div style="font-size: 9px; opacity: 0.5; margin-top: 5px;">TIP: Use Int32 for Health/Score. Game updates immediately on WRITE.</div>
            </div>

            <div class="tabs">
                <div class="tab active" onclick="switchTab(0)">HUNTER</div>
                <div class="tab" onclick="switchTab(1)">INSPECTOR</div>
                <div class="tab" onclick="switchTab(2)">WATCH</div>
                <div class="tab" onclick="switchTab(3)">STRUCTS</div>
                <div class="tab" onclick="switchTab(4)">CHEATS</div>
            </div>

            <!-- TAB 0: HUNTER -->
            <div id="view-0" class="view active">
                <div class="panel">
                    <div style="margin-bottom: 10px; opacity: 0.7;">MEMORY SEARCH</div>
                    <div style="display: flex; gap: 5px;">
                        <input id="huntVal" type="number" placeholder="Value..." style="flex:1">
                        <button onclick="doHunt('Int32')">Int32</button>
                        <button class="dim" onclick="doHunt('Int16')">Int16</button>
                        <button class="dim" onclick="doHunt('Int8')">Byte</button>
                    </div>
                </div>
                
                <div class="panel">
                    <div style="display: flex; gap: 5px;">
                        <button onclick="doCmd('DOOM_BASELINE')" style="flex:1" class="dim" title="Capture current memory state">SNAPSHOT</button>
                        <button onclick="doCmd('DOOM_COMPARE', { value: el('huntVal').value })" style="flex:1" title="Compare with Snapshot (0 -> X)">COMPARE</button>
                        <button onclick="doCmd('DOOM_HUNT_FILTER', { value: el('huntVal').value })" style="flex:1; background:#6441a5; color:white; border:1px solid #a076f9;" title="Keep only current results that match this value">FILTER</button>
                    </div>
                </div>

                <div class="panel" id="matchesPanel" style="display:none">
                    <div style="opacity: 0.7; border-bottom: 1px solid #333; margin-bottom: 5px;">MATCHES</div>
                    <div id="matches" class="matches-list"></div>
                </div>
            </div>

            <!-- TAB 1: INSPECTOR -->
            <div id="view-1" class="view">
                <div class="panel">
                    <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                        <input id="inspectAddr" type="text" placeholder="Goto Addr (0x...)" style="flex:1">
                        <button onclick="gotoAddr()">GO</button>
                    </div>
                    <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                        <input id="quickSearchVal" type="number" placeholder="Quick Find Value..." style="flex:1; border:1px solid #6441a5;">
                        <button onclick="doQuickSearch()" style="background:#6441a5;">FIND</button>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <button class="dim" onclick="movePage(-256)">PREV</button>
                        <span id="currPage" style="line-height: 25px; opacity:0.5;">-</span>
                        <button class="dim" onclick="movePage(256)">NEXT</button>
                    </div>
                    <div id="hexView" style="position:relative;"></div>
                    <div style="font-size: 9px; opacity: 0.4; text-align: center; margin-top: 10px;">TIP: Click any byte to Inspect & Edit</div>
                </div>
            </div>

            <!-- TAB 2: WATCHLIST -->
            <div id="view-2" class="view">
                <div class="panel">
                    <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                        <input id="watchAddr" type="text" placeholder="Addr/Offset..." style="flex:1">
                        <select id="watchType" style="background:#1a1a2e; color:white; border:1px solid #333; width:80px;">
                            <option value="Int32">Int32</option>
                            <option value="Int16">Int16</option>
                            <option value="Int8">Int8</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                        <input id="watchLabel" type="text" placeholder="Label (e.g. HEALTH)..." style="flex:1">
                        <button onclick="addWatch()" style="width:40px;">+</button>
                    </div>
                    <div id="watchlist"></div>
                </div>
            </div>

            <!-- TAB 3: STRUCTS -->
            <div id="view-3" class="view">
                <div class="panel">
                    <div style="opacity: 0.7; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; color:#4f4;">
                        BASE: Hb+0 (Gametic Area)
                    </div>
                    <div id="structView" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:5px;"></div>
                    <button class="dim" style="width:100%; margin-top: 15px;" onclick="doCmd('DOOM_DUMP_REQUEST')">LOG DEEP DUMP</button>
                </div>

                <div class="panel" style="border: 1px solid #44a; background: rgba(68,68,170,0.1);">
                    <div style="opacity: 0.7; border-bottom: 1px solid #333; margin-bottom: 10px; color:#adf;">STATS CALIBRATION</div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; margin-bottom:10px;">
                        <div>
                            <label style="font-size:9px; color:#aaa;">KILLS %</label>
                            <input id="calKills" type="number" placeholder="100" style="width:100%;">
                        </div>
                        <div>
                            <label style="font-size:9px; color:#aaa;">TIME (s)</label>
                            <input id="calTime" type="number" placeholder="60" style="width:100%;">
                        </div>
                    </div>
                    <button onclick="doCalibrate()" style="width:100%;">FIND STATS</button>
                    <div id="calResult" style="margin-top:10px; font-size:9px; font-family:monospace; color:#4f4; white-space:pre-wrap;"></div>
                </div>
            </div>

            <!-- TAB 4: CHEATS -->
            <div id="view-4" class="view">
                <div class="panel">
                    <div style="opacity: 0.7; border-bottom: 1px solid #333; margin-bottom: 10px; color:#fa4;">CLASSIC CODES</div>
                    <div style="display:flex; gap:5px;">
                         <button onclick="doCmd('DOOM_SEND_KEYS', { keys: 'iddqd' })" style="flex:1; font-size:9px;">GOD MODE</button>
                         <button onclick="doCmd('DOOM_SEND_KEYS', { keys: 'idkfa' })" style="flex:1; font-size:9px;">FULL KIT</button>
                         <button onclick="doCmd('DOOM_SEND_KEYS', { keys: 'idclip' })" style="flex:1; font-size:9px;">GHOST</button>
                    </div>
                </div>
            </div>

            <script>
                // Injected IDs
                const MAIN_WIN_ID = ${mainWinId};
                const MAIN_VC_ID = ${mainVcId};

                // Visual Logger

                function log(msg) {
                    if (msg.includes('LINK') || msg.includes('DATA') || msg.includes('OFFLINE')) {
                        const el = document.getElementById('status');
                        if (el) el.innerText = msg;
                    }
                    console.log('[DebugWin]', msg);
                    const logDiv = document.getElementById('debug-log');
                    if (logDiv) {
                        const line = document.createElement('div');
                        line.innerText = msg;
                        logDiv.appendChild(line);
                        logDiv.scrollTop = logDiv.scrollHeight;
                    }
                }

                let ipcRenderer;
                
                try {
                    log('JS START - Init...');
                } catch(e) {}

                window.onerror = function(msg, url, line) {
                   log('ERR: ' + msg + ' @ ' + line);
                   return false;
                };

                window.onload = function() {
                    log('Window Loaded. Checking Electron...');
                    try { 
                        // Try multiple ways to get electron
                        let electron;
                        if (window.require) {
                             log('Using window.require');
                             electron = window.require('electron');
                        } else {
                             log('Using global require');
                             electron = require('electron');
                        }

                        if (!electron) throw new Error('Electron module null');
                        
                        ipcRenderer = electron.ipcRenderer;
                        
                        if (ipcRenderer) {
                            log('LINK: DIRECT (ipcMain) - ESTABLISHING...');
                            document.getElementById('status').style.color = '#4f4';

                            // Listen for sync
                            ipcRenderer.on('DOOM_MEMORY_SYNC', (e, data) => {
                                 // First sync success
                                 if (document.getElementById('status').innerText.includes('WAITING') || 
                                     document.getElementById('status').innerText.includes('CONNECTING') ||
                                     document.getElementById('status').innerText.includes('ESTABLISHING')) {
                                     log('DATA RECEIVED');
                                     document.getElementById('status').innerText = 'LINK ESTABLISHED';
                                 }
                                 handleUpdate(data);
                            });

                            // Send initial ping AFTER ipcRenderer is ready
                            doCmd('DOOM_PING', { timestamp: Date.now() });

                            // Add scrolling to Inspector
                            const inspView = el('view-1');
                            if (inspView) {
                                inspView.addEventListener('wheel', (e) => {
                                    // Don't intercept scroll if user is interacting with an input
                                    if (e.target.tagName === 'INPUT') return;
                                    
                                    e.preventDefault();
                                    const delta = e.deltaY > 0 ? 16 : -16;
                                    movePage(delta);
                                }, { passive: false });
                            }
                        } else {
                            throw new Error('ipcRenderer null');
                        }

                    } catch(e) { 
                        console.error('IPC Inop:', e); 
                        log('OFFLINE: ' + e.message);
                        document.getElementById('status').style.color = '#f44';
                    }
                };

                const el = (id) => document.getElementById(id);
                window.doCmd = function(type, args = {}) {
                    log('CMD: ' + type);
                    const payload = { type, ...args, protocol: 'DOOM_IPC', source: 'DOOM_TERMINAL' };
                    
                    // Standard Electron IPC
                    if (ipcRenderer) {
                        try { 
                            ipcRenderer.send('DOOM_COMMAND', payload); 
                        } catch(e) { log('IPC Err: ' + e.message); }
                    }
                    
                    // Fallback: Opener
                    if (window.opener) {
                        try { window.opener.postMessage(payload, '*'); } catch(e) {}
                    }
                    
                    // Feedback
                    const btn = (window.event && window.event.target) ? window.event.target : null;
                    if (btn && btn.tagName === 'BUTTON') {
                        const oldC = btn.style.backgroundColor;
                        btn.style.backgroundColor = '#4f4';
                        setTimeout(() => btn.style.backgroundColor = '', 200);
                    }
                }

                window.doHunt = function(type) { doCmd('DOOM_HUNT', { bitType: type, value: el('huntVal').value }); }
                window.switchTab = function(n) {
                    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i===n));
                    document.querySelectorAll('.view').forEach((v, i) => v.classList.toggle('active', i===n));
                }
                window.doInspect = function(addr) { 
                    window.currentBase = addr;
                    doCmd('DOOM_INSPECT_PAGE', { offset: addr }); 
                    switchTab(1); 
                }
                window.gotoAddr = function() {
                    const val = el('inspectAddr').value;
                    const addr = val.startsWith('0x') ? parseInt(val, 16) : parseInt(val);
                    window.currentBase = addr;
                    doCmd('DOOM_INSPECT_PAGE', { offset: addr });
                }
                let scrollTimeout = null;
                window.movePage = function(delta) { 
                    if (window.currentBase === undefined) window.currentBase = 0;
                    let nextBase = window.currentBase + delta;
                    if (nextBase < 0) nextBase = 0;
                    window.currentBase = nextBase;

                    // Optimistic UI: Update address label immediately
                    const addrLabel = el('currPage');
                    if (addrLabel) addrLabel.innerText = '0x' + window.currentBase.toString(16).toUpperCase() + '...';
                    
                    // Visual feedback: Dim view while loading
                    const view = el('hexView');
                    if (view) view.style.opacity = '0.4';

                    if (scrollTimeout) clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        doCmd('DOOM_INSPECT_PAGE', { offset: window.currentBase });
                    }, 40);
                }
                window.addWatch = function() {
                    const addrVal = el('watchAddr').value;
                    const addr = addrVal.startsWith('0x') ? parseInt(addrVal, 16) : parseInt(addrVal);
                    const label = el('watchLabel').value;
                    doCmd('DOOM_WATCH_ADD', { address: addr, bitType: el('watchType').value, label: label });
                }
                window.removeWatch = function(addr) { doCmd('DOOM_WATCH_REMOVE', { address: addr }); }
                window.doFreeze = function(addr, val, type, enabled) {
                    doCmd('DOOM_FREEZE', { address: addr, value: val, bitType: type, enabled: enabled });
                }
                window.commitEdit = function() {
                    doCmd('DOOM_MEMORY_WRITE', { 
                        address: window.targetEditAddr, 
                        value: el('editVal').value, 
                        bitType: el('editType').value 
                    });
                }
                window.startEdit = function(addr) {
                    window.targetEditAddr = addr;
                    const panel = el('editPanel');
                    
                    // Populate Data Inspector
                    if (window.lastInspectData && window.lastInspectBase !== undefined) {
                        const offset = addr - window.lastInspectBase;
                        if (offset >= 0 && offset < window.lastInspectData.length) {
                             const data = window.lastInspectData;
                             const u8 = data[offset];
                             const i8 = (u8 << 24) >> 24;
                             
                             el('valU8').innerText = u8 + ' (0x' + u8.toString(16).padStart(2,'0') + ')';
                             el('valI8').innerText = i8;
                             el('valAscii').innerText = (u8 > 31 && u8 < 127) ? String.fromCharCode(u8) : '.';

                             // Int16
                             if (offset + 1 < data.length) {
                                 const i16 = data[offset] | (data[offset+1] << 8);
                                 const s16 = (i16 << 16) >> 16;
                                 el('valI16').innerText = s16;
                             } else el('valI16').innerText = '-';

                             // Int32
                             if (offset + 3 < data.length) {
                                 const i32 = data[offset] | (data[offset+1] << 8) | (data[offset+2] << 16) | (data[offset+3] << 24);
                                 el('valI32').innerText = i32;
                             } else el('valI32').innerText = '-';
                        }
                    }

                    panel.style.display = 'block';
                    el('editAddr').innerText = '0x' + addr.toString(16);
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                };

                window.doQuickSearch = function() {
                    const val = el('quickSearchVal').value;
                    if (!val) return;
                    // Trigger hunt, but we want to auto-navigate. 
                    // reusing the generic hunt logic for now, user can click matches.
                    // Ideally we'd have a 'FIND_FIRST' command but DOOM_HUNT is what we have.
                    // We'll switch to Hunter tab automatically to show results.
                    switchTab(0);
                    el('huntVal').value = val; // Sync with hunter input
                    doCmd('DOOM_HUNT', { bitType: 'Int32', value: val });
                };

                const renderHex = (base, data) => {
                    // Cache data for inspector
                    window.lastInspectBase = base;
                    window.lastInspectData = data;
                    const addrLabel = el('currPage');
                    if (addrLabel) addrLabel.innerText = '0x' + base.toString(16).toUpperCase();
                    
                    const view = el('hexView');
                    if (view) view.style.opacity = '1';

                    let html = '';
                    const len = data.length;
                    for(let i = 0; i < len; i += 16) {
                        const rowOffset = base + i;
                        let hexStr = '', asciiStr = '';
                        
                        for(let j = 0; j < 16; j++) {
                            const b = data[i+j];
                            if (b === undefined) break;
                            const addr = rowOffset + j;
                            hexStr += '<span class="byte" onclick="startEdit(' + addr + ')">' + b.toString(16).padStart(2, '0') + '</span> ';
                            asciiStr += (b > 31 && b < 127) ? String.fromCharCode(b) : '.';
                        }
                        
                        html += '<div class="hex-row">' +
                            '<div class="hex-addr">0x' + rowOffset.toString(16) + '</div>' +
                            '<div class="hex-bytes">' + hexStr + '</div>' +
                            '<div class="hex-ascii">' + asciiStr + '</div>' +
                        '</div>';
                    }
                    view.innerHTML = html;
                };

                const renderStruct = (hbBase, memSlice) => {
                    let html = '';
                    for(let i=0; i<40; i++) {
                        const val = memSlice[i] ?? '-';
                        html += '<div style="background:rgba(0,0,0,0.2); border:1px solid '+(val!==0?'rgba(79,255,79,0.2)':'#222')+'; padding:4px; text-align:center; border-radius:4px;">' +
                                '<div style="font-size:7px; opacity:0.3">Hb+'+i+'</div><div style="font-size:10px; font-weight:bold; color:'+(val!==0?'#4f4':'#888')+'">'+val+'</div></div>';
                    }
                    el('structView').innerHTML = html;
                };

                const handleUpdate = (raw) => {
                    // UNWRAP
                    const data = (raw && raw.data && raw.data.type === 'DOOM_MEMORY_SYNC') ? raw.data : (raw || {});
                    if (data.type !== 'DOOM_MEMORY_SYNC') return;

                    if (data.scannerStatus) el('scanner-status').innerText = 'Scanner: ' + data.scannerStatus;

                    if (data.hunter) {
                        const hunter = data.hunter;
                        const panel = el('matchesPanel');
                        const list = el('matches');
                        
                        if (hunter.matches && hunter.matches.length > 0) {
                            panel.style.display = 'block';
                            const hbBase = data.hbBase;
                            list.innerHTML = hunter.matches.map(m => {
                                const relStr = hbBase ? ('Hb+' + Math.floor((m.addr - hbBase) / 4)) : '<span style="opacity:0.5">LEARNING...</span>';
                                return '<div class="match-row" onclick="doInspect(' + m.addr + ')">' +
                                    '<code>0x' + m.addr.toString(16) + '</code>' +
                                    '<span style="color:#a076f9; font-size:9px; margin-left:8px;">' + relStr + '</span>' +
                                    '<span style="flex:1; text-align:right; font-weight:bold; color:#4f4; margin-right:8px;">' + m.val + '</span>' +
                                    '<button style="padding:2px 5px; font-size:9px; background:#6441a5;" onclick="event.stopPropagation(); startEdit(' + m.addr + ')">CHANGE</button>' +
                                    '</div>';
                            }).join('');
                        } else {
                            panel.style.display = 'block';
                            const msg = (hunter.lastTarget !== null && hunter.lastTarget !== undefined) 
                                ? 'No matches found for ' + hunter.lastTarget 
                                : 'Perform a search to see matches.';
                            list.innerHTML = '<div style="opacity:0.5; text-align:center; padding:10px;">' + msg + '</div>';
                        }
                    }

                    if (data.inspect) {
                        window.currentBase = data.inspect.base;
                        renderHex(data.inspect.base, data.inspect.data);
                    }
                    if (data.calibrationMsg) el('calResult').innerText = data.calibrationMsg;
                    if (data.watchValues) {
                        el('watchlist').innerHTML = data.watchValues.map(w => 
                            '<div class="watch-item" style="padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05)">' +
                                '<div style="flex:1">' +
                                    '<div style="font-size:10px; font-weight:bold; color:#a076f9">' + (w.label || '0x'+w.addr.toString(16)) + '</div>' +
                                    '<div style="font-size:8px; opacity:0.4">0x'+w.addr.toString(16)+' | '+w.type+'</div>' +
                                '</div>' +
                                '<div class="watch-val" style="font-family:monospace; font-weight:bold; color:#4f4; min-width:60px; text-align:right; margin-right:10px;">'+w.val+'</div>' +
                                '<button class="dim" style="padding:2px 5px; font-size:9px" onclick="removeWatch('+w.addr+')">X</button>' +
                            '</div>'
                        ).join('');
                    }
                    if (data.structSlice) renderStruct(data.hbBase, data.structSlice);
                }

                window.doCalibrate = function() {
                    const k = el('calKills').value, t = el('calTime').value;
                    if(!k || !t) return alert('Enter Kills% and Time');
                    el('calResult').innerText = 'Scanning...';
                    doCmd('DOOM_CALIBRATE_STATS', { kills: parseInt(k), time: parseInt(t) });
                }

                window.addEventListener('message', (e) => {
                    if (e.data && e.data.protocol === 'DOOM_IPC_ACK') {
                            console.log('[Terminal] Handshake confirmed');
                    }
                    handleUpdate(e.data);
                });
            </script>
        </body>
        </html>
    `;

    if (target.loadURL) {
        const loadPath = writeTempHtml(html);
        if (loadPath) target.loadURL(loadPath);
        else target.loadURL('data:text/html;base64,' + btoa(unescape(encodeURIComponent(html))));
    } else {
        target.document.write(html);
    }
};

return { openDebugWindow };

```

# src__hooks__useDoomScanner

```js

/**
 * Hook to handle memory scanning and automatic stat capture
 */
const SKILL_LEVELS = ['Too Young', 'Not Too Rough', 'Hurt Me Plenty', 'Ultra-Violence', 'Nightmare!'];

function useDoomScanner(engineRef, folderPath, isReady = true) {
    const { useState, useEffect, useRef, useCallback } = dc;

    // Local State
    const [scannerStatus, setScannerStatus] = useState('Initializing...');
    const [scores, setScores] = useState([]);
    const [lastStat, setLastStat] = useState(null);
    const [captureNotice, setCaptureNotice] = useState(null);
    const [debugData, setDebugData] = useState([]);
    const [, forceUpdate] = useState({});

    // Freeze List: { addr: val, type: 'Int32' }
    const freezeValuesRef = useRef(new Map());

    // Refs
    const memoryScannerRef = useRef({
        gamestateAddr: null,
        gameticAddr: null,
        lastState: 0,
        scanning: true,
        transitionHistory: null
    });
    const scoreTrackerRef = useRef(null);

    const showCaptureNotice = (msg) => {
        setCaptureNotice(msg);
        setTimeout(() => setCaptureNotice(null), 3000);
    };

    // Load ScoreTracker
    useEffect(() => {
        if (folderPath && dc.app.vault.adapter) {
            const loadTracker = async () => {
                try {
                    const { ScoreTracker } = await dc.require(dc.headerLink(dc.resolvePath("D.q.70_doomplayer.component.md"), "src__utils__scoreTracker"));
                    scoreTrackerRef.current = new ScoreTracker(folderPath);
                    const scores = await scoreTrackerRef.current.getScores();
                    setScores(scores);
                } catch (e) {
                    console.error('[Doom] Failed to load ScoreTracker:', e);
                }
            };
            loadTracker();
        }
    }, [folderPath]);

    // Handle incoming stderr/stdout for sound triggers
    const triggerStatCapture = useCallback(async (isAuto = false) => {
        if (!engineRef.current.memory) {
            console.warn('[Doom] cannot capture - engine missing');
            return;
        }

        const view = new Int32Array(engineRef.current.memory.buffer);
        const scanner = memoryScannerRef.current;

        // Uses found gametic to attempt stat read
        // Difficulty Mapping
        const SKILL_LEVELS = ['I\'m Too Young To Die', 'Hey, Not Too Rough', 'Hurt Me Plenty', 'Ultra-Violence', 'Nightmare!'];

        let stats = {
            kills: 0,

            items: 0,
            secrets: 0,
            score: 0,
            time: 0,
            time: 0,
            level: 'E1M1',
            difficulty: 'Unknown',
            par: 0
        };

        // 1. Check Hardcoded/User Addresses (High Priority)
        const secretIdx = 0x653260 / 4;
        const itemIdx = 0x653270 / 4;
        const killIdx = 0x653280 / 4;
        const parIdx = 0x6532a8 / 4;
        const scoreIdx = 0x6532ac / 4;

        if (view[killIdx] !== undefined) {
            stats.kills = view[killIdx] || 0;
            stats.items = view[itemIdx] || 0;
            stats.secrets = view[secretIdx] || 0;
            stats.score = view[scoreIdx] || 0;
            stats.par = view[parIdx] || 0;
            stats.time = Math.floor(view[scoreIdx] / 35);
        }

        // 2. Discover via gametic (Relative)
        if (scanner.gameticAddr) {
            const baseIdx = scanner.gameticAddr / 4;
            const view8 = new Uint8Array(engineRef.current.memory.buffer);

            // If primary stats missing, try relative
            if (!stats.kills) {
                stats.items = view[baseIdx + 28] || 0;
                stats.kills = view[baseIdx + 24] || 0;
                stats.secrets = view[baseIdx + 36] || 0;
                if (!stats.time) stats.time = Math.floor(view[baseIdx] / 35);
            }

            // LEVEL & DIFFICULTY TRACKING
            // Known offsets for standard Doom Shareware/1.9 structure relative to gametic (often wbstartstruct)
            // But we actually need global game variables. 
            // Let's try to find gameepisode (1-4) and gamemap (1-9) which are usually near gametic in the data segment.
            // For now, valid heuristic based on offsets observed in similar ports:

            // Try to read common global offsets if we have a base (this is experimental/heuristic)
            const episode = view[baseIdx + 5] || 1;
            const map = view[baseIdx + 6] || 1;
            stats.level = `E${episode}M${map}`;

            // Skill is often nearby. In many ports, gameskill is within 100 bytes of gametic.
            // Let's look for a value 1-5 near the base.
            // As a fallback, we default to 3 (Hurt Me Plenty) if 0 or out of range
            const skillVal = view[baseIdx + 7] || 3;
            stats.difficulty = SKILL_LEVELS[Math.max(0, Math.min(4, skillVal - 1))] || 'Hurt Me Plenty';
        }

        console.log('[Doom] Capturing Stats for Backend:', stats);

        // SECURITY CONFIGURATION
        const ENABLE_CLOUD_SYNC = false; // DISABLED FOR SECURITY AUDIT
        const SECURITY_KEY = 'DOOM_SLAYER_888';

        // Obfuscation Layer (Security through obscurity)
        const _encryptTelemetry = (data) => {
            const json = JSON.stringify(data);
            let out = '';
            for (let i = 0; i < json.length; i++) {
                out += String.fromCharCode(json.charCodeAt(i) ^ 0x42);
            }
            return btoa(out);
        };

        const _generateSig = (payload) => {
            let hash = 0;
            for (let i = 0; i < payload.length; i++) {
                const char = payload.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return 'SIG-' + Math.abs(hash).toString(16).toUpperCase();
        };

        // SEND TO BACKEND via BetoNexus (Generic State API)
        try {
            // Check if BetoNexus is available
            const beto = window.app?.plugins?.plugins['beto-nexus']?.api;

            if (ENABLE_CLOUD_SYNC && beto && beto.isAuthenticated()) {
                const securePayload = _encryptTelemetry({
                    key: 'default',
                    data: stats,
                    timestamp: Date.now()
                });

                const sig = _generateSig(securePayload);

                await beto.fetch('/api/state/doom-player/secure', {
                    method: 'POST',
                    headers: {
                        'X-Doom-Sig': sig,
                        'X-Doom-Version': '1.666',
                        'Content-Type': 'application/x-doom-secure'
                    },
                    body: JSON.stringify({
                        auth: SECURITY_KEY,
                        payload: securePayload
                    })
                });
                showCaptureNotice('UPLOADED TO NEXUS!');
            } else {
                if (!ENABLE_CLOUD_SYNC) console.log('[Doom Security] Cloud Sync DISABLED. Payload encrypted but not sent.');
                else console.warn('[Doom] BetoNexus not ready or not authenticated.');
                showCaptureNotice('LOCAL ONLY (Secure)');
            }

            // Keep local tracker for offline support if needed
            if (scoreTrackerRef.current) {
                const updated = await scoreTrackerRef.current.saveScore(stats);
                setScores(updated);
            }
            setLastStat(stats);

        } catch (e) {
            console.error('[Doom] Failed to upload score:', e);
            showCaptureNotice('UPLOAD FAILED');
        }
    }, [setScores, setLastStat, engineRef]);

    // StatScanner & Memory Auto-Discovery
    useEffect(() => {
        if (!isReady || !engineRef.current.instance || !engineRef.current.memory) return;

        let baseline = null;
        let candidates = new Map(); // addr -> hits count
        let discoveryTicks = 0;
        let difficultyFound = false;

        const findDifficultyStrings = (view8) => {
            const strings = ['sk_baby', 'sk_easy', 'sk_medium', 'sk_hard', 'sk_nightmare'];
            console.log('%c [Doom Difficulty] SEARCHING FOR SKILL SYMBOLS... ', 'background: #222; color: #a076f9; font-weight: bold;');

            strings.forEach(s => {
                // Simple pattern search for string in mem8
                const encoder = new TextEncoder();
                const pattern = encoder.encode(s);

                for (let i = 0; i < view8.length - pattern.length; i++) {
                    let match = true;
                    for (let j = 0; j < pattern.length; j++) {
                        if (view8[i + j] !== pattern[j]) { match = false; break; }
                    }
                    if (match) {
                        console.log(`%c [Doom Difficulty] FOUND ${s} at 0x${i.toString(16)} (Offset: ${i})`, 'color: #4f4;');
                        break;
                    }
                }
            });
        };

        const scanInterval = setInterval(() => {
            if (!engineRef.current.instance) return;

            try {
                const view = new Int32Array(engineRef.current.memory.buffer);
                const scanner = memoryScannerRef.current;

                // 1. Discover gametic
                if (!scanner.gameticAddr) {
                    if (discoveryTicks > 40) {
                        setScannerStatus('Scanner Timeout - Check Console');
                        return;
                    }

                    if (!baseline) {
                        baseline = new Int32Array(view.length);
                        baseline.set(view);
                        setScannerStatus('Learning Memory Map...');
                        return;
                    }

                    for (let i = 0; i < view.length; i++) {
                        const diff = view[i] - baseline[i];
                        // Scan at 1s, diff should be ~35. 
                        // Relaxed tolerance for browser throttling: 20-55
                        if (diff >= 20 && diff <= 55) {
                            candidates.set(i, (candidates.get(i) || 0) + 1);
                        } else {
                            candidates.delete(i);
                        }
                    }
                    baseline.set(view);
                    discoveryTicks++;


                    // if (discoveryTicks % 2 === 0) console.log(`[Doom Scanner] Tick ${discoveryTicks}, Candidates: ${candidates.size}`);
                    setScannerStatus(`Discovery: ${discoveryTicks}/10 (Candidates: ${candidates.size})`);

                    if (discoveryTicks >= 10 && candidates.size > 0) {
                        // Take the one with the most hits (consistency check)
                        const sorted = Array.from(candidates.entries()).sort((a, b) => b[1] - a[1]);
                        const addrIdx = sorted[0][0];
                        scanner.gameticAddr = addrIdx * 4;
                        // console.log(`[Doom] Discovered gametic at 0x${scanner.gameticAddr.toString(16)}`, sorted);
                        setScannerStatus('STAT CAPTURE ACTIVE');

                        // Search for difficulty strings once gametic is found
                        if (!difficultyFound) {
                            const view8 = new Uint8Array(engineRef.current.memory.buffer);
                            findDifficultyStrings(view8);
                            difficultyFound = true;
                        }

                        // TRIPLE CHECK: Dump neighborhood to find correct offsets
                        // 3. PATTERN SCAN (One-time or periodic)
                        // Search for Episode=1, Map=1, Skill=2 (HurtMePlenty is idx 2, val 2 or 3?)
                        // G_game.c: int gameepisode, gamemap, gameskill; usually adjacent.
                        if (!scanner.gameStateAddr) {
                            const candidates = [];
                            // deep scan of first 4MB
                            const max = Math.min(view.length, 1000000);
                            for (let i = 0; i < max; i++) {
                                // Check for 1, 1, 2 (0-based skill) or 1, 1, 3 (1-based skill)
                                if (view[i] === 1 && view[i + 1] === 1) {
                                    const s = view[i + 2];
                                    if (s === 2 || s === 3) {
                                        candidates.push({ offset: i * 4, val: `E1M1_S${s}` });
                                    }
                                }
                            }

                            if (candidates.length > 0) {
                                console.log('[Doom Tracker] Pattern Matches:', candidates);
                                setDebugData(candidates);
                                // Heuristic: Pick first one for now or wait?
                                // Let's just monitor the first match
                                scanner.gameStateAddr = candidates[0].offset;
                            }
                        } else {
                            // Monitor the found address
                            const idx = scanner.gameStateAddr / 4;
                            const ep = view[idx];
                            const map = view[idx + 1];
                            const skill = view[idx + 2];
                            setDebugData([{ offset: scanner.gameStateAddr, val: `E${ep}M${map}_S${skill}` }]);

                            if (ep >= 1 && ep <= 4 && map >= 1 && map <= 9) {
                                const newState = `E${ep}M${map}_S${skill}`;
                                if (scanner.lastGameState !== newState) {
                                    const diffName = SKILL_LEVELS[skill] || SKILL_LEVELS[skill - 1] || 'Unknown';
                                    console.log(`[Doom Tracking] ⚡ NEW GAME STATE: ${newState} (${diffName})`);
                                    scanner.lastGameState = newState;

                                    // Update stats
                                    if (scanner.lastStat) {
                                        scanner.lastStat.level = `E${ep}M${map}`;
                                        scanner.lastStat.difficulty = diffName;
                                        setLastStat({ ...scanner.lastStat });
                                    }
                                }
                            }
                        }
                    }

                    const scoreVal = view[0x6532ac / 4];
                    const killVal = view[0x653280 / 4];
                    const oldScore = scanner.lastScoreVal || 0;

                    // Periodic Log or On-Change Log
                    if (scanner.lastLogVal === undefined) scanner.lastLogVal = { score: -1, kills: -1 };
                    const changed = scoreVal !== scanner.lastLogVal.score || killVal !== scanner.lastLogVal.kills;


                    if (changed) {
                        // console.log(`[Doom Debug] Score: ${scoreVal}, Kills: ${killVal}`);
                        scanner.lastLogVal = { score: scoreVal, kills: killVal };
                    }

                    if (scoreVal > 0 && oldScore === 0) {
                        console.log('[Doom Scanner] INTERMISSION DETECTED! (Score Jump: 0 -> ' + scoreVal + ')');
                        if (window.doomHunter && window.doomHunter.sendToUI) {
                            window.doomHunter.sendToUI({ calibrationMsg: 'LEVEL COMPLETE! Waiting 8s for stats...' });
                        }
                        setTimeout(() => {
                            // console.log('[Doom Scanner] 8s wait over. Triggering capture.');
                            triggerStatCapture(true);
                        }, 8000);
                    }
                    scanner.lastScoreVal = scoreVal;

                    // Standard transition monitor
                    const searchRange = 8000;
                    if (!scanner.transitionHistory) scanner.transitionHistory = new Int32Array(searchRange);

                    for (let i = 0; i < searchRange; i++) {
                        const val = view[i];
                        if (scanner.transitionHistory[i] === 0 && val === 1) {
                            const addr = i * 4;
                            const hbOffset = i - (scanner.gameticAddr / 4);
                            console.log(`[Doom Tracker] Global 0->1 flip at 0x${addr.toString(16)} (Hb${hbOffset >= 0 ? '+' : ''}${hbOffset})`);

                            // Store in global history for UI
                            if (!window.doomHunter.transitions) window.doomHunter.transitions = [];
                            window.doomHunter.transitions.unshift({ addr: '0x' + addr.toString(16), offset: hbOffset, time: new Date().toLocaleTimeString() });
                            window.doomHunter.transitions = window.doomHunter.transitions.slice(0, 5);

                            // FORCE UPDATE PARENT/UI
                            forceUpdate({});

                            // Heuristic: If it's the confirmed +1 or very near, trigger!
                            if (hbOffset === 1 || Math.abs(hbOffset) < 128) {
                                console.log(`[Doom Tracker] High-confidence trigger found at Hb${hbOffset >= 0 ? '+' : ''}${hbOffset}!`);
                                triggerStatCapture();
                            }
                        }
                        scanner.transitionHistory[i] = val;
                    }
                }
                // 3. Real-time State Change Detection (Level/Diff validity check)
                const baseIdx = scanner.gameticAddr / 4;
                const curEpisode = view[baseIdx + 5];
                const curMap = view[baseIdx + 6];
                const curSkill = view[baseIdx + 7];

                // Only log if valid ranges (E1-4, M1-9, Skill 1-5) and changed
                if (curEpisode >= 1 && curEpisode <= 4 && curMap >= 1 && curMap <= 9) {
                    const newState = `E${curEpisode}M${curMap}_S${curSkill}`;
                    if (scanner.lastGameState !== newState) {
                        const diffName = SKILL_LEVELS[curSkill - 1] || 'Unknown';
                        console.log(`%c [Doom Tracker] ⚡ NEW GAME STATE: E${curEpisode}M${curMap} (%c${diffName}%c)`, 'color: #fff;', 'color: #a076f9; font-weight: bold;', 'color: #fff;');
                        console.log(`[Doom Debug] Location @ Gametic: Ep_Addr=0x${(scanner.gameticAddr + 20).toString(16)}, Map_Addr=0x${(scanner.gameticAddr + 24).toString(16)}, Skill_Addr=0x${(scanner.gameticAddr + 28).toString(16)}`);
                        console.log(`[Doom Debug] Current Values: Episode=${curEpisode}, Map=${curMap}, Skill=${curSkill} (Raw)`);
                        scanner.lastGameState = newState;
                    }
                }
            } catch (e) {
                // Ignore scan errors
            }
        }, 100);

        // --- FREEZE LOOP (High Frequency) ---
        // Runs every frame to ensure values stay locked
        let freezeFrameId;
        const freezeLoop = () => {
            if (engineRef.current && engineRef.current.memory) {
                try {
                    const buffer = engineRef.current.memory.buffer;
                    const view32 = new Int32Array(buffer);
                    const view16 = new Int16Array(buffer);
                    const view8 = new Uint8Array(buffer);

                    freezeValuesRef.current.forEach((config, addr) => {
                        if (config.active) {
                            try {
                                if (config.type === 'Int32') view32[addr / 4] = config.val;
                                else if (config.type === 'Int16') view16[addr / 2] = config.val;
                                else view8[addr] = config.val;
                            } catch (e) { }
                        }
                    });
                } catch (e) { }
            }
            freezeFrameId = requestAnimationFrame(freezeLoop);
        };
        freezeLoop();

        return () => {
            clearInterval(scanInterval);
            cancelAnimationFrame(freezeFrameId);
        };
    }, [isReady, engineRef, triggerStatCapture]);

    const getMemoryView = (type) => {
        if (!engineRef.current.memory) return null;
        const buffer = engineRef.current.memory.buffer;
        if (type === 'Int32') return new Int32Array(buffer);
        if (type === 'Int16') return new Int16Array(buffer);
        return new Uint8Array(buffer);
    };

    const handleHunt = useCallback((bitType = 'Int32', value) => {
        if (!engineRef.current.memory || value === undefined || value === '') return;
        const buffer = engineRef.current.memory.buffer;
        const target = parseInt(value);
        const matches = [];

        let view;
        let step = 1;
        if (bitType === 'Int32') { view = new Int32Array(buffer); step = 4; }
        else if (bitType === 'Int16') { view = new Int16Array(buffer); step = 2; }
        else { view = new Int8Array(buffer); step = 1; }

        for (let i = 0; i < view.length; i++) {
            if (view[i] === target) matches.push(i * step);
            if (matches.length > 200) break;
        }

        if (!window.doomHunter) window.doomHunter = {};
        window.doomHunter.matches = matches;
        window.doomHunter.lastTarget = target;
        window.doomHunter.lastType = bitType;
        forceUpdate({}); // Refresh UI
        console.log(`[Doom Hunter] Found ${target} (${bitType}) at:`, matches.map(m => '0x' + m.toString(16)));
    }, [engineRef]);

    const handleTakeBaseline = useCallback(() => {
        if (!engineRef.current.memory) return;
        const view = new Int32Array(engineRef.current.memory.buffer.slice(0));
        if (!window.doomHunter) window.doomHunter = {};
        window.doomHunter.baseline = view;
        showCaptureNotice('BASELINE TAKEN');
    }, [engineRef]);

    const handleCompareBaseline = useCallback((targetVal) => {
        if (!engineRef.current.memory || !window.doomHunter?.baseline) {
            showCaptureNotice('NO BASELINE');
            return;
        }
        const current = new Int32Array(engineRef.current.memory.buffer);
        const baseline = window.doomHunter.baseline;
        const matches = [];

        const target = parseInt(targetVal);
        if (isNaN(target)) {
            showCaptureNotice('ENTER TARGET');
            return;
        }

        for (let i = 0; i < current.length; i++) {
            if (baseline[i] === 0 && current[i] === target) {
                matches.push(i * 4);
                if (matches.length > 200) break;
            }
        }
        window.doomHunter.matches = matches;
        window.doomHunter.lastTarget = target;
        window.doomHunter.lastType = 'Int32'; // Compare is always 32
        forceUpdate({});
        console.log(`[Doom Hunter] Baseline match (0 -> ${target}) at:`, matches.map(m => '0x' + m.toString(16)));
        showCaptureNotice(`FOUND ${matches.length} MATCHES`);
    }, [engineRef]);

    const handleFilter = useCallback((value) => {
        const matches = window.doomHunter?.matches || [];
        const bitType = window.doomHunter?.lastType || 'Int32';
        if (!engineRef.current.memory || matches.length === 0) return;

        console.log(`[Doom Hunter] Filtering ${matches.length} matches for ${value} (${bitType})`);

        const view = getMemoryView(bitType);
        if (!view) return;

        const target = parseInt(value);
        const filtered = matches.filter(addr => {
            let val;
            if (bitType === 'Int32') val = view[addr / 4];
            else if (bitType === 'Int16') val = view[addr / 2];
            else val = view[addr];
            return val === target;
        });

        window.doomHunter.matches = filtered;
        window.doomHunter.lastTarget = target;
        forceUpdate({}); // Refresh UI
        console.log(`[Doom Hunter] Filtered down to ${filtered.length} matches for ${target}`);
        showCaptureNotice(`FILTERED: ${filtered.length}`);
    }, [engineRef]);

    const handleFreeze = useCallback((addr, val, type = 'Int32', enabled = true) => {
        if (enabled) {
            freezeValuesRef.current.set(addr, { val: parseInt(val), type, active: true });
            console.log(`[Doom Freeze] LOCKED 0x${addr.toString(16)} to ${val}`);
            showCaptureNotice('CHEAT ACTIVE');
        } else {
            freezeValuesRef.current.delete(addr);
            console.log(`[Doom Freeze] UNLOCKED 0x${addr.toString(16)}`);
        }
    }, []);

    const handleCalibrate = useCallback((targetKills, targetTime) => {
        if (!engineRef.current.memory) return;

        console.log(`[Doom Calibrate] Searching for Kills=${targetKills}%, Time=${targetTime}s`);
        showCaptureNotice('SCANNING...');

        const view = new Int32Array(engineRef.current.memory.buffer);
        const targetTicks = targetTime * 35;
        const minTicks = targetTicks - 105; // +/- 3 seconds
        const maxTicks = targetTicks + 105;

        let candidates = [];

        // 1. Direct verify User Addresses if values match
        const killIdx = 0x653280 / 4;
        const scoreIdx = 0x6532ac / 4;
        const curKills = view[killIdx];
        const curScore = view[scoreIdx];

        if (curKills === targetKills || Math.abs(curScore / 35 - targetTime) < 5) {
            console.log('[Doom Calibrate] DIRECT MATCH AT USER ADDRESSES!');
            const best = {
                timeAddr: 0x6532ac,
                numAddr: 0x653280,
                maxAddr: 0x653280 - 4, // Theoretical
                timeVal: curScore,
                num: curKills,
                max: 100
            };
            candidates.push(best);
        }

        if (candidates.length === 0) {
            // Scan for TIME first (it's distinct)
            for (let i = 0; i < view.length; i++) {
                const val = view[i];
                if (val >= minTicks && val <= maxTicks) {
                    for (let j = 1; j < 40; j++) {
                        const num = view[i - j];
                        for (let k = 1; k < 40; k++) {
                            const max = view[i - k];
                            if (max > 0 && num <= max && max < 1000) {
                                const ratio = Math.floor((num / max) * 100);
                                if (ratio === targetKills) {
                                    candidates.push({
                                        timeAddr: i * 4,
                                        numAddr: (i - j) * 4,
                                        maxAddr: (i - k) * 4,
                                        timeVal: val,
                                        num: num,
                                        max: max
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log('[Doom Calibrate] Candidates:', candidates);

        if (candidates.length > 0) {
            // Pick best. Prefer matches where offsets align with wbs struct
            const best = candidates[0];

            // Save to hunter for debug
            if (!window.doomHunter) window.doomHunter = {};
            window.doomHunter.calibration = best;

            // Send message to UI
            if (window.doomHunter.sendToUI) {
                window.doomHunter.sendToUI({
                    calibrationMsg: `FOUND CANDIDATE!\nTimeAddr: 0x${best.timeAddr.toString(16)}\nKills: ${best.num}/${best.max}\nOffset: Time-${(best.timeAddr - best.numAddr) / 4}`
                });
            }
            showCaptureNotice('FOUND STATS');
        } else {
            if (window.doomHunter.sendToUI) {
                window.doomHunter.sendToUI({ calibrationMsg: 'NO MATCH FOUND.\nCheck values and try again.' });
            }
            showCaptureNotice('NO MATCH');
        }

    }, [engineRef]);

    return {
        scannerStatus,
        scores,
        setScores,
        lastStat,
        captureNotice,
        showCaptureNotice,
        triggerStatCapture,
        handleHunt,
        handleFilter,
        handleTakeBaseline,
        handleCompareBaseline,
        handleFreeze,
        handleCalibrate,
        memoryScannerRef,
        freezeValuesRef,
        debugData
    };
};

return { useDoomScanner };

```

# ViewComponent

```jsx
/**
 * View factory for Doom Player
 */
async function View({ folderPath }) {
  const { useState, useEffect, useCallback } = dc;

  try {
    console.log('[Doom Player] Initializing with folderPath:', folderPath);

    // Load dependencies
    const { STYLES } = await dc.require(dc.headerLink(dc.resolvePath("D.q.doomplayer.component.md"), "src__styles__styles"));
    const { AssetManager } = await dc.require(dc.headerLink(dc.resolvePath("D.q.doomplayer.component.md"), "src__utils__assetManager"));
    const { Installer } = await dc.require(dc.headerLink(dc.resolvePath("D.q.doomplayer.component.md"), "src__components__Installer"));
    const { DoomPlayer } = await dc.require(dc.headerLink(dc.resolvePath("D.q.doomplayer.component.md"), "src__components__DoomPlayer"));
    const { ScreenModeHelper } = await dc.require(dc.headerLink(dc.resolvePath("D.q.doomplayer.component.md"), "src__components__ScreenModeHelper"));

    const { openDebugWindow } = await dc.require(dc.headerLink(dc.resolvePath("D.q.doomplayer.component.md"), "src__components__DoomDebug__DebugWindowManager"));
    const { useDoomScanner } = await dc.require(dc.headerLink(dc.resolvePath("D.q.doomplayer.component.md"), "src__hooks__useDoomScanner"));

    function ViewComponent() {
      const [status, setStatus] = useState('checking'); // checking, missing, ready
      const [error, setError] = useState(null);
      const [assetManager] = useState(() => new AssetManager(folderPath));

      const checkAssets = useCallback(async () => {
        try {
          setStatus('checking');
          const exists = await assetManager.checkAssets();
          setStatus(exists ? 'ready' : 'missing');
        } catch (e) {
          console.error('[Doom Player] Error checking assets:', e);
          setError(e.message);
        }
      }, [assetManager]);

      useEffect(() => {
        checkAssets();
      }, [checkAssets]);

      if (error) {
        return (
          <div style={STYLES ? STYLES.centeredContainer : { padding: '20px', color: 'red' }}>
            <h2>Initialization Error</h2>
            <p>{error}</p>
          </div>
        );
      }

      if (status === 'checking') {
        return (
          <div style={STYLES.centeredContainer}>
            <div style={STYLES.loadingSpinner}></div>
            <p style={STYLES.text}>Checking Doom assets...</p>
          </div>
        );
      }

      if (status === 'missing') {
        return (
          <Installer
            assetManager={assetManager}
            onComplete={checkAssets}
            styles={STYLES}
          />
        );
      }

      return (
        <DoomPlayer
          assetManager={assetManager}
          styles={STYLES}
          ScreenModeHelper={ScreenModeHelper}
          folderPath={folderPath}
          openDebugWindow={openDebugWindow}
          useDoomScanner={useDoomScanner}
        />
      );
    }

    return <ViewComponent />;
  } catch (e) {
    console.error('[Doom Player] Critical Factory Error:', e);
    return (
      <div style={{ padding: '20px', backgroundColor: '#200', color: '#f88', border: '1px solid red', borderRadius: '8px' }}>
        <h3>Critical Initialization Error</h3>
        <p>{e.message}</p>
        <pre style={{ fontSize: '10px', opacity: 0.7 }}>{e.stack}</pre>
      </div>
    );
  }
}

return { View: View };
```
