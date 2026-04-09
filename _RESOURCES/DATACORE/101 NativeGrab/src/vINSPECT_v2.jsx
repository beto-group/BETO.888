/**
 * 128_Native_Grab - ELEMENT INSPECTOR DASHBOARD (vFINAL_INSPECT)
 * Native Chrome-style inspector using CDP Overlay & DOM domains.
 */
async function View({ folderPath }) {
    const { spawn } = require('child_process');
    const { useState, useEffect, useRef, useCallback } = dc;

    const STATE_FILE = folderPath + '/_resources/data/mcp_state.json';

    const STYLES = {
        main: { height: '100%', background: '#050505', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', display: 'flex', overflow: 'hidden' },
        sidebar: { width: '350px', borderRight: '1px solid #1e1e2e', background: '#0a0a0f', display: 'flex', flexDirection: 'column', height: '100%' },
        content: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto' },
        header: { padding: '20px 30px', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        title: { fontSize: '12px', fontWeight: '900', letterSpacing: '4px', color: '#8b5cf6', textTransform: 'uppercase' },
        btn: (active) => ({ 
            padding: '12px 24px', background: active ? '#ef4444' : '#8b5cf6', color: '#fff', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700',
            letterSpacing: '1px', transition: 'all 0.2s', boxShadow: active ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 0 20px rgba(139, 92, 246, 0.4)'
        }),
        card: { background: '#11111b', borderRadius: '12px', padding: '20px', border: '1px solid #1e1e2e' },
        cardTitle: { fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' },
        tag: { color: '#f472b6', fontWeight: 'bold', fontFamily: 'monospace' },
        attr: { color: '#fbbf24', fontFamily: 'monospace' },
        val: { color: '#4ade80', fontFamily: 'monospace' },
        boxModel: { 
            width: '100%', aspectRatio: '1/1', background: '#18181b', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
        }
    };

    const App = () => {
        const [isInspecting, setIsInspecting] = useState(false);
        const [node, setNode] = useState(null);
        const [box, setBox] = useState(null);
        const [logs, setLogs] = useState(["> READY_FOR_SCAN"]);

        const addLog = (m) => setLogs(p => [`> ${m}`, ...p].slice(0, 5));

        const executeCDP = async (method, params = {}) => {
            const pStr = JSON.stringify(params);
            return new Promise((resolve) => {
                // Use the absolute path discovered via 'which'
                const bin = '/Applications/Obsidian.app/Contents/MacOS/obsidian';
                const proc = spawn(bin, ['dev:cdp', `method=${method}`, `params=${pStr}`]);
                let out = '';
                proc.stdout.on('data', d => out += d.toString());
                proc.on('close', () => {
                    try { resolve(JSON.parse(out)); } catch(e) { resolve(out); }
                });
            });
        };

        const toggleInspect = async () => {
            const newState = !isInspecting;
            setIsInspecting(newState);
            addLog(newState ? "INSPECTOR: ACTIVE" : "INSPECTOR: STANDBY");
            
            await executeCDP('Overlay.enable');
            await executeCDP('Overlay.setInspectMode', {
                mode: newState ? 'searchForNode' : 'none',
                highlightConfig: {
                    showInfo: true, showRulers: true, showExtensionLines: true,
                    contentColor: { r: 139, g: 92, b: 246, a: 0.3 },
                    paddingColor: { r: 74, g: 222, b: 128, a: 0.2 },
                    marginColor: { r: 251, g: 191, b: 36, a: 0.2 }
                }
            });
        };

        const grabElementAt = async (x, y) => {
            addLog(`GRABBING: ${x},${y}`);
            const result = await executeCDP('DOM.getNodeForLocation', { x, y });
            if (result && result.nodeId) {
                const desc = await executeCDP('DOM.describeNode', { nodeId: result.nodeId, depth: 1 });
                const boxModel = await executeCDP('DOM.getBoxModel', { nodeId: result.nodeId });
                setNode(desc.node);
                setBox(boxModel.model);
                addLog(`GRAB_SUCCESS: ${desc.node.localName}`);
            }
        };

        useEffect(() => {
            const handleClick = (e) => {
                if (isInspecting) {
                    e.preventDefault();
                    e.stopPropagation();
                    grabElementAt(Math.round(e.clientX), Math.round(e.clientY));
                }
            };
            if (isInspecting) window.addEventListener('mousedown', handleClick, true);
            return () => window.removeEventListener('mousedown', handleClick, true);
        }, [isInspecting]);

        return (
            <div id="inspector-dashboard" style={STYLES.main}>
                <aside style={STYLES.sidebar}>
                    <header style={STYLES.header}>
                        <span style={STYLES.title}>Native Grab</span>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isInspecting ? '#ef4444' : '#4ade80', boxShadow: '0 0 10px currentColor' }} />
                    </header>
                    <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <button onClick={toggleInspect} style={STYLES.btn(isInspecting)}>
                            {isInspecting ? "STOP INSPECTING" : "START INSPECTION"}
                        </button>
                        <div style={{ ...STYLES.card, height: '150px', overflow: 'hidden' }}>
                            <div style={STYLES.cardTitle}>Telemetry</div>
                            {logs.map((l, i) => <div key={i} style={{ fontSize: '10px', fontFamily: 'monospace', marginBottom: '5px', opacity: 0.7 }}>{l}</div>)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.6' }}>
                            <strong style={{ color: '#8b5cf6' }}>Note:</strong> Click any element in the Obsidian UI while inspection is active to grab its metadata.
                        </div>
                    </div>
                </aside>

                <main style={STYLES.content}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '32px' }}>Element Dashboard</h1>
                        <span style={{ fontSize: '12px', color: '#8b5cf6', fontFamily: 'monospace' }}>v128_NATIVE</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '25px' }}>
                        <section style={STYLES.card}>
                            <div style={STYLES.cardTitle}>Node Properties</div>
                            {node ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <span style={STYLES.tag}>&lt;{node.localName}</span>
                                        {node.attributes && node.attributes.map((attr, i) => i % 2 === 0 ? (
                                            <span key={i}> <span style={STYLES.attr}>{attr}</span>=<span style={STYLES.val}>"{node.attributes[i+1]}"</span></span>
                                        ) : null)}
                                        <span style={STYLES.tag}>&gt;</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div style={{ background: '#050505', padding: '10px', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '5px' }}>NODE_ID</div>
                                            <div style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>{node.nodeId}</div>
                                        </div>
                                        <div style={{ background: '#050505', padding: '10px', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '5px' }}>CHILDREN</div>
                                            <div style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>{node.childNodeCount || 0}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : <div style={{ opacity: 0.3 }}>No element selected. Use "Start Inspection" and click an element.</div>}
                        </section>

                        <section style={STYLES.card}>
                            <div style={STYLES.cardTitle}>Box Model</div>
                            {box ? (
                                <div style={STYLES.boxModel}>
                                    {/* Simplified Box Visualizer */}
                                    <div style={{ width: '80%', height: '80%', background: 'rgba(251, 191, 36, 0.2)', border: '1px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '80%', height: '80%', background: 'rgba(74, 222, 128, 0.2)', border: '1px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ width: '80%', height: '80%', background: 'rgba(139, 92, 246, 0.3)', border: '1px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                                                {box.width}x{box.height}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}><dc.Icon icon="box" style={{ width: 40 }} /></div>}
                        </section>
                    </div>

                    <section style={{ ...STYLES.card, flex: 1 }}>
                        <div style={STYLES.cardTitle}>Computed Metadata</div>
                        <div style={{ height: '200px', background: '#050505', borderRadius: '8px', padding: '20px', border: '1px solid #1e1e2e', color: '#4ade80', fontSize: '11px', lineHeight: '1.6', fontFamily: 'monospace', overflowY: 'auto' }}>
                            {node ? JSON.stringify(node, null, 2) : "// Await selection..."}
                        </div>
                    </section>
                </main>
            </div>
        );
    };

    return <App />;
}

return { View };
