/**
 * MCPBridge - Agent Control Interface for 105_Bridge
 */
function MCPBridge({ folderPath, onReload, ExtensionManager: ExtManagerClass }) {
    const { useEffect, useRef } = dc;
    const COMMAND_FILE = folderPath + '/mcp_commands.json';
    const STATE_FILE = folderPath + '/mcp_state.json';

    useEffect(() => {
        const adapter = dc.app.vault.adapter;
        const manager = new ExtManagerClass(folderPath, dc);

        const updateState = async (extra = {}) => {
            const exts = await manager.getExtensions();
            const state = {
                timestamp: new Date().toISOString(),
                component: "105_ChromeExtensionBridge",
                status: 'active',
                extensions: exts,
                ...extra
            };
            await adapter.write(STATE_FILE, JSON.stringify(state, null, 2));
        };

        const checkCommands = async () => {
            try {
                if (!(await adapter.exists(COMMAND_FILE))) return;
                const content = await adapter.read(COMMAND_FILE);
                let cmd; try { cmd = JSON.parse(content); } catch (e) { return; }

                if (cmd && cmd.executed === false) {
                    console.log("[MCPBridge] Executing:", cmd.action);
                    let result = "Success";

                    switch (cmd.action) {
                        case 'reload':
                            cmd.executed = true;
                            cmd.executedAt = new Date().toISOString();
                            await adapter.write(COMMAND_FILE, JSON.stringify(cmd, null, 2));
                            onReload();
                            return;

                        case 'screenshot':
                            try {
                                const remote = require('@electron/remote') || require('electron').remote;
                                const img = await remote.getCurrentWebContents().capturePage();
                                await adapter.write(folderPath + '/mcp_screenshot_b64.txt', img.toDataURL());
                                result = "Screenshot captured";
                            } catch (e) { result = "Screenshot failed: " + e.message; }
                            break;

                        case 'load_extension':
                            try {
                                await manager.loadExtension(cmd.path);
                                result = `Loaded extension from ${cmd.path}`;
                            } catch (e) { result = "Load failed: " + e.message; }
                            break;

                        case 'list_extensions':
                            const list = await manager.getExtensions();
                            result = JSON.stringify(list);
                            break;

                        default:
                            result = `Action ${cmd.action} not recognized`;
                    }

                    cmd.executed = true;
                    cmd.executedAt = new Date().toISOString();
                    cmd.result = result;
                    await adapter.write(COMMAND_FILE, JSON.stringify(cmd, null, 2));
                    await updateState({ lastAction: cmd.action, lastResult: result });
                }
            } catch (e) { console.error("[MCPBridge] Error:", e); }
        };

        const interval = setInterval(checkCommands, 1000);
        updateState();

        return () => clearInterval(interval);
    }, []);

    return null;
}

return { MCPBridge };
