

# ViewComponent

```jsx
// --- React and Node.js Imports ---
const { useState, useEffect, useRef, useCallback } = dc;
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// --- DOM Traversal Utilities for Full-Tab Mode ---
function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
        if (current.classList && current.classList.contains(className)) {
            return current;
        }
        current = current.parentNode;
    }
    return null;
}

function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (const child of parent.children) {
        if (child.classList && child.classList.contains(className)) {
            return child;
        }
    }
    return null;
}

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
    const uniqueWrapperClass = "interactive-wrapper-" + useRef(Math.random().toString(36).substr(2, 9)).current;

    // --- State ---
    const [isFullTab, setIsFullTab] = useState(true);
    const [currentDir, setCurrentDir] = useState(vaultPath);
    const [command, setCommand] = useState('');
    const [terminalHistory, setTerminalHistory] = useState([]);
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [processes, setProcesses] = useState({});
    const [notice, setNotice] = useState({ text: '', visible: false });
    const [showUriInfo, setShowUriInfo] = useState(false);
    const [showProcessPanel, setShowProcessPanel] = useState(false);
    const [envVars, setEnvVars] = useState({ ...process.env });
    const [aliases, setAliases] = useState({
        ll: 'ls -lah',
        la: 'ls -A',
        cls: 'clear',
        '.': 'pwd',
        '..': 'cd ..',
        '...': 'cd ../..',
        gs: 'git status',
        gp: 'git pull',
        gc: 'git commit',
        gd: 'git diff',
        gl: 'git log --oneline -10',
    });
    const [suggestions, setSuggestions] = useState([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [collapsedOutputs, setCollapsedOutputs] = useState({}); // Track collapsed state by group index
    
    const terminalEndRef = useRef(null);
    const inputRef = useRef(null);
    const activeProcessRef = useRef(null);
    const handleCommandRef = useRef(null);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;
    const processesRef = useRef(processes); // Keep ref to latest processes for cleanup

    // Update processesRef whenever processes change
    useEffect(() => {
        processesRef.current = processes;
    }, [processes]);

    // --- Reimplementation of `new Notice()` using state ---
    const showNotice = useCallback((text, duration = 5000) => {
        setNotice({ text, visible: true });
        setTimeout(() => setNotice(n => ({ ...n, visible: false })), duration);
    }, []);

    const getUserShell = () => (process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/sh'));
    const userShell = getUserShell();

    // Auto-scroll terminal to bottom
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalHistory]);

    // Focus input when entering full-tab mode
    useEffect(() => {
        if (isFullTab && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isFullTab]);

    const addToTerminal = useCallback((entry) => {
        setTerminalHistory(prev => {
            const newHistory = [...prev, entry];
            // Auto-collapse background process commands
            if (entry.type === 'command' && entry.background) {
                // Count how many commands exist now (including this one)
                const commandCount = newHistory.filter(e => e.type === 'command').length;
                // Set this command's index to collapsed
                setCollapsedOutputs(prevCollapsed => ({ 
                    ...prevCollapsed, 
                    [commandCount - 1]: true // Groups are 0-indexed
                }));
            }
            return newHistory;
        });
    }, []);

    // Auto-completion and suggestions
    const generateSuggestions = useCallback((input) => {
        if (!input.trim()) return [];
        
        const builtInCommands = ['help', 'clear', 'ps', 'kill', 'bg', 'fg', 'cd', 'pwd', 'env', 'export', 'alias', 'unalias', 'history', 'exit', 'loadscript'];
        const aliasNames = Object.keys(aliases);
        const commonCommands = ['ls', 'cat', 'grep', 'find', 'echo', 'touch', 'mkdir', 'rm', 'cp', 'mv', 'git', 'npm', 'node', 'python', 'python3', 'curl', 'wget', 'code', 'vim', 'nano'];
        
        const allCommands = [...new Set([...builtInCommands, ...aliasNames, ...commonCommands])];
        const words = input.split(' ');
        const currentWord = words[words.length - 1];
        
        if (words.length === 1) {
            return allCommands.filter(cmd => cmd.startsWith(currentWord)).slice(0, 8);
        }
        
        return [];
    }, [aliases]);

    useEffect(() => {
        const newSuggestions = generateSuggestions(command);
        setSuggestions(newSuggestions);
        setSelectedSuggestion(0);
    }, [command, generateSuggestions]);

    const detectBackgroundProcess = (cmd) => {
        const bgPatterns = [
            /npm\s+(run\s+)?dev/i,
            /npm\s+start/i,
            /yarn\s+dev/i,
            /yarn\s+start/i,
            /pnpm\s+dev/i,
            /python.*-m\s+http\.server/i,
            /serve/i,
            /&\s*$/,
            /node.*server/i,
            /nodemon/i,
            /ollama\s+serve/i,
            /watch/i,
        ];
        return bgPatterns.some(pattern => pattern.test(cmd));
    };

    const hideObsidianWindow = () => {
        const platform = os.platform();
        let hideCommand;
        if (platform === 'darwin') hideCommand = `osascript -e 'tell application "System Events" to set visible of process "Obsidian" to false'`;
        else if (platform === 'win32') hideCommand = `powershell -Command "Start-Sleep -Milliseconds 200; (New-Object -ComObject WScript.Shell).SendKeys('% n')"`;
        else if (platform === 'linux') hideCommand = `xdotool windowminimize $(xdotool getactivewindow)`;

        if (hideCommand) spawn(userShell, ['-c', hideCommand], { stdio: 'ignore', detached: true });
    };

    const runProcessAndHandleOutput = useCallback((commandToRun, isBackground = null, workingDir = null) => {
        if (!commandToRun || typeof commandToRun !== 'string') {
            addToTerminal({ type: 'error', content: 'Invalid command provided' });
            return;
        }

        // Clean and validate command
        const cleanCommand = commandToRun.trim();
        if (!cleanCommand) {
            addToTerminal({ type: 'error', content: 'Empty command' });
            return;
        }

        // Auto-detect if not specified
        const shouldRunBackground = isBackground !== null ? isBackground : detectBackgroundProcess(cleanCommand);
        const dir = workingDir || currentDir;

        setIsProcessing(true);

        // Use login shell to load PATH from .zshrc/.bashrc
        const shellArgs = userShell.includes('zsh') || userShell.includes('bash') 
            ? ['-l', '-c', cleanCommand]  // -l loads login profile
            : ['-c', cleanCommand];

        const child = spawn(userShell, shellArgs, { 
            cwd: dir, 
            detached: true,
            env: { ...envVars, TERM: 'xterm-256color' }
        });
        
        const pid = child.pid;
        
        // Add command to terminal AFTER we have the PID
        addToTerminal({ 
            type: 'command', 
            content: cleanCommand,
            background: shouldRunBackground,
            cwd: dir,
            pid: pid
        });
        
        const processData = {
            child,
            command: commandToRun,
            pid,
            output: '',
            status: 'running',
            isBackground: shouldRunBackground,
            startTime: Date.now(),
            cwd: dir
        };
        
        setProcesses(prev => ({ ...prev, [pid]: processData }));

        if (shouldRunBackground) {
            addToTerminal({ 
                type: 'info', 
                content: `[${pid}] Background: ${commandToRun}` 
            });
            setIsProcessing(false);
            activeProcessRef.current = null;
        } else {
            activeProcessRef.current = pid;
        }

        let outputBuffer = '';
        const processPid = pid; // Capture PID in closure
        const flushOutput = () => {
            if (outputBuffer) {
                addToTerminal({ type: 'output', content: outputBuffer, pid: processPid });
                outputBuffer = '';
            }
        };
        const flushInterval = setInterval(flushOutput, 100);

        child.stdout.on('data', data => {
            const dataStr = data.toString();
            outputBuffer += dataStr;
            setProcesses(prev => {
                if (!prev[processPid]) return prev;
                return { ...prev, [processPid]: { ...prev[processPid], output: prev[processPid].output + dataStr } };
            });
        });

        child.stderr.on('data', data => {
            const dataStr = data.toString();
            outputBuffer += dataStr;
            setProcesses(prev => {
                if (!prev[processPid]) return prev;
                return { ...prev, [processPid]: { ...prev[processPid], output: prev[processPid].output + dataStr } };
            });
        });

        child.on('close', code => {
            clearInterval(flushInterval);
            flushOutput();
            
            const duration = ((Date.now() - processData.startTime) / 1000).toFixed(2);
            const exitMessage = code === 0 
                ? `[${processPid}] Exited (${duration}s)` 
                : `[${processPid}] Failed: exit ${code} (${duration}s)`;
            
            addToTerminal({ 
                type: code === 0 ? 'success' : 'error', 
                content: exitMessage,
                pid: processPid 
            });

            setProcesses(prev => {
                if (!prev[processPid]) return prev;
                return { ...prev, [processPid]: { ...prev[processPid], status: `stopped (exit: ${code})` } };
            });

            if (activeProcessRef.current === processPid) {
                activeProcessRef.current = null;
                setIsProcessing(false);
            }
        });

        child.on('error', err => {
            clearInterval(flushInterval);
            addToTerminal({ 
                type: 'error', 
                content: `[${processPid}] Error: ${err.message}`,
                pid: processPid 
            });
            setProcesses(prev => {
                if (!prev[processPid]) return prev;
                return { ...prev, [processPid]: { ...prev[processPid], status: 'error' } };
            });
            
            if (activeProcessRef.current === processPid) {
                activeProcessRef.current = null;
                setIsProcessing(false);
            }
        });
    }, [vaultPath, userShell, addToTerminal, detectBackgroundProcess, currentDir, envVars]);

    const killProcess = useCallback((pid) => {
        const p = processes[pid];
        if (p && p.status === 'running') {
            try {
                // Kill the entire process group to ensure child processes are also killed
                process.kill(-p.child.pid, 'SIGTERM');
                
                // Give it a moment, then force kill if still running
                setTimeout(() => {
                    try {
                        process.kill(-p.child.pid, 'SIGKILL');
                    } catch (err) {
                        // Process already dead, ignore
                    }
                }, 500);
                
                addToTerminal({ type: 'info', content: `[Process ${pid}] Terminated: ${p.command}` });
                
                // Update process status
                setProcesses(prev => {
                    if (!prev[pid]) return prev;
                    return { ...prev, [pid]: { ...prev[pid], status: 'killed' } };
                });
            } catch (err) {
                addToTerminal({ type: 'error', content: `Failed to kill process ${pid}: ${err.message}` });
            }
        } else {
            addToTerminal({ type: 'error', content: `Process ${pid} not found or not running` });
        }
    }, [processes, addToTerminal]);

    const handleCommand = useCallback((cmd) => {
        if (!cmd.trim()) return;

        // Expand aliases
        const words = cmd.trim().split(/\s+/);
        const firstWord = words[0];
        if (aliases[firstWord]) {
            cmd = aliases[firstWord] + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
        }

        setCommandHistory(prev => [...prev, cmd]);
        setHistoryIndex(-1);

        // Built-in commands
        if (cmd === 'help') {
            addToTerminal({ type: 'help', content: `Datacore Terminal Commands:

