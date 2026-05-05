/**
 * 47 RandomFileControls - File Management OS
 * Consolidated Master Protocol (Rule #13)
 */
async function View({ folderPath }) {
    const { useState, useEffect, useRef } = dc;

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

    // 2. Resource Resolution
    const resBase = folderPath + "/src";
    const [resources, setResources] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const { cli } = await dc.loadResource(resBase + "/utils/CLIBridge.js");
                const { FileOps } = await dc.loadResource(resBase + "/utils/FileOps.js");
                const { MainComponent } = await dc.loadResource(resBase + "/components/MainComponent.jsx");
                setResources({ utils: { cli }, FileOps, MainComponent });
            } catch (e) {
                console.error("[47] Resource Load Error:", e);
            }
        };
        load();
    }, [resBase]);

    const styles = {
        container: {
            height: '100%', width: '100%',
            backgroundColor: '#000', color: '#fff',
            display: 'flex', flexDirection: 'column',
            fontFamily: 'JetBrains Mono, monospace',
            overflow: 'hidden', position: 'absolute', inset: 0
        },
        header: {
            padding: '24px 32px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#050505'
        },
        grid: {
            display: grid = 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px', padding: '40px', overflowY: 'auto', flex: 1
        },
        card: {
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '32px', borderRadius: '4px',
            display: 'flex', flexDirection: 'column', gap: '16px',
            transition: 'all 0.2s ease'
        },
        button: {
            padding: '12px 20px', backgroundColor: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px',
            fontSize: '11px', fontWeight: '700', cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.1em'
        },
        footer: {
            padding: '16px 32px', borderTop: '1px solid rgba(255,255,255,0.05)',
            fontSize: '10px', color: 'rgba(255,255,255,0.2)',
            display: 'flex', justifyContent: 'space-between'
        }
    };

    const SafeRoot = () => {
        const [key, setKey] = useState(0);
        const rootRef = useRef(null);

        // Core Immersion Loop (Rule #6)
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

        useEffect(() => {
            return Agent.start(folderPath, () => {
                if (dc.app.workspace.activeLeaf?.rebuildView) dc.app.workspace.activeLeaf.rebuildView();
                else setKey(k => k + 1);
            });
        }, []);

        if (!resources) return <div style={{ color: '#fff', padding: '40px' }}>INITIALIZING LOGISTICS UNIT...</div>;

        return (
            <div ref={rootRef} key={key} style={{ height: '100%', width: '100%' }}>
                <resources.MainComponent 
                    folderPath={folderPath} 
                    styles={styles} 
                    utils={resources.utils}
                    FileOps={resources.FileOps}
                />
            </div>
        );
    };

    return <SafeRoot />;
}

return { View };
