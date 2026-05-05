/**
 * 147_ChromeExtensionBridge - Lobotomy Engine v26.3 [NATIVE_HOOK]
 */
(function() {
    // 0. CORE API TREE ATOMIC INITIALIZATION
    const clipperId = "mgjpacajaoijenemohcnoagkghckgejb";
    const zapGlobal = (obj) => {
        if (!obj.chrome) try { obj.chrome = {}; } catch(e) {}
        const c = obj.chrome;
        if (!c) return;

        const mockApi = (name, val) => {
            try {
                Object.defineProperty(c, name, {
                    value: val,
                    writable: true, configurable: true, enumerable: true
                });
            } catch(e) {}
        };

        if (!c.storage) mockApi('storage', {});
        if (!c.tabs) mockApi('tabs', {});
        if (!c.runtime) mockApi('runtime', {});
        if (!c.scripting) mockApi('scripting', {});

        mockApi('webNavigation', {
            onBeforeNavigate: { addListener: () => console.log("[LOBOTOMY] webNavigation.onBeforeNavigate.addListener"), removeListener: () => {} },
            onCommitted: { addListener: () => console.log("[LOBOTOMY] webNavigation.onCommitted.addListener"), removeListener: () => {} },
            onCompleted: { addListener: () => console.log("[LOBOTOMY] webNavigation.onCompleted.addListener"), removeListener: () => {} },
            onHistoryStateUpdated: { addListener: () => console.log("[LOBOTOMY] webNavigation.onHistoryStateUpdated.addListener"), removeListener: () => {} }
        });
        mockApi('commands', { 
            onCommand: { addListener: () => console.log("[LOBOTOMY] commands.onCommand.addListener"), removeListener: () => {}, hasListener: () => false },
            getAll: () => { console.log("[LOBOTOMY] commands.getAll"); return Promise.resolve([]); }
        });
        mockApi('alarms', { 
            create: (n, o) => console.log("[LOBOTOMY] alarms.create:", n, o), 
            clear: (n) => console.log("[LOBOTOMY] alarms.clear:", n), 
            onAlarm: { addListener: () => console.log("[LOBOTOMY] alarms.onAlarm.addListener"), removeListener: () => {} } 
        });
        mockApi('notifications', {
            create: (id, o) => console.log("[LOBOTOMY] notifications.create:", id, o), 
            clear: (id) => console.log("[LOBOTOMY] notifications.clear:", id), 
            onClicked: { addListener: () => {} }
        });
        mockApi('extension', {
            getBackgroundPage: () => { console.log("[LOBOTOMY] extension.getBackgroundPage"); return window; },
            getURL: (p) => { console.log("[LOBOTOMY] extension.getURL:", p); return (c.runtime && c.runtime.getURL) ? c.runtime.getURL(p) : p; },
            connect: (n) => { console.log("[LOBOTOMY] extension.connect:", n); return { onMessage: { addListener: () => {} }, postMessage: () => {} }; }
        });
        mockApi('i18n', {
            getMessage: (m) => { console.log("[LOBOTOMY] i18n.getMessage:", m); return m; },
            getAcceptLanguages: (cb) => { console.log("[LOBOTOMY] i18n.getAcceptLanguages"); if (cb) cb(['en-US']); return Promise.resolve(['en-US']); },
            getUILanguage: () => { console.log("[LOBOTOMY] i18n.getUILanguage"); return 'en-US'; }
        });
        
        // Add platform info
        if (!c.runtime.getPlatformInfo) c.runtime.getPlatformInfo = (cb) => {
            console.log("[LOBOTOMY] runtime.getPlatformInfo");
            const info = { os: 'mac', arch: 'x86-64', nacl_arch: 'x86-64' };
            if (cb) cb(info);
            return Promise.resolve(info);
        };
        if (!c.runtime.getBrowserInfo) c.runtime.getBrowserInfo = () => {
            console.log("[LOBOTOMY] runtime.getBrowserInfo");
            return Promise.resolve({ name: 'Chrome', vendor: 'Google', version: '120', buildID: '0' });
        };

        // Create browser polyfill
        try {
            Object.defineProperty(obj, 'browser', {
                get: () => obj.chrome,
                configurable: true, enumerable: true
            });
        } catch(e) {}
    };
    zapGlobal(window); zapGlobal(self);

    console.log("[LOBOTOMY] EXECUTION_STARTED");
    
    // 1. PRESENTATION API NUKE
    if (!window.PresentationRequest) {
        Object.defineProperty(window, 'PresentationRequest', {
            get: () => function() { return { start: () => Promise.resolve(), addEventListener: () => {} }; },
            configurable: true
        });
    }

    // 2. STORAGE SYNC VIRTUAL ENGINE
    const zapStorage = () => {
        try {
            if (!window.chrome) window.chrome = {};
            if (!window.chrome.storage) window.chrome.storage = {};

            const mockStorage = {
                get: function(k, cb) { if(cb) setTimeout(() => cb({}), 0); return Promise.resolve({}); },
                set: function(i, cb) { if(cb) setTimeout(() => cb(), 0); return Promise.resolve(); },
                remove: function(k, cb) { if(cb) setTimeout(() => cb(), 0); return Promise.resolve(); },
                clear: function(cb) { if(cb) setTimeout(() => cb(), 0); return Promise.resolve(); },
                onChanged: { addListener: function(){}, removeListener: function(){} },
                getBytesInUse: function(k, cb) { if(cb) setTimeout(() => cb(0), 0); return Promise.resolve(0); },
                QUOTA_BYTES: 1048576, MAX_ITEMS: 512
            };

            if (!window.chrome.storage.local) window.chrome.storage.local = mockStorage;
            
            // FATAL FIX: Never EVALUATE window.chrome.storage.sync. The native C++ getter
            // literally throws an exception upon read if Chromium thinks the context is unsafe.
            // By overwriting the property descriptor blindly, we delete the error-throwing getter natively!
            try {
                Object.defineProperty(window.chrome.storage, 'sync', {
                    value: window.chrome.storage.local,
                    writable: true, configurable: true, enumerable: true
                });
                // Only log if it's the first time to avoid console spam
                if (!window._sync_locked) {
                    console.log("[LOBOTOMY] VIRTUAL_SYNC_ENGINE_LOCKED_VIA_PROPERTY");
                    window._sync_locked = true;
                }
            } catch(e) { 
                if (!window._sync_error) {
                    console.error("[LOBOTOMY] FAILED PROPERTY HOOK:", e);
                    window._sync_error = true;
                }
            }
        } catch (e) {
            console.error("[LOBOTOMY] FATAL ZAP ERROR:", e);
        }
    };

    zapStorage();
    setInterval(zapStorage, 50);

    // 3. FULL API ISOLATION MOCKS (Prevent Chromium IPC Leaks)
    const zapApi = () => {
        try {
            if (!window._lobotomy_error_hook) {
                window.addEventListener('error', (e) => {
                    console.error("[LOBOTOMY] UNCAUGHT UI CRASH:", e.error?.message || e.message, "\nSTACK:", e.error?.stack);
                });
                window.addEventListener('unhandledrejection', (e) => {
                    console.error("[LOBOTOMY] UNHANDLED PROMISE UI CRASH:", e.reason);
                });
                window._lobotomy_error_hook = true;
            }

            if (!window.chrome.tabs) window.chrome.tabs = {};
            if (!window.chrome.commands) window.chrome.commands = { onCommand: { addListener: () => {}, removeListener: () => {} } };
            
            try {
                Object.defineProperty(window.chrome.tabs, 'getCurrent', {
                    value: function(callback) {
                        const dummyTab = { id: 1, active: true, currentWindow: true, title: window.__BRIDGE_TITLE__ || "VORTEX_TAB", url: window.__BRIDGE_URL__ || "https://en.wikipedia.org" };
                        if (callback) setTimeout(() => callback(dummyTab), 0);
                        return Promise.resolve(dummyTab);
                    },
                    writable: true, configurable: true, enumerable: true
                });
                Object.defineProperty(window.chrome.tabs, 'query', {
                    value: function(query, callback) {
                        console.log("[LOBOTOMY] FULFILLING CHROME.TABS.QUERY:", query);
                        const dummyTab = { id: 1, active: true, currentWindow: true, title: "VORTEX_TAB", url: window.__BRIDGE_URL__ || "https://www.wikipedia.org" };
                        if (callback) setTimeout(() => callback([dummyTab]), 0);
                        return Promise.resolve([dummyTab]);
                    },
                    writable: true, configurable: true, enumerable: true
                });
                Object.defineProperty(window.chrome.tabs, 'get', {
                    value: function(tabId, callback) {
                        console.log("[LOBOTOMY] FULFILLING CHROME.TABS.GET:", tabId);
                        const dummyTab = { id: 1, active: true, currentWindow: true, title: window.__BRIDGE_TITLE__ || "VORTEX_TAB", url: window.__BRIDGE_URL__ || "https://en.wikipedia.org" };
                        if (callback) setTimeout(() => callback(dummyTab), 0);
                        return Promise.resolve(dummyTab);
                    },
                    writable: true, configurable: true, enumerable: true
                });
                Object.defineProperty(window.chrome.tabs, 'sendMessage', {
                    value: function(tabId, msg, callback) {
                        console.log("[LOBOTOMY] NUKED NATIVE TAB MESSAGE IPC:", msg);
                        const res = { success: true };
                        if (callback) setTimeout(() => callback(res), 0);
                        return Promise.resolve(res);
                    },
                    writable: true, configurable: true, enumerable: true
                });
            } catch(e) {}
            
            if (!window.chrome.runtime) window.chrome.runtime = {};
            try {
                Object.defineProperty(window.chrome.runtime, 'getBackgroundPage', {
                    value: function(cb) {
                        if (cb) setTimeout(() => cb(window), 0);
                        return Promise.resolve(window);
                    },
                    writable: true, configurable: true, enumerable: true
                });
                Object.defineProperty(window.chrome.runtime, 'getURL', {
                    value: function(path) {
                        return `chrome-extension://${clipperId}/${path.startsWith('/') ? path.slice(1) : path}`;
                    },
                    writable: true, configurable: true, enumerable: true
                });
                Object.defineProperty(window.chrome.runtime, 'sendMessage', {
                    value: function(msg, cb) {
                        try {
                            // 2.7 ADBLOCK / ABP COMPATIBILITY LAYER
            if (msg.command === 'getABPPrefPropertyNames') {
                console.log("[LOBOTOMY] SPOOFING ADBLOCK PREFS LIST");
                return Promise.resolve([]);
            }
            if (msg.command === 'getSettings') {
                console.log("[LOBOTOMY] SPOOFING ADBLOCK SETTINGS");
                return Promise.resolve({
                    suppressWhitelisting: false,
                    showIcon: true,
                    showBlockCount: true,
                    showContextMenus: true,
                    showNewsletterSocial: false
                });
            }
            if (msg.type === 'app.get') {
                console.log("[LOBOTOMY] SPOOFING APP GET:", msg.what);
                if (msg.what === 'application') return Promise.resolve('adblock');
                return Promise.resolve('https://beto.group');
            }
            if (msg.type && msg.type.startsWith('adblock:')) {
                console.log("[LOBOTOMY] SUPPRESSING ADBLOCK INTERNAL:", msg.type);
                return Promise.resolve({});
            }

            console.log("[LOBOTOMY] NUKED NATIVE MESSAGE IPC:", JSON.stringify(msg));
                        } catch(e) {
                            console.log("[LOBOTOMY] NUKED NATIVE MESSAGE IPC:", msg ? "Object" : "Null");
                        }
                        
                        let res = { success: true };
                        
                        if (msg && msg.action === "getActiveTab") {
                            res = { tabId: 1 };
                        } else if (msg && msg.action === "getTabInfo") {
                            const url = window.__BRIDGE_URL__ || "https://en.wikipedia.org/wiki/Main_Page";
                            res = { success: true, tab: { id: 1, url: url } };
                        } else if (msg && msg.action === "getHighlighterMode") {
                            res = { isActive: false };
                        } else if (msg && msg.action === "forceInjectContentScript") {
                            res = { success: true };
                        } else if (msg && msg.action === "fetchProxy") {
                            console.log("[LOBOTOMY] EXECUTING PROXY FETCH:", msg.url);
                            return fetch(msg.url, msg.options || {})
                                .then(r => r.text().then(text => {
                                    console.log("[LOBOTOMY] FETCH DATA RECEIVED. LENGTH:", text.length);
                                    console.log("[LOBOTOMY] SNIPPET:", text.substring(0, 200));
                                    const out = { ok: r.ok, status: r.status, text: text, finalUrl: r.url };
                                    if (cb) setTimeout(() => cb(out), 10);
                                    return out;
                                }))
                                .catch(err => {
                                    console.error("[LOBOTOMY] PROXY FETCH FAILED:", err);
                                    const out = { ok: false, status: 0, text: "", error: err.message };
                                    if (cb) setTimeout(() => cb(out), 10);
                                    return out;
                                });
                        } else if (msg && msg.action === "sendMessageToTab") {
                            const inner = msg.message;
                            if (inner && inner.action === "getReaderModeState") {
                                res = { isActive: false };
                            } else if (inner && inner.action === "getPageContent") {
                                const title = window.__BRIDGE_TITLE__ || "Bridge Disconnected";
                                const html = window.__BRIDGE_HTML__ || "<h1>No Bridge</h1>";
                                const text = window.__BRIDGE_TEXT__ || "No Bridge Data";
                                const url = window.__BRIDGE_URL__ || "";

                                res = {
                                    content: html,
                                    html: html,
                                    markdown: `# ${title}\n[Source](${url})\n\n${text}`,
                                    title: title, 
                                    byline: "Datacore Engine Bridge",
                                    excerpt: text.substring(0, 150) + "...",
                                    siteName: new URL(url || "https://local.datacore").hostname
                                };
                            }
                        }

                        if (cb) setTimeout(() => cb(res), 0);
                        return Promise.resolve(res);
                    },
                    writable: true, configurable: true, enumerable: true
                });
            } catch(e) {}

            if (!window.chrome.scripting) window.chrome.scripting = {};
            try {
                Object.defineProperty(window.chrome.scripting, 'executeScript', {
                    value: function(args, cb) {
                        console.log("[LOBOTOMY] NUKED NATIVE SCRIPT INJECTION:", args);
                        const res = [{ result: document.body?.innerText || "Sample text content." }];
                        if (cb) setTimeout(() => cb(res), 0);
                        return Promise.resolve(res);
                    },
                    writable: true, configurable: true, enumerable: true
                });
            } catch(e) {}
        } catch(e) {}
    };

    zapApi();
    setInterval(zapApi, 50);

    // 4. SANDBOX & CSP ERASURE
    setInterval(() => {
        document.querySelectorAll('iframe').forEach(f => {
            f.removeAttribute('sandbox');
            f.removeAttribute('csp');
            if (!f.getAttribute('allow')) f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
        });
    }, 500);
})();