Navigation & Files:
  cd <dir>          - Change directory
  pwd               - Print working directory
  ls, ll, la        - List files (ll/la are aliases)
  
Process Management:
  ps                - List running processes
  kill <pid>        - Kill a process by PID
  bg <command>      - Force run in background
  fg <command>      - Force run in foreground
  
Terminal Control:
  clear, cls        - Clear terminal
  history           - Show command history
  exit              - Exit full-tab mode
  
Environment:
  env               - Show environment variables
  export KEY=VALUE  - Set environment variable
  alias name=cmd    - Create command alias
  unalias name      - Remove alias

LoadScript (CDN):
  loadscript <url> [--global=name] [--type=module]
                    - Load script/module from CDN with caching
  
Shortcuts:
  Ctrl+C            - Interrupt running process
  Ctrl+L            - Clear screen
  Tab               - Autocomplete
  ↑/↓               - Navigate history
  
Built-in aliases: ${Object.keys(aliases).join(', ')}

Any other command runs in shell with auto background detection` });
            return;
        }

        if (cmd.startsWith('loadscript ')) {
            const args = cmd.substring(11).trim();
            const parts = args.split(/\s+/);
            const url = parts[0];
            
            let globalName = null;
            let type = 'script';
            
            // Parse optional flags
            for (let i = 1; i < parts.length; i++) {
                if (parts[i].startsWith('--global=')) {
                    globalName = parts[i].substring(9);
                } else if (parts[i].startsWith('--type=')) {
                    type = parts[i].substring(7);
                }
            }
            
            if (!url) {
                addToTerminal({ type: 'error', content: 'Usage: loadscript <url> [--global=name] [--type=module|script]' });
                return;
            }
            
            addToTerminal({ type: 'info', content: `Loading ${type} from: ${url}` });
            
            loadScript(dc, url, { type, globalName })
                .then((result) => {
                    if (type === 'module') {
                        const exports = Object.keys(result);
                        addToTerminal({ type: 'success', content: `✓ Module loaded successfully` });
                        addToTerminal({ type: 'info', content: `  Exports (${exports.length}): ${exports.join(', ')}` });
                        if (globalName) {
                            addToTerminal({ type: 'info', content: `  Available as: window.${globalName}` });
                        }
                    } else {
                        addToTerminal({ type: 'success', content: `✓ Script loaded successfully` });
                        if (globalName && window[globalName]) {
                            addToTerminal({ type: 'info', content: `  Available as: window.${globalName}` });
                        }
                    }
                })
                .catch((err) => {
                    addToTerminal({ type: 'error', content: `Failed to load: ${err.message}` });
                });
            
            return;
        }

        if (cmd === 'clear' || cmd === 'cls') {
            setTerminalHistory([]);
            return;
        }

        if (cmd === 'history') {
            addToTerminal({ type: 'info', content: 'Command history:' });
            commandHistory.forEach((h, i) => {
                addToTerminal({ type: 'output', content: `  ${i + 1}  ${h}` });
            });
            return;
        }

        if (cmd === 'exit') {
            setIsFullTab(false);
            return;
        }

        if (cmd === 'pwd') {
            addToTerminal({ type: 'output', content: currentDir });
            return;
        }

        if (cmd.startsWith('cd ')) {
            const newPath = cmd.substring(3).trim();
            const resolvedPath = path.isAbsolute(newPath) ? newPath : path.resolve(currentDir, newPath);
            
            try {
                if (require('fs').existsSync(resolvedPath)) {
                    setCurrentDir(resolvedPath);
                    addToTerminal({ type: 'success', content: `Changed directory to: ${resolvedPath}` });
                } else {
                    addToTerminal({ type: 'error', content: `cd: no such directory: ${newPath}` });
                }
            } catch (err) {
                addToTerminal({ type: 'error', content: `cd: ${err.message}` });
            }
            return;
        }

        if (cmd === 'env') {
            addToTerminal({ type: 'info', content: 'Environment variables:' });
            Object.entries(envVars).slice(0, 20).forEach(([key, value]) => {
                addToTerminal({ type: 'output', content: `  ${key}=${value}` });
            });
            addToTerminal({ type: 'info', content: `... and ${Object.keys(envVars).length - 20} more` });
            return;
        }

        if (cmd.startsWith('export ')) {
            const envDef = cmd.substring(7).trim();
            const [key, ...valueParts] = envDef.split('=');
            const value = valueParts.join('=');
            if (key && value) {
                setEnvVars(prev => ({ ...prev, [key]: value }));
                addToTerminal({ type: 'success', content: `Exported: ${key}=${value}` });
            } else {
                addToTerminal({ type: 'error', content: 'Usage: export KEY=VALUE' });
            }
            return;
        }

        if (cmd.startsWith('alias ')) {
            const aliasDef = cmd.substring(6).trim();
            const eqIndex = aliasDef.indexOf('=');
            if (eqIndex > 0) {
                const name = aliasDef.substring(0, eqIndex);
                const command = aliasDef.substring(eqIndex + 1);
                setAliases(prev => ({ ...prev, [name]: command }));
                addToTerminal({ type: 'success', content: `Alias created: ${name} → ${command}` });
            } else {
                addToTerminal({ type: 'info', content: 'Current aliases:' });
                Object.entries(aliases).forEach(([name, cmd]) => {
                    addToTerminal({ type: 'output', content: `  ${name}='${cmd}'` });
                });
            }
            return;
        }

        if (cmd.startsWith('unalias ')) {
            const name = cmd.substring(8).trim();
            if (aliases[name]) {
                setAliases(prev => {
                    const newAliases = { ...prev };
                    delete newAliases[name];
                    return newAliases;
                });
                addToTerminal({ type: 'success', content: `Alias removed: ${name}` });
            } else {
                addToTerminal({ type: 'error', content: `No such alias: ${name}` });
            }
            return;
        }

        if (cmd === 'ps') {
            const running = Object.values(processes).filter(p => p.status === 'running');
            if (running.length === 0) {
                addToTerminal({ type: 'info', content: 'No running processes' });
            } else {
                addToTerminal({ type: 'info', content: `Running processes (${running.length}):` });
                running.forEach(p => {
                    const duration = ((Date.now() - p.startTime) / 1000).toFixed(0);
                    addToTerminal({ 
                        type: 'info', 
                        content: `  [${p.pid}] ${p.command} ${p.isBackground ? '(bg)' : '(fg)'} - ${duration}s` 
                    });
                });
                addToTerminal({ type: 'help', content: `\nTip: Click the process indicator in the header or use 'kill <pid>' to stop a process` });
            }
            return;
        }

        if (cmd.startsWith('kill ')) {
            const pid = cmd.split(' ')[1];
            killProcess(parseInt(pid));
            return;
        }

        if (cmd.startsWith('bg ')) {
            runProcessAndHandleOutput(cmd.substring(3), true);
            return;
        }

        if (cmd.startsWith('fg ')) {
            runProcessAndHandleOutput(cmd.substring(3), false);
            return;
        }

        // Check for interactive commands without arguments
        const interactiveCommands = ['python', 'python3', 'node', 'irb', 'ruby', 'php', 'lua', 'perl', 'bash', 'zsh', 'sh'];
        const cmdParts = cmd.trim().split(/\s+/);
        const baseCommand = cmdParts[0];
        
        if (interactiveCommands.includes(baseCommand) && cmdParts.length === 1) {
            addToTerminal({ type: 'error', content: `Interactive ${baseCommand} REPL not supported in this terminal` });
            addToTerminal({ type: 'help', content: `Tip: Use '${baseCommand} -c "your code"' for one-liners` });
            addToTerminal({ type: 'help', content: `Examples:` });
            if (baseCommand.includes('python')) {
                addToTerminal({ type: 'help', content: `  ${baseCommand} -c "print(3*3)"` });
                addToTerminal({ type: 'help', content: `  ${baseCommand} -c "import sys; print(sys.version)"` });
            } else if (baseCommand === 'node') {
                addToTerminal({ type: 'help', content: `  ${baseCommand} -e "console.log(3*3)"` });
                addToTerminal({ type: 'help', content: `  ${baseCommand} -p "3*3"` });
            } else {
                addToTerminal({ type: 'help', content: `  ${baseCommand} -c "echo 'hello'"` });
            }
            return;
        }

        // Regular command execution (auto-detect background)
        runProcessAndHandleOutput(cmd, null);
    }, [processes, addToTerminal, runProcessAndHandleOutput, aliases, commandHistory, currentDir, envVars, killProcess]);

    // Keep handleCommand ref updated
    useEffect(() => {
        handleCommandRef.current = handleCommand;
    }, [handleCommand]);

    const handleKeyDown = useCallback((e) => {
        // Ctrl+C - Interrupt active process
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            if (activeProcessRef.current && processes[activeProcessRef.current]) {
                killProcess(activeProcessRef.current);
                addToTerminal({ type: 'info', content: '^C' });
            } else if (command) {
                setCommand('');
                addToTerminal({ type: 'info', content: '^C' });
            }
            return;
        }

        // Ctrl+L - Clear screen
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            setTerminalHistory([]);
            return;
        }

        // Ctrl+D - Exit (if empty command)
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            if (!command) {
                setIsFullTab(false);
            }
            return;
        }

        // Tab - Autocomplete
        if (e.key === 'Tab') {
            e.preventDefault();
            if (suggestions.length > 0) {
                const suggestion = suggestions[selectedSuggestion];
                const words = command.split(' ');
                words[words.length - 1] = suggestion;
                setCommand(words.join(' ') + ' ');
                setSuggestions([]);
            }
            return;
        }

        // Enter - Execute command
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                // Shift+Enter for multiline (future feature)
                setCommand(command + '\n');
            } else {
                if (handleCommandRef.current) {
                    handleCommandRef.current(command);
                }
                setCommand('');
                setSuggestions([]);
            }
            return;
        }

        // Arrow Up - Previous command
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (suggestions.length > 0) {
                setSelectedSuggestion(prev => Math.max(0, prev - 1));
            } else if (commandHistory.length > 0) {
                const newIndex = historyIndex === -1 
                    ? commandHistory.length - 1 
                    : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setCommand(commandHistory[newIndex]);
            }
            return;
        }

        // Arrow Down - Next command
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (suggestions.length > 0) {
                setSelectedSuggestion(prev => Math.min(suggestions.length - 1, prev + 1));
            } else if (historyIndex !== -1) {
                const newIndex = historyIndex + 1;
                if (newIndex >= commandHistory.length) {
                    setHistoryIndex(-1);
                    setCommand('');
                } else {
                    setHistoryIndex(newIndex);
                    setCommand(commandHistory[newIndex]);
                }
            }
            return;
        }

        // Escape - Clear suggestions
        if (e.key === 'Escape') {
            e.preventDefault();
            setSuggestions([]);
            setSelectedSuggestion(0);
            return;
        }
    }, [command, commandHistory, historyIndex, handleCommand, suggestions, selectedSuggestion, activeProcessRef, processes, killProcess, addToTerminal]);

    useEffect(() => {
        window.startSystemProcess = (cmd) => {
            if (cmd && typeof cmd === 'string' && handleCommandRef.current) {
                handleCommandRef.current(cmd);
            }
        };
        console.log("Process Manager: 'startSystemProcess' is now available on the window object.");
        return () => {
            delete window.startSystemProcess;
            console.log("Process Manager: Cleaned up 'startSystemProcess' from the window object.");
        };
    }, []); // Empty deps - only run once

    const registerObsidianCommand = useCallback(() => {
        const datacorePlugin = dc.app.plugins.plugins.datacore;
        if (!datacorePlugin) { console.warn("Datacore plugin not found, cannot register command."); return; }
        const commandId = 'process-manager-start-new-process';
        if (dc.app.commands.commands[commandId]) return;
        datacorePlugin.addCommand({
            id: commandId,
            name: 'Datacore Terminal: Focus terminal',
            callback: () => {
                setIsFullTab(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            },
        });
    }, []);

    useEffect(() => { registerObsidianCommand(); }, [registerObsidianCommand]);

    // --- Full-Tab Mode Effect ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (isFullTab) {
            if (!container.parentNode) {
                setTimeout(() => setIsFullTab(true), 50);
                return;
            }
            const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
            if (!targetPaneContent) {
                setIsFullTab(false);
                return;
            }
            const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;
            stateRefs.originalParent = container.parentNode;
            stateRefs.placeholder = document.createElement('div');
            stateRefs.placeholder.style.display = 'none';
            container.parentNode.insertBefore(stateRefs.placeholder, container);
            const computedParentPosition = window.getComputedStyle(contentWrapper).position;
            stateRefs.parentPositionInfo = {
                element: contentWrapper,
                originalInlinePosition: contentWrapper.style.position
            };
            if (computedParentPosition === 'static') {
                contentWrapper.style.position = "relative";
            }
            contentWrapper.appendChild(container);
            Object.assign(container.style, {
                position: "absolute",
                top: "0px",
                left: "0px",
                width: "100%",
                height: "100%",
                zIndex: "9998",
                overflow: "auto"
            });
        }
        return () => {
            if (!stateRefs.originalParent) return;
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
            } else {
                stateRefs.originalParent.appendChild(container);
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || '';
            }
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach(key => stateRefs[key] = null);
        };
    }, [isFullTab]);

    // --- Cleanup all processes on component unmount ---
    useEffect(() => {
        return () => {
            // Kill all running processes when component unmounts
            const currentProcesses = processesRef.current;
            const runningProcesses = Object.values(currentProcesses).filter(p => p.status === 'running');
            
            if (runningProcesses.length > 0) {
                console.log(`[Terminal Cleanup] Killing ${runningProcesses.length} running processes...`);
                
                runningProcesses.forEach(proc => {
                    if (proc.child && proc.child.pid) {
                        try {
                            console.log(`[Terminal Cleanup] Killing process ${proc.pid}: ${proc.command}`);
                            process.kill(-proc.child.pid, 'SIGTERM');
                            setTimeout(() => {
                                try {
                                    process.kill(-proc.child.pid, 'SIGKILL');
                                } catch (e) {
                                    // Process already dead
                                }
                            }, 500);
                        } catch (err) {
                            console.warn(`[Terminal Cleanup] Failed to kill process ${proc.pid}:`, err);
                        }
                    }
                });
                
                console.log('[Terminal Cleanup] All processes terminated');
            }
        };
    }, []); // Empty deps - cleanup function uses ref which always has latest value

    // --- Component Styles ---
    const styles = {
        hoverEffectStyle: `.${uniqueWrapperClass}:hover .subtle-icon { opacity: 0.7; transform: scale(1); }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,
        fullTabWrapper: { 
            position: 'relative', 
            height: "100%", 
            width: "100%", 
            boxSizing: "border-box", 
            display: "flex", 
            flexDirection: "column",
            backgroundColor: "#0A0A0A",
            color: "#FFFFFF",
            overflow: "hidden"
        },
        exitIcon: { 
            position: "absolute", 
            top: "12px", 
            right: "16px", 
            fontFamily: "monospace", 
            fontSize: "16px", 
            color: "#666", 
            userSelect: "none", 
            cursor: "pointer", 
            opacity: 0, 
            transform: "scale(0.9)", 
            transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out, color 0.2s", 
            zIndex: 10,
            padding: "4px 8px",
            borderRadius: "4px"
        },
        compactWrapper: { 
            padding: "16px", 
            boxSizing: "border-box", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "12px", 
            border: "1px dashed #333", 
            borderRadius: "8px", 
            backgroundColor: "#0A0A0A" 
        },
        compactText: { 
            margin: 0, 
            color: "#999", 
            fontSize: "14px" 
        },
        buttonGroup: { 
            display: "flex", 
            gap: "10px" 
        },
        compactButton: {
            padding: '8px 16px',
            border: '1px solid #333',
            borderRadius: '6px',
            backgroundColor: '#121212',
            color: '#FFFFFF',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s',
            fontFamily: FONT_SETTINGS.fontFamily
        },
        terminalHeader: {
            padding: '12px 16px',
            backgroundColor: '#000000',
            borderBottom: '1px solid #1A1A1A',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
        },
        terminalTitle: {
            fontSize: '13px',
            fontWeight: '600',
            color: '#9370DB',
            fontFamily: FONT_SETTINGS.fontFamily,
            margin: 0
        },
        terminalBody: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#0A0A0A'
        },
        terminalOutput: {
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            fontFamily: FONT_SETTINGS.fontFamily,
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#F8F8F2'
        },
        terminalLine: {
            marginBottom: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
        },
        terminalLineCommand: {
            color: '#8BE9FD',
            fontWeight: '500',
            display: 'flex',
            gap: '8px'
        },
        terminalLineOutput: {
            color: '#F8F8F2',
            paddingLeft: '4px'
        },
        terminalLineError: {
            color: '#FF5555',
            paddingLeft: '4px'
        },
        terminalLineSuccess: {
            color: '#50FA7B',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        terminalLineInfo: {
            color: '#F1FA8C',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        terminalLineSystem: {
            color: '#9370DB',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        terminalLineHelp: {
            color: '#BD93F9',
            whiteSpace: 'pre',
            fontFamily: FONT_SETTINGS.fontFamily
        },
        terminalInputWrapper: {
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#000000',
            borderTop: '1px solid #1A1A1A',
            gap: '8px',
            flexShrink: 0
        },
        terminalPrompt: {
            color: '#50FA7B',
            fontFamily: FONT_SETTINGS.fontFamily,
            fontSize: '13px',
            fontWeight: '600',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        promptPath: {
            color: '#8BE9FD',
            fontSize: '11px',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        terminalInput: {
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#F8F8F2',
            fontFamily: FONT_SETTINGS.fontFamily,
            fontSize: '13px',
            padding: '4px 0',
            boxSizing: 'border-box'
        },
        suggestionsContainer: {
            position: 'absolute',
            bottom: '100%',
            left: '0',
            right: '0',
            backgroundColor: '#121212',
            border: '1px solid #9370DB',
            borderRadius: '4px 4px 0 0',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000
        },
        suggestionItem: {
            padding: '6px 12px',
            fontSize: '12px',
            color: '#F8F8F2',
            cursor: 'pointer',
            fontFamily: FONT_SETTINGS.fontFamily,
            transition: 'background-color 0.1s'
        },
        suggestionItemSelected: {
            backgroundColor: '#9370DB',
            color: '#000'
        },
        statusBar: {
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            fontSize: '10px',
            color: '#666',
            flexShrink: 0
        },
        statusItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        processingIndicator: {
            color: '#F1FA8C',
            animation: 'pulse 1.5s ease-in-out infinite'
        },
        processIndicator: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#666',
            flexShrink: 0
        },
        processCount: {
            backgroundColor: '#9370DB',
            color: '#000',
            padding: '2px 6px',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '10px'
        },
        uriButton: {
            marginLeft: 'auto',
            padding: '4px 12px',
            backgroundColor: 'transparent',
            border: '1px solid #333',
            borderRadius: '4px',
            color: '#9370DB',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: FONT_SETTINGS.fontFamily
        },
        uriInfoPanel: {
            backgroundColor: '#121212',
            border: '1px solid #1A1A1A',
            borderRadius: '6px',
            padding: '16px',
            margin: '12px 16px',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#999',
            fontFamily: FONT_SETTINGS.fontFamily
        },
        uriInfoTitle: {
            color: '#9370DB',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '12px',
            marginTop: 0
        },
        uriCode: {
            backgroundColor: '#0A0A0A',
            border: '1px solid #1A1A1A',
            padding: '8px 12px',
            borderRadius: '4px',
            color: '#8BE9FD',
            fontSize: '11px',
            display: 'block',
            marginTop: '8px',
            marginBottom: '8px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontFamily: FONT_SETTINGS.fontFamily
        },
        uriWarning: {
            color: '#FF5555',
            fontWeight: '600',
            marginTop: '12px'
        },
        processPanel: {
            backgroundColor: '#121212',
            border: '1px solid #1A1A1A',
            borderRadius: '6px',
            padding: '16px',
            margin: '12px 16px',
            fontSize: '12px',
            color: '#999',
            fontFamily: FONT_SETTINGS.fontFamily,
            maxHeight: '300px',
            overflowY: 'auto'
        },
        processPanelTitle: {
            color: '#50FA7B',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '12px',
            marginTop: 0
        },
        processItem: {
            backgroundColor: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '4px',
            padding: '10px 12px',
            marginBottom: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
        },
        processItemHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px'
        },
        processCommand: {
            color: '#8BE9FD',
            fontSize: '12px',
            fontWeight: '500',
            flex: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        processMeta: {
            color: '#666',
            fontSize: '10px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
        },
        processKillBtn: {
            padding: '4px 10px',
            backgroundColor: '#FF5555',
            border: 'none',
            borderRadius: '4px',
            color: '#000',
            fontSize: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0
        },
        processOutput: {
            backgroundColor: '#000000',
            border: '1px solid #1A1A1A',
            borderRadius: '3px',
            padding: '6px 8px',
            fontSize: '10px',
            color: '#F8F8F2',
            maxHeight: '100px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontFamily: FONT_SETTINGS.fontFamily,
            lineHeight: '1.4',
            marginTop: '4px'
        },
        emptyState: {
            textAlign: 'center',
            color: '#666',
            fontStyle: 'italic',
            padding: '20px'
        }
    };

    // --- Full-Tab Mode Handlers ---
    const handleExitFullTab = (e) => {
        e.stopPropagation();
        
        // Kill all running processes when exiting full-tab
        const runningProcs = Object.values(processes).filter(p => p.status === 'running');
        if (runningProcs.length > 0) {
            console.log(`[Terminal] Killing ${runningProcs.length} running processes on exit...`);
            runningProcs.forEach(proc => {
                if (proc.child && proc.child.pid) {
                    try {
                        console.log(`[Terminal] Killing process ${proc.pid}: ${proc.command}`);
                        process.kill(-proc.child.pid, 'SIGTERM');
                        setTimeout(() => {
                            try {
                                process.kill(-proc.child.pid, 'SIGKILL');
                            } catch (e) {
                                // Process already dead
                            }
                        }, 500);
                    } catch (err) {
                        console.warn(`[Terminal] Failed to kill process ${proc.pid}:`, err);
                    }
                }
            });
            showNotice(`Stopped ${runningProcs.length} running process${runningProcs.length > 1 ? 'es' : ''}`);
        }
        
        setIsFullTab(false);
    };
    const handleEnterFullTab = () => setIsFullTab(true);

    // Hide status bar when in full-tab mode
    useEffect(() => {
        if (!isFullTab) return;
        
        const statusBar = document.querySelector('body > .app-container .status-bar');
        if (statusBar) {
            const originalDisplay = statusBar.style.display;
            statusBar.style.display = 'none';
            
            return () => {
                const statusBarToRestore = document.querySelector('body > .app-container .status-bar');
                if (statusBarToRestore) {
                    statusBarToRestore.style.display = originalDisplay;
                }
            };
        }
    }, [isFullTab]);

    // Get running processes count
    const runningProcesses = Object.values(processes).filter(p => p.status === 'running');

    // Render terminal output grouped by execution
    const renderTerminalOutput = () => {
        const groups = [];
        let currentGroup = null;

        terminalHistory.forEach((entry, index) => {
            if (entry.type === 'command') {
                // Start new execution group
                if (currentGroup) groups.push(currentGroup);
                currentGroup = {
                    command: entry.content,
                    cwd: entry.cwd,
                    background: entry.background,
                    pid: entry.pid,
                    output: [],
                    exitCode: null,
                    duration: null
                };
            } else if (entry.pid) {
                // Entry has a PID - find the matching command group
                const targetGroup = groups.find(g => !g.standalone && g.pid === entry.pid) || 
                                   (currentGroup && currentGroup.pid === entry.pid ? currentGroup : null);
                
                if (targetGroup) {
                    // Add to the group with matching PID
                    if (entry.type === 'success' || entry.type === 'error') {
                        // Check if this is an exit message
                        const exitMatch = entry.content.match(/\[(\d+)\]\s+(Exited|Failed).*\((\d+\.?\d*)s\)/);
                        if (exitMatch) {
                            targetGroup.exitCode = exitMatch[2] === 'Exited' ? 0 : 1;
                            targetGroup.duration = parseFloat(exitMatch[3]);
                        } else {
                            targetGroup.output.push(entry);
                        }
                    } else {
                        targetGroup.output.push(entry);
                    }
                } else {
                    // No matching group found, treat as standalone
                    groups.push({ standalone: entry });
                }
            } else if (currentGroup) {
                // No PID, add to current group
                if (entry.type === 'success' || entry.type === 'error') {
                    currentGroup.output.push(entry);
                } else {
                    currentGroup.output.push(entry);
                }
            } else {
                // Standalone entry (system messages, etc.)
                groups.push({ standalone: entry });
            }
        });

        if (currentGroup) groups.push(currentGroup);

        return groups.map((group, groupIndex) => {
            if (group.standalone) {
                // Render standalone message
                const entry = group.standalone;
                const baseStyle = { ...styles.terminalLine };
                let lineStyle = {};
                let prefix = '';

                switch (entry.type) {
                    case 'system':
                        lineStyle = styles.terminalLineSystem;
                        prefix = '⚡ ';
                        break;
                    case 'info':
                        lineStyle = styles.terminalLineInfo;
                        prefix = 'ℹ ';
                        break;
                    case 'help':
                        lineStyle = styles.terminalLineHelp;
                        break;
                    default:
                        lineStyle = styles.terminalLineOutput;
                }

                return (
                    <div key={`standalone-${groupIndex}`} style={{ ...baseStyle, ...lineStyle }}>
                        {prefix}{entry.content}
                    </div>
                );
            }

            // Render execution block
            const isSuccess = group.exitCode === 0;
            const isPending = group.exitCode === null;
            const borderColor = isPending ? '#F1FA8C' : (isSuccess ? '#50FA7B' : '#FF5555');
            const statusText = isPending ? 'Running' : (isSuccess ? 'Success' : 'Failed');
            const isCollapsed = collapsedOutputs[groupIndex] || false;
            
            // Collect all output text for copy
            const outputText = group.output.map(e => e.content).join('\n');

            return (
                <div 
                    key={`exec-${groupIndex}`}
                    style={{
                        backgroundColor: '#0A0A0A',
                        border: `2px solid ${borderColor}`,
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '12px',
                        fontFamily: FONT_SETTINGS.fontFamily
                    }}
                >
                    {/* Command header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            {/* Collapse/Expand toggle - only for background/running processes with output */}
                            {group.output.length > 0 && (group.background || isPending) && (
                                <button
                                    onClick={() => setCollapsedOutputs(prev => ({ ...prev, [groupIndex]: !prev[groupIndex] }))}
                                    style={{
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#666',
                                        fontSize: '14px',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.color = '#8BE9FD'}
                                    onMouseLeave={(e) => e.target.style.color = '#666'}
                                    title={isCollapsed ? 'Show logs' : 'Hide logs'}
                                >
                                    <dc.Icon icon={isCollapsed ? 'chevron-right' : 'chevron-down'} />
                                </button>
                            )}
                            <dc.Icon 
                                icon={isPending ? 'loader' : (isSuccess ? 'check-circle' : 'x-circle')} 
                                style={{ 
                                    fontSize: '14px', 
                                    color: borderColor,
                                    animation: isPending ? 'spin 1s linear infinite' : 'none'
                                }} 
                            />
                            <span style={{ color: '#8BE9FD', fontSize: '13px', fontWeight: 'bold' }}>
                                {group.cwd ? group.cwd.replace(vaultPath, '~') : '~'} ❯
                            </span>
                            <span style={{ color: '#F8F8F2', fontSize: '13px', userSelect: 'text' }}>{group.command}</span>
                            {group.background && (
                                <span style={{ color: '#9370DB', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <dc.Icon icon="layers" style={{ fontSize: '10px' }} />
                                    bg
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                            {group.pid && (
                                <span style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <dc.Icon icon="hash" style={{ fontSize: '10px' }} />
                                    {group.pid}
                                </span>
                            )}
                            <span style={{ 
                                color: borderColor,
                                fontWeight: 'bold',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                backgroundColor: isPending ? 'rgba(241, 250, 140, 0.1)' : 
                                                isSuccess ? 'rgba(80, 250, 123, 0.1)' : 
                                                'rgba(255, 85, 85, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {statusText}
                            </span>
                            {group.duration && (
                                <span style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <dc.Icon icon="clock" style={{ fontSize: '10px' }} />
                                    {group.duration.toFixed(2)}s
                                </span>
                            )}
                            {/* Kill button for running processes */}
                            {isPending && group.pid && (
                                <button
                                    onClick={() => {
                                        killProcess(group.pid);
                                        showNotice(`Killing process [${group.pid}]...`);
                                    }}
                                    style={{
                                        backgroundColor: '#1A0A0A',
                                        border: '1px solid #FF5555',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        color: '#FF5555',
                                        fontSize: '11px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s',
                                        marginLeft: '4px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#2A1A1A';
                                        e.target.style.borderColor = '#FF7777';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#1A0A0A';
                                        e.target.style.borderColor = '#FF5555';
                                    }}
                                    title={`Kill process ${group.pid}`}
                                >
                                    <dc.Icon icon="x-circle" style={{ fontSize: '12px' }} />
                                    Kill
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Output - only use collapse for background/running processes */}
                    {((!isCollapsed && (group.background || isPending)) || (!group.background && !isPending)) && group.output.length > 0 && (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(outputText);
                                    showNotice('Output copied to clipboard!');
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    backgroundColor: '#1A1A1A',
                                    border: '1px solid #333',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    color: '#8BE9FD',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s',
                                    zIndex: 10
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#2A2A2A';
                                    e.target.style.borderColor = '#8BE9FD';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#1A1A1A';
                                    e.target.style.borderColor = '#333';
                                }}
                            >
                                <dc.Icon icon="copy" style={{ fontSize: '12px' }} />
                                Copy
                            </button>
                            <div style={{
                                backgroundColor: '#000000',
                                border: '1px solid #1A1A1A',
                                borderRadius: '4px',
                                padding: '8px',
                                paddingTop: '32px',
                                fontSize: '12px',
                                maxHeight: '400px',
                                overflowY: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                userSelect: 'text',
                                cursor: 'text'
                            }}>
                                {group.output.map((entry, i) => {
                                    const color = entry.type === 'error' ? '#FF5555' : 
                                                 entry.type === 'success' ? '#50FA7B' :
                                                 entry.type === 'info' ? '#F1FA8C' : '#F8F8F2';
                                    return (
                                        <div key={i} style={{ color, lineHeight: '1.6' }}>
                                            {entry.content}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            );
        });
    };

    // --- JSX for Rendering ---
    return (
        <div ref={containerRef}>
            <style>{styles.hoverEffectStyle}</style>
            <StandaloneNotice text={notice.text} visible={notice.visible} />
            
            {!isFullTab ? (
                <div style={styles.compactWrapper}>
                    <dc.Icon icon="terminal" style={{ fontSize: '48px', color: '#8BE9FD' }} />
                    <p style={styles.compactText}>Datacore Terminal - Compact Mode</p>
                    <div style={styles.buttonGroup}>
                        <button style={{...styles.compactButton, display: 'flex', alignItems: 'center', gap: '8px'}} onClick={handleEnterFullTab}>
                            <dc.Icon icon="maximize-2" style={{ fontSize: '14px' }} />
                            Enter Full Tab
                        </button>
                    </div>
                </div>
            ) : (
                <div style={styles.fullTabWrapper} className={uniqueWrapperClass}>
                    {/* Terminal Header */}
                    <div style={styles.terminalHeader}>
                        <h3 style={styles.terminalTitle}>
                            <dc.Icon icon="terminal" style={{ fontSize: '20px', marginRight: '8px', verticalAlign: 'middle' }} />
                            DATACORE TERMINAL v2.0
                        </h3>
                        {runningProcesses.length > 0 && (
                            <div 
                                style={{...styles.processIndicator, cursor: 'pointer', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px'}}
                                onClick={() => setShowProcessPanel(!showProcessPanel)}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#9370DB'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                                title="Click to manage processes"
                            >
                                <dc.Icon icon="activity" style={{ fontSize: '14px' }} />
                                <span style={styles.processCount}>{runningProcesses.length}</span>
                                <span>running</span>
                            </div>
                        )}
                        <button 
                            style={{...styles.uriButton, marginLeft: runningProcesses.length === 0 ? 'auto' : '12px', display: 'flex', alignItems: 'center', gap: '6px'}}
                            onClick={() => {
                                setShowUriInfo(!showUriInfo);
                                if (showProcessPanel) setShowProcessPanel(false);
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#1A1A1A';
                                e.target.style.borderColor = '#9370DB';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.borderColor = '#333';
                            }}
                        >
                            <dc.Icon icon={showUriInfo ? 'x' : 'info'} style={{ fontSize: '12px' }} />
                            {showUriInfo ? 'Close' : 'URI Info'}
                        </button>
                        <button 
                            style={{
                                ...styles.uriButton, 
                                marginLeft: '8px',
                                padding: '6px 8px',
                                minWidth: 'auto'
                            }}
                            onClick={handleExitFullTab}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#1A1A1A';
                                e.target.style.borderColor = '#FF5555';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.borderColor = '#333';
                            }}
                            title="Exit Full Tab"
                        >
                            <dc.Icon icon="minimize-2" style={{ fontSize: '14px' }} />
                        </button>
                    </div>

                    {/* Process Management Panel */}
                    {showProcessPanel && (
                        <div style={styles.processPanel}>
                            <h4 style={styles.processPanelTitle}>Running Processes ({runningProcesses.length})</h4>
                            {runningProcesses.length === 0 ? (
                                <div style={styles.emptyState}>No running processes</div>
                            ) : (
                                runningProcesses.map(p => {
                                    const duration = ((Date.now() - p.startTime) / 1000).toFixed(0);
                                    const lastOutput = p.output.split('\n').filter(line => line.trim()).slice(-3).join('\n');
                                    
                                    return (
                                        <div key={p.pid} style={styles.processItem}>
                                            <div style={styles.processItemHeader}>
                                                <span style={styles.processCommand} title={p.command}>{p.command}</span>
                                                <button 
                                                    style={styles.processKillBtn}
                                                    onClick={() => {
                                                        killProcess(p.pid);
                                                        // Auto-close panel if no more processes
                                                        setTimeout(() => {
                                                            const remaining = Object.values(processes).filter(pr => pr.status === 'running');
                                                            if (remaining.length <= 1) setShowProcessPanel(false);
                                                        }, 100);
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#FF6B6B'}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#FF5555'}
                                                >
                                                    KILL
                                                </button>
                                            </div>
                                            <div style={styles.processMeta}>
                                                <span>PID: {p.pid}</span>
                                                <span>•</span>
                                                <span>{p.isBackground ? 'Background' : 'Foreground'}</span>
                                                <span>•</span>
                                                <span>{duration}s</span>
                                            </div>
                                            {lastOutput && (
                                                <div style={styles.processOutput}>{lastOutput}</div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* URI Info Panel */}
                    {showUriInfo && !showProcessPanel && (
                        <div style={styles.uriInfoPanel}>
                            <h4 style={styles.uriInfoTitle}>URI Automation</h4>
                            <p>Execute commands remotely using Obsidian URIs. Requires the Advanced URI plugin with 'Allow eval' enabled.</p>
                            
                            <strong style={{color: '#F8F8F2', display: 'block', marginTop: '12px', marginBottom: '4px'}}>Example:</strong>
                            <code style={styles.uriCode}>obsidian://advanced-uri?vault=YOUR_VAULT&eval=window.startSystemProcess('ls%20-la')</code>
                            
                            <p style={{marginTop: '8px', marginBottom: '4px'}}>
                                <strong style={{color: '#F8F8F2'}}>Note:</strong> URL encode your commands (space = <code style={{...styles.uriCode, display: 'inline', padding: '2px 6px'}}>%20</code>)
                            </p>
                            
                            <p style={styles.uriWarning}>
                                ⚠️ Security Warning: Only run URIs from trusted sources.
                            </p>
                        </div>
                    )}

                    {/* Terminal Body */}
                    <div style={styles.terminalBody}>
                        {/* Terminal Output Area */}
                        <div style={styles.terminalOutput}>
                            {renderTerminalOutput()}
                            <div ref={terminalEndRef} />
                        </div>

                        {/* Terminal Input */}
                        <div style={styles.terminalInputWrapper}>
                            <div style={styles.terminalPrompt}>
                                <span>❯</span>
                                <span style={styles.promptPath} title={currentDir}>
                                    {currentDir.replace(vaultPath, '~')}
                                </span>
                            </div>
                            
                            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                                {/* Autocomplete Suggestions */}
                                {suggestions.length > 0 && (
                                    <div style={styles.suggestionsContainer}>
                                        {suggestions.map((suggestion, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    ...styles.suggestionItem,
                                                    ...(idx === selectedSuggestion ? styles.suggestionItemSelected : {})
                                                }}
                                                onClick={() => {
                                                    const words = command.split(' ');
                                                    words[words.length - 1] = suggestion;
                                                    setCommand(words.join(' ') + ' ');
                                                    setSuggestions([]);
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (idx !== selectedSuggestion) {
                                                        e.target.style.backgroundColor = '#1A1A1A';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (idx !== selectedSuggestion) {
                                                        e.target.style.backgroundColor = 'transparent';
                                                    }
                                                }}
                                            >
                                                {suggestion}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <input
                                    ref={inputRef}
                                    type="text"
                                    style={styles.terminalInput}
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isProcessing ? "Process running in background... (type new commands or Ctrl+C)" : "Type command or 'help'..."}
                                    autoFocus
                                />
                            </div>
                            
                            <div style={styles.statusBar}>
                                {isProcessing && (
                                    <div style={{...styles.statusItem, ...styles.processingIndicator}}>
                                        <span>⚡</span>
                                        <span>FG</span>
                                    </div>
                                )}
                                <div style={styles.statusItem}>
                                    <span>{commandHistory.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Export the component for Datacore ---
return { View: ProcessManager_Standalone };
```


