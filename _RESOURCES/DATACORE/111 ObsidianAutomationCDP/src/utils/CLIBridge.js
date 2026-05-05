/**
 * CLIBridge.js
 */

class CLIBridge {
    static async execute(command) {
        return new Promise((resolve) => {
            let spawn;
            try {
                spawn = require('child_process').spawn;
            } catch (e) {
                return resolve("Error: child_process not available");
            }

            const userShell = process.env.SHELL || '/bin/zsh';
            // Specific path for Obsidian binary on macOS
            const obsidianPath = '/Applications/Obsidian.app/Contents/MacOS';
            const env = {
                ...process.env,
                PATH: `${obsidianPath}:${process.env.PATH || ''}`
            };

            const child = spawn(userShell, ['-l', '-c', command], { env });
            let stdout = '', stderr = '';

            child.stdout.on('data', (d) => stdout += d.toString());
            child.stderr.on('data', (d) => stderr += d.toString());

            child.on('close', (code) => {
                const output = (stdout + (stderr ? '\n' + stderr : '')).trim();
                resolve(output || `Done (code ${code})`);
            });

            child.on('error', (err) => resolve(`Error: ${err.message}`));
        });
    }
}

return { CLIBridge };
