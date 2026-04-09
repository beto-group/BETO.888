/**
 * 128_Native_Grab - View Factory
 * High-performance Datacore component replacing react-grab with native CDP interactions.
 */
async function View({ folderPath }) {

    // 1. Safe Agent Layer (Immediate Recovery)
    const Agent = {
        timer: null,
        start: (fPath, onReload) => {
            const cmdFile = fPath + '/_resources/data/mcp_commands.json';
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

    const SafeRoot = () => {
        const [app, setApp] = dc.useState(null);
        const [error, setError] = dc.useState(null);
        const [key, setKey] = dc.useState(0);

        dc.useEffect(() => {
            return Agent.start(folderPath, () => {
                if (dc.app.workspace.activeLeaf?.rebuildView) {
                    dc.app.workspace.activeLeaf.rebuildView();
                } else {
                    setKey(k => k + 1);
                }
            });
        }, []);

        dc.useEffect(() => {
            const load = async () => {
                try {
                    const stylesMod = await dc.require(folderPath + "/src/styles/styles_v2.jsx");
                    const { MCPBridge } = await dc.require(folderPath + "/src/components/MCPBridge_v2.jsx");
                    const { CLIBridge } = await dc.require(folderPath + "/src/utils/CLIBridge_v2.js");
                    const { MainComponent } = await dc.require(folderPath + "/src/components/MainComponent_v2.jsx");
                    setApp({ MainComponent, MCPBridge, CLIBridge, styles: stylesMod });
                } catch (e) { 
                    console.error("[NativeGrab] Load Error:", e);
                    setError(e); 
                }
            };
            load();
        }, [key, folderPath]);

        if (error) return <div style={{ color: '#f87171', padding: '20px', background: '#000', height: '100%' }}>Error: {error.message}</div>;
        if (!app) return <div style={{ padding: '20px', background: '#000', height: '100%', color: '#8b5cf6' }}>Initializing Native Grab Engine...</div>;

        const { MainComponent, MCPBridge, CLIBridge, styles } = app;
        return (
            <div id="datacore-component-root" style={{ width: '100%', height: '100%', background: '#000' }}>
                <MCPBridge folderPath={folderPath} onReload={() => setKey(k => k + 1)} />
                <MainComponent folderPath={folderPath} styles={styles} CLIBridge={CLIBridge} />
            </div>
        );
    };

    return <SafeRoot />;
}

return { View };
