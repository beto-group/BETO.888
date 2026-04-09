
/**
 * 128_Native_Grab - CLI Bridge
 * Executes obsidian CLI commands natively via child_process.
 * Optimized for local obsidian_proxy.sh script.
 */
function getCLIBridge() {
    const { spawn } = require('child_process');
    
    // Bridge Singleton State
    const bridgeState = {
        inFlight: false,
        timeoutMs: 1500 // Max 1.5s per command
    };

    const CLIBridge = {
        isAvailable: () => true,

        execute: async (command) => {
            if (bridgeState.inFlight) {
                console.warn("[NativeGrab-CLI] Overload: Command Skipped", command);
                return "SKIPPED";
            }

            bridgeState.inFlight = true;

            return new Promise((resolve, reject) => {
                const obsidianProxyPath = '/Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/.obsidian/scripts/obsidian_proxy.sh';
                const cleanCmd = command.startsWith('obsidian ') ? command.substring(9) : command;
                const fullCommand = `"${obsidianProxyPath}" ${cleanCmd}`;

                const proc = spawn('/bin/zsh', ['-l', '-c', fullCommand], {
                    env: { ...process.env, TERM: 'xterm-256color' }
                });

                let stdout = '';
                let stderr = '';
                
                const timer = setTimeout(() => {
                    proc.kill();
                    bridgeState.inFlight = false;
                    reject(new Error("CLI_TIMEOUT"));
                }, bridgeState.timeoutMs);

                proc.stdout.on('data', (data) => stdout += data.toString());
                proc.stderr.on('data', (data) => stderr += data.toString());

                proc.on('close', (code) => {
                    clearTimeout(timer);
                    bridgeState.inFlight = false;
                    if (code === 0) resolve(stdout.trim() || 'Success');
                    else reject(new Error(stderr.trim() || `Command failed with code ${code}`));
                });
            });
        },

        cdp: async (method, params = {}) => {
            const paramsJson = JSON.stringify(params).replace(/"/g, '\\"');
            const result = await CLIBridge.execute(`dev:cdp method=${method} params="${paramsJson}"`);
            
            if (result === "SKIPPED" || result === "CLI_TIMEOUT") return null;

            // Clean up Obsidian CLI prefix "=> " if present
            const clean = result.startsWith('=> ') ? result.substring(3) : result;
            try {
                return JSON.parse(clean);
            } catch (e) {
                console.warn("[NativeGrab-CLI] CDP Result Parse Fail:", clean);
                return clean;
            }
        }
    };

    return CLIBridge;
}

return { getCLIBridge };
