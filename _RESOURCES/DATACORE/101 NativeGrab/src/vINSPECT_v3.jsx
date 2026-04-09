/**
 * 128_Native_Grab - ELEMENT INSPECTOR DASHBOARD (vINSPECT_v3)
 * Replicates Chrome DevTools "Select Element" functionality with Escape key safety.
 */
async function View({ folderPath }) {
    const { spawn } = require('child_process');
    const { useState, useEffect, useRef, useCallback } = dc;

    const STYLES = {
        main: { height: '100%', background: '#050505', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', display: 'flex', overflow: 'hidden' },
        sidebar: { width: '350px', borderRight: '1px solid #1e1e2e', background: '#0a0a0f', display: 'flex', flexDirection: 'column', height: '100%' },
        content: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto' },
        header: { padding: '20px 30px', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        title: { fontSize: '11px', fontWeight: '900', letterSpacing: '3px', color: '#8b5cf6', textTransform: 'uppercase' },
        btn: (active, color) => ({ 
            padding: '12px 24px', background: active ? '#ef4444' : (color || '#8b5cf6'), color: '#fff', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700',
            letterSpacing: '1px', transition: 'all 0.2s', boxShadow: active ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 0 20px rgba(139, 92, 246, 0.4)'
        }),
        card: { background: '#11111b', borderRadius: '12px', padding: '20px', border: '1px solid #1e1e2e' },
        cardTitle: { fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' },
        tag: { color: '#f472b6', fontWeight: 'bold', fontFamily: 'monospace' },
        attr: { color: '#fbbf24', fontFamily: 'monospace' },
        val: { color: '#4ade80', fontFamily: 'monospace' }
    };

    const App = () => {
        const [isInspecting, setIsInspecting] = useState(false);
        const [node, setNode] = useState(null);
        const [box, setBox] = useState(null);
        const [logs, setLogs] = useState(["> READY_SYSTEM"]);
        
        const addLog = useCallback((m) => setLogs(p => [`> ${m}`, ...p].slice(0, 5)), []);

        const executeCDP = useCallback(async (method, params = {}) => {
            const pStr = JSON.stringify(params);
            return new Promise((resolve) => {
                const bin = '/Applications/Obsidian.app/Contents/MacOS/obsidian';
                const proc = spawn(bin, ['dev:cdp', `method=${method}`, `params=${pStr}`]);
                let out = '';
                proc.stdout.on('data', d => out += d.toString());
                proc.on('close', () => {
                    try { resolve(JSON.parse(out)); } catch(e) { resolve(out); }
                });
            });
        }, []);

        const stopInspection = async () => {
            setIsInspecting(false);
            await executeCDP('Overlay.setInspectMode', { mode: 'none' });
            await executeCDP('Overlay.disable');
            addLog("INSPECTOR: STANDBY");
        };

        const startInspection = async () => {
            setIsInspecting(true);
            await executeCDP('Overlay.enable');
            await executeCDP('Overlay.setInspectMode', {
                mode: 'searchForNode',
                highlightConfig: {
                    showInfo: true, showRulers: true, showExtensionLines: true,
                    contentColor: { r: 139, g: 92, b: 246, a: 0.3 },
                    paddingColor: { r: 74, g: 222, b: 128, a: 0.2 },
                    marginColor: { r: 251, g: 191, b: 36, a: 0.2 }
                }
            });
            addLog("INSPECTOR: ACTIVE");
        };

        const grabElementAt = async (x, y) => {
            addLog(`FETCH: ${x},${y}`);
            const result = await executeCDP('DOM.getNodeForLocation', { x, y });
            if (result && result.nodeId) {
                const desc = await executeCDP('DOM.describeNode', { nodeId: result.nodeId, depth: 1 });
                const boxModel = await executeCDP('DOM.getBoxModel', { nodeId: result.nodeId });
                setNode(desc.node);
                setBox(boxModel.model);
                addLog(`GRABBED: ${desc.node.localName}`);
            }
        };

        // --- Escape Listener ---
        useEffect(() => {
            const handleKey = (e) => {
                if (e.key === 'Escape' && isInspecting) {
                    stopInspection();
                }
            };
            window.addEventListener('keydown', handleKey);
            return () => window.removeEventListener('keydown', handleKey);
        }, [isInspecting]);

        // --- Click Listener ---
        useEffect(() => {
            const handleClick = (e) => {
                if (isInspecting) {
                    e.preventDefault();
                    e.stopPropagation();
                    grabElementAt(Math.round(e.clientX), Math.round(e.clientY));
                    // Auto-stop after grab to improve UX?
                    // stopInspection(); 
                }
            };
            if (isInspecting) window.addEventListener('mousedown', handleClick, true);
            return () => window.removeEventListener('mousedown', handleClick, true);
        }, [isInspecting]);

        return (
            <div id="inspector-dashboard-v3" style={STYLES.main}>
                <aside style={STYLES.sidebar}>
                    <header style={STYLES.header}>
                        <span style={STYLES.title}>Native Grab v3</span>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isInspecting ? '#ef4444' : '#4ade80', boxShadow: '0 0 10px currentColor' }} />
                    </header>
                    <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <button 
                            onClick={isInspecting ? stopInspection : startInspection} 
                            style={STYLES.btn(isInspecting)}
                        >
                            {isInspecting ? "STOP (ESC)" : "START INSPECT"}
                        </button>
                        
                        <div style={STYLES.card}>
                            <div style={STYLES.cardTitle}>Telemetry</div>
                            <div style={{ height: '100px', overflowY: 'auto' }}>
                                {logs.map((l, i) => <div key={i} style={{ fontSize: '10px', fontFamily: 'monospace', marginBottom: '5px', opacity: i === 0 ? 1 : 0.5 }}>{l}</div>)}
                            </div>
                        </div>

                        <div style={{ ...STYLES.card, textAlign: 'center' }}>
                            <div style={STYLES.cardTitle}>Emergency Exit</div>
                            <div style={{ fontSize: '11px', opacity: 0.6 }}>Press <kbd style={{ background: '#222', padding: '2px 6px', borderRadius: '4px', border: '1px solid #444' }}>ESC</kbd> to unlock UI</div>
                        </div>
                    </div>
                </aside>

                <main style={STYLES.content}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '32px' }}>Element Dashboard</h1>
                            <p style={{ margin: '5px 0 0', opacity: 0.5, fontSize: '14px' }}>Native CDP Metascan Interface</p>
                        </div>
                        <button onClick={() => { setNode(null); setBox(null); addLog("DASHBOARD_CLEARED"); }} style={{ ...STYLES.btn(false, '#1e1e2e'), padding: '8px 16px', fontSize: '10px' }}>CLEAR DATA</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '25px' }}>
                        <section style={STYLES.card}>
                            <div style={STYLES.cardTitle}>Active Node</div>
                            {node ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ background: '#050505', padding: '15px', borderRadius: '8px', border: '1px solid #1e1e2e' }}>
                                        <span style={STYLES.tag}>&lt;{node.localName}</span>
                                        {node.attributes && node.attributes.map((attr, i) => i % 2 === 0 ? (
                                            <span key={i}> <span style={STYLES.attr}>{attr}</span>=<span style={STYLES.val}>"{node.attributes[i+1]}"</span></span>
                                        ) : null)}
                                        <span style={STYLES.tag}>&gt;</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {[
                                            { l: 'NODE_ID', v: node.nodeId },
                                            { l: 'CHILDREN', v: node.childNodeCount || 0 },
                                            { l: 'DOMAIN', v: 'DOM' }
                                        ].map((it, i) => (
                                            <div key={i} style={{ background: '#050505', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '5px' }}>{it.l}</div>
                                                <div style={{ fontFamily: 'monospace', color: '#8b5cf6', fontSize: '12px' }}>{it.v}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>Await Selection...</div>}
                        </section>

                        <section style={STYLES.card}>
                            <div style={STYLES.cardTitle}>Dimensions</div>
                            {box ? (
                                <div style={{ width: '100%', aspectRatio: '1/1', background: '#050505', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px solid #1e1e2e' }}>
                                    <div style={{ width: '70%', height: '70%', border: '1px solid #fbbf24', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '70%', height: '70%', border: '1px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#fff' }}>
                                            {box.width}x{box.height}
                                        </div>
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '10px', fontSize: '9px', opacity: 0.4 }}>CONTENT_BOX</div>
                                </div>
                            ) : <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}><dc.Icon icon="box" style={{ width: 48 }} /></div>}
                        </section>
                    </div>

                    <section style={{ ...STYLES.card, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={STYLES.cardTitle}>Deep Metadata Trace</div>
                        <pre style={{ flex: 1, margin: 0, background: '#050505', borderRadius: '8px', padding: '20px', border: '1px solid #1e1e2e', color: '#4ade80', fontSize: '11px', overflowY: 'auto', fontFamily: 'monospace' }}>
                            {node ? JSON.stringify(node, null, 2) : "// [SYSTEM] Idle. Connection stable."}
                        </pre>
                    </section>
                </main>
            </div>
        );
    };

    return <App />;
}

return { View };
