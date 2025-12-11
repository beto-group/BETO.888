
# ViewComponent

```jsx
const { useState, useEffect, useRef, useMemo } = dc;

// --- Script Loading Utility ---
async function loadScript(dc, src, options = {}) {
    const { cache = true, type = 'script', globalName } = options;
    
    if (globalName && window[globalName]) return window[globalName];

    const adapter = dc.app.vault.adapter;
    const cacheDir = ".datacore/script_cache";
    
    // Create cache dir if needed
    if (cache && !(await adapter.exists(cacheDir))) {
        await adapter.mkdir(cacheDir);
    }

    const safeFilename = src.replace(/[^a-zA-Z0-9]/g, '_') + '.js';
    const cachePath = `${cacheDir}/${safeFilename}`;
    let scriptContent = null;

    // Try cache
    if (cache && await adapter.exists(cachePath)) {
        try {
            scriptContent = await adapter.read(cachePath);
            console.log(`[Mermaid] Loaded from cache: ${cachePath}`);
        } catch (e) {
            console.warn("Failed to read from cache", e);
        }
    }

    // Fetch if not in cache
    if (!scriptContent) {
        console.log(`[Mermaid] Fetching from CDN: ${src}`);
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to fetch ${src}`);
        scriptContent = await response.text();
        
        if (cache) {
            try {
                await adapter.write(cachePath, scriptContent);
                console.log(`[Mermaid] Cached to: ${cachePath}`);
            } catch (e) {
                console.warn("Failed to write to cache", e);
            }
        }
    }

    const blob = new Blob([scriptContent], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    try {
        if (type === 'module') {
            const mod = await import(blobUrl);
            return mod;
        } else {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = blobUrl;
                script.onload = () => {
                    if (globalName && window[globalName]) {
                        resolve(window[globalName]);
                    } else {
                        resolve(null);
                    }
                };
                script.onerror = (e) => reject(new Error(`Script load failed: ${e.message}`));
                document.body.appendChild(script);
            });
        }
    } finally {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    }
}

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

const STYLES = {
    hoverEffectStyle: `
      .subtle-icon {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
      }
      .interactive-wrapper:hover .subtle-icon {
        opacity: 0.7;
        transform: scale(1);
      }
      .subtle-icon:hover {
        opacity: 1;
      }
      .subtle-icon:hover .exit-tooltip {
        visibility: visible;
        opacity: 1;
      }
    `,
    fullTabWrapper: {
        position: "relative",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#000000",
    },
    iconContainer: {
        position: "absolute",
        top: "15px",
        right: "20px",
        fontFamily: "monospace",
        fontSize: "14px",
        color: "var(--text-faint)",
        userSelect: "none",
        cursor: "pointer",
        zIndex: 100,
        background: "rgba(0,0,0,0.5)",
        padding: "4px 8px",
        borderRadius: "4px",
        border: "1px solid #333"
    },
    tooltip: {
        visibility: "hidden",
        opacity: 0,
        backgroundColor: "#222",
        color: "#fff",
        textAlign: "center",
        borderRadius: "4px",
        padding: "5px 10px",
        position: "absolute",
        zIndex: 1,
        top: "50%",
        right: "120%",
        transform: "translateY(-50%)",
        fontSize: "12px",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        border: "1px solid #444",
    },
    compactWrapper: {
        padding: "16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        border: "1px dashed #333",
        borderRadius: "8px",
        backgroundColor: "#0a0a0a",
        height: "200px"
    },
    compactText: { margin: 0, color: "#888", fontSize: "14px" },
    buttonGroup: { display: "flex", gap: "10px" },
    
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#000000',
        color: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        borderRadius: '8px',
        border: '1px solid #333'
    },
    header: {
        padding: '12px 16px',
        borderBottom: '1px solid #222',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0a0a0a'
    },
    title: {
        fontSize: '16px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#fff'
    },
    content: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        height: 'calc(100% - 50px)' // Adjust based on header height
    },
    editorPane: {
        width: '40%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #222',
        background: '#050505'
    },
    previewPane: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#000',
        position: 'relative',
        overflow: 'hidden'
    },
    textarea: {
        flex: 1,
        width: '100%',
        background: 'transparent',
        color: '#e0e0e0',
        border: 'none',
        padding: '16px',
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: '13px',
        lineHeight: '1.5',
        resize: 'none',
        outline: 'none',
        whiteSpace: 'pre',
        overflow: 'auto'
    },
    previewContainer: {
        transformOrigin: '0 0',
        padding: '40px'
    },
    error: {
        padding: '12px',
        background: 'rgba(220, 38, 38, 0.1)',
        borderTop: '1px solid rgba(220, 38, 38, 0.3)',
        color: '#f87171',
        fontSize: '12px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap'
    },
    toolbar: {
        padding: '8px 12px',
        borderBottom: '1px solid #222',
        display: 'flex',
        gap: '8px',
        background: '#0a0a0a',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        scrollbarWidth: 'thin'
    },
    button: {
        background: 'transparent',
        border: '1px solid #333',
        color: '#ccc',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease'
    },
    buttonPrimary: {
        background: 'rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        color: '#a78bfa'
    },
    icon: {
        width: '14px',
        height: '14px'
    }
};

