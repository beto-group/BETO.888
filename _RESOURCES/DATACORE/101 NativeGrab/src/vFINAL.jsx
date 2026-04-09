/**
 * 128_Native_Grab - vFINAL
 */
async function View({ folderPath }) {
    const { spawn } = require('child_process');

    const App = () => {
        const rootRef = dc.useRef(null);
        const [pos, setPos] = dc.useState({ x: 150, y: 150 });
        const [drag, setDrag] = dc.useState(false);
        const [off, setOff] = dc.useState({ x: 0, y: 0 });
        const [logs, setLogs] = dc.useState(["> SYSTEM_ARMED"]);

        const execute = async (cmd) => {
            return new Promise((r) => {
                const proc = spawn('/usr/local/bin/obsidian', cmd.match(/"[^"]+"|[^\s]+/g).map(a => a.replace(/^"|"$/g, '')));
                proc.on('close', () => r(true));
            });
        };

        // --- Heartbeat & Command Loop ---
        dc.useEffect(() => {
            const adapter = dc.app.vault.adapter;
            const timer = setInterval(async () => {
                try {
                    const ts = new Date().toISOString();
                    // Root Heartbeat
                    await adapter.write('native_grab_heartbeat.txt', 'ALIVE: ' + ts);
                    // State Update
                    await adapter.write(folderPath + '/_resources/data/mcp_state.json', JSON.stringify({ ts, status: "stable", x: pos.x, y: pos.y }, null, 2));
                } catch(e) {}
            }, 2000);
            return () => clearInterval(timer);
        }, []); // Only once

        // --- Immersion (Elite Standard) ---
        const { useFullTab } = dc.require(folderPath + "/src/utils/FullTab_v2.jsx");
        useFullTab(rootRef);

        // --- Drag Loop ---
        dc.useEffect(() => {
            const move = (e) => {
                if (!drag) return;
                const nx = e.clientX - off.x, ny = e.clientY - off.y;
                setPos({ x: nx, y: ny });
                if (Math.random() > 0.9) execute(`dev:cdp method=Input.dispatchMouseEvent params='{"type":"mouseMoved","x":${nx+60},"y":${ny+60},"button":"left"}'`);
            };
            const up = () => { if (drag) { setDrag(false); setLogs(p => ["> RELEASE", ...p].slice(0, 5)); } };
            if (drag) { window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); }
            return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
        }, [drag, off]);

        return (
            <div ref={rootRef} id="native-grab-vfinal" style={{ height: '100%', background: '#000', color: '#f0f0f0', display: 'flex', flexDirection: 'column' }}>
                <header style={{ background: '#0a0a0f', padding: '15px 25px', borderBottom: '1px solid #8b5cf6', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#8b5cf6', letterSpacing: '4px' }}>NATIVE GRAB vFINAL</span>
                </header>
                <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                    <div 
                        onMouseDown={(e) => { setDrag(true); setOff({ x: e.clientX - pos.x, y: e.clientY - pos.y }); setLogs(p => ["> LOCK", ...p].slice(0, 5)); }} 
                        style={{ position: 'absolute', width: '100px', height: '100px', left: pos.x, top: pos.y, background: 'rgba(139,92,246,0.2)', border: '2px solid #8b5cf6', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab' }}
                    >
                        <dc.Icon icon="mouse-pointer" style={{ width: 40, color: '#8b5cf6' }} />
                    </div>
                </div>
            </div>
        );
    };
    return <App />;
}
return { View };
