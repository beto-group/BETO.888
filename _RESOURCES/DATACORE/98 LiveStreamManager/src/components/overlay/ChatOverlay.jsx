const { useState, useEffect, useRef } = dc;

// OS/Path modules - Robust resolution
let BrowserWindow;
try {
    const electron = require('electron');
    const remote = require('@electron/remote') || electron.remote;
    if (remote) {
        BrowserWindow = remote.BrowserWindow;
    } else {
        BrowserWindow = electron.BrowserWindow;
    }
} catch (e) {
    console.warn("[ChatOverlay] Electron modules catch:", e.message);
}

// Use window global to truly survive component re-evaluations and prevent GC
if (typeof window !== 'undefined' && !window._LIVESTREAM_CHAT_WIN) {
    window._LIVESTREAM_CHAT_WIN = null;
}

function ChatOverlay({
    styles,
    apiKey,
    videoId,
    accessToken, // OAuth Token for posting
    onRef,
    onMessagesUpdate,
    messages: propsMessages = [], // From Unofficial Proxy
    liveChatId,
    onSendMessage
}) {
    const [messages, setMessages] = useState([]);
    const messagesRef = useRef([]);
    const lastSentIdRef = useRef(null);
    const isOpeningRef = useRef(false);

    useEffect(() => {
        // console.log("[ChatOverlay] Mounted/Refreshed for video:", videoId);
        return () => {
            // console.log("[ChatOverlay] Unmounting. Window status:", window._LIVESTREAM_CHAT_WIN ? "Alive" : "None");
        };
    }, []);

    // Expose methods to parent
    useEffect(() => {
        if (onRef) {
            // console.log("[ChatOverlay] Exposing toggleChat to parent.");
            onRef({
                openChat: () => openExternalChatWindow(),
                toggleChat: () => {
                    // console.log("[ChatOverlay] toggleChat called. Window:", !!window._LIVESTREAM_CHAT_WIN);
                    const win = window._LIVESTREAM_CHAT_WIN;
                    if (win && !win.isDestroyed()) {
                        win.close();
                    } else {
                        openExternalChatWindow();
                    }
                }
            });
        }
    }, [onRef, liveChatId, accessToken, apiKey]);

    // 1. Sync Messages from Props (Unofficial Proxy)
    useEffect(() => {
        if (propsMessages && propsMessages.length > 0) {
            setMessages(propsMessages);
            messagesRef.current = propsMessages;

            const newest = propsMessages[propsMessages.length - 1];
            const isNewMessage = newest && lastSentIdRef.current !== newest.id;

            if (isNewMessage) {
                lastSentIdRef.current = newest.id;

                const win = window._LIVESTREAM_CHAT_WIN;
                if (win && !win.isDestroyed()) {
                    try {
                        win.webContents.send('new-chat-message', newest);
                    } catch (e) {
                        console.warn("[ChatOverlay] Sync failed:", e.message);
                    }
                } else {
                    // Window is closed, but we have a NEW message (not just history loading).
                    // We only want to auto-open if this isn't the intial load.
                    // However, defining 'initial load' is tricky. 
                    // Let's assume if we are receiving updates, we might want to see them.
                    // To avoid popping up on initial load, we could check if lastSentIdRef was null.
                    // But lastSentIdRef is null on start.
                    // For now, let's just Open it. The user requested: "whenever a new chat happen the popup oppens"
                    console.log("[ChatOverlay] New message received, auto-opening chat window.");
                    openExternalChatWindow();
                }
            }

            if (onMessagesUpdate) onMessagesUpdate(propsMessages);
        }
    }, [propsMessages]);

    // 2. Sync Config
    useEffect(() => {
        const win = window._LIVESTREAM_CHAT_WIN;
        if (win && !win.isDestroyed()) {
            try {
                win.webContents.send('update-config', { accessToken, liveChatId, apiKey });
            } catch (e) { }
        }
    }, [accessToken, liveChatId, apiKey]);

    const openExternalChatWindow = async () => {
        // console.log("[ChatOverlay] openExternalChatWindow invoked.");
        if (!BrowserWindow) {
            console.error("[ChatOverlay] BrowserWindow not available. Check Electron remoting.");
            return;
        }

        if (window._LIVESTREAM_CHAT_WIN && !window._LIVESTREAM_CHAT_WIN.isDestroyed()) {
            // console.log("[ChatOverlay] Focusing existing window.");
            window._LIVESTREAM_CHAT_WIN.focus();
            return window._LIVESTREAM_CHAT_WIN;
        }

        if (isOpeningRef.current) {
            console.log("[ChatOverlay] Already opening...");
            return;
        }
        isOpeningRef.current = true;

        // Failsafe: Reset isOpening after 10s if window never shows
        setTimeout(() => { if (isOpeningRef.current) isOpeningRef.current = false; }, 10000);

        try {
            // We use simple string concatenation for the Inner template to avoid escaping hell
            const scriptContent = `
                const { ipcRenderer } = require('electron');
                const container = document.getElementById('chat-container');
                const input = document.getElementById('msg-input');
                const btn = document.getElementById('send-btn');
                
                let CONFIG = {};

                console.log("[ChatWindow] Script Initializing...");

                function updateUI() {
                    const hasId = !!CONFIG.liveChatId;
                    const hasAuth = !!CONFIG.accessToken;
                    console.log("[ChatWindow] updateUI. ID:", hasId, "Auth:", hasAuth);
                    
                    document.getElementById('id-dot').className = hasId ? 'dot dot-active' : 'dot';
                    document.getElementById('auth-dot').className = hasAuth ? 'dot dot-active' : 'dot';
                    
                    if (!hasAuth) {
                        input.placeholder = "OAuth Missing";
                        input.disabled = true; btn.disabled = true;
                    } else if (!hasId) {
                        input.placeholder = "No Live Chat ID (Check Manager)";
                        input.disabled = true; btn.disabled = true;
                    } else {
                        input.placeholder = "Say something...";
                        input.disabled = false; btn.disabled = false;
                        // Auto-focus if we just became enabled
                        input.focus();
                    }
                }

                ipcRenderer.on('update-config', (e, cfg) => {
                    console.log("[ChatWindow] Config Update:", cfg.liveChatId ? "ID Detected" : "ID Missing", cfg.accessToken ? "Auth Detected" : "Auth Missing");
                    CONFIG = { ...CONFIG, ...cfg };
                    updateUI();
                });

                function addMessage(msg) {
                    const div = document.createElement('div');
                    div.className = 'message';
                    const author = msg.author || 'System';
                    const text = msg.text || '';
                    const avatar = msg.profileImageUrl ? '<img src="' + msg.profileImageUrl + '" class="avatar">' : '<div class="avatar"></div>';
                    
                    div.innerHTML = '<div class="author ' + (author === 'System' ? 'author-system' : '') + '">' + avatar + ' ' + author + '</div>' +
                                  '<div class="content">' + text + '</div>';
                    container.appendChild(div);
                    container.scrollTop = container.scrollHeight;
                }

                ipcRenderer.on('new-chat-message', (e, msg) => {
                    addMessage(msg);
                });

                async function send() {
                    const val = input.value.trim();
                    if (!val || btn.disabled) return;
                    
                    input.disabled = true; btn.disabled = true;
                    try {
                        console.log("[ChatWindow] Relay send to proxy:", val);
                        ipcRenderer.send('proxy-send-chat', val);
                        input.value = '';
                    } catch (e) {
                        console.error("[ChatWindow] Send Error:", e);
                        addMessage({ author: 'System', text: 'Bridge Error: ' + e.message });
                    } finally {
                        updateUI();
                        input.focus();
                    }
                }

                btn.onclick = send;
                input.onkeydown = (e) => {
                    if (e.key === 'Enter') send();
                };
                
                window.onfocus = () => {
                    console.log("[ChatWindow] Window Focused");
                    if (!input.disabled) input.focus();
                };

                addMessage({ author: 'System', text: 'Chat Ready.' });
                updateUI();
            `;

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Live Chat</title>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            margin: 0; padding: 0; background: #121212; color: #e0e0e0;
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            display: flex; flex-direction: column; height: 100vh; overflow: hidden;
                        }
                        #status-bar {
                            background: #000; padding: 6px 12px; font-size: 11px; color: #888;
                            display: flex; justify-content: space-between; border-bottom: 1px solid #222;
                            -webkit-app-region: drag;
                        }
                        #chat-container { flex: 1; overflow-y: auto; padding: 12px; scroll-behavior: smooth; }
                        .message { padding: 8px 0; border-bottom: 1px solid #1f1f1f; margin-bottom: 4px; }
                        .author { color: #a076f9; font-weight: 600; font-size: 13px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
                        .author-system { color: #f87171; font-style: italic; }
                        .avatar { width: 22px; height: 22px; border-radius: 50%; background: #222; }
                        .content { font-size: 13px; line-height: 1.5; color: #d1d1d1; }
                        #input-area { background: #1a1a1a; padding: 12px; border-top: 1px solid #333; display: flex; gap: 8px; }
                        #msg-input { flex: 1; background: #0a0a0a; border: 1px solid #333; border-radius: 6px; color: #fff; padding: 10px; outline: none; }
                        #msg-input:focus { border-color: #a076f9; box-shadow: 0 0 0 1px #a076f933; }
                        #send-btn { background: #a076f9; color: white; border: none; padding: 0 18px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                        #send-btn:hover { background: #9065e8; }
                        #send-btn:disabled { background: #333; color: #666; cursor: not-allowed; }
                        .dot { width: 7px; height: 7px; border-radius: 50%; background: #333; display: inline-block; margin-right: 4px; }
                        .dot-active { background: #10b981; box-shadow: 0 0 6px #10b981; }
                    </style>
                </head>
                <body>
                    <div id="status-bar">
                        <div style="-webkit-app-region: no-drag">LIVE CH_AT</div>
                        <div>
                            <span class="dot" id="id-dot"></span>ID 
                            <span class="dot" id="auth-dot" style="margin-left: 8px;"></span>AUTH
                        </div>
                    </div>
                    <div id="chat-container"></div>
                    <div id="input-area">
                        <input type="text" id="msg-input" placeholder="Initializing..." disabled>
                        <button id="send-btn" disabled>SEND</button>
                    </div>
                </body>
                </html>
            `;

            const win = new BrowserWindow({
                width: 420,
                height: 650,
                title: '🔴 Live Chat',
                backgroundColor: '#121212',
                show: false,
                alwaysOnTop: true,
                frame: true,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    enableRemoteModule: true
                }
            });

            window._LIVESTREAM_CHAT_WIN = win;

            const finalUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

            win.loadURL(finalUrl).catch(err => {
                console.error("[ChatOverlay] loadURL Error:", err);
                isOpeningRef.current = false;
            });

            win.once('ready-to-show', async () => {
                try {
                    await win.webContents.executeJavaScript(scriptContent);
                    win.show();
                    win.focus();
                    // Mac Quirk: Sometimes needs a double focus or a delay to accept keyboard
                    setTimeout(() => {
                        if (win && !win.isDestroyed()) {
                            win.focus();
                            win.webContents.executeJavaScript(`document.getElementById('msg-input').focus(); console.log("[ChatWindow] Explicit input focus triggered.");`);
                        }
                    }, 500);

                    isOpeningRef.current = false;

                    win.webContents.send('update-config', { accessToken, liveChatId, apiKey });
                    if (messagesRef.current.length > 0) {
                        messagesRef.current.forEach(m => win.webContents.send('new-chat-message', m));
                    }
                } catch (e) {
                    console.error("[ChatOverlay] Script Execution Error:", e);
                    isOpeningRef.current = false;
                }
            });

            // Handle messages from the window
            win.webContents.on('ipc-message', (event, channel, text) => {
                if (channel === 'proxy-send-chat' && text) {
                    if (onSendMessage) onSendMessage(text);
                }
            });

            win.on('closed', () => {
                window._LIVESTREAM_CHAT_WIN = null;
                isOpeningRef.current = false;
            });

            win.webContents.on('did-fail-load', (e, code, desc) => {
                console.error("[ChatOverlay] Windows Load Failed:", code, desc);
                isOpeningRef.current = false;
            });

            win.webContents.on('render-process-gone', (e, details) => {
                console.error("[ChatOverlay] RENDER PROCESS GONE:", details.reason, details.exitCode);
                window._LIVESTREAM_CHAT_WIN = null;
                isOpeningRef.current = false;
            });

            win.webContents.on('console-message', (e, level, msg) => {
                console.log(`[ChatWindow] [Log] ${msg}`);
            });

            return win;

        } catch (err) {
            isOpeningRef.current = false;
            console.error("[ChatOverlay] Spawn Error:", err);
            window._LIVESTREAM_CHAT_WIN = null;
        }
    };

    return null;
}

return { ChatOverlay };