const EXAMPLES = {
    flowchart: `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B`,
    sequence: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`,
    class: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }`,
    state: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
    gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`,
    pie: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`
};

const MermaidDiagramComponent = ({ initialCode, initialEditorVisible = true }) => {
    // Fulltab State
    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;
    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
    const uniqueWrapperClass = `interactive-wrapper-${instanceId}`;

    // Diagram State
    const [code, setCode] = useState(initialCode || EXAMPLES.flowchart);
    const [svg, setSvg] = useState("");
    const [error, setError] = useState(null);
    const [mermaidLib, setMermaidLib] = useState(null);
    const [scale, setScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const previewRef = useRef(null);

    const [isEditorVisible, setIsEditorVisible] = useState(initialEditorVisible);

    // Fulltab Effect
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullTab) return;
        const targetPaneContent = findNearestAncestorWithClass(
            container,
            "workspace-leaf-content"
        );
        if (!targetPaneContent) {
            setIsFullTab(false);
            return;
        }
        const contentWrapper =
            findDirectChildByClass(targetPaneContent, "view-content") ||
            targetPaneContent;
        stateRefs.originalParent = container.parentNode;
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
            overflow: "hidden", // Changed to hidden for this component
            background: "#000"
        });
        return () => {
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(
                    container,
                    stateRefs.placeholder
                );
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position =
                    stateRefs.parentPositionInfo.original === "static"
                        ? ""
                        : stateRefs.parentPositionInfo.original;
            }
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
        };
    }, [isFullTab]);

    const handleExitFullTab = (e) => {
        e.stopPropagation();
        setIsFullTab(false);
    };
    const handleEnterFullTab = () => setIsFullTab(true);

    // Load Mermaid
    useEffect(() => {
        const initMermaid = async () => {
            try {
                console.log("[Mermaid] Starting load...");
                // Use UMD build (single file) to avoid relative import issues with Blob URLs
                const m = await loadScript(dc, 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js', {
                    type: 'script',
                    globalName: 'mermaid',
                    cache: true
                });
                console.log("[Mermaid] Library loaded, initializing...");

                m.initialize({ 
                    startOnLoad: false,
                    theme: 'dark',
                    securityLevel: 'loose',
                    fontFamily: 'Inter, sans-serif',
                    themeVariables: {
                        primaryColor: '#8b5cf6',
                        primaryTextColor: '#fff',
                        primaryBorderColor: '#7c3aed',
                        lineColor: '#a78bfa',
                        secondaryColor: '#1a1a1a',
                        tertiaryColor: '#1a1a1a',
                        mainBkg: '#0a0a0a',
                        nodeBorder: '#8b5cf6',
                        clusterBkg: '#0a0a0a',
                        clusterBorder: '#333',
                        defaultLinkColor: '#a78bfa',
                        fontFamily: 'Inter, sans-serif'
                    }
                });
                console.log("[Mermaid] Initialized.");
                setMermaidLib(m);
            } catch (err) {
                console.error("[Mermaid] Error:", err);
                setError("Failed to load mermaid library: " + err.message);
            }
        };

        initMermaid();
    }, []);

    // Render Diagram
    useEffect(() => {
        if (!mermaidLib || !code) return;

        const renderDiagram = async () => {
            try {
                setError(null);
                // Unique ID for this render
                const id = `mermaid-${Date.now()}`;
                // Mermaid render returns an object with svg property
                const { svg } = await mermaidLib.render(id, code);
                
                // Post-process SVG to ensure it fits the container
                // Remove inline styles that might restrict size (max-width)
                // We do NOT force width/height to 100% anymore to allow natural size (zoomed in)
                let processedSvg = svg
                    .replace(/style="[^"]*"/, 'style=""'); 
                
                setSvg(processedSvg);
            } catch (err) {
                console.error("Mermaid render error:", err);
                // Mermaid throws errors that are sometimes objects, sometimes strings
                setError(err.message || "Syntax error in diagram code");
            }
        };

        const timeout = setTimeout(renderDiagram, 500); // Debounce
        return () => clearTimeout(timeout);
    }, [code, mermaidLib]);

    // Center diagram on load
    useEffect(() => {
        if (svg && previewRef.current) {
            // Small delay to allow render
            setTimeout(() => {
                const container = previewRef.current;
                const svgEl = container.querySelector('svg');
                if (!svgEl) return;

                const containerRect = container.getBoundingClientRect();
                const svgRect = svgEl.getBoundingClientRect();
                
                // Calculate offsets based on current scale
                // We want to center the visual content
                const padding = 40;
                const scaledPadding = padding * scale;
                
                const newX = (containerRect.width / 2) - scaledPadding - (svgRect.width / 2);
                
                let newY = (containerRect.height / 2) - scaledPadding - (svgRect.height / 2);
                
                // If content is taller than container, align to top
                if (svgRect.height > containerRect.height) {
                    newY = 0;
                }
                
                setPan({ x: newX, y: newY });
            }, 50);
        }
    }, [svg]);

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.min(Math.max(0.1, scale * delta), 20);
            
            const newPanX = x - (x - pan.x) * (newScale / scale);
            const newPanY = y - (y - pan.y) * (newScale / scale);

            setScale(newScale);
            setPan({ x: newPanX, y: newPanY });
        }
    };

    const handleMouseDown = (e) => {
        if (e.button === 0) { // Left click
            setIsDragging(true);
            setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPan({
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const copySvg = () => {
        if (!svg) return;
        navigator.clipboard.writeText(svg).then(() => {
            new Notice("SVG copied to clipboard!");
        });
    };

    const downloadSvg = () => {
        if (!svg) return;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const loadExample = (type) => {
        setCode(EXAMPLES[type]);
        setPan({ x: 0, y: 0 });
        setScale(1);
    };

    if (!isFullTab) {
        return (
            <div ref={containerRef} style={STYLES.compactWrapper}>
                <dc.Icon icon="git-merge" style={{ width: '32px', height: '32px', color: '#8b5cf6' }} />
                <p style={STYLES.compactText}>Mermaid Diagram is in compact mode.</p>
                <div style={STYLES.buttonGroup}>
                    <button style={{...STYLES.button, ...STYLES.buttonPrimary}} onClick={handleEnterFullTab}>
                        Enter Full Tab
                    </button>
                </div>
            </div>
        );
    }

    // Update hover style with unique class
    const hoverStyle = STYLES.hoverEffectStyle.replace(/\.interactive-wrapper/g, `.${uniqueWrapperClass}`);

    return (
        <div ref={containerRef} className={uniqueWrapperClass} style={STYLES.fullTabWrapper}>
            <style>{hoverStyle}</style>
            <div
                style={STYLES.iconContainer}
                className="subtle-icon"
                onClick={handleExitFullTab}
            >
                &lt;/&gt;
                <span className="exit-tooltip" style={STYLES.tooltip}>
                    Close Full Mode
                </span>
            </div>

            <div style={{...STYLES.container, height: '100%', border: 'none', borderRadius: 0}}>
                <div style={STYLES.header}>
                <div style={STYLES.title}>
                    <dc.Icon icon="git-merge" style={{ color: '#8b5cf6' }} />
                    Mermaid Diagram
                </div>
                <div style={{display: 'flex', gap: 8}}>
                    <button 
                        style={STYLES.button}
                        onClick={() => setIsEditorVisible(!isEditorVisible)}
                        title={isEditorVisible ? "Hide Editor" : "Show Editor"}
                    >
                        <dc.Icon icon={isEditorVisible ? "eye-off" : "eye"} style={STYLES.icon} />
                        {isEditorVisible ? "Hide Code" : "Show Code"}
                    </button>
                    <button 
                        style={{...STYLES.button, ...STYLES.buttonPrimary}}
                        onClick={copySvg}
                        title="Copy SVG Code"
                    >
                        <dc.Icon icon="copy" style={STYLES.icon} />
                        Copy SVG
                    </button>
                    <button 
                        style={STYLES.button}
                        onClick={downloadSvg}
                        title="Download SVG File"
                    >
                        <dc.Icon icon="download" style={STYLES.icon} />
                        Download
                    </button>
                </div>
            </div>

            <div style={STYLES.content}>
                {isEditorVisible && (
                <div style={STYLES.editorPane}>
                    <div style={STYLES.toolbar}>
                        <span style={{fontSize: 11, color: '#666', marginRight: 'auto'}}>EXAMPLES:</span>
                        {Object.keys(EXAMPLES).map(type => (
                            <button 
                                key={type}
                                style={{...STYLES.button, padding: '2px 6px', fontSize: '10px'}}
                                onClick={() => loadExample(type)}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                    <textarea
                        style={STYLES.textarea}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck={false}
                        placeholder="Enter Mermaid code here..."
                    />
                    {error && (
                        <div style={STYLES.error}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4}}>
                                <dc.Icon icon="alert-triangle" style={{width: 12, height: 12}} />
                                <strong>Syntax Error</strong>
                            </div>
                            {error}
                        </div>
                    )}
                </div>
                )}

                <div 
                    ref={previewRef}
                    style={STYLES.previewPane}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div style={{
                        ...STYLES.previewContainer,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}>
                        {!mermaidLib ? (
                            <div style={{color: '#666', display: 'flex', alignItems: 'center', gap: 8}}>
                                <div className="spinner"></div> Loading Mermaid library...
                            </div>
                        ) : (
                            <div 
                                dangerouslySetInnerHTML={{ __html: svg }} 
                                style={{
                                    pointerEvents: 'none' // Let clicks pass through to container for panning
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
};

return { View: MermaidDiagramComponent };
```
