/**
 * 128_Native_Grab - DEFINITIVE VERSION (v240325_0455)
 */
async function View({ folderPath }) {
    const { spawn } = require('child_process');
    const COMMAND_FILE = folderPath + '/_resources/data/mcp_commands.json';
    const STATE_FILE = folderPath + '/_resources/data/mcp_state.json';

    const STYLES = {
        main: { height: '100%', background: '#000', color: '#f0f0f0', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' },
        header: { background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(139, 92, 246, 0.4)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 },
        title: { fontSize: '12px', fontWeight: '900', letterSpacing: '4px', color: '#8b5cf6', textTransform: 'uppercase', textShadow: '0 0 15px rgba(139, 92, 246, 0.4)' },
        canvas: { flex: 1, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at center, #111 0%, #000 75%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        grid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' },
        drag: (drag, x, y) => ({ position: 'absolute', width: '120px', height: '120px', left: x, top: y, background: drag ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(139, 92, 246, 0.6)', borderRadius: '16px', cursor: drag ? 'grabbing' : 'grab', display: 'flex', flexDirection: 'column', align_items: 'center', justify_content: 'center', gap: '8px', transition: drag ? 'none' : 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)', boxShadow: drag ? '0 30px 60px rgba(0,0,0,0.6), 0 0 30px rgba(139, 92, 246, 0.4)' : '0 10px 20px rgba(0,0,0,0.4)', zIndex: 200 }),
        term: { position: 'absolute', bottom: '30px', right: '30px', width: '320px', maxHeight: '180px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', overflow: 'hidden', zIndex: 100 },
        log: { marginBottom: '6px', borderLeft: '2px solid #8b5cf6', paddingLeft: '10px' },
        coord: { position: 'absolute', bottom: '30px', left: '30px', background: 'rgba(0,0,0,0.7)', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.2)', fontFamily: 'monospace', fontSize: '11px', color: '#4ade80' }
    };

    const App = () => {
        const rootRef = dc.useRef(null);
        const [pos, setPos] = dc.useState({ x: 200, y: 200 });
        const [drag, setDrag] = dc.useState(false);
        const [off, setOff] = dc.useState({ x: 0, y: 0 });
        const [logs, setLogs] = dc.useState([]);

        const execute = async (cmd) => {
            return new Promise((resolve) => {
                const bin = '/usr/local/bin/obsidian'; 
                const args = cmd.match(/"[^"]+"|[^\s]+/g).map(arg => arg.replace(/^"|"$/g, ''));
                const proc = spawn(bin, args);
                proc.on('close', () => resolve(true));
            });
        };

        dc.useEffect(() => {
            const adapter = dc.app.vault.adapter;
            const check = async () => {
                if (!(await adapter.exists(COMMAND_FILE))) return;
                try {
                    const c = JSON.parse(await adapter.read(COMMAND_FILE));
                    if (c && !c.executed) {
                        if (c.action === 'reload') dc.app.workspace.activeLeaf.rebuildView();
                        c.executed = true; c.executedAt = new Date().toISOString();
                        await adapter.write(COMMAND_FILE, JSON.stringify(c, null, 2));
                        setLogs(p => [`> MCP: ${c.action}`, ...p].slice(0, 5));
                    }
                    const state = { ts: new Date().toISOString(), status: "active", x: pos.x, y: pos.y };
                    await adapter.write(STATE_FILE, JSON.stringify(state, null, 2));
                    await adapter.write(folderPath + '/heartbeat.txt', 'ALIVE: ' + new Date().toISOString());
                } catch(e) {}
            };
            const t = setInterval(check, 1000); return () => clearInterval(t);
        }, [pos]);

        dc.useEffect(() => {
            const t = setTimeout(() => {
                const target = rootRef.current?.closest('.view-content');
                if (target && rootRef.current.parentElement !== target) {
                    target.appendChild(rootRef.current);
                    Object.assign(rootRef.current.style, { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 });
                    const leaf = target.closest('.workspace-leaf');
                    if (leaf) leaf.querySelector('.view-header')?.style.setProperty('display', 'none', 'important');
                }
            }, 600); return () => clearTimeout(t);
        }, []);

        dc.useEffect(() => {
            const move = (e) => {
                if (!drag) return;
                const nx = e.clientX - off.x, ny = e.clientY - off.y;
                setPos({ x: nx, y: ny });
                if (Math.random() > 0.95) {
                    execute(`dev:cdp method=Input.dispatchMouseEvent params='{"type":"mouseMoved","x":${nx+60},"y":${ny+60},"button":"left"}'`);
                }
            };
            const up = () => { if (drag) { setDrag(false); setLogs(p => ["> RELEASE", ...p].slice(0, 5)); } };
            if (drag) { window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); }
            return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
        }, [drag, off]);

        return (
            <div ref={rootRef} id="native-grab-definitive" style={STYLES.main}>
                <header style={STYLES.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: drag ? '#4ade80' : '#8b5cf6', boxShadow: '0 0 15px currentColor' }} />
                        <span style={STYLES.title}>Native Grab Engine v128</span>
                    </div>
                </header>
                <main style={STYLES.canvas}>
                    <div style={STYLES.grid} />
                    <div onMouseDown={(e) => { setDrag(true); setOff({ x: e.clientX - pos.x, y: e.clientY - pos.y }); setLogs(p => ["> LOCK_ON", ...p].slice(0, 5)); }} style={STYLES.drag(drag, pos.x, pos.y)}>
                        <dc.Icon icon="mouse-pointer-2" style={{ width: 32, height: 32, color: '#a78bfa' }} />
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#a78bfa' }}>GRAB_CORE</span>
                    </div>
                    <div style={STYLES.coord}>X: {pos.x.toFixed(0)} | Y: {pos.y.toFixed(0)}</div>
                    <div style={STYLES.term}>{logs.map((l, i) => <div key={i} style={STYLES.log}>{l}</div>)}</div>
                </main>
            </div>
        );
    };
    return <App />;
}
return { View };
