/**
 * MCPBridge - Datacore Native Agent Control Bridge
 * Allows AI agents to execute UI commands and verify state via file-based polling.
 */
function MCPBridge({ folderPath, onReload }) {
    const { useEffect } = dc;
    const COMMAND_FILE = folderPath + '/_resources/data/mcp_commands.json';
    const STATE_FILE = folderPath + '/_resources/data/mcp_state.json';

    useEffect(() => {
        const adapter = dc.app.vault.adapter;

        const updateState = async (extra = {}) => {
            const state = {
                timestamp: new Date().toISOString(),
                folderPath,
                status: "active",
                ...extra
            };
            // Create directory if missing
            const dataDir = folderPath + '/_resources/data';
            if (!(await adapter.exists(dataDir))) {
                await adapter.mkdir(dataDir);
            }
            await adapter.write(STATE_FILE, JSON.stringify(state, null, 2));
        };

        const checkCommands = async () => {
            if (!(await adapter.exists(COMMAND_FILE))) return;
            
            try {
                const content = await adapter.read(COMMAND_FILE);
                const cmd = JSON.parse(content);

                if (cmd && cmd.executed === false) {
                    let result = "Success";
                    
                    switch (cmd.action) {
                        case 'reload':
                            await onReload();
                            break;
                            
                        case 'ping':
                            result = "pong";
                            break;
                            
                        default:
                            result = `Unknown action: ${cmd.action}`;
                    }

                    cmd.executed = true;
                    cmd.executedAt = new Date().toISOString();
                    cmd.result = result;
                    await adapter.write(COMMAND_FILE, JSON.stringify(cmd, null, 2));
                    await updateState({ lastResult: result });
                }
            } catch (e) {
                console.error("[MCPBridge] Error:", e);
            }
        };

        updateState({ status: "started" });
        const interval = setInterval(checkCommands, 1000);
        return () => clearInterval(interval);
    }, []);

    return null;
}

return { MCPBridge };
