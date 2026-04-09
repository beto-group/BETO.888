function MCPDashboard({ STYLES, dc }) {
    const { useState, useEffect } = dc;

    const [activeTab, setActiveTab] = useState('overview');
    const [mockServerStatus, setMockServerStatus] = useState('stopped');
    const [loadedConfig, setLoadedConfig] = useState(null);

    // Mock loading the config we just created
    useEffect(() => {
        async function load() {
            try {
                // In a real app we'd read the file. simulating for UI prototype.
                const config = {
                    name: "beto-core",
                    version: "1.0.0",
                    commands: ["beto-dev", "beto-ops", "beto-ref"]
                };
                setLoadedConfig(config);
            } catch (e) { console.error(e); }
        }
        load();
    }, []);

    const toggleServer = () => {
        setMockServerStatus(s => s === 'stopped' ? 'starting' : 'stopped');
        if (mockServerStatus === 'stopped') {
            setTimeout(() => setMockServerStatus('running'), 1500);
        }
    };

    const renderSidebar = () => (
        <div style={STYLES.sidebar}>
            <div style={STYLES.title}>BETO MCP</div>
            <div style={STYLES.subtitle}>Local Proto-Server</div>

            <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div
                    style={{ ...STYLES.navItem, ...(activeTab === 'overview' ? STYLES.navItemActive : {}) }}
                    onClick={() => setActiveTab('overview')}
                >
                    <dc.Icon icon="layout-dashboard" />
                    Overview
                </div>
                <div
                    style={{ ...STYLES.navItem, ...(activeTab === 'skills' ? STYLES.navItemActive : {}) }}
                    onClick={() => setActiveTab('skills')}
                >
                    <dc.Icon icon="brain" />
                    Skill Registry
                </div>
                <div
                    style={{ ...STYLES.navItem, ...(activeTab === 'config' ? STYLES.navItemActive : {}) }}
                    onClick={() => setActiveTab('config')}
                >
                    <dc.Icon icon="settings" />
                    Configuration
                </div>
                <div
                    style={{ ...STYLES.navItem, ...(activeTab === 'debug' ? STYLES.navItemActive : {}) }}
                    onClick={() => setActiveTab('debug')}
                >
                    <dc.Icon icon="terminal" />
                    Debug Console
                </div>
            </div>

            <div style={{ marginTop: 'auto', padding: '15px', background: '#111', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>SERVER STATUS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: mockServerStatus === 'running' ? '#4fba6f' :
                            mockServerStatus === 'starting' ? '#f59e0b' : '#ef4444'
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff', textTransform: 'capitalize' }}>
                        {mockServerStatus}
                    </span>
                </div>
                <button
                    onClick={toggleServer}
                    style={{
                        width: '100%', marginTop: '10px', padding: '6px',
                        background: mockServerStatus === 'running' ? '#ef4444' : '#4fba6f',
                        border: 'none', borderRadius: '4px', color: '#fff',
                        fontSize: '11px', cursor: 'pointer'
                    }}
                >
                    {mockServerStatus === 'running' ? 'STOP SERVER' : 'START SIMULATION'}
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        if (activeTab === 'overview') {
            return (
                <div style={{ maxWidth: '800px' }}>
                    <h1 style={STYLES.title}>Welcome, Architect</h1>
                    <p style={{ color: '#aaa', fontSize: '16px', lineHeight: '1.6' }}>
                        This dashboard prototypes the <strong>Model Context Protocol (MCP)</strong> interface for your agents.
                        It maps the static Knowledge Hub (`_resources/agents`) into dynamic Tools that can be exposed to Claude or other LLMs.
                    </p>

                    <div style={STYLES.grid}>
                        <div style={STYLES.glassCard}>
                            <h3 style={STYLES.sectionTitle}>Knowledge Hub</h3>
                            <p style={{ color: '#888' }}>
                                4 Skill Modules Loaded<br />
                                (Dev, Ops, Ref, Core)
                            </p>
                        </div>
                        <div style={STYLES.glassCard}>
                            <h3 style={STYLES.sectionTitle}>Protocol</h3>
                            <p style={{ color: '#888' }}>
                                OCS v1.0 Compliant<br />
                                JSON-RPC 2.0 Ready
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'skills') {
            return (
                <div>
                    <h2 style={STYLES.sectionTitle}>Registered Capabilities</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {['beto-dev', 'beto-ops', 'beto-ref', 'obsidian-core'].map(skill => (
                            <div key={skill} style={{ ...STYLES.glassCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>{skill}</div>
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                        Exposes `_resources/agents/{skill}/SKILL.md`
                                    </div>
                                </div>
                                <div style={{
                                    padding: '4px 8px', borderRadius: '4px', background: 'rgba(79, 186, 111, 0.1)',
                                    color: '#4fba6f', fontSize: '11px'
                                }}>
                                    READY
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeTab === 'config') {
            return (
                <div>
                    <h2 style={STYLES.sectionTitle}>Manifest Configuration</h2>
                    <p style={{ color: '#888', marginBottom: '15px' }}>
                        Preview of <code>.claude-plugin/plugin.json</code>
                    </p>
                    <div style={STYLES.codeBlock}>
                        {JSON.stringify({
                            "schema_version": "v1",
                            "name": "beto-core",
                            "description": "Core skills for Beto Datacore Agents",
                            "version": "1.0.0",
                            "commands": [
                                {
                                    "name": "beto-dev",
                                    "description": "Access technical development patterns...",
                                    "usage": "Use when writing React code..."
                                },
                                { "name": "..." }
                            ]
                        }, null, 2)}
                    </div>
                </div>
            );
        }

        return <div style={{ color: '#888' }}>Module under construction...</div>;
    };

    return (
        <div style={STYLES.container}>
            {renderSidebar()}
            <div style={STYLES.mainContent}>
                {renderContent()}
            </div>
        </div>
    );
}

return { MCPDashboard };
