


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
    wrapper: { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', fontFamily: 'var(--font-interface)', backgroundColor: 'var(--background-primary)', color: 'var(--text-normal)', position: 'relative', boxSizing: 'border-box', },
    loaderBar: { display: 'flex', padding: '12px', gap: '8px', backgroundColor: 'var(--background-secondary)', borderBottom: '1px solid var(--background-modifier-border)', alignItems: 'center', },
    mainContent: { flex: 1, display: 'flex', overflow: 'hidden', },
    input: { flex: 1, padding: '8px 12px', fontSize: '14px', border: '1px solid var(--background-modifier-border)', borderRadius: '4px', backgroundColor: 'var(--background-primary)', color: 'var(--text-normal)', outline: 'none', },
    button: { padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: 'var(--interactive-normal)', color: 'var(--text-normal)', border: '1px solid var(--background-modifier-border)', borderRadius: '4px', transition: 'background-color 0.2s', },
    iconButton: { padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'var(--interactive-normal)', color: 'var(--text-normal)', border: '1px solid var(--background-modifier-border)', borderRadius: '4px', transition: 'background-color 0.2s', },
    editorPane: { flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--background-modifier-border)', backgroundColor: 'var(--background-primary)', minWidth: 0 },
    statusBar: { padding: '8px 12px', backgroundColor: 'var(--background-secondary)', borderTop: '1px solid var(--background-modifier-border)', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', },
    previewPane: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background-primary-alt)', position: 'relative', minWidth: 0 },
    previewHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--background-secondary)', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', borderBottom: '1px solid var(--background-modifier-border)', },
    previewContent: { flex: 1, position: 'relative', overflow: 'auto', padding: '10px', },
    purpleFocus: { outline: '2px solid var(--color-accent)', boxShadow: '0 0 5px var(--color-accent)', },
    tabBar: { display: 'flex', backgroundColor: 'var(--background-secondary)', borderBottom: '1px solid var(--background-modifier-border)', overflowX: 'auto', alignItems: 'center', flexShrink: 0 },
    tab: { padding: '10px 48px 10px 16px', cursor: 'pointer', color: 'var(--text-muted)', borderBottom: '2px solid transparent', transition: 'color 0.2s, border-color 0.2s', whiteSpace: 'nowrap', fontSize: '13px', position: 'relative' },
    activeTab: { color: 'var(--text-normal)', borderBottom: '2px solid var(--color-accent)', },
    addTabButton: { padding: '0 12px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px', fontWeight: 'bold', userSelect: 'none', transition: 'color 0.2s', ':hover': { color: 'var(--text-normal)' } },
    renameInput: { background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-normal)', fontSize: '13px', fontFamily: 'inherit', padding: '0', margin: '0', width: '100%', boxSizing: 'border-box' },
    tabCopyButton: { position: 'absolute', right: '25px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', opacity: 0.6, transition: 'background-color 0.2s, opacity 0.2s', },
    tabCloseButton: { position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', opacity: 0.6, transition: 'background-color 0.2s, opacity 0.2s', },
    bookmarkBar: { display: 'flex', padding: '8px 12px', gap: '8px', backgroundColor: 'var(--background-secondary)', borderBottom: '1px solid var(--background-modifier-border)', alignItems: 'center', overflowX: 'auto', flexShrink: 0 },
    bookmarkButton: { padding: '4px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: 'var(--background-primary)', color: 'var(--text-normal)', border: '1px solid var(--background-modifier-border)', borderRadius: '4px', transition: 'background-color 0.2s, color 0.2s', whiteSpace: 'nowrap', },
    activeBookmarkButton: { backgroundColor: 'var(--interactive-accent)', color: 'var(--text-on-accent)', borderColor: 'var(--interactive-accent)', },
    resizer: { flex: '0 0 5px', cursor: 'col-resize', backgroundColor: 'var(--background-modifier-border)', backgroundClip: 'padding-box', borderLeft: '2px solid transparent', borderRight: '2px solid transparent', transition: 'background-color 0.2s', zIndex: 1, },
    resizerHover: { backgroundColor: 'var(--color-accent)', },
    paneToggleButton: { cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', fontWeight: 'bold', userSelect: 'none', transition: 'color 0.2s', padding: '0 8px', lineHeight: '1', },
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
function DynamicComponentLoader({ filePath, contextPath, activeHeader, renderKey, componentProps = {} }) {
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
                // [CACHE-BUSTING] Clear Datacore's module cache for this file
                // This ensures we always get fresh code after saves
                const resolvedPath = dc.resolvePath(filePath);
                
                // Clear the cache for this specific file path
                if (dc.api?.cache) {
                    // Try to clear from Datacore's internal cache
                    const cacheKey = resolvedPath + "#" + activeHeader;
                    if (dc.api.cache.delete) {
                        dc.api.cache.delete(cacheKey);
                    }
                }
                
                // Force a fresh require with cache buster in the URL
                const cacheBuster = `${renderKey}-${Date.now()}`;
                const headerLink = dc.headerLink(resolvedPath, activeHeader);
                
                console.log(`[DynamicComponentLoader] Loading: ${headerLink} (key: ${cacheBuster})`);
                console.log(`[DynamicComponentLoader] Context path: ${contextPath || filePath}`);
                
                const dynamicModule = await dc.require(headerLink);
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
    }, [filePath, contextPath, activeHeader, renderKey]); // Depend on renderKey to force a full reload on save

    if (loadError) {
        return <ErrorDisplay errorMessage={loadError} />;
    }
    
    if (LoadedComponent) {
        // CRITICAL FIX: Create a modified dc context that hijacks useCurrentPath()
        // This makes components think they're running from their actual file location
        // instead of the temp file or playground location
            const ContextHijacker = () => {
            // Store original dc.useCurrentPath
            const originalUseCurrentPath = dc.useCurrentPath;
            
            // Override dc.useCurrentPath to return the original context path
            dc.useCurrentPath = () => contextPath || filePath;
            
            // Cleanup: restore original after component unmounts
            dc.useEffect(() => {
                return () => {
                    dc.useCurrentPath = originalUseCurrentPath;
                };
            }, []);
            
            return <LoadedComponent {...componentProps} />;
        };
        
        return (
            <ErrorBoundary renderKey={renderKey}>
                <ContextHijacker />
            </ErrorBoundary>
        );
    }
    
    return <p style={{ color: '#888', padding: '20px' }}>{(filePath && activeHeader) ? 'Loading component...' : 'Load a file to see the preview.'}</p>;
}


// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 3. THE LIVE EDITOR (Left Pane) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function PlaygroundEditor({ filePath, onHardReload, activeHeader, setActiveHeader, renderHeader, setRenderHeader, onTogglePreview, reloadKey, localTheme, monacoTheme, editorSaveRef }) {
    const BOILERPLATE_CODE = `function MyComponent() {\n  return <div>Hello, World!</div>;\n}\n\nreturn { MyComponent };`;
    const MONACO_VERSION = "0.45.0";
    const SETUP_DIR_BASE = ".datacore/playground";
    const SETUP_DIR = `${SETUP_DIR_BASE}/monaco-host`;
    const HOST_FILE_VERSION = 16;
    const HOST_FILENAME_BASE = "monaco-host";
    const HOST_FILENAME = `${HOST_FILENAME_BASE}-v${HOST_FILE_VERSION}.html`;
    const HOST_FILE_PATH = `${SETUP_DIR}/${HOST_FILENAME}`;
    const CACHE_FILE_PATH = `${SETUP_DIR_BASE}/editor-cache.json`;
    const TEMP_DIR = `_RESOURCES/DATACORE/COMPONENTS/TEMP`;
    const TEMP_FILE_PREFIX = "_temp-"; // Files starting with _ are often treated as system files
    
    const [lastTempFile, setLastTempFile] = useState(null);

    // === STATE MANAGEMENT (Separated by concern) ===
    // Code blocks state (only updated on file load or tab actions like add/rename/delete)
    const [codeBlocks, setCodeBlocks] = useState([]);
    // Live code ref (updated on every keystroke, does NOT trigger re-renders)
    const codeBlocksRef = useRef([]);
    
    const [status, setStatus] = useState("No file loaded.");
    const [isHostFileReady, setIsHostFileReady] = useState(false);
    const iframeRef = useRef(null);
    window.iframeRef = iframeRef;
    const fullCacheRef = useRef({});
    const viewStateCache = useRef({});
    const [renamingHeader, setRenamingHeader] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [isAddingTab, setIsAddingTab] = useState(false);
    const [newTabName, setNewTabName] = useState('');

    // === REFS (Don't trigger re-renders) ===
    const isEditorReadyRef = useRef(false);
    const pendingContentRef = useRef(null);
    const lastSentContext = useRef(null);
    const newTabInputRef = useRef(null);
    const performSaveRef = useRef(null);
    const isSavingRef = useRef(false);

    // === UTILITY FUNCTIONS (Pure, no side effects) ===
    const parseFileContent = (content) => { 
        // Support both # and ## headers (H1 and H2)
        const regex = /^#{1,2}\s+(.*?)\s*\n+```jsx\r?\n([\s\S]*?)\r?\n```/gm; 
        const blocks = []; 
        let match; 
        while ((match = regex.exec(content)) !== null) { 
            blocks.push({ header: match[1].trim(), code: match[2].trim() }); 
        } 
        console.log(`[parseFileContent] Found ${blocks.length} code blocks:`, blocks.map(b => b.header));
        return blocks.length > 0 ? blocks : [{ header: "ViewComponent", code: BOILERPLATE_CODE }]; 
    };
    
    const rebuildFileContent = (blocks) => { 
        const frontmatter = "---\ntags: datacore-component\n---\n\n"; 
        const content = blocks.map(block => `# ${block.header}\n\n\`\`\`jsx\n${block.code.trim()}\n\`\`\``).join('\n\n\n'); 
        return frontmatter + content; 
    };

    // === CACHE MANAGEMENT (Isolated concern) ===
    const debouncedSaveCache = useCallback(debounce(async () => {
        try { 
            if (typeof app !== 'undefined' && app.vault?.adapter) 
                await app.vault.adapter.write(CACHE_FILE_PATH, JSON.stringify(fullCacheRef.current, null, 2)); 
        } catch (e) { 
            console.error("[PlaygroundEditor] Failed to save editor cache:", e); 
        }
    }, 1000), []);

    const saveCacheNow = useCallback(async () => {
        try { 
            if (typeof app !== 'undefined' && app.vault?.adapter) 
                await app.vault.adapter.write(CACHE_FILE_PATH, JSON.stringify(fullCacheRef.current, null, 2)); 
        } catch (e) { 
            console.error("[PlaygroundEditor] Failed to save editor cache NOW:", e); 
        }
    }, []);

    const loadCache = useCallback(async () => {
        try { 
            if (typeof app !== 'undefined' && app.vault?.adapter && await app.vault.adapter.exists(CACHE_FILE_PATH)) 
                fullCacheRef.current = JSON.parse(await app.vault.adapter.read(CACHE_FILE_PATH)); 
        } catch (e) { 
            console.error("[PlaygroundEditor] Failed to load editor cache:", e); 
            fullCacheRef.current = {}; 
        }
    }, []);

    // === EDITOR COMMUNICATION (Isolated from state updates) ===
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

    // === TEMP FOLDER CLEANUP (Clear all temp files on mount) ===
    useEffect(() => {
        const cleanupTempFolder = async () => {
            if (typeof app === 'undefined' || !app.vault?.adapter) return;
            const adapter = app.vault.adapter;
            try {
                if (await adapter.exists(TEMP_DIR)) {
                    const dirContents = await adapter.list(TEMP_DIR);
                    for (const file of dirContents.files) {
                        const filename = file.split('/').pop();
                        // Match current prefix OR legacy prefixes (temp-, .temp-, ~temp-)
                        const isTempFile = filename.startsWith(TEMP_FILE_PREFIX) || 
                                         filename.startsWith('temp-') || 
                                         filename.startsWith('.temp-') || 
                                         filename.startsWith('~temp-');
                        if (isTempFile) {
                            await adapter.trashLocal(file);
                        }
                    }
                }
            } catch (error) {
                console.error("[PlaygroundEditor] Failed to cleanup temp folder:", error);
            }
        };
        cleanupTempFolder();
    }, []); // Run once on mount

    // === MONACO HOST FILE SETUP (One-time initialization) ===
    useEffect(() => {
        loadCache();
        const setupHostFile = async () => {
            if (typeof app === 'undefined' || !app.vault?.adapter) { 
                setStatus("Setup failed: Obsidian app context not available."); 
                return; 
            }
            const adapter = app.vault.adapter;
            try { 
                if (!(await adapter.exists(SETUP_DIR_BASE))) await adapter.mkdir(SETUP_DIR_BASE);
                if (await adapter.exists(SETUP_DIR)) { 
                    const dirContents = await adapter.list(SETUP_DIR); 
                    for (const path of dirContents.files) { 
                        const name = path.split('/').pop(); 
                        if (name.startsWith(HOST_FILENAME_BASE) && name !== HOST_FILENAME) 
                            await adapter.remove(path); 
                    } 
                } 
            } catch (error) { 
                console.warn("[PlaygroundEditor] Failed to clean up old host files.", error); 
            }
            const needsRecreation = !(await adapter.exists(HOST_FILE_PATH));
            if (!needsRecreation) { 
                setIsHostFileReady(true); 
                return; 
            }
            setStatus("Performing first-time editor setup...");
            try {
                if (!await adapter.exists(SETUP_DIR)) await adapter.mkdir(SETUP_DIR);
                const monacoLoaderUrl = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs/loader.js`;
                const monacoBasePath = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs`;
                                const hostHtmlContent = `<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8"/>
        <style>
            body,html{margin:0;padding:0;height:100%;overflow:hidden}
            #container{width:100%;height:100%}
        </style>
    </head>
    <body>
        <div id="container"></div>
        <script src="${monacoLoaderUrl}"></script>
        <script>
            let editor = null;
            const params = new URLSearchParams(window.location.search);
            const initialTheme = params.get("theme");
            let currentContext = params.get("context");
            let initialCode = params.get("code") || "";
            let lastContext = null;
            function debounce(t, n) {
                let e;
                return function(...o) {
                    const i = () => { e = null; t(...o); };
                    clearTimeout(e), e = setTimeout(i, n);
                }
            }
            const reportState = debounce(() => {
                if (!editor) return;
                const t = editor.saveViewState();
                parent.postMessage({ type: "state-changed", value: t, context: currentContext }, "*");
            }, 250);
            require.config({ paths: { vs: "${monacoBasePath}" } });
            require(["vs/editor/editor.main"], function() {
                editor = monaco.editor.create(document.getElementById("container"), {
                    value: initialCode,
                    language: "javascript",
                    theme: initialTheme,
                    automaticLayout: true,
                    minimap: { enabled: true },
                    wordWrap: "on",
                    fontSize: 14,
                    fontFamily: "monospace"
                });
                editor.onDidChangeModelContent(() => parent.postMessage({ type: "change", value: editor.getValue(), context: currentContext }, "*"));
                editor.onDidScrollChange(reportState);
                editor.onDidChangeCursorPosition(reportState);
                
                // Listen for Cmd/Ctrl + S inside the iframe (only works when Monaco editor is focused)
                document.addEventListener("keydown", (e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                        e.preventDefault();
                        e.stopPropagation();
                        parent.postMessage({ type: "save-request", context: currentContext }, "*");
                    }
                }, true);
                
                window.addEventListener("message", (e) => {
                    const { type: t, value: o, context: s } = e.data;
                    if ("set-theme" === t && monaco.editor.setTheme) return monaco.editor.setTheme(o);
                    if ("relayout" === t && editor) return editor.layout();
                    if ("set-content" === t && editor && o) {
                        if (o.code !== editor.getValue()) {
                            editor.setValue(o.code);
                        }
                        if (lastContext !== o.context) {
                            currentContext = o.context;
                            lastContext = o.context;
                            if ("state" in o && o.state) {
                                editor.restoreViewState(o.state);
                            }
                        }
                    }
                });
                parent.postMessage({ type: "editor-ready", context: currentContext }, "*");
            });
        </script>
    </body>
</html>`;
                await adapter.write(HOST_FILE_PATH, hostHtmlContent);
                setIsHostFileReady(true);
            } catch (error) { 
                console.error("[PlaygroundEditor] Monaco host setup failed:", error); 
                setStatus(`Setup failed: ${error.message}`); 
            }
        };
        setupHostFile();
        return () => { debouncedSaveCache(); };
    }, []);

    // === FILE LOADING (Only runs on filePath change) ===
    useEffect(() => {
        isEditorReadyRef.current = false;
        pendingContentRef.current = null;
        lastSentContext.current = null;
        if (!filePath) {
            setCodeBlocks([]);
            setActiveHeader(null); // Only reset on file load
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

            console.log(`[PlaygroundEditor] Loaded ${blocks.length} blocks from ${filePath}:`, blocks.map(b => b.header));

            // Find the primary view component for preview (order of preference)
            const primaryView = blocks.find(b => 
                b.header.toLowerCase().includes("view") || 
                b.header.toLowerCase().includes("viewcomponent")
            );
            const componentToRender = primaryView ? primaryView.header : (blocks[0]?.header || null);
            
            console.log(`[PlaygroundEditor] Will render: ${componentToRender}`);
            setRenderHeader(componentToRender);

            // For the editor, prefer the last active tab, fallback to first block
            // This way the editor shows the component you were last working on
            const initialActiveTab = blocks.find(b => b.header === fileCache.lastActive)?.header || blocks[0]?.header || null;
            
            console.log(`[PlaygroundEditor] Initial active tab: ${initialActiveTab}`);
            
            // Update both state and ref
            setCodeBlocks(blocks);
            codeBlocksRef.current = blocks;
            
            // Set active tab (this is a tab switch action, not a code change)
            setActiveHeader(initialActiveTab);
            
            setStatus("Ready");

            // Send initial content to editor
            const activeBlock = blocks.find(b => b.header === initialActiveTab);
            if (activeBlock) {
                const newContext = `${filePath}#${initialActiveTab}`;
                const contentPayload = { type: 'set-content', value: { code: activeBlock.code, context: newContext, state: viewStateCache.current[initialActiveTab] || null } };
                sendContentToEditor(contentPayload);
            }
        };
        loadFileAndPrepareContent();
        
        // Cleanup: delete temp file when switching files or unmounting
        return async () => {
            if (lastTempFile && typeof app !== 'undefined' && app.vault?.adapter) {
                try {
                    if (await app.vault.adapter.exists(lastTempFile)) {
                        await app.vault.adapter.trashLocal(lastTempFile);
                    }
                } catch (e) {
                    console.error("[PlaygroundEditor] Failed to cleanup temp file:", e);
                }
            }
        };
    }, [filePath]);

    // === TAB SWITCHING (CRITICAL: Only runs when activeHeader changes, NOT on code changes) ===
    const lastActiveHeaderRef = useRef(null);
    
    useEffect(() => {
        // GUARD: Only proceed if activeHeader actually changed (not just re-rendered with same value)
        if (lastActiveHeaderRef.current === activeHeader) return;
        lastActiveHeaderRef.current = activeHeader;
        
        if (!filePath || !activeHeader) return;
        
        // Get the active block from the ref (which has the latest code)
        const activeBlock = codeBlocksRef.current.find(b => b.header === activeHeader);
        if (!activeBlock) return;
        
        // Compute the message context
        const messageContext = `${filePath}#${activeHeader}`;
        
        // Only send if we haven't already sent this context
        if (lastSentContext.current === messageContext) return;
        
        // Send content to editor (this is a tab switch, not a code change)
        const contentPayload = { 
            type: 'set-content', 
            value: { 
                code: activeBlock.code, 
                context: messageContext, 
                state: viewStateCache.current[activeHeader] || null 
            } 
        };
        sendContentToEditor(contentPayload);
    }, [activeHeader, filePath]);

    // === EDITOR MESSAGE HANDLER (Handles code changes from Monaco - isolated from tab switching) ===
    useEffect(() => {
        const handleMessage = (event) => {
            if (!event.data || !iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
            const { type, value, context } = event.data;
            
            // Compute current message context without triggering re-renders
            const currentMessageContext = activeHeader ? `${filePath}#${activeHeader}` : filePath;
            
            if (type === 'editor-ready') {
                isEditorReadyRef.current = true;
                iframeRef.current.contentWindow.postMessage({ type: 'set-theme', value: monacoTheme }, '*');
                if (pendingContentRef.current) {
                    sendContentToEditor(pendingContentRef.current);
                }
                return;
            }
            
            // SAVE REQUEST: Handle Cmd/Ctrl + S from iframe
            if (type === 'save-request') {
                if (performSaveRef.current) {
                    performSaveRef.current();
                }
                return;
            }
            
            // CODE CHANGE: Update ref only, NOT state (prevents re-renders and tab switch effects)
            if (type === 'change' && context === currentMessageContext) {
                codeBlocksRef.current = codeBlocksRef.current.map(block => 
                    block.header === activeHeader ? { ...block, code: value } : block
                );
                return;
            }
            
            // STATE CHANGE: Update view state cache (cursor position, scroll, etc.)
            if (type === 'state-changed' && context === currentMessageContext) {
                if (!filePath || !activeHeader) return;
                viewStateCache.current[activeHeader] = value;
                if (!fullCacheRef.current[filePath]) { 
                    fullCacheRef.current[filePath] = { tabs: {} }; 
                }
                if (!fullCacheRef.current[filePath].tabs) { 
                    fullCacheRef.current[filePath].tabs = {}; 
                }
                fullCacheRef.current[filePath].tabs[activeHeader] = value;
                fullCacheRef.current[filePath].lastActive = activeHeader;
                debouncedSaveCache();
                return;
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [filePath, activeHeader, debouncedSaveCache, sendContentToEditor]);

    // === CACHE UPDATE ON TAB CHANGE (Isolated concern) ===
    const updateCacheOnHeaderChange = useCallback((oldHeader, newHeader) => {
        const fileCache = fullCacheRef.current[filePath];
        if (!fileCache || !fileCache.tabs) return;
        const cachedState = fileCache.tabs[oldHeader];
        delete fileCache.tabs[oldHeader];
        delete viewStateCache.current[oldHeader];
        if (newHeader && cachedState) { 
            fileCache.tabs[newHeader] = cachedState; 
            viewStateCache.current[newHeader] = cachedState; 
        }
        if (fileCache.lastActive === oldHeader) { 
            fileCache.lastActive = newHeader || (codeBlocksRef.current.length > 0 ? codeBlocksRef.current[0].header : null); 
        }
        debouncedSaveCache();
    }, [filePath, debouncedSaveCache]);

    // === SAVE HANDLER (Uses ref for latest code, updates state after save) ===
    const performSave = useCallback(async (blocksToSave) => {
        // Prevent multiple simultaneous saves
        if (isSavingRef.current) {
            return;
        }
        
        // Use ref for latest code if no blocks passed
        const blocks = blocksToSave || codeBlocksRef.current;
        if (!filePath || blocks.length === 0) {
            return;
        }
        
        isSavingRef.current = true;
        setStatus("Saving...");

        try {
            if (typeof app === 'undefined' || !app.vault || !app.vault.adapter) {
                throw new Error("Obsidian app context not fully available.");
            }
            const adapter = app.vault.adapter;

            const fullFileContent = rebuildFileContent(blocks);
            await adapter.write(filePath, fullFileContent);
            
            // Update state with saved blocks
            setCodeBlocks(blocks);
            codeBlocksRef.current = blocks;
            
            if (activeHeader) {
                if (!fullCacheRef.current[filePath]) { 
                    fullCacheRef.current[filePath] = { tabs: {} }; 
                }
                fullCacheRef.current[filePath].lastActive = activeHeader;
            }
            await saveCacheNow();
            setStatus("Saved successfully ✅");

            if (renderHeader) {
                const componentBlock = blocks.find(b => b.header === renderHeader);
                if (componentBlock) {
                    try {
                        // Delete previous temp file if it exists
                        if (lastTempFile && await adapter.exists(lastTempFile)) {
                            await adapter.trashLocal(lastTempFile);
                        }
                        
                        // Create a new temp file with timestamp
                        const timestamp = Date.now();
                        const newTempFile = `${TEMP_DIR}/${TEMP_FILE_PREFIX}${timestamp}.md`;
                        
                        // Use the same header name as the original component
                        const tempFileContent = `# ${renderHeader}\n\n\`\`\`jsx\n${componentBlock.code.trim()}\n\`\`\``;
                        const parentDir = newTempFile.substring(0, newTempFile.lastIndexOf('/'));
                        if (parentDir && !(await adapter.exists(parentDir))) await adapter.mkdir(parentDir);
                        await adapter.write(newTempFile, tempFileContent);
                        
                        // Verify the file was written successfully before proceeding
                        let retries = 0;
                        let fileIsReady = false;
                        while (retries < 5) {
                            if (await adapter.exists(newTempFile)) {
                                try {
                                    await adapter.read(newTempFile);
                                    fileIsReady = true;
                                    break; // File exists and is readable
                                } catch (e) {
                                    // File exists but not readable yet, wait and retry
                                }
                            }
                            await new Promise(resolve => setTimeout(resolve, 50));
                            retries++;
                        }
                        
                        if (!fileIsReady) {
                            console.error("[performSave] Temp file verification failed after retries");
                            new Notice("Error: Preview file not ready", 3000);
                            return;
                        }
                        
                        setLastTempFile(newTempFile);
                        
                        // Pass BOTH the temp file path (to load) AND the original file path (for context)
                        if (onHardReload) onHardReload(newTempFile, renderHeader, filePath);
                    } catch (tempError) {
                        console.error("[performSave] Failed to create temp file for preview:", tempError);
                        new Notice(`Error creating preview file: ${tempError.message}`, 4000);
                        // Clear loader state on error
                        setLoaderFilePath(null);
                        setLoaderHeaderName(null);
                    }
                } else {
                    new Notice(`Error: Main component "${renderHeader}" not found to preview.`, 4000);
                    // Clear loader state when component not found
                    setLoaderFilePath(null);
                    setLoaderHeaderName(null);
                }
            }
            
            setTimeout(() => setStatus(s => s === "Saved successfully ✅" ? "Ready" : s), 2000);

        } catch (e) {
            setStatus(`Error saving: ${e.message}`);
        } finally {
            isSavingRef.current = false;
        }
    }, [filePath, activeHeader, renderHeader, onHardReload, saveCacheNow, lastTempFile]);
    
    // Update the ref whenever performSave changes
    useEffect(() => {
        performSaveRef.current = performSave;
        // Also expose save function to parent component via editorSaveRef
        if (editorSaveRef) {
            editorSaveRef.current = performSave;
        }
    }, [performSave, editorSaveRef]);
    
    // Focus new tab input when adding a tab
    useEffect(() => {
        if (isAddingTab && newTabInputRef.current) {
            newTabInputRef.current.focus();
        }
    }, [isAddingTab]);
    
    // === TAB ACTION HANDLERS (Update both state and ref, trigger tab switch) ===
    const iframeSrc = useMemo(() => {
        if (!isHostFileReady) return "about:blank";
        return app.vault.adapter.getResourcePath(HOST_FILE_PATH);
    }, [isHostFileReady]);
    
    const handleInitiateAddTab = () => { 
        setIsAddingTab(true); 
        setNewTabName(""); 
    };
    
    const handleCommitAddTab = () => { 
        const finalTabName = newTabName.trim(); 
        setIsAddingTab(false); 
        setNewTabName(''); 
        
        if (!finalTabName || codeBlocksRef.current.some(b => b.header === finalTabName)) { 
            if (finalTabName) new Notice("A component with this name already exists.", 3000); 
            return; 
        } 
        
        const newBoilerplate = `function ${finalTabName}() {\n  return <div>Hello, World!</div>;\n}\n\nreturn { ${finalTabName} };`; 
        const newBlock = { header: finalTabName, code: newBoilerplate }; 
        const newBlocks = [...codeBlocksRef.current, newBlock]; 
        
        // Update both state and ref
        setCodeBlocks(newBlocks); 
        codeBlocksRef.current = newBlocks;
        
        // This is a tab switch action
        setActiveHeader(finalTabName); 
        
        performSave(newBlocks); 
    };
    
    const handleTabDoubleClick = (header) => { 
        setRenamingHeader(header); 
        setRenameValue(header); 
    };
    
    const handleRenameCommit = () => { 
        const oldHeader = renamingHeader; 
        const newHeader = renameValue.trim(); 
        setRenamingHeader(null); 
        
        if (!newHeader || oldHeader === newHeader) return; 
        if (codeBlocksRef.current.some(b => b.header === newHeader)) { 
            new Notice("A component with this name already exists.", 3000); 
            return; 
        } 
        
        const renameRegex = new RegExp('\\b' + oldHeader + '\\b', 'g'); 
        const newBlocks = codeBlocksRef.current.map(b => { 
            if (b.header === oldHeader) { 
                const updatedCode = b.code.replace(renameRegex, newHeader); 
                return { ...b, header: newHeader, code: updatedCode }; 
            } 
            return b; 
        }); 
        
        // Update both state and ref
        setCodeBlocks(newBlocks); 
        codeBlocksRef.current = newBlocks;
        
        updateCacheOnHeaderChange(oldHeader, newHeader); 
        
        // This is a tab switch action if active tab was renamed
        if (activeHeader === oldHeader) setActiveHeader(newHeader); 
        if (renderHeader === oldHeader) setRenderHeader(newHeader); 
        
        performSave(newBlocks); 
    };
    
    const handleDeleteTab = (headerToDelete) => { 
        if (codeBlocksRef.current.length <= 1) { 
            new Notice("You cannot delete the last component.", 3000); 
            return; 
        } 
        if (renderHeader === headerToDelete) { 
            new Notice("Cannot delete the main component being previewed.", 3000); 
            return; 
        } 
        
        const indexToDelete = codeBlocksRef.current.findIndex(b => b.header === headerToDelete); 
        const newBlocks = codeBlocksRef.current.filter(b => b.header !== headerToDelete); 
        
        // Update both state and ref
        setCodeBlocks(newBlocks); 
        codeBlocksRef.current = newBlocks;
        
        // This is a tab switch action if active tab was deleted
        if (activeHeader === headerToDelete) { 
            const newActiveIndex = Math.max(0, indexToDelete - 1); 
            const newActiveHeader = newBlocks[newActiveIndex]?.header || null; 
            setActiveHeader(newActiveHeader); 
        } 
        
        updateCacheOnHeaderChange(headerToDelete, null); 
        performSave(newBlocks); 
    };
    
    const handleCopyImportStatement = (header) => { 
        if (!filePath || !header) return; 
        const importStatement = `const { ${header} } = await dc.require(dc.headerLink("${filePath}", "${header}"));`; 
        navigator.clipboard.writeText(importStatement).then(() => { 
            new Notice(`Import for '${header}' copied!`, 3000); 
        }).catch(err => { 
            console.error("Failed to copy import statement:", err); 
            new Notice("Error: Could not copy to clipboard.", 4000); 
        }); 
    };

    return (
        <div style={styles.editorPane}>
            <div style={styles.tabBar} className="scrollable-tabs">
                {codeBlocks.map(block => (
                    <div key={block.header} style={{ ...styles.tab, ...(block.header === activeHeader ? styles.activeTab : {}) }} onClick={() => renamingHeader === null && !isAddingTab && setActiveHeader(block.header)} onDoubleClick={() => handleTabDoubleClick(block.header)} >
                        {renamingHeader === block.header ? (<input type="text" style={styles.renameInput} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={handleRenameCommit} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} autoFocus />) : (block.header)}
                        <span style={styles.tabCopyButton} title={`Copy import for ${block.header}`} onClick={(e) => { e.stopPropagation(); handleCopyImportStatement(block.header); }}>{'{;}'}</span>
                        <span style={styles.tabCloseButton} title={`Delete ${block.header}`} onClick={(e) => { e.stopPropagation(); handleDeleteTab(block.header); }}>&times;</span>
                    </div>
                ))}
                {filePath && (isAddingTab ? (<div style={{ ...styles.tab, ...styles.activeTab, paddingRight: '12px' }}> <input ref={newTabInputRef} type="text" style={styles.renameInput} value={newTabName} onChange={(e) => setNewTabName(e.target.value)} onBlur={handleCommitAddTab} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} placeholder="Component name..." /> </div>) : (<div style={styles.addTabButton} onClick={handleInitiateAddTab} title="Add New Component">+</div>))}
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
                    <button style={styles.button} onClick={() => performSave()} disabled={!filePath}>
                        Save & Rebuild ({navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}+S)
                    </button>
                    <span style={styles.paneToggleButton} onClick={onTogglePreview} title="Toggle Preview Pane">&gt;</span>
                </div>
            </div>
        </div>
    );
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 4. MAIN COMPONENT - Live Development Environment (Integrated) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function LiveDevelopmentEnvironment({ initialMode = 'default' }) {
    // Theme toggle handler (now inside component)
    // --- EXACT COPY FROM REFERENCE ---
    const handleToggleTheme = () => {
        const newTheme = localTheme === 'theme-dark' ? 'theme-light' : 'theme-dark';
        setLocalTheme(newTheme);
        setIsThemeManuallySet(true); // Mark as manually set
    };
    const [filePath, setFilePath] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [renderKey, setRenderKey] = useState(0);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [localTheme, setLocalTheme] = useState('theme-dark'); // Local theme state for component only
    const [isThemeManuallySet, setIsThemeManuallySet] = useState(false); // Track manual theme changes
    const monacoTheme = useMemo(() => {
        return localTheme === 'theme-light' ? 'vs' : 'vs-dark';
    }, [localTheme]);
    
    // Sync localTheme with vault theme (only if not manually set)
    useEffect(() => {
        if (isThemeManuallySet) return; // Don't sync if theme was manually toggled
        
        const syncTheme = () => {
            const isDark = document.body.classList.contains('theme-dark');
            setLocalTheme(isDark ? 'theme-dark' : 'theme-light');
        };
        syncTheme(); // Initial sync
        const observer = new MutationObserver(syncTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, [isThemeManuallySet]);
    
    // Update Monaco theme when monacoTheme prop changes
    useEffect(() => {
        if (!window.iframeRef || !window.iframeRef.current) return;
        window.iframeRef.current.contentWindow.postMessage({ type: 'set-theme', value: monacoTheme }, '*');
    }, [monacoTheme]);
    
    // State is separated: activeHeader for the editor, renderHeader for the preview.
    const [activeHeader, setActiveHeaderInternal] = useState(null);
    const [renderHeader, setRenderHeader] = useState(null);

    // Wrap setActiveHeader to prevent unnecessary updates when value hasn't changed
    const setActiveHeader = useCallback((newValue) => {
        setActiveHeaderInternal(prev => {
            if (prev === newValue) {
                return prev; // Don't update if value is the same
            }
            return newValue;
        });
    }, []);

    // State for managing what the DynamicComponentLoader renders
    const [loaderFilePath, setLoaderFilePath] = useState(""); // The actual file to load code from (may be temp)
    const [loaderContextPath, setLoaderContextPath] = useState(""); // The original file path for dc.useCurrentPath() hijack
    const [loaderHeaderName, setLoaderHeaderName] = useState(null);

    const [paneVisibility, setPaneVisibility] = useState('both');
    const [editorPaneWidth, setEditorPaneWidth] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const [isResizerHovered, setIsResizerHovered] = useState(false);
    const [activeMode, setActiveMode] = useState(initialMode); // Initialize with prop value
    const [editorReloadKey, setEditorReloadKey] = useState(0);
    const [isPaneActive, setIsPaneActive] = useState(true);

    // --- Component Props (from ViewsInceptions) ---
    // Allow the user to configure props that are passed into the previewed component
    const [componentProps, setComponentProps] = useState({});
    const [propsEditorOpen, setPropsEditorOpen] = useState(false);
    const [propsList, setPropsList] = useState([]); // { key, value, isEditing, displayValue }
    const [newPropInput, setNewPropInput] = useState('');

    const parsePropValue = (valueStr) => {
        try {
            let cleanValue = valueStr.trim();
            if (cleanValue.startsWith('{') && cleanValue.endsWith('}')) {
                cleanValue = cleanValue.slice(1, -1).trim();
            }
            // eslint-disable-next-line no-eval
            const result = eval('(' + cleanValue + ')');
            return result;
        } catch (e) {
            return valueStr;
        }
    };

    const addNewProp = () => {
        const trimmed = newPropInput.trim();
        if (!trimmed) return;
        const match = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
        if (!match) {
            new Notice('Invalid format. Use: propName={value} or propName="value"', 3000);
            return;
        }
        const [, key, valueStr] = match;
        const value = parsePropValue(valueStr);
        if (propsList.some(p => p.key === key)) {
            new Notice(`Prop "${key}" already exists. Double-click to edit it.`, 3000);
            return;
        }
        const newList = [...propsList, { key, value, isEditing: false, displayValue: valueStr }];
        setPropsList(newList);
        setNewPropInput('');
        const newProps = { ...componentProps, [key]: value };
        setComponentProps(newProps);
        setRenderKey(prev => prev + 1);
    };

    const removeProp = (key) => {
        const newList = propsList.filter(p => p.key !== key);
        setPropsList(newList);
        const newProps = { ...componentProps };
        delete newProps[key];
        setComponentProps(newProps);
        setRenderKey(prev => prev + 1);
    };

    const startEditProp = (key) => {
        setPropsList(propsList.map(p => p.key === key ? { ...p, isEditing: true } : p));
    };

    const updateProp = (key, newValueStr) => {
        const newValue = parsePropValue(newValueStr);
        const newList = propsList.map(p => p.key === key ? { ...p, value: newValue, displayValue: newValueStr, isEditing: false } : p);
        setPropsList(newList);
        const newProps = { ...componentProps, [key]: newValue };
        setComponentProps(newProps);
        setRenderKey(prev => prev + 1);
    };

    const cancelEditProp = (key) => {
        setPropsList(propsList.map(p => p.key === key ? { ...p, isEditing: false } : p));
    };
    const containerRef = useRef(null);
    const mainContentRef = useRef(null);
    const previewContentRef = useRef(null);
    const isInitialLoad = useRef(true);
    const cleanupRef = useRef({});
    const editorSaveRef = useRef(null); // Ref to access save function from PlaygroundEditor
    const reloadTimeoutRef = useRef(null); // Debounce reload requests
    const componentPages = dc.useQuery(`@page AND path("_RESOURCES/DATACORE") AND $file.contains(".component")`);

    useEffect(() => {
        setLoaderFilePath(filePath);
        setLoaderContextPath(filePath); // Also set context path to original file
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

    // Hide status bar at bottom right when in full-tab mode
    useEffect(() => {
        if (activeMode !== 'fullTab') return;
        
        const statusBar = document.querySelector('body > .app-container .status-bar');
        if (statusBar) {
            const originalDisplay = statusBar.style.display;
            statusBar.style.display = 'none';
            
            return () => {
                const statusBarToRestore = document.querySelector('body > .app-container .status-bar');
                if (statusBarToRestore) {
                    statusBarToRestore.style.display = originalDisplay;
                }
            };
        }
    }, [activeMode]);

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
    
    // NOTE: Command/Ctrl + S keyboard shortcut only works when Monaco editor is focused.
    // This is due to the iframe isolation - keyboard events inside the Monaco iframe are captured
    // and sent via postMessage, while events outside the iframe are blocked by event propagation.
    useEffect(() => {
        const handleGlobalSave = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (editorSaveRef.current) {
                    editorSaveRef.current();
                }
            }
        };
        
        document.addEventListener('keydown', handleGlobalSave, { capture: true });
        return () => {
            document.removeEventListener('keydown', handleGlobalSave, { capture: true });
        };
    }, []); // Empty deps - handler uses ref which is always current
    
    const handleMouseDown = useCallback((e) => { 
        e.preventDefault(); 
        setIsResizing(true); 
        // Disable iframe pointer events during resizing to prevent interference
        if (window.iframeRef && window.iframeRef.current) {
            window.iframeRef.current.style.pointerEvents = 'none';
        }
    }, []);
    const handleMouseUp = useCallback(() => { 
        setIsResizing(false); 
        // Re-enable iframe pointer events after resizing
        if (window.iframeRef && window.iframeRef.current) {
            window.iframeRef.current.style.pointerEvents = '';
        }
    }, []);
    
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

    const handleHardReload = useCallback((newFilePath, newHeaderName, originalFilePath) => {
        if (!newFilePath || !newHeaderName) {
            return;
        }

        // Debounce: Cancel any pending reload and schedule a new one
        if (reloadTimeoutRef.current) {
            clearTimeout(reloadTimeoutRef.current);
        }

        reloadTimeoutRef.current = setTimeout(() => {
            if (previewContentRef.current && filePath) {
                const SCROLL_KEY = `datacore-live-dev-scroll-${filePath}`;
                const scrollState = { top: previewContentRef.current.scrollTop, left: previewContentRef.current.scrollLeft };
                sessionStorage.setItem(SCROLL_KEY, JSON.stringify(scrollState));
            }

            // AGGRESSIVE CACHE CLEARING - Clear all Datacore module cache for this file
            try {
                const resolvedPath = dc.resolvePath(newFilePath);
                
                // Try to access and clear Datacore's internal cache
                // This is critical for components that use dc.require() internally (like Aquarium)
                if (dc.api?.index) {
                    // Clear the file from the index
                    console.log(`[Playground] Clearing cache for: ${resolvedPath}`);
                }
                
                // Force garbage collection hint (doesn't guarantee it runs, but helps)
                if (window.gc) {
                    window.gc();
                }
            } catch (e) {
                console.warn('[Playground] Cache clearing warning:', e);
            }

            setLoaderFilePath(newFilePath);
            setLoaderContextPath(originalFilePath || filePath); // Use original file path for context
            setLoaderHeaderName(newHeaderName);
            
            setRenderKey(k => k + 1);
            new Notice("Reloading preview...", 1500);
            
            reloadTimeoutRef.current = null;
        }, 100); // 100ms debounce - only the last save in a rapid sequence will trigger reload

    }, [filePath]);

    const handleCopyPath = () => { try { const activeFile = dc.app.workspace.getActiveFile(); if (activeFile) { navigator.clipboard.writeText(activeFile.path); new Notice(`Path copied: ${activeFile.path}`, 4000); } else { new Notice("Could not determine the active file path.", 4000); } } catch (error) { console.error("Error getting file path:", error); new Notice("Error: Could not access app context to find file path.", 4000); } };
    const handleCreateNewFile = async () => { const finalPath = inputValue.trim(); if (!finalPath || !finalPath.toLowerCase().endsWith('.md')) { new Notice("Please enter a valid file path ending in .md in the input field.", 4000); return; } const adapter = app.vault.adapter; if (await adapter.exists(finalPath)) { if (confirm(`File already exists at "${finalPath}".\n\nClick OK to OVERWRITE it, or Cancel to simply OPEN it.`)) { new Notice(`Overwriting file: ${finalPath}`, 2000); } else { new Notice(`Opening existing file: ${finalPath}`, 2000); setFilePath(finalPath); setRenderKey(prev => prev + 1); return; } } try { const filename = finalPath.split('/').pop().replace(/\.md$/, '').replace(/\.component/i, ''); let componentName = filename.replace(/[^a-zA-Z0-9]/g, ''); if (!/^[a-zA-Z]/.test(componentName)) { componentName = 'Component' + componentName; } componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1); if (!componentName) { new Notice("Could not derive a valid component name from the file path.", 4000); return; } const boilerplateCode = `function ${componentName}() {\n  return <div>Hello from ${componentName}!</div>;\n}\n\nreturn { ${componentName} };`; const fileContent = `---\ntags: datacore-component\n---\n\n# ViewComponent\n\n\`\`\`jsx\n${boilerplateCode}\n\`\`\``; const parentDir = finalPath.substring(0, finalPath.lastIndexOf('/')); if (parentDir && !(await adapter.exists(parentDir))) { await adapter.mkdir(parentDir); new Notice(`Created directory: ${parentDir}`, 2000); } await adapter.write(finalPath, fileContent); new Notice(`Component created: ${finalPath}`, 4000); setFilePath(finalPath); setRenderKey(prev => prev + 1); } catch (error) { console.error("Error creating new component file:", error); new Notice("Failed to create file. Check console for details.", 5000); } };

    if (componentPages === undefined) {
        return <div style={styles.wrapper}><div style={{ padding: '20px', color: '#888', textAlign: 'center' }}>Loading component list...</div></div>;
    }

    return (
        <div 
            ref={containerRef} 
            style={wrapperStyle} 
            className={`${uniqueWrapperClass} ${localTheme}`}
            onMouseDown={() => setIsPaneActive(true)}
        >
            <style>{scrollbarStyle}</style>
            <style>{`
                .${uniqueWrapperClass}.theme-light {
                    --background-primary: #ffffff;
                    --background-primary-alt: #f5f5f5;
                    --background-secondary: #f3f3f3;
                    --background-modifier-border: #ddd;
                    --text-normal: #2e3338;
                    --text-muted: #999999;
                    --text-on-accent: #ffffff;
                    --interactive-normal: #f3f3f3;
                    --interactive-accent: #8A2BE2;
                    --color-accent: #8A2BE2;
                }
                .${uniqueWrapperClass}.theme-dark {
                    --background-primary: #1e1e1e;
                    --background-primary-alt: #161616;
                    --background-secondary: #141414;
                    --background-modifier-border: #333;
                    --text-normal: #dcddde;
                    --text-muted: #999;
                    --text-on-accent: #ffffff;
                    --interactive-normal: #2a2a2a;
                    --interactive-accent: #8A2BE2;
                    --color-accent: #8A2BE2;
                }
            `}</style>
            <div style={styles.bookmarkBar} className="scrollable-tabs">
                {bookmarks.map((bookmark) => <button key={bookmark.path} style={filePath === bookmark.path ? { ...styles.bookmarkButton, ...styles.activeBookmarkButton } : styles.bookmarkButton} onClick={() => handleBookmarkClick(bookmark.path)} title={bookmark.path}>{bookmark.name}</button>)}
            </div>
            <form style={styles.loaderBar} onSubmit={handleLoadFile}>
                <input type="text" style={{ ...styles.input, ...(isInputFocused ? styles.purpleFocus : {}) }} value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter component file path..." onFocus={() => setIsInputFocused(true)} onBlur={() => setIsInputFocused(false)} />
                <button type="submit" style={styles.button} title="Load component file">
                    <dc.Icon icon="folder-open" />
                </button>
                <button type="button" style={styles.button} onClick={handleCreateNewFile} title="Create a new component file">
                    <dc.Icon icon="file-plus" />
                </button>
                <button type="button" style={styles.button} onClick={handleCopyPath} title="Copy path of the currently open note">
                    <dc.Icon icon="copy" />
                </button>
                <button type="button" style={styles.iconButton} onClick={handleToggleTheme} title="Toggle Light/Dark Mode">
                    <dc.Icon icon={localTheme === 'theme-dark' ? 'moon' : 'sun'} />
                </button>
                <button type="button" style={styles.iconButton} onClick={toggleScreenMode} title={activeMode === 'default' ? "Enter Full Tab Mode" : "Exit Full Tab Mode"}>
                    <dc.Icon icon={activeMode === 'default' ? 'maximize-2' : 'minimize-2'} />
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
                        localTheme={localTheme}
                        monacoTheme={monacoTheme}
                        editorSaveRef={editorSaveRef}
                    />
                </div>
                <div style={resizerStyle} onMouseDown={handleMouseDown} onMouseEnter={() => setIsResizerHovered(true)} onMouseLeave={() => setIsResizerHovered(false)} />
                <div style={{ ...styles.previewPane, ...previewPaneStyle }}>
                    <div style={styles.previewHeader}>
                        <span style={styles.paneToggleButton} onClick={handleToggleEditor} title={paneVisibility === 'preview' ? "Show Editor" : "Hide Editor"}>
                            <dc.Icon icon="chevron-left" />
                        </span>
                        <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <dc.Icon icon="eye" />
                            <span>Live Preview (Component: {renderHeader || 'none'})</span>
                        </span>
                        <button 
                            style={{ ...styles.iconButton, padding: '4px', backgroundColor: propsEditorOpen ? 'var(--interactive-accent)' : 'transparent', border: 'none', color: propsEditorOpen ? 'var(--text-on-accent)' : '#aaa' }} 
                            onClick={() => setPropsEditorOpen(!propsEditorOpen)} 
                            title="Toggle Props Editor"
                        >
                            <dc.Icon icon="settings" />
                        </button>
                        <button style={{ ...styles.iconButton, padding: '4px', backgroundColor: 'transparent', border: 'none', color: '#aaa' }} onClick={() => new Notice("Please save (Ctrl+S) to rebuild the preview.")} title="Save to rebuild">
                            <dc.Icon icon="refresh-cw" />
                        </button>
                    </div>
                    
                    {/* Props Editor Panel */}
                    {propsEditorOpen && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: 'var(--background-secondary)',
                            borderBottom: '1px solid var(--background-modifier-border)',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            fontSize: '12px'
                        }}>
                            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Component Props</div>
                            
                            {/* Existing props list */}
                            {propsList.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                    {propsList.map(prop => (
                                        <div key={prop.key} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px', 
                                            marginBottom: '4px',
                                            padding: '4px',
                                            backgroundColor: 'var(--background-primary)',
                                            borderRadius: '4px'
                                        }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--color-accent)', minWidth: '80px' }}>{prop.key}:</span>
                                            {prop.isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        defaultValue={prop.displayValue}
                                                        autoFocus
                                                        style={{ 
                                                            flex: 1, 
                                                            padding: '4px', 
                                                            backgroundColor: 'var(--background-primary)',
                                                            color: 'var(--text-normal)',
                                                            border: '1px solid var(--color-accent)',
                                                            borderRadius: '2px',
                                                            fontSize: '12px'
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                updateProp(prop.key, e.target.value);
                                                            } else if (e.key === 'Escape') {
                                                                cancelEditProp(prop.key);
                                                            }
                                                        }}
                                                        onBlur={(e) => updateProp(prop.key, e.target.value)}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <span 
                                                        style={{ flex: 1, color: 'var(--text-normal)', cursor: 'pointer' }}
                                                        onDoubleClick={() => startEditProp(prop.key)}
                                                        title="Double-click to edit"
                                                    >
                                                        {prop.displayValue}
                                                    </span>
                                                    <button
                                                        onClick={() => removeProp(prop.key)}
                                                        style={{
                                                            padding: '2px 6px',
                                                            fontSize: '11px',
                                                            backgroundColor: 'transparent',
                                                            color: '#aaa',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            borderRadius: '2px'
                                                        }}
                                                        title="Remove prop"
                                                    >
                                                        <dc.Icon icon="x" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Add new prop */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={newPropInput}
                                    onChange={(e) => setNewPropInput(e.target.value)}
                                    placeholder='Add prop: name={value}'
                                    style={{
                                        flex: 1,
                                        padding: '6px 8px',
                                        fontSize: '12px',
                                        backgroundColor: 'var(--background-primary)',
                                        color: 'var(--text-normal)',
                                        border: '1px solid var(--background-modifier-border)',
                                        borderRadius: '4px',
                                        outline: 'none'
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            addNewProp();
                                        }
                                    }}
                                />
                                <button
                                    onClick={addNewProp}
                                    style={{
                                        ...styles.button,
                                        padding: '6px 12px',
                                        fontSize: '12px'
                                    }}
                                    title="Add prop"
                                >
                                    <dc.Icon icon="plus" />
                                </button>
                            </div>
                            
                            {propsList.length === 0 && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '8px', fontStyle: 'italic' }}>
                                    No props configured. Add props like: <code style={{ backgroundColor: 'var(--background-primary)', padding: '2px 4px', borderRadius: '2px' }}>title="Hello"</code> or <code style={{ backgroundColor: 'var(--background-primary)', padding: '2px 4px', borderRadius: '2px' }}>count={'{42}'}</code>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div style={styles.previewContent} ref={previewContentRef}>
                        {loaderFilePath && loaderHeaderName ? (
                            <div 
                                className="component-sandbox-isolator"
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    isolation: 'isolate'
                                }}
                            >
                                {/* Isolated workspace structure - prevents full-tab components from escaping */}
                                <div 
                                    className="workspace-leaf-content component-sandbox-boundary"
                                    data-sandbox="true"
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        overflow: 'hidden',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        contain: 'layout style paint',
                                        zIndex: 1
                                    }}
                                >
                                    <div 
                                        className="view-content"
                                        style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            overflow: 'auto', 
                                            padding: '10px',
                                            position: 'relative',
                                            flex: 1
                                        }}
                                    >
                                        <DynamicComponentLoader 
                                            key={`${renderKey}-${loaderFilePath}-${loaderHeaderName}`} 
                                            filePath={loaderFilePath} 
                                            contextPath={loaderContextPath}
                                            activeHeader={loaderHeaderName} 
                                            renderKey={renderKey}
                                            componentProps={componentProps}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: '#888', padding: '20px' }}>Load a file to see the preview.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- EXPORT THE MAIN COMPONENT ---
return { DatacorePlayground: LiveDevelopmentEnvironment };
```

