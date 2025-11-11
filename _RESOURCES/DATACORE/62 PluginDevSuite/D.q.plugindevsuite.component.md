

# ViewComponent

```jsx
const { useEffect, useRef, useState, useCallback } = dc;

const { IntegratedIDE } = await dc.require(dc.headerLink(dc.resolvePath("D.q.plugindevsuite.component.md"), "IntegratedIDE"));

let useGitHook;
try {
    const gitModule = await dc.require(dc.headerLink(dc.resolvePath("D.q.plugindevsuite.component.md"), "GitSuite"));
    useGitHook = gitModule.useGit || gitModule.default || (() => ({}));
    if (typeof useGitHook !== 'function') {
        throw new Error("GitSuite.component.v1.md did not export a valid 'useGit' hook.");
    }
} catch (e) {
    console.error("Failed to load GitSuite.component.v1.md:", e);
    useGitHook = () => ({ // Fallback mock for useGit
        isLoading: false, isRepo: false, remoteUrl: '', ahead: 0, behind: 0,
        error: `GitSuite failed to load: ${e.message}.`,
        init: () => new Promise(res => { console.error('Mock GitSuite: init failed.'); res(); }),
        setRemote: () => new Promise(res => { console.error('Mock GitSuite: setRemote failed.'); res(); }),
        pull: () => new Promise(res => { console.error('Mock GitSuite: pull failed.'); res(); }),
        push: () => new Promise(res => { console.error('Mock GitSuite: push failed.'); res(); }),
        refresh: () => new Promise(res => { console.error('Mock GitSuite: refresh failed.'); res(); }),
        setRepoPath: () => { console.error('Mock GitSuite: setRepoPath failed.'); }
    });
}
const useGit = useGitHook;


let TerminalManagerClass;
try {
    const terminalModule = await dc.require(dc.headerLink(dc.resolvePath("D.q.plugindevsuite.component.md"), "TerminalManager"));
    TerminalManagerClass = terminalModule.TerminalManager || terminalModule.default || terminalModule;
    if (typeof TerminalManagerClass !== 'function') {
        throw new Error("TerminalManager.component.v1.md did not export a valid constructor for TerminalManager.");
    }
} catch (e) {
    console.error("Failed to load plugindevsuite.component.md:", e);
    TerminalManagerClass = class MockTerminalManager {
        constructor() { console.error('Mock TerminalManager instance created as real one failed to load.'); }
        createTerminal() { console.error('Mock TerminalManager: createTerminal failed.'); return 'mock-term'; }
        getOutput() { return { output: 'Mock TerminalManager: TerminalManager failed to load.', exitCode: 1 }; }
        waitForExit() { return new Promise(res => { console.error('Mock TerminalManager: waitForExit failed.'); res({ exitCode: 1 }); }); }
        releaseTerminal() { console.error('Mock TerminalManager: releaseTerminal failed.'); }
        killAllTerminals() { console.error('Mock TerminalManager: killAllTerminals failed.'); }
    };
}
const TerminalManager = TerminalManagerClass;


// =================================================================================
// CORE MANAGER CLASSES
// =================================================================================

class DebugNoticeManager {
    constructor(options) {
        this.isDebugModeEnabledRef = options.isDebugModeEnabledRef;
        this.logMessageCache = new Map(); // Stores { count, firstTimestamp, lastTimestamp, timeoutId, isSummarizing }
        this.DEBOUNCE_THRESHOLD_MS = 100; // Time window to group identical messages for summarization
        this.SUMMARY_MIN_COUNT = 3; // Minimum repetitions to show a summary message (after the first individual log)
    }

    showNotice(message, duration = 4000) {
        // Notices are usually distinct and important, so they are not debounced.
        // They are generally less prone to generating "thousands" of rapid logs.
        return new Notice(message, duration);
    }

    log(message, context = "PDS") {
        if (!this.isDebugModeEnabledRef.current) {
            return;
        }

        const messageKey = `[${context}] ${message}`;

        if (this.logMessageCache.has(messageKey)) {
            const entry = this.logMessageCache.get(messageKey);
            entry.count++;
            entry.lastTimestamp = Date.now();

            // Reset the debounce timer for this message
            clearTimeout(entry.timeoutId);
            entry.timeoutId = setTimeout(() => {
                this._flushLogSummary(messageKey);
            }, this.DEBOUNCE_THRESHOLD_MS);

            // If we haven't started summarizing and the count hits the threshold,
            // log a message indicating that further identical logs will be suppressed.
            // This message is only shown once per burst of identical logs.
            if (entry.isSummarizing === false && entry.count >= this.SUMMARY_MIN_COUNT) {
                console.log(`%c[${context}] (Suppressing further identical logs for this burst). Message: "${message}". Occurred ${entry.count} times so far.`, 'color: grey;');
                entry.isSummarizing = true;
            }
            // Otherwise, if isSummarizing is true, we simply suppress the log.
            // If isSummarizing is false and count is < SUMMARY_MIN_COUNT, the initial log was shown,
            // and we're just counting for now.
        } else {
            // This is the first time this exact messageKey is seen in this burst.
            // Log it immediately to ensure no important initial message is missed.
            console.log(`%c${messageKey}`, 'color: dodgerblue;');

            const entry = {
                count: 1,
                firstTimestamp: Date.now(),
                lastTimestamp: Date.now(),
                isSummarizing: false, // Not yet in a summarizing state
                timeoutId: setTimeout(() => {
                    this._flushLogSummary(messageKey);
                }, this.DEBOUNCE_THRESHOLD_MS)
            };
            this.logMessageCache.set(messageKey, entry);
        }
    }

    _flushLogSummary(messageKey) {
        if (this.logMessageCache.has(messageKey)) {
            const entry = this.logMessageCache.get(messageKey);
            this.logMessageCache.delete(messageKey); // Clear from cache

            if (entry.count > 1) { // Only log a summary if the message repeated more than once
                const duration = entry.lastTimestamp - entry.firstTimestamp;

                if (entry.count >= this.SUMMARY_MIN_COUNT) {
                    // Log the summary for messages that met or exceeded the minimum count
                    console.log(`%c[PDS-SUMMARY] Previous log repeated ${entry.count} times over ${duration}ms: "${messageKey}"`, 'color: #9c27b0; font-weight: bold;');
                }
                // If count < SUMMARY_MIN_COUNT (e.g., 2 repetitions), the first log was already shown
                // and no explicit summary is needed as it didn't hit the threshold for "spam".
            }
        }
    }

    error(message, context = "PDS", ...data) {
        // Errors are usually critical and should always be displayed immediately, not debounced or summarized.
        console.error(`%c[${context}] ERROR: ${message}`, 'color: red; font-weight: bold;', ...data);
    }
}


/**
 * NodeJsManager Class
 * Centralized wrapper for all Node.js core module interactions.
 */
class NodeJsManager {
    constructor() {
        this.fs = require('fs');
        this.path = require('path');
        this.spawn = require('child_process').spawn;
        this.os = require('os');
    }

    join(...paths) { return this.path.join(...paths); }
    basename(p) { return this.path.basename(p); }
    normalize(p) { return this.path.normalize(p); }
    dirname(p) { return this.path.dirname(p); }
    relative(from, to) { return this.path.relative(from, to); }
    get pathDelimiter() { return this.path.delimiter; }
    get platform() { return this.os.platform(); }
    get EOL() { return this.os.EOL; }
    exists(p) { return this.fs.existsSync(p); }
    readFile(p, encoding = 'utf-8') { return this.fs.readFileSync(p, encoding); }
    readJson(p) { try { return JSON.parse(this.readFile(p)); } catch (e) { return null; } }
    readDir(p, options = {}) { return this.fs.readdirSync(p, options); }
    makeDir(p, options = { recursive: true }) { if (!this.exists(p)) this.fs.mkdirSync(p, options); }
    remove(p) { if (this.exists(p)) this.fs.rmSync(p, { recursive: true, force: true }); }
    writeFile(p, data) { this.fs.writeFileSync(p, data); }
    writeJson(p, data) { this.writeFile(p, JSON.stringify(data, null, 2)); }
    copyFile(source, target) { this.fs.copyFileSync(source, target); }
    getStats(p) { try { return this.fs.statSync(p); } catch (e) { return null; } }
    copyDirRecursive(source, target) {
        this.makeDir(target);
        this.readDir(source, { withFileTypes: true }).forEach(entry => {
            const sourcePath = this.join(source, entry.name);
            const targetPath = this.join(target, entry.name);
            entry.isDirectory() ? this.copyDirRecursive(sourcePath, targetPath) : this.copyFile(sourcePath, targetPath);
        });
    }
    spawnProcess(command, args = [], options = {}) {
        return this.spawn(command, args, options);
    }
}

/**
 * HotReloadManager Class
 * Manages the watcher for the deployed plugin folder (.obsidian/plugins)
 */
class HotReloadManager {
    constructor(options) {
        this.dc = options.dc;
        this.nodeManager = options.nodeManager;
        this.isFileOpLockRef = options.isFileOpLockRef;
        this.scanPlugins = options.scanPlugins;
        this.getTruePluginId = options.getTruePluginId;
        this.pollForPluginState = options.pollForPluginState;
        this.debug = options.debug;

        this.hotReloadStatCache = new Map();
        this.hotReloadDebouncers = {};
        this.eventRef = null;
    }

    start() {
        if (this.eventRef) return;
        this.debug.log("Starting file watcher.", "Hot Reload");
        this.populateInitialCache();
        this.eventRef = this.dc.app.vault.on('raw', this.handleFileChange);
    }

    stop() {
        if (!this.eventRef) return;
        this.debug.log("Stopping file watcher.", "Hot Reload");
        this.dc.app.vault.offref(this.eventRef);
        this.eventRef = null;
        this.cancelAll();
    }

    cancel(pluginId) {
        if (this.hotReloadDebouncers[pluginId]) {
            this.hotReloadDebouncers[pluginId].cancel();
        }
    }

    cancelAll() {
        Object.values(this.hotReloadDebouncers).forEach((debouncer) => {
            if (debouncer && debouncer.cancel) {
                debouncer.cancel();
            }
        });
    }

    handleFileChange = async (filePath) => {
        if (this.isFileOpLockRef.current) {
            this.debug.log("[PDS Hot Reload] Ignoring event: File operation lock is active.", "Hot Reload");
            return;
        }

        const RELATIVE_PLUGINS_DIR = '.obsidian/plugins';
        const normalizedFilePath = filePath.replace(/\\/g, '/');

        if (!normalizedFilePath.startsWith(RELATIVE_PLUGINS_DIR + '/')) return;

        const fileName = this.nodeManager.basename(filePath);
        if (!['main.js', 'styles.css', 'manifest.json'].includes(fileName)) {
            this.debug.log(`Ignoring file '${fileName}' as it's not a target for reload.`, "Hot Reload");
            return;
        }

        const pathSegments = normalizedFilePath.substring(RELATIVE_PLUGINS_DIR.length + 1).split('/');
        const pluginId = pathSegments[0];

        try {
            const stat = await this.dc.app.vault.adapter.stat(filePath);
            const cachedMtime = this.hotReloadStatCache.get(filePath);

            if (stat && stat.mtime !== cachedMtime) {
                this.debug.log(`Change detected for '${pluginId}'.`, "Hot Reload");
                this.hotReloadStatCache.set(filePath, stat.mtime);

                if (fileName === 'manifest.json') {
                    this.debug.showNotice("Manifest change detected, rescanning plugins...", 2000);
                    this.scanPlugins();
                    return;
                }

                if (!this.hotReloadDebouncers[pluginId]) {
                    this.hotReloadDebouncers[pluginId] = debounce(() => {
                        this.executeReload(pluginId);
                    }, 750);
                }
                this.hotReloadDebouncers[pluginId]();
            }
        } catch (e) { /* Ignore stat errors, file might have been deleted */ }
    };

    executeReload = async (pluginId) => {
        const trueId = this.getTruePluginId(pluginId);
        if (!this.dc.app.plugins.enabledPlugins.has(trueId)) {
            this.debug.log(`Skipped reload for disabled plugin: ${trueId}`, "Hot Reload");
            return;
        }

        try {
            await this.dc.app.plugins.disablePlugin(trueId);
            await this.pollForPluginState(trueId, 'unloaded', 'Hot Reload Disable');
            await this.dc.app.plugins.enablePluginAndSave(trueId);
            await this.pollForPluginState(trueId, 'loaded', 'Hot Reload Enable');
            this.debug.showNotice(`Hot reloaded "${trueId}"`);
        } catch (e) {
            this.debug.showNotice(`Hot reload for "${trueId}" failed. Check console.`, 6000);
            this.debug.error(`Error during reload for ${trueId}:`, "Hot Reload", e);
        }
    };

    populateInitialCache = () => {
        const RELATIVE_PLUGINS_DIR = '.obsidian/plugins';
        this.dc.app.vault.adapter.list(RELATIVE_PLUGINS_DIR).then(list => {
            list.files.forEach(async (filePath) => {
                if (filePath.endsWith('main.js') || filePath.endsWith('styles.css') || filePath.endsWith('manifest.json')) {
                    try {
                        const stat = await this.dc.app.vault.adapter.stat(filePath);
                        if (stat) this.hotReloadStatCache.set(filePath, stat.mtime);
                    } catch (e) { /* ignore */ }
                }
            });
        });
    };
}

class AutoBuildManager {
    constructor(options) {
        this.dc = options.dc;
        this.nodeManager = options.nodeManager;
        this.isFileOpLockRef = options.isFileOpLockRef;
        this.handleBuildAndDeployRef = options.handleBuildAndDeployRef;
        this.isAutoBuildEnabledRef = options.isAutoBuildEnabledRef;
        this.isProcessRunningRef = options.isProcessRunningRef;
        this.debug = options.debug;

        this.eventRef = null;
        this.autoBuildTimeoutRef = null;
        this.noticeRef = null;
    }

    start() {
        if (this.eventRef) return;
        this.debug.log("Starting file watcher.", "Auto-Build");
        this.eventRef = this.dc.app.vault.on('raw', this.handleSourceFileChange);
    }

    stop() {
        if (!this.eventRef) return;
        this.debug.log("Stopping file watcher.", "Auto-Build");
        this.dc.app.vault.offref(this.eventRef);
        this.eventRef = null;
        if (this.autoBuildTimeoutRef) {
            clearTimeout(this.autoBuildTimeoutRef);
            this.autoBuildTimeoutRef = null;
        }
    }

    handleSourceFileChange = (filePath) => {
        if (!this.isAutoBuildEnabledRef.current || this.isProcessRunningRef.current) {
            this.debug.log("Ignoring event: Auto-build disabled or process already running.", "Auto-Build");
            return;
        }
        if (this.isFileOpLockRef.current) {
            this.debug.log("Ignoring event: File operation lock is active.", "Auto-Build");
            return;
        }

        const normalizedFilePath = filePath.replace(/\\/g, '/');
        const RELATIVE_SOURCE_DIR = '.datacore/plugins';

        if (!normalizedFilePath.startsWith(RELATIVE_SOURCE_DIR + '/')) return;
        if (normalizedFilePath.includes('/node_modules/')) return;
        if (this.nodeManager.basename(normalizedFilePath) === 'main.js') return; // Ignore built main.js from source

        const isSourceFile = ['.ts', '.svelte', '.css', '.html'].some(ext => normalizedFilePath.endsWith(ext));
        if (!isSourceFile) return;

        const pathSegments = normalizedFilePath.substring(RELATIVE_SOURCE_DIR.length + 1).split('/');
        const pluginId = pathSegments[0];

        // Construct the full source directory path for the plugin.
        // This is crucial to check if the plugin's source directory still exists.
        const vaultPath = this.nodeManager.normalize(this.dc.app.vault.adapter.getBasePath());
        const pluginSourceDirPath = this.nodeManager.join(vaultPath, RELATIVE_SOURCE_DIR, pluginId);

        // ADDED: If the plugin's source directory no longer exists, it means it was deleted.
        // We should ignore this event for auto-building to prevent errors.
        if (!this.nodeManager.exists(pluginSourceDirPath)) {
            this.debug.log(`Ignoring event for deleted plugin source directory: ${pluginId}`, "Auto-Build");
            return;
        }

        this.debug.log(`Source file change detected: ${normalizedFilePath}`, "Auto-Build");

        this.triggerAutoBuild(pluginId);
    };

    triggerAutoBuild = (pluginId) => {
        if (!this.autoBuildTimeoutRef) {
            this.noticeRef = this.debug.showNotice('File saved. Auto-build scheduled...', 2000);
        }

        if (this.autoBuildTimeoutRef) {
            clearTimeout(this.autoBuildTimeoutRef);
        }

        this.autoBuildTimeoutRef = setTimeout(() => {
            this.debug.log(`Triggering auto-build for ${pluginId}...`, "PDS");
            this.autoBuildTimeoutRef = null;
            if (this.noticeRef) {
                this.noticeRef.hide();
                this.noticeRef = null;
            }
            // CHANGED: Call the function through the ref's current value
            this.handleBuildAndDeployRef.current(pluginId, null);
        }, 1500);
    };
}

// =================================================================================
// UTILITY FUNCTIONS & HELPERS
// =================================================================================

