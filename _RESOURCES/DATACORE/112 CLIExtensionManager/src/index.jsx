/**
 * 104 CLI Extension Manager - Main Component
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
            backgroundColor: '#000000',
            fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
            color: '#e2e8f0',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            overflow: 'auto',
            boxSizing: 'border-box',
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
        statusBadge: {
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            border: '1px solid currentColor'
        },
        body: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '32px'
        },
        card: {
            padding: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            transition: 'border-color 0.2s ease'
        },
        cardTitle: {
            fontSize: '11px',
            fontWeight: '800',
            color: '#8b5cf6',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            margin: 0
        },
        text: {
            fontSize: '14px',
            color: '#94a3b8',
            lineHeight: '1.7',
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
        snippet: {
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#a78bfa',
            wordBreak: 'break-all',
            lineHeight: '1.6'
        },
        extensionList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        },
        extensionItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '2px',
            fontSize: '13px',
            border: '1px solid transparent'
        },
        tag: {
            marginLeft: 'auto',
            fontSize: '9px',
            padding: '2px 8px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            color: '#a78bfa',
            borderRadius: '2px',
            textTransform: 'uppercase',
            fontWeight: '800'
        },
        logContainer: {
            gridColumn: '1 / -1',
            padding: '32px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '4px'
        },
        logArea: {
            marginTop: '20px',
            height: '240px',
            overflowY: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            color: '#64748b'
        },
        logLine: {
            padding: '6px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.02)'
        }
    };

    function MainView() {
        const rootRef = useRef(null);
        const [status, setStatus] = useState('Idle');
        const [isInitialized, setIsInitialized] = useState(false);
        const [logs, setLogs] = useState([]);
        const [extensions, setExtensions] = useState([]);

        const vaultPath = dc.app.vault.adapter.basePath;

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

        const addLog = (msg) => {
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
        };

        useEffect(() => {
            checkStatus();
            const timer = setInterval(updateExtensionList, 2000);
            return () => clearInterval(timer);
        }, []);

        const updateExtensionList = () => {
            if (window.CliExtensionBridge && window.CliExtensionBridge.handlers) {
                const handlers = Array.from(window.CliExtensionBridge.handlers.keys());
                setExtensions(handlers);
            }
        };

        const checkStatus = async () => {
            try {
                const exists = await dc.app.vault.adapter.exists('.obsidian/scripts/obsidian-bridge.js');
                setIsInitialized(exists);
                if (exists) setStatus('Active');
            } catch (e) {}
        };

        const handleInitialize = async () => {
            setStatus('Initializing...');
            addLog('Configuring Hub Bridge...');
            try {
                await dc.app.vault.adapter.mkdir('.obsidian/scripts');
                setIsInitialized(true);
                setStatus('Active');
                addLog('Bridge initialized at .obsidian/scripts/obsidian-bridge.js');
                new Notice('🚀 CLI Hub Synchronized');
            } catch (e) {
                setStatus('Error');
                addLog(`Fault: ${e.message}`);
            }
        };

        const handleCopyProtocol = () => {
            const cmd = `node "${vaultPath}/.obsidian/scripts/obsidian-bridge.js" dev:videos payload='{"duration": 5, "fps": 10}'`;
            navigator.clipboard.writeText(cmd);
            new Notice('📋 Command buffered');
            addLog('Snippet copied to buffer.');
        };

        return (
            <div ref={rootRef} style={styles.container}>
                <header style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <dc.Icon icon="terminal" style={{ color: '#fff', fontSize: '28px' }} />
                        <span style={styles.title}>Extension Manager</span>
                    </div>
                    <div style={{ 
                        ...styles.statusBadge, 
                        color: status === 'Active' ? '#10b981' : '#ef4444',
                        borderColor: status === 'Active' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                        backgroundColor: status === 'Active' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                    }}>
                        {status}
                    </div>
                </header>

                <div style={styles.body}>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Portable Bridge</h3>
                        <p style={styles.text}>
                            Establish the cross-platform protocol bridge to enable terminal-to-vault synchronization via <code>obsidian://</code> URI.
                        </p>
                        <button 
                            onClick={handleInitialize} 
                            style={{
                                ...styles.button,
                                backgroundColor: isInitialized && status !== 'Error' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(139, 92, 246, 0.1)',
                                borderColor: isInitialized && status !== 'Error' ? 'rgba(255, 255, 255, 0.08)' : '#8b5cf6'
                            }}
                        >
                            <dc.Icon icon={isInitialized ? "shield-check" : "link-2"} />
                            {isInitialized ? 'Bridge Synchronized' : 'Initialize Bridge'}
                        </button>
                    </div>

                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Universal CLI</h3>
                        <p style={styles.text}>
                            Execute vault commands from external environments using the portable Node.js wrapper.
                        </p>
                        <button 
                            onClick={handleCopyProtocol}
                            disabled={!isInitialized}
                            style={{
                                ...styles.button,
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                borderColor: '#10b981',
                                opacity: isInitialized ? 1 : 0.4
                            }}
                        >
                            <dc.Icon icon="terminal" />
                            Copy Test Command
                        </button>
                        {isInitialized && (
                            <div style={styles.snippet}>
                                <code>node "{vaultPath}/.obsidian/scripts/obsidian-bridge.js"</code>
                            </div>
                        )}
                    </div>

                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Active Extensions ({extensions.length})</h3>
                        <div style={styles.extensionList}>
                            {extensions.length === 0 ? (
                                <div style={{ ...styles.extensionItem, opacity: 0.4 }}>
                                    <dc.Icon icon="unplug" />
                                    <span style={{ fontStyle: 'italic' }}>No extensions active</span>
                                </div>
                            ) : extensions.map(ext => (
                                <div key={ext} style={styles.extensionItem}>
                                    <dc.Icon icon={ext === 'videos' ? "video" : "cpu"} style={{ color: '#8b5cf6' }} />
                                    <span style={{ fontWeight: '700' }}>{ext === 'videos' ? 'dev:videos' : ext}</span>
                                    <div style={styles.tag}>Online</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.logContainer}>
                        <h3 style={styles.cardTitle}>Telemetry</h3>
                        <div style={styles.logArea}>
                            {logs.length === 0 ? 'Awaiting CLI telemetry...' : logs.map((log, i) => (
                                <div key={i} style={styles.logLine}>{log}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const SafeRoot = () => {
        const [key, setKey] = useState(0);
        useEffect(() => {
            return Agent.start(folderPath, () => {
                if (dc.app.workspace.activeLeaf?.rebuildView) {
                    dc.app.workspace.activeLeaf.rebuildView();
                } else {
                    setKey(k => k + 1);
                }
            });
        }, []);

        return <MainView key={key} />;
    };

    return <SafeRoot />;
}

return { View };
