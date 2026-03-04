/**
 * kmUtils.js
 * Bridge to Keyboard Maestro CLI
 * Docs: keyboardmaestro [options...] <macro name/uid>
 */

async function executeKMCommand({ macro, parameter, isAsync, isEdit }) {
    const kmPath = "/Applications/Keyboard Maestro.app/Contents/MacOS/keyboardmaestro";

    // Build flags first
    const flags = [];
    if (isAsync) flags.push('-a');
    if (isEdit) flags.push('-e');
    if (parameter) flags.push(`-p "${parameter}"`);

    // Macro name/UUID is always a positional argument — no -m flag!
    const cmd = `"${kmPath}" ${flags.join(' ')} "${macro}"`;

    return new Promise((resolve) => {
        let spawn;
        try {
            spawn = require('child_process').spawn;
        } catch (e) {
            return resolve({ success: false, error: "child_process not available", command: cmd });
        }

        const userShell = process.env.SHELL || '/bin/zsh';
        const child = spawn(userShell, ['-l', '-c', cmd], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (d) => { stdout += d.toString(); });
        child.stderr.on('data', (d) => { stderr += d.toString(); });

        child.on('close', (code) => {
            const output = (stdout + (stderr ? '\n' + stderr : '')).trim();
            if (code === 0 || isAsync) {
                resolve({ success: true, output: output || 'Command sent successfully', command: cmd });
            } else {
                resolve({ success: false, error: output || `Exited with code ${code}`, command: cmd });
            }
        });

        child.on('error', (err) => {
            resolve({ success: false, error: err.message, command: cmd });
        });
    });
}

return { executeKMCommand };
