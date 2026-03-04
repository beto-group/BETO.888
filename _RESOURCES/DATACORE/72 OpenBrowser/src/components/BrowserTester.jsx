const { useState, useEffect } = dc;

function BrowserTester({ folderPath }) {
    const [url, setUrl] = useState('https://beto.group');
    const [localPath, setLocalPath] = useState('');
    const [status, setStatus] = useState('');
    const [showIframe, setShowIframe] = useState(false);

    const log = (msg) => setStatus(prev => `[${new Date().toLocaleTimeString()}] ${msg}\n${prev}`);

    // --- Helpers ---
    const executeCommand = (id) => {
        if (dc.app.commands.executeCommandById(id)) {
            log(`Executed command: ${id}`);
            return true;
        }
        log(`Command not found: ${id}`);
        return false;
    };

    // --- Discovery ---
    const discoverCommands = () => {
        log("--- DISCOVERY START ---");

        // 1. Commands
        const cmds = dc.app.commands.commands;
        const matches = Object.keys(cmds).filter(id =>
            id.includes('web') || id.includes('browser') || id.includes('surf') || id.includes('open')
        );
        log(`Commands found: ${matches.length}\n${matches.slice(0, 10).join('\n')}${matches.length > 10 ? '...' : ''}`);

        // 2. View Types
        const viewRegistry = dc.app.viewRegistry;
        let viewTypes = [];
        if (viewRegistry) {
            viewTypes = Object.keys(viewRegistry.viewByType || {});
        }
        const webViews = viewTypes.filter(t => t.includes('web') || t.includes('browser') || t.includes('surf'));
        log(`View Types found: ${webViews.length}\n${webViews.join('\n')}`);

        log("--- DISCOVERY END ---");
    };

    // --- Actions ---

    // 1. External / System
    const openSystemDefault = () => {
        log(`System Default: ${url}`);
        log("(Interception Check: If this opens internally, a plugin is catching window.open)");
        window.open(url);
    };

    const openElectronExternal = () => {
        log(`Attempting Electron Shell: ${url}`);
        try {
            // Check for node integration or global require or window.require
            let sh = null;
            if (typeof require !== 'undefined') {
                try { sh = require('electron').shell; } catch (e) { }
            }
            if (!sh && window.require) {
                try { sh = window.require('electron').shell; } catch (e) { }
            }
            // Sometimes exposed as just 'shell' or part of 'electron' global if insecure

            if (sh) {
                sh.openExternal(url);
                log("Success: Called shell.openExternal");
            } else {
                log("Error: Could not access Electron shell (require('electron') disallowed?).");
                // Try creating a fake link with specific event properties? No, usually futile.
            }
        } catch (e) {
            log(`Electron Error: ${e.message}`);
        }
    };

    // 2. Plugins (Web Viewer / Surfing)
    const openWebViewer = () => {
        // Try known IDs
        const candidates = ['web-viewer:open', 'surfing:open-web-browser', 'obsidian-web-browser:open'];
        let found = false;
        candidates.forEach(id => {
            if (dc.app.commands.executeCommandById(id)) {
                log(`Success: Executed ${id}`);
                found = true;
            }
        });
        if (!found) log("Command execution failed. Try the 'Force View' buttons below.");
    };

    const forceViewType = async (type) => {
        log(`Attempting to force view type: '${type}'`);
        try {
            // Create a new tab
            const leaf = dc.app.workspace.getLeaf('tab');
            await leaf.setViewState({
                type: type,
                active: true,
                state: { url: url }
            });
            log(`Success? Check the new tab.`);
        } catch (e) {
            log(`Error setting view type: ${e.message}`);
        }
    };

    // 3. Cheater: Embed Iframe
    const toggleIframe = () => {
        setShowIframe(!showIframe);
        log(showIframe ? "Closed Iframe" : `Embedding ${url}`);
    };

    // 3. Internal File
    const openInternalLink = async (mode = 'current') => {
        // mode: 'current' | 'tab' | 'split'
        const target = localPath;

        if (!target) {
            log("Error: No local path selected. Use 'Pick Random' or type a vault path.");
            return;
        }

        if (target.includes('://')) {
            log("Error: internal links cannot be URLs (http/app). must be vault relative path.");
            return;
        }

        log(`Internal LinkText: ${target} (${mode})`);

        try {
            // openLinkText(linktext, sourcePath, newLeafOrPaneType)
            // 'tab' | 'split' | boolean
            const leafMode = mode === 'current' ? false : mode;
            await dc.app.workspace.openLinkText(target, folderPath, leafMode);
            log('Success: openLinkText called');
        } catch (e) {
            log(`Error: ${e.message}`);
        }
    };

    const findRandomFile = () => {
        const files = dc.app.vault.getFiles().filter(f => f.extension === 'md');
        if (files.length > 0) {
            const f = files[Math.floor(Math.random() * files.length)];
            setLocalPath(f.path);
            log(`Selected: ${f.path}`);
        } else {
            log("No markdown files found in vault.");
        }
    };

    // --- UI Styles ---
    const containerStyle = {
        display: 'flex', flexDirection: 'column', gap: '24px',
        padding: '32px', maxWidth: '800px', margin: '0 auto',
        backgroundColor: '#050505', color: '#e0e0e0',
        borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.15)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', fontFamily: "'Inter', sans-serif"
    };

    const sectionStyle = {
        display: 'flex', flexDirection: 'column', gap: '16px',
        padding: '24px', backgroundColor: 'rgba(20, 20, 25, 0.5)',
        borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)'
    };

    const titleStyle = {
        fontSize: '18px', fontWeight: '600', color: '#8b5cf6',
        display: 'flex', alignItems: 'center', gap: '10px', margin: 0
    };

    const inputGroupStyle = {
        display: 'flex', gap: '12px', alignItems: 'center',
        padding: '4px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px',
        border: '1px solid rgba(139, 92, 246, 0.2)'
    };

    const inputStyle = {
        flex: 1, background: 'transparent', border: 'none', color: '#fff',
        padding: '12px', fontSize: '14px', fontFamily: 'monospace', outline: 'none'
    };

    const btnStyle = (primary = false) => ({
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 16px', borderRadius: '6px',
        border: primary ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255,255,255,0.1)',
        background: primary ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
        color: primary ? '#a78bfa' : '#a1a1aa',
        cursor: 'pointer', fontSize: '13px', fontWeight: '500',
        transition: 'all 0.2s',
        outline: 'none'
    });

    return (
        <div style={containerStyle}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <dc.Icon icon="globe" style={{ width: '32px', height: '32px', color: '#8b5cf6' }} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#fff', letterSpacing: '-0.5px' }}>Browser Command Center</h1>
                    <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>Test URL handling across internal and external contexts</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button style={btnStyle()} onClick={discoverCommands} title="List all available commands">
                        <dc.Icon icon="search" style={{ width: '16px' }} /> Discover IDs
                    </button>
                </div>
            </header>

            {/* External / Web Section */}
            <div style={sectionStyle}>
                <h3 style={titleStyle}>
                    <dc.Icon icon="globe" style={{ width: '20px' }} />
                    Web / External
                </h3>
                <div style={inputGroupStyle}>
                    <div style={{ padding: '0 12px', opacity: 0.5 }}>
                        <dc.Icon icon="link" style={{ width: '16px' }} />
                    </div>
                    <input type="text" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button style={btnStyle(true)} onClick={openSystemDefault}>
                        <dc.Icon icon="external-link" style={{ width: '16px' }} />
                        System Default
                    </button>
                    <button style={btnStyle()} onClick={openElectronExternal}>
                        <dc.Icon icon="cpu" style={{ width: '16px' }} />
                        Force External (Shell)
                    </button>
                    <button style={btnStyle()} onClick={() => forceViewType('surfing-view')}>
                        <dc.Icon icon="zap" style={{ width: '16px' }} />
                        Open in Surfing
                    </button>
                    <button style={{ ...btnStyle(), borderColor: showIframe ? '#10b981' : undefined }} onClick={toggleIframe}>
                        <dc.Icon icon="layout" style={{ width: '16px' }} />
                        {showIframe ? "Close Embed" : "Embed (Iframe)"}
                    </button>
                </div>

                {/* Embed Area */}
                {showIframe && (
                    <div style={{ marginTop: '16px', height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                        <iframe src={url} style={{ width: '100%', height: '100%', border: 'none', background: '#FFF' }} />
                    </div>
                )}
            </div>

            {/* Internal / File Section */}
            <div style={sectionStyle}>
                <h3 style={titleStyle}>
                    <dc.Icon icon="file-text" style={{ width: '20px' }} />
                    Internal Vault
                </h3>
                <div style={inputGroupStyle}>
                    <div style={{ padding: '0 12px', opacity: 0.5 }}>
                        <dc.Icon icon="hard-drive" style={{ width: '16px' }} />
                    </div>
                    <input type="text" value={localPath} onChange={e => setLocalPath(e.target.value)} placeholder="path/to/file.md" style={inputStyle} />
                    <button onClick={findRandomFile} style={{ ...btnStyle(), border: 'none', background: 'transparent', color: '#8b5cf6' }} title="Pick Random">
                        <dc.Icon icon="dices" style={{ width: '18px' }} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button style={btnStyle(true)} onClick={() => openInternalLink('current')}>
                        <dc.Icon icon="arrow-right-circle" style={{ width: '16px' }} />
                        Open (Current)
                    </button>
                    <button style={btnStyle()} onClick={() => openInternalLink('tab')}>
                        <dc.Icon icon="plus-square" style={{ width: '16px' }} />
                        New Tab
                    </button>
                    <button style={btnStyle()} onClick={() => openInternalLink('split')}>
                        <dc.Icon icon="columns" style={{ width: '16px' }} />
                        Split View
                    </button>
                </div>
            </div>

            {/* Logs */}
            <div style={{ ...sectionStyle, maxHeight: '200px', overflow: 'hidden', gap: '8px', padding: '16px', background: '#000' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#444', textTransform: 'uppercase' }}>Console Log</span>
                    <dc.Icon icon="terminal" style={{ width: '14px', color: '#333' }} />
                </div>
                <pre style={{
                    margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace',
                    fontSize: '11px', color: '#666', flex: 1, overflow: 'auto'
                }}>
                    {status || 'Waiting for interactions...'}
                </pre>
            </div>
        </div>
    );
}

return { BrowserTester };
