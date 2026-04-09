/**
 * 128_Native_Grab - METASCAN PRO (v7)
 * Canonical FullTab + Live Hover Tooltip + Native Data Extraction.
 */
async function View({ folderPath }) {
    const { spawn } = require('child_process');
    const { useState, useEffect, useRef, useCallback } = dc;

    const STYLES = {
        main: { height: '100%', background: '#050505', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', display: 'flex', overflow: 'hidden' },
        sidebar: { width: '380px', borderRight: '1px solid #1e1e2e', background: '#0a0a0f', display: 'flex', flexDirection: 'column', height: '100%' },
        content: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto' },
        header: { padding: '20px 30px', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        btn: (active, color) => ({ 
            padding: '14px 28px', background: active ? '#ef4444' : (color || '#8b5cf6'), color: '#fff', 
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '900',
            letterSpacing: '1px', transition: 'all 0.2s', boxShadow: active ? '0 0 25px rgba(239, 68, 68, 0.4)' : '0 0 25px rgba(139, 92, 246, 0.4)',
            textTransform: 'uppercase', fontSize: '11px'
        }),
        card: { background: '#11111b', borderRadius: '14px', padding: '24px', border: '1px solid #1e1e2e', transition: 'all 0.3s' },
        metric: { fontSize: '32px', fontWeight: '900', color: '#8b5cf6', fontFamily: 'JetBrains Mono, monospace' }
    };

    const App = () => {
        const [isInspecting, setIsInspecting] = useState(false);
        const [node, setNode] = useState(null);
        const [logs, setLogs] = useState(["> METASCAN_V7_STANDARDIZED"]);
        
        const containerRef = useRef(null);
        const overlayRef = useRef(null);
        const highlighterRef = useRef(null);
        const tooltipRef = useRef(null);
        const stateRefs = useRef({}).current;

        const isInspectingRef = useRef(false);
        useEffect(() => { isInspectingRef.current = isInspecting; }, [isInspecting]);

        const addLog = useCallback((m) => setLogs(p => [`> ${m}`, ...p].slice(0, 8)), []);

        // --- Canonical FullTab Implementation (aligned with 17 ViewsControl) ---
        useEffect(() => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            const targetPane = document.querySelector(".workspace-leaf.mod-active .workspace-leaf-content");
            if (!targetPane) return;

            const contentWrapper = targetPane.querySelector(".view-content") || targetPane;
            stateRefs.originalParent = container.parentNode;
            stateRefs.placeholder = document.createElement("div");
            stateRefs.placeholder.style.display = "none";
            container.parentNode.insertBefore(stateRefs.placeholder, container);

            stateRefs.parentPosition = { element: contentWrapper, original: contentWrapper.style.position };
            if (getComputedStyle(contentWrapper).position === "static") contentWrapper.style.position = "relative";

            contentWrapper.appendChild(container);
            Object.assign(container.style, {
                position: "absolute", top: "0", left: "0", width: "100%", height: "100%",
                zIndex: "9998", overflow: "hidden", display: "flex"
            });

            return () => {
                if (stateRefs.placeholder?.parentNode) stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
                if (stateRefs.parentPosition?.element) stateRefs.parentPosition.element.style.position = stateRefs.parentPosition.original;
                container.removeAttribute("style");
            };
        }, []);

        const stopInspection = () => {
            setIsInspecting(false);
            if (overlayRef.current) overlayRef.current.style.display = 'none';
            if (highlighterRef.current) highlighterRef.current.style.display = 'none';
            if (tooltipRef.current) tooltipRef.current.style.display = 'none';
            addLog("SCANNER: DISARMED");
        };

        const startInspection = () => {
            setIsInspecting(true);
            if (overlayRef.current) {
                overlayRef.current.style.display = 'block';
                overlayRef.current.focus();
            }
            addLog("SCANNER: ARMED");
        };

        // --- Selection & Tooltip Logic ---
        useEffect(() => {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, display: 'none', cursor: 'crosshair' });

            const highlight = document.createElement('div');
            Object.assign(highlight.style, { position: 'fixed', border: '1px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.2)', zIndex: 999998, display: 'none', pointerEvents: 'none' });

            const tooltip = document.createElement('div');
            Object.assign(tooltip.style, { 
                position: 'fixed', padding: '6px 12px', background: '#8b5cf6', color: '#fff', borderRadius: '4px',
                fontSize: '11px', fontWeight: 'bold', zIndex: 1000000, display: 'none', pointerEvents: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', fontFamily: 'monospace'
            });

            document.body.appendChild(overlay);
            document.body.appendChild(highlight);
            document.body.appendChild(tooltip);
            overlayRef.current = overlay;
            highlighterRef.current = highlight;
            tooltipRef.current = tooltip;

            const handleMove = (e) => {
                if (!isInspectingRef.current) return;
                overlay.style.pointerEvents = 'none';
                const t = document.elementFromPoint(e.clientX, e.clientY);
                overlay.style.pointerEvents = 'auto';

                if (t && t !== overlay && t !== highlight && t !== tooltip) {
                    const r = t.getBoundingClientRect();
                    Object.assign(highlight.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
                    
                    const tag = t.localName;
                    const id = t.id ? `#${t.id}` : '';
                    const cls = t.className && typeof t.className === 'string' ? `.${t.className.split(' ').join('.')}` : '';
                    tooltip.innerHTML = `<span style="opacity:0.8">${tag}</span><span style="color:#fbbf24">${id}</span><span style="opacity:0.6">${cls}</span> <span style="margin-left:8px; border-left:1px solid rgba(255,255,255,0.3); padding-left:8px">${Math.round(r.width)}×${Math.round(r.height)}</span>`;
                    
                    Object.assign(tooltip.style, { display: 'block', top: `${e.clientY + 20}px`, left: `${e.clientX + 20}px` });
                }
            };

            const handleClick = (e) => {
                if (!isInspectingRef.current) return;
                e.preventDefault();
                overlay.style.pointerEvents = 'none';
                const target = document.elementFromPoint(e.clientX, e.clientY);
                overlay.style.pointerEvents = 'auto';
                
                if (target) {
                    const r = target.getBoundingClientRect();
                    setNode({
                        localName: target.localName,
                        id: target.id,
                        className: target.className,
                        width: Math.round(r.width),
                        height: Math.round(r.height),
                        innerText: target.innerText?.substring(0, 150) || "N/A",
                        attributes: Array.from(target.attributes).map(a => [a.name, a.value]).flat()
                    });
                    addLog(`CAPTURED: ${target.localName}`);
                }
                stopInspection();
            };

            const handleKey = (e) => { if (e.key === 'Escape' && isInspectingRef.current) stopInspection(); };

            overlay.addEventListener('mousemove', handleMove);
            overlay.addEventListener('click', handleClick);
            window.addEventListener('keydown', handleKey, { capture: true });

            return () => {
                document.body.removeChild(overlay);
                document.body.removeChild(highlight);
                document.body.removeChild(tooltip);
                window.removeEventListener('keydown', handleKey, { capture: true });
            };
        }, []);

        return (
            <div ref={containerRef} id="metascan-v7" style={STYLES.main}>
                <aside style={STYLES.sidebar}>
                    <header style={STYLES.header}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: isInspecting ? '#ef4444' : '#4ade80' }} />
                            <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: '#8b5cf6' }}>METASCAN PRO V7</span>
                        </div>
                    </header>
                    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <button onClick={isInspecting ? stopInspection : startInspection} style={STYLES.btn(isInspecting)}>
                            {isInspecting ? "CANCEL SCAN (ESC)" : "SELECT ELEMENT"}
                        </button>
                        <div style={STYLES.card}>
                            <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginBottom: '15px' }}>TELEMETRY_STREAM</div>
                            <div style={{ height: '200px', overflowY: 'auto' }}>
                                {logs.map((l, i) => <div key={i} style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', marginBottom: '8px', opacity: i === 0 ? 1 : 0.4 }}>{l}</div>)}
                            </div>
                        </div>
                    </div>
                </aside>

                <main style={STYLES.content}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '42px', letterSpacing: '-1px' }}>Analysis Layer</h1>
                        <span style={{ fontSize: '10px', opacity: 0.3 }}>Fid: 128.NATIVE_GRAB.V7</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '30px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <section style={STYLES.card}>
                                <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginBottom: '20px' }}>DOM_SNAPSHOT</div>
                                {node ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ background: '#050505', padding: '25px', borderRadius: '12px', border: '1px solid #1e1e2e', fontSize: '13px', lineHeight: '1.6' }}>
                                            <span style={{ color: '#f472b6', fontWeight: '900' }}>&lt;{node.localName}</span>
                                            {node.id && <span> <span style={{ color: '#fbbf24' }}>id</span>=<span style={{ color: '#4ade80' }}>"{node.id}"</span></span>}
                                            {node.className && <span> <span style={{ color: '#fbbf24' }}>class</span>=<span style={{ color: '#4ade80' }}>"{node.className}"</span></span>}
                                            <span style={{ color: '#f472b6', fontWeight: '900' }}>&gt;</span>
                                        </div>
                                        <div style={{ background: '#050505', padding: '20px', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', border: '1px solid #1e1e2e', maxHeight: '100px', overflow: 'hidden' }}>
                                            "{node.innerText}"
                                        </div>
                                    </div>
                                ) : <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: '14px', letterSpacing: '2px' }}>AWAITING_INPUT_SIGNAL</div>}
                            </section>

                            <section style={{ ...STYLES.card, flex: 1 }}>
                                <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginBottom: '20px' }}>METADATA_TRACE</div>
                                <pre style={{ margin: 0, background: '#050505', borderRadius: '10px', padding: '25px', border: '1px solid #1e1e2e', color: '#4ade80', fontSize: '11px', overflowY: 'auto' }}>
                                    {node ? JSON.stringify(node, null, 2) : "// Scan an element to view raw metadata trace."}
                                </pre>
                            </section>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <section style={{ ...STYLES.card, textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginBottom: '20px' }}>WIDTH_DIM</div>
                                <div style={STYLES.metric}>{node ? node.width : "---"}<span style={{ fontSize: '12px', opacity: 0.3 }}>px</span></div>
                            </section>
                            <section style={{ ...STYLES.card, textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginBottom: '20px' }}>HEIGHT_DIM</div>
                                <div style={STYLES.metric}>{node ? node.height : "---"}<span style={{ fontSize: '12px', opacity: 0.3 }}>px</span></div>
                            </section>
                            <section style={{ ...STYLES.card, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #11111b, #0a0a0f)' }}>
                                <dc.Icon icon="crosshair" style={{ width: 80, height: 80, opacity: node ? 1 : 0.1, color: '#8b5cf6', transition: 'all 0.5s' }} />
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        );
    };

    return <App />;
}
return { View };
