



# ViewComponent

```jsx
const { useEffect, useRef, useState, useCallback } = dc;

const { IntegratedIDE } = await dc.require(dc.headerLink("_RESOURCES/DATACORE/61 IntegratedIDE/D.q.integratedide.component.md", "ViewComponent"));

let useGitHook;
try {
    const gitModule = await dc.require(dc.headerLink("_RESOURCES/DATACORE/60 GitSuiteManager/D.q.gitsuitemanager.component.md", "GitSuite"));
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
    const terminalModule = await dc.require(dc.headerLink("_RESOURCES/DATACORE/62 PluginDevSuite/D.q.plugindevsuite.component.md", "TerminalManager"));
    TerminalManagerClass = terminalModule.TerminalManager || terminalModule.default || terminalModule;
    if (typeof TerminalManagerClass !== 'function') {
        throw new Error("TerminalManager.component.v1.md did not export a valid constructor for TerminalManager.");
    }
} catch (e) {
    console.error("Failed to load TerminalManager.component.v1.md:", e);
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
    const [isHoveringIcon, setIsHoveringIcon] = useState(false); // For improved arrow styling
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
            else console.error(`[FileExplorer] Failed to load children for ${item.path}:`, e); // Fallback if debug is not passed for some reason
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

    const itemStyle = { display: 'flex', alignItems: 'center', padding: `2px 4px`, marginLeft: `${depth * 20}px`, borderRadius: '4px' };

    const iconStyle = {
        marginRight: '4px',
        width: '22px',
        height: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        borderRadius: '4px',
        backgroundColor: isHoveringIcon ? 'var(--background-modifier-hover)' : 'transparent',
        transition: 'background-color 0.1s ease',
        color: 'var(--text-muted)',
    };

    const nameStyle = { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '4px', cursor: 'pointer', borderRadius: '4px' };
    const icon = !isFolder ? '📄' : isOpen ? '▾' : '▸';

    return (
        <div>
            <div style={itemStyle} title={item.path}>
                <span
                    style={iconStyle}
                    onClick={handleExpandToggle}
                    onMouseEnter={() => setIsHoveringIcon(true)}
                    onMouseLeave={() => setIsHoveringIcon(false)}
                >
                    {icon}
                </span>
                <span style={nameStyle} onClick={handleSelect}>{item.name}</span>
            </div>
            {isFolder && isOpen && (
                isLoading ? <div style={{ paddingLeft: `${(depth + 1) * 20}px`, color: 'var(--text-muted)' }}>Loading...</div> :
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
        wrapper: { height: "100%", width: "100%", background: 'var(--background-primary)', color: 'var(--text-normal)', display: 'flex', flexDirection: 'column', border: '1px solid var(--background-modifier-border)', borderRadius: '6px' },
        content: { padding: '8px', flex: 1, overflowY: 'auto' }
    };

    return (
        <div style={explorerStyles.wrapper}>
            <div style={explorerStyles.content}>
                {error && <p style={{ color: 'var(--text-error)' }}>{error}</p>}
                {rootItem ? <FileExplorerItem item={rootItem} depth={0} onFileSelect={onFileSelect} nodeManager={nodeManager} debug={debug} /> : <p>Loading...</p>}
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
        wrapper: { backgroundColor: 'var(--background-primary)', color: 'var(--text-normal)', fontFamily: 'var(--font-interface)', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative' },
        exitIcon: { position: "fixed", top: "15px", right: "20px", fontFamily: "monospace", fontSize: "14px", color: 'var(--text-muted)', userSelect: "none", cursor: "pointer", opacity: 0, transform: "scale(0.9)", transition: "opacity 0.2s, transform 0.2s", zIndex: 10000, backgroundColor: 'var(--background-secondary)', padding: '5px 10px', borderRadius: '4px', border: '1px solid var(--background-modifier-border)' },
        hoverEffectStyle: `.${uniqueWrapperClass}:hover .pds-exit-icon { opacity: 0.7; transform: scale(1); border-color: var(--interactive-accent); color: var(--interactive-accent);}`,
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', paddingBottom: '16px', borderBottom: '1px solid var(--background-modifier-border)', flexShrink: 0 },
        button: { padding: '10px 18px', fontSize: '14px', fontWeight: '500', backgroundColor: 'var(--interactive-accent)', color: 'var(--text-on-accent)', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s ease, opacity 0.2s ease' },
        buttonSecondary: { backgroundColor: 'var(--background-modifier-hover)', color: 'var(--text-muted)' },
        buttonDanger: { backgroundColor: 'var(--background-modifier-error)', color: 'var(--text-on-accent)' },
        buttonSmall: { padding: '4px 10px', fontSize: '12px' },
        section: { flex: 1, overflowY: 'auto', padding: '24px', paddingTop: 0, display: 'flex', flexDirection: 'column', minHeight: 0 },
        sectionTitle: { fontSize: '1.1em', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '16px', borderBottom: '1px solid var(--background-modifier-border)', paddingBottom: '8px', marginTop: '24px' },
        pluginGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' },
        pluginCard: { backgroundColor: 'var(--background-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--background-modifier-border)', cursor: 'pointer', transition: 'border-color 0.2s ease', position: 'relative' },
        pluginCardName: { fontSize: '1.2em', fontWeight: '500', color: 'var(--text-normal)', marginBottom: '8px' },
        pluginCardId: { fontSize: '0.9em', color: 'var(--text-muted)', fontFamily: 'monospace' },
        pluginCardStatus: { position: 'absolute', top: '16px', right: '16px', fontSize: '0.75em', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' },
        detailHeader: { display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '16px' },
        backButton: { fontSize: '1.4em', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s ease' },
        detailTitle: { fontSize: '2em', margin: 0, color: 'var(--text-normal)' },
        detailActions: { marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' },
        modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 },
        modalContent: { backgroundColor: 'var(--background-secondary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--background-modifier-border)', width: '500px', maxWidth: '90vw' },
        modalTitle: { fontSize: '1.5em', margin: 0, marginBottom: '16px' },
        input: { width: '100%', padding: '12px', boxSizing: 'border-box', backgroundColor: 'var(--background-primary)', border: '1px solid var(--background-modifier-border)', borderRadius: '6px', color: 'var(--text-normal)', marginBottom: '16px' },
        select: { width: '100%', padding: '12px', boxSizing: 'border-box', backgroundColor: 'var(--background-primary)', border: '1px solid var(--background-modifier-border)', borderRadius: '6px', color: 'var(--text-normal)', marginBottom: '16px', fontSize: '14px', height: '48px', appearance: 'none' },
        inputGroup: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' },
        compactWrapper: { textAlign: 'center', padding: '20px', border: '1px solid var(--background-modifier-border)', borderRadius: '8px' },
        compactText: { marginBottom: '12px', color: 'var(--text-muted)' },
        buildLogPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '250px', backgroundColor: 'var(--background-secondary)', borderTop: '1px solid var(--background-modifier-border)', display: 'flex', flexDirection: 'column', zIndex: 9999 },
        buildLogHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', backgroundColor: 'var(--background-primary)' },
        buildLogContent: { flex: 1, fontFamily: 'monospace', fontSize: '12px', color: '#fff', backgroundColor: '#000', padding: '10px', overflowY: 'auto', whiteSpace: 'pre-wrap' },
        errorBanner: { padding: '12px', backgroundColor: 'var(--background-modifier-error)', color: 'var(--text-on-accent)', borderRadius: '6px', border: '1px solid var(--background-modifier-border)', fontSize: '0.9em', lineHeight: 1.5, marginBottom: '16px' },
    };

    const selectedPlugin = plugins.find(p => p.id === selectedPluginId);
    const getStatusStyle = (status) => ({ ENABLED: { backgroundColor: 'rgba(80, 250, 123, 0.2)', color: 'var(--text-success)' }, DISABLED: { backgroundColor: 'rgba(255, 184, 108, 0.2)', color: 'var(--text-warning)' }, SOURCE: { backgroundColor: 'rgba(150, 150, 150, 0.2)', color: 'var(--text-muted)' } }[status] || {});

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

        const ICONS = {
            docs: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>,
            checklist: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6.5l-3.5 3.5-2-2"></path><path d="M15 12.5l-3.5 3.5-2-2"></path><path d="M15 18.5l-3.5 3.5-2-2"></path><path d="M4 6.5h3"></path><path d="M4 12.5h3"></path><path d="M4 18.5h3"></path></svg>,
            discord: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5,4.2C20.1,3.2,18.5,2.4,16.8,1.9C16.5,2.7,16.2,3.8,16,4.7C13.8,4.2,11.6,4.2,9.4,4.7C9.2,3.8,8.9,2.7,8.6,1.9C6.9,2.4,5.3,3.2,3.9,4.2C0.6,9.1-0.4,14.2,0.1,19.2C2.7,21,5.2,22,7.7,22.6C8.3,21.7,8.9,20.7,9.3,19.7C8.5,19.4,7.6,19,6.8,18.5C7,18.3,7.2,18.2,7.4,18C12,20,16.6,20,21,18C21.2,18.2,21.4,18.3,21.6,18.5C20.8,19,19.9,19.4,19.1,19.7C19.5,20.7,20.1,21.7,20.7,22.6C23.2,22,25.7,21,28.3,19.2C29.1,13.1,26.5,7.9,21.5,4.2z M9.9,15.9C8.6,15.9,7.5,14.8,7.5,13.4C7.5,12,8.6,10.9,9.9,10.9C11.2,10.9,12.3,12,12.3,13.4C12.3,14.8,11.2,15.9,9.9,15.9z M18.5,15.9C17.2,15.9,16.1,14.8,16.1,13.4C16.1,12,17.2,10.9,18.5,10.9C19.8,10.9,20.9,12,20.9,13.4C20.9,14.8,19.8,15.9,18.5,15.9z" /></svg>,
            forum: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
        };
        const RESOURCES = [
            { label: "Official Plugin Docs", description: "The primary source for getting started with Obsidian plugin development.", url: "https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin", icon: ICONS.docs },
            { label: "Plugin Self-Critique Checklist", description: "A guide to review your plugin against community best practices before release.", url: "https://docs.obsidian.md/oo/plugin", icon: ICONS.checklist },
            { label: "Developer Community", description: "Join the official Discord server to chat with other developers in the #plugins channel.", url: "https://discord.gg/obsidianmd", icon: ICONS.discord },
            { label: "Obsidian Developer Forum", description: "Ask questions, share your work, and find help on the official community forum.", url: "https://forum.obsidian.md/c/developers-api/", icon: ICONS.forum }
        ];
        const resourceCardStyle = { ...STYLES.pluginCard, textDecoration: 'none', color: 'inherit' };
        const resourceCardTitleStyle = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1em', fontWeight: '500', color: 'var(--text-normal)', marginBottom: '8px' };
        const resourceCardDescriptionStyle = { fontSize: '0.9em', color: 'var(--text-muted)', lineHeight: 1.5 };

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
            NOT_DEPLOYED: { backgroundColor: 'rgba(150, 150, 150, 0.2)', color: 'var(--text-muted)' },
            ENABLED: { backgroundColor: 'rgba(80, 250, 123, 0.2)', color: 'var(--text-success)' },
            DISABLED: { backgroundColor: 'rgba(255, 184, 108, 0.2)', color: 'var(--text-warning)' },
            SOURCE: { backgroundColor: 'rgba(150, 150, 150, 0.2)', color: 'var(--text-muted)' }, // Added SOURCE status
            LOADING: { backgroundColor: 'rgba(138, 43, 226, 0.2)', color: 'var(--interactive-accent-hover)' }
        };
        const isNodeReady = nodePathStatus === 'found';
        const renderNodeStatus = () => {
            if (nodePathStatus === 'finding') return <div style={{ ...STYLES.errorBanner, backgroundColor: 'var(--background-modifier-hover)', color: 'var(--text-muted)' }}>Searching for Node.js installation...</div>;
            if (nodePathStatus === 'not_found') return <div style={STYLES.errorBanner}><strong>Action Required:</strong> Node.js was not found. Please install it to use build and deploy features.</div>;
            return null;
        };
        const renderSourceControl = () => {
            if (git.isLoading) { return <p style={{ color: 'var(--text-muted)' }}>Loading Git status...</p> }
            if (!git.isRepo) { return (<div style={{ textAlign: 'center', padding: '16px' }}> <p style={{ margin: '0 0 12px 0', color: 'var(--text-muted)' }}>This plugin is not a Git repository.</p> <button style={STYLES.button} onClick={handleInitializeRepo} disabled={git.isProcessing}>Initialize Repository</button> </div>); }
            return (<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}> <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}> <div style={{ overflow: 'hidden' }}> <strong style={{ color: 'var(--text-muted)' }}>Remote:</strong> <code style={{ marginLeft: '8px', opacity: git.remoteUrl ? 1 : 0.5, fontStyle: git.remoteUrl ? 'normal' : 'italic' }}> {git.remoteUrl || 'Not configured'} </code> </div> <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={promptForRemote} disabled={git.isProcessing}>Configure</button> </div> <div style={{ display: 'flex', gap: '10px' }}> <button style={{ ...STYLES.button, ...STYLES.buttonSecondary, flex: 1 }} onClick={git.pull} disabled={!git.remoteUrl || git.isProcessing}>Pull ({git.behind} behind)</button> <button style={{ ...STYLES.button, flex: 1 }} onClick={git.push} disabled={!git.remoteUrl || git.isProcessing || git.ahead === 0}>Push ({git.ahead} ahead)</button> <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={git.refresh} disabled={git.isProcessing} title="Refresh Git Status"> {git.isProcessing ? '...' : '⟳'} </button> </div> {git.error && <p style={{ color: 'var(--text-error)', fontSize: '0.9em', margin: '0' }}>{git.error}</p>} </div>);
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                {isBuildConfigOpen && renderBuildConfigModal({ onClose: () => setIsBuildConfigOpen(false) })}
                <div style={STYLES.header}>
                    <div style={STYLES.detailHeader}> <span style={STYLES.backButton} onClick={() => setView('dashboard')}>&larr;</span> <h1 style={STYLES.detailTitle}>{selectedPlugin.name}</h1> </div>
                    <button style={{ ...STYLES.button, ...STYLES.buttonDanger, marginTop: '16px' }} onClick={() => setIsDeleteModalOpen(true)} disabled={isLoading || isProcessRunning}>Delete Source</button>
                </div>
                <div style={STYLES.section}>
                    {renderNodeStatus()}
                    <h2 style={{ ...STYLES.sectionTitle, marginTop: 0 }}>Deploy & Run</h2>
                    <div style={{ border: '1px solid var(--background-modifier-border)', borderRadius: '8px', padding: '16px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                            <span style={{ ...STYLES.pluginCardStatus, position: 'static', ...statusStyles[deploymentStatus] }}>{deploymentStatus.replace('_', ' ')}</span>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button style={STYLES.button} onClick={(e) => handleBuildAndDeploy(selectedPlugin.id, e)} disabled={!isNodeReady || isLoading || isProcessRunning}>Build & Deploy</button>
                                <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => setIsBuildConfigOpen(true)} disabled={isLoading || isProcessRunning}>Configure Build</button>
                                {['ENABLED', 'DISABLED'].includes(deploymentStatus) && (<button style={STYLES.button} onClick={(e) => handleToggleDeployment(selectedPlugin.id, e)} disabled={isLoading || isProcessRunning}>{deploymentStatus === 'ENABLED' ? 'Disable' : 'Enable'}</button>)}
                            </div>
                        </div>
                    </div>
                    <h2 style={STYLES.sectionTitle}>Source Control</h2>
                    <div style={{ border: '1px solid var(--background-modifier-border)', borderRadius: '8px', padding: '16px', marginTop: '10px' }}>
                        {renderSourceControl()}
                    </div>
                    <h2 style={STYLES.sectionTitle}>Manifest Editor</h2>
                    <div style={{ border: '1px solid var(--background-modifier-border)', borderRadius: '8px', padding: '16px', marginTop: '10px' }}>
                        {manifestData && !isEditingManifest && (<div> {Object.entries(manifestData).map(([key, value]) => (<div key={key} style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '0.9em' }}> <strong style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{key}:</strong> {String(value)} </div>))} <button style={{ ...STYLES.button, ...STYLES.buttonSecondary, marginTop: '16px' }} onClick={() => setIsEditingManifest(true)}>Edit Manifest</button> </div>)}
                        {isEditingManifest && (<div> {Object.entries(editableManifest).map(([key, value]) => (<div key={key} style={{ marginBottom: '12px' }}> <label style={{ display: 'block', marginBottom: '4px', textTransform: 'capitalize', fontWeight: 500 }}>{key}</label> <input type="text" style={{ ...STYLES.input, ...(key === 'id' ? { backgroundColor: 'var(--background-modifier-border)', cursor: 'not-allowed', color: 'var(--text-muted)' } : {}) }} value={value} onChange={(e) => handleManifestChange(key, e.target.value)} disabled={key === 'id'} title={key === 'id' ? "The plugin ID cannot be changed." : ""} /> </div>))} <button style={STYLES.button} onClick={handleSaveManifest}>Save Manifest</button> <button style={{ ...STYLES.button, ...STYLES.buttonSecondary, marginLeft: '10px' }} onClick={() => setIsEditingManifest(false)}>Cancel</button> </div>)}
                        {!manifestData && !isEditingManifest && <p style={{ color: 'var(--text-muted)' }}>No manifest file found in the source directory.</p>}
                    </div>
                    <div style={{ ...STYLES.sectionTitleContainer, marginTop: '24px' }}>
                        <h2 style={{ ...STYLES.sectionTitle, marginTop: 0, marginBottom: 0, borderBottom: 'none' }}>Development Tools</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9em' }} title="Watches for changes from external editors in .obsidian/plugins and automatically reloads the plugin.">
                            <input type="checkbox" id="hot-reload-toggle" checked={isHotReloadEnabled} onChange={(e) => setIsHotReloadEnabled(e.target.checked)} />
                            <label htmlFor="hot-reload-toggle" style={{ cursor: 'pointer' }}>Enable Hot Reload</label>
                        </div>
                    </div>
                    <div style={{ ...STYLES.detailActions, marginTop: '16px' }}>
                        <button style={STYLES.button} onClick={() => handleNavigateToCodeEditor(selectedPlugin.id)} disabled={isLoading || isProcessRunning}>Open Integrated IDE</button>
                        <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => handleOpenInIde(selectedPlugin.id)} disabled={isLoading || isProcessRunning}>Open in External IDE</button>
                        <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => handleOpenInExplorer(selectedPlugin.id)} disabled={isLoading || isProcessRunning}>Open in File Explorer</button>
                        {/* NEW: Dedicated button to configure the external IDE command */}
                        <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => promptForIdeCommand(selectedPlugin.id)} disabled={isLoading || isProcessRunning}>Config IDE</button>
                    </div>
                    <h2 style={STYLES.sectionTitle}>Resources & Documentation</h2>
                    <div style={STYLES.pluginGrid}>
                        {RESOURCES.map(resource => (<div key={resource.label} style={resourceCardStyle} onClick={() => window.open(resource.url, '_blank')} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--interactive-accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--background-modifier-border)'} > <div style={resourceCardTitleStyle}> <span style={{ color: 'var(--text-muted)' }}>{resource.icon}</span> <span>{resource.label}</span> </div> <div style={resourceCardDescriptionStyle}>{resource.description}</div> </div>))}
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
                        <h2 style={{ ...STYLES.modalTitle, flexShrink: 0 }}>Configure Build for "{selectedPlugin.name}"</h2>

                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Build Output Directory</label>
                        <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: 0, marginBottom: '8px' }}>The folder containing `main.js` (e.g., `dist`, `.` for root).</p>
                        <input type="text" value={buildConfig.outputDir} onChange={e => handleConfigChange('outputDir', e.target.value)} style={{ ...STYLES.input, marginBottom: '24px' }} />

                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Paths to Sync</label>
                        <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: 0, marginBottom: '8px' }}>Files/folders from the output directory to copy.</p>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto', padding: '8px', backgroundColor: 'var(--background-primary)', borderRadius: '4px' }}>
                            {buildConfig.syncPaths.map((path, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--background-modifier-hover)', padding: '6px 10px', borderRadius: '4px' }}>
                                    <code>{path}</code>
                                    <button onClick={() => handleRemoveSyncPath(path)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2em' }}>&times;</button>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
                            <input type="text" value={newSyncPath} onChange={e => setNewSyncPath(e.target.value)} placeholder="manually add path..." style={{ ...STYLES.input, marginBottom: 0, flex: 1 }} />
                            <button onClick={() => handleAddSyncPath(newSyncPath)} style={{ ...STYLES.button, padding: '10px 14px' }}>Add</button>
                        </div>

                        <div>
                            <button style={STYLES.button} onClick={handleSave}>Save Configuration</button>
                            <button style={{ ...STYLES.button, ...STYLES.buttonSecondary, marginLeft: '10px' }} onClick={onClose}>Cancel</button>
                        </div>
                    </div>
                    <div style={{ flex: 1, minHeight: 0, borderLeft: '1px solid var(--background-modifier-border)', paddingLeft: '20px' }}>
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
                        <span style={STYLES.backButton} onClick={() => setView('plugin_details')}>&larr;</span>
                        <h1 style={{ ...STYLES.detailTitle, fontSize: '1.6em' }}>{selectedPlugin.name} - IDE</h1>
                    </div>

                    {/* --- NEW: Auto-build toggle --- */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9em' }} title="Automatically build and deploy when you save a file.">
                        <input
                            type="checkbox"
                            id="auto-build-toggle"
                            checked={isAutoBuildEnabled}
                            onChange={(e) => setIsAutoBuildEnabled(e.target.checked)}
                        />
                        <label htmlFor="auto-build-toggle" style={{ cursor: 'pointer' }}>Auto-build on Save</label>
                    </div>

                    <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => handleOpenInIde(selectedPlugin.id)} disabled={isLoading || isProcessRunning}>Open External</button>
                    <button style={STYLES.button} onClick={(e) => handleBuildAndDeploy(selectedPlugin.id, e)} disabled={!isNodeReady || isLoading || isProcessRunning}>Build & Deploy</button>
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
                <h1 style={{ ...STYLES.detailTitle, fontSize: '1.6em', margin: 0 }}>Plugin Development Suite</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* NEW: Debug Mode Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9em' }}>
                        <input
                            type="checkbox"
                            id="debug-mode-toggle"
                            checked={isDebugModeEnabled}
                            onChange={(e) => setIsDebugModeEnabled(e.target.checked)}
                        />
                        <label htmlFor="debug-mode-toggle" style={{ cursor: 'pointer' }}>Debug Mode</label>
                    </div>
                    {/* --- UPDATED: Grouped action buttons --- */}
                    <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={() => setIsClonerOpen(true)} disabled={isLoading}>+ Add from URL</button>
                    <button style={STYLES.button} onClick={() => setIsCreatorOpen(true)} disabled={isLoading}>+ Create Project</button>
                </div>
            </div>
            <div style={STYLES.section}>
                <h2 style={{ ...STYLES.sectionTitle, marginTop: 0 }}>Managed Projects</h2>
                <div style={STYLES.pluginGrid}>
                    {plugins.filter(p => p.isManaged).map(p => (
                        <div key={p.id} style={STYLES.pluginCard} onClick={() => { setSelectedPluginId(p.id); setView('plugin_details'); }}>
                            <div style={STYLES.pluginCardName}>{p.name}</div>
                            <div style={STYLES.pluginCardId}>{p.id}</div>
                            <span style={{ ...STYLES.pluginCardStatus, ...getStatusStyle(p.status) }}>{p.status}</span>
                        </div>
                    ))}
                </div>
                <h2 style={STYLES.sectionTitle}>Other Installed Plugins</h2>
                <div style={STYLES.pluginGrid}>
                    {plugins.filter(p => !p.isManaged).map(p => (
                        <div key={p.id} style={{ ...STYLES.pluginCard, cursor: 'default', opacity: 0.6 }}>
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


