





# ViewComponent

```jsx
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- DC Command System (v5 - Correct Prefixing) ---
// This version fixes the double-prefix issue by no longer manually adding the plugin
// name to the command. Obsidian handles this automatically, resulting in a clean
// "DC Commands: <Your Command>" format in the command palette.
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const { useState, useEffect, useCallback, useRef } = dc;
const fs = require('fs');
const path = require('path');

// --- DOM Traversal Utilities ---
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

// --- Configuration ---
const PLUGIN_ID = 'dc-cmd';
const PLUGIN_NAME = 'DC Commands';

function CommandManagementSystem() {
    const [pluginExists, setPluginExists] = useState(false);
    const [commands, setCommands] = useState([]);
    const [newId, setNewId] = useState('');
    const [newName, setNewName] = useState('');
    const [newAction, setNewAction] = useState('new Notice("Hello from my DC command!");');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [isFullTab, setIsFullTab] = useState(true);
    
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;

    const vaultPath = dc.app.vault.adapter.getBasePath();
    const pluginPath = path.join(vaultPath, '.obsidian/plugins', PLUGIN_ID);
    const dataPath = path.join(pluginPath, 'data.json');

    // --- Core Logic ---

    const checkAndLoadPlugin = useCallback(async () => {
        if (fs.existsSync(pluginPath) && fs.existsSync(path.join(pluginPath, 'main.js'))) {
            setPluginExists(true);
            try {
                if (fs.existsSync(dataPath)) {
                    const fileContent = fs.readFileSync(dataPath, 'utf-8');
                    setCommands(JSON.parse(fileContent) || []);
                } else {
                    fs.writeFileSync(dataPath, '[]');
                    setCommands([]);
                }
            } catch (e) {
                setError("Error reading commands file. It might be corrupted.");
                console.error(e);
            }
        } else {
            setPluginExists(false);
        }
    }, [pluginPath, dataPath]);

    useEffect(() => {
        checkAndLoadPlugin();
    }, [checkAndLoadPlugin]);

    // Full-tab effect
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullTab) return;
        
        const targetPaneContent = findNearestAncestorWithClass(
            container,
            "workspace-leaf-content"
        );
        if (!targetPaneContent) {
            setIsFullTab(false);
            return;
        }
        
        const contentWrapper =
            findDirectChildByClass(targetPaneContent, "view-content") ||
            targetPaneContent;
        
        stateRefs.originalParent = container.parentNode;
        stateRefs.placeholder = document.createElement("div");
        stateRefs.placeholder.style.display = "none";
        container.parentNode.insertBefore(stateRefs.placeholder, container);
        
        stateRefs.parentPositionInfo = {
            element: contentWrapper,
            original: window.getComputedStyle(contentWrapper).position,
        };
        if (stateRefs.parentPositionInfo.original === "static") {
            contentWrapper.style.position = "relative";
        }
        
        contentWrapper.appendChild(container);
        Object.assign(container.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            zIndex: "9998",
            backgroundColor: "var(--background-primary)",
            overflow: "auto",
        });
        
        return () => {
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(
                    container,
                    stateRefs.placeholder
                );
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position =
                    stateRefs.parentPositionInfo.original === "static"
                        ? ""
                        : stateRefs.parentPositionInfo.original;
            }
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
        };
    }, [isFullTab]);

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

    const handleInstallPlugin = async () => {
        setStatus('Creating plugin...');
        setError('');
        try {
            fs.mkdirSync(pluginPath, { recursive: true });

            const manifest = {
                id: PLUGIN_ID,
                name: PLUGIN_NAME,
                version: "1.0.0",
                minAppVersion: "0.12.0",
                description: `Runs custom commands defined via the DC Commands manager.`,
                author: "DC",
                isDesktopOnly: false
            };
            fs.writeFileSync(path.join(pluginPath, 'manifest.json'), JSON.stringify(manifest, null, 2));

            const mainJsContent = `
const { Plugin } = require('obsidian');
const DATA_FILE = './data.json';

