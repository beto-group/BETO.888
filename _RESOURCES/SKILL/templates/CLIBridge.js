const CLIBridge = {
    async execute(command) {
        return new Promise((resolve) => {
            let spawn;
            try {
                spawn = require('child_process').spawn;
            } catch (e) {
                try {
                    spawn = window.require('child_process').spawn;
                } catch (e2) {
                    return resolve("Error: child_process not available");
                }
            }
            const userShell = process.env.SHELL || '/bin/zsh';
            // Default Kubeconfig path (Targeting the Obsidian root or relative)
            const kubeconfig = 'infrastructure/terraform/oracle-kubeconfig.yaml';
            
            let fullCommand = command;
            if (command.includes('kubectl')) {
                fullCommand = `KUBECONFIG=${kubeconfig} ${command}`;
            }

            const obsidianPath = '/Applications/Obsidian.app/Contents/MacOS';
            const env = {
                ...process.env,
                PATH: `${obsidianPath}:${process.env.PATH || ''}:/usr/local/bin:/usr/bin:/bin`
            };

            const child = spawn(userShell, ['-l', '-c', fullCommand], { env });
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
};

return { CLIBridge };
