/**
 * TacticalViewer - Test Harness v18.0 [VORTEX]
 */
function TacticalViewer({ styles, onClose, addLog }) {
    const { useState, useRef, useEffect } = dc;
    const { STYLES: s, TOKENS: t } = styles;

    const [url, setUrl] = useState("https://www.wikipedia.org");
    const [currentUrl, setCurrentUrl] = useState("https://www.wikipedia.org");
    const [status, setStatus] = useState("VORTEX_READY");
    const webviewRef = useRef(null);

    const clipperId = "mgjpacajaoijenemohcnoagkghckgejb";

    const handleGo = () => {
        let target = url;
        if (!target.startsWith("http")) target = "https://" + target;
        setCurrentUrl(target);
    };

    // v18: DEEP INSPECTION
    const inspectBackend = () => {
        const remote = require('@electron/remote') || require('electron').remote;
        const allWebContents = remote.webContents.getAllWebContents();
        const backgroundPage = allWebContents.find(wc => {
            const u = wc.getURL();
            return u.includes(clipperId) && (u.includes('background') || u.includes('generated_background'));
        });
        if (backgroundPage) {
            backgroundPage.openDevTools({ mode: 'detach' });
            setStatus("INSPECTING_BACKEND");
        } else {
            setStatus("BACKEND_NOT_FOUND");
        }
    };

    // v24.0 FIXED TRIGGER (No IPC Calls)
    const triggerClipper = () => {
        setStatus("OPENING_POPUP_WINDOW");
        const remote = require('@electron/remote') || require('electron').remote;
        
        // Remove ALL polling of remote.webContents as it natively crashes the clone registry
        // Instead, just physically spawn the window and attach the local preload script
        
        const path = require('path');
        // If TacticalViewer is located deep, we need to resolve folderPath.
        // Assuming we can derive it or just evaluate relative:
        const extDir = "_RESOURCES/DATACORE/105_ChromeExtensionBridge/src/utils/lobotomy.js";
        const vaultPath = dc.app.vault.adapter.getBasePath();
        const preloadPath = path.join(vaultPath, extDir);

        const popupUrl = `chrome-extension://${clipperId}/popup.html`;
        const win = new remote.BrowserWindow({ 
            width: 450, height: 700, 
            backgroundColor: '#1a1a1a', 
            frame: true, title: "Obsidian Clipper",
            webPreferences: {
                session: remote.session.defaultSession,
                contextIsolation: false,
                enableRemoteModule: true,
                webSecurity: false,
                preload: preloadPath
            }
        });
        
        // Execute a flat one-time mock for the specific currentUrl
        // Without binding any IPC listeners like .on()
        const initJs = `
            try {
                if(window.chrome && window.chrome.tabs) {
                    window.chrome.tabs.query = function(q, cb) {
                        const t = [{ id: 1, url: "${currentUrl}", title: "${currentUrl}", active: true, currentWindow: true }];
                        if (cb) cb(t);
                        return Promise.resolve(t);
                    };
                }
            } catch(e) {}
        `;

        win.loadURL(popupUrl).then(() => {
            win.webContents.executeJavaScript(initJs, true);
        });
        
        win.webContents.openDevTools({ mode: 'detach' });
    };

    const MODAL_STYLE = {
        position: 'fixed', top: '5%', left: '5%', right: '5%', bottom: '5%',
        background: t.bg, border: `2px solid ${t.accent}`, zIndex: 10000,
        display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden'
    };

    const NAV_STYLE = {
        padding: '15px 25px', background: t.surface, borderBottom: `1px solid ${t.border}`,
        display: 'flex', gap: '15px', alignItems: 'center'
    };

    return (
        <div style={MODAL_STYLE}>
            <div style={NAV_STYLE}>
                <div style={{ ...s.subtitle, color: t.accent, flexShrink: 0 }}>WEB_VORTEX</div>
                <input 
                    style={{ ...s.input, flexGrow: 1, padding: '10px 15px' }}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGo()}
                />
                <button style={{ ...s.button(true), padding: '10px 20px' }} onClick={handleGo}>ENGAGE</button>
                <button style={{ ...s.button(true), padding: '10px 20px', background: '#9c27b0' }} onClick={triggerClipper}>CLIP_PAGE</button>
                <button style={{ ...s.button(false), padding: '10px 20px', border: `1px solid ${t.accent}` }} onClick={inspectBackend}>INSPECT_EXT</button>
                <button style={{ ...s.button(false), padding: '10px 20px', color: t.danger }} onClick={onClose}>ABORT</button>
            </div>
            
            <div style={{ flexGrow: 1, background: '#fff' }}>
                <webview 
                    ref={webviewRef}
                    src={currentUrl} 
                    style={{ width: '100%', height: '100%' }}
                    enableremotemodule="true"
                    websecurity="false"
                    allowpopups="true"
                    useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                />
            </div>

            <div style={{ padding: '10px 25px', background: t.surface, fontSize: '11px', color: t.text_dim, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <span>SESSION: <strong>DEFAULT_SYNC</strong></span>
                    <span style={{ color: t.accent }}>STATUS: {status}</span>
                </div>
                <span>TARGET_DOMAIN: {new URL(currentUrl).hostname}</span>
            </div>
        </div>
    );
}

return { TacticalViewer };
