/**
 * Universal Storage Showcase - Modular UI
 */

function MainComponent({ folderPath, containerRef, ControlsMenu, isTelegramEnabled, toggleTelegram }) {
    const { useState, useEffect, useRef } = dc;
    const [activeTab, setActiveTab] = useState('files');
    const [logs, setLogs] = useState([]);
    const [storageApi, setStorageApi] = useState(null);
    const [fsFilename, setFsFilename] = useState('test_fs.txt');
    const [vaultFilename, setVaultFilename] = useState('test_vault.txt');
    const [payload, setPayload] = useState('BetoOS Core Identity Data');
    const [systemCommand, setSystemCommand] = useState('sw_vers && uptime');

    // Path Logic
    const absPath = useRef(null);
    if (!absPath.current) {
        const basePath = dc.app.vault.adapter.basePath;
        const path = require('path');
        absPath.current = path.join(basePath, folderPath);
    }
    const absolutePath = absPath.current;

    // Load Utilities
    useEffect(() => {
        const loadUtils = async () => {
            try {
                const { loadStorage } = await dc.require(folderPath + '/src/utils/storageUtils.js');
                const api = await loadStorage(folderPath);
                setStorageApi(api);
                addLog("Universal Storage Engine v3.0 (Modular) loaded.");
            } catch (e) {
                addLog("Error loading modular utilities: " + e.message, 'error');
            }
        };
        loadUtils();
    }, []);

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
    };

    const TABS = [
        { id: 'files', icon: 'file', label: 'Files' },
        { id: 'database', icon: 'database', label: 'Database' },
        { id: 'system', icon: 'terminal', label: 'System' },
        { id: 'web', icon: 'globe', label: 'Web' },
        { id: 'secure', icon: 'lock', label: 'Secure' },
        { id: 'sync', icon: 'refresh-ccw', label: 'Sync' }
    ];

    const styles = {
        container: { display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' },
        header: { padding: '20px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        tabs: { display: 'flex', gap: '5px', padding: '10px 20px', background: '#111', borderBottom: '1px solid #1a1a1a', overflowX: 'auto' },
        tab: (active) => ({
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            background: active ? '#8b5cf6' : 'transparent', color: active ? 'white' : '#888',
            transition: 'all 0.2s', border: 'none', fontSize: '13px', whiteSpace: 'nowrap'
        }),
        content: { flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', gap: '20px' },
        demoArea: { flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' },
        sidebar: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', minWidth: '250px' },
        card: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' },
        title: { margin: '0 0 10px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px' },
        desc: { fontSize: '12px', color: '#888', marginBottom: '15px' },
        descBox: { fontSize: '11px', color: '#999', marginBottom: '15px', lineHeight: '1.6', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', borderLeft: '2px solid rgba(139, 92, 246, 0.4)' },
        logContainer: { flex: 1, background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px', fontSize: '11px', fontFamily: 'monospace', overflowY: 'auto' },
        logEntry: (type) => ({ color: type === 'error' ? '#f87171' : (type === 'success' ? '#4ade80' : '#888'), marginBottom: '4px', borderLeft: `2px solid ${type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#333')}`, paddingLeft: '8px' }),
        button: { padding: '8px 16px', borderRadius: '4px', backgroundColor: '#6d28d9', color: '#ffffff', border: '1px solid #8b5cf6', cursor: 'pointer', fontSize: '11px', fontWeight: '800', transition: 'all 0.2s', outline: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', WebkitAppearance: 'none' },
        code: { background: '#000', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#4ade80', overflowX: 'auto', marginBottom: '10px' },
        path: { fontSize: '10px', color: '#444', marginBottom: '10px', wordBreak: 'break-all', fontFamily: 'monospace' },
        payloadBox: { marginBottom: '20px', padding: '15px', background: '#1a1a1a', borderRadius: '8px', border: '1px dashed #333' },
        payloadInput: { width: '100%', background: '#0a0a0a', border: '1px solid #8b5cf6', color: '#4ade80', padding: '10px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }
    };

    const renderPayloadInput = () => (
        <div style={styles.payloadBox}>
            <div style={{ fontSize: '10px', color: '#8b5cf6', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Write Payload</div>
            <input 
                style={styles.payloadInput} 
                value={payload} 
                onChange={e => setPayload(e.target.value)}
                placeholder="Enter text to write to storage..."
            />
        </div>
    );

    const renderContent = () => {
        if (!storageApi) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Initializing Modular Hub...</div>;

        const contentWrapper = (children) => (
            <div style={styles.demoArea}>
                {renderPayloadInput()}
                {children}
            </div>
        );

        switch (activeTab) {
            case 'files':
                return contentWrapper(
                    <>
                        <div style={styles.card}>
                            <h3 style={styles.title}><dc.Icon icon="file" /> Native File System</h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> Direct Node.js (fs) API bypassing the Obsidian sandbox.<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> High-throughput binary processing, massive log files, and accessing paths strictly outside the active Datacore Vault.
                            </div>
                            <div style={{...styles.path, display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <span>{absolutePath}/_resources/data/</span>
                                <input 
                                    value={fsFilename}
                                    onChange={e => setFsFilename(e.target.value)}
                                    style={{ background: '#222', border: '1px solid #444', color: '#4ade80', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', minWidth: '100px', fontFamily: 'monospace' }}
                                    placeholder="filename.ext"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.button} onClick={() => {
                                    const path = require('path');
                                    const target = path.join(absolutePath, '_resources/data', fsFilename || 'test_fs.txt');
                                    const res = storageApi.fs.write(target, payload);
                                    addLog(res.message + " | Content: " + payload, res.success ? 'success' : 'error');
                                }}>Write FS</button>
                                <button style={styles.button} onClick={() => {
                                    const path = require('path');
                                    const target = path.join(absolutePath, '_resources/data', fsFilename || 'test_fs.txt');
                                    const res = storageApi.fs.read(target);
                                    if (res.success) addLog("Read Content: " + res.content, 'success');
                                    else addLog(res.message, 'error');
                                }}>Read FS</button>
                                <select 
                                    style={{ ...styles.button, appearance: 'none', cursor: 'pointer', outline: 'none' }}
                                    onChange={(e) => {
                                        if(e.target.value === 'finder') {
                                            const path = require('path');
                                            const target = path.join(absolutePath, '_resources/data', fsFilename || 'test_fs.txt');
                                            require('child_process').exec(`open -R "${target}"`);
                                            addLog("Revealed in Finder", 'info');
                                        } else if (e.target.value === 'vault') {
                                            const target = folderPath + '/_resources/data/' + (fsFilename || 'test_fs.txt');
                                            const file = dc.app.vault.getAbstractFileByPath(target);
                                            if(file) {
                                                dc.app.workspace.getLeaf(false).openFile(file);
                                                addLog("Opened in Vault", 'info');
                                            } else {
                                                addLog("File not found in Vault", 'error');
                                            }
                                        }
                                        e.target.value = '';
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>🔍 Locate...</option>
                                    <option value="finder">✨ Reveal in Finder</option>
                                    <option value="vault">💎 Open in Vault</option>
                                </select>
                            </div>
                        </div>
                        <div style={styles.card}>
                            <h3 style={styles.title}><dc.Icon icon="file-text" /> Vault Adapter (API)</h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> Obsidian's native App Vault abstraction layer.<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> Safely reading/writing user notes, triggering native vault events, and ensuring safe sync propagation across platforms.
                            </div>
                            <div style={{...styles.path, display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <span>{folderPath}/_resources/data/</span>
                                <input 
                                    value={vaultFilename}
                                    onChange={e => setVaultFilename(e.target.value)}
                                    style={{ background: '#222', border: '1px solid #444', color: '#4ade80', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', minWidth: '100px', fontFamily: 'monospace' }}
                                    placeholder="filename.ext"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.button} onClick={async () => {
                                    const target = folderPath + '/_resources/data/' + (vaultFilename || 'test_vault.txt');
                                    const res = await storageApi.vault.write(dc, target, payload);
                                    addLog(res.message + " | Content: " + payload, res.success ? 'success' : 'error');
                                }}>Write Vault</button>
                                <button style={styles.button} onClick={async () => {
                                    const target = folderPath + '/_resources/data/' + (vaultFilename || 'test_vault.txt');
                                    const res = await storageApi.vault.read(dc, target);
                                    if (res.success) addLog("Read Content: " + res.content, 'success');
                                    else addLog(res.message, 'error');
                                }}>Read Vault</button>
                                <select 
                                    style={{ ...styles.button, appearance: 'none', cursor: 'pointer', outline: 'none' }}
                                    onChange={(e) => {
                                        if(e.target.value === 'finder') {
                                            const path = require('path');
                                            const target = path.join(absolutePath, '_resources/data', vaultFilename || 'test_vault.txt');
                                            require('child_process').exec(`open -R "${target}"`);
                                            addLog("Revealed in Finder", 'info');
                                        } else if (e.target.value === 'vault') {
                                            const target = folderPath + '/_resources/data/' + (vaultFilename || 'test_vault.txt');
                                            const file = dc.app.vault.getAbstractFileByPath(target);
                                            if(file) {
                                                dc.app.workspace.getLeaf(false).openFile(file);
                                                addLog("Opened in Vault", 'info');
                                            } else {
                                                addLog("File not found in Vault", 'error');
                                            }
                                        }
                                        e.target.value = '';
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>🔍 Locate...</option>
                                    <option value="finder">✨ Reveal in Finder</option>
                                    <option value="vault">💎 Open in Vault</option>
                                </select>
                            </div>
                        </div>
                    </>
                );
            case 'database':
                return contentWrapper(
                    <>
                        <div style={styles.card}>
                            <h3 style={styles.title}><dc.Icon icon="database" /> SQLite (WASM)</h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> Real relational SQL engine running purely in the browser, physically persisting to a local `.db` file.<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> Deep relational ledger queries, strict schemas, and bypassing thousands of markdown file parses for immediate heavy data access.
                            </div>
                            <div style={styles.path}>{folderPath}/_resources/data/showcase.db</div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.button} onClick={async () => {
                                    const target = folderPath + '/_resources/data/showcase.db';
                                    addLog("Initializing Database...", 'info');
                                    const res = await storageApi.db.sqlite.query(dc, target,
                                        `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT); 
                                         INSERT INTO users (name) VALUES ('${payload.replace(/'/g, "''")}');`
                                    );
                                    addLog(res.message + " | Inserted: " + payload, res.success ? 'success' : 'error');
                                }}>Init & Write</button>
                                <button style={styles.button} onClick={async () => {
                                    const target = folderPath + '/_resources/data/showcase.db';
                                    const res = await storageApi.db.sqlite.query(dc, target, "SELECT * FROM users;");
                                    if (res.success) addLog("Data: " + res.content, 'success');
                                    else addLog(res.message, 'error');
                                }}>Query All</button>
                                <select 
                                    style={{ ...styles.button, appearance: 'none', cursor: 'pointer', outline: 'none' }}
                                    onChange={(e) => {
                                        if(e.target.value === 'finder') {
                                            const path = require('path');
                                            const target = path.join(absolutePath, '_resources/data/showcase.db');
                                            require('child_process').exec(`open -R "${target}"`);
                                            addLog("Revealed DB in Finder", 'info');
                                        }
                                        e.target.value = '';
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>🔍 Locate...</option>
                                    <option value="finder">✨ Reveal in Finder</option>
                                </select>
                            </div>
                        </div>
                        <div style={styles.card}>
                            <h3 style={styles.title}><dc.Icon icon="search" /> Metadata Cache</h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> Internal memory/IndexedDB mapping maintained automatically by Obsidian Datacore.<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> Dataview-style instant frontmatter lookups, link graph traversals, and tracking reactive tag ecosystems.
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.button} onClick={() => {
                                    const res = storageApi.db.cache.read(dc);
                                    if (res.success) addLog("Cache Read: " + res.content.substring(0, 100) + "...", 'success');
                                    else addLog(res.message, 'error');
                                }}>Read Cache</button>
                            </div>
                        </div>
                        <div style={styles.card}>
                            <h3 style={styles.title}><dc.Icon icon="layout" /> IndexedDB (NoSQL)</h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> Browser-native, asynchronous object storage (Key-Value/JSON trees).<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> Heavy UI state persistence, storing offline blobs/images, and caching complex nested Javascript objects flawlessly.
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.button} onClick={async () => {
                                    const res = await storageApi.db.indexedDB.set('user_payload', payload);
                                    addLog(res.message + " | Key: user_payload", res.success ? 'success' : 'error');
                                }}>Set Payload</button>
                                <button style={styles.button} onClick={async () => {
                                    const res = await storageApi.db.indexedDB.get('user_payload');
                                    if (res.success) addLog("Data: " + res.content, 'success');
                                    else addLog(res.message, 'error');
                                }}>Get Payload</button>
                            </div>
                        </div>
                    </>
                );
            case 'system':
                return contentWrapper(
                    <>
                        <div style={styles.card}>
                            <h3 style={styles.title}><dc.Icon icon="terminal" /> Shell Execution</h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> OS-level child process proxy orchestrated by Node.js CLI bridging.<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> Triggering background processing (AI scripts, python pipelines), checking local IPs, or rebooting external daemon services.
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ fontSize: '10px', color: '#8b5cf6', marginBottom: '5px', fontWeight: 'bold' }}>TERMINAL COMMAND</div>
                                <input 
                                    style={{ ...styles.payloadInput, borderColor: '#f87171' }} 
                                    value={systemCommand} 
                                    onChange={e => setSystemCommand(e.target.value)}
                                    placeholder="Enter shell command (e.g. uptime)..."
                                />
                            </div>
                            <button style={styles.button} onClick={async () => {
                                const res = await storageApi.system.shell.execute(systemCommand || 'uptime');
                                if (res.success) addLog("Terminal Output: " + res.content, 'success');
                                else addLog(res.message, 'error');
                            }}>Execute Shell Command</button>
                        </div>
                    </>
                );
            case 'web':
                return contentWrapper(
                    <>
                        <div style={styles.card}>
                            <h3 style={styles.title}><dc.Icon icon="globe" /> LocalStorage</h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> Synchronous local browser key-value API (Max 5MB-10MB global).<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> Storing lightweight UI toggles, last-active-tab preferences (like this module), or simple session flags.
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.button} onClick={() => {
                                    storageApi.web.local.set('dc_payload', payload);
                                    addLog("LocalStorage saved | Key: dc_payload", 'success');
                                }}>Set Value</button>
                                <button style={styles.button} onClick={() => {
                                    const res = storageApi.web.local.get('dc_payload');
                                    addLog("Value: " + res.content, 'success');
                                }}>Get Value</button>
                            </div>
                        </div>
                        <div style={styles.card}>
                            <h3 style={styles.title}><dc.Icon icon="pie-chart" /> Cookies</h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> Stateful web headers specifically tied to domains/sessions.<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> Authenticating with external HTTPS endpoints via WebViews or parsing user session handshakes. 
                                <br/><br/><span style={{ color: '#f87171' }}>⚠️ <b>Strict Warning:</b> Cookies completely fail on standard Obsidian `app://` or `file://` local environments due to Electron security protocols. Prefer IndexedDB.</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.button} onClick={() => {
                                    storageApi.web.cookies.set('dc_payload', payload);
                                    addLog("Cookie attempt sent for payload.", 'info');
                                }}>Bake Cookie</button>
                                <button style={styles.button} onClick={() => {
                                    const res = storageApi.web.cookies.get('dc_payload');
                                    if (res.success) addLog("Cookie Content: " + res.content, 'success');
                                    else addLog(res.message, 'error');
                                }}>Eat Cookie</button>
                            </div>
                        </div>
                    </>
                );
            case 'secure':
                return contentWrapper(
                    <>
                        <div style={styles.card}>
                            <h3 style={styles.title}><dc.Icon icon="shield" /> SecretStorage</h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> Electron Native Security API tied to OS (macOS Keychain / Windows Credential Vault).<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> Encrypting sensitive API Keys, Bank OAuth Tokens, Telegram Session Hashes, or high-security passwords. Never leaks to standard plain-text configs!
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.button} onClick={async () => {
                                    const res = await storageApi.secure.set(dc, 'dc-payload-test', payload);
                                    addLog(res.message + " | Encrypted Payload", res.success ? 'success' : 'error');
                                }}>Set Secret</button>
                                <button style={styles.button} onClick={async () => {
                                    const res = await storageApi.secure.get(dc, 'dc-payload-test');
                                    if (res.success) addLog("Secret: " + res.content, 'success');
                                    else addLog(res.message, 'error');
                                }}>Get Secret</button>
                            </div>
                        </div>
                    </>
                );
            case 'sync':
                return contentWrapper(
                    <>
                        <div style={styles.card}>
                            <h3 style={styles.title}>
                                <dc.Icon icon="git-branch" /> Git Sync
                                <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto', textTransform: 'uppercase', fontWeight: 'bold', border: '1px solid #3b82f6' }}>WIP</span>
                            </h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> Node bridging directly to standard local `.git` commands.<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> Branch-based developer snapshots, hard-reverting UI corruption, peer-to-peer merge conflict resolution, and granular commit logs.
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.button} onClick={async () => {
                                    addLog("Reading Git Status...", 'info');
                                    const res = await storageApi.sync.git.status(absolutePath);
                                    addLog(res.content, 'success');
                                }}>Check Status</button>
                                <button style={styles.button} onClick={async () => {
                                    addLog("Committing changes...", 'info');
                                    const res = await storageApi.sync.git.commit(absolutePath, payload);
                                    addLog(res.message + " | Msg: " + payload, res.success ? 'success' : 'error');
                                }}>Push Commit</button>
                                <button style={styles.button} onClick={() => {
                                    require('child_process').exec(`open "${absolutePath}"`);
                                    addLog("Opened Repo Directory in Finder", 'info');
                                }}>Reveal Folder</button>
                            </div>
                        </div>
                        <div style={styles.card}>
                            <h3 style={styles.title}>
                                <dc.Icon icon="activity" /> LiveSync 
                                <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto', textTransform: 'uppercase', fontWeight: 'bold', border: '1px solid #f59e0b' }}>Coming Soon</span>
                            </h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> Real-time CouchDB synchronization engine constantly broadcasting chunk deltas.<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> Flawless sub-second cross-device editing across local PCs and Mobile devices with absolute zero-conflict guarantee.
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.button} onClick={() => {
                                    addLog("LiveSync Status: CouchDB polling active.", 'info');
                                }}>Check Sync Status</button>
                                <button style={styles.button} onClick={() => {
                                    addLog("Forced Replication triggered across all connected nodes.", 'success');
                                }}>Force Replication</button>
                            </div>
                        </div>
                        <div style={styles.card}>
                            <h3 style={styles.title}>
                                <dc.Icon icon="hard-drive" /> Syncthing
                                <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto', textTransform: 'uppercase', fontWeight: 'bold', border: '1px solid #f59e0b' }}>Coming Soon</span>
                            </h3>
                            <div style={styles.descBox}>
                                <strong style={{color:'#e0e0e0'}}>Architecture:</strong> Daemon-based, headless P2P block-level byte transfer via local TCP/UDP.<br/>
                                <strong style={{color:'#a78bfa'}}>Best For:</strong> Synchronizing extremely large binary backup vaults securely over LAN environments securely without needing a central cloud DB.
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.button} onClick={() => {
                                    addLog("Syncthing: Service running on localhost:8384.", 'info');
                                }}>Ping Daemon</button>
                                <button style={styles.button} onClick={() => {
                                    try {
                                        require('child_process').exec(`open "http://127.0.0.1:8384"`);
                                    } catch(e) {}
                                    addLog("Opened Syncthing Web UI in default browser.", 'success');
                                }}>Open Web GUI</button>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={{ margin: 0, fontSize: '18px', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
                    <dc.Icon icon="zap" /> MODULAR STORAGE <span style={{ fontSize: '10px', background: '#333', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>v3.1</span>
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                        onClick={toggleTelegram} 
                        style={{ 
                            padding: '4px 8px', borderRadius: '6px', 
                            background: isTelegramEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)', 
                            color: isTelegramEnabled ? '#34d399' : '#888', 
                            border: '1px solid ' + (isTelegramEnabled ? '#059669' : '#333'), 
                            cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.2s ease', fontWeight: 'bold'
                        }}
                        title="Toggle Telegram Background Connection"
                    >
                        <dc.Icon icon={isTelegramEnabled ? "wifi" : "wifi-off"} style={{ width: '12px', height: '12px' }} />
                        {isTelegramEnabled ? "TG Online" : "TG Offline"}
                    </button>
                    <ControlsMenu />
                </div>
            </div>

            <div style={styles.tabs}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        style={styles.tab(activeTab === tab.id)}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <dc.Icon icon={tab.icon} style={{ width: '14px', height: '14px' }} /> {tab.label}
                    </button>
                ))}
            </div>

            <div style={styles.content}>
                {renderContent()}

                <div style={styles.sidebar}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#8b5cf6', textTransform: 'uppercase' }}>Kernel Output</h4>
                    <div style={styles.logContainer}>
                        {logs.length === 0 && <div style={{ color: '#333' }}>Ready. Select a storage module.</div>}
                        {logs.map((log, i) => (
                            <div key={i} style={styles.logEntry(log.type)}>
                                <span style={{ color: '#444', fontSize: '10px', marginRight: '5px' }}>{log.time}</span> {log.msg}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

return { MainComponent };
