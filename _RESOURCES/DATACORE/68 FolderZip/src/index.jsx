/**
 * 68 FolderZip - Main Component
 * Restored following the Consolidated Master Protocol (Rule #13)
 */
async function View({ folderPath }) {
    const { useState, useEffect, useRef, useMemo } = dc;

    // 1. Safe Agent Layer (Rule #10)
    const Agent = {
        timer: null,
        start: (fPath, onReload) => {
            const cmdFile = fPath + '/mcp_commands.json';
            Agent.timer = setInterval(async () => {
                try {
                    const adapter = dc.app.vault.adapter;
                    if (!(await adapter.exists(cmdFile))) return;
                    const content = await adapter.read(cmdFile);
                    const cmd = JSON.parse(content);
                    if (cmd && cmd.executed === false && cmd.action === 'reload') {
                        cmd.executed = true;
                        cmd.executedAt = new Date().toISOString();
                        await adapter.write(cmdFile, JSON.stringify(cmd, null, 2));
                        onReload();
                    }
                } catch (e) {}
            }, 1000);
            return () => clearInterval(Agent.timer);
        }
    };

    const styles = {
        container: {
            padding: '48px',
            backgroundColor: '#000',
            fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
            color: '#e2e8f0',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            overflow: 'auto',
            boxSizing: 'border-box'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        },
        title: {
            fontSize: '28px',
            fontWeight: '900',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            color: '#fff'
        },
        card: {
            padding: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        },
        cardTitle: {
            fontSize: '11px',
            fontWeight: '800',
            color: '#8b5cf6',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            margin: 0
        },
        button: {
            padding: '16px 24px',
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
        },
        buttonPrimary: {
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderColor: '#8b5cf6'
        },
        buttonDanger: {
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderColor: '#dc2626'
        },
        logArea: {
            height: '240px',
            overflowY: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            color: '#64748b',
            background: 'rgba(0,0,0,0.3)',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)'
        },
        folderItem: {
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid transparent',
            cursor: 'pointer',
            fontSize: '13px'
        },
        modalOverlay: {
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
        },
        modal: {
            width: '100%',
            maxWidth: '800px',
            maxHeight: '80vh',
            backgroundColor: '#050505',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }
    };

    /* ---------------------- SUB-COMPONENTS ---------------------- */

    const FolderPicker = ({ isOpen, onClose, onSelectFolder }) => {
        if (!isOpen) return null;
        const [search, setSearch] = useState("");
        const [folders, setFolders] = useState([]);
        
        useEffect(() => { 
            const root = dc.app.vault.getRoot(); 
            const out = []; 
            const stack = [root]; 
            while (stack.length) { 
                const cur = stack.pop(); 
                if (cur && cur.path) out.push(cur); 
                if (cur?.children) {
                    for (const ch of cur.children) if (ch?.children) stack.push(ch);
                }
            } 
            setFolders(out); 
        }, []);
        
        const filtered = search.trim() 
            ? folders.filter(f => (f.path || "").toLowerCase().includes(search.toLowerCase())) 
            : folders.slice(0, 50);
        
        return (
            <div style={styles.modalOverlay} onClick={onClose}>
                <div style={styles.modal} onClick={e => e.stopPropagation()}>
                    <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={styles.cardTitle}>Select Archive Source</span>
                        <dc.Icon icon="x" style={{ cursor: 'pointer' }} onClick={onClose} />
                    </div>
                    <input 
                        style={{ padding: '16px', background: '#000', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', outline: 'none' }} 
                        placeholder="Search vaults..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filtered.map(f => (
                            <div key={f.path} style={styles.folderItem} onClick={() => onSelectFolder(f)}>
                                <span>{f.path === "/" ? "Vault Root" : f.path}</span>
                                <dc.Icon icon="folder" style={{ color: '#8b5cf6' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const ProgressModal = ({ isOpen, onClose, logs, processed, total }) => {
        if (!isOpen) return null;
        const containerRef = useRef(null);
        useEffect(() => { if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight; }, [logs]);

        return (
            <div style={styles.modalOverlay}>
                <div style={styles.modal}>
                    <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <span style={styles.cardTitle}>Compression Engine Telemetry [{processed}/{total}]</span>
                    </div>
                    <div ref={containerRef} style={styles.logArea}>
                        {logs.map((log, i) => <div key={i} style={{ padding: '2px 0' }}>{log}</div>)}
                    </div>
                    {(processed === total || total === 0) && (
                        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <button style={styles.button} onClick={onClose}>Close Engine</button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    /* ---------------------- MAIN VIEW ---------------------- */

    function MainView() {
        const rootRef = useRef(null);
        const [selectedFolder, setSelectedFolder] = useState(null);
        const [subfolders, setSubfolders] = useState([]);
        const [blacklist, setBlacklist] = useState(new Set());
        const [pickerOpen, setPickerOpen] = useState(false);
        const [progressOpen, setProgressOpen] = useState(false);
        const [logs, setLogs] = useState([]);
        const [processed, setProcessed] = useState(0);

        // 2. FullTab Immersion (Rule #6)
        useEffect(() => {
            const container = rootRef.current;
            if (!container) return;
            const targetView = container.closest('.workspace-leaf-content');
            if (!targetView) return;
            const viewContent = targetView.querySelector('.view-content');
            if (viewContent) {
                const originalParent = container.parentNode;
                viewContent.appendChild(container);
                container.style.position = 'absolute';
                container.style.inset = '0';
                container.style.zIndex = '10';
                return () => { if (originalParent) originalParent.appendChild(container); };
            }
        }, []);

        const addLog = (msg) => setLogs(p => [...p, `[${new Date().toLocaleTimeString()}] ${msg}`]);

        const startCompression = async () => {
            if (!selectedFolder) return;
            const foldersToZip = subfolders.filter(f => !blacklist.has(f.path));
            if (!foldersToZip.length) return;

            setLogs([]);
            setProcessed(0);
            setProgressOpen(true);

            const adapter = dc.app.vault.adapter;
            const vaultPath = adapter.basePath;
            const { exec } = require('child_process');

            for (let i = 0; i < foldersToZip.length; i++) {
                const folder = foldersToZip[i];
                addLog(`⚙️ INITIALIZING: ${folder.name}`);

                const parentPath = selectedFolder.path === "/" ? vaultPath : `${vaultPath}/${selectedFolder.path}`;
                const outputDirFull = `${vaultPath}/${folderPath}/zip`;
                
                // Ensure zip dir exists
                if (!(await adapter.exists(`${folderPath}/zip`))) await adapter.mkdir(`${folderPath}/zip`);

                const zipPath = `${outputDirFull}/${folder.name}.zip`;
                const command = `cd "${parentPath}" && zip -r "${zipPath}" "${folder.name}"`;

                try {
                    await new Promise((res, rej) => {
                        exec(command, (err) => err ? rej(err) : res());
                    });
                    addLog(`✅ BUFFERED: ${folder.name}.zip`);
                } catch (e) {
                    addLog(`❌ FAULT: ${folder.name} -> ${e.message}`);
                }
                setProcessed(i + 1);
            }
            addLog("🏁 BATCH SEQUENCE COMPLETE");
            new Notice("Compression Sequence Complete");
        };

        return (
            <div ref={rootRef} style={styles.container}>
                <header style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <dc.Icon icon="package" style={{ color: '#fff', fontSize: '28px' }} />
                        <span style={styles.title}>Folder Zipper</span>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                    <div style={styles.card}>
                        <span style={styles.cardTitle}>Archive Configuration</span>
                        <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', margin: 0 }}>
                            Batch-orientated subfolder compression. Generates individual <code>.zip</code> archives for immediate sibling nodes.
                        </p>
                        
                        {selectedFolder && (
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)', fontFamily: 'monospace', fontSize: '12px' }}>
                                {selectedFolder.path}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button style={{ ...styles.button, ...styles.buttonPrimary, flex: 1 }} onClick={() => setPickerOpen(true)}>
                                <dc.Icon icon="folder-search" /> Select Source
                            </button>
                            {selectedFolder && (
                                <button 
                                    style={{ ...styles.button, flex: 1, backgroundColor: '#8b5cf6' }} 
                                    onClick={startCompression}
                                    disabled={!subfolders.length}
                                >
                                    <dc.Icon icon="zap" /> Start Batch
                                </button>
                            )}
                        </div>
                    </div>

                    {selectedFolder && (
                        <div style={styles.card}>
                            <span style={styles.cardTitle}>Source Nodes ({subfolders.length})</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                                {subfolders.map(f => (
                                    <div 
                                        key={f.path} 
                                        style={{ ...styles.folderItem, opacity: blacklist.has(f.path) ? 0.4 : 1 }}
                                        onClick={() => setBlacklist(prev => {
                                            const next = new Set(prev);
                                            if (next.has(f.path)) next.delete(f.path); else next.add(f.path);
                                            return next;
                                        })}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <dc.Icon icon="folder" style={{ color: '#8b5cf6' }} />
                                            <span>{f.name}</span>
                                        </div>
                                        {blacklist.has(f.path) && <span style={{ fontSize: '9px', fontWeight: '900', color: '#dc2626' }}>EXCLUDED</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <FolderPicker 
                    isOpen={pickerOpen} 
                    onClose={() => setPickerOpen(false)} 
                    onSelectFolder={(f) => {
                        setSelectedFolder(f);
                        setSubfolders(f.children?.filter(c => c.children) || []);
                        setBlacklist(new Set());
                        setPickerOpen(false);
                    }} 
                />

                <ProgressModal 
                    isOpen={progressOpen} 
                    onClose={() => setProgressOpen(false)} 
                    logs={logs} 
                    processed={processed} 
                    total={subfolders.filter(f => !blacklist.has(f.path)).length} 
                />
            </div>
        );
    }

    const SafeRoot = () => {
        const [key, setKey] = useState(0);
        useEffect(() => {
            return Agent.start(folderPath, () => {
                if (dc.app.workspace.activeLeaf?.rebuildView) dc.app.workspace.activeLeaf.rebuildView();
                else setKey(k => k + 1);
            });
        }, []);
        return <MainView key={key} />;
    };

    return <SafeRoot />;
}

return { View };
