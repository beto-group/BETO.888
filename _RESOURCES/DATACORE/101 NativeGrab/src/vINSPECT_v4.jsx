/**
 * 128_Native_Grab - ELEMENT INSPECTOR DASHBOARD (vINSPECT_v4)
 * High-Fidelity DOM extraction using obsidian eval bridge.
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
        const [logs, setLogs] = useState(["> SYSTEM_BOOT"]);
        
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

        const stopInspection = async () => {
            setIsInspecting(false);
            await executeCLI('dev:cdp', ['method=Overlay.setInspectMode', 'params={"mode":"none"}']);
            await executeCLI('dev:cdp', ['method=Overlay.disable']);
            addLog("INSPECTOR: STANDBY");
        };

        const startInspection = async () => {
            setIsInspecting(true);
            await executeCLI('dev:cdp', ['method=Overlay.enable', 'params={}']);
            await executeCLI('dev:cdp', ['method=Overlay.setInspectMode', 'params={"mode":"searchForNode","highlightConfig":{"showInfo":true,"contentColor":{"r":139,"g":92,"b":246,"a":0.3}}}']);
            addLog("INSPECTOR: ACTIVE");
        };

        const grabElementAt = async (x, y) => {
            addLog(`SCANNING: ${x},${y}`);
            // Use 'obsidian eval' to get data directly from the DOM at coordinates
            const code = `
                (function(){
                    const el = document.elementFromPoint(${x}, ${y});
                    if(!el) return null;
                    const rect = el.getBoundingClientRect();
                    return {
                        localName: el.localName,
                        id: el.id,
                        className: el.className,
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        attributes: Array.from(el.attributes).map(a => [a.name, a.value]).flat(),
                        innerText: el.innerText ? el.innerText.substring(0, 100) : ""
                    };
                })()
            `.replace(/\n/g, ' ');
            
            const result = await executeCLI('eval', [`code=${code}`]);
            if (result) {
                setNode(result);
                addLog(`MATCHED: ${result.localName}`);
            } else {
                addLog("ERR: NO_ELEMENT");
            }
        };

        useEffect(() => {
            const handleKey = (e) => {
                if (e.key === 'Escape' && isInspecting) stopInspection();
            };
            window.addEventListener('keydown', handleKey);
            return () => window.removeEventListener('keydown', handleKey);
        }, [isInspecting]);

        useEffect(() => {
            const handleClick = (e) => {
                if (isInspecting) {
                    e.preventDefault();
                    e.stopPropagation();
                    grabElementAt(Math.round(e.clientX), Math.round(e.clientY));
                    // stopInspection(); // Keep active for multiple selections
                }
            };
            if (isInspecting) window.addEventListener('mousedown', handleClick, true);
            return () => window.removeEventListener('mousedown', handleClick, true);
        }, [isInspecting]);

        return (
            <div id="inspector-dashboard-v4" style={STYLES.main}>
                <aside style={STYLES.sidebar}>
                    <header style={STYLES.header}>
                        <span style={STYLES.title}>Native Grab v4</span>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isInspecting ? '#ef4444' : '#4ade80', boxShadow: '0 0 10px currentColor' }} />
                    </header>
                    <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <button onClick={isInspecting ? stopInspection : startInspection} style={STYLES.btn(isInspecting)}>
                            {isInspecting ? "STOP (ESC)" : "START INSPECT"}
                        </button>
                        <div style={STYLES.card}>
                            <div style={STYLES.cardTitle}>Telemetry</div>
                            <div style={{ height: '100px', overflowY: 'auto' }}>
                                {logs.map((l, i) => <div key={i} style={{ fontSize: '10px', fontFamily: 'monospace', marginBottom: '5px', opacity: i === 0 ? 1 : 0.5 }}>{l}</div>)}
                            </div>
                        </div>
                    </div>
                </aside>

                <main style={STYLES.content}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '32px' }}>Metascan Dashboard</h1>
                        <button onClick={() => setNode(null)} style={{ ...STYLES.btn(false, '#1e1e2e'), padding: '8px 16px', fontSize: '10px' }}>RESET</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: '25px' }}>
                        <section style={STYLES.card}>
                            <div style={STYLES.cardTitle}>Selected Node</div>
                            {node ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ background: '#050505', padding: '15px', borderRadius: '8px', border: '1px solid #1e1e2e' }}>
                                        <span style={STYLES.tag}>&lt;{node.localName}</span>
                                        {node.attributes && node.attributes.map((attr, i) => i % 2 === 0 ? (
                                            <span key={i}> <span style={STYLES.attr}>{attr}</span>=<span style={STYLES.val}>"{node.attributes[i+1]}"</span></span>
                                        ) : null)}
                                        <span style={STYLES.tag}>&gt;</span>
                                    </div>
                                    <div style={{ height: '60px', background: '#050505', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#4ade80' }}>
                                        {node.innerText || "No text content"}
                                    </div>
                                </div>
                            ) : <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>Await Selection...</div>}
                        </section>

                        <section style={STYLES.card}>
                            <div style={STYLES.cardTitle}>Metrics</div>
                            {node ? (
                                <div style={{ width: '100%', aspectRatio: '1/1', background: '#050505', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #1e1e2e', fontSize: '18px', fontWeight: '900' }}>
                                    {node.width}x{node.height}
                                </div>
                            ) : <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}><dc.Icon icon="monitor" style={{ width: 48 }} /></div>}
                        </section>
                    </div>

                    <section style={{ ...STYLES.card, flex: 1 }}>
                        <div style={STYLES.cardTitle}>JSON Payload</div>
                        <pre style={{ margin: 0, background: '#050505', borderRadius: '8px', padding: '20px', border: '1px solid #1e1e2e', color: '#4ade80', fontSize: '11px', overflowY: 'auto' }}>
                            {node ? JSON.stringify(node, null, 2) : "// Waiting for data..."}
                        </pre>
                    </section>
                </main>
            </div>
        );
    };
    return <App />;
}
return { View };
