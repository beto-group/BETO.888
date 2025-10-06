

# ViewComponent

```jsx
// --- React and Node.js Imports ---
const { useState, useEffect, useRef, useCallback } = dc;
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// --- (No 'obsidian' module is required anymore) ---

// --- Terminal Styling Constants ---
const THEME = {
  background: '#282a36', foreground: '#f8f8f2', red: '#ff5555',
  green: '#50fa7b', yellow: '#f1fa8c', cyan: '#8be9fd',
};
const FONT_SETTINGS = {
    fontFamily: '"Fira Code", Menlo, "DejaVu Sans Mono", "Lucida Console", monospace',
    fontSize: 14,
};

// --- Standalone, Dependency-Free UI Components ---

/**
 * Replaces the Obsidian `Modal`. It's a self-contained modal component
 * that closes on 'Escape' key press or by clicking the background overlay.
 */
function StandaloneModal({ children, onClose }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        content: { backgroundColor: 'var(--background-secondary)', padding: '24px', borderRadius: '8px', minWidth: '500px', maxWidth: '80vw', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', border: '1px solid var(--background-modifier-border)' }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.content} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

/**
 * Replaces the Obsidian `Notice`. It's a self-contained toast/notice component.
 */
function StandaloneNotice({ text, visible }) {
    const styles = {
        notice: {
            position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'var(--background-primary)', color: 'var(--text-normal)',
            padding: '12px 24px', borderRadius: '6px', zIndex: 10000,
            opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease-in-out',
            pointerEvents: visible ? 'auto' : 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            border: '1px solid var(--background-modifier-border)',
        }
    };
    return <div style={styles.notice}>{text}</div>;
}


// --- Main React Component ---
function ProcessManager_Standalone() {
    const vaultPath = dc.app.vault.adapter.getBasePath();

    // --- State for Processes & UI ---
    const [command, setCommand] = useState('ls -al');
    const [processes, setProcesses] = useState({});
    const [isInputModalOpen, setInputModalOpen] = useState(false);
    const [resultModalData, setResultModalData] = useState(null); // Will hold { command, output }
    const [notice, setNotice] = useState({ text: '', visible: false });
    const logRefs = useRef({});

    // --- Reimplementation of `new Notice()` using state ---
    const showNotice = useCallback((text, duration = 5000) => {
        setNotice({ text, visible: true });
        setTimeout(() => setNotice(n => ({ ...n, visible: false })), duration);
    }, []);

    const getUserShell = () => (process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/sh'));
    const userShell = getUserShell();

    useEffect(() => {
        Object.keys(processes).forEach(pid => {
            const logElement = logRefs.current[pid];
            if (logElement) logElement.scrollTop = logElement.scrollHeight;
        });
    }, [processes]);

    const hideObsidianWindow = () => {
        const platform = os.platform();
        let hideCommand;
        if (platform === 'darwin') hideCommand = `osascript -e 'tell application "System Events" to set visible of process "Obsidian" to false'`;
        else if (platform === 'win32') hideCommand = `powershell -Command "Start-Sleep -Milliseconds 200; (New-Object -ComObject WScript.Shell).SendKeys('% n')"`;
        else if (platform === 'linux') hideCommand = `xdotool windowminimize $(xdotool getactivewindow)`;

        if (hideCommand) spawn(userShell, ['-c', hideCommand], { stdio: 'ignore', detached: true });
    };

    const runProcessAndHandleOutput = useCallback((commandToRun, showModal = true) => {
        if (!commandToRun || typeof commandToRun !== 'string') {
            showNotice('Invalid command provided for execution.');
            return;
        }
        if (!showModal) hideObsidianWindow();

        const child = spawn(userShell, ['-l', '-c', commandToRun], { cwd: vaultPath, detached: true });
        let collectedOutput = "";
        
        const newProcess = { child, command: commandToRun, pid: child.pid, output: `[Attempting to start: '${commandToRun}' in ${userShell}]\n`, status: 'running' };
        setProcesses(prev => ({ ...prev, [child.pid]: newProcess }));

        child.stdout.on('data', data => {
            const dataStr = data.toString();
            collectedOutput += dataStr;
            setProcesses(prev => {
                if (!prev[child.pid]) return prev;
                return { ...prev, [child.pid]: { ...prev[child.pid], output: prev[child.pid].output + dataStr } };
            });
        });

        child.stderr.on('data', data => {
            const dataStr = data.toString();
            collectedOutput += dataStr;
            setProcesses(prev => {
                if (!prev[child.pid]) return prev;
                return { ...prev, [child.pid]: { ...prev[child.pid], output: prev[child.pid].output + `\x1b[31m${dataStr}\x1b[0m` } };
            });
        });

        child.on('close', code => {
            if (showModal) {
                setResultModalData({ command: commandToRun, output: collectedOutput });
            } else {
                navigator.clipboard.writeText(collectedOutput);
                const msg = code === 0 ? `'${commandToRun}' executed successfully. Output copied.` : `'${commandToRun}' failed with code ${code}. Output copied.`;
                showNotice(msg, code === 0 ? 5000 : 7000);
            }
            setProcesses(prev => {
                if (!prev[child.pid]) return prev;
                return { ...prev, [child.pid]: { ...prev[child.pid], status: `stopped (exit code: ${code})` } };
            });
        });

        child.on('error', err => {
            const errorMessage = `Failed to start process '${commandToRun}': ${err.message}`;
            showNotice(errorMessage, 10000);
            if (!showModal) navigator.clipboard.writeText(errorMessage);
            setProcesses(prev => {
                if (!prev[child.pid]) return prev;
                return { ...prev, [child.pid]: { ...prev[child.pid], status: 'error', output: prev[child.pid].output + `\nERROR: ${err.message}` } };
            });
        });
    }, [vaultPath, userShell, showNotice]);

    const handleProcessTrigger = useCallback((commandFromURI) => {
        if (commandFromURI && typeof commandFromURI === 'string') {
            runProcessAndHandleOutput(commandFromURI, false);
        } else {
            setInputModalOpen(true); // Replaces `new CommandInputModal(...)`
        }
    }, [runProcessAndHandleOutput]);

    useEffect(() => {
        window.startSystemProcess = handleProcessTrigger;
        console.log("Process Manager: 'startSystemProcess' is now available on the window object.");
        showNotice("Process Manager URI handler is active.", 3000);
        return () => {
            delete window.startSystemProcess;
            console.log("Process Manager: Cleaned up 'startSystemProcess' from the window object.");
        };
    }, [handleProcessTrigger, showNotice]);

    const killProcess = (pid) => {
        const p = processes[pid];
        if (p && p.status === 'running') {
            process.kill(-p.child.pid, 'SIGKILL');
            showNotice(`Killed process: '${p.command}'`);
        }
    };

    const registerObsidianCommand = useCallback(() => {
        const datacorePlugin = dc.app.plugins.plugins.datacore;
        if (!datacorePlugin) { console.warn("Datacore plugin not found, cannot register command."); return; }
        const commandId = 'process-manager-start-new-process';
        if (dc.app.commands.commands[commandId]) return;
        datacorePlugin.addCommand({
            id: commandId,
            name: 'Process Manager: Start a new process...',
            callback: () => handleProcessTrigger(),
        });
    }, [handleProcessTrigger]);

    useEffect(() => { registerObsidianCommand(); }, [registerObsidianCommand]);

    // --- Component Styles (includes styles for new standalone components) ---
    const styles = {
        wrapper: { fontFamily: 'sans-serif', backgroundColor: 'var(--background-secondary)', padding: '16px', borderRadius: '8px' },
        title: { color: 'var(--text-normal)', borderBottom: '1px solid var(--background-modifier-border)', paddingBottom: '8px', marginBottom: '16px' },
        inputWrapper: { display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' },
        input: { flexGrow: 1, padding: '8px', border: '1px solid var(--background-modifier-border)', borderRadius: '4px', backgroundColor: 'var(--background-primary)', color: 'var(--text-normal)', ...FONT_SETTINGS },
        button: { padding: '8px 16px', border: 'none', borderRadius: '4px', backgroundColor: THEME.green, color: THEME.background, fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 },
        processList: { marginTop: '20px' },
        processCard: { border: '1px solid var(--background-modifier-border)', borderRadius: '4px', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--background-primary)' },
        processHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
        processTitle: { fontWeight: 'bold', color: 'var(--text-normal)', fontFamily: FONT_SETTINGS.fontFamily },
        processStatusRunning: { color: THEME.green, fontWeight: 'bold' },
        processStatusStopped: { color: THEME.red, fontWeight: 'bold' },
        processOutput: { backgroundColor: THEME.background, color: THEME.foreground, padding: '10px', borderRadius: '4px', overflowX: 'auto', maxHeight: '200px', ...FONT_SETTINGS, whiteSpace: 'pre-wrap' },
        uriInfo: { padding: '12px', border: '1px solid var(--background-modifier-border)', borderRadius: '4px', backgroundColor: 'var(--background-primary)', color: 'var(--text-muted)', fontSize: '14px', marginTop: '25px' },
        code: { backgroundColor: 'var(--background-modifier-border)', padding: '2px 5px', borderRadius: '3px', fontFamily: FONT_SETTINGS.fontFamily, color: 'var(--text-normal)' },
        // Styles for our new components
        modalHeader: { color: 'var(--text-normal)', marginTop: 0, marginBottom: '16px' },
        modalInput: { width: '100%', padding: '10px', border: '1px solid var(--background-modifier-border)', borderRadius: '4px', backgroundColor: 'var(--background-primary)', color: 'var(--text-normal)', marginBottom: '16px', boxSizing: 'border-box' },
        modalButton: { padding: '10px 20px', border: 'none', borderRadius: '4px', backgroundColor: 'var(--interactive-accent)', color: 'var(--text-on-accent)', fontWeight: 'bold', cursor: 'pointer', float: 'right' },
        modalOutputPre: { backgroundColor: THEME.background, color: THEME.foreground, padding: '10px', borderRadius: '5px', maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginBottom: '15px' }
    };

    // --- JSX for Rendering ---
    return (
        <div style={styles.wrapper}>
            <StandaloneNotice text={notice.text} visible={notice.visible} />
            
            {isInputModalOpen && (
                <StandaloneModal onClose={() => setInputModalOpen(false)}>
                    <h2 style={styles.modalHeader}>Run a New Process</h2>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const cmd = e.target.elements.command.value;
                        if (cmd) {
                            runProcessAndHandleOutput(cmd, true);
                            setInputModalOpen(false);
                        }
                    }}>
                        <input name="command" type="text" style={styles.modalInput} placeholder="Enter command..." autoFocus />
                        <button type="submit" style={styles.modalButton}>Run</button>
                    </form>
                </StandaloneModal>
            )}

            {resultModalData && (
                <StandaloneModal onClose={() => setResultModalData(null)}>
                    <h2 style={styles.modalHeader}>Result of: '{resultModalData.command}'</h2>
                    <pre style={styles.modalOutputPre}>{resultModalData.output || '(No output)'}</pre>
                    <button style={styles.modalButton} onClick={() => {
                        navigator.clipboard.writeText(resultModalData.output);
                        showNotice('Output copied to clipboard!', 3000);
                    }}>
                        Copy to Clipboard
                    </button>
                </StandaloneModal>
            )}

            <h3 style={styles.title}>System Process Manager</h3>
            <div style={styles.inputWrapper}>
                <input type="text" style={styles.input} value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Enter command to run..." onKeyDown={e => e.key === 'Enter' && runProcessAndHandleOutput(command, true)}/>
                <button style={styles.button} onClick={() => runProcessAndHandleOutput(command, true)}>Start Process (Show Modal)</button>
            </div>
            <div style={styles.processList}>
                {Object.values(processes).map(p => (
                    <div key={p.pid} style={styles.processCard}>
                        <div style={styles.processHeader}>
                            <span style={styles.processTitle}>{p.command} (PID: {p.pid})</span>
                            <span style={p.status === 'running' ? styles.processStatusRunning : styles.processStatusStopped}>{p.status}</span>
                        </div>
                        <pre ref={el => logRefs.current[p.pid] = el} style={styles.processOutput}>{p.output}</pre>
                        {p.status === 'running' && (
                            <button onClick={() => killProcess(p.pid)} style={{...styles.button, backgroundColor: THEME.red, marginTop: '10px'}}>Kill Process</button>
                        )}
                    </div>
                ))}
            </div>
            <div style={styles.uriInfo}>
                <h4 style={{marginTop: 0, color: 'var(--text-normal)'}}>URI Automation Ready (Silent Execution)</h4>
                <p>You can run commands directly using an <code style={styles.code}>obsidian://advanced-uri</code> link. This requires the 'Advanced URI' community plugin and 'Allow eval' enabled.</p>
                <b>Behavior:</b> The Obsidian window will hide/minimize, the command will execute, its output will be copied to your system clipboard, and an Obsidian notice will appear.
                <br/><br/>
                <b>Example URI (for CLI execution):</b>
                <pre style={{...styles.code, display: 'block', whiteSpace: 'pre-wrap', marginTop: '5px', padding: '8px'}}>
                    obsidian://advanced-uri?vault=YOUR_VAULT&eval=window.startSystemProcess('ls%20-la')
                </pre>
                <p style={{marginTop: '10px'}}>
                    Remember to <b>URL Encode</b> your command (e.g., space becomes <code style={styles.code}>%20</code>).
                </p>
                <p style={{color: THEME.red, fontWeight: 'bold', marginTop: '10px'}}>
                    ⚠️ Security Warning: The `eval` parameter is powerful. Only run commands from URIs you trust.
                </p>
            </div>
        </div>
    );
}

// --- Export the component for Datacore ---
return { View: ProcessManager_Standalone };
```


