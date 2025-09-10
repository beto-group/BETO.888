




# ViewComponent

```jsx
// =================================================================================
//  SETUP: Destructure React/Datacore dependencies
// =================================================================================
const { useState, useCallback, useRef, useEffect } = dc;

// =================================================================================
//  CONFIGURATION
// =================================================================================
const EXPORT_SCALE = 2; // 2x resolution.
const FONT_PATH = "_RESOURCES/FONTS/futura/Futura-CondensedLight.otf";
const EXPORT_PADDING = 15; // Consistent padding around all content.

// =================================================================================
//  CORE PROCESSING LOGIC
// =================================================================================

/**
 * Processes a single Excalidraw .md file to generate an .svg.
 * Handles both compressed and uncompressed JSON data.
 */
async function processFileWithLibrary(filePath, ExcalidrawModule, LZString, fontData, log) {
    try {
        const mdContent = await app.vault.adapter.read(filePath);
        
        // Regex to find the compressed-json block used by newer versions
        const compressedRegex = /```compressed-json\n([\s\S]*?)\n```/;
        let match = mdContent.match(compressedRegex);
        let jsonString;

        if (match && match[1]) {
            // Decompress the base64 string
            const compressedData = match[1].replace(/\s/g, '');
            jsonString = LZString.decompressFromBase64(compressedData);
            if (!jsonString) throw new Error("Failed to decompress data (corrupted).");
        } else {
            // Fallback for older plaintext json or excalidraw blocks
            const fallbackRegex = /```(?:json|excalidraw)\n([\s\S]*?)\n```/;
            match = mdContent.match(fallbackRegex);
            if (match && match[1]) {
                log(`Using fallback parser for ${filePath.split('/').pop()}`, 'debug');
                jsonString = match[1];
            }
        }

        if (!jsonString) {
            // If no data block is found but it looks like an excalidraw file, skip it
            if (mdContent.includes("excalidraw-plugin: parsed")) {
                log(`🟡 Skipping (empty drawing): ${filePath.split('/').pop()}`, 'warning');
                return { success: true, skipped: true };
            } else {
                throw new Error(`Not an Excalidraw file or no data block found.`);
            }
        }

        const sceneData = JSON.parse(jsonString);
        // Pass the parsed data and font to the export function
        return await exportScene(sceneData, filePath, ExcalidrawModule, fontData, log);

    } catch (error) {
        log(`❌ FAIL: ${filePath.split('/').pop()} - ${error.message}`, 'error');
        console.error(`Excalidraw Error on file ${filePath}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Uses the Excalidraw library to convert scene data into an SVG and save it.
 */
async function exportScene(sceneData, filePath, ExcalidrawModule, fontData, log) {
    if (!sceneData.elements || !sceneData.appState) {
         throw new Error("Invalid or empty Excalidraw JSON structure.");
    }

    // Call the Excalidraw export function with all necessary parameters
    const svg = await ExcalidrawModule.exportToSvg({
        elements: sceneData.elements,
        appState: { 
            ...sceneData.appState, 
            // Override settings for consistent exports
            exportBackground: false, 
            viewBackgroundColor: 'transparent', 
            exportScale: EXPORT_SCALE, 
            exportEmbedScene: true 
        },
        files: sceneData.files || {},
        exportPadding: EXPORT_PADDING,
        // Callback required by the library to provide font data for rendering
        getFontData: async () => fontData, 
    });

    const svgPath = filePath.replace(/\.md$/i, '.svg');
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    if (!svgString || svgString.length < 200) { // Basic sanity check
        throw new Error("Generated SVG was empty or invalid.");
    }
    
    // Write the final SVG string to the vault
    await app.vault.adapter.write(svgPath, svgString);
    log(`✔ Success: ${filePath.split('/').pop()}`, 'debug');
    return { success: true, filePath };
}

