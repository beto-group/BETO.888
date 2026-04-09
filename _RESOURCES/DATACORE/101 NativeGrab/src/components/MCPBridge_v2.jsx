/**
 * 128_Native_Grab - AI Verification Bridge
 * Allows autonomous verification and state reporting.
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
                registry: "native_grab_v1",
                ...extra
            };
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
                            
                        case 'screenshot':
                            try {
                                const remote = require('@electron/remote') || require('electron').remote;
                                const webContents = remote.getCurrentWebContents();
                                const image = await webContents.capturePage();
                                const b64 = image.toDataURL();
                                await adapter.write(folderPath + '/mcp_screenshot_b64.txt', b64);
                                result = "Screenshot captured to mcp_screenshot_b64.txt";
                            } catch (e) { result = "Screenshot failed: " + e.message; }
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
                console.error("[NativeGrab-MCP] Error:", e);
            }
        };

        updateState({ status: "started" });
        const interval = setInterval(checkCommands, 1000);
        return () => clearInterval(interval);
    }, [folderPath]);

    return null;
}

return { MCPBridge };
