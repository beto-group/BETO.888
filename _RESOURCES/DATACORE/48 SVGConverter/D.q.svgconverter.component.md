

# ViewComponent

```jsx
// =================================================================================
//  SETUP: Destructure React/Datacore dependencies
// =================================================================================
const { useState, useCallback, useRef, useEffect, useReducer } = dc;

// =================================================================================
//  CONFIGURATION
// =================================================================================
const EXPORT_SCALE = 2; // 2x resolution.
const FONT_PATH = "_RESOURCES/FONTS/futura/Futura-CondensedLight.otf";
const EXPORT_PADDING = 15; // Consistent padding around all content.
const FOLDER_PATH = "_RESOURCES/ASSETS/888/ASSETS_.A/";
const MAX_CONCURRENCY = 64;

// --- CDN URLs ---
const EXCALIDRAW_UMD_URL = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/excalidraw.production.min.js";
const EXCALIDRAW_ASSET_PATH = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/prod/";
const LZ_STRING_CDN_URL = "https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js";

// =================================================================================
//  THEME & STYLING (Unchanged)
// =================================================================================
const THEME = {
    fontFamily: "ui-monospace, 'JetBrains Mono', 'Fira Code', SFMono-Regular, Menlo, monospace",
    colors: {
        background: 'rgba(11, 7, 19, 0.85)', backgroundConsole: 'rgba(10, 6, 16, 0.9)', textNormal: 'oklch(0.9 0.05 300)',
        textMuted: 'oklch(0.65 0.08 300)', textAccent: 'oklch(0.8 0.2 300)', border: 'oklch(0.8 0.2 300 / 28%)',
        accent: 'oklch(0.8 0.2 300)', accentBg: 'oklch(0.8 0.2 300 / 16%)', accentText: '#0b0713',
        error: '#ff5555', success: '#50fa7b', warning: '#f1fa8c',
    },
    shadows: { main: '0 12px 50px rgba(0,0,0,.45)', accent: '0 0 15px oklch(0.8 0.2 300 / 50%)' },
    borderRadius: '8px',
};

// =================================================================================
//  ROBUST DEPENDENCY LOADER (FIX)
// =================================================================================
const DependencyManager = (() => {
    let promise = null;
    let dependencies = null;

    function loadLegacyScript(url, globalName) {
        return new Promise((resolve, reject) => {
            if (window[globalName]) return resolve(window[globalName]);
            const script = document.createElement('script');
            script.src = url; script.async = true;
            script.onload = () => window[globalName] ? resolve(window[globalName]) : reject(new Error(`'${globalName}' not found on window after loading.`));
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    async function load() {
        // Set the asset path BEFORE loading the script. This is critical for Excalidraw.
        window.EXCALIDRAW_ASSET_PATH = EXCALIDRAW_ASSET_PATH;

        const excalidrawPromise = loadLegacyScript(EXCALIDRAW_UMD_URL, "ExcalidrawLib");
        const lzStringPromise = loadLegacyScript(LZ_STRING_CDN_URL, "LZString");
        const fontDataPromise = app.vault.adapter.readBinary(FONT_PATH);

        const [ExcalidrawModule, LZString, fontData] = await Promise.all([excalidrawPromise, lzStringPromise, fontDataPromise]);

        return { ExcalidrawModule, LZString, fontData };
    }

    return {
        get: () => {
            if (dependencies) return Promise.resolve(dependencies);
            if (!promise) {
                promise = load().then(deps => {
                    dependencies = deps;
                    return dependencies;
                });
            }
            return promise;
        }
    };
})();

// =================================================================================
//  CORE PROCESSING LOGIC (Unchanged)
// =================================================================================
async function processFileWithLibrary(filePath, ExcalidrawModule, LZString, fontData, log) {
    try {
        const mdContent = await app.vault.adapter.read(filePath);
        const compressedRegex = /```compressed-json\n([\sS]*?)\n```/;
        let match = mdContent.match(compressedRegex);
        let jsonString;
        if (match && match[1]) {
            jsonString = LZString.decompressFromBase64(match[1].replace(/\s/g, ''));
            if (!jsonString) throw new Error("Decompression failure.");
        } else {
            const fallbackRegex = /```(?:json|excalidraw)\n([\sS]*?)\n```/;
            match = mdContent.match(fallbackRegex);
            if (match && match[1]) jsonString = match[1];
        }

        if (!jsonString) {
            return { success: true, skipped: true, filePath };
        }

        const sceneData = JSON.parse(jsonString);
        if (!sceneData.elements || sceneData.elements.length === 0) {
            log(`🟡 Skipping empty drawing: ${filePath.split('/').pop()}`, 'warning');
            return { success: true, skipped: true, filePath };
        }

        const svg = await ExcalidrawModule.exportToSvg({
            elements: sceneData.elements,
            appState: { ...sceneData.appState, exportBackground: false, viewBackgroundColor: 'transparent', exportScale: EXPORT_SCALE, exportEmbedScene: true },
            files: sceneData.files || {},
            exportPadding: EXPORT_PADDING,
            getFontData: async () => fontData,
        });

        const svgPath = filePath.replace(/\.md$/i, '.svg');
        const svgString = new XMLSerializer().serializeToString(svg);
        if (!svgString || svgString.length < 200) throw new Error("Generated SVG signal was weak or invalid.");
        await app.vault.adapter.write(svgPath, svgString);
        return { success: true, filePath };
    } catch (error) {
        log(`❌ Sync failure: ${filePath.split('/').pop()} - ${error.message}`, 'error');
        return { success: false, error: error.message, filePath };
    }
}


// =================================================================================
//  COMPONENT: Welcome Page & EnigmaticGlyphs (Unchanged)
// =================================================================================
function WelcomeView({ onProceed }) {
    const containerStyle = { height: "100%", width: "100%", padding: "40px", border: `1px solid ${THEME.colors.border}`, borderRadius: THEME.borderRadius, background: THEME.colors.background, backdropFilter: 'blur(4px)', color: THEME.colors.textNormal, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', userSelect: 'none', boxShadow: THEME.shadows.main, fontFamily: THEME.fontFamily };
    const h1Style = { marginBottom: '15px', fontWeight: 700, fontSize: '2.5em', color: THEME.colors.accent, textShadow: THEME.shadows.accent, fontVariant: 'small-caps', letterSpacing: '1.5px' };
    const pStyle = { color: THEME.colors.textMuted, margin: 0, lineHeight: 1.6, maxWidth: '450px', fontSize: '16px' };
    const buttonStyle = { padding: '12px 30px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: 'transparent', color: THEME.colors.accent, border: `1px solid ${THEME.colors.border}`, borderRadius: '6px', marginTop: '40px', transition: 'all 0.2s ease' };
    return ( <div style={containerStyle}> <h1 style={h1Style}>Matrix Attunement</h1> <p style={pStyle}>A one-time synchronization is required to calibrate the asset reality-matrix.</p> <button onClick={onProceed} style={buttonStyle} onMouseOver={e => { e.currentTarget.style.background = THEME.colors.accent; e.currentTarget.style.color = THEME.colors.accentText; e.currentTarget.style.boxShadow = THEME.shadows.accent; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = THEME.colors.accent; e.currentTarget.style.boxShadow = 'none'; }}> Begin Attunement </button> </div> );
}
function EnigmaticGlyphs({ progress, count = 7 }) {
    const activeCount = Math.floor((progress / 100) * count);
    const accentColor = THEME.colors.accent;
    const glyphs = Array.from({ length: count }).map((_, index) => {
        const isActive = index < activeCount;
        const isPulsing = index === activeCount && progress < 100;
        const style = { display: 'inline-block', margin: '0 10px', fontSize: '28px', color: isActive ? accentColor : THEME.colors.textMuted, textShadow: isActive ? `0 0 12px ${accentColor}` : 'none', transition: 'color 0.5s ease, text-shadow 0.5s ease', animation: isPulsing ? 'pulse 1.5s infinite ease-in-out' : 'none' };
        return <span key={index} style={style}>✧</span>;
    });
    const keyframes = ` @keyframes pulse { 0% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.6; transform: scale(1); } } `;
    return ( <div> <style>{keyframes}</style> <div style={{ margin: '40px 0' }}>{glyphs}</div> </div> );
}


// =================================================================================
//  COMPONENT: AutomationLoader (Refactored to use DependencyManager)
// =================================================================================
const MAX_LOG_ENTRIES = 1000;
const ENIGMATIC_STATUSES = [ "Analyzing data echoes...", "Calibrating synaptic links...", "Detecting anomalous signatures...", "Purging phantom fragments...", "Harmonizing quantum states...", "Compiling reality shards...", ];
function logReducer(state, action) {
    switch (action.type) { case 'ADD_LOG': return [{ t: Date.now(), ...action.payload }, ...state.slice(0, MAX_LOG_ENTRIES - 1)]; case 'CLEAR_LOGS': return []; default: return state; }
}

function AutomationLoader({ onAutomationComplete }) {
    const [status, setStatus] = useState("Initiating sequence...");
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [logs, dispatchLog] = useReducer(logReducer, []);
    const [showDebugConsole, setShowDebugConsole] = useState(false);
    const cancelRunRef = useRef({ cancel: false });
    const isRunningRef = useRef(false);

    const log = useCallback((message, kind = 'info') => { dispatchLog({ type: 'ADD_LOG', payload: { kind, message } }); }, []);

    useEffect(() => {
        let statusInterval;
        if (isRunningRef.current && !isComplete) {
            let index = 0;
            statusInterval = setInterval(() => { index = (index + 1) % ENIGMATIC_STATUSES.length; setStatus(ENIGMATIC_STATUSES[index]); }, 2200);
        }
        return () => clearInterval(statusInterval);
    }, [isComplete]);

    useEffect(() => {
        const runAutomationFlow = async () => {
            isRunningRef.current = true;
            dispatchLog({ type: 'CLEAR_LOGS' });
            log(`Attunement sequence initiated... Concurrency: ${MAX_CONCURRENCY}.`);

            try {
                // --- REFACTORED ---
                // Now we just ask the manager for the dependencies. It handles all the complex loading logic.
                log('Loading core modules...');
                setProgress(10);
                const { ExcalidrawModule, LZString, fontData } = await DependencyManager.get();
                log('Modules loaded successfully.', 'success');
                setProgress(25);
                // --- END REFACTOR ---

                log('Priming font engine...', 'info');
                await ExcalidrawModule.exportToSvg({
                    elements: [{ type: "text", text: ".", fontFamily: 4, x: 0, y: 0, width: 1, height: 1 }],
                    appState: { exportBackground: false }, getFontData: async () => fontData,
                });
                log('Font engine stable.', 'success');
                setProgress(35);

                const allFiles = (await app.vault.adapter.list(FOLDER_PATH)).files;
                const taskQueue = allFiles.filter(f => f.toLowerCase().endsWith('.md') && !allFiles.includes(f.replace(/\.md$/i, '.svg')));
                const totalTasks = taskQueue.length;

                if (totalTasks === 0) {
                    log('Matrix is already stable.', 'success');
                    setStatus('Matrix Stable'); setProgress(100); setIsComplete(true); return;
                }
                log(`Found ${totalTasks} fragments requiring attunement.`);

                let processedTasks = 0;
                const worker = async () => {
                    while (!cancelRunRef.current.cancel) {
                        const taskPath = taskQueue.shift();
                        if (!taskPath) return;
                        await processFileWithLibrary(taskPath, ExcalidrawModule, LZString, fontData, log);
                        processedTasks++;
                        setProgress(35 + Math.floor((processedTasks / totalTasks) * 65));
                    }
                };
                await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, totalTasks) }, worker));
                if (cancelRunRef.current.cancel) throw new Error("Sequence terminated by user.");

                setStatus('Matrix Aligned');
                log(`Attunement complete. System stability restored.`, 'success');

            } catch (error) {
                setStatus(`Synchronization Cascade Failure`);
                log(`FATAL ERROR: ${error.message}`, 'error');
            } finally {
                setIsComplete(true);
                isRunningRef.current = false;
            }
        };

        runAutomationFlow();
        return () => { cancelRunRef.current.cancel = true; };
    }, [log]);

    const isError = status.includes('Failure');
    const colorMap = { error: THEME.colors.error, success: THEME.colors.success, warning: THEME.colors.warning, info: THEME.colors.textNormal };
    const containerStyle = { height:"100%", width:"100%", padding:"20px", border:`1px solid ${THEME.colors.border}`, borderRadius:THEME.borderRadius, background:THEME.colors.background, backdropFilter: 'blur(4px)', color:THEME.colors.textNormal, display:'flex', flexDirection:'column', alignItems:'center', justifyContent: 'center', userSelect: 'none', boxShadow: THEME.shadows.main, fontFamily: THEME.fontFamily };
    const h1Style = { marginBottom: '10px', fontWeight: 700, fontSize: '2em', fontVariant: 'small-caps' };
    const statusStyle = { color: THEME.colors.textMuted, fontSize: '1.1em', minHeight: '24px', fontStyle: 'italic' };
    const primaryBtnStyle = { padding: '10px 25px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: THEME.colors.accent, color: THEME.colors.accentText, border: 'none', borderRadius: '6px', marginTop: '15px' };

    return (
        <div style={containerStyle}>
            <h1 style={h1Style}>{isComplete ? 'Attunement Complete' : 'Engaging Matrix...'}</h1>
            <p style={statusStyle}>{status}</p>
            <EnigmaticGlyphs progress={progress} />
            {isComplete && !isError && (<button onClick={onAutomationComplete} style={primaryBtnStyle}>Interface</button>)}
            {isComplete && isError && (<p style={{ color: THEME.colors.error, marginTop: '15px' }}>A critical error occurred. Consult the log stream.</p>)}
            <div style={{ position: 'absolute', bottom: '20px', width: '90%', textAlign: 'left' }}>
                <button onClick={() => setShowDebugConsole(!showDebugConsole)} style={{ background: 'none', border: 'none', color: THEME.colors.accent, cursor: 'pointer', fontSize: '13px', padding: '5px 0' }}>
                    {showDebugConsole ? 'Collapse Log Stream' : 'Access Log Stream'}
                </button>
                {showDebugConsole && (
                    <div style={{ height:'200px', background: THEME.colors.backgroundConsole, border:`1px solid ${THEME.colors.border}`, borderRadius:'6px', padding:'10px', overflowY:'auto', fontSize:'12px', marginTop: '10px' }}>
                        {logs.map((l, i) => (<div key={`${l.t}-${i}`} style={{ color: colorMap[l.kind] || colorMap.info, borderBottom: `1px solid ${THEME.colors.border}`, padding: '2px 0' }}> <span style={{ color: THEME.colors.textMuted, marginRight: '8px' }}>{new Date(l.t).toLocaleTimeString()}</span> <span>{l.message}</span> </div>))}
                    </div>
                )}
            </div>
        </div>
    );
}


// =================================================================================
//  MAIN CONTAINER (Unchanged)
// =================================================================================
function MainContainer({ onAutomationComplete }) {
    const [currentView, setCurrentView] = useState('welcome');
    const handleLocalAutomationComplete = () => {
        setCurrentView('done');
        setTimeout(() => { if (onAutomationComplete) onAutomationComplete(); }, 1200);
    };
    const doneContainerStyle = { height:"100%", width:"100%", padding:"30px", border:`1px solid ${THEME.colors.border}`, borderRadius:THEME.borderRadius, background:THEME.colors.background, backdropFilter: 'blur(4px)', color:THEME.colors.textNormal, display:'flex', flexDirection:'column', alignItems:'center', justifyContent: 'center', userSelect: 'none', boxShadow: THEME.shadows.main, fontFamily: THEME.fontFamily };
    const doneH1Style = { color: THEME.colors.accent, textShadow: THEME.shadows.accent, fontWeight: 700, fontSize: '2.5em', fontVariant: 'small-caps', letterSpacing: '1.5px' };
    const donePStyle = { color: THEME.colors.textMuted, marginTop: '15px', fontSize: '1.1em' };

    switch (currentView) {
        case 'welcome': return <WelcomeView onProceed={() => setCurrentView('loading')} />;
        case 'loading': return <AutomationLoader onAutomationComplete={handleLocalAutomationComplete} />;
        case 'done':
            return ( <div style={doneContainerStyle}> <h1 style={doneH1Style}>Matrix Stable</h1> <p style={donePStyle}>Asset reality is synchronized. Access granted.</p> </div> );
        default: return null;
    }
}

return { MainView: MainContainer };
```


