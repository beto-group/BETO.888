

# ViewComponent

```jsx

const { useState, useEffect, useRef, useCallback } = dc;


// --- NODE.JS CORE MODULES ---
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// --- UTILITY FUNCTIONS for Full Tab Mode ---
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

// --- FILE EXPLORER COMPONENTS (Adapted from PluginDevSuite) ---
function FileExplorerItem({ item, depth, onItemSelect, selectedItem }) {
    const [isOpen, setIsOpen] = useState(depth < 1); // Expand the root by default
    const [children, setChildren] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const isFolder = item.isFolder;
    const isSelected = selectedItem && selectedItem.path === item.path;

    const loadChildren = async () => {
        if (!isFolder || children.length > 0) return;
        setIsLoading(true);
        try {
            const listResult = await dc.app.vault.adapter.list(item.path);
            const folderNodes = listResult.folders.map(p => ({ name: path.basename(p), path: p, isFolder: true }));
            const fileNodes = listResult.files.map(p => ({ name: path.basename(p), path: p, isFolder: false }));
            const allNodes = [...folderNodes, ...fileNodes].sort((a, b) => {
                if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            setChildren(allNodes);
        } catch (e) { console.error(`[FileExplorer] Failed to load children for ${item.path}:`, e); }
        finally { setIsLoading(false); }
    };

    // --- FIX: Automatically load children if the component starts in an open state ---
    useEffect(() => {
        if (isFolder && isOpen) {
            loadChildren();
        }
    }, [isOpen]); // Re-run if isOpen changes programmatically, but will trigger on mount for the root

    const handleExpandToggle = (e) => {
        e.stopPropagation();
        if (isFolder) setIsOpen(prev => !prev);
    };

    const handleSelect = () => {
        onItemSelect(item);
        if (isFolder) {
            setIsOpen(prev => !prev);
        }
    };

    const itemStyle = { 
        display: 'flex', 
        alignItems: 'center', 
        padding: '6px 8px', 
        marginLeft: depth * 20 + 'px', 
        borderRadius: '4px', 
        cursor: 'pointer',
        transition: 'background-color 0.1s ease',
        backgroundColor: isSelected ? 'var(--interactive-accent)' : (isHovering ? 'var(--background-modifier-hover)' : 'transparent'),
        color: isSelected ? 'var(--text-on-accent)' : 'inherit'
    };

    const iconStyle = {
        marginRight: '8px',
        width: '18px',
        height: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isSelected ? 'var(--text-on-accent)' : 'var(--text-muted)',
    };

    const nameStyle = { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' };

    const folderIcon = isOpen ? 'folder-open' : 'folder';
    const fileIcon = 'file';
    const arrowIcon = isOpen ? 'chevron-down' : 'chevron-right';

    return (
        <div>
            <div 
                style={itemStyle} 
                title={item.path}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={handleSelect}
            >
                {isFolder && (
                    <span style={iconStyle} onClick={handleExpandToggle}>
                        <dc.Icon icon={arrowIcon} style={{ fontSize: '12px' }} />
                    </span>
                )}
                <span style={iconStyle}>
                    <dc.Icon icon={isFolder ? folderIcon : fileIcon} style={{ fontSize: '16px' }} />
                </span>
                <span style={nameStyle}>{item.name}</span>
            </div>
            {isFolder && isOpen && (
                isLoading ? <div style={{ paddingLeft: (depth + 1) * 20 + 52 + 'px', color: 'var(--text-muted)', fontSize: '12px' }}>Loading...</div> :
                children.map(child => <FileExplorerItem key={child.path} item={child} depth={depth + 1} onItemSelect={onItemSelect} selectedItem={selectedItem} />)
            )}
        </div>
    );
}

function FileExplorerView({ rootPath = '/', onItemSelect, selectedItem }) {
    const [rootItem, setRootItem] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoot = async () => {
            setError(null);
            setRootItem(null); // Reset on path change
            try {
                const exists = await dc.app.vault.adapter.exists(rootPath);
                if (!exists) {
                    setError(`Path '${rootPath}' does not exist.`);
                    return;
                }
                const stat = await dc.app.vault.adapter.stat(rootPath);
                const isFolder = stat.type === 'folder';
                if (!isFolder) {
                    setError(`Path '${rootPath}' is not a folder.`);
                    return;
                }
                const root = { name: path.basename(rootPath) || rootPath, path: rootPath, isFolder: true };
                setRootItem(root);
                // Default select the root
                if (!selectedItem) {
                    onItemSelect(root);
                }
            } catch (e) {
                console.error(`[FileExplorer] Error setting up root '${rootPath}':`, e);
                setError("Failed to initialize file explorer.");
            }
        };
        fetchRoot();
    }, [rootPath]);

    const explorerStyles = {
        wrapper: { height: "100%", width: "100%", background: 'transparent', color: 'var(--text-normal)', display: 'flex', flexDirection: 'column' },
        content: { padding: '8px', flex: 1, overflowY: 'auto' }
    };

    return (
        <div style={explorerStyles.wrapper}>
            <div style={explorerStyles.content}>
                {error && <p style={{ color: 'var(--text-error)' }}>{error}</p>}
                {rootItem ? <FileExplorerItem item={rootItem} depth={0} onItemSelect={onItemSelect} selectedItem={selectedItem} /> : <p>Loading...</p>}
            </div>
        </div>
    );
}

// --- UTILITY FUNCTIONS for Full Tab Mode ---
function debounce(func, wait) {
    let timeout;
    const debouncedFunc = function (...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
    debouncedFunc.cancel = () => {
        clearTimeout(timeout);
    };
    return debouncedFunc;
}

// --- MAIN COMPONENT ---
function OpenIDE() {
    // --- STATE MANAGEMENT ---
    const [selectedItem, setSelectedItem] = useState(null);
    const [ideCommand, setIdeCommand] = useState('');
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [promptConfig, setPromptConfig] = useState(null);
    const [promptValues, setPromptValues] = useState([]);
    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const stateRefs = {};
    const uniqueWrapperClass = "openide-wrapper-" + Math.random().toString(36).substr(2, 9);

    // --- PATH REFERENCES ---
    const vaultPath = useRef(path.normalize(dc.app.vault.adapter.getBasePath())).current;

    // --- LOCALSTORAGE HELPERS ---
    const IDE_COMMAND_KEY = 'openIde_ideCommand';
    const getIdeCommand = () => localStorage.getItem(IDE_COMMAND_KEY);
    const saveIdeCommand = (cmd) => localStorage.setItem(IDE_COMMAND_KEY, cmd);

    // --- EFFECT TO LOAD IDE COMMAND ---
    useEffect(() => {
        const cmd = getIdeCommand();
        if (cmd) setIdeCommand(cmd);
    }, []);


	
    // --- EFFECT FOR FULL TAB MODE ---
    useEffect(() => {
        const container = containerRef.current; if (!container) return;
        if (isFullTab) {
            if (!container.parentNode) { setTimeout(() => setIsFullTab(true), 50); return; }
            const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content'); if (!targetPaneContent) { setIsFullTab(false); return; }
            const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;
            
            stateRefs.originalParent = container.parentNode; stateRefs.placeholder = document.createElement('div');
            container.parentNode.insertBefore(stateRefs.placeholder, container);
            const computedParentPosition = window.getComputedStyle(contentWrapper).position;
            stateRefs.parentPositionInfo = { element: contentWrapper, originalInlinePosition: contentWrapper.style.position };
            if (computedParentPosition === 'static') { contentWrapper.style.position = "relative"; }
            contentWrapper.appendChild(container);
            Object.assign(container.style, { position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: "9998", overflowY: "hidden", backgroundColor: "var(--background-primary)" });
        }
        return () => {
            if (!stateRefs?.originalParent) return;
            if (stateRefs.placeholder?.parentNode) { stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder); } else { stateRefs.originalParent.appendChild(container); }
            if (stateRefs.parentPositionInfo?.element) { stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || ''; }
            container.removeAttribute("style");
        };
    }, [isFullTab]);

    // --- HANDLERS ---
    const handleItemSelect = (item) => {
        setSelectedItem(item);
    };

    const promptForIdeCommand = () => {
        const currentCmd = getIdeCommand() || '';
        setPromptValues([currentCmd]);
        setPromptConfig({
            title: "Configure Your Code Editor",
            description: "Enter the command to launch your preferred code editor (e.g., 'code' for VS Code, 'atom', 'subl' for Sublime, etc.).",
            inputs: [{ label: "Editor Command", placeholder: "code", value: currentCmd }],
            onSubmit: (values) => {
                const [cmd] = values;
                setIdeCommand(cmd);
                saveIdeCommand(cmd);
            }
        });
        setIsPromptOpen(true);
    };

    const handleOpenInIde = () => {
        if (!selectedItem) {
            new Notice("Please select a file or folder first.");
            return;
        }
        const cmd = getIdeCommand();
        if (!cmd) {
            promptForIdeCommand();
            return;
        }

        const fullPath = path.join(vaultPath, selectedItem.path);
        if (!fs.existsSync(fullPath)) {
            new Notice(`Path not found: ${fullPath}`, 8000);
            return;
        }

        const platform = os.platform();
        let command;
        let args;
        const isTerminalEditor = ['nvim', 'neovim', 'vim'].includes(cmd.toLowerCase());

        // --- Logic for Terminal Editors ---
        if (isTerminalEditor) {
            if (platform === 'win32') {
                command = 'cmd';
                args = ['/c', 'start', 'cmd', '/k', `${cmd} "${fullPath}"`];
            } else {
                command = '/bin/sh';
                args = ['-c', `${cmd} "${fullPath}"`];
            }
        } else {
            // --- Logic for GUI Editors ---
            const commandString = `${cmd} "${fullPath}"`;
            if (platform === 'win32') {
                command = 'cmd';
                args = ['/c', 'start', '', cmd, `"${fullPath}"`];
            } else {
                // On macOS/Linux, use login shell to inherit full PATH
                command = '/bin/sh';
                args = ['-l', '-c', commandString];
            }
        }

        // --- Spawn options ---
        const options = {
            detached: !isTerminalEditor,
            stdio: 'ignore',
            shell: platform === 'win32' || isTerminalEditor, // false for macOS GUI
        };

        new Notice(`Opening ${selectedItem.path} in ${cmd}...`, 3000);
        console.log('[OpenIDE] Spawning with options:', { command, args, options, fullPath });

        const proc = spawn(command, args, options);

        proc.on('error', (err) => {
            console.error("[OpenIDE] Process spawn failed.", err);
            let errorMsg = `Failed to open path in ${cmd}. `;
            if (platform === 'darwin' && cmd === 'code') {
                errorMsg += 'Make sure VS Code is installed. Try installing the "code" command: Cmd+Shift+P → "Shell Command: Install \'code\' command in PATH"';
            } else {
                errorMsg += 'Check console for details.';
            }
            new Notice(errorMsg, 10000);
        });

        proc.on('close', (code) => {
            console.log('[OpenIDE] Process closed with code:', code);
        });

        proc.on('exit', (code) => {
            console.log('[OpenIDE] Process exited with code:', code);
        });

        if (!isTerminalEditor) {
            proc.unref();
        }
    };

    const handlePromptChange = (index, value) => { const newValues = [...promptValues]; newValues[index] = value; setPromptValues(newValues); };
    const handlePromptSubmit = () => { if (promptConfig?.onSubmit) promptConfig.onSubmit(promptValues); handlePromptClose(); };
    const handlePromptClose = () => { setIsPromptOpen(false); setPromptConfig(null); setPromptValues([]); };

    // --- STYLES ---
    const STYLES = {
        wrapper: { backgroundColor: 'var(--background-primary)', color: 'var(--text-normal)', fontFamily: 'var(--font-interface)', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative' },
        exitIcon: { position: "fixed", top: "15px", right: "20px", fontFamily: "monospace", fontSize: "14px", color: 'var(--text-muted)', userSelect: "none", cursor: "pointer", opacity: 0, transform: "scale(0.9)", transition: "opacity 0.2s, transform 0.2s", zIndex: 10000, backgroundColor: 'var(--background-secondary)', padding: '5px 10px', borderRadius: '4px', border: '1px solid var(--background-modifier-border)' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', paddingBottom: '16px', borderBottom: '1px solid var(--background-modifier-border)', flexShrink: 0 },
        button: { padding: '10px 18px', fontSize: '14px', fontWeight: '500', backgroundColor: 'var(--interactive-accent)', color: 'var(--text-on-accent)', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s ease, opacity 0.2s ease' },
        buttonSecondary: { backgroundColor: 'var(--background-modifier-hover)', color: 'var(--text-muted)' },
        section: { flex: 1, overflowY: 'auto', padding: '24px', paddingTop: 0, display: 'flex', flexDirection: 'row', gap: '20px', minHeight: 0 },
        explorerContainer: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background-secondary)', borderRadius: '8px', border: '1px solid var(--background-modifier-border)', padding: '16px' },
        configPanel: { width: '350px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--background-secondary)', borderRadius: '8px', border: '1px solid var(--background-modifier-border)', padding: '20px' },
        selectedFileDisplay: { padding: '16px', backgroundColor: 'var(--background-primary)', borderRadius: '8px', border: '1px solid var(--background-modifier-border)' },
        actions: { display: 'flex', flexDirection: 'column', gap: '12px' },
        ideConfig: { display: 'flex', flexDirection: 'column', gap: '8px' },
        ideDisplay: { padding: '12px', backgroundColor: 'var(--background-primary)', border: '1px solid var(--background-modifier-border)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px' },
        modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 },
        modalContent: { backgroundColor: 'var(--background-secondary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--background-modifier-border)', width: '500px', maxWidth: '90vw' },
        modalTitle: { fontSize: '1.5em', margin: 0, marginBottom: '16px' },
        input: { width: '100%', padding: '12px', boxSizing: 'border-box', backgroundColor: 'var(--background-primary)', border: '1px solid var(--background-modifier-border)', borderRadius: '6px', color: 'var(--text-normal)', marginBottom: '16px' },
        inputGroup: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }
    };

    // --- RENDER ---
    return (
        <div ref={containerRef} className={uniqueWrapperClass} style={STYLES.wrapper}>
            <div style={STYLES.exitIcon} className="openide-exit-icon" onClick={() => setIsFullTab(false)}>✕</div>
            <div style={STYLES.header}>
                <h1 style={{ margin: 0, color: 'var(--text-normal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <dc.Icon icon="code" style={{ fontSize: '24px' }} />
                    Open in IDE
                </h1>
            </div>
            <div style={STYLES.section}>
                <div style={STYLES.explorerContainer}>
                    <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <dc.Icon icon="folder" style={{ fontSize: '20px' }} />
                        File Explorer
                    </h3>
                    <FileExplorerView rootPath="/" onItemSelect={handleItemSelect} selectedItem={selectedItem} />
                </div>
                <div style={STYLES.configPanel}>
                    <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <dc.Icon icon="settings" style={{ fontSize: '20px' }} />
                        IDE Configuration
                    </h3>
                    {selectedItem && (
                        <div style={STYLES.selectedFileDisplay}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <dc.Icon icon={selectedItem.isFolder ? 'folder' : 'file'} style={{ fontSize: '16px' }} />
                                <strong>Selected {selectedItem.isFolder ? 'Folder' : 'File'}:</strong>
                            </div>
                            <code style={{ fontSize: '14px', wordBreak: 'break-all' }}>{selectedItem.path}</code>
                        </div>
                    )}
                    <div style={STYLES.ideConfig}>
                        <label style={{ fontWeight: '500', marginBottom: '4px' }}>Current IDE Command:</label>
                        <div style={STYLES.ideDisplay}>
                            {ideCommand || 'Not configured'}
                        </div>
                    </div>
                    <div style={STYLES.actions}>
                        <button style={STYLES.button} onClick={handleOpenInIde} disabled={!selectedItem}>
                            <dc.Icon icon="play" style={{ fontSize: '16px', marginRight: '8px' }} />
                            Open in IDE
                        </button>
                        <button style={STYLES.buttonSecondary} onClick={promptForIdeCommand}>
                            <dc.Icon icon="edit" style={{ fontSize: '16px', marginRight: '8px' }} />
                            Configure IDE
                        </button>
                    </div>
                </div>
            </div>
            {isPromptOpen && (
                <div style={STYLES.modalOverlay} onClick={handlePromptClose}>
                    <div style={STYLES.modalContent} onClick={e => e.stopPropagation()}>
                        <h2 style={STYLES.modalTitle}>{promptConfig.title}</h2>
                        <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>{promptConfig.description}</p>
                        <div style={STYLES.inputGroup}>
                            {promptConfig.inputs.map((input, index) => (
                                <div key={index}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{input.label}</label>
                                    <input
                                        type="text"
                                        style={STYLES.input}
                                        placeholder={input.placeholder}
                                        value={promptValues[index] || ''}
                                        onChange={(e) => handlePromptChange(index, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={handlePromptClose}>Cancel</button>
                            <button style={STYLES.button} onClick={handlePromptSubmit}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

return { View: OpenIDE };
```

