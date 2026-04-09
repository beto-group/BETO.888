/**
 * 128_Native_Grab - METASCAN PRO (v8)
 * THE IMPECCABLE STATUS EDITION
 * OKLCH Palettes + Glassmorphism + Lucide + FullTab Factory.
 */
async function View({ folderPath }) {
    const { spawn } = require('child_process');
    const { useState, useEffect, useRef, useCallback } = dc;

    // --- DESIGN TOKENS (OKLCH DESIGN BIBLE) ---
    const TOKENS = {
        primary: 'oklch(65.41% 0.176 285.34)',       // Vivid Electropurple
        primaryGlow: 'rgba(139, 92, 246, 0.4)',
        bg: 'oklch(14.5% 0.012 285.34)',            // Tinted Obsidian
        surface: 'rgba(15, 23, 42, 0.6)',           // Slate-Tinted Glass
        surfaceElevated: 'oklch(18% 0.015 285.34)',
        border: 'rgba(139, 92, 246, 0.15)',         // Subtle Purple Glass Border
        textDim: 'oklch(70% 0.01 285.34)',
        textBright: 'oklch(95% 0.005 285.34)',
        accentGold: 'oklch(80% 0.15 85)',           // For IDs
        accentPink: 'oklch(75% 0.18 330)',          // For Tags
        accentGreen: 'oklch(75% 0.18 150)'          // For Classes
    };

    const STYLES = {
        main: { height: '100%', background: TOKENS.bg, color: TOKENS.textBright, fontFamily: 'Outfit, Inter, sans-serif', display: 'flex', overflow: 'hidden' },
        sidebar: { width: '400px', borderRight: `1px solid ${TOKENS.border}`, background: 'rgba(10, 10, 15, 0.8)', display: 'flex', flexDirection: 'column', height: '100%', backdropFilter: 'blur(20px)' },
        content: { flex: 1, padding: '50px', display: 'flex', flexDirection: 'column', gap: '35px', overflowY: 'auto' },
        header: { padding: '25px 35px', borderBottom: `1px solid ${TOKENS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        title: { fontSize: '11px', fontWeight: '900', letterSpacing: '4px', color: TOKENS.primary, textTransform: 'uppercase' },
        btn: (active) => ({ 
            padding: '16px 32px', background: active ? 'oklch(60% 0.18 20)' : TOKENS.primary, color: '#fff', 
            border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '900',
            letterSpacing: '1.5px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
            boxShadow: active ? '0 0 30px rgba(239, 68, 68, 0.3)' : `0 0 30px ${TOKENS.primaryGlow}`,
            textTransform: 'uppercase', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
        }),
        card: { 
            background: TOKENS.surface, borderRadius: '20px', padding: '28px', border: `1px solid ${TOKENS.border}`, 
            backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden'
        },
        cardTitle: { 
            fontSize: '10px', color: TOKENS.textDim, textTransform: 'uppercase', letterSpacing: '2.5px', 
            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' 
        },
        metricLabel: { fontSize: '42px', fontWeight: '900', color: TOKENS.primary, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-2px' }
    };

    // --- Safe Icon Helper (SEQ-5 Standard) ---
    const Icon = ({ name, size = 18, color = 'currentColor', style = {} }) => {
        return (
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
                <dc.Icon icon={name} style={{ width: size, height: size, color }} />
            </div>
        );
    };

    const App = () => {
        const [isInspecting, setIsInspecting] = useState(false);
        const [node, setNode] = useState(null);
        const [logs, setLogs] = useState(["SYSTEM_INITIALIZED", "PROTOCOL_V8_ACTIVE"]);
        
        const containerRef = useRef(null);
        const overlayRef = useRef(null);
        const highlighterRef = useRef(null);
        const tooltipRef = useRef(null);
        const stateRefs = useRef({}).current;

        const isInspectingRef = useRef(false);
        useEffect(() => { isInspectingRef.current = isInspecting; }, [isInspecting]);

        const addLog = useCallback((m) => setLogs(p => [m, ...p].slice(0, 10)), []);

        // --- Canonical FullTab Factory ---
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
                zIndex: "9998", overflow: "hidden", display: "flex", background: TOKENS.bg
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
            addLog("SCANNER_STANDBY");
        };

        const startInspection = () => {
            setIsInspecting(true);
            if (overlayRef.current) overlayRef.current.style.display = 'block';
            addLog("SCANNER_ARMED_SELECT_ELEMENT");
        };

        // --- Selection & Floating Feedback Layer ---
        useEffect(() => {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, display: 'none', cursor: 'crosshair' });

            const highlight = document.createElement('div');
            Object.assign(highlight.style, { position: 'fixed', border: `2px solid ${TOKENS.primary}`, background: 'rgba(139, 92, 246, 0.15)', zIndex: 999998, display: 'none', pointerEvents: 'none', borderRadius: '4px', transition: 'all 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)' });

            const tooltip = document.createElement('div');
            Object.assign(tooltip.style, { 
                position: 'fixed', padding: '10px 16px', background: 'rgba(15, 23, 42, 0.95)', border: `1px solid ${TOKENS.border}`,
                color: TOKENS.textBright, borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', zIndex: 1000000, display: 'none', 
                pointerEvents: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', fontFamily: 'JetBrains Mono'
            });

            document.body.appendChild(overlay);
            document.body.appendChild(highlight);
            document.body.appendChild(tooltip);
            overlayRef.current = overlay; highlighterRef.current = highlight; tooltipRef.current = tooltip;

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
                    tooltip.innerHTML = `
                        <span style="color:${TOKENS.accentPink}">${tag}</span>
                        <span style="color:${TOKENS.accentGold}">${id}</span>
                        <span style="color:${TOKENS.accentGreen}; opacity:0.7">${cls}</span>
                        <div style="margin-top:4px; opacity:0.5; font-size:10px">${Math.round(r.width)} × ${Math.round(r.height)}</div>
                    `;
                    Object.assign(tooltip.style, { display: 'block', top: `${e.clientY + 20}px`, left: `${e.clientX + 20}px` });
                }
            };

            const handleClick = (e) => {
                if (!isInspectingRef.current) return;
                e.preventDefault();
                overlay.style.pointerEvents = 'none';
                const t = document.elementFromPoint(e.clientX, e.clientY);
                overlay.style.pointerEvents = 'auto';
                
                if (t) {
                    const r = t.getBoundingClientRect();
                    setNode({
                        localName: t.localName,
                        id: t.id,
                        className: t.className,
                        width: Math.round(r.width),
                        height: Math.round(r.height),
                        innerText: t.innerText?.substring(0, 200) || "EMPTY_SOURCE",
                        attributes: Array.from(t.attributes).map(a => [a.name, a.value]).flat()
                    });
                    addLog(`NODE_MATCHED_${t.localName.toUpperCase()}`);
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
            <div ref={containerRef} id="metascan-v8" style={STYLES.main}>
                <aside style={STYLES.sidebar}>
                    <header style={STYLES.header}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: isInspecting ? TOKENS.primary : '#4ade80', boxShadow: '0 0 15px currentColor', animation: isInspecting ? 's-pulse 1.5s infinite' : 'none' }} />
                            <span style={STYLES.title}>METASCAN PRO</span>
                        </div>
                        <Icon name="shield-check" color={TOKENS.primary} size={20} />
                    </header>
                    
                    <div style={{ padding: '45px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <button onClick={isInspecting ? stopInspection : startInspection} style={STYLES.btn(isInspecting)}>
                            <Icon name={isInspecting ? "x-circle" : "mouse-pointer-2"} size={18} />
                            {isInspecting ? "DISARM" : "SELECT ELEMENT"}
                        </button>

                        <div style={STYLES.card}>
                            <div style={STYLES.cardTitle}>
                                <Icon name="activity" size={14} color={TOKENS.primary} />
                                TELEMETRY_STREAM
                            </div>
                            <div style={{ height: '250px', overflowY: 'auto', paddingRight: '10px' }}>
                                {logs.map((l, i) => (
                                    <div key={i} style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', marginBottom: '12px', opacity: i === 0 ? 1 : 0.4, borderLeft: `2px solid ${i === 0 ? TOKENS.primary : 'transparent'}`, paddingLeft: '12px' }}>
                                        <span style={{ opacity: 0.3 }}>[{new Date().toLocaleTimeString().split(' ')[0]}]</span> {l}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
                            <span style={{ fontSize: '9px', letterSpacing: '2px', opacity: 0.2, fontWeight: '900' }}>v8.IMPECCABLE</span>
                        </div>
                    </div>
                </aside>

                <main style={STYLES.content}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '56px', letterSpacing: '-3px', color: TOKENS.textBright }}>Analysis <span style={{ color: TOKENS.primary }}>Hub</span></h1>
                            <div style={{ fontSize: '12px', opacity: 0.4, letterSpacing: '4px', textTransform: 'uppercase', marginTop: '5px' }}>High Fidelity Discovery Layer</div>
                        </div>
                        <button onClick={() => setNode(null)} style={{ ...STYLES.btn(false), background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, color: TOKENS.primary }}>
                            <Icon name="trash-2" size={18} />
                            CLEAR_CACHE
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '35px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
                            <section style={STYLES.card}>
                                <div style={STYLES.cardTitle}>
                                    <Icon name="layout" size={14} color={TOKENS.primary} />
                                    DOM_SNAPSHOT
                                </div>
                                {node ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '30px', borderRadius: '16px', border: `1px solid ${TOKENS.border}`, fontSize: '16px', fontFamily: 'JetBrains Mono' }}>
                                            <span style={{ color: TOKENS.accentPink, fontWeight: '900' }}>&lt;{node.localName}</span>
                                            {node.id && <span> <span style={{ color: TOKENS.accentGold }}>id</span>=<span style={{ color: TOKENS.accentGreen }}>"{node.id}"</span></span>}
                                            {node.className && <span> <span style={{ color: TOKENS.accentGold }}>class</span>=<span style={{ color: TOKENS.accentGreen }}>"{node.className}"</span></span>}
                                            <span style={{ color: TOKENS.accentPink, fontWeight: '900' }}>&gt;</span>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', fontSize: '13px', color: TOKENS.textDim, border: `1px dashed ${TOKENS.border}`, fontStyle: 'italic', lineHeight: '1.6' }}>
                                            "{node.innerText}"
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                                        <Icon name="mouse-pointer-2" size={48} color={TOKENS.primary} style={{ opacity: 0.1 }} />
                                        <div style={{ fontSize: '12px', letterSpacing: '3px', opacity: 0.2, fontWeight: '900' }}>AWAITING_INPUT_SIGNAL</div>
                                    </div>
                                )}
                            </section>

                            <section style={{ ...STYLES.card, flex: 1 }}>
                                <div style={STYLES.cardTitle}>
                                    <Icon name="code" size={14} color={TOKENS.primary} />
                                    DEEP_METADATA_TRACE
                                </div>
                                <pre style={{ margin: 0, background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '30px', border: `1px solid ${TOKENS.border}`, color: TOKENS.accentGreen, fontSize: '12px', overflowY: 'auto', fontFamily: 'JetBrains Mono' }}>
                                    {node ? JSON.stringify(node, null, 4) : "// No telemetry data captured in current session."}
                                </pre>
                            </section>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
                            <section style={{ ...STYLES.card, textAlign: 'center' }}>
                                <div style={STYLES.cardTitle}><Icon name="maximize-2" size={14} color={TOKENS.primary} /> WIDTH</div>
                                <div style={STYLES.metricLabel}>{node ? node.width : "---"}<span style={{ fontSize: '14px', opacity: 0.3, letterSpacing: '0' }}>px</span></div>
                            </section>
                            <section style={{ ...STYLES.card, textAlign: 'center' }}>
                                <div style={STYLES.cardTitle}><Icon name="minimize-2" size={14} color={TOKENS.primary} /> HEIGHT</div>
                                <div style={STYLES.metricLabel}>{node ? node.height : "---"}<span style={{ fontSize: '14px', opacity: 0.3, letterSpacing: '0' }}>px</span></div>
                            </section>
                            <section style={{ ...STYLES.card, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent)' }}>
                                <div style={{ position: 'relative' }}>
                                    <Icon name="crosshair" size={120} color={TOKENS.primary} style={{ opacity: node ? 1 : 0.05, transition: 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)' }} />
                                    {isInspecting && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '160px', height: '160px', border: `2px solid ${TOKENS.primary}`, borderRadius: '50%', animation: 's-pulse 2s infinite' }} />}
                                </div>
                            </section>
                        </div>
                    </div>
                </main>

                <style>{`
                    @keyframes s-pulse { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; } 50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.2; } 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; } }
                    #metascan-v8 ::-webkit-scrollbar { width: 6px; }
                    #metascan-v8 ::-webkit-scrollbar-thumb { background: ${TOKENS.border}; borderRadius: 10px; }
                `}</style>
            </div>
        );
    };

    return <App />;
}
return { View };