function debounce(func, wait) {
    let timeout;
    const debouncedFunc = function (...args) {
        const later = () => { clearTimeout(timeout); func.apply(this, args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
    debouncedFunc.cancel = () => { clearTimeout(timeout); };
    return debouncedFunc;
}

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

// --- FEATURE SNIPPETS (COMPLETE) ---
const SNIPPETS = {
    addCommand: (id, name) => `
		this.addCommand({
			id: '${id}',
			name: '${name}',
			editorCallback: (editor, view) => {
				console.log(editor.getSelection());
				new Notice('Command "${name}" executed!');
				editor.replaceSelection('Sample Editor Command Output!');
			}
		});`,
    addRibbonIcon: (icon, name) => `
		this.addRibbonIcon('${icon}', '${name}', (evt: MouseEvent) => {
			new Notice('Ribbon icon "${name}" clicked!');
		});`,
    addSettingTab: (pluginClassName) => `
		this.addSettingTab(new SampleSettingTab(this.app, this));
}

class SampleSettingTab extends PluginSettingTab {
	plugin: ${pluginClassName};
	constructor(app: App, plugin: ${pluginClassName}) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});
		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}`
};

// --- BUILD CONFIG HELPERS ---
const DEFAULT_BUILD_CONFIG = {
    outputDir: '.', // Default to the root directory
    syncPaths: ['main.js', 'manifest.json', 'styles.css'] // Exclude data.json here, handle separately
};
const getBuildConfigForPlugin = (pluginId) => {
    try {
        const configStr = localStorage.getItem(`pluginDevSuite_buildConfig_${pluginId}`);
        if (configStr) {
            const config = JSON.parse(configStr);
            // Ensure defaults are present if the stored config is old
            return { ...DEFAULT_BUILD_CONFIG, ...config };
        }
        return { ...DEFAULT_BUILD_CONFIG };
    } catch (e) {
        // Fallback to default if there's an error parsing stored config
        console.error(`Error loading build config for ${pluginId}:`, e);
        return { ...DEFAULT_BUILD_CONFIG };
    }
};
const setBuildConfigForPlugin = (pluginId, config) => {
    localStorage.setItem(`pluginDevSuite_buildConfig_${pluginId}`, JSON.stringify(config));
};


// =================================================================================
// HELPER COMPONENTS (FileExplorer)
// =================================================================================

function FileExplorerItem({ item, depth, onFileSelect, nodeManager, debug }) {
    const [isOpen, setIsOpen] = useState(depth < 1); // Expand the root by default
    const [children, setChildren] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const isFolder = item.isFolder;

    const loadChildren = async () => {
        if (!isFolder || children.length > 0) return;
        setIsLoading(true);
        try {
            const listResult = await dc.app.vault.adapter.list(item.path);
            const folderNodes = listResult.folders.map(p => ({ name: nodeManager.basename(p), path: p, isFolder: true }));
            const fileNodes = listResult.files.map(p => ({ name: nodeManager.basename(p), path: p, isFolder: false }));
            const allNodes = [...folderNodes, ...fileNodes].sort((a, b) => {
                if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            setChildren(allNodes);
        } catch (e) {
            if (debug) debug.error(`Failed to load children for ${item.path}:`, "FileExplorer", e);
            else console.error(`[FileExplorer] Failed to load children for ${item.path}:`, e);
        }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        if (isFolder && isOpen) {
            loadChildren();
        }
    }, [isOpen]);

    const handleExpandToggle = (e) => {
        e.stopPropagation();
        if (isFolder) setIsOpen(prev => !prev);
    };

    const handleSelect = () => {
        onFileSelect(item.path);
    };

    const itemStyle = { 
        display: 'flex', 
        alignItems: 'center', 
        padding: '6px 8px', 
        marginLeft: `${depth * 16}px`, 
        borderRadius: '4px',
        cursor: 'pointer',
        backgroundColor: isHovering ? '#1a1a1a' : 'transparent',
        transition: 'background-color 0.15s ease'
    };

    const iconStyle = {
        marginRight: '8px',
        width: '18px',
        height: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isFolder ? '#8b5cf6' : '#666',
    };

    const nameStyle = { 
        flex: 1, 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        fontSize: '13px',
        color: '#e0e0e0',
        fontFamily: 'monospace'
    };

    return (
        <div>
            <div 
                style={itemStyle} 
                title={item.path}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={isFolder ? handleExpandToggle : handleSelect}
            >
                <span style={iconStyle}>
                    {isFolder ? (
                        isOpen ? <dc.Icon icon="folder-open" /> : <dc.Icon icon="folder" />
                    ) : (
                        <dc.Icon icon="file" />
                    )}
                </span>
                <span style={nameStyle}>{item.name}</span>
            </div>
            {isFolder && isOpen && (
                isLoading ? 
                    <div style={{ paddingLeft: `${(depth + 1) * 16}px`, color: '#666', fontSize: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <dc.Icon icon="loader" /> Loading...
                    </div> :
                    children.map(child => (
                        <FileExplorerItem
                            key={child.path}
                            item={child}
                            depth={depth + 1}
                            onFileSelect={onFileSelect}
                            nodeManager={nodeManager}
                            debug={debug}
                        />
                    ))
            )}
        </div>
    );
}

function FileExplorerView({ rootPath = '/', onFileSelect, nodeManager, debug }) {
    const [rootItem, setRootItem] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoot = async () => {
            setError(null);
            setRootItem(null); // Reset on path change
            try {
                if (!(await dc.app.vault.adapter.exists(rootPath, true))) {
                    setError(`Root directory does not exist: ${rootPath}`);
                    if (debug) debug.error(`Root directory does not exist: ${rootPath}`, "FileExplorer");
                    return;
                }
                setRootItem({
                    name: nodeManager.basename(rootPath) || 'Plugin Root',
                    path: rootPath,
                    isFolder: true
                });
            } catch (e) {
                if (debug) debug.error(`Error setting up root '${rootPath}':`, "FileExplorer", e);
                else console.error(`[FileExplorer] Error setting up root '${rootPath}':`, e);
                setError("Failed to initialize file explorer.");
            }
        };
        fetchRoot();
    }, [rootPath]);

    const explorerStyles = {
        wrapper: { 
            height: "100%", 
            width: "100%", 
            background: '#000000', 
            color: '#e0e0e0', 
            display: 'flex', 
            flexDirection: 'column', 
            border: '1px solid #1a1a1a', 
            borderRadius: '6px',
            fontFamily: 'monospace'
        },
        content: { padding: '8px', flex: 1, overflowY: 'auto', backgroundColor: '#000000' }
    };

    return (
        <div style={explorerStyles.wrapper}>
            <div style={explorerStyles.content}>
                {error && <p style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}><dc.Icon icon="alert-circle" /> {error}</p>}
                {rootItem ? <FileExplorerItem item={rootItem} depth={0} onFileSelect={onFileSelect} nodeManager={nodeManager} debug={debug} /> : <p style={{ color: '#666', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}><dc.Icon icon="loader" /> Loading...</p>}
            </div>
        </div>
    );
}


// =================================================================================
// MAIN PLUGIN COMPONENT
// =================================================================================
function PluginDevSuite() {
    // --- MANAGERS & REFS ---
    const nodeManager = useRef(new NodeJsManager()).current;
    const terminalManager = useRef(new TerminalManager()).current; // Initialized here as constructor
    const isFileOpLockRef = useRef(false); // Used to prevent watcher triggers during file operations

    // Manager instances are refs, initialized in useEffect
    const hotReloadManager = useRef(null);
    const autoBuildManager = useRef(null);
    const debugNoticeManager = useRef(null);

    // Refs to expose state to Managers (avoids stale closures in manager methods)
    const isAutoBuildEnabledRef = useRef(true);
    const isProcessRunningRef = useRef(false);
    const isDebugModeEnabledRef = useRef(false);

    // Git hook depends on nodeManager, initialize after nodeManager is ready.
    const git = useGit();

    // --- STATE MANAGEMENT (All UI State) ---
    const [view, setView] = useState('dashboard');
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [plugins, setPlugins] = useState([]);
    const [selectedPluginId, setSelectedPluginId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [newPluginId, setNewPluginId] = useState('');
    const [newPluginName, setNewPluginIdName] = useState('');
    const [newPluginAuthor, setNewPluginAuthor] = useState('');
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [promptConfig, setPromptConfig] = useState(null);
    const [promptValues, setPromptValues] = useState([]);
    const [buildLog, setBuildLog] = useState('');
    const [isBuildLogVisible, setIsBuildLogVisible] = useState(false);
    const [isProcessRunning, setIsProcessRunning] = useState(false); // UI state, kept in sync with isProcessRunningRef
    const [deploymentStatus, setDeploymentStatus] = useState('LOADING');
    const [nodeBinPath, setNodeBinPath] = useState(null); // IMPORTANT: This holds the PATH string
    const [nodePathStatus, setNodePathStatus] = useState('finding');
    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current; // Used for full tab mode's DOM manipulation
    const [isClonerOpen, setIsClonerOpen] = useState(false);
    const [newPluginUrl, setNewPluginUrl] = useState('');
    const [isAutoBuildEnabled, setIsAutoBuildEnabled] = useState(true); // UI state, kept in sync with isAutoBuildEnabledRef
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isHotReloadEnabled, setIsHotReloadEnabled] = useState(true); // UI state for Hot Reload
    const [isDebugModeEnabled, setIsDebugModeEnabled] = useState(false); // UI state for Debug Mode
    const [templateType, setTemplateType] = useState('default');
    const [templateUrl, setTemplateUrl] = useState("https://github.com/obsidianmd/obsidian-sample-plugin");
    const uniqueWrapperClass = useRef(Math.random().toString(36).substr(2, 9)).current;


    // --- PATH REFERENCES ---
    const vaultPath = useRef(nodeManager.normalize(dc.app.vault.adapter.getBasePath())).current;
    const pdsPluginsDir = useRef(nodeManager.join(vaultPath, '.datacore', 'plugins')).current;
    const obsidianPluginsDir = useRef(nodeManager.join(vaultPath, '.obsidian/plugins')).current;

    // --- PROCESS NOTICE FUNCTIONS (Temporary implementation for pre-manager calls) ---
    // These are for process-specific indefinite notices, distinct from DebugNoticeManager.showNotice.
    const processNoticeRef = useRef(null);
    const showProcessNotice = (message) => {
        if (processNoticeRef.current) {
            processNoticeRef.current.setMessage(message);
        } else {
            processNoticeRef.current = new Notice(message, 0); // 0 duration for indefinite
        }
        return processNoticeRef.current;
    };
    const hideProcessNotice = () => {
        if (processNoticeRef.current) {
            processNoticeRef.current.hide();
            processNoticeRef.current = null;
        }
    };

    // --- HIDE STATUS BAR ---
    // Hide the Obsidian status bar when component is mounted
    useEffect(() => {
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
    }, []);


    // =================================================================================
    // CORE FUNCTIONS (Defined to support Managers and React Lifecycle)
    // =================================================================================


    // =================================================================================
    // CORE FUNCTIONS (Defined to support Managers and React Lifecycle)
    // =================================================================================

    // --- LOCALSTORAGE HELPERS ---
    const MANAGED_PLUGINS_KEY = 'pluginDevSuiteManagedPlugins';
    const PDS_IDE_COMMAND_KEY = 'pluginDevSuiteIdeCommand';
    const getManagedPluginIds = () => { try { const ids = localStorage.getItem(MANAGED_PLUGINS_KEY); return ids ? JSON.parse(ids) : []; } catch (e) { return []; } };
    const addManagedPluginId = (id) => { const ids = getManagedPluginIds(); if (!ids.includes(id)) { ids.push(id); localStorage.setItem(MANAGED_PLUGINS_KEY, JSON.stringify(ids)); } };
    const removeManagedPluginId = (id) => { let ids = getManagedPluginIds(); ids = ids.filter(managedId => managedId !== id); localStorage.setItem(MANAGED_PLUGINS_KEY, JSON.stringify(ids)); };
    const getIdeCommand = () => localStorage.getItem(PDS_IDE_COMMAND_KEY);
    const setIdeCommand = (cmd) => localStorage.setItem(PDS_IDE_COMMAND_KEY, cmd);

    // --- UTILITY/CORE LOGIC ---
    // Defined as a useCallback to ensure stable reference for managers
    const getTruePluginId = useCallback((folderName) => {
        const debug = debugNoticeManager.current || { error: console.error };
        try {
            const manifestPath = nodeManager.join(obsidianPluginsDir, folderName, 'manifest.json');
            if (nodeManager.exists(manifestPath)) {
                const manifest = nodeManager.readJson(manifestPath);
                return manifest.id || folderName;
            }
        } catch (e) { debug.error(`Error reading manifest for ${folderName}, falling back to folder name.`, "PDS", e); }
        return folderName;
    }, [nodeManager, obsidianPluginsDir]);

    // Defined as a useCallback to ensure stable reference for managers
    const pollForPluginState = useCallback((pluginId, targetState, context = "Generic Poll") => {
        const debug = debugNoticeManager.current || { log: () => { }, error: console.error };
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 300; // 3 seconds max wait (300 * 100ms)
            debug.log(`Starting Polling: ${context} for '${pluginId}' to reach state '${targetState}'...`, "PDS-Debug");

            const interval = setInterval(() => {
                const isLoaded = !!dc.app.plugins.plugins[pluginId];
                const conditionMet = (targetState === 'loaded') ? isLoaded : !isLoaded;

                debug.log(`${context} Attempt #${attempts}: Is loaded? -> ${isLoaded}. Condition met? -> ${conditionMet}`, "PDS-Debug");

                if (conditionMet) {
                    clearInterval(interval);
                    debug.log(`Polling success: '${pluginId}' reached target state '${targetState}' in ${attempts * 100}ms.`, "PDS-Debug");
                    resolve();
                } else if (attempts++ >= maxAttempts) {
                    clearInterval(interval);
                    debug.error(`Polling FAILED: '${pluginId}' did not reach target state '${targetState}' after 3 seconds.`, "PDS-Debug");
                    reject(new Error(`Polling timed out.`));
                }
            }, 100);
        });
    }, [debugNoticeManager]);

    // Defined as a useCallback to ensure stable reference for managers
    const getPluginStatus = useCallback((pluginId) => {
        const trueId = getTruePluginId(pluginId); // Use the centralized helper
        if (dc.app.plugins.plugins[trueId]) return 'ENABLED';
        if (nodeManager.exists(nodeManager.join(obsidianPluginsDir, pluginId, 'manifest.json'))) return 'DISABLED';
        if (nodeManager.exists(nodeManager.join(pdsPluginsDir, pluginId, 'manifest.json'))) return 'SOURCE';
        return 'NOT_DEPLOYED';
    }, [nodeManager, obsidianPluginsDir, pdsPluginsDir, getTruePluginId]);


    // Defined as a useCallback to ensure stable reference for managers
    const scanPlugins = useCallback(async () => {
        const debug = debugNoticeManager.current || { error: console.error, log: () => { } };
        setIsLoading(true);
        debug.log("Starting full plugin scan...", "PDS");
        const allPluginIds = new Set();

        try {
            // Ensure the .obsidian/plugins directory exists (usually does, but good practice)
            nodeManager.makeDir(obsidianPluginsDir);
            nodeManager.readDir(obsidianPluginsDir, { withFileTypes: true }).filter(d => d.isDirectory()).forEach(d => allPluginIds.add(d.name));
        } catch (e) { debug.error("Could not read .obsidian/plugins directory:", "PDS", e); }

        try {
            // --- FIX ---
            // Ensure the .datacore/plugins directory exists before trying to read it.
            nodeManager.makeDir(pdsPluginsDir);
            nodeManager.readDir(pdsPluginsDir, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('.')).forEach(d => allPluginIds.add(d.name));
        } catch (e) { debug.error("Could not read .datacore/plugins directory:", "PDS", e); }

        await dc.app.plugins.loadManifests(); // Ensure Obsidian's internal state is fresh

        const allPluginsData = [];
        for (const pluginId of allPluginIds) {
            const status = getPluginStatus(pluginId);
            if (status !== 'NOT_DEPLOYED') {
                const obsManifestPath = nodeManager.join(obsidianPluginsDir, pluginId, 'manifest.json');
                const pdsManifestPath = nodeManager.join(pdsPluginsDir, pluginId, 'manifest.json');
                const manifestPath = nodeManager.exists(obsManifestPath) ? obsManifestPath : pdsManifestPath;

                let name = pluginId;
                if (nodeManager.exists(manifestPath)) {
                    const manifest = nodeManager.readJson(manifestPath);
                    if (manifest) name = manifest.name;
                }
                allPluginsData.push({ id: pluginId, name: name, status: status, isManaged: nodeManager.exists(nodeManager.join(pdsPluginsDir, pluginId)) });
            }
        }
        setPlugins(allPluginsData.sort((a, b) => a.name.localeCompare(b.name)));
        setIsLoading(false);
        debug.log("Full plugin scan finished.", "PDS");
    }, [nodeManager, obsidianPluginsDir, pdsPluginsDir, getPluginStatus, debugNoticeManager]);


    const detectPackageManager = (pluginPath) => {
        // Check for Deno config files first, as it's a distinct runtime
        if (nodeManager.exists(nodeManager.join(pluginPath, 'deno.json')) || nodeManager.exists(nodeManager.join(pluginPath, 'deno.jsonc'))) {
            return 'deno';
        }
        // Check for specific lockfiles for Node.js package managers
        if (nodeManager.exists(nodeManager.join(pluginPath, 'pnpm-lock.yaml'))) {
            return 'pnpm';
        }
        if (nodeManager.exists(nodeManager.join(pluginPath, 'bun.lock'))) {
            return 'bun';
        }
        if (nodeManager.exists(nodeManager.join(pluginPath, 'yarn.lock'))) {
            return 'yarn';
        }
        if (nodeManager.exists(nodeManager.join(pluginPath, 'package-lock.json'))) {
            return 'npm';
        }
        // Fallback to npm if no specific lockfile or config is found
        return 'npm';
    };

    const runCommandInPluginDir = useCallback(async (pluginId, action, title) => {
        const debug = debugNoticeManager.current || { showNotice: new Notice, error: console.error };
        // Capture nodeBinPath as a constant for this execution
        const currentNodeBinPath = nodeBinPath;

        if (nodePathStatus !== 'found' || !currentNodeBinPath) {
            debug.error("Node.js installation not found or path not resolved.", "Terminal");
            throw new Error("Node.js installation not found.");
        }

        isProcessRunningRef.current = true; // Set ref for watchers
        setIsProcessRunning(true); // Set state for UI

        const pluginPath = nodeManager.join(pdsPluginsDir, pluginId);
        // NEW: Check if the plugin directory exists before attempting to run commands
        if (!nodeManager.exists(pluginPath)) {
            const errorMessage = `Plugin source directory not found for '${pluginId}'. Cannot run command.`;
            debug.error(errorMessage, "Terminal");
            throw new Error(errorMessage);
        }


        const packageManager = detectPackageManager(pluginPath);
        let command;
        let args;

        switch (packageManager) {
            case 'yarn':
                command = 'yarn';
                args = action === 'install' ? ['install'] : ['build'];
                break;
            case 'pnpm':
                command = 'pnpm';
                args = action === 'install' ? ['install'] : ['build'];
                break;
            case 'bun':
                command = 'bun';
                args = action === 'install' ? ['install'] : ['build'];
                break;
            default: // npm
                command = 'npm';
                args = action === 'install' ? ['install'] : ['run', 'build'];
                break;
        }


        showProcessNotice(`Running: ${title} (using ${packageManager})...`);
        setBuildLog(`> ${command} ${args.join(' ')}\n\n`);
        setIsBuildLogVisible(true);

        let terminalId;
        let pollingInterval;

        try {
            terminalId = terminalManager.createTerminal({
                command, args, cwd: pluginPath,
                env: { PATH: `${currentNodeBinPath}${nodeManager.pathDelimiter}${process.env.PATH}` } // Use captured path
            });
            pollingInterval = setInterval(() => { const state = terminalManager.getOutput(terminalId); if (state) setBuildLog(state.output); }, 250);

            const exitStatus = await terminalManager.waitForExit(terminalId);
            clearInterval(pollingInterval);
            const finalState = terminalManager.getOutput(terminalId);
            if (finalState) setBuildLog(finalState.output);
            hideProcessNotice();

            if (exitStatus.exitCode === 0) {
                debug.showNotice(`${title} completed successfully!`);
                return;
            } else {
                throw new Error(`Process failed with exit code ${exitStatus.exitCode}.`);
            }
        } catch (err) {
            hideProcessNotice();
            debug.showNotice(`Error executing command. Check console.`, 10000);
            debug.error(`Command execution failed: ${err.message}`, "Terminal", err);
            throw err;
        } finally {
            clearInterval(pollingInterval);
            if (terminalId) terminalManager.releaseTerminal(terminalId);
            isProcessRunningRef.current = false; // Release ref
            setIsProcessRunning(false); // Release state
        }
    }, [nodeBinPath, nodePathStatus, nodeManager, pdsPluginsDir, terminalManager, debugNoticeManager]);


    const handleUndeploy = useCallback(async (pluginId, silent = false) => {
        const debug = debugNoticeManager.current || { showNotice: new Notice, error: console.error };
        if (!silent && !confirm(`This will remove the plugin from Obsidian's live plugins folder. The source code will NOT be deleted. Continue?`)) return;
        setIsLoading(true);
        isFileOpLockRef.current = true; // Set lock to prevent watchers from reacting to deletion
        try {
            const targetDir = nodeManager.join(obsidianPluginsDir, pluginId);
            // Before deleting, try to unload if it's currently loaded
            if (dc.app.plugins.manifests[pluginId]) {
                debug.log(`Unloading plugin '${pluginId}' before deletion.`, "Undeploy");
                await dc.app.plugins.unloadPlugin(pluginId);
                await pollForPluginState(pluginId, 'unloaded', 'Pre-Delete Poll');
            }
            if (nodeManager.exists(targetDir)) {
                nodeManager.remove(targetDir);
                debug.log(`Deployed plugin folder '${targetDir}' removed.`, "Undeploy");
            } else {
                debug.log(`No deployed plugin folder found for '${pluginId}'. Skipping removal.`, "Undeploy");
            }
            await dc.app.plugins.loadManifests(); // Refresh Obsidian's plugin list
            if (!silent) debug.showNotice(`Plugin "${pluginId}" undeployed.`);
            setDeploymentStatus('NOT_DEPLOYED');
        } catch (e) {
            if (!silent) debug.showNotice("Error undeploying plugin.");
            debug.error("Plugin undeployment error:", "PDS", e);
        } finally {
            setIsLoading(false);
            // Release the lock AFTER a delay to absorb file change events from deletion
            setTimeout(() => { isFileOpLockRef.current = false; }, 500);
        }
    }, [nodeManager, obsidianPluginsDir, debugNoticeManager, pollForPluginState]);

    const handleToggleDeployment = useCallback(async (pluginId, event) => {
        const debug = debugNoticeManager.current || { showNotice: new Notice, error: console.error };
        const originalTarget = event?.currentTarget;
        setIsLoading(true);
        setDeploymentStatus('LOADING');

        const trueId = getTruePluginId(pluginId); // Get the true ID from manifest
        const isCurrentlyEnabled = !!dc.app.plugins.plugins[trueId];

        debug.log(`Toggling deployment for folder '${pluginId}' (true ID: '${trueId}'). Currently enabled? -> ${isCurrentlyEnabled}`, "PDS");

        try {
            if (isCurrentlyEnabled) {
                await dc.app.plugins.disablePlugin(trueId);
                await pollForPluginState(trueId, 'unloaded', 'Post-Disable Poll');
                debug.showNotice(`Plugin "${trueId}" disabled.`);
            } else {
                await dc.app.plugins.enablePluginAndSave(trueId);
                await pollForPluginState(trueId, 'loaded', 'Post-Enable Poll');
                debug.showNotice(`Plugin "${trueId}" enabled.`);
            }
        } catch (e) {
            debug.showNotice(`CRITICAL: Plugin "${trueId}" failed to load. Check Developer Console.`, 15000);
            debug.error(`The enable or polling process failed for '${trueId}'.`, "PDS", e);
        } finally {
            // Re-evaluate status after toggle to ensure UI reflects actual state
            setDeploymentStatus(getPluginStatus(pluginId));
            setIsLoading(false);
            setTimeout(() => originalTarget?.focus({ preventScroll: true }), 50);
        }
    }, [getTruePluginId, getPluginStatus, pollForPluginState, debugNoticeManager]);


    // This MUST be a const function for the AutoBuildManager to use it
    const handleBuildAndDeploy = useCallback(async (pluginId, event) => {
        const debug = debugNoticeManager.current || { log: () => { }, showNotice: new Notice, error: console.error };
        // Cancel any pending hot reloads for this plugin if a full build is happening
        if (hotReloadManager.current) {
            hotReloadManager.current.cancel(pluginId);
        }

        isFileOpLockRef.current = true; // Set a lock for file operations (prevents watchers)
        const originalTarget = event?.currentTarget;
        setIsLoading(true);

        const trueId = getTruePluginId(pluginId);
        const buildConfig = getBuildConfigForPlugin(pluginId);

        try {
            const wasEnabled = !!dc.app.plugins.plugins[trueId]; // Capture enabled state BEFORE undeploy
            const baseSourceDir = nodeManager.join(pdsPluginsDir, pluginId);
            const deployedPluginDir = nodeManager.join(obsidianPluginsDir, pluginId);

            // Step 1: Ensure dependencies are installed
            if (!nodeManager.exists(nodeManager.join(baseSourceDir, 'node_modules'))) {
                debug.log(`node_modules not found for '${pluginId}'. Installing dependencies...`, "Build");
                await runCommandInPluginDir(pluginId, 'install', 'Installing Dependencies');
            }

            // Step 2: Cleanly undeploy the existing version if it exists
            if (nodeManager.exists(deployedPluginDir)) {
                debug.log(`Plugin '${pluginId}' deployed. Undeploying for clean rebuild.`, "Build");
                await handleUndeploy(pluginId, true); // Silent undeploy
            } else {
                debug.log(`Plugin '${pluginId}' not found in deployed folder, skipping undeploy.`, "Build");
            }

            // Step 3: Build the plugin
            await runCommandInPluginDir(pluginId, 'build', 'Building Plugin');

            // Step 4: Deploy the built files to Obsidian's plugins directory
            const effectiveSourceDir = nodeManager.join(baseSourceDir, buildConfig.outputDir);
            const targetDir = nodeManager.join(obsidianPluginsDir, pluginId);
            nodeManager.makeDir(targetDir);

            // Core files that should always be copied, excluding data.json from this initial list
            // as data.json requires special handling to preserve user settings.
            const pathsToSync = [...new Set([...DEFAULT_BUILD_CONFIG.syncPaths, ...buildConfig.syncPaths])];

            for (const syncPath of pathsToSync) {
                const sourcePath = nodeManager.join(effectiveSourceDir, syncPath);
                const destPath = nodeManager.join(targetDir, nodeManager.basename(syncPath));
                if (nodeManager.exists(sourcePath)) {
                    const stats = nodeManager.getStats(sourcePath);
                    if (stats) {
                        stats.isDirectory() ? nodeManager.copyDirRecursive(sourcePath, destPath) : nodeManager.copyFile(sourcePath, destPath);
                        debug.log(`Copied: ${syncPath} to ${destPath}`, "Build");
                    }
                } else {
                    debug.log(`Skipped: ${syncPath} not found in build output.`, "Build");
                }
            }

            // --- IMPORTANT FIX: Handle data.json separately to preserve user settings ---
            const deployedDataJsonPath = nodeManager.join(targetDir, 'data.json');
            if (!nodeManager.exists(deployedDataJsonPath)) {
                // Only create an empty data.json if it does NOT already exist in the deployed plugin.
                // This preserves existing user settings across builds.
                nodeManager.writeFile(deployedDataJsonPath, '{}');
                debug.log(`Created empty data.json at ${deployedDataJsonPath}`, "Build");
            } else {
                debug.log(`Existing data.json at ${deployedDataJsonPath} preserved.`, "Build");
            }
            // --- END IMPORTANT FIX ---


            // The following line for `sourceMainJsPath` was potentially problematic if `effectiveSourceDir`
            // was meant to be the *source* folder and not the *build output* folder.
            // If main.js is part of `syncPaths`, it's already copied. Removing it from `effectiveSourceDir`
            // (which is the *output* directory) is usually not needed or can be part of a `clean` build step.
            // Keeping it commented for now as it doesn't directly solve the user's current issue.
            // const sourceMainJsPath = nodeManager.join(effectiveSourceDir, 'main.js');
            // if (nodeManager.exists(sourceMainJsPath)) nodeManager.remove(sourceMainJsPath);

            // Step 5: Reload Obsidian's plugin manifests
            await dc.app.plugins.loadManifests();
            const newTrueId = getTruePluginId(pluginId); // Re-evaluate trueId after manifests load

            // Step 6: Re-enable the plugin if it was enabled before the build
            if (wasEnabled) {
                setDeploymentStatus('LOADING'); // Show intermediate status
                try {
                    await dc.app.plugins.enablePluginAndSave(newTrueId);
                    await pollForPluginState(newTrueId, 'loaded');
                    debug.showNotice(`Plugin "${newTrueId}" built, deployed, and reloaded.`);
                } catch (err) {
                    debug.showNotice(`Plugin deployed but failed to start. Check Developer Console.`, 10000);
                    debug.error(`Plugin deployed but failed to start for '${newTrueId}':`, "Build", err);
                }
            } else {
                debug.showNotice(`Plugin "${newTrueId}" built and deployed successfully.`);
            }
        } catch (error) {
            debug.showNotice(`Build process failed: ${error.message}.`, 8000);
            debug.error(`Build process failed for ${pluginId}:`, "Build", error);
        } finally {
            // Ensure final status update and UI reset
            await dc.app.plugins.loadManifests(); // Final refresh
            setDeploymentStatus(getPluginStatus(pluginId));
            setIsLoading(false);
            setTimeout(() => originalTarget?.focus({ preventScroll: true }), 50);

            // Release the file operation lock AFTER a small delay to allow event system to settle
            setTimeout(() => {
                isFileOpLockRef.current = false;
            }, 500);
        }
    }, [nodeBinPath, isAutoBuildEnabled, getTruePluginId, pollForPluginState, getPluginStatus, runCommandInPluginDir, handleUndeploy, nodeManager, pdsPluginsDir, obsidianPluginsDir, debugNoticeManager]);

    // NEW REF for handleBuildAndDeploy and useEffect to keep it updated
    const handleBuildAndDeployRef = useRef(handleBuildAndDeploy);
    useEffect(() => {
        handleBuildAndDeployRef.current = handleBuildAndDeploy;
    }, [handleBuildAndDeploy]);

    const handleCreatePlugin = async () => {
        const debug = debugNoticeManager.current || { showNotice: new Notice, error: console.error };
        const pluginId = newPluginId.trim();
        const name = newPluginName.trim();
        const author = newPluginAuthor.trim();
        const url = templateUrl.trim();

        if (!pluginId || !name || !url) {
            debug.showNotice("Plugin ID, Name, and Template URL are required.");
            return;
        }

        const pluginPath = nodeManager.join(pdsPluginsDir, pluginId);
        if (nodeManager.exists(pluginPath)) {
            debug.showNotice(`A plugin with ID "${pluginId}" already exists.`);
            return;
        }

        setIsCreatorOpen(false);
        isFileOpLockRef.current = true; // Set lock during creation process

        try {
            showProcessNotice('Cloning template from repository...');

            await new Promise((resolve, reject) => {
                const proc = nodeManager.spawnProcess('git', ['clone', url, pluginId], { cwd: pdsPluginsDir, shell: true });
                proc.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Git clone failed. Check URL and if Git is installed.`));
                });
                proc.on('error', (err) => reject(new Error("Failed to start 'git' command.")));
            });

            hideProcessNotice();
            debug.showNotice(`Template cloned. Configuring project: "${name}"...`);

            nodeManager.remove(nodeManager.join(pluginPath, '.git'));
            const pluginClassName = pluginId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');

            const manifestPath = nodeManager.join(pluginPath, 'manifest.json');
            if (nodeManager.exists(manifestPath)) {
                let m = nodeManager.readJson(manifestPath);
                if (m) {
                    m.id = pluginId; m.name = name; m.author = author || 'Unknown'; m.version = "1.0.0";
                    nodeManager.writeJson(manifestPath, m);
                }
            }

            const pkgPath = nodeManager.join(pluginPath, 'package.json');
            if (nodeManager.exists(pkgPath)) {
                let p = nodeManager.readJson(pkgPath);
                if (p) {
                    p.name = pluginId; p.description = `Plugin: ${name}`; p.author = author || 'Unknown'; p.version = "1.0.0";
                    nodeManager.writeJson(pkgPath, p);
                }
            }

            const mainTsPath = nodeManager.join(pluginPath, 'main.ts');
            if (nodeManager.exists(mainTsPath)) {
                let content = nodeManager.readFile(mainTsPath);
                const classMatch = content.match(/class\s+(\w+)\s+extends\s+Plugin/);
                if (classMatch && classMatch[1]) {
                    const originalClassName = classMatch[1];
                    const replaceRegex = new RegExp(originalClassName, 'g');
                    content = content.replace(replaceRegex, pluginClassName);
                    nodeManager.writeFile(mainTsPath, content);
                } else {
                    debug.log("[PDS] Could not find a plugin class declaration in main.ts to replace.", "Create");
                }
            }

            await runCommandInPluginDir(pluginId, 'install', 'Installing Dependencies');
            debug.showNotice(`Plugin "${name}" is ready for development.`);

        } catch (e) {
            hideProcessNotice();
            debug.showNotice(e.message, 10000);
            debug.error("Plugin creation error:", "PDS", e);
        } finally {
            await scanPlugins();
            setNewPluginId(''); setNewPluginIdName(''); setNewPluginAuthor(''); setTemplateType('default');
            isFileOpLockRef.current = false; // Release lock
        }
    };

    const handleClonePlugin = async () => {
        const debug = debugNoticeManager.current || { showNotice: new Notice, error: console.error };
        const url = newPluginUrl.trim();
        if (!url) { debug.showNotice("Repository URL is required."); return; }

        const repoNameMatch = url.match(/([^/]+)\.git$/) || url.match(/([^/]+)$/);
        if (!repoNameMatch) { debug.showNotice("Could not determine a repository name from the URL."); return; }
        const repoName = repoNameMatch[1];
        const targetPath = nodeManager.join(pdsPluginsDir, repoName);

        if (nodeManager.exists(targetPath)) { debug.showNotice(`A plugin folder named "${repoName}" already exists.`); return; }

        setIsClonerOpen(false);
        isFileOpLockRef.current = true; // Set lock

        try {
            showProcessNotice(`Cloning "${repoName}"...`);

            await new Promise((resolve, reject) => {
                const proc = nodeManager.spawnProcess('git', ['clone', url, repoName], { cwd: pdsPluginsDir, shell: true });
                let stderr = '';
                proc.stderr.on('data', (data) => stderr += data.toString());
                proc.on('close', (code) => {
                    if (code === 0) { resolve(); } else { debug.error(`Git clone failed:\n${stderr}`, "Clone"); reject(new Error(`Git clone failed. Check if Git is installed and the URL is correct.`)); }
                });
                proc.on('error', (err) => { reject(new Error(`Failed to start 'git' command. Is Git in your PATH?`)); });
            });

            hideProcessNotice();
            debug.showNotice(`"${repoName}" cloned successfully. Installing dependencies...`);

            await runCommandInPluginDir(repoName, 'install', 'Installing Dependencies');

            await scanPlugins();
            debug.showNotice(`Plugin "${repoName}" is ready for development.`);

        } catch (e) {
            hideProcessNotice();
            debug.showNotice(e.message, 10000);
            debug.error("Plugin clone error:", "PDS", e);
        } finally {
            setNewPluginUrl('');
            isFileOpLockRef.current = false; // Release lock
        }
    };

    const executeDeleteSourceOnly = async (pluginId) => {
        const debug = debugNoticeManager.current || { showNotice: new Notice, error: console.error };
        setIsLoading(true);
        isFileOpLockRef.current = true;
        try {
            nodeManager.remove(nodeManager.join(pdsPluginsDir, pluginId));
            removeManagedPluginId(pluginId); // Remove from managed list
            await scanPlugins();
            if (selectedPluginId === pluginId) setView('dashboard');
            debug.showNotice(`Plugin source for "${pluginId}" deleted.`);
        } catch (e) {
            debug.showNotice("Error deleting plugin source.");
            debug.error("Plugin source delete error:", "PDS", e);
        } finally {
            setIsLoading(false);
            // FIX: Delay release of file operation lock
            setTimeout(() => { isFileOpLockRef.current = false; }, 500);
        }
    };
    const executeDeleteAll = async (pluginId) => {
        const debug = debugNoticeManager.current || { showNotice: new Notice, error: console.error };
        setIsLoading(true);
        isFileOpLockRef.current = true;
        try {
            await handleUndeploy(pluginId, true); // Silent undeploy
            nodeManager.remove(nodeManager.join(pdsPluginsDir, pluginId));
            removeManagedPluginId(pluginId); // Remove from managed list
            await scanPlugins();
            if (selectedPluginId === pluginId) setView('dashboard');
            debug.showNotice(`Completely removed plugin "${pluginId}".`);
        } catch (e) {
            debug.showNotice("Error completely removing plugin.");
            debug.error("Full plugin removal error:", "PDS", e);
        } finally {
            setIsLoading(false);
            // FIX: Delay release of file operation lock
            setTimeout(() => { isFileOpLockRef.current = false; }, 500);
        }
    };

    const handleInitializeRepo = async () => {
        const debug = debugNoticeManager.current || { showNotice: new Notice };
        if (!selectedPlugin) return;
        if (confirm(`This will create a new Git repository in the "${selectedPlugin.id}" source folder. Continue?`)) {
            await git.init();
            debug.showNotice(`Repository initialized for ${selectedPlugin.id}.`);
        }
    };

    const promptForRemote = () => {
        const debug = debugNoticeManager.current || { showNotice: new Notice };
        if (!selectedPlugin) return;
        setPromptConfig({
            title: "Configure Remote Repository",
            description: "Enter the full HTTPS or SSH Git URL for your repository.",
            inputs: [{ label: "Repository URL", placeholder: "https://github.com/user/repo.git", value: git.remoteUrl }],
            onSubmit: (values) => {
                const [url] = values;
                if (url && url.trim()) {
                    git.setRemote(url.trim());
                    debug.showNotice("Remote repository set.");
                }
            }
        });
        setIsPromptOpen(true);
    };

    const handleOpenInIde = useCallback((pluginId, bypassPrompt = false) => {
        const debug = debugNoticeManager.current || { showNotice: new Notice, error: console.error };
        const ideCommand = getIdeCommand();
        if (!ideCommand && !bypassPrompt) { promptForIdeCommand(pluginId); return; }

        const pluginPath = nodeManager.join(pdsPluginsDir, pluginId);
        if (!nodeManager.exists(pluginPath)) { debug.showNotice(`Error: Directory not found at path: ${pluginPath}`, 8000); return; }

        const platform = nodeManager.platform;
        let command;
        let args;
        const isTerminalEditor = ['nvim', 'neovim', 'vim'].includes(ideCommand.toLowerCase());

        if (isTerminalEditor) {
            if (platform === 'win32') { command = 'start'; args = ['cmd', '/C', `cd /d "${pluginPath}" && ${ideCommand}`]; }
            else if (platform === 'darwin') { command = 'osascript'; args = ['-e', `tell application "Terminal" to do script "cd '${pluginPath.replace(/'/g, "'\\''")}' && ${ideCommand}"\n tell application "Terminal" to activate`]; }
            else { command = 'x-terminal-emulator'; args = ['-e', `sh -c "cd '${pluginPath.replace(/'/g, "'\\''")}'; ${ideCommand}; exec sh"`]; }
        } else {
            if (platform === 'win32') { command = ideCommand; args = [pluginPath]; }
            else { command = '/bin/sh'; args = ['-l', '-c', `${ideCommand} "${pluginPath}"`]; }
        }

        const options = { detached: !isTerminalEditor, shell: platform === 'win32' || isTerminalEditor };
        debug.log(`Spawning External IDE with options: ${JSON.stringify({ command, args, options })}`, "PDS");
        debug.showNotice(`Running: ${command} ${args.join(' ')}`, 6000);

        const proc = nodeManager.spawnProcess(command, args, options);

        proc.on('error', (err) => {
            debug.error("FATAL: Process spawn failed.", "PDS", err);
            debug.showNotice(`Error: Failed to start command '${ideCommand}'. Is it in your PATH?`, 8000);
            if (!isTerminalEditor) setTimeout(() => promptForIdeCommand(pluginId), 500);
        });
        if (!isTerminalEditor) proc.unref();
    }, [nodeManager, pdsPluginsDir, debugNoticeManager]);

    const handleOpenInExplorer = useCallback((pluginId) => {
        const debug = debugNoticeManager.current || { showNotice: new Notice, error: console.error, log: console.log };
        const pluginPath = nodeManager.join(pdsPluginsDir, pluginId);

        if (!nodeManager.exists(pluginPath)) {
            debug.showNotice("Plugin source directory not found.");
            return;
        }

        const platform = nodeManager.platform;
        let command;
        let args;

        // --- THE FIX ---
        // The path must be wrapped in double quotes to handle spaces in folder names.
        // We pass the path as a single argument that includes the quotes.
        const quotedPath = `"${pluginPath}"`;

        if (platform === 'win32') {
            // Windows Explorer is a bit strange. It works best when the command and
            // the quoted path are passed directly.
            command = 'explorer';
            args = [quotedPath];
        } else if (platform === 'darwin') {
            // On macOS, `open` handles the quoted path correctly.
            command = 'open';
            args = [quotedPath];
        } else {
            // On Linux, `xdg-open` also handles the quoted path.
            command = 'xdg-open';
            args = [quotedPath];
        }

        debug.log(`Executing command: ${command} with args: ${args.join(' ')}`);

        // Using shell:true is crucial here because it allows the shell
        // to correctly interpret the quotes around the path.
        const proc = nodeManager.spawnProcess(command, args, { shell: true });
        let errorOutput = '';

        proc.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        proc.on('error', (err) => {
            debug.error(`Process failed to spawn for command: '${command}'`, "PDS", err);
            debug.showNotice(`Error: Failed to start file explorer.`, 8000);
        });

        proc.on('close', (code) => {
            if (code !== 0) {
                debug.error(`Process for opening explorer exited with code: ${code}.`, "PDS");
                debug.error(`Error Details from shell:\n${errorOutput}`, "PDS");
                debug.showNotice(`Could not open folder. See developer console for details.`, 10000);
            } else {
                debug.showNotice(`Opening "${pluginId}" in file explorer...`);
            }
        });

    }, [nodeManager, pdsPluginsDir, debugNoticeManager]);

    const handleNavigateToCodeEditor = useCallback((pluginId) => { setView('code_editor'); }, []);

    const promptForIdeCommand = useCallback((pluginIdToOpenAfter = null) => {
        const debug = debugNoticeManager.current || { showNotice: new Notice };
        const currentCmd = getIdeCommand() || '';
        setPromptValues([currentCmd]);
        setPromptConfig({
            title: "Configure Your Code Editor",
            description: "Enter the command used to launch your editor from the terminal (e.g., 'code', 'cursor', 'nvim'). This must be in your system's PATH.",
            helpText: (
                <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--background-primary)', borderRadius: '6px', border: '1px solid var(--background-modifier-border)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em' }}>Editor Setup Guide:</h4>
                    <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                        For GUI editors like <strong>Cursor, VS Code, or VSCodium</strong>, you may need to install the command-line tool from within the editor itself:
                    </p>
                    <ol style={{ fontSize: '0.85em', margin: '8px 0 0 20px', padding: 0, color: 'var(--text-muted)' }}>
                        <li style={{ marginBottom: '4px' }}>Open your code editor (e.g., Cursor).</li>
                        <li style={{ marginBottom: '4px' }}>Open the Command Palette: <code style={{ backgroundColor: 'var(--background-modifier-hover)', padding: '2px 4px', borderRadius: '3px' }}>Cmd+Shift+P</code> (macOS) or <code style={{ backgroundColor: 'var(--background-modifier-hover)', padding: '2px 4px', borderRadius: '3px' }}>Ctrl+Shift+P</code> (Windows/Linux).</li>
                        <li>Search for and run <strong>"Install 'cursor' command in PATH"</strong> (or 'code' for VS Code).</li>
                    </ol>
                    <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', margin: '16px 0 0 0', lineHeight: 1.6, paddingTop: '12px', borderTop: '1px solid var(--background-modifier-border)' }}>
                        For terminal editors like <strong>Neovim</strong>, simply enter <code style={{ backgroundColor: 'var(--background-modifier-hover)', padding: '2px 4px', borderRadius: '3px' }}>nvim</code>. A new terminal window will be opened for you automatically.
                    </p>
                </div>
            ),
            inputs: [{ label: "Editor Shell Command", placeholder: "cursor" }],
            onSubmit: (values) => {
                const [cmd] = values;
                if (!cmd || !cmd.trim()) { debug.showNotice("Command cannot be empty."); return; }
                const trimmedCmd = cmd.trim();
                setIdeCommand(trimmedCmd);
                debug.showNotice(`Editor command set to '${trimmedCmd}'!`, 4000);
                if (pluginIdToOpenAfter) { handleOpenInIde(pluginIdToOpenAfter, true); }
            }
        });
        setIsPromptOpen(true);
    }, [getIdeCommand, handleOpenInIde, debugNoticeManager]);

    const handlePromptChange = useCallback((index, value) => { const newValues = [...promptValues]; newValues[index] = value; setPromptValues(newValues); }, [promptValues]);
    const handlePromptSubmit = useCallback(() => { if (promptConfig?.onSubmit) promptConfig.onSubmit(promptValues); handlePromptClose(); }, [promptConfig, promptValues]);
    const handlePromptClose = useCallback(() => { setIsPromptOpen(false); setPromptConfig(null); setPromptValues([]); }, []);


    // =================================================================================
    // LIFECYCLE & EFFECTS
    // =================================================================================

    // --- EFFECT: Initialize Managers on Mount (Prevents ReferenceError) ---
    useEffect(() => {
        // 1. Init Debug Manager first (it has no dependencies)
        debugNoticeManager.current = new DebugNoticeManager({
            isDebugModeEnabledRef: isDebugModeEnabledRef,
        });

        // 2. Init Watcher Managers (They depend on the Debug Manager)
        hotReloadManager.current = new HotReloadManager({
            dc, nodeManager, isFileOpLockRef, scanPlugins, getTruePluginId, pollForPluginState,
            debug: debugNoticeManager.current,
        });

        autoBuildManager.current = new AutoBuildManager({
            dc, nodeManager, isFileOpLockRef,
            handleBuildAndDeployRef: handleBuildAndDeployRef,
            isAutoBuildEnabledRef,
            isProcessRunningRef,
            debug: debugNoticeManager.current,
        });

        // 3. Start watchers based on initial UI state
        if (isHotReloadEnabled) hotReloadManager.current.start();
        if (isAutoBuildEnabled) autoBuildManager.current.start();

        // The single, definitive cleanup function for when the component unmounts.
        return () => {
            if (hotReloadManager.current) hotReloadManager.current.stop();
            if (autoBuildManager.current) autoBuildManager.current.stop();
            hideProcessNotice(); // Ensure any persistent notices are dismissed
            terminalManager.killAllTerminals();
        };
    }, []); // Empty dependency array. Runs ONLY ONCE.

    // --- Sync UI State to Manager Refs ---
    // These effects keep the manager's internal refs updated with React's state
    useEffect(() => { isAutoBuildEnabledRef.current = isAutoBuildEnabled; }, [isAutoBuildEnabled]);
    useEffect(() => { isProcessRunningRef.current = isProcessRunning; }, [isProcessRunning]);
    useEffect(() => { isDebugModeEnabledRef.current = isDebugModeEnabled; }, [isDebugModeEnabled]);


    // --- Effect for the Hot Reload toggle ---
    useEffect(() => {
        if (!hotReloadManager.current) return; // Guard for initialization
        if (isHotReloadEnabled) {
            hotReloadManager.current.start();
        } else {
            hotReloadManager.current.stop();
        }
    }, [isHotReloadEnabled]);

    // --- Effect for the Auto Build toggle ---
    useEffect(() => {
        if (!autoBuildManager.current) return; // Guard for initialization
        if (isAutoBuildEnabled) {
            autoBuildManager.current.start();
        } else {
            autoBuildManager.current.stop();
        }
    }, [isAutoBuildEnabled]);

    // --- EFFECT TO FIND NODE's BINARY DIRECTORY ONCE ON LOAD (CROSS-PLATFORM & ROBUST) ---
    useEffect(() => {
        const debug = debugNoticeManager.current || { error: console.error };
        const findNodePath = () => new Promise((resolve, reject) => {
            const platform = nodeManager.platform;
            let command;
            let args;
            if (platform === 'win32') { command = 'where'; args = ['node']; } else { command = '/bin/sh'; args = ['-l', '-c', 'which node']; }
            const child = nodeManager.spawnProcess(command, args, { shell: platform === 'win32' });
            let pathOutput = '';
            child.stdout.on('data', (data) => pathOutput += data.toString());
            child.stderr.on('data', (data) => debug.error(`stderr from findNodePath: ${data.toString()}`, "Node Path"));
            child.on('close', (code) => {
                if (code === 0 && pathOutput.trim()) { resolve(pathOutput.trim().split(nodeManager.EOL)[0]); }
                else { reject(new Error('`node` not found in system or shell PATH.')); }
            });
            child.on('error', (err) => reject(err));
        });

        findNodePath().then(fullPath => {
            setNodeBinPath(nodeManager.dirname(fullPath));
            setNodePathStatus('found');
        }).catch(err => {
            debug.error("Error finding Node.js:", "PDS", err);
            setNodePathStatus('not_found');
        });
    }, [nodeManager, debugNoticeManager]);

    // --- ADDED: Effect to update the Git hook's path when a plugin is selected ---
    useEffect(() => {
        if (view === 'plugin_details' && selectedPluginId) {
            git.setRepoPath(nodeManager.join(pdsPluginsDir, selectedPluginId));
        }
    }, [view, selectedPluginId, git, nodeManager, pdsPluginsDir]);

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
            if (!stateRefs.originalParent) return;
            if (stateRefs.placeholder?.parentNode) { stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder); } else { stateRefs.originalParent.appendChild(container); }
            if (stateRefs.parentPositionInfo?.element) { stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || ''; }
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach(key => stateRefs[key] = null);
        };
    }, [isFullTab, stateRefs]);

    // --- Initial Scan ---
    useEffect(() => {
        const debug = debugNoticeManager.current || { log: console.log };
        let hasRun = false;
        const runInitialScan = () => {
            if (hasRun) return;
            hasRun = true;
            // Add a final "settling" delay after onLayoutReady fires,
            // as plugin loading might not be fully complete immediately.
            setTimeout(() => {
                debug.log("Workspace is ready and settled. Performing initial, reliable plugin scan...", "PDS");
                scanPlugins();
            }, 500); // 500ms should be more than enough settling time.
        };
        dc.app.workspace.onLayoutReady(runInitialScan);
        return () => { dc.app.workspace.off('layout-ready', runInitialScan); };
    }, [scanPlugins, debugNoticeManager]); // Depend on scanPlugins to ensure correct function reference

    // --- Dashboard Scan ---
    useEffect(() => {
        const debug = debugNoticeManager.current || { log: console.log };
        if (view === 'dashboard') {
            debug.log(`DASHBOARD OPENED. Current 'enabledPlugins' state:`, "PDS", dc.app.plugins.enabledPlugins);
            scanPlugins();
        }
    }, [view, scanPlugins, debugNoticeManager]);

    // =================================================================================
    // RENDER LOGIC AND STYLES
    // =================================================================================

    // --- STYLES (Used by all render functions) ---
    const STYLES = {
        wrapper: { backgroundColor: '#000000', color: '#ffffff', fontFamily: 'monospace', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative' },
        exitIcon: { position: "fixed", top: "15px", right: "20px", fontFamily: "monospace", fontSize: "14px", color: '#8b5cf6', userSelect: "none", cursor: "pointer", opacity: 0, transform: "scale(0.9)", transition: "opacity 0.2s, transform 0.2s", zIndex: 10000, backgroundColor: '#0a0a0a', padding: '8px 12px', borderRadius: '6px', border: '1px solid #8b5cf6' },
        hoverEffectStyle: `.${uniqueWrapperClass}:hover .pds-exit-icon { opacity: 1; transform: scale(1); box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);}`,
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', paddingBottom: '16px', borderBottom: '1px solid #1a1a1a', flexShrink: 0, backgroundColor: '#000000' },
        button: { padding: '10px 18px', fontSize: '14px', fontWeight: '600', backgroundColor: '#8b5cf6', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '8px' },
        buttonSecondary: { backgroundColor: '#0a0a0a', color: '#e0e0e0', border: '1px solid #1a1a1a' },
        buttonDanger: { backgroundColor: '#ef4444', color: '#ffffff', border: 'none' },
        buttonSmall: { padding: '6px 12px', fontSize: '12px' },
        section: { flex: 1, overflowY: 'auto', padding: '24px', paddingTop: 0, display: 'flex', flexDirection: 'column', minHeight: 0, backgroundColor: '#000000' },
        sectionTitle: { fontSize: '1.1em', fontWeight: '600', color: '#8b5cf6', marginBottom: '16px', borderBottom: '1px solid #1a1a1a', paddingBottom: '8px', marginTop: '24px', display: 'flex', alignItems: 'center', gap: '10px' },
        pluginGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
        pluginCard: { backgroundColor: '#0a0a0a', padding: '20px', borderRadius: '8px', border: '1px solid #1a1a1a', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' },
        pluginCardName: { fontSize: '1.2em', fontWeight: '600', color: '#ffffff', marginBottom: '8px' },
        pluginCardId: { fontSize: '0.85em', color: '#666', fontFamily: 'monospace' },
        pluginCardStatus: { position: 'absolute', top: '16px', right: '16px', fontSize: '0.7em', padding: '6px 10px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' },
        detailHeader: { display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '16px' },
        backButton: { fontSize: '1.4em', cursor: 'pointer', color: '#8b5cf6', transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center' },
        detailTitle: { fontSize: '2em', margin: 0, color: '#ffffff', fontWeight: '700' },
        detailActions: { marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' },
        modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 },
        modalContent: { backgroundColor: '#0a0a0a', padding: '28px', borderRadius: '8px', border: '1px solid #8b5cf6', width: '500px', maxWidth: '90vw', boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)' },
        modalTitle: { fontSize: '1.5em', margin: 0, marginBottom: '20px', color: '#ffffff', fontWeight: '700' },
        input: { width: '100%', padding: '12px', boxSizing: 'border-box', backgroundColor: '#000000', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#ffffff', marginBottom: '16px', fontFamily: 'monospace', fontSize: '14px' },
        select: { width: '100%', padding: '12px', boxSizing: 'border-box', backgroundColor: '#000000', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#ffffff', marginBottom: '16px', fontSize: '14px', height: '48px', appearance: 'none', fontFamily: 'monospace' },
        inputGroup: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' },
        compactWrapper: { textAlign: 'center', padding: '20px', border: '1px solid #1a1a1a', borderRadius: '8px', backgroundColor: '#0a0a0a' },
        compactText: { marginBottom: '12px', color: '#666' },
        buildLogPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '250px', backgroundColor: '#0a0a0a', borderTop: '2px solid #8b5cf6', display: 'flex', flexDirection: 'column', zIndex: 9999 },
        buildLogHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#000000', borderBottom: '1px solid #1a1a1a' },
        buildLogContent: { flex: 1, fontFamily: 'monospace', fontSize: '12px', color: '#e0e0e0', backgroundColor: '#000000', padding: '12px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.5' },
        errorBanner: { padding: '16px', backgroundColor: '#1a0a0a', color: '#ef4444', borderRadius: '6px', border: '1px solid #ef4444', fontSize: '0.9em', lineHeight: 1.6, marginBottom: '16px', fontFamily: 'monospace' },
        infoBanner: { padding: '16px', backgroundColor: '#0f0a1a', color: '#8b5cf6', borderRadius: '6px', border: '1px solid #8b5cf6', fontSize: '0.9em', lineHeight: 1.6, marginBottom: '16px', fontFamily: 'monospace' },
        iconWrapper: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' },
    };

    const selectedPlugin = plugins.find(p => p.id === selectedPluginId);
    const getStatusStyle = (status) => ({ 
        ENABLED: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }, 
        DISABLED: { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }, 
        SOURCE: { backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' },
        NOT_DEPLOYED: { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: '1px solid rgba(107, 114, 128, 0.3)' }
    }[status] || {});

    const renderBuildLogPanel = () => (
        <div style={STYLES.buildLogPanel}>
            <div style={STYLES.buildLogHeader}>
                <span>Build Log</span>
                <button style={{ ...STYLES.buttonSmall }} onClick={() => setIsBuildLogVisible(false)}>Close</button>
            </div>
            <pre style={STYLES.buildLogContent}>{buildLog}</pre>
        </div>
    );

    const renderPluginDetails = () => {
        if (!selectedPlugin) return null;
        const [isEditingManifest, setIsEditingManifest] = useState(false);
        const [manifestData, setManifestData] = useState(null);
        const [editableManifest, setEditableManifest] = useState({});
        const [isBuildConfigOpen, setIsBuildConfigOpen] = useState(false);

        const debug = debugNoticeManager.current || { showNotice: new Notice, error: console.error };

        const RESOURCES = [
            { label: "Official Plugin Docs", description: "The primary source for getting started with Obsidian plugin development.", url: "https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin", icon: "book-open" },
            { label: "Plugin Self-Critique Checklist", description: "A guide to review your plugin against community best practices before release.", url: "https://docs.obsidian.md/oo/plugin", icon: "clipboard-check" },
            { label: "Developer Community", description: "Join the official Discord server to chat with other developers in the #plugins channel.", url: "https://discord.gg/obsidianmd", icon: "message-circle" },
            { label: "Obsidian Developer Forum", description: "Ask questions, share your work, and find help on the official community forum.", url: "https://forum.obsidian.md/c/developers-api/", icon: "users" }
        ];
        const resourceCardStyle = { ...STYLES.pluginCard, textDecoration: 'none', color: 'inherit' };
        const resourceCardTitleStyle = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1em', fontWeight: '600', color: '#ffffff', marginBottom: '8px' };
        const resourceCardDescriptionStyle = { fontSize: '0.9em', color: '#999', lineHeight: 1.5 };

        // This useEffect is updated to also set deploymentStatus
        useEffect(() => {
            if (selectedPlugin) {
                const manifestPath = nodeManager.join(pdsPluginsDir, selectedPlugin.id, 'manifest.json');
                if (nodeManager.exists(manifestPath)) {
                    try { const manifest = nodeManager.readJson(manifestPath); setManifestData(manifest); setEditableManifest(manifest); } catch (e) { debug.error(`Failed to parse manifest for ${selectedPlugin.id}:`, "PDS", e); setManifestData(null); }
                } else { setManifestData(null); }

                // FIX: Update deploymentStatus when selectedPlugin changes
                setDeploymentStatus(getPluginStatus(selectedPlugin.id));
            }
        }, [selectedPlugin, nodeManager, pdsPluginsDir, debug, getPluginStatus, setDeploymentStatus]);

        const handleManifestChange = (key, value) => { setEditableManifest(prev => ({ ...prev, [key]: value })); };
        const handleSaveManifest = () => {
            if (!selectedPlugin) return;
            const manifestPath = nodeManager.join(pdsPluginsDir, selectedPlugin.id, 'manifest.json');
            try { nodeManager.writeJson(manifestPath, editableManifest); setManifestData(editableManifest); setIsEditingManifest(false); debug.showNotice('Manifest saved successfully!'); scanPlugins(); } catch (e) { debug.error('Failed to save manifest:', "PDS", e); debug.showNotice('Error saving manifest. Check console for details.'); }
        };
        // FIX: Add 'SOURCE' to statusStyles for consistency in the details view
        const statusStyles = {
            NOT_DEPLOYED: { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: '1px solid rgba(107, 114, 128, 0.3)' },
            ENABLED: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' },
            DISABLED: { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' },
            SOURCE: { backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' },
            LOADING: { backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' }
        };
        const isNodeReady = nodePathStatus === 'found';
        const renderNodeStatus = () => {
            if (nodePathStatus === 'finding') return (
                <div style={STYLES.infoBanner}>
                    <dc.Icon icon="loader" /> Searching for Node.js installation...
                </div>
            );
            if (nodePathStatus === 'not_found') return (
                <div style={STYLES.errorBanner}>
                    <dc.Icon icon="alert-triangle" /> <strong>Action Required:</strong> Node.js was not found. Please install it to use build and deploy features.
                </div>
            );
            return null;
        };
        const renderSourceControl = () => {
            if (git.isLoading) { return <p style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}><dc.Icon icon="loader" /> Loading Git status...</p> }
            if (!git.isRepo) { return (<div style={{ textAlign: 'center', padding: '16px' }}> <p style={{ margin: '0 0 12px 0', color: '#666' }}>This plugin is not a Git repository.</p> <button style={STYLES.button} onClick={handleInitializeRepo} disabled={git.isProcessing}><dc.Icon icon="git-branch" /> Initialize Repository</button> </div>); }
            return (<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}> <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}> <div style={{ overflow: 'hidden' }}> <strong style={{ color: '#8b5cf6' }}>Remote:</strong> <code style={{ marginLeft: '8px', opacity: git.remoteUrl ? 1 : 0.5, fontStyle: git.remoteUrl ? 'normal' : 'italic', color: '#e0e0e0' }}> {git.remoteUrl || 'Not configured'} </code> </div> <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={promptForRemote} disabled={git.isProcessing}><dc.Icon icon="settings" /> Configure</button> </div> <div style={{ display: 'flex', gap: '10px' }}> <button style={{ ...STYLES.button, ...STYLES.buttonSecondary, flex: 1 }} onClick={git.pull} disabled={!git.remoteUrl || git.isProcessing}><dc.Icon icon="download" /> Pull ({git.behind})</button> <button style={{ ...STYLES.button, flex: 1 }} onClick={git.push} disabled={!git.remoteUrl || git.isProcessing || git.ahead === 0}><dc.Icon icon="upload" /> Push ({git.ahead})</button> <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={git.refresh} disabled={git.isProcessing} title="Refresh Git Status"> <dc.Icon icon="refresh-cw" /> </button> </div> {git.error && <p style={{ color: '#ef4444', fontSize: '0.9em', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}><dc.Icon icon="alert-circle" /> {git.error}</p>} </div>);
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                {isBuildConfigOpen && renderBuildConfigModal({ onClose: () => setIsBuildConfigOpen(false) })}
                <div style={STYLES.header}>
                    <div style={STYLES.detailHeader}> 
                        <span style={STYLES.backButton} onClick={() => setView('dashboard')}>
                            <dc.Icon icon="arrow-left" />
                        </span> 
                        <h1 style={STYLES.detailTitle}>{selectedPlugin.name}</h1> 
                    </div>
                    <button style={{ ...STYLES.button, ...STYLES.buttonDanger, marginTop: '16px' }} onClick={() => setIsDeleteModalOpen(true)} disabled={isLoading || isProcessRunning}>
                        <dc.Icon icon="trash-2" /> Delete Source
                    </button>
                </div>
                <div style={STYLES.section}>
                    {renderNodeStatus()}
                    <h2 style={{ ...STYLES.sectionTitle, marginTop: 0 }}>
                        <span style={STYLES.iconWrapper}><dc.Icon icon="rocket" /></span>
                        Deploy & Run
                    </h2>
                    <div style={{ border: '1px solid #1a1a1a', borderRadius: '8px', padding: '16px', marginTop: '10px', backgroundColor: '#0a0a0a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                            <span style={{ ...STYLES.pluginCardStatus, position: 'static', ...statusStyles[deploymentStatus] }}>{deploymentStatus.replace('_', ' ')}</span>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button style={STYLES.button} onClick={(e) => handleBuildAndDeploy(selectedPlugin.id, e)} disabled={!isNodeReady || isLoading || isProcessRunning}>
                                    <dc.Icon icon="hammer" /> Build & Deploy
                                </button>
                                <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => setIsBuildConfigOpen(true)} disabled={isLoading || isProcessRunning}>
                                    <dc.Icon icon="settings" /> Configure Build
                                </button>
                                {['ENABLED', 'DISABLED'].includes(deploymentStatus) && (
                                    <button style={STYLES.button} onClick={(e) => handleToggleDeployment(selectedPlugin.id, e)} disabled={isLoading || isProcessRunning}>
                                        <dc.Icon icon={deploymentStatus === 'ENABLED' ? 'square' : 'play'} />
                                        {deploymentStatus === 'ENABLED' ? 'Disable' : 'Enable'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <h2 style={STYLES.sectionTitle}>
                        <span style={STYLES.iconWrapper}><dc.Icon icon="git-branch" /></span>
                        Source Control
                    </h2>
                    <div style={{ border: '1px solid #1a1a1a', borderRadius: '8px', padding: '16px', marginTop: '10px', backgroundColor: '#0a0a0a' }}>
                        {renderSourceControl()}
                    </div>
                    <h2 style={STYLES.sectionTitle}>
                        <span style={STYLES.iconWrapper}><dc.Icon icon="file-code" /></span>
                        Manifest Editor
                    </h2>
                    <div style={{ border: '1px solid #1a1a1a', borderRadius: '8px', padding: '16px', marginTop: '10px', backgroundColor: '#0a0a0a' }}>
                        {manifestData && !isEditingManifest && (<div> {Object.entries(manifestData).map(([key, value]) => (<div key={key} style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '0.9em' }}> <strong style={{ textTransform: 'capitalize', color: '#8b5cf6' }}>{key}:</strong> <span style={{ color: '#e0e0e0' }}>{String(value)}</span> </div>))} <button style={{ ...STYLES.button, ...STYLES.buttonSecondary, marginTop: '16px' }} onClick={() => setIsEditingManifest(true)}><dc.Icon icon="pencil" /> Edit Manifest</button> </div>)}
                        {isEditingManifest && (<div> {Object.entries(editableManifest).map(([key, value]) => (<div key={key} style={{ marginBottom: '12px' }}> <label style={{ display: 'block', marginBottom: '4px', textTransform: 'capitalize', fontWeight: 600, color: '#8b5cf6' }}>{key}</label> <input type="text" style={{ ...STYLES.input, ...(key === 'id' ? { backgroundColor: '#1a1a1a', cursor: 'not-allowed', color: '#666' } : {}) }} value={value} onChange={(e) => handleManifestChange(key, e.target.value)} disabled={key === 'id'} title={key === 'id' ? "The plugin ID cannot be changed." : ""} /> </div>))} <button style={STYLES.button} onClick={handleSaveManifest}><dc.Icon icon="save" /> Save Manifest</button> <button style={{ ...STYLES.button, ...STYLES.buttonSecondary, marginLeft: '10px' }} onClick={() => setIsEditingManifest(false)}><dc.Icon icon="x" /> Cancel</button> </div>)}
                        {!manifestData && !isEditingManifest && <p style={{ color: '#666' }}>No manifest file found in the source directory.</p>}
                    </div>
                    <div style={{ ...STYLES.sectionTitleContainer, marginTop: '24px' }}>
                        <h2 style={{ ...STYLES.sectionTitle, marginTop: 0, marginBottom: 0, borderBottom: 'none' }}>
                            <span style={STYLES.iconWrapper}><dc.Icon icon="wrench" /></span>
                            Development Tools
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', fontSize: '0.9em' }} title="Watches for changes from external editors in .obsidian/plugins and automatically reloads the plugin.">
                            <input type="checkbox" id="hot-reload-toggle" checked={isHotReloadEnabled} onChange={(e) => setIsHotReloadEnabled(e.target.checked)} style={{ accentColor: '#8b5cf6' }} />
                            <label htmlFor="hot-reload-toggle" style={{ cursor: 'pointer' }}>Enable Hot Reload</label>
                        </div>
                    </div>
                    <div style={{ ...STYLES.detailActions, marginTop: '16px' }}>
                        <button style={STYLES.button} onClick={() => handleNavigateToCodeEditor(selectedPlugin.id)} disabled={isLoading || isProcessRunning}>
                            <dc.Icon icon="code" /> Open Integrated IDE
                        </button>
                        <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => handleOpenInIde(selectedPlugin.id)} disabled={isLoading || isProcessRunning}>
                            <dc.Icon icon="external-link" /> Open in External IDE
                        </button>
                        <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => handleOpenInExplorer(selectedPlugin.id)} disabled={isLoading || isProcessRunning}>
                            <dc.Icon icon="folder-open" /> Open in File Explorer
                        </button>
                        {/* NEW: Dedicated button to configure the external IDE command */}
                        <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => promptForIdeCommand(selectedPlugin.id)} disabled={isLoading || isProcessRunning}>
                            <dc.Icon icon="sliders" /> Config IDE
                        </button>
                    </div>
                    <h2 style={STYLES.sectionTitle}>
                        <span style={STYLES.iconWrapper}><dc.Icon icon="book-text" /></span>
                        Resources & Documentation
                    </h2>
                    <div style={STYLES.pluginGrid}>
                        {RESOURCES.map(resource => (
                            <div 
                                key={resource.label} 
                                style={resourceCardStyle} 
                                onClick={() => window.open(resource.url, '_blank')} 
                                onMouseOver={e => {
                                    e.currentTarget.style.borderColor = '#8b5cf6';
                                    e.currentTarget.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.3)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.borderColor = '#1a1a1a';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={resourceCardTitleStyle}>
                                    <span style={{ ...STYLES.iconWrapper, color: '#8b5cf6' }}>
                                        <dc.Icon icon={resource.icon} />
                                    </span>
                                    <span>{resource.label}</span>
                                </div>
                                <div style={resourceCardDescriptionStyle}>{resource.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
                {isBuildLogVisible && renderBuildLogPanel()}
            </div>
        );
    };


    const renderBuildConfigModal = ({ onClose }) => {
        if (!selectedPlugin) return null;
        const [buildConfig, setBuildConfig] = useState(getBuildConfigForPlugin(selectedPlugin.id));
        const [newSyncPath, setNewSyncPath] = useState("");
        const debug = debugNoticeManager.current || { showNotice: new Notice };


        const handleConfigChange = (key, value) => {
            setBuildConfig(prev => ({ ...prev, [key]: value }));
        };

        const handleAddSyncPath = (pathToAdd) => {
            const trimmedPath = pathToAdd.trim();
            if (!trimmedPath || buildConfig.syncPaths.includes(trimmedPath)) return;
            handleConfigChange('syncPaths', [...buildConfig.syncPaths, trimmedPath]);
            setNewSyncPath("");
        };

        const handleRemoveSyncPath = (pathToRemove) => {
            handleConfigChange('syncPaths', buildConfig.syncPaths.filter(p => p !== pathToRemove));
        };

        const handleSave = () => {
            setBuildConfigForPlugin(selectedPlugin.id, buildConfig);
            debug.showNotice(`Build configuration saved for ${selectedPlugin.name}.`);
            onClose();
        };

        const handleExplorerPathSelect = (fullPath) => {
            const pluginSourceRoot = nodeManager.join('.datacore', 'plugins', selectedPlugin.id);
            const outputDirRoot = nodeManager.join(pluginSourceRoot, buildConfig.outputDir);
            let relativePath = nodeManager.relative(outputDirRoot, fullPath);
            if (nodeManager.platform === 'win32') {
                relativePath = relativePath.replace(/\\/g, '/');
            }
            handleAddSyncPath(relativePath);
        };

        return (
            <div style={STYLES.modalOverlay} onClick={onClose}>
                <div style={{ ...STYLES.modalContent, width: '800px', maxWidth: '90vw', display: 'flex', gap: '20px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ ...STYLES.modalTitle, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <dc.Icon icon="settings" /> Configure Build for "{selectedPlugin.name}"
                        </h2>

                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#8b5cf6' }}>Build Output Directory</label>
                        <p style={{ fontSize: '0.85em', color: '#666', marginTop: 0, marginBottom: '8px' }}>The folder containing `main.js` (e.g., `dist`, `.` for root).</p>
                        <input type="text" value={buildConfig.outputDir} onChange={e => handleConfigChange('outputDir', e.target.value)} style={{ ...STYLES.input, marginBottom: '24px' }} />

                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#8b5cf6' }}>Paths to Sync</label>
                        <p style={{ fontSize: '0.85em', color: '#666', marginTop: 0, marginBottom: '8px' }}>Files/folders from the output directory to copy.</p>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto', padding: '8px', backgroundColor: '#000000', borderRadius: '4px', border: '1px solid #1a1a1a' }}>
                            {buildConfig.syncPaths.map((path, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '8px 12px', borderRadius: '4px' }}>
                                    <code style={{ color: '#e0e0e0', fontSize: '12px' }}>{path}</code>
                                    <button onClick={() => handleRemoveSyncPath(path)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}>
                                        <dc.Icon icon="x" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
                            <input type="text" value={newSyncPath} onChange={e => setNewSyncPath(e.target.value)} placeholder="manually add path..." style={{ ...STYLES.input, marginBottom: 0, flex: 1 }} />
                            <button onClick={() => handleAddSyncPath(newSyncPath)} style={{ ...STYLES.button, padding: '10px 14px' }}>
                                <dc.Icon icon="plus" /> Add
                            </button>
                        </div>

                        <div>
                            <button style={STYLES.button} onClick={handleSave}>
                                <dc.Icon icon="save" /> Save Configuration
                            </button>
                            <button style={{ ...STYLES.button, ...STYLES.buttonSecondary, marginLeft: '10px' }} onClick={onClose}>
                                <dc.Icon icon="x" /> Cancel
                            </button>
                        </div>
                    </div>
                    <div style={{ flex: 1, minHeight: 0, borderLeft: '1px solid #1a1a1a', paddingLeft: '20px' }}>
                        <FileExplorerView
                            key={selectedPlugin.id}
                            rootPath={nodeManager.join('.datacore', 'plugins', selectedPlugin.id)}
                            onFileSelect={handleExplorerPathSelect}
                            nodeManager={nodeManager}
                            debug={debugNoticeManager.current}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderCodeEditor = () => {
        if (!selectedPlugin) return null;
        const pluginRelativePath = `.datacore/plugins/${selectedPlugin.id}`;
        const isNodeReady = nodePathStatus === 'found';
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ ...STYLES.header, paddingBottom: '8px', gap: '12px' }}>
                    <div style={{ ...STYLES.detailHeader, flex: 1 }}>
                        <span style={STYLES.backButton} onClick={() => setView('plugin_details')}>
                            <dc.Icon icon="arrow-left" />
                        </span>
                        <h1 style={{ ...STYLES.detailTitle, fontSize: '1.6em' }}>
                            <dc.Icon icon="code" /> {selectedPlugin.name} - IDE
                        </h1>
                    </div>

                    {/* --- NEW: Auto-build toggle --- */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', fontSize: '0.9em' }} title="Automatically build and deploy when you save a file.">
                        <input
                            type="checkbox"
                            id="auto-build-toggle"
                            checked={isAutoBuildEnabled}
                            onChange={(e) => setIsAutoBuildEnabled(e.target.checked)}
                            style={{ accentColor: '#8b5cf6' }}
                        />
                        <label htmlFor="auto-build-toggle" style={{ cursor: 'pointer' }}>Auto-build on Save</label>
                    </div>

                    <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => handleOpenInIde(selectedPlugin.id)} disabled={isLoading || isProcessRunning}>
                        <dc.Icon icon="external-link" /> Open External
                    </button>
                    <button style={STYLES.button} onClick={(e) => handleBuildAndDeploy(selectedPlugin.id, e)} disabled={!isNodeReady || isLoading || isProcessRunning}>
                        <dc.Icon icon="hammer" /> Build & Deploy
                    </button>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <IntegratedIDE
                        key={selectedPlugin.id}
                        rootPath={pluginRelativePath}
                        onSave={() => autoBuildManager.current?.triggerAutoBuild(selectedPlugin.id)}
                    />
                </div>
                {isBuildLogVisible && renderBuildLogPanel()}
            </div>
        );
    };

    const renderDashboard = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ ...STYLES.header, paddingTop: '24px' }}>
                <h1 style={{ ...STYLES.detailTitle, fontSize: '1.8em', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <dc.Icon icon="package" style={{ color: '#8b5cf6' }} />
                    Plugin Development Suite
                </h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* NEW: Debug Mode Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', fontSize: '0.9em' }}>
                        <input
                            type="checkbox"
                            id="debug-mode-toggle"
                            checked={isDebugModeEnabled}
                            onChange={(e) => setIsDebugModeEnabled(e.target.checked)}
                            style={{ accentColor: '#8b5cf6' }}
                        />
                        <label htmlFor="debug-mode-toggle" style={{ cursor: 'pointer' }}>Debug Mode</label>
                    </div>
                    {/* --- UPDATED: Grouped action buttons --- */}
                    <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => setIsClonerOpen(true)} disabled={isLoading}>
                        <dc.Icon icon="download" /> Add from URL
                    </button>
                    <button style={STYLES.button} onClick={() => setIsCreatorOpen(true)} disabled={isLoading}>
                        <dc.Icon icon="plus-circle" /> Create Project
                    </button>
                </div>
            </div>
            <div style={STYLES.section}>
                <h2 style={{ ...STYLES.sectionTitle, marginTop: 0 }}>
                    <span style={STYLES.iconWrapper}><dc.Icon icon="folder" /></span>
                    Managed Projects
                </h2>
                <div style={STYLES.pluginGrid}>
                    {plugins.filter(p => p.isManaged).map(p => (
                        <div 
                            key={p.id} 
                            style={STYLES.pluginCard} 
                            onClick={() => { setSelectedPluginId(p.id); setView('plugin_details'); }}
                            onMouseOver={e => {
                                e.currentTarget.style.borderColor = '#8b5cf6';
                                e.currentTarget.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.borderColor = '#1a1a1a';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={STYLES.pluginCardName}>{p.name}</div>
                            <div style={STYLES.pluginCardId}>{p.id}</div>
                            <span style={{ ...STYLES.pluginCardStatus, ...getStatusStyle(p.status) }}>{p.status}</span>
                        </div>
                    ))}
                </div>
                <h2 style={STYLES.sectionTitle}>
                    <span style={STYLES.iconWrapper}><dc.Icon icon="box" /></span>
                    Other Installed Plugins
                </h2>
                <div style={STYLES.pluginGrid}>
                    {plugins.filter(p => !p.isManaged).map(p => (
                        <div key={p.id} style={{ ...STYLES.pluginCard, cursor: 'default', opacity: 0.5 }}>
                            <div style={STYLES.pluginCardName}>{p.name}</div>
                            <div style={STYLES.pluginCardId}>{p.id}</div>
                            <span style={{ ...STYLES.pluginCardStatus, ...getStatusStyle(p.status) }}>{p.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderCreatorModal = () => {
        const SVELTE_TEMPLATE_URL = "https://github.com/Quorafind/Obsidian-Svelte-Starter";
        const DEFAULT_TEMPLATE_URL = "https://github.com/obsidianmd/obsidian-sample-plugin";

        useEffect(() => {
            if (!isCreatorOpen) return;
            if (templateType === 'default') {
                setTemplateUrl(DEFAULT_TEMPLATE_URL);
            } else if (templateType === 'svelte') {
                setTemplateUrl(SVELTE_TEMPLATE_URL);
            } else if (templateType === 'custom') {
                setTemplateUrl('');
            }
        }, [templateType, isCreatorOpen]);

        const handleUrlChange = (newUrl) => {
            setTemplateUrl(newUrl);
            if (newUrl !== DEFAULT_TEMPLATE_URL && newUrl !== SVELTE_TEMPLATE_URL) {
                setTemplateType('custom');
            }
        };

        return (
            <div style={STYLES.modalOverlay} onClick={() => setIsCreatorOpen(false)}>
                <div style={STYLES.modalContent} onClick={e => e.stopPropagation()}>
                    <h2 style={STYLES.modalTitle}>Create New Plugin Project</h2>
                    <div style={STYLES.inputGroup}>
                        <input style={STYLES.input} type="text" placeholder="plugin-id (e.g., my-amazing-plugin)" value={newPluginId} onChange={e => setNewPluginId(e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
                        <input style={STYLES.input} type="text" placeholder="Plugin Name (e.g., My Amazing Plugin)" value={newPluginName} onChange={e => setNewPluginIdName(e.target.value)} />
                        <input style={STYLES.input} type="text" placeholder="Author (Your Name)" value={newPluginAuthor} onChange={e => setNewPluginAuthor(e.target.value)} />

                        <label style={{ fontWeight: 500, fontSize: '0.9em', color: 'var(--text-muted)' }}>Template</label>
                        <select style={{ ...STYLES.select, marginTop: '-8px' }} value={templateType} onChange={e => setTemplateType(e.target.value)}>
                            <option value="default">Default</option>
                            <option value="svelte">Svelte</option>
                            <option value="custom">Custom URL</option>
                        </select>

                        <label style={{ fontWeight: 500, fontSize: '0.9em', color: 'var(--text-muted)' }}>Template Repository URL</label>
                        <input
                            style={{ ...STYLES.input, marginTop: '-8px' }}
                            type="text"
                            placeholder="https://github.com/user/my-template.git"
                            value={templateUrl}
                            onChange={e => handleUrlChange(e.target.value)}
                        />
                    </div>
                    <button style={STYLES.button} onClick={handleCreatePlugin} disabled={isLoading || isProcessRunning}>Clone & Scaffold Project</button>
                </div>
            </div>
        );
    };

    const renderClonerModal = () => (
        <div style={STYLES.modalOverlay} onClick={() => setIsClonerOpen(false)}>
            <div style={STYLES.modalContent} onClick={e => e.stopPropagation()}>
                <h2 style={STYLES.modalTitle}>Add Plugin from Repository</h2>
                <div style={STYLES.inputGroup}>
                    <input
                        style={STYLES.input}
                        type="text"
                        placeholder="https://github.com/user/my-plugin.git"
                        value={newPluginUrl}
                        onChange={e => setNewPluginUrl(e.target.value)}
                        autoFocus
                    />
                </div>
                <button style={STYLES.button} onClick={handleClonePlugin} disabled={isLoading || isProcessRunning}>Clone Project</button>
            </div>
        </div>
    );

    const renderPromptModal = () => {
        if (!isPromptOpen || !promptConfig) return null;
        return (
            <div style={STYLES.modalOverlay} onClick={handlePromptClose}>
                <div style={{ ...STYLES.modalContent, width: '550px' }} onClick={e => e.stopPropagation()}>
                    <h2 style={STYLES.modalTitle}>{promptConfig.title}</h2>
                    {promptConfig.description && <p style={STYLES.modalDescription}>{promptConfig.description}</p>}
                    <div style={STYLES.inputGroup}>
                        {promptConfig.inputs.map((input, index) => (
                            <input
                                key={index}
                                style={STYLES.input}
                                type="text"
                                placeholder={input.placeholder}
                                value={promptValues[index] || ''}
                                onChange={e => handlePromptChange(index, e.target.value)}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>
                    {promptConfig.helpText}
                    <div style={{ marginTop: '24px' }}>
                        <button style={STYLES.button} onClick={handlePromptSubmit} disabled={isLoading}>Confirm</button>
                        <button style={{ ...STYLES.button, ...STYLES.buttonSecondary, marginLeft: '10px' }} onClick={handlePromptClose} disabled={isLoading}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDeleteModal = () => {
        if (!isDeleteModalOpen || !selectedPlugin) return null;

        const handleClose = () => setIsDeleteModalOpen(false);

        const handleDeleteSource = () => {
            executeDeleteSourceOnly(selectedPlugin.id);
            handleClose();
        };

        const handleDeleteAll = () => {
            executeDeleteAll(selectedPlugin.id);
            handleClose();
        };

        const optionButtonStyle = {
            ...STYLES.button,
            width: '100%',
            height: 'auto',
            padding: '16px',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
        };

        return (
            <div style={STYLES.modalOverlay} onClick={handleClose}>
                <div style={{ ...STYLES.modalContent, width: '550px' }} onClick={e => e.stopPropagation()}>
                    <h2 style={STYLES.modalTitle}>Delete source for "{selectedPlugin.name}"?</h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>This will permanently delete the project files from your <strong>.datacore/plugins</strong> folder. Choose how to handle the installed version.</p>

                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <button
                            style={{ ...optionButtonStyle, ...STYLES.buttonSecondary }}
                            onClick={handleDeleteSource}
                            disabled={isLoading || isProcessRunning}
                        >
                            <div>
                                <div style={{ fontWeight: 'bold' }}>Delete Source Only</div>
                                <div style={{ fontSize: '0.85em', color: 'var(--text-muted)', whiteSpace: 'normal', marginTop: '4px' }}>
                                    Keeps the installed plugin in <strong>.obsidian/plugins</strong> active and working.
                                </div>
                            </div>
                        </button>

                        <button
                            style={{ ...optionButtonStyle, ...STYLES.buttonDanger }}
                            onClick={handleDeleteAll}
                            disabled={isLoading || isProcessRunning}
                        >
                            <div>
                                <div style={{ fontWeight: 'bold' }}>Delete Source & Undeploy</div>
                                <div style={{ fontSize: '0.85em', color: 'var(--text-on-accent)', opacity: 0.8, whiteSpace: 'normal', marginTop: '4px' }}>
                                    Also deletes the installed plugin from <strong>.obsidian/plugins</strong>. This is a complete removal.
                                </div>
                            </div>
                        </button>
                    </div>

                    <div style={{ marginTop: '24px', textAlign: 'right' }}>
                        <button
                            style={{ ...STYLES.button, ...STYLES.buttonSecondary }}
                            onClick={handleClose}
                            disabled={isLoading || isProcessRunning}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    const renderContent = () => {
        switch (view) {
            case 'plugin_details': return renderPluginDetails();
            case 'code_editor': return renderCodeEditor();
            default: return renderDashboard();
        }
    };


    // --- Final Render ---
    return (
        <div ref={containerRef} className={uniqueWrapperClass} style={STYLES.wrapper}>
            <style>{STYLES.hoverEffectStyle}</style>
            {isFullTab ? (
                <>
                    <span className="pds-exit-icon" style={STYLES.exitIcon} title="Exit Full Screen" onClick={() => setIsFullTab(false)}>&lt;/&gt;</span>
                    {renderContent()}
                </>
            ) : (
                <div style={{ padding: '24px' }}>
                    <div style={STYLES.compactWrapper}>
                        <p style={STYLES.compactText}>Plugin Development Suite</p>
                        <button style={STYLES.button} onClick={() => setIsFullTab(true)}>Open Full Screen</button>
                    </div>
                </div>
            )}
            {isCreatorOpen && renderCreatorModal()}
            {isClonerOpen && renderClonerModal()}
            {isPromptOpen && renderPromptModal()}
            {isPromptOpen && renderPromptModal()}
            {isDeleteModalOpen && renderDeleteModal()}
            {isBuildLogVisible && renderBuildLogPanel()}
        </div>
    );
}

return { View: PluginDevSuite };
```











# TerminalManager

```jsx
// --- NODE.JS CORE MODULES ---
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');


// --- NEW: Centralized Terminal Process Manager ---
class TerminalManager {
    constructor() {
        this.terminals = new Map();
        console.log("[TerminalManager] Initialized.");
    }

    createTerminal(params) {
        const terminalId = crypto.randomUUID();

        const env = { ...process.env, ...params.env };
        let command = params.command;
        let args = params.args || [];

        if (!params.args && params.command.includes(" ")) {
            const parts = params.command.split(" ").filter(part => part.length > 0);
            command = parts[0];
            args = parts.slice(1);
        }

        console.log(`[TerminalManager] Creating terminal #${terminalId}:`, { command, args, cwd: params.cwd });

        const childProcess = spawn(command, args, {
            cwd: params.cwd || undefined,
            env,
            shell: true, // Important for resolving commands like 'npm' correctly
        });

        const terminal = {
            id: terminalId,
            process: childProcess,
            output: "",
            exitStatus: null,
            waitPromises: [],
        };

        childProcess.on("error", (error) => {
            console.error(`[TerminalManager] Process error for #${terminalId}:`, error.message);
            terminal.output += `\n[ERROR] Failed to start command: ${error.message}\n`;
            terminal.exitStatus = { exitCode: 127, signal: null }; // 127 = command not found
            terminal.waitPromises.forEach(resolve => resolve(terminal.exitStatus));
            terminal.waitPromises = [];
        });

        childProcess.stdout?.on("data", (data) => {
            terminal.output += data.toString();
        });

        childProcess.stderr?.on("data", (data) => {
            terminal.output += data.toString();
        });

        childProcess.on("exit", (code, signal) => {
            console.log(`[TerminalManager] Process #${terminalId} exited with code: ${code}, signal: ${signal}`);
            terminal.exitStatus = { exitCode: code, signal };
            terminal.waitPromises.forEach(resolve => resolve(terminal.exitStatus));
            terminal.waitPromises = [];
        });

        this.terminals.set(terminalId, terminal);
        return terminalId;
    }

    getOutput(terminalId) {
        const terminal = this.terminals.get(terminalId);
        return terminal ? { output: terminal.output, exitStatus: terminal.exitStatus } : null;
    }

    waitForExit(terminalId) {
        const terminal = this.terminals.get(terminalId);
        if (!terminal) return Promise.reject(new Error(`Terminal ${terminalId} not found`));
        if (terminal.exitStatus) return Promise.resolve(terminal.exitStatus);
        return new Promise(resolve => {
            terminal.waitPromises.push(resolve);
        });
    }

    releaseTerminal(terminalId) {
        const terminal = this.terminals.get(terminalId);
        if (!terminal) return false;
        if (!terminal.exitStatus) {
            terminal.process.kill("SIGTERM");
        }
        this.terminals.delete(terminalId);
        console.log(`[TerminalManager] Released terminal #${terminalId}.`);
        return true;
    }

    killAllTerminals() {
        console.log(`[TerminalManager] Killing all ${this.terminals.size} terminals.`);
        this.terminals.forEach((terminal, terminalId) => {
            this.releaseTerminal(terminalId);
        });
    }
}

return { TerminalManager };
```











# IntegratedIDE



```jsx
// -------------------------
// Live Development Environment (ViewComponent)
// -------------------------
const { useState, useEffect, useRef, useCallback, useMemo } = dc;
const { Component: PreactComponent } = dc.preact;
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Import the GitSuite component
 const { GitSuite } = await dc.require(dc.headerLink(dc.resolvePath("D.q.plugindevsuite.component.md"), "GitSuite"));

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- UTILITY FUNCTIONS & CUSTOM COMPONENTS ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }

// --- NEW: Custom Notice (Replaces Obsidian's Notice) ---
function CustomNotice(message, duration = 4000) {
    let noticeContainer = document.getElementById('custom-notice-container-lde');
    if (!noticeContainer) {
        noticeContainer = document.createElement('div');
        noticeContainer.id = 'custom-notice-container-lde';
        Object.assign(noticeContainer.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '10001', // High z-index to be on top of everything
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-end',
        });
        document.body.appendChild(noticeContainer);
    }

    const noticeEl = document.createElement('div');
    noticeEl.textContent = message;
    Object.assign(noticeEl.style, {
        backgroundColor: 'rgba(0, 0, 0, 0.98)',
        color: '#ffffff',
        padding: '12px 18px',
        borderRadius: '6px',
        border: '1px solid #1a1a1a',
        boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
        fontFamily: 'monospace',
        fontSize: '14px',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        maxWidth: '300px',
        textAlign: 'right',
    });

    noticeContainer.appendChild(noticeEl);

    setTimeout(() => {
        noticeEl.style.opacity = '1';
        noticeEl.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        noticeEl.style.opacity = '0';
        noticeEl.style.transform = 'translateX(100%)';
        noticeEl.addEventListener('transitionend', () => {
            noticeEl.remove();
            if (noticeContainer.children.length === 0) {
                noticeContainer.remove();
            }
        });
    }, duration);
}


// --- NEW: Custom Button Component (Replaces Obsidian's ButtonComponent) ---
function CustomButton({ text, onClick, isCta = false }) {
    const baseStyle = { padding: '8px 16px', border: '1px solid #1a1a1a', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontFamily: 'monospace', transition: 'background-color 0.2s, border-color 0.2s', };
    const ctaStyle = { backgroundColor: '#ef4444', color: '#ffffff', borderColor: '#ef4444', };
    const defaultStyle = { backgroundColor: '#0a0a0a', color: '#e0e0e0', };
    const finalStyle = { ...baseStyle, ...(isCta ? ctaStyle : defaultStyle) };
    return (<button style={finalStyle} onClick={onClick}> {text} </button>);
}

// --- NEW: Custom Modal Component (Replaces Obsidian's Modal) ---
function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;
    const backdropStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', };
    const modalStyle = { backgroundColor: '#0a0a0a', color: '#e0e0e0', padding: '24px', borderRadius: '8px', border: '1px solid #8b5cf6', width: '90%', maxWidth: '450px', boxShadow: '0 8px 30px rgba(139,92,246,0.5)', fontFamily: 'monospace', };
    const titleStyle = { fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#ef4444' };
    const messageStyle = { marginBottom: '24px', lineHeight: '1.5', };
    const buttonContainerStyle = { display: 'flex', justifyContent: 'flex-end', gap: '12px', };
    const handleConfirm = () => { onConfirm(); onCancel(); };

    return (
        <div style={backdropStyle} onClick={onCancel}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <h2 style={titleStyle}>{title}</h2>
                <p style={messageStyle}>{message}</p>
                <div style={buttonContainerStyle}>
                    <CustomButton text="Cancel" onClick={onCancel} />
                    <CustomButton text="Delete" onClick={handleConfirm} isCta={true} />
                </div>
            </div>
        </div>
    );
}

// --- Linter for Best Practices ---
function runLinter(code) {
    const markers = [];
    if (!code) return markers;
    const lines = code.split('\n');
    lines.forEach((line, index) => {
        const styleMatch = line.match(/style\s*=\s*\{\{/);
        if (styleMatch) {
            markers.push({ message: "[Best Practice] Avoid inline styles. Define styles in a separate object for better maintainability.", severity: 'Info', startLineNumber: index + 1, endLineNumber: index + 1, startColumn: styleMatch.index + 1, endColumn: line.length + 1, });
        }
    });
    lines.forEach((line, index) => {
        const consoleMatches = [...line.matchAll(/console\.log/g)];
        consoleMatches.forEach(match => {
            markers.push({ message: "[Best Practice] Avoid 'console.log'. Use a proper logger or remove it before production.", severity: 'Warning', startLineNumber: index + 1, endLineNumber: index + 1, startColumn: match.index + 1, endColumn: match.index + match[0].length + 1, });
        });
    });
    return markers;
}


// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- STYLES - Enigmatic Dark Theme (Consolidated) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const styles = {
    baseWrapper: { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', fontFamily: 'monospace', backgroundColor: '#000000', color: '#ffffff', boxSizing: 'border-box' },
    headerBar: { display: 'flex', padding: '8px 12px', gap: '8px', backgroundColor: '#000000', borderBottom: '1px solid #1a1a1a', alignItems: 'center', justifyContent: 'flex-end' },
    mainContent: { flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 },
    iconButton: { padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', backgroundColor: '#0a0a0a', color: '#8b5cf6', border: '1px solid #1a1a1a', borderRadius: '6px', transition: 'all 0.2s', fontSize: '13px', fontWeight: '600' },
    editorPaneContainer: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000000', minWidth: 0 },
    statusBar: { padding: '8px 12px', backgroundColor: '#000000', borderTop: '1px solid #1a1a1a', color: '#666', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'monospace' },
    previewPane: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000000', position: 'relative', minWidth: 0 },
    previewHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#000000', color: '#8b5cf6', fontSize: '12px', textAlign: 'center', borderBottom: '1px solid #1a1a1a', fontWeight: '600' },
    previewContent: { flex: 1, position: 'relative', overflow: 'auto', padding: '10px', backgroundColor: '#000000' },
    tabBar: { display: 'flex', backgroundColor: '#000000', borderBottom: '1px solid #1a1a1a', overflowX: 'auto', alignItems: 'center', flexShrink: 0 },
    tab: { padding: '10px 48px 10px 16px', cursor: 'pointer', color: '#666', borderBottom: '2px solid transparent', transition: 'color 0.2s, border-color 0.2s', whiteSpace: 'nowrap', fontSize: '13px', position: 'relative', fontFamily: 'monospace' },
    activeTab: { color: '#ffffff', borderBottom: '2px solid #8b5cf6', },
    renameInput: { background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', fontFamily: 'monospace', padding: '0', margin: '0', width: '100%', boxSizing: 'border-box' },
    resizer: { flex: '0 0 5px', cursor: 'col-resize', backgroundColor: '#1a1a1a', backgroundClip: 'padding-box', borderLeft: '2px solid transparent', borderRight: '2px solid transparent', transition: 'background-color 0.2s', zIndex: 10, },
    horizontalResizer: { cursor: 'row-resize', height: '5px', width: '100%', borderTop: '2px solid transparent', borderBottom: '2px solid transparent' },
    resizerHover: { backgroundColor: '#8b5cf6', },
    fileExplorerPane: { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000000', minWidth: '150px', resize: 'horizontal', borderRight: '1px solid #1a1a1a' },
};

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 1. CRASH-PROOF ERROR HANDLING & COMPONENT LOADER ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function ErrorDisplay({ errorMessage }) {
    const errorStyles = { wrapper: { padding: '20px' }, details: { fontFamily: 'monospace', border: '1px solid #ef4444', borderRadius: '8px', backgroundColor: 'rgba(26,26,26,0.5)', color: '#fed7d7', padding: '16px', }, summary: { cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#ef4444', listStyle: 'none', display: 'flex', alignItems: 'center', }, summaryText: { marginLeft: '8px', }, content: { marginTop: '12px', borderTop: '1px solid #1a1a1a', paddingTop: '12px', color: '#e0e0e0', fontSize: '14px', }, pre: { whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#ccc', fontSize: '13px', marginTop: '12px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontFamily: 'monospace', } };
    return (<div style={errorStyles.wrapper}> <details style={errorStyles.details} open> <summary style={errorStyles.summary}> <dc.Icon icon="alert-triangle" style={{ width: '20px', height: '20px' }} /><span style={errorStyles.summaryText}>Component Rendering Error</span> </summary> <div style={errorStyles.content}> <p>The component failed to render. Fix the error in the editor and save.</p> <pre style={errorStyles.pre}>{errorMessage}</pre> </div> </details> </div>);
}
class ErrorBoundary extends PreactComponent {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { console.error("ErrorBoundary caught an error:", error, info); }
    componentDidUpdate(prevProps) { if (prevProps.renderKey !== this.props.renderKey) { this.setState({ hasError: false, error: null }); } }
    render() { if (this.state.hasError) { return <ErrorDisplay errorMessage={this.state.error?.toString()} />; } return this.props.children; }
}
function DynamicComponentLoader({ filePath, activeHeader, renderKey }) {
    const [LoadedComponent, setLoadedComponent] = useState(null); const [loadError, setLoadError] = useState(null);
    useEffect(() => { let isCancelled = false; const loadComponent = async () => { if (!filePath || !activeHeader) { setLoadedComponent(null); setLoadError(null); return; } setLoadedComponent(null); setLoadError(null); try { const dynamicModule = await dc.require(dc.headerLink(filePath, activeHeader)); if (isCancelled) return; let Component = null; if (typeof dynamicModule === 'function') Component = dynamicModule; else if (dynamicModule && typeof dynamicModule === 'object') { const keys = Object.keys(dynamicModule); if (keys.length > 0) Component = dynamicModule[keys[0]]; } if (typeof Component !== 'function') { throw new Error("Module did not export a renderable component."); } if (!isCancelled) { setLoadedComponent(() => Component); } } catch (err) { console.error("Component load error:", err); if (!isCancelled) { setLoadError(err.toString()); } } }; loadComponent(); return () => { isCancelled = true; }; }, [filePath, activeHeader, renderKey]);
    if (loadError) { return <ErrorDisplay errorMessage={loadError} />; } if (LoadedComponent) { return (<ErrorBoundary renderKey={renderKey}> <LoadedComponent /> </ErrorBoundary>); } return <p style={{ color: '#888', padding: '20px' }}>Select a component file to render its preview.</p>;
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 2. THE FILE EXPLORER (Left Pane) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

// --- New Helper Component: Context Menu ---
function ContextMenu({ x, y, items, onClose }) {
    const menuRef = useRef(null);
    useEffect(() => { const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) { onClose(); } }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, [onClose]);
    const menuStyle = { position: 'fixed', top: `${y}px`, left: `${x}px`, backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '4px', boxShadow: '0 4px 12px rgba(139,92,246,0.3)', padding: '6px', zIndex: 1000, color: '#e0e0e0', fontFamily: 'monospace', fontSize: '13px', };
    const itemStyle = { padding: '8px 12px', cursor: 'pointer', borderRadius: '3px', };
    const handleItemClick = (action) => { action(); onClose(); };
    return (<div ref={menuRef} style={menuStyle}> {items.map((item, index) => (<div key={index} style={itemStyle} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => handleItemClick(item.action)}> {item.label} </div>))} </div>);
}

function FileExplorerItem({
    item, depth, onFileSelect, activeFile, onFolderSelect, selectedFolderPath,
    openFolders, onToggleFolder,
    draggedItem, dropTargetPath,
    onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
    renamingPath, onStartRename, onRenameChange, onConfirmRename, onCancelRename,
    onContextMenu // New prop for right-click
}) {
    const isFolder = Array.isArray(item.children);
    const isComponent = !isFolder && /\.component(\.v\d+)?\.md$/i.test(item.name);
    const isOpen = !!openFolders[item.path];
    const isSelectedFile = !isFolder && item.path === activeFile;
    const isSelectedFolder = isFolder && item.path === selectedFolderPath;
    const isBeingDragged = item.path === draggedItem?.path;
    const isDropTarget = isFolder && item.path === dropTargetPath && item.path !== draggedItem?.path;
    const isRenaming = item.path === renamingPath;
    const renameInputRef = useRef(null);

    useEffect(() => { if (isRenaming && renameInputRef.current) { renameInputRef.current.focus(); renameInputRef.current.select(); } }, [isRenaming]);
    const handleItemClick = useCallback(() => { if (isRenaming) return; if (isFolder) { onFolderSelect(item); onToggleFolder(item.path); } else { onFileSelect(item); } }, [isFolder, onFileSelect, onFolderSelect, onToggleFolder, item, isRenaming]);
    const handleRenameKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); onConfirmRename(); } else if (e.key === 'Escape') { e.preventDefault(); onCancelRename(); } };
    const handleDragStart = (e) => { e.stopPropagation(); onDragStart({ path: item.path, isFolder }); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.path); };
    const handleDragOver = (e) => { if (isFolder && !isRenaming) { e.preventDefault(); e.stopPropagation(); onDragOver(item.path); } };
    const handleDragLeave = (e) => { e.stopPropagation(); onDragLeave(); };
    const handleDrop = (e) => { if (isFolder && !isRenaming) { e.preventDefault(); e.stopPropagation(); onDrop(item.path); } };
    const getBackgroundColor = () => { if (isSelectedFile) return 'rgba(139, 92, 246, 0.6)'; if (isSelectedFolder) return 'rgba(139, 92, 246, 0.25)'; return 'transparent'; };
    const contentStyle = { display: 'flex', alignItems: 'center', padding: `4px 8px`, paddingLeft: `${depth * 20}px`, cursor: 'pointer', borderRadius: '4px', backgroundColor: getBackgroundColor(), color: isSelectedFile ? '#fff' : (isComponent ? '#e0e0e0' : '#666'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '1px 0', transition: 'background-color 0.2s, border-color 0.2s', opacity: isBeingDragged ? 0.5 : 1, borderColor: isDropTarget ? '#8b5cf6' : (isSelectedFolder ? 'rgba(139, 92, 246, 0.5)' : 'transparent'), borderWidth: '1px', borderStyle: 'solid', fontFamily: 'monospace' };
    const iconStyle = { marginRight: '8px', width: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    const getIconName = () => {
        if (isFolder) return isOpen ? 'folder-open' : 'folder';
        if (isComponent) return 'file-code';
        return 'file';
    };
    const renameInputStyle = { background: 'transparent', border: 'none', outline: '1px solid #8b5cf6', color: '#e0e0e0', fontSize: 'inherit', fontFamily: 'monospace', padding: '1px 3px', margin: '0', width: '100%', boxSizing: 'border-box' };

    return (
        <div draggable={!isRenaming} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onDragEnd={onDragEnd}>
            <div style={contentStyle} onClick={handleItemClick} onContextMenu={(e) => onContextMenu(e, item)} title={item.path}>
                <span style={iconStyle}><dc.Icon icon={getIconName()} style={{ fontSize: '16px' }} /></span>
                {isRenaming ? (<input ref={renameInputRef} type="text" style={renameInputStyle} value={onRenameChange.value} onChange={(e) => onRenameChange.handler(e.target.value)} onBlur={onConfirmRename} onKeyDown={handleRenameKeyDown} onClick={(e) => e.stopPropagation()} />) : (<span>{item.name}</span>)}
            </div>
            {isFolder && isOpen && item.children.length > 0 && (<div> {item.children.map(child => (<FileExplorerItem key={child.path} item={child} depth={depth + 1} onFileSelect={onFileSelect} activeFile={activeFile} onFolderSelect={onFolderSelect} selectedFolderPath={selectedFolderPath} openFolders={openFolders} onToggleFolder={onToggleFolder} draggedItem={draggedItem} dropTargetPath={dropTargetPath} onDragStart={onDragStart} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onDragEnd={onDragEnd} renamingPath={renamingPath} onStartRename={onStartRename} onRenameChange={onRenameChange} onConfirmRename={onConfirmRename} onCancelRename={onCancelRename} onContextMenu={onContextMenu} />))} </div>)}
        </div>
    );
}

function FileExplorerView({ rootPath = '/', onFileSelect, activeFile }) {
    const [fileTree, setFileTree] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFolderPath, setSelectedFolderPath] = useState(rootPath);
    const [selectedItem, setSelectedItem] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [createState, setCreateState] = useState(null);
    const [newItemName, setNewItemName] = useState("");
    const inputRef = useRef(null);
    const [openFolders, setOpenFolders] = useState({ [rootPath]: true });
    const [draggedItem, setDraggedItem] = useState(null);
    const [dropTargetPath, setDropTargetPath] = useState(null);
    const [renamingPath, setRenamingPath] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [contextMenu, setContextMenu] = useState(null);
    const [confirmationDialog, setConfirmationDialog] = useState(null); // State for the custom modal

    const fetchTree = useCallback(async () => {
        setIsLoading(true);
        if (!dc.app?.vault?.adapter) { setError("Vault adapter is not available."); setIsLoading(false); return; }
        const buildTreeForPath = async (currentPath) => {
            let listResult; try { listResult = await dc.app.vault.adapter.list(currentPath); } catch (e) { console.warn(`Could not list path: ${currentPath}`, e); return []; }
            const { files, folders } = listResult;
            const folderPromises = folders.map(async (folderPath) => ({ name: folderPath.split('/').pop(), path: folderPath, children: await buildTreeForPath(folderPath) }));
            const fileNodes = files.map(filePath => ({ name: filePath.split('/').pop(), path: filePath, children: null }));
            const allChildren = [...(await Promise.all(folderPromises)), ...fileNodes];
            allChildren.sort((a, b) => { const aIsFolder = a.children !== null; const bIsFolder = b.children !== null; if (aIsFolder && !bIsFolder) return -1; if (!aIsFolder && bIsFolder) return 1; return a.name.localeCompare(b.name); });
            return allChildren;
        };
        try { const children = await buildTreeForPath(rootPath); const rootName = (rootPath === '/' || rootPath === '') ? 'Vault' : rootPath.split('/').pop(); const tree = { name: rootName, path: rootPath, children: children }; setFileTree(tree); setSelectedItem(tree); setError(null); } catch (e) { setError(`Failed to load file tree: ${e.message}`); console.error(e); } finally { setIsLoading(false); }
    }, [rootPath]);

    useEffect(() => { fetchTree(); }, [rootPath, refreshKey, fetchTree]);
    useEffect(() => { if (isLoading === false && fileTree && !activeFile) { if (fileTree.path === rootPath && fileTree.children) { const mainTsFile = fileTree.children.find(child => child.name === 'main.ts' && child.children === null); if (mainTsFile) { onFileSelect(mainTsFile.path); setSelectedItem(mainTsFile); } } } }, [isLoading, fileTree, activeFile, rootPath, onFileSelect]);
    const handleFileSelectInternal = (item) => { onFileSelect(item.path); setSelectedItem(item); };
    useEffect(() => { if (createState && inputRef.current) { inputRef.current.focus(); } }, [createState]);
    const handleToggleFolder = (folderPath) => { setOpenFolders(prev => ({ ...prev, [folderPath]: !prev[folderPath] })); };
    const handleFolderClick = useCallback((folderItem) => { setSelectedFolderPath(folderItem.path); setSelectedItem(folderItem); if (folderItem.children) { const mainTsFile = folderItem.children.find(child => child.name === 'main.ts' && child.children === null); if (mainTsFile) { onFileSelect(mainTsFile.path); } } }, [onFileSelect]);
    const handleDragStart = (item) => { setDraggedItem(item); };
    const handleDragOver = (path) => { if (path !== draggedItem?.path) { setDropTargetPath(path); } };
    const handleDragLeave = () => { setDropTargetPath(null); };
    const handleDragEnd = () => { setDraggedItem(null); setDropTargetPath(null); };

    const handleDrop = async (targetFolderPath) => {
        if (!draggedItem || !targetFolderPath || draggedItem.path === targetFolderPath) return;
        if (targetFolderPath.startsWith(draggedItem.path + '/')) { CustomNotice("Error: Cannot move a folder into itself.", 3000); return; }
        const itemName = draggedItem.path.split('/').pop(); const newPath = targetFolderPath === '/' ? itemName : `${targetFolderPath}/${itemName}`; if (newPath === draggedItem.path) return;
        try { await dc.app.vault.adapter.rename(draggedItem.path, newPath); if (draggedItem.isFolder && openFolders[draggedItem.path]) { setOpenFolders(prev => { const newOpenState = { ...prev }; delete newOpenState[draggedItem.path]; newOpenState[newPath] = true; return newOpenState; }); } CustomNotice(`Moved '${itemName}' successfully.`); setRefreshKey(k => k + 1); } catch (e) { console.error("Error moving item:", e); CustomNotice(`Error: Could not move item. See console.`, 3000); }
    };

    const handleStartCreate = (type) => { setCreateState({ type }); setNewItemName(""); };
    const handleCancelCreate = () => { setCreateState(null); setNewItemName(""); };
    const handleConfirmCreate = async () => {
        if (!newItemName || !createState) return; const { type } = createState; if (newItemName.includes('/') || newItemName.includes('\\')) { CustomNotice("Error: Name cannot contain slashes."); return; } const newPath = selectedFolderPath === '/' ? newItemName : `${selectedFolderPath}/${newItemName}`;
        try { if (type === 'folder') { await dc.app.vault.adapter.mkdir(newPath); setOpenFolders(prev => ({ ...prev, [selectedFolderPath]: true })); CustomNotice(`Folder created: ${newItemName}`); } else { const content = /\.component(\.v\d+)?\.md$/i.test(newItemName) ? `---\ntags: datacore-component\n---\n\n# ViewComponent\n\n\`\`\`jsx\nfunction MyComponent() {\n  return <div>Hello, World!</div>;\n}\n\nreturn { MyComponent };\n\`\`\`` : ''; await dc.app.vault.adapter.write(newPath, content); CustomNotice(`File created: ${newItemName}`); } setRefreshKey(k => k + 1); } catch (e) { console.error(`Error creating ${type}:`, e); CustomNotice(`Error: Could not create ${type}. See console.`); } finally { handleCancelCreate(); }
    };

    const handleStartRename = (path, currentName) => { setRenamingPath(path); setRenameValue(currentName); };
    const handleCancelRename = () => { setRenamingPath(null); setRenameValue(""); };
    const handleConfirmRename = async () => {
        const trimmedValue = renameValue.trim();
        if (!renamingPath || !trimmedValue) { handleCancelRename(); return; }
        const originalName = renamingPath.split('/').pop();
        if (originalName === trimmedValue) { handleCancelRename(); return; }
        if (trimmedValue.includes('/') || trimmedValue.includes('\\')) { CustomNotice("Error: Name cannot contain slashes."); return; }
        const parentPath = renamingPath.substring(0, renamingPath.lastIndexOf('/'));
        const newPath = parentPath ? `${parentPath}/${trimmedValue}` : trimmedValue;
        if (newPath === renamingPath) { handleCancelRename(); return; }
        try { if (await dc.app.vault.adapter.exists(newPath)) { CustomNotice(`Error: '${trimmedValue}' already exists.`); return; } await dc.app.vault.adapter.rename(renamingPath, newPath); CustomNotice(`Renamed to '${trimmedValue}'`); setRefreshKey(k => k + 1); } catch (e) { console.error("Error renaming item:", e); CustomNotice(`Error: Could not rename. See console.`, 3000); } finally { handleCancelRename(); }
    };

    const handleDeleteItem = (item) => {
        if (!item || !item.path || item.path === rootPath) { CustomNotice("Cannot delete the root directory or an invalid item."); return; }
        setConfirmationDialog({
            title: `Delete ${Array.isArray(item.children) ? 'Folder' : 'File'}`,
            message: `Are you sure you want to permanently delete '${item.name}'? This action cannot be undone.`,
            onConfirm: async () => {
                const isFolder = Array.isArray(item.children);
                try {
                    if (isFolder) { await dc.app.vault.adapter.rmdir(item.path, true); } else { await dc.app.vault.adapter.remove(item.path); }
                    CustomNotice(`'${item.name}' has been deleted.`);
                    if (item.path === activeFile) { onFileSelect(null); }
                    setRefreshKey(k => k + 1);
                } catch (e) { console.error("Error deleting item:", e); CustomNotice(`Error: Could not delete item. See console.`); }
            },
            onCancel: () => setConfirmationDialog(null)
        });
    };

    const handleContextMenu = (event, item) => {
        event.preventDefault(); event.stopPropagation(); setSelectedItem(item);
        const menuItems = [{ label: 'Rename', action: () => handleStartRename(item.path, item.name) }];
        if (item.path !== rootPath) { menuItems.push({ label: 'Delete', action: () => handleDeleteItem(item) }); }
        setContextMenu({ x: event.clientX, y: event.clientY, items: menuItems });
    };

    const isRootSelected = selectedItem?.path === rootPath;
    const STYLES = { wrap: { height: "100%", width: "100%", background: '#1c1c1c', color: 'var(--text-normal)', overflow: 'hidden', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }, header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 'bold', padding: '12px', borderBottom: '1px solid #333', flexShrink: 0 }, button: { background: '#333', border: '1px solid #555', color: '#e0e0e0', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }, buttonDisabled: { cursor: 'not-allowed', opacity: 0.5 }, content: { padding: '8px', flex: 1, overflowY: 'auto' }, createForm: { padding: '8px', background: '#2a2a2a', display: 'flex', gap: '8px', alignItems: 'center' }, createInput: { flex: 1, background: '#1a1a1a', border: '1px solid #555', color: '#e0e0e0', borderRadius: '4px', padding: '6px 8px', outline: 'none' }, contentLoading: { opacity: 0.7, pointerEvents: 'none', transition: 'opacity 0.2s' } };
    const contentDynamicStyle = { ...STYLES.content, ...(isLoading && fileTree ? STYLES.contentLoading : {}) };
    const headerRenameButtonStyle = { ...STYLES.button, ...(!selectedItem || isRootSelected ? STYLES.buttonDisabled : {}) };
    const headerDeleteButtonStyle = { ...STYLES.button, color: '#ffaaaa', ...(!selectedItem || isRootSelected ? STYLES.buttonDisabled : {}) };

    return (
        <div style={STYLES.wrap}>
            <ConfirmationDialog isOpen={!!confirmationDialog} {...confirmationDialog} />
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />}
            <div style={STYLES.header}>
                <span>File Explorer</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={STYLES.button} title="New File" onClick={() => handleStartCreate('file')}><dc.Icon icon="file-plus" style={{ fontSize: '14px' }} /></button>
                    <button style={STYLES.button} title="New Folder" onClick={() => handleStartCreate('folder')}><dc.Icon icon="folder-plus" style={{ fontSize: '14px' }} /></button>
                    <div style={{ borderLeft: '1px solid #444', margin: '0 4px' }}></div>
                    <button style={headerRenameButtonStyle} title="Rename selected item" disabled={!selectedItem || isRootSelected} onClick={() => handleStartRename(selectedItem.path, selectedItem.name)}><dc.Icon icon="edit-3" style={{ fontSize: '14px' }} /></button>
                    <button style={headerDeleteButtonStyle} title="Delete selected item" disabled={!selectedItem || isRootSelected} onClick={() => handleDeleteItem(selectedItem)}><dc.Icon icon="trash-2" style={{ fontSize: '14px' }} /></button>
                </div>
            </div>
            {createState && (<div style={STYLES.createForm}> <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}><dc.Icon icon={createState.type === 'folder' ? 'folder' : 'file'} style={{ fontSize: '18px' }} /></span> <input ref={inputRef} type="text" style={STYLES.createInput} placeholder={`Name for new ${createState.type}...`} value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmCreate(); if (e.key === 'Escape') handleCancelCreate(); }} /> <button style={STYLES.button} onClick={handleConfirmCreate}><dc.Icon icon="check" style={{ fontSize: '14px' }} /></button> <button style={STYLES.button} onClick={handleCancelCreate}><dc.Icon icon="x" style={{ fontSize: '14px' }} /></button> </div>)}
            <div style={contentDynamicStyle}> {isLoading && !fileTree && <p>Loading files...</p>} {error && <p style={{ color: '#c53030' }}>Error: {error}</p>} {fileTree && (<FileExplorerItem item={fileTree} depth={0} onFileSelect={handleFileSelectInternal} activeFile={activeFile} onFolderSelect={handleFolderClick} selectedFolderPath={selectedFolderPath} openFolders={openFolders} onToggleFolder={handleToggleFolder} draggedItem={draggedItem} dropTargetPath={dropTargetPath} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onDragEnd={handleDragEnd} renamingPath={renamingPath} onStartRename={handleStartRename} onRenameChange={{ value: renameValue, handler: setRenameValue }} onConfirmRename={handleConfirmRename} onCancelRename={handleCancelRename} onContextMenu={handleContextMenu} />)} </div>
        </div>
    );
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 3. THE LIVE EDITOR (Middle Pane) ---
// =-=----=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function PlaygroundEditor({ filePath, onSave, reloadKey }) {
    const MONACO_VERSION = "0.45.0";
    const SETUP_DIR_BASE = ".datacore/playground";
    const SETUP_DIR = `${SETUP_DIR_BASE}/monaco-host`;
    const HOST_FILE_VERSION = 19;
    const HOST_FILENAME_BASE = "monaco-host";
    const HOST_FILENAME = `${HOST_FILENAME_BASE}-v${HOST_FILE_VERSION}.html`;
    const HOST_FILE_PATH = `${SETUP_DIR}/${HOST_FILENAME}`;
    const TYPES_CACHE_DIR = `${SETUP_DIR_BASE}/types`;
    const OBSIDIAN_TYPES_FILENAME = `obsidian.d.ts`;
    const OBSIDIAN_TYPES_PATH = `${TYPES_CACHE_DIR}/${OBSIDIAN_TYPES_FILENAME}`;
    const OBSIDIAN_TYPES_URL = 'https://raw.githubusercontent.com/obsidianmd/obsidian-api/master/obsidian.d.ts';

    const [status, setStatus] = useState("Select a file to begin editing.");
    const [isHostFileReady, setIsHostFileReady] = useState(false);
    const [lintResults, setLintResults] = useState({ warnings: 0, infos: 0 });
    const iframeRef = useRef(null);
    const isEditorReadyRef = useRef(false);
    const pendingContentRef = useRef(null);
    const currentFileContentRef = useRef("");

    const debouncedLint = useCallback(debounce((path, code) => {
        if (!iframeRef.current || !path) return;
        const markers = runLinter(code);
        const warnings = markers.filter(m => m.severity === 'Warning').length;
        const infos = markers.filter(m => m.severity === 'Info').length;
        setLintResults({ warnings, infos });
        iframeRef.current.contentWindow.postMessage({ type: 'set-markers', value: { filePath: `file:///${path}`, markers, } }, '*');
    }, 500), []);

    useEffect(() => {
        const setupHostFile = async () => {
            if (typeof app === 'undefined' || !app.vault?.adapter) { setStatus("Setup failed: Obsidian app context not available."); return; }
            const adapter = app.vault.adapter;
            if (await adapter.exists(HOST_FILE_PATH)) { setIsHostFileReady(true); return; }
            setStatus("Performing first-time editor setup...");
            try {
                if (!await adapter.exists(SETUP_DIR)) await adapter.mkdir(SETUP_DIR);
                const monacoLoaderUrl = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs/loader.js`;
                const monacoBasePath = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs`;
                const hostHtmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body,html{margin:0;padding:0;height:100%;overflow:hidden}#container{width:100%;height:100%}</style></head><body><div id="container"></div><script src="${monacoLoaderUrl}"></script><script>
                    let editor = null;
                    const params = new URLSearchParams(window.location.search);
                    const initialTheme = params.get("theme");
                    function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }
                    require.config({ paths: { 'vs': '${monacoBasePath}' }});
                    window.addEventListener("message", (event) => {
                        const { type, value } = event.data;
                        if (!editor) return;
                        switch (type) {
                            case 'set-content': { const { code, language, filePath } = value; const modelUri = monaco.Uri.parse(filePath || "inmemory://model/" + Date.now()); let model = monaco.editor.getModel(modelUri); if (model) { if (model.getValue() !== code) model.setValue(code); } else { model = monaco.editor.createModel(code, language, modelUri); } if (editor.getModel() !== model) editor.setModel(model); monaco.editor.setModelMarkers(model, 'linter', []); break; }
                            case 'set-theme': { monaco.editor.setTheme(value); break; }
                            case 'setup-language-services': { if (value) { monaco.languages.typescript.javascriptDefaults.setCompilerOptions(value.compilerOptions); monaco.languages.typescript.typescriptDefaults.setCompilerOptions(value.compilerOptions); if (value.extraLibs) { value.extraLibs.forEach(lib => { monaco.languages.typescript.javascriptDefaults.addExtraLib(lib.content, lib.filePath); monaco.languages.typescript.typescriptDefaults.addExtraLib(lib.content, lib.filePath); }); } } break; }
                            case 'set-markers': { const { filePath, markers } = value; const modelUri = monaco.Uri.parse(filePath); const model = monaco.editor.getModel(modelUri); if (model) { const severityMap = { 'Error': monaco.MarkerSeverity.Error, 'Warning': monaco.MarkerSeverity.Warning, 'Info': monaco.MarkerSeverity.Info, 'Hint': monaco.MarkerSeverity.Hint, }; const monacoMarkers = markers.map(m => ({ ...m, severity: severityMap[m.severity] || monaco.MarkerSeverity.Warning })); monaco.editor.setModelMarkers(model, 'linter', monacoMarkers); } break; }
                        }
                    });
                    require(['vs/editor/editor.main'], function() { editor = monaco.editor.create(document.getElementById('container'), { model: null, theme: initialTheme, automaticLayout: true, minimap: { enabled: true }, wordWrap: 'on', fontSize: 14, fontFamily: 'monospace', }); editor.onDidChangeModelContent(debounce(() => { parent.postMessage({ type: 'change', value: editor.getValue() }, '*'); }, 200)); parent.postMessage({ type: 'editor-ready' }, '*'); });
                </script></body></html>`;
                await adapter.write(HOST_FILE_PATH, hostHtmlContent); setIsHostFileReady(true); setStatus("Editor setup complete.");
            } catch (error) { console.error("[PlaygroundEditor] Monaco host setup failed:", error); setStatus(`Setup failed: ${error.message}`); }
        };
        setupHostFile();
    }, []);

    const sendContentToEditor = useCallback((contentPayload) => { if (!contentPayload) return; if (isEditorReadyRef.current && iframeRef.current) { iframeRef.current.contentWindow.postMessage(contentPayload, '*'); pendingContentRef.current = null; } else { pendingContentRef.current = contentPayload; } }, []);

    useEffect(() => {
        if (!filePath) { setStatus("Select a file to edit."); sendContentToEditor({ type: 'set-content', value: { code: `// No file selected. Please choose a file from the explorer.`, language: 'plaintext', filePath: 'welcome.js' } }); setLintResults({ warnings: 0, infos: 0 }); return; }
        const loadFile = async () => {
            setStatus(`Loading ${filePath}...`);
            try {
                const fileContent = await app.vault.adapter.read(filePath);
                currentFileContentRef.current = fileContent; let language = 'plaintext';
                const extension = filePath.split('.').pop();
                switch (extension) { case 'js': case 'jsx': language = 'javascript'; break; case 'ts': case 'tsx': language = 'typescript'; break; case 'css': language = 'css'; break; case 'json': language = 'json'; break; case 'html': language = 'html'; break; case 'md': language = 'markdown'; break; }
                sendContentToEditor({ type: 'set-content', value: { code: fileContent, language, filePath: `file:///${filePath}` } });
                debouncedLint(filePath, fileContent); setStatus("Ready");
            } catch (e) { console.error(`[PlaygroundEditor] Error reading file: ${e.message}`); setStatus(`Error reading ${filePath}`); }
        };
        loadFile();
    }, [filePath, sendContentToEditor, debouncedLint]);

    useEffect(() => {
        const handleMessage = async (event) => {
            if (!event.data || !iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
            const { type, value } = event.data;
            if (type === 'editor-ready') {
                isEditorReadyRef.current = true;
                iframeRef.current.contentWindow.postMessage({ type: 'set-theme', value: 'vs-dark' }, '*');
                const compilerOptions = { allowNonTsExtensions: true, moduleResolution: 2, target: 99, module: 99, jsx: 2, allowJs: true, };
                const extraLibs = [];
                const adapter = app.vault.adapter;
                try {
                    const reactDtsResponse = await requestUrl({ url: "https://unpkg.com/@types/react@17/index.d.ts" });
                    extraLibs.push({ content: reactDtsResponse.text, filePath: 'file:///node_modules/@types/react/index.d.ts' });
                    let obsidianDts;
                    if (await adapter.exists(OBSIDIAN_TYPES_PATH)) { obsidianDts = await adapter.read(OBSIDIAN_TYPES_PATH); }
                    else {
                        setStatus("Downloading Obsidian API types..."); CustomNotice("Downloading Obsidian API types for first-time setup...");
                        if (!await adapter.exists(TYPES_CACHE_DIR)) { await adapter.mkdir(TYPES_CACHE_DIR); }
                        const response = await requestUrl({ url: OBSIDIAN_TYPES_URL }); obsidianDts = response.text; await adapter.write(OBSIDIAN_TYPES_PATH, obsidianDts);
                        setStatus("API types cached successfully."); CustomNotice("Obsidian API types have been cached locally.");
                    }
                    extraLibs.push({ content: obsidianDts, filePath: 'file:///node_modules/obsidian/obsidian.d.ts' });
                } catch (e) { console.error("Could not fetch or cache type definitions:", e); CustomNotice("Error: Failed to load API type definitions. Autocomplete may be incomplete.", 4000); }

                if (!iframeRef.current) return;
                iframeRef.current.contentWindow.postMessage({ type: 'setup-language-services', value: { compilerOptions, extraLibs } }, '*');
                if (pendingContentRef.current) { sendContentToEditor(pendingContentRef.current); }
                setStatus(s => s.startsWith("API types") || s.startsWith("Downloading") ? "Ready" : s);
                return;
            }
            if (type === 'change') { currentFileContentRef.current = value; if (filePath) { debouncedLint(filePath, value); } }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [sendContentToEditor, filePath, debouncedLint]);

    const performSave = useCallback(async () => {
        if (!filePath) return; setStatus("Saving...");
        try { await app.vault.adapter.write(filePath, currentFileContentRef.current); if (onSave) { onSave(filePath, currentFileContentRef.current); } setStatus("Saved successfully ✅"); setTimeout(() => setStatus(s => s === "Saved successfully ✅" ? "Ready" : s), 2000); } catch (e) { setStatus(`Error saving: ${e.message}`); console.error("Error during save:", e); }
    }, [filePath, onSave]);

    useEffect(() => { const handleKeyDown = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); performSave(); } }; document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }, [performSave]);
    const iframeSrc = useMemo(() => { if (!isHostFileReady) return "about:blank"; return dc.app.vault.adapter.getResourcePath(HOST_FILE_PATH); }, [isHostFileReady, HOST_FILE_PATH]);

    return (
        <div style={styles.editorPaneContainer}>
            <div style={{ flex: 1, position: 'relative' }}> {iframeSrc === "about:blank" ? (<div style={{ padding: '20px', textAlign: 'center', color: '#ccc' }}>{status}</div>) : (<iframe key={reloadKey} style={{ width: '100%', height: '100%', border: 'none' }} src={iframeSrc} ref={iframeRef} name={`monaco-editor-${filePath}`} />)} </div>
            <div style={styles.statusBar}>
                <span>{status}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span title={`${lintResults.warnings} warnings, ${lintResults.infos} info hints`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><dc.Icon icon="alert-triangle" style={{ color: '#f1fa8c', width: '14px', height: '14px' }} /> {lintResults.warnings}</span> <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><dc.Icon icon="info" style={{ color: '#89b4fa', width: '14px', height: '14px' }} /> {lintResults.infos}</span> </span>
                    <span>{filePath || 'No file selected'}</span>
                </div>
                <button style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', color: '#e0e0e0', borderRadius: '4px', fontFamily: 'monospace' }} onClick={performSave} disabled={!filePath}><dc.Icon icon="save" style={{ width: '14px', height: '14px' }} /> Save (Ctrl+S)</button>
            </div>
        </div>
    );
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 4. THE INTEGRATED TERMINAL (Bottom Pane) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function IntegratedTerminal({ rootPath }) {
    const [tabs, setTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const outputRefs = useRef({});
    const inputRefs = useRef({});
    const workingDirectory = useMemo(() => { const vaultBasePath = dc.app.vault.adapter.getBasePath(); return path.join(vaultBasePath, rootPath || ''); }, [rootPath]);
    const THEME = { background: '#0a0a0a', foreground: '#d0d0d0', selection: '#222222', comment: '#666666', purple: '#8A2BE2', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c', blue: '#89b4fa', cyan: '#89dceb', };
    const FONT_SETTINGS = { fontFamily: '"Fira Code", Menlo, "DejaVu Sans Mono", "Lucida Console", monospace', fontSize: '13px' };
    const ANSI_COLORS = { '30': '#45475a', '31': THEME.red, '32': THEME.green, '33': THEME.yellow, '34': THEME.blue, '35': THEME.purple, '36': THEME.cyan, '37': THEME.foreground, '90': '#9399b2', '91': THEME.red, '92': THEME.green, '93': THEME.yellow, '94': THEME.blue, '95': THEME.purple, '96': THEME.cyan, '97': '#a6adc8' };
    const parseAnsi = (text) => { const ansiRegex = /\u001b\[(\d+;?)*m/g; const parts = text.split(ansiRegex).filter(Boolean); const elements = []; let currentStyle = {}; let key = 0; for (const part of parts) { if (/^\d+;?$/.test(part)) { const codes = part.split(';').map(Number); for (const code of codes) { if (code === 0) currentStyle = {}; else if (ANSI_COLORS[code]) currentStyle.color = ANSI_COLORS[code]; else if (code === 1) currentStyle.fontWeight = 'bold'; else if (code === 4) currentStyle.textDecoration = 'underline'; } } else { elements.push(<span key={key++} style={currentStyle}>{part}</span>); } } return elements; };
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
    const appendToOutput = (tabId, line) => { setTabs(prev => prev.map(t => t.id === tabId ? { ...t, output: [...t.output, line] } : t)); };
    const handleNewTab = useCallback(() => { const newTabId = Date.now(); const newTab = { id: newTabId, title: `Shell ${tabs.length + 1}`, output: [<div style={{ color: THEME.comment }}>Working directory: {workingDirectory}</div>], status: 'idle', process: null, currentInput: '', commandHistory: [], historyIndex: 0 }; setTabs(prev => [...prev, newTab]); setActiveTabId(newTabId); setTimeout(() => inputRefs.current[newTabId]?.focus(), 0); }, [tabs.length, workingDirectory]);
    useEffect(() => { if (tabs.length === 0) { handleNewTab(); } }, [tabs.length, handleNewTab]);
    const handleCloseTab = (tabIdToClose) => { const tab = tabs.find(t => t.id === tabIdToClose); if (tab?.process) { try { process.kill(-tab.process.pid, 'SIGKILL'); } catch (e) { console.warn(`Could not kill process for tab ${tabIdToClose}`, e); } } setTabs(prev => { const remainingTabs = prev.filter(t => t.id !== tabIdToClose); if (activeTabId === tabIdToClose) { setActiveTabId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null); } return remainingTabs; }); };
    const runCommand = (tabId, command) => {
        if (!command.trim()) return; const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/sh'); const promptLine = <div style={{ whiteSpace: 'nowrap' }}><span style={{ color: THEME.purple, userSelect: 'none' }}>❯ </span> {command}</div>; appendToOutput(tabId, promptLine);
        const child = spawn(shell, ['-l', '-c', command], { cwd: workingDirectory, detached: true });
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, process: child, status: 'running', currentInput: '', commandHistory: [command, ...t.commandHistory], historyIndex: 0 } : t));
        const handleData = (data) => { const lines = data.toString().split('\n'); lines.forEach((line, index) => { if (index === lines.length - 1 && line === '') return; appendToOutput(tabId, <div>{parseAnsi(line)}</div>); }); };
        child.stdout.on('data', handleData); child.stderr.on('data', handleData);
        const onExit = (code) => { appendToOutput(tabId, <div style={{ color: THEME.comment, marginTop: '5px' }}>Process finished with exit code {code}.</div>); setTabs(prev => prev.map(t => t.id === tabId ? { ...t, process: null, status: 'idle' } : t)); };
        child.on('close', onExit); child.on('error', (err) => { appendToOutput(tabId, <div style={{ color: THEME.red, marginTop: '5px' }}>Error: {err.message}</div>); onExit(-1); });
    };
    const handleInputKeyDown = (e, tab) => {
        if (e.key === 'Enter') { e.preventDefault(); if (tab.status === 'idle') { runCommand(tab.id, tab.currentInput); } }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (tab.historyIndex < tab.commandHistory.length) { const newIndex = tab.historyIndex + 1; setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, historyIndex: newIndex, currentInput: t.commandHistory[newIndex - 1] || '' } : t)); } }
        else if (e.key === 'ArrowDown') { e.preventDefault(); if (tab.historyIndex > 0) { const newIndex = tab.historyIndex - 1; setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, historyIndex: newIndex, currentInput: t.commandHistory[newIndex - 1] || '' } : t)); } }
        else if (e.key === 'c' && e.ctrlKey && activeTab?.process) { try { process.kill(-activeTab.process.pid, 'SIGINT'); } catch (e) { console.warn("Failed to send SIGINT", e) } CustomNotice('Sent interrupt signal (Ctrl+C)'); }
    };
    useEffect(() => { if (activeTabId && outputRefs.current[activeTabId]) { outputRefs.current[activeTabId].scrollTop = outputRefs.current[activeTabId].scrollHeight; } }, [tabs, activeTabId]);
    const terminalStyles = { wrapper: { ...FONT_SETTINGS, backgroundColor: THEME.background, color: THEME.foreground, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }, tabBar: { display: 'flex', backgroundColor: '#000000', flexShrink: 0 }, tab: { padding: '8px 24px 8px 16px', cursor: 'pointer', color: THEME.comment, borderBottom: `2px solid transparent`, position: 'relative', transition: 'color 0.2s' }, activeTab: { color: THEME.purple, borderBottom: `2px solid ${THEME.purple}` }, closeTabBtn: { position: 'absolute', top: '50%', right: '6px', transform: 'translateY(-50%)', color: THEME.comment, fontSize: '16px', lineHeight: '1', cursor: 'pointer', opacity: 0.6 }, newTabBtn: { padding: '8px 12px', cursor: 'pointer', color: THEME.purple, fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }, content: { flex: 1, padding: '10px', overflowY: 'auto', lineHeight: '1.6', backgroundColor: THEME.background }, inputArea: { display: 'flex', alignItems: 'center', padding: '5px 10px', backgroundColor: '#000000', borderTop: `1px solid ${THEME.selection}` }, prompt: { color: THEME.purple, marginRight: '8px', userSelect: 'none' }, input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: THEME.foreground, ...FONT_SETTINGS }, statusIndicator: { display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', marginRight: '8px', backgroundColor: THEME.comment, transition: 'background-color 0.3s' }, statusRunning: { backgroundColor: THEME.purple, animation: 'pulse 1.5s infinite' }, };
    return (<div style={terminalStyles.wrapper}> <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }`}</style> <div style={terminalStyles.tabBar}> {tabs.map(tab => (<div key={tab.id} style={{ ...terminalStyles.tab, ...(tab.id === activeTabId ? terminalStyles.activeTab : {}) }} onClick={() => setActiveTabId(tab.id)}> <span style={{ ...terminalStyles.statusIndicator, ...(tab.status === 'running' ? terminalStyles.statusRunning : {}) }}></span> {tab.title} <span style={terminalStyles.closeTabBtn} onMouseOver={(e) => e.currentTarget.style.color = THEME.purple} onMouseOut={(e) => e.currentTarget.style.color = THEME.comment} onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}>×</span> </div>))} <div style={terminalStyles.newTabBtn} onClick={handleNewTab}>+</div> </div> {activeTab ? (<> <div style={terminalStyles.content} ref={el => outputRefs.current[activeTab.id] = el} onClick={() => inputRefs.current[activeTab.id]?.focus()}> {activeTab.output.map((line, i) => <div key={i}>{line}</div>)} </div> <div style={terminalStyles.inputArea}> <span style={terminalStyles.prompt}>❯</span> <input ref={el => inputRefs.current[activeTab.id] = el} type="text" style={terminalStyles.input} value={activeTab.currentInput} onChange={(e) => setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, currentInput: e.target.value } : t))} onKeyDown={(e) => handleInputKeyDown(e, activeTab)} placeholder={activeTab.status === 'running' ? 'Process running... (Ctrl+C to interrupt)' : 'Enter command'} disabled={activeTab.status === 'running'} autoFocus /> </div> </>) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.comment }}>No active terminal. <span style={{ textDecoration: 'underline', cursor: 'pointer', marginLeft: '5px', color: THEME.purple }} onClick={handleNewTab}>Create a new tab?</span></div>} </div>);
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 4.5: Editor Tab Bar Component ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function EditorTabBar({ tabs, activeTabPath, onTabClick, onTabClose }) {
    const tabStyles = { bar: { display: 'flex', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333', flexShrink: 0, overflowX: 'auto' }, tab: { padding: '10px 24px 10px 16px', cursor: 'pointer', color: '#888', borderBottom: '2px solid transparent', transition: 'color 0.2s, border-color 0.2s', whiteSpace: 'nowrap', fontSize: '13px', position: 'relative' }, activeTab: { color: '#e0e0e0', borderBottom: '2px solid #8A2BE2' }, closeBtn: { position: 'absolute', top: '50%', right: '6px', transform: 'translateY(-50%)', color: '#888', fontSize: '16px', lineHeight: '1', cursor: 'pointer', opacity: 0.7 } };
    return (<div style={tabStyles.bar}> {tabs.map(tab => (<div key={tab.path} style={{ ...tabStyles.tab, ...(tab.path === activeTabPath ? tabStyles.activeTab : {}) }} onClick={() => onTabClick(tab.path)}> <span>{tab.title}</span> <span style={tabStyles.closeBtn} onMouseOver={(e) => e.currentTarget.style.color = '#e0e0e0'} onMouseOut={(e) => e.currentTarget.style.color = '#888'} onClick={(e) => { e.stopPropagation(); onTabClose(tab.path); }}>×</span> </div>))} </div>);
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 5. MAIN COMPONENT - Live Development Environment (Integrated) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function LiveDevelopmentEnvironment({ rootPath = '/', onSave: onFileSave, initialFullTab }) {
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTabPath, setActiveTabPath] = useState(null);
    const [activeMode, setActiveMode] = useState(() => {
        // Only use initialFullTab prop if explicitly provided
        if (initialFullTab !== undefined) {
            return initialFullTab ? 'fullTab' : 'default';
        }
        // Otherwise maintain default behavior (starts in default mode)
        return 'default';
    });
    const [initialParent, setInitialParent] = useState(null);
    const [isResizing, setIsResizing] = useState(false);
    const [activeResizer, setActiveResizer] = useState(null);
    const [explorerWidth, setExplorerWidth] = useState(20);
    const [terminalHeight, setTerminalHeight] = useState(30);
    const [isTerminalVisible, setIsTerminalVisible] = useState(false);
    const [activeLeftPaneTab, setActiveLeftPaneTab] = useState('files'); // 'files' or 'git'

    const absoluteRepoPath = useMemo(() => { const vaultBasePath = dc.app.vault.adapter.getBasePath(); return path.join(vaultBasePath, rootPath || ''); }, [rootPath]);
    const containerRef = useRef(null);
    const mainContentRef = useRef(null);
    const resizerOverlayRef = useRef(null);

    useEffect(() => { const statusBar = document.querySelector('body > .app-container .status-bar'); if (statusBar) { const originalDisplay = statusBar.style.display; statusBar.style.display = 'none'; return () => { const statusBarToRestore = document.querySelector('body > .app-container .status-bar'); if (statusBarToRestore) statusBarToRestore.style.display = originalDisplay; }; } }, []);
    const handleFileSelect = useCallback((path) => { if (path === null) { setActiveTabPath(null); return; } if (!openTabs.some(tab => tab.path === path)) { setOpenTabs(prev => [...prev, { path, title: path.split('/').pop() }]); } setActiveTabPath(path); }, [openTabs]);
    const handleCloseTab = useCallback((path) => { const tabIndex = openTabs.findIndex(tab => tab.path === path); const newTabs = openTabs.filter(tab => tab.path !== path); setOpenTabs(newTabs); if (activeTabPath === path) { const newActivePath = newTabs.length > 0 ? newTabs[Math.max(0, tabIndex - 1)].path : null; setActiveTabPath(newActivePath); } }, [openTabs, activeTabPath]);

    const handleSave = useCallback(async (savedFilePath, content) => {
        if (onFileSave) { onFileSave(savedFilePath, content); }
    }, [onFileSave]);

    const handleMouseDown = useCallback((resizerId) => { setIsResizing(true); setActiveResizer(resizerId); if (resizerOverlayRef.current) { resizerOverlayRef.current.style.display = 'block'; } }, []);
    const handleMouseUp = useCallback(() => { setIsResizing(false); setActiveResizer(null); if (resizerOverlayRef.current) { resizerOverlayRef.current.style.display = 'none'; } }, []);
    const handleMouseMove = useCallback((e) => {
        if (!isResizing) return; const { clientX, clientY } = e;
        if (activeResizer === 'main-terminal') { const containerRect = containerRef.current.getBoundingClientRect(); const newTerminalHeight = Math.max(10, Math.min(((containerRect.bottom - clientY) / containerRect.height) * 100, 80)); setTerminalHeight(newTerminalHeight); }
        else if (activeResizer === 'explorer-editor') { const mainRect = mainContentRef.current.getBoundingClientRect(); const mouseX = clientX - mainRect.left; const newExplorerWidth = Math.max(10, Math.min((mouseX / mainRect.width) * 100, 80)); setExplorerWidth(newExplorerWidth); }
    }, [isResizing, activeResizer]);

    useEffect(() => {
        const overlay = resizerOverlayRef.current; if (isResizing && overlay) { overlay.addEventListener('mousemove', handleMouseMove); overlay.addEventListener('mouseup', handleMouseUp); overlay.addEventListener('mouseleave', handleMouseUp); }
        return () => { if (overlay) { overlay.removeEventListener('mousemove', handleMouseMove); overlay.removeEventListener('mouseup', handleMouseUp); overlay.removeEventListener('mouseleave', handleMouseUp); } };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    function findNearestAncestorWithClass(element, className) { if (!element) return null; let current = element.parentNode; while (current) { if (current.classList && current.classList.contains(className)) { return current; } current = current.parentNode; } return null; }
    function findDirectChildByClass(parent, className) { if (!parent) return null; for (const child of parent.children) { if (child.classList && child.classList.contains(className)) { return child; } } return null; }
    const toggleScreenMode = () => { setActiveMode(prev => (prev === 'default' ? 'fullTab' : 'default')); };
    useEffect(() => { const container = containerRef.current; if (!container) return; if (!initialParent) { setInitialParent(container.parentNode); } if (activeMode === 'fullTab') { const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content'); if (targetPaneContent) { const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent; contentWrapper.appendChild(container); } } else if (initialParent) { initialParent.appendChild(container); } }, [activeMode, initialParent]);
    const wrapperStyle = useMemo(() => { const baseStyle = { ...styles.baseWrapper, position: 'relative' }; if (activeMode === 'fullTab') { return { ...baseStyle, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }; } return baseStyle; }, [activeMode]);
    const overlayStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9998, display: 'none' };



    const explorerPaneStyle = { flex: `0 0 ${explorerWidth}%`, ...styles.fileExplorerPane };
    const editorContainerStyle = { flex: '1 1 auto', display: 'flex', flexDirection: 'column', minWidth: 0 };
    const mainAreaStyle = { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 };
    const topPanesStyle = { ...styles.mainContent, flex: 1, minHeight: 0, cursor: isResizing ? 'col-resize' : 'default' };
    const terminalAreaStyle = { flex: `0 0 ${terminalHeight}%`, display: 'flex', flexDirection: 'column', minHeight: 0, backgroundColor: '#1f1f1f', cursor: isResizing && activeResizer === 'main-terminal' ? 'row-resize' : 'default' };

    return (
        <div ref={containerRef} style={wrapperStyle}>
            <div ref={resizerOverlayRef} style={overlayStyle}></div>
            <div style={styles.headerBar}>
                <button type="button" style={styles.iconButton} onClick={() => setIsTerminalVisible(p => !p)} title={isTerminalVisible ? "Hide Terminal" : "Show Terminal"}><dc.Icon icon="terminal" /></button>
                <button type="button" style={styles.iconButton} onClick={toggleScreenMode} title={activeMode === 'default' ? "Enter Full Tab Mode" : "Exit Full Tab Mode"}><dc.Icon icon={activeMode === 'default' ? "maximize-2" : "minimize-2"} /></button>
            </div>
            <div style={mainAreaStyle}>
                <div style={topPanesStyle} ref={mainContentRef}>
                    <div style={explorerPaneStyle}>
                        <div style={{ display: 'flex', borderBottom: '1px solid #333', backgroundColor: '#1a1a1a' }}>
                            <button style={{ ...styles.tab, borderBottom: activeLeftPaneTab === 'files' ? styles.activeTab.borderBottom : '2px solid transparent', color: activeLeftPaneTab === 'files' ? styles.activeTab.color : styles.tab.color, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setActiveLeftPaneTab('files')} title="File Explorer" > <dc.Icon icon="folder-open" /> Files </button>
                            <button style={{ ...styles.tab, borderBottom: activeLeftPaneTab === 'git' ? styles.activeTab.borderBottom : '2px solid transparent', color: activeLeftPaneTab === 'git' ? styles.activeTab.color : styles.tab.color, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setActiveLeftPaneTab('git')} title="Git Source Control" > <dc.Icon icon="git-branch" /> Git </button>
                        </div>
                        {activeLeftPaneTab === 'files' ? (<FileExplorerView rootPath={rootPath} onFileSelect={handleFileSelect} activeFile={activeTabPath} />) :  (<GitSuite repoPath={absoluteRepoPath} />) }
                    </div>
                    <div style={{ ...styles.resizer, ...(activeResizer === 'explorer-editor' ? styles.resizerHover : {}) }} onMouseDown={() => handleMouseDown('explorer-editor')} />
                    <div style={editorContainerStyle}>
                        <EditorTabBar tabs={openTabs} activeTabPath={activeTabPath} onTabClick={setActiveTabPath} onTabClose={handleCloseTab} />
                        <PlaygroundEditor key={activeTabPath} filePath={activeTabPath} onSave={handleSave} reloadKey={activeTabPath} />
                    </div>
                </div>
                {isTerminalVisible && (<> <div style={{ ...styles.resizer, ...styles.horizontalResizer, ...(activeResizer === 'main-terminal' ? styles.resizerHover : {}) }} onMouseDown={() => handleMouseDown('main-terminal')} /> <div style={terminalAreaStyle}> <IntegratedTerminal rootPath={rootPath} /> </div> </>)}
            </div>
        </div>
    );
}

// --- EXPORT THE MAIN COMPONENT ---
return { IntegratedIDE: LiveDevelopmentEnvironment };
```












## GitSuite

```jsx
const { useEffect, useRef, useState, useMemo } = dc;

// --- Node.js Imports ---
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');

// --- Custom UI Components (Replaces Obsidian/Datacore UI) ---

// A generic, self-contained Modal class
class CustomModal {
    constructor() {
        this.overlayEl = null;
    }

    open(contentRenderer) {
        if (this.overlayEl) return; // Modal is already open

        // Create overlay
        this.overlayEl = document.createElement('div');
        this.overlayEl.style.position = 'fixed';
        this.overlayEl.style.top = '0';
        this.overlayEl.style.left = '0';
        this.overlayEl.style.width = '100%';
        this.overlayEl.style.height = '100%';
        this.overlayEl.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        this.overlayEl.style.display = 'flex';
        this.overlayEl.style.alignItems = 'center';
        this.overlayEl.style.justifyContent = 'center';
        this.overlayEl.style.zIndex = '1000';

        // Create modal content container
        const contentEl = document.createElement('div');
        contentEl.style.backgroundColor = '#1e1e1e';
        contentEl.style.color = '#e0e0e0';
        contentEl.style.padding = '24px';
        contentEl.style.borderRadius = '8px';
        contentEl.style.border = '1px solid #333';
        contentEl.style.minWidth = '400px';
        contentEl.style.maxWidth = '90vw';
        contentEl.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';

        // Close modal when clicking on the overlay, but not the content
        this.overlayEl.addEventListener('click', (e) => {
            if (e.target === this.overlayEl) {
                this.close();
            }
        });

        // Pass the content container and a close function to the renderer
        if (typeof contentRenderer === 'function') {
            contentRenderer(contentEl, this.close.bind(this));
        }

        this.overlayEl.appendChild(contentEl);
        document.body.appendChild(this.overlayEl);
    }

    close() {
        if (this.overlayEl) {
            document.body.removeChild(this.overlayEl);
            this.overlayEl = null;
        }
    }
}

// --- Core Execution Logic (Self-contained and stable) ---
function getUserShell() {
    if (os.platform() === 'win32') return 'powershell.exe';
    const preferredShell = process.env.SHELL;
    if (preferredShell && fs.existsSync(preferredShell)) return preferredShell;
    return '/bin/sh';
}

function executeShellCommand(commandString, workingDir) {
    return new Promise((resolve, reject) => {
        const userShell = getUserShell();
        const child = spawn(userShell, ['-l', '-c', commandString], { cwd: workingDir });
        let stdout = '', stderr = '';
        child.stdout.on('data', (data) => { stdout += data.toString(); });
        child.stderr.on('data', (data) => { stderr += data.toString(); });
        child.on('close', (code) => {
            if (code !== 0) reject(new Error(stderr || `Command failed with exit code ${code}: ${commandString}`));
            else resolve(stdout);
        });
        child.on('error', (err) => reject(new Error(`Failed to spawn shell '${userShell}': ${err.message}`)));
    });
}

class NewBranchModal {
    constructor(onSubmit) { this.onSubmit = onSubmit; this.branchName = ''; }
    open() {
        new CustomModal().open((contentEl, close) => {
            const header = contentEl.createEl('h2', { text: 'Create New Branch' });
            header.style.marginTop = '0';

            const textInput = contentEl.createEl('input');
            Object.assign(textInput.style, STYLES.input, { marginBottom: '10px' });
            textInput.placeholder = 'Enter new branch name...';
            textInput.oninput = (e) => this.branchName = e.target.value;

            const createButton = contentEl.createEl('button', { text: 'Create' });
            Object.assign(createButton.style, STYLES.button);
            createButton.onclick = () => { if (this.branchName.trim()) { this.onSubmit(this.branchName.trim()); close(); } };

            textInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); createButton.click(); } });
        });
    }
}

class MergeModal {
    constructor(branches, currentBranch, onSubmit) {
        this.branches = branches.filter(b => b !== currentBranch);
        this.onSubmit = onSubmit;
        this.selectedBranch = this.branches[0] || '';
    }
    open() {
        new CustomModal().open((contentEl, close) => {
            const header = contentEl.createEl('h2', { text: 'Merge Branch' });
            header.style.marginTop = '0';
            contentEl.createEl('p', { text: `Select a branch to merge into the current branch:` });

            const dropdown = contentEl.createEl('select');
            Object.assign(dropdown.style, STYLES.input, { marginBottom: '10px', padding: '8px' });

            if (this.branches.length === 0) {
                dropdown.createEl('option', { text: 'No other branches to merge' });
            } else {
                this.branches.forEach(branch => dropdown.createEl('option', { text: branch, value: branch }));
            }
            dropdown.onchange = (e) => this.selectedBranch = e.target.value;

            const mergeButton = contentEl.createEl('button', { text: 'Merge' });
            Object.assign(mergeButton.style, STYLES.button);
            mergeButton.onclick = () => { if (this.selectedBranch) { this.onSubmit(this.selectedBranch); close(); } };

            if (this.branches.length === 0) mergeButton.disabled = true;
        });
    }
}

class HelpModal {
    open() {
        new CustomModal().open((contentEl, close) => {
            const header = contentEl.createEl('h2', { text: 'Connecting a Remote Repository' });
            header.style.marginTop = '0';
            contentEl.createEl('p', { text: 'To push and pull changes, your local repository needs to connect to a remote one hosted on a service like GitHub, GitLab, or Bitbucket.' });
            contentEl.createEl('p', { text: 'The standard workflow is:' });
            const list = contentEl.createEl('ol');
            list.style.paddingLeft = '20px';
            list.createEl('li', { text: 'Create a new, empty repository on your preferred hosting platform.' });
            list.createEl('li', { text: 'Copy the HTTPS or SSH URL they provide.' });
            list.createEl('li', { text: 'Paste that URL into the "Remote URL" field and click "Set Remote".' });

            const subHeader = contentEl.createEl('h4', { text: 'Create a new repository on:' });
            subHeader.style.marginTop = '20px';

            const linkContainer = contentEl.createDiv({ attr: { style: 'display: flex; flex-direction: column; gap: 10px; margin-top: 10px;' } });
            const linkStyle = 'color: #c084fc; text-decoration: none;';
            linkContainer.createEl('a', { text: 'GitHub', href: 'https://github.com/new', attr: { target: '_blank', rel: 'noopener noreferrer', style: linkStyle } });
            linkContainer.createEl('a', { text: 'GitLab', href: 'https://gitlab.com/projects/new', attr: { target: '_blank', rel: 'noopener noreferrer', style: linkStyle } });
            linkContainer.createEl('a', { text: 'Bitbucket', href: 'https://bitbucket.org/repo/create', attr: { target: '_blank', rel: 'noopener noreferrer', style: linkStyle } });

            contentEl.createEl('p', {
                text: 'You can also use any other Git hosting platform of your choice. Just paste its repository URL.',
                attr: { style: 'margin-top: 20px; font-size: 12px; color: #888888;' }
            });
        });
    }
}

function useGitRepository(initialRepoPath) {
    const [repoPath, setRepoPath] = useState(initialRepoPath || dc.app.vault.adapter.basePath);
    const [remoteUrl, setRemoteUrl] = useState('');
    const [ahead, setAhead] = useState(0);
    const [behind, setBehind] = useState(0);
    const [history, setHistory] = useState([]);
    const [isRepo, setIsRepo] = useState(false);
    const [status, setStatus] = useState({ staged: [], changes: [] });
    const [currentBranch, setCurrentBranch] = useState('...');
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const [gitSystemStatus, setGitSystemStatus] = useState('checking');
    const [gitUserName, setGitUserName] = useState('');
    const [gitUserEmail, setGitUserEmail] = useState('');

    const git = {
        version: () => executeShellCommand('git --version', dc.app.vault.adapter.basePath),
        getConfig: (key) => executeShellCommand(`git config --global ${key}`, dc.app.vault.adapter.basePath),
        setConfig: (key, value) => executeShellCommand(`git config --global ${key} "${value}"`, dc.app.vault.adapter.basePath),
        check: (path) => executeShellCommand('git rev-parse --is-inside-work-tree', path),
        status: (path) => executeShellCommand('git status --porcelain -u', path),
        branch: (path) => executeShellCommand('git symbolic-ref --short HEAD', path),
        allBranches: (path) => executeShellCommand('git branch --all', path),
        init: (path) => executeShellCommand('git init -b main', path),
        clone: (parentPath, url, directoryName) => executeShellCommand(`git clone "${url}" "${directoryName}"`, parentPath),
        add: (path, filePath) => executeShellCommand(`git add "${filePath}"`, path),
        addAll: (path) => executeShellCommand('git add .', path),
        reset: (path, filePath) => executeShellCommand(`git reset HEAD -- "${filePath}"`, path),
        commit: (path, message) => executeShellCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`, path),
        checkout: (path, branchName, isNew = false) => executeShellCommand(`git checkout ${isNew ? '-b' : ''} "${branchName}"`, path),
        discard: (path, filePath) => executeShellCommand(`git checkout -- "${filePath}"`, path),
        pull: (path, branch) => executeShellCommand(`git pull origin "${branch}"`, path),
        push: (path, branch) => executeShellCommand(`git push --set-upstream origin ${branch}`, path),
        getRemote: (path) => executeShellCommand('git remote get-url origin', path),
        addOrUpdateRemote: (path, url) => executeShellCommand(`(git remote set-url origin "${url}" || git remote add origin "${url}")`, path),
        fetch: (path) => executeShellCommand('git fetch --prune', path),
        getAheadBehind: (path, branch) => executeShellCommand(`git rev-list --left-right --count origin/${branch}...${branch}`, path),
        merge: (path, sourceBranch) => executeShellCommand(`git merge "${sourceBranch}"`, path),
        log: (path) => executeShellCommand('git log --all --pretty=format:"%H<||>%P<||>%an<||>%ar<||>%d<||>%s<##>" -n 100', path),
        getLocalCommitCount: (path) => executeShellCommand('git rev-list --count HEAD --not --remotes', path),
    };

    const checkGitSystem = async () => {
        setGitSystemStatus('checking');
        try {
            await git.version();
            const [nameResult, emailResult] = await Promise.allSettled([
                git.getConfig('user.name'),
                git.getConfig('user.email')
            ]);
            const name = (nameResult.status === 'fulfilled' && nameResult.value.trim()) || '';
            const email = (emailResult.status === 'fulfilled' && emailResult.value.trim()) || '';
            setGitUserName(name);
            setGitUserEmail(email);
            if (name && email) {
                setGitSystemStatus('ready');
            } else {
                setGitSystemStatus('not_configured');
            }
        } catch (versionErr) {
            setGitSystemStatus('not_found');
        }
    };

    const refreshState = async (path = repoPath) => {
        // The path object from the adapter has a join method
        const adapterPath = dc.app.vault.adapter.path;

        // The CORRECT check: Does a '.git' folder exist *directly* in this path?
        const repoExists = fs.existsSync(adapterPath.join(path, '.git'));
        setIsRepo(repoExists);


        if (repoExists) {
            try {
                await git.fetch(path).catch(() => { });
                const [statusOutput, branchOutputRaw, allBranchesOutput, remoteOutput, logOutput] = await Promise.all([
                    git.status(path),
                    git.branch(path).catch(() => ""),
                    git.allBranches(path),
                    git.getRemote(path).catch(() => ""),
                    git.log(path).catch(() => "")
                ]);

                let currentBranchName = branchOutputRaw.trim();
                const commits = logOutput.trim().split('<##>').filter(Boolean).map(line => {
                    const [hash, parents, author, date, refs, message] = line.trim().split('<||>');
                    return { hash, parents: parents.split(' ').filter(Boolean), author, date, refs: refs.trim(), message };
                });
                setHistory(commits);

                if (!currentBranchName && commits.length === 0) {
                    currentBranchName = 'main';
                }
                setCurrentBranch(currentBranchName || '...');

                setRemoteUrl(remoteOutput.trim());
                if (remoteOutput.trim() && currentBranchName) {
                    try {
                        const aheadBehindOutput = await git.getAheadBehind(path, currentBranchName);
                        const [behindCount, aheadCount] = aheadBehindOutput.trim().split('\t').map(Number);
                        setAhead(aheadCount || 0);
                        setBehind(behindCount || 0);
                    } catch (e) {
                        try {
                            const localCommits = await git.getLocalCommitCount(path);
                            setAhead(parseInt(localCommits.trim(), 10) || 0);
                        } catch (localErr) { setAhead(0); }
                        setBehind(0);
                    }
                } else {
                    setAhead(0);
                    setBehind(0);
                }

                const staged = [], changes = [];
                statusOutput.split('\n').filter(Boolean).forEach(line => {
                    const code = line.substring(0, 2), filePath = line.substring(3);
                    if (code === '??') changes.push({ path: filePath, status: 'U' });
                    else {
                        if (code[0].trim()) staged.push({ path: filePath, status: code[0].trim() });
                        if (code[1].trim()) changes.push({ path: filePath, status: code[1].trim() });
                    }
                });
                setStatus({ staged, changes });

                const parsedBranches = allBranchesOutput.split('\n')
                    .filter(Boolean)
                    .map(b => b.replace(/^\*?\s*/, '').trim())
                    .filter(b => !b.includes('->'))
                    .map(b => b.replace('remotes/origin/', ''))
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .sort();
                if (currentBranchName && currentBranchName !== '...' && !parsedBranches.includes(currentBranchName)) {
                    parsedBranches.unshift(currentBranchName);
                    parsedBranches.sort();
                }
                setBranches(parsedBranches);

            } catch (e) {
                setError(`Failed to refresh Git status: ${e.message}`);
            }
        } else {
            setCurrentBranch('...');
            setBranches([]);
            setStatus({ staged: [], changes: [] });
            setHistory([]);
            setAhead(0);
            setBehind(0);
            setRemoteUrl('');
        }
    };

    const runAction = async (action, isWriteOperation = false) => {
        setIsProcessing(true);
        if (isWriteOperation) setIsSaving(true);
        setError('');
        try {
            await action();
            await new Promise(res => setTimeout(res, 200));
            await refreshState();
        }
        catch (err) { setError(err.message); }
        finally {
            if (isWriteOperation) setIsSaving(false);
            setIsProcessing(false);
        }
    };

    const handleMerge = async (sourceBranch) => {
        if (status.staged.length > 0 || status.changes.length > 0) {
            setError("You have uncommitted changes. Please commit or stash them before merging to avoid losing work.");
            return;
        }
        await runAction(() => git.merge(repoPath, sourceBranch), true);
    };

    const handlePush = async () => {
        if (behind > 0) {
            setError("Your branch is behind the remote. Please Pull first to avoid conflicts.");
            return;
        }
        await runAction(() => git.push(repoPath, currentBranch), true);
    };

    const cloneRepo = (url, targetDirectory) => runAction(async () => {
        const parentDir = dc.app.vault.adapter.basePath;
        const newRepoPath = dc.app.vault.adapter.path.join(parentDir, targetDirectory);
        if (fs.existsSync(newRepoPath)) {
            throw new Error(`Directory '${targetDirectory}' already exists in the vault.`);
        }
        await git.clone(parentDir, url, targetDirectory);
        setRepoPath(newRepoPath);
    }, true);

    const setGitConfig = (name, email) => runAction(async () => {
        if (!name.trim() || !email.trim()) {
            throw new Error("Both name and email are required.");
        }
        await git.setConfig('user.name', name);
        await git.setConfig('user.email', email);
        await checkGitSystem();
    }, true);

    useEffect(() => {
        (async () => {
            await checkGitSystem();
        })();
    }, []);

    useEffect(() => {
        if (gitSystemStatus === 'ready') {
            (async () => {
                setIsLoading(true);
                await refreshState();
                setIsLoading(false);
            })();
        }
    }, [repoPath, gitSystemStatus]);

    return {
        repoPath, isRepo, status, currentBranch, branches, history, remoteUrl,
        ahead, behind, isLoading, isProcessing, isSaving, error, setRepoPath,
        gitSystemStatus, gitUserName, gitUserEmail,
        checkGitSystem, setGitConfig,
        refresh: () => runAction(() => refreshState(), false),
        init: () => runAction(() => git.init(repoPath), true),
        cloneRepo,
        stage: (filePath) => runAction(() => git.add(repoPath, filePath), true),
        stageAll: () => runAction(() => git.addAll(repoPath), true),
        unstage: (filePath) => runAction(() => git.reset(repoPath, filePath), true),
        discard: (filePath) => runAction(() => git.discard(repoPath, filePath), true),
        commit: (message) => runAction(() => git.commit(repoPath, message), true),
        pull: () => runAction(() => git.pull(repoPath, currentBranch), true),
        push: handlePush,
        merge: handleMerge,
        checkoutBranch: (branchName) => runAction(() => git.checkout(repoPath, branchName), true),
        createBranch: (branchName) => runAction(() => git.checkout(repoPath, branchName, true), true),
        setRemote: (url) => runAction(() => git.addOrUpdateRemote(repoPath, url), true),
    };
}


// =================================================================================
// --- UI COMPONENTS ---
// =================================================================================
const ICONS = {
    branch: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12" /><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M6 15h12" /></svg>,
    add: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    remove: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    delete: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>,
    pull: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    push: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 6 12 1 17 6" /><line x1="12" y1="1" x2="12" y2="15" /></svg>,
    refresh: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
    chevronDown: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
    chevronRight: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
    merge: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 18h-3a3 3 0 0 1-3-3V5" /><path d="M6 5v10a3 3 0 0 0 3 3h3" /><path d="m15 15-3-3 3-3" /></svg>,
    remote: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg>,
    help: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
};

const STYLES = {
    wrapper: { position: 'relative', backgroundColor: "#121212", color: "#e0e0e0", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", height: "100%", width: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" },
    mainArea: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflow: 'hidden' },
    input: { width: '100%', boxSizing: 'border-box', backgroundColor: '#1e1e1e', border: '1px solid #333333', borderRadius: '6px', padding: '10px 14px', color: '#e0e0e0', fontSize: '14px', '::placeholder': { color: '#6b6b6b' }, ':focus': { borderColor: '#9333ea', boxShadow: '0 0 0 2px rgba(147, 51, 234, 0.3)' } },
    button: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#9333ea', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'background-color 0.2s', ':hover': { backgroundColor: '#a855f7' }, ':disabled': { backgroundColor: '#2a2a2a', color: '#6b6b6b', cursor: 'not-allowed' } },
    buttonSecondary: { backgroundColor: '#1e1e1e', color: '#e0e0e0', border: '1px solid #333333', ':hover': { backgroundColor: '#2a2a2a' } },
    buttonIcon: { background: 'transparent', border: '1px solid #333333', color: '#9e9e9e', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', ':hover': { backgroundColor: '#2a2a2a', color: '#e0e0e0' } },
    branchSelect: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e1e1e', border: '1px solid #333333', borderRadius: '6px', padding: '8px 12px' },
    commitInput: { minHeight: '90px', resize: 'vertical' },
    historyContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0', overflow: 'hidden', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333333' },
    historyHeader: { padding: '12px 16px', borderBottom: '1px solid #333333', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    historyHeaderTitle: { fontWeight: 500, fontSize: '16px' },
    historyContent: { flex: 1, overflowY: 'auto' },
    historyItem: { position: 'relative', display: 'flex', alignItems: 'center', padding: '16px 16px 16px 35px', borderBottom: '1px solid #333333', ':last-child': { borderBottom: 'none' } },
    historyGraphLine: { position: 'absolute', left: '16px', top: 0, bottom: 0, width: '2px', backgroundColor: '#333333' },
    historyGraphDot: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '10px', height: '10px', borderRadius: '50%', zIndex: 1 },
    historyDetails: { display: 'flex', flexDirection: 'column', gap: '6px' },
    historyMessage: { fontWeight: 500, color: '#e0e0e0', fontSize: '14px' },
    historyMeta: { fontSize: '12px', color: '#888888' },
    historyRefPillContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' },
    historyRefPill: { padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
    historyRefPillHead: { backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#c084fc' },
    historyRefPillLocal: { backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#c084fc' },
    historyRefPillRemote: { backgroundColor: '#3a3a3a', color: '#b0b0b0' },
};

const FileListSection = ({ title, files, onStage, onStageAll, onUnstage, onDiscard, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const hasFiles = files && files.length > 0;

    const getStatusStyle = (status) => {
        const baseStyle = { fontWeight: 'bold', fontFamily: 'monospace', fontSize: '13px', flexShrink: 0, width: '16px', textAlign: 'center' };
        switch (status) {
            case 'M': return { ...baseStyle, color: '#e5c07b' };
            case 'U': return { ...baseStyle, color: '#98c379' };
            case 'D': return { ...baseStyle, color: '#e06c75' };
            case 'A': return { ...baseStyle, color: '#98c379' };
            case 'R': return { ...baseStyle, color: '#c678dd' };
            default: return { ...baseStyle, color: '#abb2bf' };
        }
    };

    return (
        <div style={{ border: '1px solid #333333', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
            <div style={{ ...STYLES.historyHeader, cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
                <span style={{ ...STYLES.historyHeaderTitle, fontSize: '14px' }}>{title} ({files.length})</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {onStageAll && hasFiles && (
                        <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Stage All" onClick={(e) => { e.stopPropagation(); onStageAll(); }}>
                            {ICONS.add}
                        </button>
                    )}
                    <span style={{ ...STYLES.buttonIcon, pointerEvents: 'none', border: 'none' }}>{isOpen ? ICONS.chevronDown : ICONS.chevronRight}</span>
                </div>
            </div>
            {isOpen && (
                <div>
                    {hasFiles ? (
                        files.map(file => (
                            <div key={file.path} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderTop: '1px solid #333333' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#b0b0b0', wordBreak: 'break-all' }}>{file.path}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {onStage && <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Stage" onClick={() => onStage(file.path)}>{ICONS.add}</button>}
                                        {onUnstage && <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Unstage" onClick={() => onUnstage(file.path)}>{ICONS.remove}</button>}
                                        {onDiscard && <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Discard Changes" onClick={() => onDiscard(file.path)}>{ICONS.delete}</button>}
                                    </div>
                                    <span style={getStatusStyle(file.status)}>{file.status}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '12px 16px', color: '#6b6b6b', fontSize: '13px', borderTop: '1px solid #333333' }}>No changes to display.</div>
                    )}
                </div>
            )}
        </div>
    );
};

const HistoryView = ({ history }) => {
    const [isOpen, setIsOpen] = useState(true);
    const branchColorMap = useRef(new Map());
    const MAIN_BRANCH_COLOR = '#9333ea';
    const ACCENT_COLORS = ['#f472b6', '#38bdf8', '#2dd4bf', '#fb923c', '#a78bfa', '#facc15'];

    const commitToBranchMap = useMemo(() => {
        const map = new Map();
        if (!history || history.length === 0) return map;
        const commitMap = new Map(history.map(c => [c.hash, c]));
        const branchHeads = [];
        for (const commit of history) {
            const refs = commit.refs.replace(/[()]/g, '').split(',').map(r => r.trim());
            for (const ref of refs) {
                if (!ref.startsWith('origin/') && ref !== 'HEAD' && !ref.startsWith('tag:')) {
                    let branchName = ref.startsWith('HEAD ->') ? ref.replace('HEAD ->', '').trim() : ref.trim();
                    if (branchName && !branchHeads.some(h => h.branchName === branchName)) {
                        branchHeads.push({ branchName, hash: commit.hash });
                    }
                }
            }
        }
        const headHashes = new Set(branchHeads.map(h => h.hash));
        branchHeads.sort((a, b) => {
            if (a.branchName === 'main' || a.branchName === 'master') return -1;
            if (b.branchName === 'main' || b.branchName === 'master') return 1;
            return 0;
        });
        for (const head of branchHeads) {
            const queue = [head.hash];
            const visited = new Set();
            while (queue.length > 0) {
                const currentHash = queue.shift();
                if (!currentHash || visited.has(currentHash)) continue;
                visited.add(currentHash);
                if (map.has(currentHash)) continue;
                if (headHashes.has(currentHash) && currentHash !== head.hash) {
                    continue;
                }
                map.set(currentHash, head.branchName);
                const commit = commitMap.get(currentHash);
                if (commit && commit.parents) {
                    for (const parentHash of commit.parents) {
                        queue.push(parentHash);
                    }
                }
            }
        }
        return map;
    }, [history]);

    const getBranchForCommit = (commit) => commitToBranchMap.get(commit.hash) || 'main';

    const getColorForBranch = (branchName) => {
        if (branchName === 'main' || branchName === 'master') return MAIN_BRANCH_COLOR;
        if (!branchColorMap.current.has(branchName)) {
            let hash = 0;
            for (let i = 0; i < branchName.length; i++) hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
            const colorIndex = Math.abs(hash % ACCENT_COLORS.length);
            branchColorMap.current.set(branchName, ACCENT_COLORS[colorIndex]);
        }
        return branchColorMap.current.get(branchName);
    };

    const parseAndCategorizeRefs = (refsString) => {
        if (!refsString) return [];
        const allRefs = refsString.replace(/[()]/g, '').split(',').map(r => r.trim()).filter(Boolean);
        const headRefName = (allRefs.find(r => r.startsWith('HEAD ->')) || '').replace('HEAD -> ', '');
        return allRefs.filter(r => !r.startsWith('tag:') && r !== 'HEAD').map(ref => {
            let type = 'local';
            if (ref === headRefName) type = 'head';
            else if (ref.startsWith('origin/')) type = 'remote';
            return { name: ref, type };
        });
    };

    return (
        <div style={STYLES.historyContainer}>
            <div style={STYLES.historyHeader} onClick={() => setIsOpen(!isOpen)}>
                <span style={STYLES.historyHeaderTitle}>History</span>
                <span style={{ ...STYLES.buttonIcon, pointerEvents: 'none', border: 'none' }}>{isOpen ? ICONS.chevronDown : ICONS.chevronRight}</span>
            </div>
            {isOpen && (
                <div style={STYLES.historyContent}>
                    {history.map((commit) => {
                        const branchName = getBranchForCommit(commit);
                        const dotColor = getColorForBranch(branchName);
                        return (
                            <div key={commit.hash} style={STYLES.historyItem}>
                                <div style={STYLES.historyGraphLine}></div>
                                <div style={{ ...STYLES.historyGraphDot, backgroundColor: dotColor }}></div>
                                <div style={STYLES.historyDetails}>
                                    <div style={STYLES.historyRefPillContainer}>
                                        {parseAndCategorizeRefs(commit.refs).map(({ name, type }) => {
                                            let style = STYLES.historyRefPill;
                                            if (type === 'head') style = { ...style, ...STYLES.historyRefPillHead };
                                            else if (type === 'remote') style = { ...style, ...STYLES.historyRefPillRemote };
                                            else style = { ...style, ...STYLES.historyRefPillLocal };
                                            return (<span key={name} style={style}>{name}</span>);
                                        })}
                                    </div>
                                    <span style={STYLES.historyMessage}>{commit.message}</span>
                                    <span style={STYLES.historyMeta}>{commit.author} - {commit.date}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const RepoView = ({ git, commitMessage, setCommitMessage }) => {
    const [remoteInput, setRemoteInput] = useState(git.remoteUrl);

    useEffect(() => {
        setRemoteInput(git.remoteUrl);
    }, [git.remoteUrl]);

    const handleBranchChange = (e) => {
        const selectedValue = e.target.value;
        if (selectedValue === "__CREATE_NEW_BRANCH__") {
            new NewBranchModal((name) => git.createBranch(name)).open();
            e.target.value = git.currentBranch;
        } else if (selectedValue !== git.currentBranch) {
            git.checkoutBranch(selectedValue);
        }
    };

    const openMergeModal = () => {
        new MergeModal(git.branches, git.currentBranch, (selectedBranch) => {
            git.merge(selectedBranch);
        }).open();
    };

    const isRemoteUnchanged = remoteInput === git.remoteUrl;

    const secondaryIconBtn = { ...STYLES.buttonIcon, ...STYLES.buttonSecondary, flex: 1, padding: '8px' };
    const primaryIconBtn = { ...STYLES.button, flex: 1, padding: '8px' };

    return (
        <div style={STYLES.mainArea}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ ...STYLES.branchSelect, padding: '0' }}>
                    <span style={{ paddingLeft: '12px' }}>{ICONS.branch}</span>
                    <select
                        value={git.currentBranch}
                        onChange={handleBranchChange}
                        disabled={git.isProcessing}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 500, cursor: 'pointer', outline: 'none', width: '100%', padding: '8px 12px' }}
                    >
                        {git.currentBranch && git.currentBranch !== '...' && !git.branches.includes(git.currentBranch) && (
                            <option key={git.currentBranch} value={git.currentBranch}>{git.currentBranch}</option>
                        )}
                        {git.branches.filter(b => !b.startsWith('remotes/')).map(branch => (<option key={branch} value={branch}>{branch}</option>))}
                        <option value="__CREATE_NEW_BRANCH__" style={{ fontStyle: 'italic', color: '#a0a0a0' }}>+ Create new branch...</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '8px', border: '1px solid #333333', borderRadius: '6px', backgroundColor: '#1e1e1e' }}>{ICONS.remote}</span>
                    <input type="text" value={remoteInput} onChange={(e) => setRemoteInput(e.target.value)} style={{ ...STYLES.input, flex: 1 }} placeholder="Enter any Git repository URL" disabled={git.isProcessing} />
                    <button style={{ ...STYLES.buttonIcon }} title="How to get a remote URL?" onClick={() => new HelpModal().open()}>
                        {ICONS.help}
                    </button>
                </div>
                <button style={STYLES.button} onClick={() => git.setRemote(remoteInput)} disabled={git.isProcessing || !remoteInput.trim() || isRemoteUnchanged}>
                    {git.remoteUrl ? 'Update Remote' : 'Set Remote'}
                </button>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button style={secondaryIconBtn} title="Merge Branch" onClick={openMergeModal} disabled={git.isProcessing}>{ICONS.merge}</button>
                    <button style={secondaryIconBtn} onClick={git.refresh} title="Refresh" disabled={git.isProcessing}>{ICONS.refresh}</button>
                    {git.isProcessing && <div style={{ border: '3px solid #333', borderTop: `3px solid ${STYLES.button.backgroundColor}`, borderRadius: '50%', width: '18px', height: '18px', animation: 'spin 1s linear infinite', alignSelf: 'center', marginLeft: 'auto' }}></div>}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={secondaryIconBtn} title={`Pull (${git.behind} behind)`} onClick={git.pull} disabled={git.isProcessing || !git.remoteUrl}>{ICONS.pull}</button>
                    <button style={primaryIconBtn} title={`Push (${git.ahead} ahead)`} onClick={git.push} disabled={git.isProcessing || git.ahead === 0 || !git.remoteUrl}>{ICONS.push}</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                    <textarea style={{ ...STYLES.input, ...STYLES.commitInput }} placeholder="Commit message..." value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} disabled={git.isProcessing} />
                    <button style={{ ...STYLES.button, width: '100%' }} onClick={() => git.commit(commitMessage).then(() => setCommitMessage(''))} disabled={git.status.staged.length === 0 || !commitMessage.trim() || git.isProcessing}>Commit to {git.currentBranch}</button>
                </div>
                <FileListSection title="Staged Changes" files={git.status.staged} onUnstage={git.unstage} defaultOpen={true} />
                <FileListSection title="Changes" files={git.status.changes} onStage={git.stage} onStageAll={git.stageAll} onDiscard={git.discard} defaultOpen={true} />
            </div>

            <HistoryView history={git.history} />
        </div>
    );
};

const InitView = ({ git }) => (
    <div style={{ ...STYLES.mainArea, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Source Control</h3>
        <p style={{ color: '#888888', maxWidth: '400px' }}>This path is not a Git repository. Initialize one locally to start tracking changes, then connect it to a remote service like GitHub or GitLab.</p>
        <input type="text" value={git.repoPath} onChange={(e) => git.setRepoPath(e.target.value)} style={{ ...STYLES.input, maxWidth: '500px' }} disabled={git.isProcessing} />
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={git.refresh} disabled={git.isProcessing}>Use Path</button>
            <button style={STYLES.button} onClick={git.init} disabled={git.isProcessing}>Initialize Repository</button>
        </div>
    </div>
);

const GitSetupView = ({ git }) => {
    const [name, setName] = useState(git.gitUserName || '');
    const [email, setEmail] = useState(git.gitUserEmail || '');

    const getInstallInstructions = () => {
        const platform = os.platform();
        const codeStyle = { backgroundColor: '#2a2a2a', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' };
        switch (platform) {
            case 'win32':
                return (
                    <>
                        <p>Please install <a href="https://git-scm.com/download/win" target="_blank" rel="noopener noreferrer">Git for Windows</a>.</p>
                        <p>The official installer includes the Git Credential Manager to securely handle authentication with services like GitHub.</p>
                    </>
                );
            case 'darwin':
                return (
                    <>
                        <p>The easiest way to install Git on macOS is with the Xcode Command Line Tools.</p>
                        <p>1. Open the Terminal app (you can find it in Applications/Utilities).</p>
                        <p>2. Run the command: <code style={codeStyle}>xcode-select --install</code></p>
                        <p>Alternatively, if you use Homebrew, you can run: <code style={codeStyle}>brew install git</code></p>
                    </>
                );
            case 'linux':
                return (
                    <>
                        <p>Install Git using your distribution's package manager.</p>
                        <p>For Debian/Ubuntu, run: <code style={codeStyle}>sudo apt update && sudo apt install git</code></p>
                        <p>For Fedora/CentOS, run: <code style={codeStyle}>sudo dnf install git</code> or <code style={codeStyle}>sudo yum install git</code></p>
                    </>
                );
            default:
                return <p>Please install Git for your operating system from the <a href="https://git-scm.com/downloads" target="_blank" rel="noopener noreferrer">official website</a>.</p>;
        }
    };

    const renderContent = () => {
        if (git.gitSystemStatus === 'not_found') {
            return (
                <div style={{ width: '100%', maxWidth: '600px', textAlign: 'left' }}>
                    <h4 style={{ margin: 0, fontWeight: 500, fontSize: '18px', color: '#e06c75' }}>Git Installation Not Found</h4>
                    <div style={{ color: '#b0b0b0', marginTop: '16px', lineHeight: 1.6 }}>
                        {getInstallInstructions()}
                    </div>
                    <button style={{ ...STYLES.button, marginTop: '24px' }} onClick={git.checkGitSystem}>I've installed Git, check again</button>
                </div>
            );
        }

        if (git.gitSystemStatus === 'not_configured') {
            return (
                <div style={{ width: '100%', maxWidth: '500px', textAlign: 'left' }}>
                    <h4 style={{ margin: 0, fontWeight: 500, fontSize: '18px' }}>Configure Your Git Identity</h4>
                    <p style={{ color: '#888888', marginTop: '8px' }}>Please set your user name and email. This is required to identify you as the author of your commits.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={STYLES.input} placeholder="Your Name" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={STYLES.input} placeholder="your.email@example.com" />
                    </div>
                    <button
                        style={{ ...STYLES.button, marginTop: '24px', width: '100%' }}
                        onClick={() => git.setGitConfig(name, email)}
                        disabled={!name.trim() || !email.trim() || git.isProcessing}
                    >
                        Save Configuration
                    </button>
                </div>
            );
        }

        return <p>Checking Git installation...</p>;
    };

    return (
        <div style={{ ...STYLES.mainArea, alignItems: 'center', justifyContent: 'center' }}>
            {renderContent()}
        </div>
    );
};

function GitSourceControlView({ repoPath: initialRepoPath, onSaveStateChange, refreshTrigger }) {
    const git = useGitRepository(initialRepoPath);
    const [commitMessage, setCommitMessage] = useState('');

    useEffect(() => {
        if (typeof onSaveStateChange === 'function') {
            onSaveStateChange(git.isSaving);
        }
    }, [git.isSaving, onSaveStateChange]);

    useEffect(() => {
        const styleTagId = 'git-spinner-styles';
        if (!document.getElementById(styleTagId)) {
            const styleSheet = document.createElement("style"); styleSheet.id = styleTagId;
            styleSheet.innerText = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(styleSheet);
        }
    }, []);

    useEffect(() => {
        if (git.gitSystemStatus === 'ready' && !git.isLoading && !git.isProcessing) {
            git.refresh();
        }
    }, [refreshTrigger]);

    if (git.isLoading || git.gitSystemStatus === 'checking') {
        return <div style={STYLES.wrapper}><div style={{ ...STYLES.mainArea, alignItems: 'center', justifyContent: 'center' }}><div style={{ border: '3px solid #333', borderTop: `3px solid ${STYLES.button.backgroundColor}`, borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }}></div></div></div>;
    }

    return (
        <div style={STYLES.wrapper}>
            {git.gitSystemStatus !== 'ready'
                ? <GitSetupView git={git} />
                : git.isRepo
                    ? <RepoView git={git} commitMessage={commitMessage} setCommitMessage={setCommitMessage} />
                    : <InitView git={git} />
            }
            {git.error && <p style={{ color: '#e06c75', textAlign: 'center', position: 'absolute', bottom: '10px', left: '15px', right: '15px', background: 'rgba(224, 108, 117, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid #e06c75', zIndex: 20 }}>{git.error}</p>}
        </div>
    );
};

function MainView(props) {
    return <GitSourceControlView {...props} />;
}

return {
    GitSuite: MainView,
    useGit: useGitRepository
};
```












