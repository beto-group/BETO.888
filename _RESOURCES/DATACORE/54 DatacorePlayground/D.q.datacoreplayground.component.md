




# ViewComponent


```jsx
// -------------------------
// Live Development Environment (ViewComponent)
// -------------------------
const { useState, useEffect, useRef, useCallback, useMemo } = dc;
const { Component: PreactComponent } = dc.preact;

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- UTILITY FUNCTIONS ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }


// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- STYLES - Enigmatic Dark Theme (Consolidated) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


const styles = {
    wrapper: { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', fontFamily: 'sans-serif', backgroundColor: '#0a0a0a', color: '#e0e0e0', position: 'relative', boxSizing: 'border-box', },
    loaderBar: { display: 'flex', padding: '12px', gap: '8px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333', alignItems: 'center', },
    mainContent: { flex: 1, display: 'flex', overflow: 'hidden', },
    input: { flex: 1, padding: '8px 12px', fontSize: '14px', border: '1px solid #444', borderRadius: '4px', backgroundColor: '#222', color: '#e0e0e0', outline: 'none', },
    button: { padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', transition: 'background-color 0.2s', },
    iconButton: { padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', transition: 'background-color 0.2s', },
    editorPane: { flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor: '#121212', minWidth: 0 },
    statusBar: { padding: '8px 12px', backgroundColor: '#1f1f1f', borderTop: '1px solid #333', color: '#888', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', },
    previewPane: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#181818', position: 'relative', minWidth: 0 },
    previewHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#1f1f1f', color: '#aaa', fontSize: '12px', textAlign: 'center', borderBottom: '1px solid #333', },
    previewContent: { flex: 1, position: 'relative', overflow: 'auto', padding: '10px', },
    purpleFocus: { outline: '2px solid #8A2BE2', boxShadow: '0 0 5px #8A2BE2', },
    tabBar: { display: 'flex', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333', overflowX: 'auto', alignItems: 'center', flexShrink: 0 },
    tab: { padding: '10px 48px 10px 16px', cursor: 'pointer', color: '#888', borderBottom: '2px solid transparent', transition: 'color 0.2s, border-color 0.2s', whiteSpace: 'nowrap', fontSize: '13px', position: 'relative' },
    activeTab: { color: '#e0e0e0', borderBottom: '2px solid #8A2BE2', },
    addTabButton: { padding: '0 12px', cursor: 'pointer', color: '#888', fontSize: '20px', fontWeight: 'bold', userSelect: 'none', transition: 'color 0.2s', ':hover': { color: '#e0e0e0' } },
    renameInput: { background: 'transparent', border: 'none', outline: 'none', color: '#e0e0e0', fontSize: '13px', fontFamily: 'inherit', padding: '0', margin: '0', width: '100%', boxSizing: 'border-box' },
    tabCopyButton: { position: 'absolute', right: '25px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'transparent', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', opacity: 0.6, transition: 'background-color 0.2s, opacity 0.2s', },
    tabCloseButton: { position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'transparent', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', opacity: 0.6, transition: 'background-color 0.2s, opacity 0.2s', },
    bookmarkBar: { display: 'flex', padding: '8px 12px', gap: '8px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333', alignItems: 'center', overflowX: 'auto', flexShrink: 0 },
    bookmarkButton: { padding: '4px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#2c2c2c', color: '#ccc', border: '1px solid #444', borderRadius: '4px', transition: 'background-color 0.2s, color 0.2s', whiteSpace: 'nowrap', },
    activeBookmarkButton: { backgroundColor: '#8A2BE2', color: '#ffffff', borderColor: '#8A2BE2', },
    resizer: { flex: '0 0 5px', cursor: 'col-resize', backgroundColor: '#333', backgroundClip: 'padding-box', borderLeft: '2px solid transparent', borderRight: '2px solid transparent', transition: 'background-color 0.2s', zIndex: 1, },
    resizerHover: { backgroundColor: '#8A2BE2', },
    paneToggleButton: { cursor: 'pointer', color: '#888', fontSize: '16px', fontWeight: 'bold', userSelect: 'none', transition: 'color 0.2s', padding: '0 8px', lineHeight: '1', },
};

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 1. CRASH-PROOF ERROR HANDLING & COMPONENT LOADER ---
// This is the definitive, working solution for your Preact environment.
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

// --- A helper component to display errors cleanly ---
function ErrorDisplay({ errorMessage }) {
    const errorStyles = {
        wrapper: { padding: '20px' },
        details: { fontFamily: 'sans-serif', border: '1px solid #c53030', borderRadius: '8px', backgroundColor: '#2d1c1c', color: '#fed7d7', padding: '16px', },
        summary: { cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#f56565', listStyle: 'none', display: 'flex', alignItems: 'center', },
        summaryText: { marginLeft: '8px', },
        content: { marginTop: '12px', borderTop: '1px solid #742a2a', paddingTop: '12px', color: '#e0e0e0', fontSize: '14px', },
        pre: { whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#ccc', fontSize: '13px', marginTop: '12px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontFamily: 'monospace', }
    };

    return (
        <div style={errorStyles.wrapper}>
            <details style={errorStyles.details} open>
                <summary style={errorStyles.summary}>
                    <span>⚠️</span><span style={errorStyles.summaryText}>Component Rendering Error</span>
                </summary>
                <div style={errorStyles.content}>
                    <p>The component failed to render. This error was caught, preventing a full crash. Fix the error in the editor and save.</p>
                    <pre style={errorStyles.pre}>{errorMessage}</pre>
                </div>
            </details>
        </div>
    );
}

// --- The Preact Error Boundary ---
// This class component is the safety net. It catches rendering errors from any child component.
class ErrorBoundary extends PreactComponent {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, info);
    }
    
    componentDidUpdate(prevProps) {
        // If the key changes, it means we're rendering a new component.
        // We must reset the error state so we can attempt to render the new component.
        if (prevProps.renderKey !== this.props.renderKey) {
            this.setState({ hasError: false, error: null });
        }
    }

    render() {
        if (this.state.hasError) {
            // Render the fallback error UI.
            return <ErrorDisplay errorMessage={this.state.error?.toString()} />;
        }
        // If there's no error, render the children as normal.
        return this.props.children;
    }
}

// --- The New, Robust Dynamic Component Loader ---
function DynamicComponentLoader({ filePath, activeHeader, renderKey }) {
    const [LoadedComponent, setLoadedComponent] = useState(null);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        let isCancelled = false;
        const loadComponent = async () => {
            if (!filePath || !activeHeader) {
                setLoadedComponent(null); 
                setLoadError(null);
                return;
            }
            // Reset state for the new component load
            setLoadedComponent(null); 
            setLoadError(null);

            try {
                // [THE CACHE-BUSTING TRICK]
                // Because activeHeader is a new, unique string on each save (e.g., "MyComponent_reload_12345"),
                // dc.require is forced to fetch the module's content fresh instead of serving a cached version.
                const dynamicModule = await dc.require(dc.headerLink(filePath, activeHeader));
                if (isCancelled) return;

                let Component = null;
                if (typeof dynamicModule === 'function') Component = dynamicModule;
                else if (dynamicModule && typeof dynamicModule === 'object') {
                    const keys = Object.keys(dynamicModule);
                    if (keys.length > 0) Component = dynamicModule[keys[0]];
                }

                if (typeof Component !== 'function') {
                    throw new Error("Module did not export a renderable component.");
                }

                if (!isCancelled) {
                    setLoadedComponent(() => Component);
                }
            } catch (err) {
                console.error("Component load error:", err);
                if (!isCancelled) {
                    setLoadError(err.toString());
                }
            }
        };

        loadComponent();
        return () => { isCancelled = true; };
    }, [filePath, activeHeader, renderKey]); // Depend on renderKey to force a full reload on save

    if (loadError) {
        return <ErrorDisplay errorMessage={loadError} />;
    }
    
    if (LoadedComponent) {
        return (
            <ErrorBoundary renderKey={renderKey}>
                <LoadedComponent />
            </ErrorBoundary>
        );
    }
    
    return <p style={{ color: '#888', padding: '20px' }}>{(filePath && activeHeader) ? 'Loading component...' : 'Load a file to see the preview.'}</p>;
}


// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 3. THE LIVE EDITOR (Left Pane) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function PlaygroundEditor({ filePath, onHardReload, activeHeader, setActiveHeader, renderHeader, setRenderHeader, onTogglePreview, reloadKey }) {
    const BOILERPLATE_CODE = `function MyComponent() {\n  return <div>Hello, World!</div>;\n}\n\nreturn { MyComponent };`;
    const MONACO_VERSION = "0.45.0";
    const SETUP_DIR_BASE = ".datacore/playground";
    const SETUP_DIR = `${SETUP_DIR_BASE}/monaco-host`;
    const HOST_FILE_VERSION = 14;
    const HOST_FILENAME_BASE = "monaco-host";
    const HOST_FILENAME = `${HOST_FILENAME_BASE}-v${HOST_FILE_VERSION}.html`;
    const HOST_FILE_PATH = `${SETUP_DIR}/${HOST_FILENAME}`;
    const CACHE_FILE_PATH = `${SETUP_DIR_BASE}/editor-cache.json`;
    const TEMP_FILE_PATH = `_RESOURCES/DATACORE/COMPONENTS/TEMP/temp-codeblock.md`;
    const TEMP_HEADER_NAME = "TempComponent";

    const [codeBlocks, setCodeBlocks] = useState([]);
    const [status, setStatus] = useState("No file loaded.");
    const [isHostFileReady, setIsHostFileReady] = useState(false);
    const iframeRef = useRef(null);
    const fullCacheRef = useRef({});
    const viewStateCache = useRef({});
    const [renamingHeader, setRenamingHeader] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [isAddingTab, setIsAddingTab] = useState(false);
    const [newTabName, setNewTabName] = useState('');
    const messageContext = useMemo(() => activeHeader ? `${filePath}#${activeHeader}` : filePath, [filePath, activeHeader]);

    const isEditorReadyRef = useRef(false);
    const pendingContentRef = useRef(null);
    const lastSentContext = useRef(null);

    const debouncedSaveCache = useCallback(debounce(async () => {
        try { if (typeof app !== 'undefined' && app.vault?.adapter) await app.vault.adapter.write(CACHE_FILE_PATH, JSON.stringify(fullCacheRef.current, null, 2)); }
        catch (e) { console.error("[PlaygroundEditor] Failed to save editor cache:", e); }
    }, 1000), []);

    const saveCacheNow = useCallback(async () => {
        try { if (typeof app !== 'undefined' && app.vault?.adapter) await app.vault.adapter.write(CACHE_FILE_PATH, JSON.stringify(fullCacheRef.current, null, 2)); }
        catch (e) { console.error("[PlaygroundEditor] Failed to save editor cache NOW:", e); }
    }, []);

    const loadCache = useCallback(async () => {
        try { if (typeof app !== 'undefined' && app.vault?.adapter && await app.vault.adapter.exists(CACHE_FILE_PATH)) fullCacheRef.current = JSON.parse(await app.vault.adapter.read(CACHE_FILE_PATH)); }
        catch (e) { console.error("[PlaygroundEditor] Failed to load editor cache:", e); fullCacheRef.current = {}; }
    }, []);

    const updateCacheOnHeaderChange = useCallback((oldHeader, newHeader) => {
        const fileCache = fullCacheRef.current[filePath];
        if (!fileCache || !fileCache.tabs) return;
        const cachedState = fileCache.tabs[oldHeader];
        delete fileCache.tabs[oldHeader];
        delete viewStateCache.current[oldHeader];
        if (newHeader && cachedState) { fileCache.tabs[newHeader] = cachedState; viewStateCache.current[newHeader] = cachedState; }
        if (fileCache.lastActive === oldHeader) { fileCache.lastActive = newHeader || (codeBlocks.length > 0 ? codeBlocks[0].header : null); }
        debouncedSaveCache();
    }, [filePath, codeBlocks, debouncedSaveCache]);

    useEffect(() => {
        loadCache();
        const setupHostFile = async () => {
            if (typeof app === 'undefined' || !app.vault?.adapter) { setStatus("Setup failed: Obsidian app context not available."); return; }
            const adapter = app.vault.adapter;
            try { 
                if (!(await adapter.exists(SETUP_DIR_BASE))) await adapter.mkdir(SETUP_DIR_BASE);
                if (await adapter.exists(SETUP_DIR)) { 
                    const dirContents = await adapter.list(SETUP_DIR); 
                    for (const path of dirContents.files) { 
                        const name = path.split('/').pop(); 
                        if (name.startsWith(HOST_FILENAME_BASE) && name !== HOST_FILENAME) await adapter.remove(path); 
                    } 
                } 
            }
            catch (error) { console.warn("[PlaygroundEditor] Failed to clean up old host files.", error); }
            if (await adapter.exists(HOST_FILE_PATH)) { setIsHostFileReady(true); return; }
            setStatus("Performing first-time editor setup...");
            try {
                if (!await adapter.exists(SETUP_DIR)) await adapter.mkdir(SETUP_DIR);
                const monacoLoaderUrl = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs/loader.js`;
                const monacoBasePath = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs`;
                const hostHtmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body,html{margin:0;padding:0;height:100%;overflow:hidden}#container{width:100%;height:100%}</style></head><body><div id="container"></div><script src="${monacoLoaderUrl}"></script><script>let editor=null;const params=new URLSearchParams(window.location.search),initialTheme=params.get("theme");let currentContext=params.get("context"),initialCode=params.get("code")||"";function debounce(t,n){let e;return function(...o){const i=()=>{e=null,t(...o)};clearTimeout(e),e=setTimeout(i,n)}}const reportState=debounce(()=>{if(!editor)return;const t=editor.saveViewState();parent.postMessage({type:"state-changed",value:t,context:currentContext},"*")},250);require.config({paths:{vs:"${monacoBasePath}"}});require(["vs/editor/editor.main"],(function(){editor=monaco.editor.create(document.getElementById("container"),{value:initialCode,language:"javascript",theme:initialTheme,automaticLayout:!0,minimap:{enabled:!0},wordWrap:"on",fontSize:14,fontFamily:"monospace"}),editor.onDidChangeModelContent((()=>parent.postMessage({type:"change",value:editor.getValue(),context:currentContext},"*"))),editor.onDidScrollChange(reportState),editor.onDidChangeCursorPosition(reportState),window.addEventListener("message",(e=>{const{type:t,value:o,context:s}=e.data;if("set-theme"===t&&monaco.editor.setTheme)return monaco.editor.setTheme(o);if("relayout"===t&&editor)return editor.layout();if("set-content"===t&&editor&&o){if(o.code!==editor.getValue()){editor.setValue(o.code)}currentContext=o.context;if("state"in o&&o.state){editor.restoreViewState(o.state)}}})),parent.postMessage({type:"editor-ready",context:currentContext},"*")}));</script></body></html>`;
                await adapter.write(HOST_FILE_PATH, hostHtmlContent);
                setIsHostFileReady(true);
            } catch (error) { console.error("[PlaygroundEditor] Monaco host setup failed:", error); setStatus(`Setup failed: ${error.message}`); }
        };
        setupHostFile();
        return () => { debouncedSaveCache(); };
    }, []);

    const parseFileContent = (content) => { const regex = /^#\s+(.*?)\s*\n+```jsx\r?\n([\s\S]*?)\r?\n```/gm; const blocks = []; let match; while ((match = regex.exec(content)) !== null) { blocks.push({ header: match[1].trim(), code: match[2].trim() }); } return blocks.length > 0 ? blocks : [{ header: "ViewComponent", code: BOILERPLATE_CODE }]; };
    const rebuildFileContent = (blocks) => { const frontmatter = "---\ntags: datacore-component\n---\n\n"; const content = blocks.map(block => `# ${block.header}\n\n\`\`\`jsx\n${block.code.trim()}\n\`\`\``).join('\n\n\n'); return frontmatter + content; };

    const sendContentToEditor = useCallback((contentPayload) => {
        if (!contentPayload) return;
        if (isEditorReadyRef.current) {
            if (iframeRef.current) iframeRef.current.contentWindow.postMessage(contentPayload, '*');
            lastSentContext.current = contentPayload.value.context;
            pendingContentRef.current = null;
        } else {
            pendingContentRef.current = contentPayload;
        }
    }, []);

    useEffect(() => {
        isEditorReadyRef.current = false;
        pendingContentRef.current = null;
        lastSentContext.current = null;
        if (!filePath) {
            setCodeBlocks([]); 
            setActiveHeader(null); 
            setRenderHeader(null);
            setStatus("No file loaded.");
            return;
        }
        const loadFileAndPrepareContent = async () => {
            setStatus("Loading file...");
            await loadCache();
            let fileContent = "";
            try { fileContent = await app.vault.adapter.read(filePath); } catch (e) { console.error(`[PlaygroundEditor] Error reading file: ${e.message}`); }
            const blocks = parseFileContent(fileContent);
            const fileCache = fullCacheRef.current[filePath] || {};
            viewStateCache.current = fileCache.tabs || {};

            const primaryView = blocks.find(b => b.header.toLowerCase().includes("viewcomponent") || b.header.toLowerCase().includes("view"));
            const componentToRender = primaryView ? primaryView.header : (blocks[0]?.header || null);
            setRenderHeader(componentToRender);

            const initialActiveTab = blocks.find(b => b.header === fileCache.lastActive)?.header || componentToRender || blocks[0]?.header || null;
            setActiveHeader(initialActiveTab);
            
            setCodeBlocks(blocks);
            setStatus("Ready");

            const activeBlock = blocks.find(b => b.header === initialActiveTab);
            if (activeBlock) {
                const newContext = `${filePath}#${initialActiveTab}`;
                const contentPayload = { type: 'set-content', value: { code: activeBlock.code, context: newContext, state: viewStateCache.current[initialActiveTab] || null } };
                sendContentToEditor(contentPayload);
            }
        };
        loadFileAndPrepareContent();
    }, [filePath, sendContentToEditor, loadCache, setActiveHeader, setRenderHeader]);

    useEffect(() => {
        if (!filePath) return;
        const activeBlock = codeBlocks.find(b => b.header === activeHeader);
        if (activeBlock && lastSentContext.current !== messageContext) {
            const contentPayload = { type: 'set-content', value: { code: activeBlock.code, context: messageContext, state: viewStateCache.current[activeHeader] || null } };
            sendContentToEditor(contentPayload);
        }
    }, [activeHeader, codeBlocks, filePath, messageContext, sendContentToEditor]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (!event.data || !iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
            const { type, value, context } = event.data;
            if (type === 'editor-ready') {
                isEditorReadyRef.current = true;
                iframeRef.current.contentWindow.postMessage({ type: 'set-theme', value: 'vs-dark' }, '*');
                if (pendingContentRef.current) {
                    sendContentToEditor(pendingContentRef.current);
                }
                return;
            }
            if (type === 'change' && context === messageContext) {
                setCodeBlocks(prevBlocks => prevBlocks.map(block => block.header === activeHeader ? { ...block, code: value } : block));
            } else if (type === 'state-changed' && context === messageContext) {
                if (!filePath || !activeHeader) return;
                viewStateCache.current[activeHeader] = value;
                if (!fullCacheRef.current[filePath]) { fullCacheRef.current[filePath] = { tabs: {} }; }
                if (!fullCacheRef.current[filePath].tabs) { fullCacheRef.current[filePath].tabs = {}; }
                fullCacheRef.current[filePath].tabs[activeHeader] = value;
                fullCacheRef.current[filePath].lastActive = activeHeader;
                debouncedSaveCache();
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [filePath, activeHeader, debouncedSaveCache, sendContentToEditor]);

    // [FIX] Replaced useCallback/useRef with a robust useEffect to prevent stale closures.
    useEffect(() => {
        const performSave = async (blocksToSave) => {
            const blocks = blocksToSave || codeBlocks;
            if (!filePath || blocks.length === 0) return;
            setStatus("Saving...");

            try {
                if (typeof app === 'undefined' || !app.vault || !app.vault.adapter) {
                    throw new Error("Obsidian app context not fully available.");
                }
                const adapter = app.vault.adapter;

                const fullFileContent = rebuildFileContent(blocks);
                await adapter.write(filePath, fullFileContent);
                if (activeHeader) {
                    if (!fullCacheRef.current[filePath]) { fullCacheRef.current[filePath] = { tabs: {} }; }
                    fullCacheRef.current[filePath].lastActive = activeHeader;
                }
                await saveCacheNow();
                setStatus("Saved successfully ✅");

                if (renderHeader) {
                    const componentBlock = blocks.find(b => b.header === renderHeader);
                    if (componentBlock) {
                        const tempFileContent = `# ${TEMP_HEADER_NAME}\n\n\`\`\`jsx\n${componentBlock.code.trim()}\n\`\`\``;
                        const parentDir = TEMP_FILE_PATH.substring(0, TEMP_FILE_PATH.lastIndexOf('/'));
                        if (parentDir && !(await adapter.exists(parentDir))) await adapter.mkdir(parentDir);
                        await adapter.write(TEMP_FILE_PATH, tempFileContent);
                        if (onHardReload) setTimeout(() => onHardReload(TEMP_FILE_PATH, TEMP_HEADER_NAME), 50);
                    } else {
                        new Notice(`Error: Main component "${renderHeader}" not found to preview.`, 4000);
                    }
                }
                
                setTimeout(() => setStatus(s => s === "Saved successfully ✅" ? "Ready" : s), 2000);

            } catch (e) {
                setStatus(`Error saving: ${e.message}`);
                console.error("Error during save:", e);
            }
        };
        
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                performSave();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filePath, codeBlocks, activeHeader, renderHeader, onHardReload, saveCacheNow]); // This now depends on all state it needs, guaranteeing it's always fresh.
    
    const handleSaveClick = async (blocks) => {
         // This is a wrapper for UI elements like buttons to call the save logic.
         // It's not strictly needed for Ctrl+S but is good practice.
        const performSave = async (blocksToSave) => {
            const blocks = blocksToSave || codeBlocks;
            if (!filePath || blocks.length === 0) return;
            setStatus("Saving...");

            try {
                const adapter = app.vault.adapter;
                const fullFileContent = rebuildFileContent(blocks);
                await adapter.write(filePath, fullFileContent);
                if (activeHeader) {
                    if (!fullCacheRef.current[filePath]) { fullCacheRef.current[filePath] = { tabs: {} }; }
                    fullCacheRef.current[filePath].lastActive = activeHeader;
                }
                await saveCacheNow();
                setStatus("Saved successfully ✅");
                if (renderHeader) {
                    const componentBlock = blocks.find(b => b.header === renderHeader);
                    if (componentBlock) {
                        const tempFileContent = `# ${TEMP_HEADER_NAME}\n\n\`\`\`jsx\n${componentBlock.code.trim()}\n\`\`\``;
                        const parentDir = TEMP_FILE_PATH.substring(0, TEMP_FILE_PATH.lastIndexOf('/'));
                        if (parentDir && !(await adapter.exists(parentDir))) await adapter.mkdir(parentDir);
                        await adapter.write(TEMP_FILE_PATH, tempFileContent);
                        if (onHardReload) setTimeout(() => onHardReload(TEMP_FILE_PATH, TEMP_HEADER_NAME), 50);
                    } else { new Notice(`Error: Main component "${renderHeader}" not found to preview.`, 4000); }
                }
                setTimeout(() => setStatus(s => s === "Saved successfully ✅" ? "Ready" : s), 2000);
            } catch (e) { setStatus(`Error saving: ${e.message}`); console.error("Error during save:", e); }
        };
        await performSave(blocks);
    };

    const iframeSrc = useMemo(() => {
        if (!isHostFileReady) return "about:blank";
        return app.vault.adapter.getResourcePath(HOST_FILE_PATH);
    }, [isHostFileReady, HOST_FILE_PATH]);
    
    const handleInitiateAddTab = () => { setIsAddingTab(true); setNewTabName("NewComponent"); };
    const handleCommitAddTab = () => { const finalTabName = newTabName.trim(); setIsAddingTab(false); setNewTabName(''); if (!finalTabName || codeBlocks.some(b => b.header === finalTabName)) { if (finalTabName) new Notice("A component with this name already exists.", 3000); return; } const newBoilerplate = `function ${finalTabName}() {\n  return <div>Hello, World!</div>;\n}\n\nreturn { ${finalTabName} };`; const newBlock = { header: finalTabName, code: newBoilerplate }; const newBlocks = [...codeBlocks, newBlock]; setCodeBlocks(newBlocks); setActiveHeader(finalTabName); handleSaveClick(newBlocks); };
    const handleTabDoubleClick = (header) => { setRenamingHeader(header); setRenameValue(header); };
    const handleRenameCommit = () => { const oldHeader = renamingHeader; const newHeader = renameValue.trim(); setRenamingHeader(null); if (!newHeader || oldHeader === newHeader) return; if (codeBlocks.some(b => b.header === newHeader)) { new Notice("A component with this name already exists.", 3000); return; } const renameRegex = new RegExp('\\b' + oldHeader + '\\b', 'g'); const newBlocks = codeBlocks.map(b => { if (b.header === oldHeader) { const updatedCode = b.code.replace(renameRegex, newHeader); return { ...b, header: newHeader, code: updatedCode }; } return b; }); setCodeBlocks(newBlocks); updateCacheOnHeaderChange(oldHeader, newHeader); if (activeHeader === oldHeader) setActiveHeader(newHeader); if (renderHeader === oldHeader) setRenderHeader(newHeader); handleSaveClick(newBlocks); };
    const handleDeleteTab = (headerToDelete) => { if (codeBlocks.length <= 1) { new Notice("You cannot delete the last component.", 3000); return; } if (renderHeader === headerToDelete) { new Notice("Cannot delete the main component being previewed.", 3000); return; } const indexToDelete = codeBlocks.findIndex(b => b.header === headerToDelete); const newBlocks = codeBlocks.filter(b => b.header !== headerToDelete); if (activeHeader === headerToDelete) { const newActiveIndex = Math.max(0, indexToDelete - 1); const newActiveHeader = newBlocks[newActiveIndex]?.header || null; setActiveHeader(newActiveHeader); } setCodeBlocks(newBlocks); updateCacheOnHeaderChange(headerToDelete, null); handleSaveClick(newBlocks); };
    const handleCopyImportStatement = (header) => { if (!filePath || !header) return; const importStatement = `const { ${header} } = await dc.require(dc.headerLink("${filePath}", "${header}"));`; navigator.clipboard.writeText(importStatement).then(() => { new Notice(`Import for '${header}' copied!`, 3000); }).catch(err => { console.error("Failed to copy import statement:", err); new Notice("Error: Could not copy to clipboard.", 4000); }); };

    return (
        <div style={styles.editorPane}>
            <div style={styles.tabBar} className="scrollable-tabs">
                {codeBlocks.map(block => (
                    <div key={block.header} style={{ ...styles.tab, ...(block.header === activeHeader ? styles.activeTab : {}) }} onClick={() => renamingHeader === null && !isAddingTab && setActiveHeader(block.header)} onDoubleClick={() => handleTabDoubleClick(block.header)} >
                        {renamingHeader === block.header ? (<input type="text" style={styles.renameInput} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={handleRenameCommit} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} autoFocus />) : (block.header)}
                        <span style={styles.tabCopyButton} title={`Copy import for ${block.header}`} onClick={(e) => { e.stopPropagation(); handleCopyImportStatement(block.header); }}>{`{;}`}</span>
                        <span style={styles.tabCloseButton} title={`Delete ${block.header}`} onClick={(e) => { e.stopPropagation(); handleDeleteTab(block.header); }}>&times;</span>
                    </div>
                ))}
                {filePath && (isAddingTab ? (<div style={{ ...styles.tab, paddingRight: '12px' }}> <input type="text" style={styles.renameInput} value={newTabName} onChange={(e) => setNewTabName(e.target.value)} onBlur={handleCommitAddTab} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} autoFocus /> </div>) : (<div style={styles.addTabButton} onClick={handleInitiateAddTab} title="Add New Component">+</div>))}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
                {iframeSrc === "about:blank" || !filePath ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#ccc' }}>{status}</div>
                ) : (
                    <iframe
                        key={`${filePath}-${reloadKey}`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        src={iframeSrc}
                        ref={iframeRef}
                        name={`monaco-editor-${filePath}`}
                    />
                )}
            </div>
            <div style={styles.statusBar}>
                <span>{status}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button style={styles.button} onClick={() => handleSaveClick()} disabled={!filePath}>Save & Rebuild (Ctrl+S)</button>
                    <span style={styles.paneToggleButton} onClick={onTogglePreview} title="Toggle Preview Pane">&gt;</span>
                </div>
            </div>
        </div>
    );
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 4. MAIN COMPONENT - Live Development Environment (Integrated) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function LiveDevelopmentEnvironment() {
    const [filePath, setFilePath] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [renderKey, setRenderKey] = useState(0);
    const [isInputFocused, setIsInputFocused] = useState(false);
    
    // State is separated: activeHeader for the editor, renderHeader for the preview.
    const [activeHeader, setActiveHeader] = useState(null);
    const [renderHeader, setRenderHeader] = useState(null);

    // State for managing what the DynamicComponentLoader renders
    const [loaderFilePath, setLoaderFilePath] = useState("");
    const [loaderHeaderName, setLoaderHeaderName] = useState(null);

    const [paneVisibility, setPaneVisibility] = useState('both');
    const [editorPaneWidth, setEditorPaneWidth] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const [isResizerHovered, setIsResizerHovered] = useState(false);
    const [activeMode, setActiveMode] = useState('default');
    const [editorReloadKey, setEditorReloadKey] = useState(0);
    const [isPaneActive, setIsPaneActive] = useState(true);

    const containerRef = useRef(null);
    const mainContentRef = useRef(null);
    const previewContentRef = useRef(null);
    const isInitialLoad = useRef(true);
    const cleanupRef = useRef({});
    const componentPages = dc.useQuery(`@page AND path("_RESOURCES/DATACORE") AND $file.contains(".component")`);

    useEffect(() => {
        setLoaderFilePath(filePath);
        setRenderHeader(null);
        setLoaderHeaderName(null);
        setRenderKey(prev => prev + 1);
    }, [filePath]);
    
    useEffect(() => {
        if (loaderFilePath === filePath) {
            setLoaderHeaderName(renderHeader);
        }
    }, [renderHeader, loaderFilePath, filePath]);


    const toggleScreenMode = () => {
        const newKey = editorReloadKey + 1;
        setEditorReloadKey(newKey);
        setActiveMode(prev => (prev === 'default' ? 'fullTab' : 'default'));
    };

    const handleLoadFile = (e) => { e.preventDefault(); if (inputValue !== filePath) { setFilePath(inputValue); setEditorReloadKey(k => k + 1); } };
    const handleBookmarkClick = (path) => { setInputValue(path); if (path !== filePath) { setFilePath(path); setEditorReloadKey(k => k + 1); } };
    
    function findNearestAncestorWithClass(element, className) { if (!element) return null; let current = element.parentNode; while (current) { if (current.classList && current.classList.contains(className)) { return current; } current = current.parentNode; } return null; }
    function findDirectChildByClass(parent, className) { if (!parent) return null; for (const child of parent.children) { if (child.classList && child.classList.contains(className)) { return child; } } return null; }

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (activeMode === 'fullTab') {
            if (cleanupRef.current.originalParent) return;
            const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
            if (!targetPaneContent) { setActiveMode('default'); return; }
            const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;
            cleanupRef.current.originalParent = container.parentNode;
            const placeholder = document.createElement('div');
            placeholder.style.display = 'none';
            cleanupRef.current.placeholder = placeholder;
            container.parentNode.insertBefore(placeholder, container);
            contentWrapper.appendChild(container);
        }
        return () => {
            if (!cleanupRef.current.originalParent) return;
            const { originalParent, placeholder } = cleanupRef.current;
            if (placeholder?.parentNode) {
                placeholder.parentNode.replaceChild(container, placeholder);
            } else if (originalParent) {
                originalParent.appendChild(container);
            }
            cleanupRef.current = {};
        };
    }, [activeMode]);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isPaneActive && containerRef.current && !containerRef.current.contains(event.target)) { setIsPaneActive(false); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, [isPaneActive]); 

    const wrapperStyle = useMemo(() => {
        const baseStyle = styles.wrapper;
        if (activeMode === 'fullTab') {
            return { ...baseStyle, position: 'absolute', top: 0, left: 0, zIndex: isPaneActive ? 9999 : 1000, overflow: 'auto' };
        }
        return baseStyle;
    }, [activeMode, isPaneActive]);


    const formatBookmarkName = (path) => { if (!path) return "Untitled"; const filename = path.split('/').pop() || ''; let name = filename.replace(/^D\.q\./i, '').replace(/\.component\.v\d+/i, '').replace(/\.component/i, '').replace(/\.md$/i, ''); name = name.replace(/([A-Z])/g, ' $1').trim(); return name.charAt(0).toUpperCase() + name.slice(1); };
    const bookmarks = useMemo(() => { if (!componentPages) return []; const formatted = componentPages.map(page => ({ name: formatBookmarkName(page.$path), path: page.$path })); const filtered = formatted.filter(bookmark => bookmark.name !== "Canvas"); return filtered.sort((a, b) => a.name.localeCompare(b.name)); }, [componentPages]);
    const SETTINGS_FILE_PATH = ".datacore/playground/live-dev-settings.json";
    const saveSettings = useCallback(debounce(async (currentPath) => { if (!currentPath || typeof app === 'undefined' || !app.vault?.adapter) return; try { const settings = { lastFilePath: currentPath }; const parentDir = SETTINGS_FILE_PATH.substring(0, SETTINGS_FILE_PATH.lastIndexOf('/')); if (parentDir && !(await app.vault.adapter.exists(parentDir))) { await app.vault.adapter.mkdir(parentDir); } await app.vault.adapter.write(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2)); } catch (error) { console.error("Failed to save Live Development Environment settings:", error); } }, 1000), []);
    useEffect(() => { if (!isInitialLoad.current) { saveSettings(filePath); } }, [filePath, saveSettings]);
    useEffect(() => { if (!isInitialLoad.current || !componentPages) return; const loadInitialState = async () => { isInitialLoad.current = false; if (typeof app === 'undefined' || !app.vault?.adapter) return; let loadedPath = ""; try { if (await app.vault.adapter.exists(SETTINGS_FILE_PATH)) { const content = await app.vault.adapter.read(SETTINGS_FILE_PATH); const settings = JSON.parse(content); if (settings.lastFilePath) loadedPath = settings.lastFilePath; } } catch (error) { console.error("Failed to load Live Development Environment settings:", error); } if (!loadedPath && bookmarks.length > 0) { loadedPath = bookmarks[0].path; } if (loadedPath) { setFilePath(loadedPath); setInputValue(loadedPath); } }; loadInitialState(); }, [componentPages, bookmarks]);
    const uniqueWrapperClass = "live-dev-wrapper-" + useRef(Math.random().toString(36).substr(2, 9)).current;
    const scrollbarStyle = `.${uniqueWrapperClass} .scrollable-tabs::-webkit-scrollbar { height: 6px; } .${uniqueWrapperClass} .scrollable-tabs::-webkit-scrollbar-track { background: #1a1a1a; } .${uniqueWrapperClass} .scrollable-tabs::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; } .${uniqueWrapperClass} .scrollable-tabs { scrollbar-width: thin; scrollbar-color: #555 #1a1a1a; }`;
    
    const handleMouseDown = useCallback((e) => { e.preventDefault(); setIsResizing(true); }, []);
    const handleMouseUp = useCallback(() => setIsResizing(false), []);
    
    // [FIX] Corrected the logic for collapsing panes when dragging to the edges.
    const handleMouseMove = useCallback((e) => {
        if (!isResizing || !mainContentRef.current) return;
        const container = mainContentRef.current;
        const rect = container.getBoundingClientRect();
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
        if (newWidth < 10) {
            setPaneVisibility('preview'); // Dragged left: Hide editor, show only PREVIEW
        } else if (newWidth > 90) {
            setPaneVisibility('editor'); // Dragged right: Hide preview, show only EDITOR
        } else {
            setPaneVisibility('both');
            setEditorPaneWidth(newWidth);
        }
    }, [isResizing]);

    useEffect(() => { if (isResizing) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); } return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }; }, [isResizing, handleMouseMove, handleMouseUp]);
    
    const handleToggleEditor = () => setPaneVisibility(prev => prev === 'preview' ? 'both' : 'preview');
    const handleTogglePreview = () => setPaneVisibility(prev => prev === 'editor' ? 'both' : 'editor');
    
    const editorPaneStyle = { display: paneVisibility === 'preview' ? 'none' : 'flex', flex: paneVisibility === 'editor' ? '1 1 100%' : `0 0 ${editorPaneWidth}%`, height: '100%', };
    const previewPaneStyle = { display: paneVisibility === 'editor' ? 'none' : 'flex', flex: paneVisibility === 'preview' ? '1 1 100%' : '1 1 auto', height: '100%', };
    const resizerStyle = { ...styles.resizer, ...(isResizerHovered || isResizing ? styles.resizerHover : {}), display: paneVisibility !== 'both' ? 'none' : 'flex', };
    
    useEffect(() => {
        const scrollRestoreTimeout = setTimeout(() => {
            if (previewContentRef.current && filePath) {
                const SCROLL_KEY = `datacore-live-dev-scroll-${filePath}`;
                const savedScroll = sessionStorage.getItem(SCROLL_KEY);
                if (savedScroll) {
                    try {
                        const { top, left } = JSON.parse(savedScroll);
                        previewContentRef.current.scrollTop = top;
                        previewContentRef.current.scrollLeft = left;
                    } catch (e) { console.error("Failed to restore scroll:", e); }
                    finally { sessionStorage.removeItem(SCROLL_KEY); }
                }
            }
        }, 100);
        return () => clearTimeout(scrollRestoreTimeout);
    }, [filePath]);

    const handleHardReload = useCallback((newFilePath, newHeaderName) => {
        if (!newFilePath || !newHeaderName) {
            return;
        }

        if (previewContentRef.current && filePath) {
            const SCROLL_KEY = `datacore-live-dev-scroll-${filePath}`;
            const scrollState = { top: previewContentRef.current.scrollTop, left: previewContentRef.current.scrollLeft };
            sessionStorage.setItem(SCROLL_KEY, JSON.stringify(scrollState));
        }

        setLoaderFilePath(newFilePath);
        setLoaderHeaderName(newHeaderName);
        
        setRenderKey(k => k + 1);
        new Notice("Reloading preview...", 1500);

    }, [filePath]);

    const handleCopyPath = () => { try { const activeFile = dc.app.workspace.getActiveFile(); if (activeFile) { navigator.clipboard.writeText(activeFile.path); new Notice(`Path copied: ${activeFile.path}`, 4000); } else { new Notice("Could not determine the active file path.", 4000); } } catch (error) { console.error("Error getting file path:", error); new Notice("Error: Could not access app context to find file path.", 4000); } };
    const handleCreateNewFile = async () => { const finalPath = inputValue.trim(); if (!finalPath || !finalPath.toLowerCase().endsWith('.md')) { new Notice("Please enter a valid file path ending in .md in the input field.", 4000); return; } const adapter = app.vault.adapter; if (await adapter.exists(finalPath)) { if (confirm(`File already exists at "${finalPath}".\n\nClick OK to OVERWRITE it, or Cancel to simply OPEN it.`)) { new Notice(`Overwriting file: ${finalPath}`, 2000); } else { new Notice(`Opening existing file: ${finalPath}`, 2000); setFilePath(finalPath); setRenderKey(prev => prev + 1); return; } } try { const filename = finalPath.split('/').pop().replace(/\.md$/, '').replace(/\.component/i, ''); let componentName = filename.replace(/[^a-zA-Z0-9]/g, ''); if (!/^[a-zA-Z]/.test(componentName)) { componentName = 'Component' + componentName; } componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1); if (!componentName) { new Notice("Could not derive a valid component name from the file path.", 4000); return; } const boilerplateCode = `function ${componentName}() {\n  return <div>Hello from ${componentName}!</div>;\n}\n\nreturn { ${componentName} };`; const fileContent = `---\ntags: datacore-component\n---\n\n# ViewComponent\n\n\`\`\`jsx\n${boilerplateCode}\n\`\`\``; const parentDir = finalPath.substring(0, finalPath.lastIndexOf('/')); if (parentDir && !(await adapter.exists(parentDir))) { await adapter.mkdir(parentDir); new Notice(`Created directory: ${parentDir}`, 2000); } await adapter.write(finalPath, fileContent); new Notice(`Component created: ${finalPath}`, 4000); setFilePath(finalPath); setRenderKey(prev => prev + 1); } catch (error) { console.error("Error creating new component file:", error); new Notice("Failed to create file. Check console for details.", 5000); } };
    const ExpandIcon = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 9.5V14H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.5 14H14V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 6.5V2H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.5 2H2V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    const ShrinkIcon = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 1.5V6H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M1.5 9.5H6V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.5 14V9.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 6.5H9.5V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    const ReloadIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 4.5V9.5H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M3.5 19.5V14.5H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M21.16 12.55C20.88 15.3 19.49 17.77 17.41 19.42C15.33 21.07 12.77 21.72 10.19 21.43C7.61 21.14 5.25 19.93 3.53 18.07C1.81 16.21 0.880001 13.85 0.960001 11.41C1.04 8.97 2.12 6.64 3.95 4.96C5.78 3.28 8.24 2.38 10.79 2.5C13.34 2.62 15.76 3.75 17.61 5.61L21.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);

    if (componentPages === undefined) {
        return <div style={styles.wrapper}><div style={{ padding: '20px', color: '#888', textAlign: 'center' }}>Loading component list...</div></div>;
    }

    return (
        <div 
            ref={containerRef} 
            style={wrapperStyle} 
            className={uniqueWrapperClass}
            onMouseDown={() => setIsPaneActive(true)}
        >
            <style>{scrollbarStyle}</style>
            <div style={styles.bookmarkBar} className="scrollable-tabs">
                {bookmarks.map((bookmark) => <button key={bookmark.path} style={filePath === bookmark.path ? { ...styles.bookmarkButton, ...styles.activeBookmarkButton } : styles.bookmarkButton} onClick={() => handleBookmarkClick(bookmark.path)} title={bookmark.path}>{bookmark.name}</button>)}
            </div>
            <form style={styles.loaderBar} onSubmit={handleLoadFile}>
                <input type="text" style={{ ...styles.input, ...(isInputFocused ? styles.purpleFocus : {}) }} value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter component file path..." onFocus={() => setIsInputFocused(true)} onBlur={() => setIsInputFocused(false)} />
                <button type="submit" style={styles.button}>Load</button>
                <button type="button" style={styles.button} onClick={handleCreateNewFile} title="Create a new component file">New</button>
                <button type="button" style={{ ...styles.button, backgroundColor: '#444' }} onClick={handleCopyPath} title="Copy path of the currently open note">Copy Path</button>
                <button type="button" style={styles.iconButton} onClick={toggleScreenMode} title={activeMode === 'default' ? "Enter Full Tab Mode" : "Exit Full Tab Mode"}>
                    {activeMode === 'default' ? <ExpandIcon /> : <ShrinkIcon />}
                </button>
            </form>
            <div style={{ ...styles.mainContent, position: 'relative' }} ref={mainContentRef}>
                <div style={{ ...styles.editorPane, ...editorPaneStyle }}>
                    <PlaygroundEditor
                        key={`${filePath}-${editorReloadKey}`}
                        filePath={filePath}
                        onHardReload={handleHardReload}
                        activeHeader={activeHeader}
                        setActiveHeader={setActiveHeader}
                        renderHeader={renderHeader}
                        setRenderHeader={setRenderHeader}
                        onTogglePreview={handleTogglePreview}
                        reloadKey={editorReloadKey}
                    />
                </div>
                <div style={resizerStyle} onMouseDown={handleMouseDown} onMouseEnter={() => setIsResizerHovered(true)} onMouseLeave={() => setIsResizerHovered(false)} />
                <div style={{ ...styles.previewPane, ...previewPaneStyle }}>
                    <div style={styles.previewHeader}>
                        <span style={styles.paneToggleButton} onClick={handleToggleEditor} title={paneVisibility === 'preview' ? "Show Editor" : "Hide Editor"}>&lt;</span>
                        <span style={{ flex: 1 }}>Live Preview (Component: {renderHeader || 'none'})</span>
                        <button style={{ ...styles.iconButton, padding: '4px', backgroundColor: 'transparent', border: 'none', color: '#aaa' }} onClick={() => new Notice("Please save (Ctrl+S) to rebuild the preview.")} title="Save to rebuild">
                            <ReloadIcon />
                        </button>
                    </div>
                    <div style={styles.previewContent} ref={previewContentRef}>
                        {loaderFilePath && loaderHeaderName ? <DynamicComponentLoader key={`${renderKey}-${loaderFilePath}-${loaderHeaderName}`} filePath={loaderFilePath} activeHeader={loaderHeaderName} renderKey={renderKey} /> : <p style={{ color: '#888', padding: '20px' }}>Load a file to see the preview.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- EXPORT THE MAIN COMPONENT ---
return { DatacorePlayground: LiveDevelopmentEnvironment };
```

