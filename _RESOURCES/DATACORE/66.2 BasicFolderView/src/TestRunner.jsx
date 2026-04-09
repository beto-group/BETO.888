// Electron setup for external window
let BrowserWindow;
try {
    const remote = require('@electron/remote') || require('electron').remote;
    BrowserWindow = remote.BrowserWindow;
} catch (e) {
    console.warn("Electron remote not available - External window disabled");
}

let TelegramBridge;
try {
    // Dynamic require to avoid crashing if module not found during dev
    // We will resolve the full path later
} catch (e) { }

// HTML Generator moved to src/utils/dashboard_templates.js
const timestamp = new Date().toLocaleTimeString();

const spawnTestWindow = async (fPath) => {
    const path = require('path');
    if (!BrowserWindow) {
        new Notice("Detached window not supported.");
        return;
    }

    const basePath = dc.app.vault.adapter.basePath;
    const absolutePath = path.join(basePath, fPath);

    const { createSuite } = await dc.require(fPath + '/tests/suite.jsx');
    const results = await createSuite(fPath);

    const win = new BrowserWindow({
        width: 500,  // Compact Default
        height: 600,
        title: 'Agent Dashboard - 66.6',
        backgroundColor: '#0a0a0a',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false // Ensure local file access is smooth
        }
    });

    const { generateHTML } = await dc.require(fPath + '/src/utils/dashboard_templates.js');
    const html = generateHTML(absolutePath, results);

    // Write to file to allow localStorage access (data: protocol blocks it)
    const fs = require('fs');
    const dashboardPath = path.join(absolutePath, 'tests', 'dashboard.html');
    fs.writeFileSync(dashboardPath, html);

    win.loadFile(dashboardPath);
    return win;
};

const reloadTestWindow = async (fPath) => {
    const path = require('path');
    if (!BrowserWindow) return;
    const wins = require('@electron/remote').BrowserWindow.getAllWindows();
    const existing = wins.find(w => w.getTitle() === 'Agent Dashboard - 66.6');

    if (existing) {
        // Resolve absolute path
        const basePath = dc.app.vault.adapter.basePath;
        const absolutePath = path.join(basePath, fPath);

        const { createSuite } = await dc.require(fPath + '/tests/suite.jsx');
        const results = await createSuite(fPath);
        const { generateHTML } = await dc.require(fPath + '/src/utils/dashboard_templates.js');
        const html = generateHTML(absolutePath, results);

        // Write to file to allow localStorage access
        const fs = require('fs');
        const dashboardPath = path.join(absolutePath, 'tests', 'dashboard.html');
        fs.writeFileSync(dashboardPath, html);

        existing.loadFile(dashboardPath);
        console.log("External Test Window Reloaded");
    }
};

/**
 * In-App Test Runner for 66.6 BasicFolderView
 * Now with Detachable External Window support.
 */