module.exports = class extends Plugin {
    async onload() {
        if (!await this.app.vault.adapter.exists(this.manifest.dir + '/' + DATA_FILE)) return;
        try {
            const commands = JSON.parse(await this.app.vault.adapter.read(this.manifest.dir + '/' + DATA_FILE));
            if (Array.isArray(commands)) {
                for (const command of commands) {
                    this.addCommand({
                        id: command.id,
                        name: command.name,
                        callback: () => new Function('Notice', 'dc', command.action)(Notice, window.dc)
                    });
                }
            }
        } catch(e) { console.error("${PLUGIN_NAME}: Failed to load commands.", e); }
    }
};
`;
            fs.writeFileSync(path.join(pluginPath, 'main.js'), mainJsContent.trim());
            fs.writeFileSync(dataPath, '[]');

            setStatus('Enabling plugin...');
            await dc.app.plugins.loadManifests();
            await dc.app.plugins.enablePlugin(PLUGIN_ID);

            setStatus('Installation complete!');
            new Notice(`"${PLUGIN_NAME}" plugin installed and enabled!`);
            setPluginExists(true);
        } catch (e) {
            setError(`Failed to install plugin: ${e.message}`);
            console.error(e);
        }
    };

    // --- Command Management Functions ---

    const handleCreateCommand = async () => {
        if (!newId || !newName) { setError("Command ID and Name are required."); return; }
        const finalId = `${PLUGIN_ID}:${newId.replace(/\s+/g, '-')}`;
        if (commands.some(c => c.id === finalId)) { setError("This Command ID already exists."); return; }

        // --- THE FIX ---
        // We no longer add the prefix. The `newName` is the clean name like "test1".
        // Obsidian will automatically add "DC Commands:" to it in the palette.
        const finalName = newName.trim();
        const newCommand = { id: finalId, name: finalName, action: newAction };
        // --- END FIX ---

        const updatedCommands = [...commands, newCommand];

        try {
            fs.writeFileSync(dataPath, JSON.stringify(updatedCommands, null, 2));
            setCommands(updatedCommands);

            dc.app.commands.addCommand({
                id: newCommand.id,
                name: newCommand.name,
                callback: () => new Function('Notice', 'dc', newCommand.action)(Notice, window.dc)
            });

            setNewId(''); setNewName(''); setNewAction('new Notice("Hello from my custom command!");');
            setError('');
            new Notice(`Command "${finalName}" added to DC Commands!`);
        } catch (e) {
            setError(`Failed to save command: ${e.message}`);
            console.error(e);
        }
    };

    const handleDeleteCommand = async (commandToDelete) => {
        if (!confirm(`Are you sure you want to delete the command "${commandToDelete.name}"?`)) return;
        const updatedCommands = commands.filter(c => c.id !== commandToDelete.id);
        try {
            fs.writeFileSync(dataPath, JSON.stringify(updatedCommands, null, 2));
            setCommands(updatedCommands);
            dc.app.commands.removeCommand(commandToDelete.id);
            new Notice(`Command deleted. Reload Obsidian to fully unregister.`);
        } catch (e) {
            setError(`Failed to delete command: ${e.message}`);
            console.error(e);
        }
    };

    // --- RENDER LOGIC ---

    // Compact mode
    if (!isFullTab) {
        return (
            <div ref={containerRef} style={{
                padding: "16px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                border: "1px dashed rgba(139, 92, 246, 0.2)",
                borderRadius: "8px",
                backgroundColor: "#0a0a0a",
            }}>
                <p style={{ margin: 0, color: "#888", fontSize: "14px", fontFamily: "monospace" }}>
                    Component is in compact mode.
                </p>
                <button 
                    style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                    }}
                    onClick={() => setIsFullTab(true)}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
                        e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
                        e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    }}
                >
                    <dc.Icon icon="maximize-2" style={{ fontSize: '14px' }} />
                    Enter Full Tab
                </button>
            </div>
        );
    }

    if (!pluginExists) {
        return (
            <div ref={containerRef} style={{ 
                fontFamily: 'monospace', 
                padding: '32px', 
                backgroundColor: '#000000', 
                color: '#e0e0e0', 
                borderRadius: '12px', 
                textAlign: 'center',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto',
                position: 'relative',
                boxSizing: 'border-box'
            }}>
                {/* Exit Full Tab Button */}
                <button
                    onClick={() => setIsFullTab(false)}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666',
                        fontSize: '20px',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s ease',
                        opacity: 0.6
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.color = '#8b5cf6';
                        e.target.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.color = '#666';
                        e.target.style.opacity = '0.6';
                    }}
                    title="Exit Full Tab"
                >
                    <dc.Icon icon="minimize-2" style={{ fontSize: '18px' }} />
                </button>
                <div style={{ fontSize: '48px', marginBottom: '16px', color: '#8b5cf6' }}>
                    <dc.Icon icon="terminal" />
                </div>
                <h2 style={{ marginTop: 0, color: '#ffffff', fontWeight: '600' }}>Setup DC Commands</h2>
                <p style={{ color: '#888', lineHeight: 1.6, marginBottom: '24px' }}>
                    A core plugin is needed to run your custom commands.<br />
                    This will create a new plugin called "{PLUGIN_NAME}" in your vault.
                </p>
                <button 
                    onClick={handleInstallPlugin} 
                    style={{ 
                        padding: '12px 24px', 
                        fontSize: '14px', 
                        backgroundColor: 'rgba(139, 92, 246, 0.2)', 
                        color: '#8b5cf6', 
                        border: '1px solid rgba(139, 92, 246, 0.3)', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        marginTop: '8px',
                        fontFamily: 'monospace',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
                        e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
                        e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    }}
                >
                    <dc.Icon icon="download" style={{ fontSize: '16px' }} />
                    Install Core Plugin
                </button>
                {status && (
                    <p style={{ 
                        color: '#8b5cf6', 
                        marginTop: '20px', 
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <dc.Icon icon="loader" style={{ animation: 'spin 1s linear infinite' }} />
                        {status}
                    </p>
                )}
                {error && (
                    <p style={{ 
                        color: '#ff5555', 
                        marginTop: '20px', 
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <dc.Icon icon="alert-circle" />
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ 
            fontFamily: 'monospace', 
            padding: '32px', 
            backgroundColor: '#000000', 
            color: '#e0e0e0', 
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            position: 'relative',
            boxSizing: 'border-box'
        }}>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            
            {/* Exit Full Tab Button */}
            <button
                onClick={() => setIsFullTab(false)}
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '20px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s ease',
                    opacity: 0.6
                }}
                onMouseEnter={(e) => {
                    e.target.style.color = '#8b5cf6';
                    e.target.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                    e.target.style.color = '#666';
                    e.target.style.opacity = '0.6';
                }}
                title="Exit Full Tab"
            >
                <dc.Icon icon="minimize-2" style={{ fontSize: '18px' }} />
            </button>
            
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                borderBottom: '1px solid rgba(139, 92, 246, 0.2)', 
                paddingBottom: '20px',
                marginBottom: '32px'
            }}>
                <dc.Icon icon="terminal" style={{ fontSize: '28px', color: '#8b5cf6' }} />
                <h2 style={{ margin: 0, color: '#ffffff', fontWeight: '600', fontSize: '24px' }}>
                    {PLUGIN_NAME} Manager
                </h2>
            </div>
            
            {/* Important Notice */}
            <div style={{
                display: 'flex',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                marginBottom: '24px',
                alignItems: 'flex-start'
            }}>
                <dc.Icon icon="info" style={{ fontSize: '20px', color: '#8b5cf6', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <p style={{ 
                        margin: '0 0 8px 0', 
                        color: '#ffffff', 
                        fontSize: '14px', 
                        fontWeight: '600' 
                    }}>
                        Important: Enable the DC Commands Plugin
                    </p>
                    <p style={{ 
                        margin: '0', 
                        color: '#aaa', 
                        fontSize: '13px', 
                        lineHeight: '1.5' 
                    }}>
                        Commands will work immediately after creation, but will disappear on reload if the plugin is disabled. 
                        Go to <strong style={{ color: '#8b5cf6' }}>Settings → Community Plugins</strong> and ensure 
                        "<strong style={{ color: '#8b5cf6' }}>DC Commands</strong>" is toggled ON for commands to persist across sessions.
                    </p>
                </div>
            </div>
            
            <div style={{ marginBottom: '32px' }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '16px' 
                }}>
                    <dc.Icon icon="plus-circle" style={{ color: '#8b5cf6' }} />
                    <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>Add New Command</h3>
                </div>
                <div style={{ 
                    display: 'grid', 
                    gap: '16px', 
                    backgroundColor: '#0a0a0a', 
                    padding: '20px', 
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 92, 246, 0.1)'
                }}>
                    <div>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            marginBottom: '8px', 
                            fontSize: '13px', 
                            color: '#888' 
                        }}>
                            <dc.Icon icon="hash" style={{ fontSize: '14px' }} />
                            Unique ID
                        </label>
                        <input 
                            type="text" 
                            placeholder="my-action" 
                            value={newId} 
                            onChange={e => setNewId(e.target.value)} 
                            style={{ 
                                width: '100%',
                                padding: '12px', 
                                border: '1px solid rgba(139, 92, 246, 0.2)', 
                                borderRadius: '6px',
                                backgroundColor: '#000000',
                                color: '#e0e0e0',
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}
                        />
                    </div>
                    <div>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            marginBottom: '8px', 
                            fontSize: '13px', 
                            color: '#888' 
                        }}>
                            <dc.Icon icon="type" style={{ fontSize: '14px' }} />
                            Command Name
                        </label>
                        <input 
                            type="text" 
                            placeholder="test1" 
                            value={newName} 
                            onChange={e => setNewName(e.target.value)} 
                            style={{ 
                                width: '100%',
                                padding: '12px', 
                                border: '1px solid rgba(139, 92, 246, 0.2)', 
                                borderRadius: '6px',
                                backgroundColor: '#000000',
                                color: '#e0e0e0',
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}
                        />
                    </div>
                    <div>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            marginBottom: '8px', 
                            fontSize: '13px', 
                            color: '#888' 
                        }}>
                            <dc.Icon icon="code" style={{ fontSize: '14px' }} />
                            Action Code
                        </label>
                        <textarea 
                            value={newAction} 
                            onChange={e => setNewAction(e.target.value)} 
                            rows="6" 
                            style={{ 
                                width: '100%',
                                padding: '12px', 
                                border: '1px solid rgba(139, 92, 246, 0.2)', 
                                borderRadius: '6px',
                                backgroundColor: '#000000',
                                color: '#e0e0e0',
                                fontFamily: 'monospace',
                                fontSize: '13px',
                                lineHeight: '1.5',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}
                        />
                    </div>
                    <button 
                        onClick={handleCreateCommand} 
                        style={{ 
                            padding: '12px', 
                            backgroundColor: 'rgba(139, 92, 246, 0.2)', 
                            color: '#8b5cf6', 
                            border: '1px solid rgba(139, 92, 246, 0.3)', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
                            e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
                            e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                        }}
                    >
                        <dc.Icon icon="plus" style={{ fontSize: '16px' }} />
                        Add Command
                    </button>
                    {error && (
                        <p style={{ 
                            color: '#ff5555', 
                            margin: '0', 
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px',
                            backgroundColor: 'rgba(255, 85, 85, 0.1)',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 85, 85, 0.2)'
                        }}>
                            <dc.Icon icon="alert-circle" style={{ fontSize: '16px' }} />
                            {error}
                        </p>
                    )}
                </div>
            </div>
            
            <div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '16px' 
                }}>
                    <dc.Icon icon="list" style={{ color: '#8b5cf6' }} />
                    <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>
                        Existing Commands ({commands.length})
                    </h3>
                </div>
                {commands.length > 0 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {commands.map(cmd => (
                            <div 
                                key={cmd.id} 
                                style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '16px', 
                                    backgroundColor: '#0a0a0a', 
                                    borderRadius: '8px',
                                    border: '1px solid rgba(139, 92, 246, 0.1)',
                                    transition: 'border-color 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.1)'}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px',
                                        marginBottom: '6px'
                                    }}>
                                        <dc.Icon icon="command" style={{ fontSize: '16px', color: '#8b5cf6' }} />
                                        <strong style={{ color: '#ffffff', fontSize: '15px' }}>{cmd.name}</strong>
                                    </div>
                                    <p style={{ 
                                        margin: '0', 
                                        fontSize: '12px', 
                                        color: '#666', 
                                        fontFamily: 'monospace',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <dc.Icon icon="hash" style={{ fontSize: '12px' }} />
                                        {cmd.id}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleDeleteCommand(cmd)} 
                                    style={{ 
                                        padding: '8px 16px', 
                                        backgroundColor: 'rgba(255, 85, 85, 0.1)', 
                                        color: '#ff5555', 
                                        border: '1px solid rgba(255, 85, 85, 0.2)', 
                                        borderRadius: '6px', 
                                        cursor: 'pointer',
                                        fontFamily: 'monospace',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = 'rgba(255, 85, 85, 0.2)';
                                        e.target.style.borderColor = 'rgba(255, 85, 85, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'rgba(255, 85, 85, 0.1)';
                                        e.target.style.borderColor = 'rgba(255, 85, 85, 0.2)';
                                    }}
                                >
                                    <dc.Icon icon="trash-2" style={{ fontSize: '14px' }} />
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ 
                        padding: '32px', 
                        textAlign: 'center', 
                        color: '#666',
                        backgroundColor: '#0a0a0a',
                        borderRadius: '8px',
                        border: '1px solid rgba(139, 92, 246, 0.1)'
                    }}>
                        <dc.Icon icon="inbox" style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }} />
                        <p style={{ margin: 0, fontSize: '14px' }}>No commands created yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

return { View: CommandManagementSystem };
```


