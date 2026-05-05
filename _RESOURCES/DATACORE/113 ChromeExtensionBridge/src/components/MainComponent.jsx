/**
 * 147_ChromeExtensionBridge - Main Interface v23.0 [STABILIZER]
 */
function MainComponent({ folderPath, styles: theme, ExtensionManager: ExtManagerClass, onReload }) {
    const { useState, useEffect, useRef, useCallback } = dc;
    const { STYLES: s, TOKENS: t } = theme;
    
    const [exts, setExts] = useState([]);
    const [logs, setLogs] = useState(["SYSTEM::BRIDGE_V23.0_STABILIZED"]);
    const [TacticalViewer, setTacticalViewer] = useState(null);
    const containerRef = useRef(null);
    const [showTester, setShowTester] = useState(false);
    const [storeUrlInput, setStoreUrlInput] = useState("");

    const manager = dc.useMemo(() => new ExtManagerClass(folderPath, dc), [folderPath]);

    const refresh = useCallback(async () => {
        const list = await manager.getExtensions();
        setExts(list);
    }, [manager]);

    const addLog = useCallback((msg) => {
        console.log(`[BRIDGE] ${msg}`);
        setLogs(p => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p].slice(0, 30));
    }, []);

    // v23.0 STABILIZER - Targeted Injection (No IPC Overload)
    useEffect(() => {
        const remote = require('@electron/remote') || require('electron').remote;
        const sess = remote.session.defaultSession;
        
        const ultraNuke = `
            (function() {
                try {
                    const wrap = (b) => ({
                        get: (...a) => b.get(...a), set: (...a) => b.set(...a),
                        remove: (...a) => b.remove(...a), clear: (...a) => b.clear(...a),
                        onChanged: b.onChanged, getBytesInUse: (...a) => b.getBytesInUse(...a),
                        QUOTA_BYTES: 1048576, MAX_ITEMS: 512
                    });
                    const p = (o) => {
                        if (o && o.chrome && o.chrome.storage && o.chrome.storage.local) {
                            try {
                                Object.defineProperty(o.chrome.storage, 'sync', {
                                    value: wrap(o.chrome.storage.local),
                                    writable: true, configurable: true, enumerable: true
                                });
                            } catch(e) {}
                        }
                        if (o && !o.PresentationRequest) Object.defineProperty(o, 'PresentationRequest', { get: () => function(){ return { start: () => Promise.resolve() }; }, configurable: true });
                    };
                    p(window); p(self);
                } catch(e) {}
            })();
        `;

        // ONE-TIME SWEEP (Catch existing backgrounds)
        const sweep = () => {
            remote.webContents.getAllWebContents().forEach(wc => {
                const u = wc.getURL();
                if (u.includes('chrome-extension://')) {
                    wc.executeJavaScript(ultraNuke, true).catch(() => {});
                }
            });
        };
        sweep();
        const sweepInt = setInterval(sweep, 5000);

        // Core Setup
        const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        sess.setUserAgent(UA);
        
        sess.webRequest.onBeforeSendHeaders({ urls: ['<all_urls>'] }, (details, callback) => {
            const h = details.requestHeaders;
            if (details.url.includes('google') || details.url.includes('youtube')) {
                h['User-Agent'] = UA; h['Referer'] = 'https://www.youtube.com/';
                delete h['X-Obsidian-Version'];
            }
            callback({ requestHeaders: h });
        });

        dc.require(folderPath + "/src/components/TacticalViewer.jsx").then(mod => setTacticalViewer(() => mod.TacticalViewer));
        manager.autoLoadPersisted().then(() => { addLog("AUTO_LOAD::SYNC"); sweep(); refresh(); });
        refresh();
        
        return () => {
            clearInterval(sweepInt);
        };
    }, [manager, folderPath, refresh]);

    // FullTab Hijack
    useEffect(() => {
        const container = containerRef.current;
        const timer = setTimeout(() => {
            try {
                if (!container) return;
                const leaf = container.closest('.workspace-leaf');
                const wrapper = leaf?.querySelector('.view-content');
                if (wrapper) {
                    wrapper.appendChild(container);
                    Object.assign(container.style, { position: "absolute", inset: 0, zIndex: 9999, background: t.bg });
                    leaf.querySelector('.view-header')?.style.setProperty('display', 'none', 'important');
                }
            } catch (e) {}
        }, 800);
    }, []);

    const openDashboard = (url, name) => {
        const remote = require('@electron/remote') || require('electron').remote;
        const path = require('path');
        const win = new remote.BrowserWindow({
            title: name, width: 1700, height: 1100,
            webPreferences: { 
                nodeIntegration: true, contextIsolation: false, enableRemoteModule: true,
                webSecurity: false, preload: path.join(folderPath, 'src', 'utils', 'lobotomy.js')
            }
        });
        win.loadURL(url);
    };

    return (
        <div ref={containerRef} style={s.container}>
            <header style={s.header}>
                <div>
                    <div style={{ ...s.subtitle, color: '#00ffff' }}>v23.0 [STABILIZED]</div>
                    <h1 style={s.title}>CHROME_OS</h1>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button style={s.button(true)} onClick={() => setShowTester(true)}>LAUNCH_BROWSER</button>
                    <button style={s.button(false)} onClick={refresh}>REFRESH</button>
                    <button style={s.button(false)} onClick={onReload}>REBOOT</button>
                </div>
            </header>

            <div style={s.grid}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ ...s.subtitle, opacity: 0.5 }}>EXTENSION_CORE</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {exts.length > 0 ? exts.map(ext => (
                            <div key={ext.id} style={s.card}>
                                <div style={s.cardHeader}>
                                    <div><div style={s.extName}>{ext.name}</div><div style={s.extVersion}>{ext.id}</div></div>
                                </div>
                                <button style={s.button(true)} onClick={() => openDashboard(ext.dashboardUrl, ext.name)}>EJECT_DASHBOARD</button>
                            </div>
                        )) : <div style={{opacity:0.3}}>LOADING_REGISTRY...</div>}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ ...s.subtitle, opacity: 0.5 }}>STABLE_TELEMETRY</h2>
                    <div style={s.terminal}>{logs.map((log, i) => <div key={i}>{log}</div>)}</div>
                    <div style={s.card}>
                        <input style={s.input} placeholder="Store URL..." border="none" value={storeUrlInput} onChange={(e) => setStoreUrlInput(e.target.value)}/>
                        <button style={s.button(true)} onClick={() => manager.fetchFromStore(storeUrlInput).then(refresh)}>PULL</button>
                    </div>
                </div>
            </div>
            {showTester && TacticalViewer && <TacticalViewer styles={theme} addLog={addLog} onClose={() => setShowTester(false)} />}
        </div>
    );
}

return { MainComponent };