async function View({ folderPath }) {
    const { useState, useEffect, useRef } = dc;
    const { createSuite } = await dc.require(folderPath + '/tests/suite.jsx');

    function TestRunner() {
        const [results, setResults] = useState(null);
        const [isRunning, setIsRunning] = useState(false);
        const [isDetached, setIsDetached] = useState(false);
        const winRef = useRef(null);

        const saveResultsToFile = async (res) => {
            try {
                const path = folderPath + '/tests/latest_results.json';
                const content = JSON.stringify({
                    timestamp: new Date().toISOString(),
                    results: res,
                    summary: {
                        passed: res.filter(r => r.passed).length,
                        total: res.length,
                        allPassed: res.every(r => r.passed)
                    }
                }, null, 2);

                // Use Obsidian's vault API for cross-platform file saving
                const adapter = dc.app.vault.adapter;
                await adapter.write(path, content);
                console.log("Test results persisted to:", path);
            } catch (e) {
                console.warn("Failed to persist test results:", e);
            }
        };

        const run = async () => {
            setIsRunning(true);
            try {
                const res = await createSuite(folderPath);
                setResults(res);
                await saveResultsToFile(res);
                if (winRef.current && !winRef.current.isDestroyed()) {
                    updateExternalWindow(res);
                }
            } catch (e) {
                console.error(e);
                const errorRes = [{ passed: false, description: 'Fatal Error', error: e.message }];
                setResults(errorRes);
                await saveResultsToFile(errorRes);
                if (winRef.current && !winRef.current.isDestroyed()) {
                    updateExternalWindow(errorRes);
                }
            } finally {
                setIsRunning(false);
            }
        };

        const updateExternalWindow = (res) => {
            if (!winRef.current || winRef.current.isDestroyed()) return;
            winRef.current.webContents.executeJavaScript(`
                if (window.__UPDATE_TESTS__) window.__UPDATE_TESTS__(${JSON.stringify(res)});
            `);
        };

        const openExternalWindow = () => {
            if (!BrowserWindow) return;
            spawnTestWindow(folderPath).then(win => {
                winRef.current = win;
                setIsDetached(true);
                win.on('closed', () => {
                    winRef.current = null;
                    setIsDetached(false);
                });
            });
        };

        useEffect(() => {
            run();
            // Window is now persistent; we only try to re-attach if it's already open
            if (BrowserWindow) {
                const wins = require('@electron/remote').BrowserWindow.getAllWindows();
                const existing = wins.find(w => w.getTitle() === 'Agent Dashboard - 66.6');
                if (existing) {
                    winRef.current = existing;
                    setIsDetached(true);
                    existing.on('closed', () => {
                        winRef.current = null;
                        setIsDetached(false);
                    });
                }
            }
        }, []);

        const passedCount = results ? results.filter(r => r.passed).length : 0;
        const totalCount = results ? results.length : 0;
        const allPassed = passedCount === totalCount && totalCount > 0;

        return (
            <div style={{
                padding: '24px',
                fontFamily: 'monospace',
                color: '#e0e0e0',
                backgroundColor: '#111',
                height: '100%',
                overflow: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ margin: 0 }}>Unit Tests: 66.6 BasicFolderView</h1>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={openExternalWindow}
                            disabled={isDetached || !BrowserWindow}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: isDetached ? '#222' : '#333',
                                color: isDetached ? '#555' : 'white',
                                border: '1px solid #555',
                                cursor: isDetached ? 'default' : 'pointer'
                            }}
                        >
                            {isDetached ? 'Detached' : 'Detach Window'}
                        </button>
                        <button
                            onClick={run}
                            disabled={isRunning}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#333',
                                color: 'white',
                                border: '1px solid #555',
                                cursor: 'pointer'
                            }}
                        >
                            {isRunning ? 'Running...' : 'Rerun Tests'}
                        </button>
                    </div>
                </div>

                {results && (
                    <div style={{ marginBottom: '20px', fontSize: '1.2em' }}>
                        Status: <span style={{ color: allPassed ? '#4caf50' : '#f44336' }}>
                            {allPassed ? 'ALL PASSED' : 'FAILED'}
                        </span>
                        <span style={{ marginLeft: '16px', color: '#888' }}>
                            ({passedCount}/{totalCount})
                        </span>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {results ? results.map((r, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            padding: '12px',
                            backgroundColor: r.passed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                            borderLeft: `4px solid ${r.passed ? '#4caf50' : '#f44336'}`,
                            borderRadius: '4px'
                        }}>
                            <span style={{
                                marginRight: '12px',
                                fontWeight: 'bold',
                                color: r.passed ? '#4caf50' : '#f44336'
                            }}>
                                {r.passed ? 'PASS' : 'FAIL'}
                            </span>
                            <span style={{ flex: 1 }}>{r.description}</span>
                            {!r.passed && (
                                <div style={{ marginTop: '8px', color: '#f44336', width: '100%' }}>
                                    Error: {r.error}
                                </div>
                            )}
                        </div>
                    )) : (
                        <div>Loading tests...</div>
                    )}
                </div>
            </div>
        );
    }

    return { View: TestRunner, spawnTestWindow };
}

return { View, spawnTestWindow, reloadTestWindow };
