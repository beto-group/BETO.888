/**
 * Datacore Boilerplate - High Performance View Factory
 * Includes Modular Assembly, Unit Testing, and MCP Agent Control
 */
async function View({ folderPath }) {
    // 1. Initialize Safe Agent immediately (Pure JS, no React deps)
    const fs = require('fs');

    // Core Agent Logic (Inline for maximum safety)
    // This allows the agent to work even if the MainComponent hits a syntax error
    const Agent = {
        timer: null,
        start: (fPath, onReload) => {
            if (Agent.timer) clearInterval(Agent.timer);
            const cmdFile = fPath + '/mcp_commands.json';
            const logFile = fPath + '/mcp_activity.json';

            Agent.timer = setInterval(async () => {
                try {
                    const adapter = dc.app.vault.adapter;
                    if (!(await adapter.exists(cmdFile))) return;

                    const content = await adapter.read(cmdFile);
                    let cmd;
                    try { cmd = JSON.parse(content); } catch (e) { return; }

                    if (cmd && cmd.executed === false) {
                        // Safe Agent only handles specific recovery commands
                        const SAFE_ACTIONS = ['reload', 'open_settings'];

                        if (SAFE_ACTIONS.includes(cmd.action)) {
                            // Mark executed
                            cmd.executed = true;
                            cmd.result = "Executed by Safe Agent";
                            // Update timestamp
                            cmd.executedAt = new Date().toISOString();

                            await adapter.write(cmdFile, JSON.stringify(cmd, null, 2));

                            // Execute Safe Commands
                            if (cmd.action === 'reload') {
                                const act = [{ timestamp: new Date().toISOString(), action: 'reload', status: 'success', result: 'Reloading via Safe Agent' }];
                                try { await adapter.write(logFile, JSON.stringify(act, null, 2)); } catch (e) { }
                                onReload();
                            } else if (cmd.action === 'open_settings') {
                                dc.app.setting.open();
                            }
                        }
                    }
                } catch (e) { console.error("[SafeAgent] Error", e); }
            }, 1000);
            return () => clearInterval(Agent.timer);
        }
    };

    // 2. Define Safety Wrapper Component
    const SafeView = () => {
        const [app, setApp] = dc.useState(null);
        const [error, setError] = dc.useState(null);
        const [key, setKey] = dc.useState(0);

        // A. Start Agent when the view mounts
        dc.useEffect(() => {
            const stopAgent = Agent.start(folderPath, () => {
                // Reload Logic
                if (dc.app.workspace.activeLeaf?.rebuildView) {
                    dc.app.workspace.activeLeaf.rebuildView();
                } else {
                    setKey(k => k + 1); // Soft reload
                }
            });
            return stopAgent;
        }, []);

        // B. Load Main App safely
        dc.useEffect(() => {
            const load = async () => {
                try {
                    console.log(`[SafeView] Loading modules... Timestamp: ${Date.now()}`);
                    // Lazy load everything so we catch syntax errors in them
                    const domUtils = await dc.require(folderPath + '/src/utils/domUtils.jsx');
                    const { useTheme } = await dc.require(folderPath + '/src/hooks/useTheme.jsx');
                    const { useFullTab } = await dc.require(folderPath + '/src/hooks/useFullTab.jsx');

                    // Force refresh attempt (comment change)
                    const bridgeMod = await dc.require(folderPath + '/src/components/MCPBridge.jsx');
                    const MCPBridge = bridgeMod.MCPBridge;

                    const TestRunner = await dc.require(folderPath + '/src/TestRunner.jsx');
                    const { MainComponent } = await dc.require(folderPath + '/src/components/MainComponent.jsx');
                    const { ControlsMenu } = await dc.require(folderPath + '/src/components/ControlsMenu.jsx');
                    const { debugManager } = await dc.require(folderPath + '/src/utils/debugManager.jsx');
                    const { CSS } = await dc.require(folderPath + '/src/styles/theme.css.js');

                    setApp({
                        MainComponent, MCPBridge, useTheme,
                        debugManager, TestRunner, ControlsMenu,
                        useFullTab, domUtils, CSS
                    });
                    setError(null);
                } catch (e) {
                    console.error("Critical Load Error:", e);
                    setError(e);
                }
            };
            load();
        }, [key]);

        // C. Render Fallbacks or App
        if (error) {
            return (
                <div style={{ padding: '40px', background: '#2d1b1b', color: '#ffaaaa', height: '100%', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💥</div>
                    <h2 style={{ marginTop: 0, color: '#ff8888' }}>Component Crashed</h2>
                    <p style={{ maxWidth: '500px', lineHeight: '1.5', marginBottom: '24px', opacity: 0.8 }}>
                        The internal component failed to load. The <strong>Agent Console</strong> is still active and can be used to reload once fixes are applied.
                    </p>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', overflow: 'auto', width: '100%', maxWidth: '600px', textAlign: 'left', border: '1px solid #522' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ffcccc' }}>{error.message}</div>
                        <div style={{ fontSize: '11px', opacity: 0.6 }}>{error.stack}</div>
                    </div>
                </div>
            );
        }

        if (!app) {
            return (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                        Loading 66.6...
                    </div>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </div>
            );
        }

        const { MainComponent, MCPBridge, useTheme, debugManager, TestRunner, ControlsMenu, useFullTab, domUtils, CSS } = app;

        // D. The Actual App Wrapper
        return (
            <AppWrapper
                MainComponent={MainComponent}
                MCPBridge={MCPBridge}
                useTheme={useTheme}
                debugManager={debugManager}
                TestRunner={TestRunner}
                ControlsMenu={ControlsMenu}
                useFullTab={useFullTab}
                domUtils={domUtils}
                folderPath={folderPath}
                themeCSS={CSS}
            />
        );
    };

    return <SafeView />;
}

// Wrapper to hold hooks and refs for the successfully loaded app
function AppWrapper({
    MainComponent, MCPBridge, useTheme, debugManager,
    TestRunner, ControlsMenu, useFullTab, domUtils, folderPath, themeCSS
}) {
    const containerRef = dc.useRef(null);
    const [key, setKey] = dc.useState(0);
    const [isFullTab, setIsFullTab] = dc.useState(true);

    // Apply Theme
    useTheme({ css: themeCSS, folderPath });

    // Full Tab Logic
    useFullTab({ isFullTab, containerRef, domUtils });

    const handleReload = () => {
        if (dc.app.workspace.activeLeaf?.rebuildView) {
            dc.app.workspace.activeLeaf.rebuildView();
        } else {
            setKey(prev => prev + 1);
        }
        // Sync external window
        try { TestRunner.reloadTestWindow(folderPath); } catch (e) { }
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} id="datacore-component-root">
            <MCPBridge
                folderPath={folderPath}
                containerRef={containerRef}
                onReload={handleReload}
                onRunTests={() => TestRunner.spawnTestWindow(folderPath)}
                debugManager={debugManager}
            />
            <MainComponent
                key={key}
                folderPath={folderPath}
                containerRef={containerRef}
                isFullTab={isFullTab}
                onToggleFullTab={() => setIsFullTab(!isFullTab)}
                onCodeReloadRequest={handleReload}
                onRunTests={() => TestRunner.spawnTestWindow(folderPath)}
                ControlsMenu={ControlsMenu}
            />
        </div>
    );
}

return { View };
