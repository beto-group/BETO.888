/**
 * 128_Native_Grab - ELEMENT INSPECTOR DASHBOARD (vINSPECT_v6)
 * High-reliability selection using JS-native highlight overlay.
 */
async function View({ folderPath }) {
    const { spawn } = require('child_process');
    const { useState, useEffect, useRef, useCallback } = dc;

    const STYLES = {
        main: { height: '100%', background: '#050505', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', display: 'flex', overflow: 'hidden' },
        sidebar: { width: '350px', borderRight: '1px solid #1e1e2e', background: '#0a0a0f', display: 'flex', flexDirection: 'column', height: '100%' },
        content: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto' },
        header: { padding: '20px 30px', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        btn: (active, color) => ({ 
            padding: '12px 24px', background: active ? '#ef4444' : (color || '#8b5cf6'), color: '#fff', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700',
            letterSpacing: '1px', transition: 'all 0.2s', boxShadow: active ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 0 20px rgba(139, 92, 246, 0.4)'
        }),
        card: { background: '#11111b', borderRadius: '12px', padding: '20px', border: '1px solid #1e1e2e' },
        cardTitle: { fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }
    };

    const App = () => {
        const [isInspecting, setIsInspecting] = useState(false);
        const [node, setNode] = useState(null);
        const [logs, setLogs] = useState(["> SYSTEM_V6_HYBRID"]);
        
        const overlayRef = useRef(null);
        const highlighterRef = useRef(null);
        const isInspectingRef = useRef(false);
        useEffect(() => { isInspectingRef.current = isInspecting; }, [isInspecting]);

        const addLog = useCallback((m) => setLogs(p => [`> ${m}`, ...p].slice(0, 5)), []);

        const executeCLI = useCallback(async (cmd, args) => {
            return new Promise((resolve) => {
                const bin = '/Applications/Obsidian.app/Contents/MacOS/obsidian';
                const proc = spawn(bin, [cmd, ...args]);
                let out = '';
                proc.stdout.on('data', d => out += d.toString());
                proc.on('close', () => {
                    try { resolve(JSON.parse(out)); } catch(e) { resolve(out); }
                });
            });
        }, []);

        const stopInspection = () => {
            setIsInspecting(false);
            if (overlayRef.current) overlayRef.current.style.display = 'none';
            if (highlighterRef.current) highlighterRef.current.style.display = 'none';
            addLog("INSPECTOR: STANDBY");
        };

        const startInspection = () => {
            setIsInspecting(true);
            if (overlayRef.current) {
                overlayRef.current.style.display = 'block';
                overlayRef.current.focus();
            }
            addLog("INSPECTOR: ARMED");
        };

        const grabData = async (el) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const data = {
                localName: el.localName,
                id: el.id,
                className: el.className,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                attributes: Array.from(el.attributes).map(a => [a.name, a.value]).flat(),
                innerText: el.innerText ? el.innerText.substring(0, 100) : "N/A"
            };
            setNode(data);
            addLog(`MATCHED: ${data.localName}`);
            // Auto-stop for a fixed selection feel
            stopInspection();
        };

        // --- Core selection logic ---
        useEffect(() => {
            // Create a global overlay to handle selection without interfering with CDP sessions
            const overlay = document.createElement('div');
            overlay.id = 'inspector-selection-overlay';
            Object.assign(overlay.style, {
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                zIndex: 999999, display: 'none', cursor: 'crosshair', pointerEvents: 'auto'
            });

            const highlighter = document.createElement('div');
            Object.assign(highlighter.style, {
                position: 'fixed', border: '1px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.2)',
                zIndex: 999998, display: 'none', pointerEvents: 'none', transition: 'all 0.05s ease-out'
            });

            document.body.appendChild(overlay);
            document.body.appendChild(highlighter);
            overlayRef.current = overlay;
            highlighterRef.current = highlighter;

            const handleMove = (e) => {
                if (!isInspectingRef.current) return;
                overlay.style.pointerEvents = 'none'; // Temporarily pass thru to find target
                const target = document.elementFromPoint(e.clientX, e.clientY);
                overlay.style.pointerEvents = 'auto'; // Block again

                if (target && target !== overlay && target !== highlighter) {
                    const r = target.getBoundingClientRect();
                    Object.assign(highlighter.style, {
                        display: 'block', top: `${r.top}px`, left: `${r.left}px`,
                        width: `${r.width}px`, height: `${r.height}px`
                    });
                }
            };

            const handleClick = (e) => {
                if (!isInspectingRef.current) return;
                e.preventDefault();
                overlay.style.pointerEvents = 'none';
                const target = document.elementFromPoint(e.clientX, e.clientY);
                overlay.style.pointerEvents = 'auto';
                grabData(target);
            };

            const handleKey = (e) => {
                if (e.key === 'Escape' && isInspectingRef.current) stopInspection();
            };

            overlay.addEventListener('mousemove', handleMove);
            overlay.addEventListener('click', handleClick);
            window.addEventListener('keydown', handleKey);

            return () => {
                document.body.removeChild(overlay);
                document.body.removeChild(highlighter);
                window.removeEventListener('keydown', handleKey);
            };
        }, []);

        return (
            <div id="inspector-dashboard-v6" style={STYLES.main}>
                <aside style={STYLES.sidebar}>
                    <header style={STYLES.header}>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: '#8b5cf6' }}>Metascan v6</span>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isInspecting ? '#ef4444' : '#4ade80', boxShadow: '0 0 10px currentColor' }} />
                    </header>
                    <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <button onClick={isInspecting ? stopInspection : startInspection} style={STYLES.btn(isInspecting)}>
                            {isInspecting ? "CANCEL (ESC)" : "SELECT ELEMENT"}
                        </button>
                        <div style={STYLES.card}>
                            <div style={STYLES.cardTitle}>Telemetry Stream</div>
                            <div style={{ height: '120px', overflowY: 'auto' }}>
                                {logs.map((l, i) => <div key={i} style={{ fontSize: '10px', fontFamily: 'monospace', marginBottom: '5px', opacity: i === 0 ? 1 : 0.5 }}>{l}</div>)}
                            </div>
                        </div>
                    </div>
                </aside>

                <main style={STYLES.content}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '32px' }}>Analysis Hub</h1>
                        <button onClick={() => setNode(null)} style={{ ...STYLES.btn(false, '#1e1e2e'), padding: '8px 16px', fontSize: '10px' }}>WIPE CACHE</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '25px' }}>
                        <section style={STYLES.card}>
                            <div style={STYLES.cardTitle}>Live Metadata</div>
                            {node ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ background: '#050505', padding: '15px', borderRadius: '8px', border: '1px solid #1e1e2e' }}>
                                        <span style={{ color: '#f472b6', fontWeight: '900' }}>&lt;{node.localName}</span>
                                        {node.attributes && node.attributes.map((attr, i) => i % 2 === 0 ? (
                                            <span key={i}> <span style={{ color: '#fbbf24' }}>{attr}</span>=<span style={{ color: '#4ade80' }}>"{node.attributes[i+1]}"</span></span>
                                        ) : null)}
                                        <span style={{ color: '#f472b6', fontWeight: '900' }}>&gt;</span>
                                    </div>
                                    <div style={{ height: '60px', background: '#050505', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#4ade80', wordBreak: 'break-all' }}>
                                        {node.innerText}
                                    </div>
                                </div>
                            ) : <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>SELECT AN ELEMENT...</div>}
                        </section>

                        <section style={STYLES.card}>
                            <div style={STYLES.cardTitle}>Bounding Box</div>
                            {node ? (
                                <div style={{ width: '100%', aspectRatio: '1/1', background: '#050505', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #1e1e2e', fontSize: '28px', fontWeight: '900', color: '#8b5cf6' }}>
                                    {node.width}<span style={{ opacity: 0.3, margin: '0 5px' }}>&times;</span>{node.height}
                                </div>
                            ) : <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}><dc.Icon icon="layers" style={{ width: 48 }} /></div>}
                        </section>
                    </div>

                    <section style={{ ...STYLES.card, flex: 1 }}>
                        <div style={STYLES.cardTitle}>Deep Metadata Trace (JSON)</div>
                        <pre style={{ margin: 0, background: '#050505', borderRadius: '8px', padding: '20px', border: '1px solid #1e1e2e', color: '#4ade80', fontSize: '11px', overflowY: 'auto' }}>
                            {node ? JSON.stringify(node, null, 2) : "// Await selection action..."}
                        </pre>
                    </section>
                </main>
            </div>
        );
    };

    return <App />;
}

return { View };
