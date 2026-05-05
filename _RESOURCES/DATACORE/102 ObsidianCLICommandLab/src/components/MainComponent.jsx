/**
 * Obsidian CLI Command Lab - Main Component
 */
const { useState, useEffect, useRef, useCallback } = dc;

function MainComponent({ folderPath, styles }) {
    const containerRef = useRef(null);
    const [logs, setLogs] = useState([]);
    const [commandName, setCommandName] = useState('ping');
    const [payloadInput, setPayloadInput] = useState('{"message": "Hello from Datacore"}');
    const [bridgeStatus, setBridgeStatus] = useState('Checking...');
    const [pluginActive, setPluginActive] = useState(false);
    const [clipStatus, setClipStatus] = useState({ state: 'idle', pct: 0 });
    const [audit, setAudit] = useState({
        plugin: 'checking',
        extension: 'checking',
        hme: 'checking'
    });

    // 1. Load Utilities
    const [utils, setUtils] = useState(null);
    useEffect(() => {
        const load = async () => {
            const { useFullTab } = await dc.require(folderPath + "/src/utils/FullTab.jsx");
            const { cli } = await dc.require(folderPath + "/src/utils/CLIBridge.js");
            setUtils({ useFullTab, cli });
        };
        load();
    }, []);

    // 2. System Audit Logic
    const runAudit = useCallback(async () => {
        const hmeOk = !!window.HME;
        const pluginOk = !!window.CliLab;
        
        // Corrected Paths based on system search
        const extPath = '_RESOURCES/DATACORE/102 ObsidianCLICommandLab/_resources/data/video-extension.js';
        const hmePath = '_RESOURCES/DATACORE/99.2 Remotion/_resources/DATACORE/lib/h264-mp4-encoder/h264-mp4-encoder.web.js';
        
        const extOk = await dc.app.vault.adapter.exists(extPath);
        const hmeLibOk = await dc.app.vault.adapter.exists(hmePath);
        
        setAudit({
            plugin: pluginOk ? 'ready' : 'missing',
            extension: extOk ? 'ready' : 'missing',
            hme: (hmeOk || hmeLibOk) ? 'ready' : 'missing'
        });
    }, []);

    useEffect(() => {
        runAudit();
        const interval = setInterval(runAudit, 5000);
        return () => clearInterval(interval);
    }, [runAudit]);

    // 3. FullTab Immersion
    if (utils?.useFullTab) {
        utils.useFullTab(containerRef);
    }

    // 4. Bridge Subscription & Status
    useEffect(() => {
        if (!utils?.cli) return;
        
        const check = () => {
            const active = utils.cli.isAvailable();
            setPluginActive(active);
            setBridgeStatus(active ? 'NATIVE PLUGIN ACTIVE' : 'PLUGIN OFFLINE');
        };
        
        check();
        const interval = setInterval(check, 2000);
        
        // Status Polling
        const statusPath = "recordings/clip_status.json";
        const pollStatus = async () => {
            try {
                if (await dc.app.vault.adapter.exists(statusPath)) {
                    const data = JSON.parse(await dc.app.vault.adapter.read(statusPath));
                    setClipStatus(data);
                }
            } catch (e) {}
        };
        const statusInterval = setInterval(pollStatus, 500);

        const unsubscribe = utils.cli.subscribe(setLogs);
        return () => {
            clearInterval(interval);
            clearInterval(statusInterval);
            unsubscribe();
        };
    }, [utils?.cli]);

    // 5. One-Click Configurator
    const handleConfigureSystem = useCallback(async () => {
        if (!utils?.cli) return;
        try {
            // A. Load HME if missing
            if (!window.HME) {
                // Corrected HME library location (sourced from 99.2 Remotion)
                const hmePath = '_RESOURCES/DATACORE/99.2 Remotion/_resources/DATACORE/lib/h264-mp4-encoder/h264-mp4-encoder.web.js';
                if (await dc.app.vault.adapter.exists(hmePath)) {
                    const scriptUrl = dc.app.vault.adapter.getResourcePath(hmePath);
                    const script = document.createElement('script');
                    script.src = scriptUrl;
                    document.head.appendChild(script);
                    await new Promise(r => setTimeout(r, 800)); // Increased wait for heavy bundle
                } else {
                    throw new Error(`Encoder library not found at ${hmePath}`);
                }
            }

            // B. Register Clip Handler
            const path = '_RESOURCES/DATACORE/102 ObsidianCLICommandLab/_resources/data/video-extension.js';
            const content = await dc.app.vault.adapter.read(path);
            const handler = await (new Function('app', content))(dc.app);
            if (window.CliLab) {
                window.CliLab.register('clip', handler);
                window.CliLab.register('video', handler);
                
                // C. Sync Shell Proxy (Armed Flag)
                if (!(await dc.app.vault.adapter.exists('recordings'))) {
                    await dc.app.vault.adapter.mkdir('recordings');
                }
                await dc.app.vault.adapter.write('recordings/.armed', 'true');
                
                utils.cli.log('✅ System Armed: Clipping Engine Active', 'success');
                runAudit();
            }
        } catch (e) {
            utils.cli.log('❌ Config Error: ' + e.message, 'error');
        }
    }, [utils?.cli, runAudit]);

    // 6. Handle Decommissioning (Manual Bypass/Cleanup)
    const handleDecommission = useCallback(async () => {
        if (!utils?.cli) return;
        try {
            utils.cli.unregister('clip');
            utils.cli.unregister('video');
            
            // Sync Shell Proxy (Cleanup Flag)
            if (await dc.app.vault.adapter.exists('recordings/.armed')) {
                await dc.app.vault.adapter.remove('recordings/.armed');
            }
            
            utils.cli.log('🚫 System Decommissioned: Clipping Handlers Removed', 'info');
            runAudit();
        } catch (e) {
            utils.cli.log('❌ Decommission Error: ' + e.message, 'error');
        }
    }, [utils?.cli, runAudit]);

    // 7. Handle Registration
    const handleRegister = useCallback(() => {
        if (!utils?.cli) return;
        
        utils.cli.register(commandName, async (payload) => {
            // Echo handler for custom commands
            return {
                status: 'echo',
                received: payload,
                timestamp: new Date().toISOString(),
                id: commandName
            };
        });
    }, [utils?.cli, commandName]);

    if (!utils) return <div style={{ color: '#fff', padding: '40px' }}>Loading Utilities...</div>;

    return (
        <div ref={containerRef} style={styles.mainWrapper}>
            <style>{styles.animations}</style>
            
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.titleGroup}>
                    <div style={{ width: '12px', height: '12px', background: pluginActive ? '#22c55e' : '#ef4444', borderRadius: '50%', boxShadow: pluginActive ? '0 0 15px #22c55e' : 'none' }}></div>
                    <h1 style={styles.title}>CLI Lab (Native)</h1>
                    <span style={styles.badge}>DEDICATED PLUGIN</span>
                </div>
                <div style={styles.badge}>
                    {bridgeStatus}
                </div>
            </header>

            {/* Dashboard */}
            <main style={styles.dashboard}>
                
                {/* Left Panel: Lab */}
                <section style={styles.mainPanel} className="custom-scrollbar">
                    <div style={styles.card}>
                        <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#818cf8', letterSpacing: '1px' }}>Command Registration</h2>
                        
                        <div>
                            <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Command Name</label>
                            <input 
                                style={styles.input} 
                                value={commandName} 
                                onChange={e => setCommandName(e.target.value)}
                                placeholder="e.g. notify-user"
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Default Handler Mock (Echo)</label>
                            <div style={{ ...styles.input, background: '#0a0a0f', color: '#64748b', borderStyle: 'dashed' }}>
                                return &#123; status: 'echo', received: payload &#125;;
                            </div>
                        </div>

                        <button style={styles.button} onClick={handleRegister}>
                            Register Native Handler
                        </button>

                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#818cf8', letterSpacing: '1px', marginBottom: '16px' }}>System Status</h2>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                    <span style={{ color: '#94a3b8' }}>CLI LAB PLUGIN</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: audit.plugin === 'ready' ? '#22c55e' : '#ef4444', boxShadow: audit.plugin === 'ready' ? '0 0 8px #22c55e' : 'none' }}></div>
                                        <span style={{ color: audit.plugin === 'ready' ? '#e2e8f0' : '#64748b' }}>{audit.plugin.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                    <span style={{ color: '#94a3b8' }}>VIDEO EXTENSION</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: audit.extension === 'ready' ? '#22c55e' : '#ef4444', boxShadow: audit.extension === 'ready' ? '0 0 8px #22c55e' : 'none' }}></div>
                                        <span style={{ color: audit.extension === 'ready' ? '#e2e8f0' : '#64748b' }}>{audit.extension.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                    <span style={{ color: '#94a3b8' }}>H.264 ENCODER</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: audit.hme === 'ready' ? '#22c55e' : '#ef4444', boxShadow: audit.hme === 'ready' ? '0 0 8px #22c55e' : 'none' }}></div>
                                        <span style={{ color: audit.hme === 'ready' ? '#e2e8f0' : '#64748b' }}>{audit.hme.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    style={{ 
                                        ...styles.button, 
                                        flex: 2,
                                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                                        border: '1px solid rgba(129, 140, 248, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }} 
                                    onClick={handleConfigureSystem}
                                >
                                    <span>⚡️</span> Arm & Sync
                                </button>
                                <button 
                                    style={{ 
                                        ...styles.button,
                                        flex: 1,
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#64748b',
                                        fontSize: '10px'
                                    }} 
                                    onClick={handleDecommission}
                                >
                                    Decommission
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Background Task Monitor */}
                    <div style={{
                        ...styles.card,
                        border: clipStatus.state !== 'idle' ? '1px solid rgba(99, 102, 241, 0.4)' : styles.card.border,
                        background: clipStatus.state !== 'idle' ? 'rgba(99, 102, 241, 0.05)' : styles.card.background
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#818cf8', letterSpacing: '1px', margin: 0 }}>Background Tasks</h2>
                            <span style={{ fontSize: '10px', color: clipStatus.state === 'idle' ? '#64748b' : '#22c55e', textTransform: 'uppercase' }}>
                                {clipStatus.state}
                            </span>
                        </div>
                        
                        {clipStatus.state !== 'idle' ? (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                                    <span>High-Speed Clip Generation</span>
                                    <span>{clipStatus.pct}%</span>
                                </div>
                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ 
                                        width: `${clipStatus.pct}%`, 
                                        height: '100%', 
                                        background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                                        boxShadow: '0 0 10px #6366f1',
                                        transition: 'width 0.3s ease'
                                    }}></div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>
                                No active background operations.
                            </div>
                        )}
                        
                        {clipStatus.lastFile && clipStatus.state === 'idle' && (
                            <div style={{ marginTop: '12px', fontSize: '11px', color: '#22c55e' }}>
                                Last Clip: <code style={{ color: '#fff' }}>{clipStatus.lastFile}</code>
                            </div>
                        )}
                    </div>

                    <div style={styles.card}>
                        <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#818cf8', letterSpacing: '1px' }}>Usage Instructions</h2>
                        <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
                            <p>1. Enter a name (e.g., <code style={{ color: '#fff' }}>notify</code>) and click Register.</p>
                            <p>2. Open your terminal and run via <code>bridge</code>:</p>
                            <code style={{ display: 'block', background: '#000', padding: '12px', borderRadius: '8px', color: '#22c55e', margin: '8px 0', border: '1px solid rgba(34, 197, 94, 0.2)', fontSize: '11px' }}>
                                obsidian {commandName} '&#123;"msg": "hello"&#125;'
                            </code>
                            <p>3. Watch the Live Terminal on the right for execution logs.</p>
                        </div>
                    </div>
                </section>

                {/* Right Panel: Live Terminal */}
                <aside style={styles.sidePanel}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(99, 102, 241, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', letterSpacing: '2px' }}>LIVE TERMINAL</span>
                        <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                    </div>
                    <div style={styles.terminal} className="custom-scrollbar">
                        {logs.length === 0 && <div style={{ color: '#334155', fontStyle: 'italic' }}>Waiting for commands...</div>}
                        {logs.map(log => (
                            <div key={log.id} style={{ marginBottom: '12px', borderLeft: `2px solid ${log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#22c55e' : '#6366f1'}`, paddingLeft: '12px' }}>
                                <div style={{ fontSize: '10px', color: '#334155', marginBottom: '2px' }}>[{log.timestamp}]</div>
                                <div style={{ color: log.type === 'error' ? '#f87171' : log.type === 'success' ? '#4ade80' : '#e2e8f0' }}>{log.message}</div>
                            </div>
                        ))}
                    </div>
                </aside>
            </main>
        </div>
    );
}

return { MainComponent };
