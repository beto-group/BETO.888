/**
 * 105_ChromeExtensionBridge - View Factory
 * Consolidated Entry + Safe Agent (Rule #10)
 */
async function View({ folderPath, dc: dcInstance }) {
    const dcRef = dcInstance || dc;
    const { useState, useEffect, useRef } = dcRef;

    // 1. 🤖 SAFE AGENT (Immediate Recovery & Heartbeat)
    const Agent = {
        timer: null,
        start: (fPath, onReload) => {
            if (Agent.timer) clearInterval(Agent.timer);
            const cmdFile = fPath + '/mcp_commands.json';
            const stateFile = fPath + '/mcp_state.json';

            Agent.timer = setInterval(async () => {
                try {
                    const adapter = dcRef.app.vault.adapter;
                    
                    // Update State Heartbeat
                    if (Math.random() > 0.9) {
                        const state = { status: 'active', timestamp: new Date().toISOString(), component: '105_ChromeExtensionBridge' };
                        await adapter.write(stateFile, JSON.stringify(state, null, 2));
                    }

                    if (!(await adapter.exists(cmdFile))) return;
                    const content = await adapter.read(cmdFile);
                    let cmd; try { cmd = JSON.parse(content); } catch (e) { return; }

                    if (cmd && cmd.executed === false) {
                        const SAFE_ACTIONS = ['reload', 'open_settings'];
                        if (SAFE_ACTIONS.includes(cmd.action)) {
                            cmd.executed = true;
                            cmd.executedAt = new Date().toISOString();
                            cmd.result = "Executed via Safe Agent";
                            await adapter.write(cmdFile, JSON.stringify(cmd, null, 2));

                            if (cmd.action === 'reload') onReload();
                            else if (cmd.action === 'open_settings') dcRef.app.setting.open();
                        }
                    }
                } catch (e) { }
            }, 1000);
            return () => clearInterval(Agent.timer);
        }
    };

    // 2. SAFETY WRAPPER
    const SafeWrapper = () => {
        const [app, setApp] = useState(null);
        const [error, setError] = useState(null);
        const [key, setKey] = useState(0);

        // A. Life-Cycle
        useEffect(() => {
            return Agent.start(folderPath, () => {
                if (dcRef.app.workspace.activeLeaf?.rebuildView) dcRef.app.workspace.activeLeaf.rebuildView();
                else setKey(k => k + 1);
            });
        }, []);

        // B. Module Loading
        useEffect(() => {
            const load = async () => {
                try {
                    const styles = await dcRef.require(folderPath + "/src/styles/theme.css.js");
                    const { MCPBridge } = await dcRef.require(folderPath + "/src/components/MCPBridge.jsx");
                    const { MainComponent } = await dcRef.require(folderPath + "/src/components/MainComponent.jsx");
                    const ExtensionManager = await dcRef.require(folderPath + "/src/utils/ExtensionManager.js");

                    setApp({ styles, MCPBridge, MainComponent, ExtensionManager });
                } catch (e) {
                    console.error("[105_Bridge] Load Fault:", e);
                    setError(e);
                }
            };
            load();
        }, [key]);

        if (error) return (
            <div style={{ background: '#1a0505', color: '#ff4444', padding: '40px', height: '100%', fontFamily: 'monospace' }}>
                <h1 style={{ margin: 0 }}>PROTOCOL_FAULT</h1>
                <p>{error.message}</p>
                <div style={{ opacity: 0.5, fontSize: '12px' }}>{error.stack}</div>
            </div>
        );

        if (!app) return (
            <div style={{ background: '#050505', color: '#a855f7', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', letterSpacing: '4px' }}>
                HYDRATING BRIDGE...
            </div>
        );

        const { MainComponent, MCPBridge, styles, ExtensionManager } = app;
        return (
            <div id="bridge-root" style={{ width: '100%', height: '100%', background: '#050505' }}>
                <MCPBridge 
                    folderPath={folderPath} 
                    onReload={() => setKey(k => k + 1)} 
                    ExtensionManager={ExtensionManager}
                />
                <MainComponent 
                    folderPath={folderPath} 
                    styles={styles} 
                    ExtensionManager={ExtensionManager}
                    onReload={() => setKey(k => k + 1)}
                />
            </div>
        );
    };

    return <SafeWrapper />;
}

return { View };
