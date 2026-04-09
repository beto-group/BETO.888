/**
 * 128_Native_Grab - METASCAN PRO (v9)
 * STABILITY & UTILITY RELEASE
 * Horizontal scroll fix + Copy-to-Clipboard integration.
 */
async function View({ folderPath }) {
    const { spawn } = require('child_process');
    const { useState, useEffect, useRef, useCallback } = dc;

    const TOKENS = {
        primary: 'oklch(65.41% 0.176 285.34)',
        bg: 'oklch(14.5% 0.012 285.34)',
        surface: 'rgba(15, 23, 42, 0.6)',
        border: 'rgba(139, 92, 246, 0.15)',
        textDim: 'oklch(70% 0.01 285.34)',
        textBright: 'oklch(95% 0.005 285.34)',
        accentGold: 'oklch(80% 0.15 85)',
        accentPink: 'oklch(75% 0.18 330)',
        accentGreen: 'oklch(75% 0.18 150)'
    };

    const STYLES = {
        main: { height: '100%', background: TOKENS.bg, color: TOKENS.textBright, fontFamily: 'Outfit, Inter, sans-serif', display: 'flex', overflow: 'hidden' },
        sidebar: { width: '400px', flexShrink: 0, borderRight: `1px solid ${TOKENS.border}`, background: 'rgba(10, 10, 15, 0.8)', display: 'flex', flexDirection: 'column', height: '100%', backdropFilter: 'blur(20px)' },
        content: { flex: 1, minWidth: 0, padding: '50px', display: 'flex', flexDirection: 'column', gap: '35px', overflowY: 'auto' },
        header: { padding: '25px 35px', borderBottom: `1px solid ${TOKENS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        btn: (active, small) => ({ 
            padding: small ? '8px 16px' : '16px 32px', background: active ? 'oklch(60% 0.18 20)' : TOKENS.primary, color: '#fff', 
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '900',
            letterSpacing: '1px', transition: 'all 0.2s', textTransform: 'uppercase', fontSize: small ? '10px' : '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }),
        card: { 
            background: TOKENS.surface, borderRadius: '20px', padding: '28px', border: `1px solid ${TOKENS.border}`, 
            backdropFilter: 'blur(16px)', position: 'relative', overflow: 'hidden', minWidth: 0
        },
        cardTitle: { 
            fontSize: '10px', color: TOKENS.textDim, textTransform: 'uppercase', letterSpacing: '2px', 
            marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        },
        metricLabel: { fontSize: '42px', fontWeight: '900', color: TOKENS.primary, fontFamily: 'JetBrains Mono, monospace' }
    };

    const Icon = ({ name, size = 18, color = 'currentColor' }) => (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}><dc.Icon icon={name} style={{ width: size, height: size, color }} /></div>
    );

    const App = () => {
        const [isInspecting, setIsInspecting] = useState(false);
        const [node, setNode] = useState(null);
        const [logs, setLogs] = useState(["v9_STABILITY_PROTOCOL_ENGAGED"]);
        const [copied, setCopied] = useState(false);
        
        const containerRef = useRef(null);
        const stateRefs = useRef({}).current;
        const isInspectingRef = useRef(false);
        useEffect(() => { isInspectingRef.current = isInspecting; }, [isInspecting]);

        const addLog = useCallback((m) => setLogs(p => [m, ...p].slice(0, 10)), []);

        // --- Standard FullTab ---
        useEffect(() => {
            if (!containerRef.current) return;
            const target = document.querySelector(".workspace-leaf.mod-active .workspace-leaf-content");
            if (!target) return;
            const content = target.querySelector(".view-content") || target;
            const container = containerRef.current;
            stateRefs.placeholder = document.createElement("div");
            container.parentNode.insertBefore(stateRefs.placeholder, container);
            content.appendChild(container);
            content.style.position = "relative";
            Object.assign(container.style, { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: "9998", display: "flex", background: TOKENS.bg });
            return () => {
                if (stateRefs.placeholder?.parentNode) stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
                container.removeAttribute("style");
            };
        }, []);

        const stopInspection = () => setIsInspecting(false);
        const startInspection = () => { setIsInspecting(true); addLog("SCANNER_ARMED"); };

        const handleCopy = () => {
            if (!node) return;
            navigator.clipboard.writeText(JSON.stringify(node, null, 2));
            setCopied(true);
            addLog("METADATA_COPIED_TO_CLIPBOARD");
            setTimeout(() => setCopied(false), 2000);
        };

        // --- Selection Logic ---
        useEffect(() => {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, display: 'none', cursor: 'crosshair' });
            const highlight = document.createElement('div');
            Object.assign(highlight.style, { position: 'fixed', border: `2px solid ${TOKENS.primary}`, background: 'rgba(139,92,246,0.1)', zIndex: 999998, display: 'none', pointerEvents: 'none', borderRadius: '4px' });
            const tooltip = document.createElement('div');
            Object.assign(tooltip.style, { position: 'fixed', padding: '10px 16px', background: 'rgba(15,23,42,0.95)', border: `1px solid ${TOKENS.border}`, color: '#fff', borderRadius: '10px', fontSize: '11px', zIndex: 1000000, display: 'none', pointerEvents: 'none', fontFamily: 'JetBrains Mono' });
            document.body.appendChild(overlay); document.body.appendChild(highlight); document.body.appendChild(tooltip);

            const handleMove = (e) => {
                if (!isInspectingRef.current) return;
                overlay.style.pointerEvents = 'none';
                const t = document.elementFromPoint(e.clientX, e.clientY);
                overlay.style.pointerEvents = 'auto';
                if (t && t !== overlay && t !== highlight && t !== tooltip) {
                    const r = t.getBoundingClientRect();
                    Object.assign(highlight.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
                    tooltip.innerHTML = `<span style="color:${TOKENS.accentPink}">${t.localName}</span><span style="color:${TOKENS.accentGold}">${t.id ? '#'+t.id:''}</span> <div style="font-size:9px; opacity:0.5">${Math.round(r.width)}×${Math.round(r.height)}</div>`;
                    Object.assign(tooltip.style, { display: 'block', top: `${e.clientY+20}px`, left: `${e.clientX+20}px` });
                }
            };

            const handleClick = (e) => {
                if (!isInspectingRef.current) return;
                e.preventDefault(); overlay.style.pointerEvents = 'none';
                const t = document.elementFromPoint(e.clientX, e.clientY);
                overlay.style.pointerEvents = 'auto';
                if (t) {
                    const r = t.getBoundingClientRect();
                    setNode({ localName: t.localName, id: t.id, className: t.className, width: Math.round(r.width), height: Math.round(r.height), innerText: t.innerText?.substring(0, 300), attributes: Array.from(t.attributes).map(a => [a.name, a.value]).flat() });
                    addLog(`CAPTURED_${t.localName.toUpperCase()}`);
                }
                setIsInspecting(false);
            };

            overlay.addEventListener('mousemove', handleMove); overlay.addEventListener('click', handleClick);
            window.addEventListener('keydown', (e) => { if(e.key === 'Escape' && isInspectingRef.current) setIsInspecting(false); }, { capture: true });
            overlayRef.current = overlay; highlighterRef.current = highlight; tooltipRef.current = tooltip;
            return () => { document.body.removeChild(overlay); document.body.removeChild(highlight); document.body.removeChild(tooltip); };
        }, []);

        useEffect(() => {
            if (overlayRef.current) overlayRef.current.style.display = isInspecting ? 'block' : 'none';
            if (highlighterRef.current && !isInspecting) highlighterRef.current.style.display = 'none';
            if (tooltipRef.current && !isInspecting) tooltipRef.current.style.display = 'none';
        }, [isInspecting]);

        return (
            <div ref={containerRef} id="metascan-v9" style={STYLES.main}>
                <aside style={STYLES.sidebar}>
                    <header style={STYLES.header}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: isInspecting ? TOKENS.primary : '#4ade80', boxShadow: '0 0 15px currentColor' }} />
                            <span style={{ fontSize: '11px', fontWeight: '900', color: TOKENS.primary, letterSpacing: '2px' }}>METASCAN PRO</span>
                        </div>
                    </header>
                    <div style={{ padding: '45px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <button onClick={isInspecting ? stopInspection : startInspection} style={STYLES.btn(isInspecting)}>
                            <Icon name={isInspecting ? "x-circle" : "mouse-pointer-2"} />
                            {isInspecting ? "DISARM" : "SELECT ELEMENT"}
                        </button>
                        <div style={STYLES.card}>
                            <div style={STYLES.cardTitle}><div><Icon name="activity" size={14} /> STREAM</div></div>
                            <div style={{ height: '350px', overflowY: 'auto' }}>
                                {logs.map((l, i) => <div key={i} style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', marginBottom: '8px', opacity: i === 0 ? 1 : 0.3 }}>{l}</div>)}
                            </div>
                        </div>
                    </div>
                </aside>

                <main style={STYLES.content}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '56px', letterSpacing: '-3px' }}>Analysis Layer</h1>
                        <span style={{ fontSize: '10px', opacity: 0.2 }}>Stable v9</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '35px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '35px', minWidth: 0 }}>
                            <section style={STYLES.card}>
                                <div style={STYLES.cardTitle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="layout" size={14} /> DOM_SNAPSHOT</div>
                                    <button onClick={handleCopy} disabled={!node} style={STYLES.btn(false, true)}>
                                        <Icon name={copied ? "check" : "copy"} size={14} /> {copied ? "COPIED" : "COPY DOM"}
                                    </button>
                                </div>
                                {node ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', minWidth: 0 }}>
                                        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '14px', fontFamily: 'JetBrains Mono', wordBreak: 'break-all' }}>
                                            <span style={{ color: TOKENS.accentPink }}>&lt;{node.localName}</span> {node.id && <span><span style={{ color: TOKENS.accentGold }}>id</span>=<span style={{ color: TOKENS.accentGreen }}>"{node.id}"</span></span>} <span style={{ color: TOKENS.accentPink }}>&gt;</span>
                                        </div>
                                        <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '12px', opacity: 0.6, wordBreak: 'break-all', overflow: 'hidden', height: '60px' }}>
                                            {node.innerText}
                                        </div>
                                    </div>
                                ) : <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>AWAITING_SIGNAL</div>}
                            </section>

                            <section style={{ ...STYLES.card, flex: 1 }}>
                                <div style={STYLES.cardTitle}><div><Icon name="code" size={14} /> DATA_TRACE</div></div>
                                <pre style={{ margin: 0, background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '25px', border: `1px solid ${TOKENS.border}`, color: TOKENS.accentGreen, fontSize: '11px', overflowX: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {node ? JSON.stringify(node, null, 2) : "// Protocol trace standby."}
                                </pre>
                            </section>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
                            <section style={{ ...STYLES.card, textAlign: 'center' }}>
                                <div style={STYLES.cardTitle}><Icon name="maximize-2" size={12} /> WIDTH</div>
                                <div style={STYLES.metricLabel}>{node ? node.width : "---"}</div>
                            </section>
                            <section style={{ ...STYLES.card, textAlign: 'center' }}>
                                <div style={STYLES.cardTitle}><Icon name="minimize-2" size={12} /> HEIGHT</div>
                                <div style={STYLES.metricLabel}>{node ? node.height : "---"}</div>
                            </section>
                            <section style={{ ...STYLES.card, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="crosshair" size={100} color={TOKENS.primary} style={{ opacity: node ? 1 : 0.05 }} />
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
