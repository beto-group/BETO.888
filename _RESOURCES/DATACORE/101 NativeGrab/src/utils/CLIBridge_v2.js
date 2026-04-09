/**
 * 128_Native_Grab - CLI Bridge
 * Executes obsidian CLI commands natively via child_process.
 */
const { spawn } = require('child_process');

const CLIBridge = {
    isAvailable: () => true,

    execute: async (command) => {
        return new Promise((resolve, reject) => {
            // Standard Obsidian CLI location on Mac
            const obsidianBin = '/usr/local/bin/obsidian';
            
            // Clean up command (strip 'obsidian ' if present)
            const cleanCmd = command.startsWith('obsidian ') ? command.substring(9) : command;
            const args = cleanCmd.match(/"[^"]+"|[^\s]+/g).map(arg => arg.replace(/^"|"$/g, ''));

            console.log(`[NativeGrab-CLI] Executing: obsidian ${args.join(' ')}`);

            const proc = spawn(obsidianBin, args, {
                env: { ...process.env, PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin' }
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => stdout += data.toString());
            proc.stderr.on('data', (data) => stderr += data.toString());

            proc.on('close', (code) => {
                if (code === 0) resolve(stdout.trim() || 'Success');
                else reject(new Error(stderr.trim() || `Command failed with code ${code}`));
            });
        });
    },

    /**
     * Specialized CDP method for high-fidelity interactions
     */
    cdp: async (method, params = {}) => {
        const paramsJson = JSON.stringify(params).replace(/"/g, '\\"');
        return CLIBridge.execute(`dev:cdp method=${method} params="${paramsJson}"`);
    }
};

return { CLIBridge };
