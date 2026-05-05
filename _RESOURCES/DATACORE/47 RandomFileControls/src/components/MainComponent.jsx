/**
 * 47 RandomFileControls - Main UI
 * Sterile Brutalist Edition
 */

function MainComponent({ folderPath, styles, utils, FileOps }) {
    const { useState, useEffect, useCallback, useRef } = dc;
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState("READY");
    const [audit, setAudit] = useState({ bridge: 'checking', ops: 'ready' });

    // 1. Terminal Handling
    useEffect(() => {
        if (!utils?.cli) return;
        return utils.cli.subscribe(setLogs);
    }, [utils?.cli]);

    // 2. Command Registration
    useEffect(() => {
        if (!utils?.cli || !FileOps) return;

        // Register Native Commands (Autoloading ping)
        utils.cli.register('scrub', async (payload) => {
            const ext = payload.extension || '.svg';
            const res = await FileOps.scrubFolder(folderPath, ext);
            return { ...res, currentFolder: folderPath };
        });

        utils.cli.register('map', async () => {
             return await FileOps.mapFolder(folderPath);
        });

        utils.cli.register('rename', async (payload) => {
            if (!payload.find || !payload.replace) throw new Error("Missing 'find' or 'replace' payload.");
            return await FileOps.renameBatch(folderPath, payload.find, payload.replace);
        });

        utils.cli.log('🔗 FileOps Linked (scrub, map, rename)', 'success');
        setAudit(prev => ({ ...prev, bridge: 'linked' }));

        return () => {
            utils.cli.unregister('scrub');
            utils.cli.unregister('map');
            utils.cli.unregister('rename');
        };
    }, [utils?.cli, FileOps, folderPath]);

    // 3. UI Handlers
    const handleScrub = async () => {
        try {
            setStatus("SCRUBBING...");
            const res = await FileOps.scrubFolder(folderPath, '.svg');
            utils.cli.log(`✅ Scrub Complete: Deleted ${res.deletedCount} files in ${folderPath}`, 'success');
        } catch (e) {
            utils.cli.log(`❌ Scrub Failed: ${e.message}`, 'error');
        } finally {
            setStatus("READY");
        }
    };

    const handleMap = async () => {
        try {
            setStatus("MAPPING...");
            await FileOps.mapFolder(folderPath);
            utils.cli.log(`✅ Directory Map copied to clipboard for ${folderPath}`, 'success');
        } catch (e) {
            utils.cli.log(`❌ Map Failed: ${e.message}`, 'error');
        } finally {
            setStatus("READY");
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#8b5cf6', letterSpacing: '0.3em' }}>FILE OPERATIONS OS</span>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>DATACORE CONTROLS</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>BRIDGE: {audit.bridge.toUpperCase()}</div>
                    <button style={{ ...styles.button, backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}>SYSTEM STATUS: {status}</button>
                </div>
            </header>

            <main style={styles.grid}>
                <div style={styles.card}>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)' }}>ACTION: 01</div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>BATCH COMPILE</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>Consolidate multiple markdown sources into a single master document.</p>
                    <button style={styles.button}>INITIALIZE</button>
                </div>

                <div style={styles.card}>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)' }}>ACTION: 02</div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>SUBFOLDER LISTER</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>Map entire directory structures and export to clipboard.</p>
                    <button style={styles.button} onClick={handleMap}>MAP DIRECTORY</button>
                </div>

                <div style={styles.card}>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)' }}>ACTION: 03</div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>BATCH RENAME</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>Execute complex regex renames across large file sets.</p>
                    <button style={styles.button}>OPEN REGEX EDITOR</button>
                </div>

                <div style={styles.card}>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)' }}>ACTION: 04</div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>SYSTEM SCRUB</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>Purge specific extensions (e.g., .svg, .DS_Store) from target folders.</p>
                    <button style={{ ...styles.button, borderColor: '#ef4444', color: '#ef4444' }} onClick={handleScrub}>SCRUB ALL .SVG</button>
                </div>

                {/* Live Terminal Overlay */}
                <div style={{
                    gridColumn: '1 / -1',
                    background: '#050505',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '20px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    height: '200px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    gap: '8px'
                }}>
                    {logs.length === 0 && <div style={{ color: '#444' }}>- WAITING FOR COMMANDS -</div>}
                    {logs.map(log => (
                        <div key={log.id} style={{
                            color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#22c55e' : '#fff',
                            borderLeft: `2px solid ${log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#22c55e' : '#8b5cf6'}`,
                            paddingLeft: '10px'
                        }}>
                             <span style={{ color: '#444' }}>[{log.timestamp}]</span> {log.message}
                        </div>
                    ))}
                </div>
            </main>

            <footer style={styles.footer}>
                <span>BETO GROUP | LOGISTICS UNIT</span>
                <span>V2.4.0-STERILE | {folderPath}</span>
            </footer>
        </div>
    );
}

return { MainComponent };
