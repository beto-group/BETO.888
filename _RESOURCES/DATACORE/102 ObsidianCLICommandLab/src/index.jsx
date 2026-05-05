/**
 * Obsidian CLI Command Lab - View Factory
 * Includes Safe Agent recovery and root support for FullTab reparenting.
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
                    const stylesMod = await dc.require(folderPath + "/src/styles/styles.jsx");
                    const { MCPBridge } = await dc.require(folderPath + "/src/components/MCPBridge.jsx");
                    const { MainComponent } = await dc.require(folderPath + "/src/components/MainComponent.jsx");
                    setApp({ MainComponent, MCPBridge, styles: stylesMod });
                } catch (e) { setError(e); }
            };
            load();
        }, [key]);

        if (error) return <div style={{ color: 'red', padding: '20px' }}>Error: {error.message}</div>;
        if (!app) return <div style={{ padding: '20px' }}>Initializing...</div>;

        const { MainComponent, MCPBridge, styles } = app;
        return (
            <div id="datacore-component-root" style={{ width: '100%', height: '100%' }}>
                <MCPBridge folderPath={folderPath} onReload={() => setKey(k => k + 1)} />
                <MainComponent folderPath={folderPath} styles={styles} />
            </div>
        );
    };

    return <SafeRoot />;
}

return { View };
