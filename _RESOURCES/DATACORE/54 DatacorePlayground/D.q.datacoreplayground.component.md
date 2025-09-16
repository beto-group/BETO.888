




# ViewComponent


```jsx
// -------------------------
// Live Development Environment (ViewComponent)
// -------------------------
const { useState, useEffect, useRef, useCallback, useMemo } = dc;

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
    tab: { padding: '10px 28px 10px 16px', cursor: 'pointer', color: '#888', borderBottom: '2px solid transparent', transition: 'color 0.2s, border-color 0.2s', whiteSpace: 'nowrap', fontSize: '13px', position: 'relative' },
    activeTab: { color: '#e0e0e0', borderBottom: '2px solid #8A2BE2', },
    addTabButton: { padding: '0 12px', cursor: 'pointer', color: '#888', fontSize: '20px', fontWeight: 'bold', userSelect: 'none', transition: 'color 0.2s', ':hover': { color: '#e0e0e0' } },
    renameInput: { background: 'transparent', border: 'none', outline: 'none', color: '#e0e0e0', fontSize: '13px', fontFamily: 'inherit', padding: '0', margin: '0', width: '100%', boxSizing: 'border-box' },
    tabCloseButton: { position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'transparent', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', opacity: 0.6, transition: 'background-color 0.2s, opacity 0.2s', },
    bookmarkBar: { display: 'flex', padding: '8px 12px', gap: '8px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333', alignItems: 'center', overflowX: 'auto', flexShrink: 0 },
    bookmarkButton: { padding: '4px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#2c2c2c', color: '#ccc', border: '1px solid #444', borderRadius: '4px', transition: 'background-color 0.2s, color 0.2s', whiteSpace: 'nowrap', },
    activeBookmarkButton: { backgroundColor: '#8A2BE2', color: '#ffffff', borderColor: '#8A2BE2', },
    resizer: { flex: '0 0 5px', cursor: 'col-resize', backgroundColor: '#333', backgroundClip: 'padding-box', borderLeft: '2px solid transparent', borderRight: '2px solid transparent', transition: 'background-color 0.2s', zIndex: 1, },
    resizerHover: { backgroundColor: '#8A2BE2', },
    paneToggleButton: { cursor: 'pointer', color: '#888', fontSize: '16px', fontWeight: 'bold', userSelect: 'none', transition: 'color 0.2s', padding: '0 8px', lineHeight: '1', },
};

// ... (ErrorDisplay and DynamicComponentLoader components remain unchanged) ...
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 1. ERROR DISPLAY (Helper Component) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function ErrorDisplay({ errorMessage }) {
    const errorStyles = {
        wrapper: { padding: '20px' },
        details: { fontFamily: 'sans-serif', border: '1px solid #553333', borderRadius: '8px', backgroundColor: '#2a2222', color: '#ffdddd', padding: '16px', },
        summary: { cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#ff8888', listStyle: 'none', display: 'flex', alignItems: 'center', },
        summaryText: { marginLeft: '8px', },
        content: { marginTop: '12px', borderTop: '1px solid #554444', paddingTop: '12px', color: '#e0e0e0', fontSize: '14px', },
        pre: { whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#ccc', fontSize: '13px', marginTop: '12px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontFamily: 'monospace', }
    };

    return (
        <div style={errorStyles.wrapper}>
            <details style={errorStyles.details}>
                <summary style={errorStyles.summary}>
                    <span>⚠️</span><span style={errorStyles.summaryText}>Issue Rendering</span>
                </summary>
                <div style={errorStyles.content}>
                    <p>There was an error while trying to display this component. Check the details below.</p>
                    <pre style={errorStyles.pre}>{errorMessage}</pre>
                </div>
            </details>
        </div>
    );
}


// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 2. DYNAMIC COMPONENT LOADER (Helper Component) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function DynamicComponentLoader({ filePath, activeHeader }) {
    const [LoadedComponent, setLoadedComponent] = useState(null);
    const [error, setError] = useState(null);

    const debouncedLoad = useCallback(debounce(async (path, header) => {
        try {
            const dynamicModule = await dc.require(dc.headerLink(path, header));
            if (!dynamicModule || typeof dynamicModule !== 'object') { throw new Error("File loaded but did not export a valid object. Use 'return { MyComponent, ... }'."); }
            const exportedKeys = Object.keys(dynamicModule);
            if (exportedKeys.length === 0) { throw new Error("Module has no exports. Use 'return { MyComponent }'."); }
            const Component = dynamicModule[exportedKeys[0]];
            if (typeof Component !== 'function') { throw new Error(`The first export '${exportedKeys[0]}' is not a function.`); }
            setLoadedComponent(() => Component);
            setError(null);
        } catch (err) {
            console.error("Error loading dynamic component:", err);
            setError(`Failed to load component: ${err.message}`);
            setLoadedComponent(null);
        }
    }, 100), []);

    useEffect(() => {
        if (!filePath || !activeHeader) {
            setLoadedComponent(null);
            setError(null);
            return;
        }
        setLoadedComponent(null);
        setError(null);
        debouncedLoad(filePath, activeHeader);
    }, [filePath, activeHeader, debouncedLoad]);

    if (error) return <ErrorDisplay errorMessage={error} />;
    if (LoadedComponent) return <LoadedComponent />;
    if (filePath && activeHeader) return <p style={{ color: '#888', padding: '20px' }}>Loading component...</p>;

    return <p style={{ color: '#888', padding: '20px' }}>Load a file to see the preview.</p>;
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 3. THE LIVE EDITOR (Left Pane) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function PlaygroundEditor({ filePath, onCompile, activeHeader, setActiveHeader, renderHeader, setRenderHeader, onTogglePreview, activeMode }) {
    const BOILERPLATE_CODE = `function MyComponent() {\n  return <div>Hello, World!</div>;\n}\n\nreturn { MyComponent };`;
    const MONACO_VERSION = "0.45.0";
    const SETUP_DIR = ".datacore/monaco-host";
    const HOST_FILE_VERSION = 8;
    const HOST_FILENAME_BASE = "monaco-host";
    const HOST_FILENAME = `${HOST_FILENAME_BASE}-v${HOST_FILE_VERSION}.html`;
    const HOST_FILE_PATH = `${SETUP_DIR}/${HOST_FILENAME}`;
    const CACHE_FILE_PATH = `${SETUP_DIR}/editor-cache.json`;

    const [codeBlocks, setCodeBlocks] = useState([]);
    const [status, setStatus] = useState("No file loaded.");
    const [isHostFileReady, setIsHostFileReady] = useState(false);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const iframeRef = useRef(null);
    const fullCacheRef = useRef({});
    const viewStateCache = useRef({});
    const [renamingHeader, setRenamingHeader] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [isAddingTab, setIsAddingTab] = useState(false);
    const [newTabName, setNewTabName] = useState('');

    const activeCodeBlock = useMemo(() => codeBlocks.find(b => b.header === activeHeader), [codeBlocks, activeHeader]);
    const messageContext = useMemo(() => activeHeader ? `${filePath}#${activeHeader}` : filePath, [filePath, activeHeader]);

    const saveCache = useCallback(debounce(async () => {
        try { await app.vault.adapter.write(CACHE_FILE_PATH, JSON.stringify(fullCacheRef.current, null, 2)); } catch (e) { console.error("Failed to save editor cache:", e); }
    }, 1000), []);

    const loadCache = useCallback(async () => {
        try { if (await app.vault.adapter.exists(CACHE_FILE_PATH)) { const cacheContent = await app.vault.adapter.read(CACHE_FILE_PATH); fullCacheRef.current = JSON.parse(cacheContent); } } catch (e) { console.error("Failed to load editor cache:", e); fullCacheRef.current = {}; }
    }, []);

    const updateCacheOnHeaderChange = useCallback((oldHeader, newHeader) => {
        const fileCache = fullCacheRef.current[filePath];
        if (!fileCache || !fileCache.tabs) return;
        const cachedState = fileCache.tabs[oldHeader];
        delete fileCache.tabs[oldHeader];
        delete viewStateCache.current[oldHeader];
        if (newHeader && cachedState) { fileCache.tabs[newHeader] = cachedState; viewStateCache.current[newHeader] = cachedState; }
        if (fileCache.lastActive === oldHeader) { fileCache.lastActive = newHeader || (codeBlocks.length > 0 ? codeBlocks[0].header : null); }
        saveCache();
    }, [filePath, codeBlocks, saveCache]);

    useEffect(() => { loadCache(); const setupHostFile = async () => { const adapter = app.vault.adapter; try { if (await adapter.exists(SETUP_DIR)) { const dirContents = await adapter.list(SETUP_DIR); for (const path of dirContents.files) { const name = path.split('/').pop(); if (name.startsWith(HOST_FILENAME_BASE) && name !== HOST_FILENAME) await adapter.remove(path); } } } catch (error) { console.warn("Datacore Editor: Failed to clean up old host files.", error); } if (await adapter.exists(HOST_FILE_PATH)) { setIsHostFileReady(true); return; } setStatus("Performing first-time editor setup..."); try { if (!await adapter.exists(SETUP_DIR)) await adapter.mkdir(SETUP_DIR); const monacoLoaderUrl = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs/loader.js`; const monacoBasePath = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs`; const hostHtmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body,html{margin:0;padding:0;height:100%;overflow:hidden}#container{width:100%;height:100%}</style></head><body><div id="container"></div><script src="${monacoLoaderUrl}"></script><script>let editor=null;const params=new URLSearchParams(window.location.search),initialTheme=params.get("theme");let currentContext=params.get("context"),initialCode=params.get("code")||"";function debounce(t,n){let e;return function(...o){const i=()=> {e=null,t(...o)};clearTimeout(e),e=setTimeout(i,n)}}const reportState=debounce(()=>{if(!editor)return;const t=editor.saveViewState();parent.postMessage({type:"state-changed",value:t,context:currentContext},"*")},250);require.config({paths:{vs:"${monacoBasePath}"}});require(["vs/editor/editor.main"],(function(){editor=monaco.editor.create(document.getElementById("container"),{value:initialCode,language:"javascript",theme:initialTheme,automaticLayout:!0,minimap:{enabled:!0},wordWrap:"on",fontSize:14,fontFamily:"monospace"}),editor.onDidChangeModelContent((()=>parent.postMessage({type:"change",value:editor.getValue(),context:currentContext},"*"))),editor.onDidScrollChange(reportState),editor.onDidChangeCursorPosition(reportState),window.addEventListener("message",(e=>{const{type:t,value:o,context:s}=e.data;if("set-theme"===t&&monaco.editor.setTheme)return monaco.editor.setTheme(o);if("relayout"===t&&editor)return editor.layout();if(s===currentContext&&"change-value"===t&&editor&&editor.getValue()!==o)return editor.setValue(o);if("set-content"===t&&editor&&o)return o.code!==editor.getValue()&&editor.setValue(o.code),currentContext=o.context,void("state"in o&&o.state&&editor.restoreViewState(o.state));"restore-state"===t&&editor&&o&&editor.restoreViewState(o)})),parent.postMessage({type:"editor-ready",context:currentContext},"*")}));</script></body></html>`; await adapter.write(HOST_FILE_PATH, hostHtmlContent); setIsHostFileReady(true); } catch (error) { console.error("Monaco host setup failed:", error); setStatus(`Setup failed: ${error.message}`); } }; setupHostFile(); return () => { saveCache(); }; }, []);

    const parseFileContent = (content) => { const regex = /^#\s+(.*?)\s*\n+```jsx\r?\n([\s\S]*?)\r?\n```/gm; const blocks = []; let match; while ((match = regex.exec(content)) !== null) { blocks.push({ header: match[1].trim(), code: match[2].trim() }); } return blocks.length > 0 ? blocks : [{ header: "ViewComponent", code: BOILERPLATE_CODE }]; };
    const rebuildFileContent = (blocks) => { const frontmatter = "---\ntags: datacore-component\n---\n\n"; const content = blocks.map(block => `# ${block.header}\n\n\`\`\`jsx\n${block.code.trim()}\n\`\`\``).join('\n\n\n'); return frontmatter + content; };

    useEffect(() => {
        if (!filePath) {
            setCodeBlocks([]);
            setActiveHeader(null);
            setRenderHeader(null);
            setStatus("No file loaded.");
            return;
        }
        const loadFile = async () => {
            setStatus("Loading file...");
            setCodeBlocks([]);
            setActiveHeader(null);
            setRenderHeader(null);
            const fileCache = fullCacheRef.current[filePath] || {};
            viewStateCache.current = fileCache.tabs || {};
            let fileContent = "";
            try {
                if (await app.vault.adapter.exists(filePath)) {
                    fileContent = await app.vault.adapter.read(filePath);
                } else {
                    setStatus("File not found. Ready to create new file.");
                }
            } catch (e) {
                console.error("Load Error:", e);
                setStatus(`Error loading: ${e.message}`);
            }
            const blocks = parseFileContent(fileContent);
            setCodeBlocks(blocks);
            const componentToRender = blocks.find(b => b.header.toLowerCase().includes("viewcomponent") || b.header.toLowerCase().includes("view"))?.header || "ViewComponent";
            setRenderHeader(componentToRender);
            const lastActiveTab = fileCache.lastActive;
            const initialActiveTab = blocks.find(b => b.header === lastActiveTab)?.header || blocks.find(b => b.header === componentToRender)?.header || blocks[0]?.header || null;
            setActiveHeader(initialActiveTab);
            setStatus("Ready");
        };
        loadFile();
    }, [filePath]);

    // --- START: ROBUST IFRAME HANDLING LOGIC ---

    // Effect 1: Handles all incoming messages from the iframe.
    useEffect(() => {
        const handleMessage = (event) => {
            if (!event.data || !iframeRef.current || event.source !== iframeRef.current.contentWindow) return;

            const { type, value, context } = event.data;

            if (type === 'editor-ready') {
                setIsEditorReady(true);
                // CRITICAL FIX: Re-initialize the editor every time it reports ready.
                // This handles initial load, and also reloads from window mode switches.
                const win = iframeRef.current.contentWindow;
                win.postMessage({ type: 'set-theme', value: 'vs-dark' }, '*');
                if (activeCodeBlock) {
                    win.postMessage({
                        type: 'set-content',
                        value: {
                            code: activeCodeBlock.code,
                            context: messageContext,
                            state: viewStateCache.current[activeHeader] || null
                        }
                    }, '*');
                }
                return;
            }

            if (type === 'state-changed' && context === messageContext) {
                const header = activeHeader;
                if (!header) return;
                viewStateCache.current[header] = value;
                if (!fullCacheRef.current[filePath]) { fullCacheRef.current[filePath] = { lastActive: header, tabs: {} }; }
                if (!fullCacheRef.current[filePath].tabs) { fullCacheRef.current[filePath].tabs = {}; }
                fullCacheRef.current[filePath].tabs[header] = value;
                fullCacheRef.current[filePath].lastActive = header;
                saveCache();
                return;
            }
            
            if (context !== messageContext) return;
            
            if (type === 'change') {
                setCodeBlocks(prevBlocks => prevBlocks.map(block => block.header === activeHeader ? { ...block, code: value } : block));
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [filePath, activeHeader, activeCodeBlock, messageContext, saveCache]);


    // Effect 2: Handles user actions like switching tabs.
    // This sends new content to the already-initialized editor.
    useEffect(() => {
        if (isEditorReady && iframeRef.current?.contentWindow && activeCodeBlock) {
             iframeRef.current.contentWindow.postMessage({
                 type: 'set-content',
                 value: {
                     code: activeCodeBlock.code,
                     context: messageContext,
                     state: viewStateCache.current[activeHeader] || null
                 }
             }, '*');
             if (fullCacheRef.current[filePath]) {
                 fullCacheRef.current[filePath].lastActive = activeHeader;
                 saveCache();
             }
        }
    }, [isEditorReady, activeCodeBlock]); // Note: Doesn't run on initial load, only when activeCodeBlock changes AFTER editor is ready.

    // --- END: ROBUST IFRAME HANDLING LOGIC ---

    const handleSave = useCallback(async (blocksToSave) => {
        const blocks = blocksToSave || codeBlocks; if (!filePath || blocks.length === 0) return; setStatus("Saving and compiling..."); try { const fullFileContent = rebuildFileContent(blocks); await app.vault.adapter.write(filePath, fullFileContent); app.plugins.plugins.datacore?.index?.touch(filePath); setStatus("Saved successfully ✅"); if (onCompile) onCompile(); setTimeout(() => setStatus(s => s === "Saved successfully ✅" ? "Ready" : s), 2000); } catch (e) { setStatus(`Error saving: ${e.message}`); }
    }, [filePath, codeBlocks, onCompile]);

    useEffect(() => { const handleKeyDown = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); } }; document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }, [handleSave]);

    const iframeSrc = useMemo(() => {
        if (!isHostFileReady) return "about:blank";
        const fileUri = app.vault.adapter.getResourcePath(HOST_FILE_PATH);
        const params = new URLSearchParams({ theme: "vs-dark", code: " " });
        return `${fileUri}?${params.toString()}`;
    }, [isHostFileReady]);

    const handleInitiateAddTab = () => { setIsAddingTab(true); setNewTabName("NewComponent"); };

    const handleCommitAddTab = () => {
        const finalTabName = newTabName.trim(); setIsAddingTab(false); setNewTabName('');
        if (!finalTabName || codeBlocks.some(b => b.header === finalTabName)) { if (finalTabName) new Notice("A component with this name already exists.", 3000); return; }
        const newBoilerplate = `function ${finalTabName}() {\n  return <div>Hello, World!</div>;\n}\n\nreturn { ${finalTabName} };`;
        const newBlock = { header: finalTabName, code: newBoilerplate };
        const newBlocks = [...codeBlocks, newBlock];
        setCodeBlocks(newBlocks); setActiveHeader(finalTabName); handleSave(newBlocks);
    };

    const handleTabDoubleClick = (header) => { setRenamingHeader(header); setRenameValue(header); };

    const handleRenameCommit = () => {
        const oldHeader = renamingHeader; const newHeader = renameValue.trim(); setRenamingHeader(null);
        if (!newHeader || oldHeader === newHeader) return;
        if (codeBlocks.some(b => b.header === newHeader)) { new Notice("A component with this name already exists.", 3000); return; }
        const renameRegex = new RegExp('\\b' + oldHeader + '\\b', 'g');
        const newBlocks = codeBlocks.map(b => { if (b.header === oldHeader) { const updatedCode = b.code.replace(renameRegex, newHeader); return { ...b, header: newHeader, code: updatedCode }; } return b; });
        setCodeBlocks(newBlocks); updateCacheOnHeaderChange(oldHeader, newHeader);
        if (activeHeader === oldHeader) setActiveHeader(newHeader);
        if (renderHeader === oldHeader) setRenderHeader(newHeader);
        handleSave(newBlocks);
    };

    const handleDeleteTab = (headerToDelete) => {
        if (codeBlocks.length <= 1) { new Notice("You cannot delete the last component.", 3000); return; }
        const indexToDelete = codeBlocks.findIndex(b => b.header === headerToDelete);
        const newBlocks = codeBlocks.filter(b => b.header !== headerToDelete);
        if (activeHeader === headerToDelete) { const newActiveIndex = Math.max(0, indexToDelete - 1); setActiveHeader(newBlocks[newActiveIndex]?.header || null); }
        if (renderHeader === headerToDelete) { const isViewComponent = h => h.toLowerCase().includes("viewcomponent") || h.toLowerCase().includes("view"); const newRenderHeader = newBlocks.find(b => isViewComponent(b.header))?.header || newBlocks[0]?.header || null; setRenderHeader(newRenderHeader); }
        setCodeBlocks(newBlocks); updateCacheOnHeaderChange(headerToDelete, null); handleSave(newBlocks);
    };

    return (
        <div style={styles.editorPane}>
            <div style={styles.tabBar} className="scrollable-tabs">
                {codeBlocks.map(block => (
                    <div key={block.header} style={{ ...styles.tab, ...(block.header === activeHeader ? styles.activeTab : {}) }} onClick={() => renamingHeader === null && !isAddingTab && setActiveHeader(block.header)} onDoubleClick={() => handleTabDoubleClick(block.header)} >
                        {renamingHeader === block.header ? (<input type="text" style={styles.renameInput} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={handleRenameCommit} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} autoFocus />) : (block.header)}
                        <span style={styles.tabCloseButton} title={`Delete ${block.header}`} onClick={(e) => { e.stopPropagation(); handleDeleteTab(block.header); }}>&times;</span>
                    </div>
                ))}
                {filePath && (isAddingTab ? (<div style={{ ...styles.tab, paddingRight: '12px' }}> <input type="text" style={styles.renameInput} value={newTabName} onChange={(e) => setNewTabName(e.target.value)} onBlur={handleCommitAddTab} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} autoFocus /> </div>) : (<div style={styles.addTabButton} onClick={handleInitiateAddTab} title="Add New Component">+</div>))}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
                {iframeSrc === "about:blank" || !filePath ? (<div style={{ padding: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>{status}</div>) : (<iframe style={{ width: '100%', height: '100%', border: 'none' }} src={iframeSrc} ref={iframeRef} name={`monaco-editor-${filePath}`} />)}
            </div>
            <div style={styles.statusBar}>
                <span>{status}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button style={styles.button} onClick={() => handleSave()} disabled={!filePath}>Save & Compile (Ctrl+S)</button>
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
    const [isFocused, setIsFocused] = useState(false);
    const [activeHeader, setActiveHeader] = useState(null);
    const [renderHeader, setRenderHeader] = useState(null);
    const [paneVisibility, setPaneVisibility] = useState('both');
    const [editorPaneWidth, setEditorPaneWidth] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const [isResizerHovered, setIsResizerHovered] = useState(false);

    const containerRef = useRef(null);
    const mainContentRef = useRef(null);

    const [activeMode, setActiveMode] = useState('default');
    const originalParentStateRef = useRef(null);

    const activateWindowMode = useCallback(() => {
        const container = containerRef.current;
        if (!container || activeMode !== 'default') return;

        const placeholder = document.createElement('div');
        placeholder.style.display = 'none';
        container.parentNode.insertBefore(placeholder, container);
        originalParentStateRef.current = { parent: container.parentNode, placeholder };

        document.body.appendChild(container);
        Object.assign(container.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw',
            height: '100vh', zIndex: '10000', borderRadius: '0', border: 'none',
            backgroundColor: '#0a0a0a',
        });
        setActiveMode('window');
    }, [activeMode]);

    const deactivateWindowMode = useCallback(() => {
        const container = containerRef.current;
        const originalState = originalParentStateRef.current;
        if (!container || !originalState || activeMode !== 'window') return;

        originalState.placeholder.parentNode.replaceChild(container, originalState.placeholder);
        originalParentStateRef.current = null;

        // **FIX: This is the robust fix for the white mode issue.**
        // We remove the entire style attribute, forcing React to re-apply it from the style prop.
        container.removeAttribute('style');

        setActiveMode('default');
    }, [activeMode]);

    useEffect(() => {
        return () => { if (originalParentStateRef.current) { deactivateWindowMode(); } };
    }, [deactivateWindowMode]);

    const uniqueWrapperClass = "live-dev-wrapper-" + useRef(Math.random().toString(36).substr(2, 9)).current;
    const scrollbarStyle = `.${uniqueWrapperClass} .scrollable-tabs::-webkit-scrollbar { height: 6px; } .${uniqueWrapperClass} .scrollable-tabs::-webkit-scrollbar-track { background: #1a1a1a; } .${uniqueWrapperClass} .scrollable-tabs::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; } .${uniqueWrapperClass} .scrollable-tabs { scrollbar-width: thin; scrollbar-color: #555 #1a1a1a; }`;

    const componentPages = dc.useQuery(`@page AND path("_RESOURCES/DATACORE") AND $file.contains(".component")`);
    const formatBookmarkName = (path) => { if (!path) return "Untitled"; const filename = path.split('/').pop() || ''; let name = filename.replace(/^D\.q\./i, '').replace(/\.component\.v\d+/i, '').replace(/\.component/i, '').replace(/\.md$/i, ''); name = name.replace(/([A-Z])/g, ' $1').trim(); return name.charAt(0).toUpperCase() + name.slice(1); };
    const bookmarks = useMemo(() => { if (!componentPages || componentPages.length === 0) return []; return componentPages.map(page => ({ name: formatBookmarkName(page.$path), path: page.$path })).sort((a, b) => a.name.localeCompare(b.name)); }, [componentPages]);
    useEffect(() => { if (bookmarks.length > 0 && !filePath) { const initialPath = bookmarks[0].path; setFilePath(initialPath); setInputValue(initialPath); } }, [bookmarks, filePath]);

    const handleMouseDown = useCallback((e) => { e.preventDefault(); setIsResizing(true); }, []);
    const handleMouseUp = useCallback(() => setIsResizing(false), []);
    const handleMouseMove = useCallback((e) => {
        if (!isResizing || !mainContentRef.current) return;
        const container = mainContentRef.current;
        const rect = container.getBoundingClientRect();
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
        setEditorPaneWidth(Math.max(10, Math.min(90, newWidth)));
    }, [isResizing]);

    useEffect(() => { if (isResizing) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); } return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }; }, [isResizing, handleMouseMove, handleMouseUp]);

    const handleToggleEditor = () => setPaneVisibility(prev => prev === 'preview' ? 'both' : 'preview');
    const handleTogglePreview = () => setPaneVisibility(prev => prev === 'editor' ? 'both' : 'editor');

    const editorPaneStyle = { display: paneVisibility === 'preview' ? 'none' : 'flex', flex: paneVisibility === 'editor' ? '1 1 100%' : `0 0 ${editorPaneWidth}%`, };
    const previewPaneStyle = { display: paneVisibility === 'editor' ? 'none' : 'flex', flex: paneVisibility === 'preview' ? '1 1 100%' : '1 1 auto', };
    const resizerStyle = { ...styles.resizer, ...(isResizerHovered ? styles.resizerHover : {}), display: paneVisibility !== 'both' ? 'none' : 'flex', };

    useEffect(() => { setActiveHeader(null); setRenderHeader(null); }, [filePath]);
    const handleLoadFile = (e) => { e.preventDefault(); setFilePath(inputValue); setRenderKey(prev => prev + 1); };
    const handleCompile = useCallback(() => { setRenderKey(prev => prev + 1); }, []);
    const handleBookmarkClick = (path) => { setInputValue(path); setFilePath(path); setRenderKey(prev => prev + 1); };
    const handleCopyPath = () => { try { const activeFile = dc.app.workspace.getActiveFile(); if (activeFile) { navigator.clipboard.writeText(activeFile.path); new Notice(`Path copied: ${activeFile.path}`, 4000); } else { new Notice("Could not determine the active file path.", 4000); } } catch (error) { console.error("Error getting file path:", error); new Notice("Error: Could not access app context to find file path.", 4000); } };

    const handleCreateNewFile = async () => {
        const DEFAULT_PATH = "_RESOURCES/DATACORE/";
        let rawFileName = prompt("Enter new component name (e.g., MyNewComponent):");
        if (!rawFileName || rawFileName.trim() === "") { new Notice("File creation cancelled.", 2000); return; }
        let componentName = rawFileName.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        componentName = componentName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
        if (!componentName) { new Notice("Invalid component name.", 3000); return; }
        const finalPath = `${DEFAULT_PATH}${componentName}.component.md`;
        const adapter = app.vault.adapter;
        if (await adapter.exists(finalPath)) { new Notice(`File already exists: ${finalPath}`, 4000); setInputValue(finalPath); setFilePath(finalPath); return; }
        const boilerplateCode = `function ${componentName}() {\n  return <div>Hello from ${componentName}!</div>;\n}\n\nreturn { ${componentName} };`;
        const fileContent = `---\ntags: datacore-component\n---\n\n# ${componentName}\n\n\`\`\`jsx\n${boilerplateCode}\n\`\`\``;
        try {
            if (!await adapter.exists(DEFAULT_PATH)) await adapter.mkdir(DEFAULT_PATH);
            await adapter.write(finalPath, fileContent);
            new Notice(`Component created: ${finalPath}`, 4000);
            setInputValue(finalPath); setFilePath(finalPath); setRenderKey(prev => prev + 1);
        } catch (error) { console.error("Error creating new component file:", error); new Notice("Failed to create file. Check console for details.", 5000); }
    };

    const ExpandIcon = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 9.5V14H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.5 14H14V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 6.5V2H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.5 2H2V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    const ShrinkIcon = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 1.5V6H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M1.5 9.5H6V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.5 14V9.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 6.5H9.5V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>);

    return (
        <div ref={containerRef} style={styles.wrapper} className={uniqueWrapperClass}>
            <style>{scrollbarStyle}</style>

            <div style={styles.bookmarkBar} className="scrollable-tabs">
                {bookmarks.map((bookmark) => <button key={bookmark.path} style={filePath === bookmark.path ? { ...styles.bookmarkButton, ...styles.activeBookmarkButton } : styles.bookmarkButton} onClick={() => handleBookmarkClick(bookmark.path)} title={bookmark.path}>{bookmark.name}</button>)}
            </div>

            <form style={styles.loaderBar} onSubmit={handleLoadFile}>
                <input type="text" style={{ ...styles.input, ...(isFocused ? styles.purpleFocus : {}) }} value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter component file path..." onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
                <button type="submit" style={styles.button}>Load</button>
                <button type="button" style={styles.button} onClick={handleCreateNewFile} title="Create a new component file">New</button>
                <button type="button" style={{ ...styles.button, backgroundColor: '#444' }} onClick={handleCopyPath} title="Copy path of the currently open note">Copy Path</button>

                <button
                    type="button"
                    style={styles.iconButton}
                    onClick={activeMode === 'default' ? activateWindowMode : deactivateWindowMode}
                    title={activeMode === 'default' ? "Enter Window Mode" : "Exit Window Mode"}
                >
                    {activeMode === 'default' ? <ExpandIcon /> : <ShrinkIcon />}
                </button>
            </form>

            <div style={styles.mainContent} ref={mainContentRef}>
                <div style={{ ...styles.editorPane, ...editorPaneStyle }}>
                    <PlaygroundEditor
                        filePath={filePath}
                        onCompile={handleCompile}
                        activeHeader={activeHeader}
                        setActiveHeader={setActiveHeader}
                        renderHeader={renderHeader}
                        setRenderHeader={setRenderHeader}
                        onTogglePreview={handleTogglePreview}
                        activeMode={activeMode}
                    />
                </div>
                <div style={resizerStyle} onMouseDown={handleMouseDown} onMouseEnter={() => setIsResizerHovered(true)} onMouseLeave={() => setIsResizerHovered(false)} />
                <div style={{ ...styles.previewPane, ...previewPaneStyle }}>
                    <div style={styles.previewHeader}>
                        <span style={styles.paneToggleButton} onClick={handleToggleEditor} title={paneVisibility === 'preview' ? "Show Editor" : "Hide Editor"}>&lt;</span>
                        <span style={{ flex: 1 }}>Live Preview (Component: {renderHeader || 'none'})</span>
                        <span style={{ ...styles.paneToggleButton, visibility: 'hidden' }}>&gt;</span>
                    </div>
                    <div style={styles.previewContent}>
                        <DynamicComponentLoader key={`${renderKey}-${renderHeader}`} filePath={filePath} activeHeader={renderHeader} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- EXPORT THE MAIN COMPONENT ---
return { DatacorePlayground: LiveDevelopmentEnvironment };
```

