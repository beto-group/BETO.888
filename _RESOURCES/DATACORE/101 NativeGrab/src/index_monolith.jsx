/**
 * 128_Native_Grab - MONOLITHIC V2 (Premium)
 * Full-fidelity native grab engine with built-in MCP verification.
 */
async function View({ folderPath }) {
    const { useState, useEffect, useRef, useCallback, useMemo } = dc;
    const { spawn } = require('child_process');

    const COMMAND_FILE = folderPath + '/_resources/data/mcp_commands.json';
    const STATE_FILE = folderPath + '/_resources/data/mcp_state.json';

    // --- Premium Design System ---
    const STYLES = {
        mainWrapper: {
            height: '100%', background: '#000', color: '#f0f0f0',
            fontFamily: 'Inter, system-ui, sans-serif', display: 'flex',
            flexDirection: 'column', overflow: 'hidden', userSelect: 'none'
        },
        header: {
            background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(30px)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.4)', padding: '14px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100
        },
        title: { fontSize: '12px', fontWeight: '900', letterSpacing: '4px', color: '#8b5cf6', textTransform: 'uppercase', textShadow: '0 0 15px rgba(139, 92, 246, 0.4)' },
        canvas: {
            flex: 1, position: 'relative', overflow: 'hidden',
            background: 'radial-gradient(circle at center, #111 0%, #000 75%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        grid: {
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px', pointerEvents: 'none'
        },
        draggable: (isDragging, x, y) => ({
            position: 'absolute', width: '120px', height: '120px', left: x, top: y,
            background: isDragging ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.15)',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(139, 92, 246, 0.6)',
            borderRadius: '16px', cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '8px', transition: isDragging ? 'none' : 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
            boxShadow: isDragging ? '0 30px 60px rgba(0,0,0,0.6), 0 0 30px rgba(139, 92, 246, 0.4)' : '0 10px 20px rgba(0,0,0,0.4)',
            zIndex: 200
        }),
        label: { fontSize: '10px', fontWeight: 'bold', color: '#a78bfa', opacity: 0.8 },
        terminal: {
            position: 'absolute', bottom: '30px', right: '30px', width: '320px',
            maxHeight: '180px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
            padding: '15px', fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8',
            overflow: 'hidden', zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        },
        logLine: { marginBottom: '6px', borderLeft: '2px solid #8b5cf6', paddingLeft: '10px' },
        coord: {
            position: 'absolute', bottom: '30px', left: '30px', background: 'rgba(0,0,0,0.7)',
            padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.2)',
            fontFamily: 'monospace', fontSize: '11px', color: '#4ade80'
        }
    };

    const Main = () => {
        const rootRef = useRef(null);
        const [pos, setPos] = useState({ x: 200, y: 200 });
        const [isDragging, setIsDragging] = useState(false);
        const [offset, setOffset] = useState({ x: 0, y: 0 });
        const [logs, setLogs] = useState([]);

        const addLog = useCallback((msg) => setLogs(p => [`> ${msg}`, ...p].slice(0, 5)), []);

        const execute = async (cmd) => {
            return new Promise((resolve) => {
                const bin = '/usr/local/bin/obsidian'; 
                const args = cmd.match(/"[^"]+"|[^\s]+/g).map(arg => arg.replace(/^"|"$/g, ''));
                const proc = spawn(bin, args);
                proc.stdout.on('data', d => console.log(d.toString()));
                proc.on('close', () => resolve(true));
            });
        };

        // --- MCP Bridge Hook ---
        useEffect(() => {
            const adapter = dc.app.vault.adapter;
            const updateState = async (extra = {}) => {
                const state = { timestamp: new Date().toISOString(), status: "active", version: "monolith_v2", ...extra };
                await adapter.write(STATE_FILE, JSON.stringify(state, null, 2));
            };
            const check = async () => {
                if (!(await adapter.exists(COMMAND_FILE))) return;
                try {
                    const content = await adapter.read(COMMAND_FILE);
                    const cmd = JSON.parse(content);
                    if (cmd && !cmd.executed) {
                        if (cmd.action === 'reload') dc.app.workspace.activeLeaf.rebuildView();
                        if (cmd.action === 'screenshot') execute(`dev:screenshot path="${folderPath}/screenshots/mcp_${Date.now()}.png"`);
                        cmd.executed = true;
                        cmd.executedAt = new Date().toISOString();
                        await adapter.write(COMMAND_FILE, JSON.stringify(cmd, null, 2));
                        addLog(`MCP_EXEC: ${cmd.action}`);
                    }
                } catch(e) {}
            };
            updateState({ status: "started" });
            const timer = setInterval(check, 1000);
            return () => clearInterval(timer);
        }, []);

        // --- Immersion Hook ---
        useEffect(() => {
            const timer = setTimeout(() => {
                const target = rootRef.current?.closest('.view-content');
                if (target && rootRef.current.parentElement !== target) {
                    target.appendChild(rootRef.current);
                    Object.assign(rootRef.current.style, {
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000
                    });
                    const leaf = target.closest('.workspace-leaf');
                    if (leaf) leaf.querySelector('.view-header')?.style.setProperty('display', 'none', 'important');
                }
            }, 600);
            return () => clearTimeout(timer);
        }, []);

        const onMouseDown = (e) => {
            setIsDragging(true);
            setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
            addLog("GRAB_START: LOCK_ON");
        };

        useEffect(() => {
            const move = (e) => {
                if (!isDragging) return;
                const nx = e.clientX - offset.x; 
                const ny = e.clientY - offset.y;
                setPos({ x: nx, y: ny });
                if (Math.random() > 0.85) {
                    execute(`dev:cdp method=Input.dispatchMouseEvent params='{"type":"mouseMoved","x":${nx+60},"y":${ny+60},"button":"left","clickCount":1}'`);
                    addLog(`CDP_SYNC: ${nx},${ny}`);
                }
            };
            const up = () => { if (isDragging) { setIsDragging(false); addLog("GRAB_END: RELEASE"); } };
            if (isDragging) { 
                window.addEventListener('mousemove', move); 
                window.addEventListener('mouseup', up); 
            }
            return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
        }, [isDragging, offset]);

        return (
            <div ref={rootRef} id="datacore-monolith-root" style={STYLES.mainWrapper}>
                <header style={STYLES.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: isDragging ? '#4ade80' : '#8b5cf6', boxShadow: `0 0 15px currentColor` }} />
                        <span style={STYLES.title}>Native Grab Protocol 128</span>
                    </div>
                    <div style={{ fontSize: '9px', opacity: 0.5, letterSpacing: '2px' }}>V2.0_MONOLITH</div>
                </header>

                <main style={STYLES.canvas}>
                    <div style={STYLES.grid} />
                    
                    <div 
                        onMouseDown={onMouseDown}
                        style={STYLES.draggable(isDragging, pos.x, pos.y)}
                    >
                        <dc.Icon icon="mouse-pointer-2" style={{ width: 32, height: 32, color: '#a78bfa' }} />
                        <span style={STYLES.label}>DATANODE_01</span>
                    </div>

                    <div style={STYLES.coord}>
                        X: {pos.x.toFixed(0)} | Y: {pos.y.toFixed(0)}
                    </div>

                    <div style={STYLES.terminal}>
                        {logs.map((l, i) => <div key={i} style={STYLES.logLine}>{l}</div>)}
                        {logs.length === 0 && <div style={{opacity: 0.3}}>awaiting interaction...</div>}
                    </div>
                </main>
            </div>
        );
    };

    return <Main />;
}

return { View };