function loadLegacyScript(url, globalName) {
    return new Promise((resolve, reject) => {
        if (window[globalName]) { return resolve(); }
        const script = document.createElement('script');
        script.src = url; script.async = true;
        script.onload = () => { if (window[globalName]) { resolve(); } else { reject(new Error(`Script loaded but global '${globalName}' not found.`)); } };
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// =================================================================================
//  MAIN COMPONENT: BasicView
// =================================================================================
const MAX_LOG_ENTRIES = 1000;
const FOLDER_PATH = "_RESOURCES/ASSETS/888/ASSETS_nosvg_.A/";
const EXCALIDRAW_CDN_URL = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/+esm";
const EXCALIDRAW_ASSET_PATH = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/prod/";
const LZ_STRING_CDN_URL = "https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js";

function BasicView() {
    const [isRunning, setIsRunning] = useState(false);
    const cancelRunRef = useRef({ cancel: false });
    const [maxConcurrency, setMaxConcurrency] = useState(8);
    const [currentConcurrency, setCurrentConcurrency] = useState(0);
    const logRef = useRef([]);
    const [renderTrigger, setRenderTrigger] = useState(0);
    const logIntervalRef = useRef(null);
    const ExcalidrawModuleRef = useRef(null);
    const LZStringRef = useRef(null);
    const fontDataRef = useRef(null);

    const log = useCallback((message, kind = 'info') => {
        console.log(`[Flow] [${kind.toUpperCase()}] ${message}`);
        logRef.current.unshift({ t: Date.now(), kind, message });
        if (logRef.current.length > MAX_LOG_ENTRIES) logRef.current.pop();
    }, []);
    
    useEffect(() => {
        if (isRunning) { logIntervalRef.current = setInterval(() => setRenderTrigger(Date.now()), 500); } 
        else { clearInterval(logIntervalRef.current); setRenderTrigger(Date.now()); }
        return () => clearInterval(logIntervalRef.current);
    }, [isRunning]);

    const runAutomationFlow = async () => {
        if (!confirm(`This will run a live, parallel dependency solver in:\n\n${FOLDER_PATH}\n\nProceed?`)) {
            log("Operation cancelled by user.", "warning"); return;
        }
        const startTime = Date.now();
        logRef.current = []; cancelRunRef.current.cancel = false; setIsRunning(true);
        log(`Starting live parallel solver...`, 'success');
        try {
            // --- Library & Font Loading ---
            if (!ExcalidrawModuleRef.current) {
                log(`Loading Excalidraw...`, 'info'); window.EXCALIDRAW_ASSET_PATH = EXCALIDRAW_ASSET_PATH;
                const module = await import(EXCALIDRAW_CDN_URL);
                if (!module || !module.exportToSvg) throw new Error("Failed to load Excalidraw module.");
                ExcalidrawModuleRef.current = module; log('Excalidraw loaded.', 'success');
            }
            if (!LZStringRef.current) {
                log(`Loading LZ-String...`, 'info'); await loadLegacyScript(LZ_STRING_CDN_URL, "LZString");
                LZStringRef.current = window.LZString; log('LZ-String loaded.', 'success');
            }
            if (!fontDataRef.current) {
                log(`Loading custom font from: ${FONT_PATH}`, 'info');
                try {
                    fontDataRef.current = await app.vault.adapter.readBinary(FONT_PATH);
                    log('Custom font loaded successfully.', 'success');
                } catch (fontError) { throw new Error(`FAILED to load font. Check FONT_PATH. Error: ${fontError.message}`); }
            }

            const ExcalidrawModule = ExcalidrawModuleRef.current, LZString = LZStringRef.current, fontData = fontDataRef.current;
            
            // --- Live Solver Setup ---
            const allFiles = (await app.vault.adapter.list(FOLDER_PATH)).files;
            const allMdFiles = allFiles.filter(f => f.toLowerCase().endsWith('.md'));
            const allFilesSet = new Set(allFiles);
            
            const initialTasks = allMdFiles
                .filter(md => !allFilesSet.has(md.replace(/\.md$/i, '.svg')))
                .map(filePath => ({ filePath, priority: 'High', type: 'Create' }));

            const taskQueue = [...initialTasks];
            const processedForUpdate = new Set();
            const totalResults = [];
            let activeWorkers = 0;

            log(`Found ${initialTasks.length} high-priority tasks (missing SVGs).`, 'info');

            const onTaskComplete = (result) => {
                totalResults.push(result);
                if (result.success && !result.skipped) {
                    log(`✔ '${result.filePath.split('/').pop()}' processed. Queuing low-priority updates.`, 'info');
                    for (const mdFile of allMdFiles) {
                        if (!processedForUpdate.has(mdFile)) {
                            taskQueue.push({ filePath: mdFile, priority: 'Low', type: 'Update' });
                            processedForUpdate.add(mdFile);
                        }
                    }
                }
            };
            
            const worker = async () => {
                activeWorkers++; setCurrentConcurrency(c => c + 1);
                while (!cancelRunRef.current.cancel) {
                    const task = taskQueue.shift();
                    if (!task) break;
                    
                    log(`[${task.priority}] Processing '${task.filePath.split('/').pop()}'...`, 'debug');
                    // THE FIX: Pass the loaded fontData to the worker function
                    const result = await processFileWithLibrary(task.filePath, ExcalidrawModule, LZString, fontData, log);
                    onTaskComplete(result);
                }
                activeWorkers--; setCurrentConcurrency(c => c - 1);
            };

            const initialConcurrency = Math.min(maxConcurrency, taskQueue.length, 8);
            for (let i = 0; i < initialConcurrency; i++) { worker(); }

            while ((activeWorkers > 0 || taskQueue.length > 0) && !cancelRunRef.current.cancel) {
                if (taskQueue.length > 0 && activeWorkers < maxConcurrency) {
                    worker();
                }
                await delay(250);
            }
            
            const endTime = Date.now(); const durationSec = (endTime - startTime) / 1000;
            const processedOps = totalResults.length;
            const skipped = totalResults.filter(r => r.skipped).length;
            const failed = totalResults.filter(r => !r.success).length;
            log(`--------------------------------`, 'success');
            log(`Solver Finished!`, 'success');
            log(`Performed ${processedOps} file operations in ${durationSec.toFixed(2)}s.`, 'success');
            if (skipped > 0) log(`Skipped ${skipped} empty drawings.`, 'warning');
            if (failed > 0) log(`${failed} file operation(s) FAILED.`, 'error');
            else if (processedOps > 0) log('All files are stable and up-to-date.', 'success');
            else log('No files needed processing.', 'info');
            
        } catch (error) {
            if (error.message === "Cancelled") log("Flow stopped by user.", "warning");
            else { log(`FATAL ERROR: ${error.message}`, 'error'); console.error("Automation Flow Error:", error); }
        } finally {
            setIsRunning(false); setCurrentConcurrency(0);
        }
    };
    
    const handleStop = () => { log("Stop signal sent...", 'warning'); cancelRunRef.current.cancel = true; };
    const colorMap = { error:"#E57373", success:"#81C784", warning:"#ebcb8b", debug:"#888", info:"#E5E5E5" };

    return (
        <div style={{ height:"100%", width:"100%", padding:"10px", border:"1px solid #444", borderRadius:"8px", background:'#1c1c1c', color:'#eee', display:'flex', flexDirection:'column' }}>
            <h2>Excalidraw Batch Exporter</h2>
            <p style={{ color:'#aaa', marginTop:0, lineHeight: 1.5 }}>
                A live, parallel dependency solver. It prioritizes creating missing SVGs, then automatically queues and processes updates for all other files concurrently.
            </p>
            <div style={{display:'flex', gap: '20px', alignItems: 'center', background: '#222', padding: '10px', borderRadius: '6px', marginBottom: '15px'}}>
                 <div>
                    <label style={{display: 'block', fontSize: 12, color: '#999', marginBottom: 4}}>Max Concurrency</label>
                    <input type="number" min="1" max="20" value={maxConcurrency} onChange={e => setMaxConcurrency(Number(e.target.value))} disabled={isRunning} style={{width: '60px', padding: '6px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4}} />
                </div>
                <div style={{ borderLeft: '1px solid #444', paddingLeft: '20px' }}>
                    <label style={{display: 'block', fontSize: 12, color: '#999', marginBottom: 4}}>Current Concurrency</label>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#eee', minWidth: '30px', textAlign: 'center' }}>
                        {currentConcurrency}
                    </div>
                </div>
            </div>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                <button onClick={runAutomationFlow} disabled={isRunning} style={{ padding:'10px 20px', fontSize:'16px', cursor:isRunning?'not-allowed':'pointer', background:isRunning?'#555':'#2a66ff', color:'white', border:'none', borderRadius:'6px' }}>
                    {isRunning ? 'Processing...' : 'Run Live Solver'}
                </button>
                {isRunning && <button onClick={handleStop} style={{ padding:'10px 20px', fontSize:'16px', cursor:'pointer', background:'#E57373', color:'white', border:'none', borderRadius:'6px' }}>Stop</button>}
            </div>
            <div style={{ marginTop:'15px', flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                <h4 style={{ margin:'0 0 8px 0' }}>Live Log</h4>
                <div style={{ flex:1, background:'#111', border:'1px solid #333', borderRadius:'6px', padding:'10px', overflowY:'auto', fontFamily:'monospace', fontSize:'12px' }}>
                    {logRef.current.length === 0 && <span style={{color:'#777'}}>Click "Run" to start...</span>}
                    {logRef.current.map((log, index) => (
                        <div key={`${log.t}-${index}`} style={{ color:colorMap[log.kind]||colorMap.info, borderBottom:'1px solid #222', padding:'2px 0' }}>
                            <span style={{color:'#666', marginRight:'8px'}}>{new Date(log.t).toLocaleTimeString()}</span>
                            <span>{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

return { BasicView };
```


