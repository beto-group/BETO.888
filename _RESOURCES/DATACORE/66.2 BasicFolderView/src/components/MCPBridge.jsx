/**
 * MCPBridge - Datacore Native Agent Control Bridge (v2)
 */
function MCPBridge({ folderPath, containerRef, onReload, onRunTests, debugManager }) {
    const { useEffect, useState, useRef } = dc;
    const COMMAND_FILE = folderPath + '/_resources/mcp/mcp_commands.json';
    const STATE_FILE = folderPath + '/_resources/mcp/mcp_state.json';

    // Telegram Refs
    const tgBridgeRef = useRef(null);
    const codeResolveRef = useRef(null);
    const passwordResolveRef = useRef(null);

    useEffect(() => {
        const adapter = dc.app.vault.adapter;
        let fs = null;
        try { fs = require('fs'); } catch (e) { }

        const updateState = async (extra = {}) => {
            const state = {
                timestamp: new Date().toISOString(),
                view: "66.6 BasicFolderView",
                activeLeaf: !!dc.app.workspace.activeLeaf,
                folderPath: folderPath,
                telegram: {
                    status: tgBridgeRef.current?.client?.connected ? 'online' : 'offline',
                    waitingForCode: !!codeResolveRef.current,
                    waitingForPassword: !!passwordResolveRef.current
                },
                ...extra
            };
            await adapter.write(STATE_FILE, JSON.stringify(state, null, 2));
        };

        const logToFile = async (filePath, entry) => {
            try {
                let data = [];
                if (await adapter.exists(filePath)) {
                    try {
                        data = JSON.parse(await adapter.read(filePath));
                    } catch (e) { data = []; }
                }
                data.unshift({ timestamp: new Date().toISOString(), ...entry });
                if (data.length > 100) data = data.slice(0, 100);
                await adapter.write(filePath, JSON.stringify(data, null, 2));
            } catch (e) { }
        };

        const maskSensitiveData = (data) => {
            if (!data) return data;
            if (typeof data === 'object') {
                const masked = { ...data };
                const sensitiveKeys = ['apiId', 'apiHash', 'botToken', 'phone', 'token', 'password'];
                sensitiveKeys.forEach(key => {
                    if (masked[key]) masked[key] = "****";
                });
                return masked;
            }
            if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
                try {
                    const parsed = JSON.parse(data);
                    return JSON.stringify(maskSensitiveData(parsed));
                } catch (e) { return data; }
            }
            return data;
        };

        const logActivity = (a, b, c) => {
            const maskedC = maskSensitiveData(c);
            if (typeof c === 'undefined') {
                // Style: logActivity(action, status)
                logToFile(folderPath + '/_resources/mcp/mcp_activity.json', { action: a, status: b, result: "" });
            } else {
                // Style: logActivity(source, action, result)
                logToFile(folderPath + '/_resources/mcp/mcp_activity.json', { source: a, action: b, result: maskedC, status: 'success' });
            }
        };

        const logConsole = (type, args) => logToFile(folderPath + '/_resources/mcp/mcp_logs.json', { type, message: args.map(a => String(a)).join(' ') });

        const addLogEntry = (source, level, message) => {
            logToFile(folderPath + '/_resources/mcp/mcp_logs.json', { source, level, message });
        };

        // Initialize Telegram Bridge
        const initTelegram = async () => {
            // 1. Check Global Registry to prevent duplicate connections during reloads
            if (!window.__MCP_TG_REGISTRY__) window.__MCP_TG_REGISTRY__ = {};
            if (window.__MCP_TG_REGISTRY__[folderPath]) {
                tgBridgeRef.current = window.__MCP_TG_REGISTRY__[folderPath];
                if (debugManager) debugManager.log("🔌 Re-attached to existing TelegramBridge instance");
                updateState();
                return;
            }

            if (tgBridgeRef.current) return;

            try {
                if (debugManager) debugManager.log("🔌 Loading TelegramBridge (Manual Method)...");

                // 2. Load telegramClient.js (works with Vault-relative path)
                const clientPath = `${folderPath}/src/utils/telegramClient_v3.js`;

                try {
                    if (debugManager) debugManager.log(`📖 Reading ${clientPath}...`);
                    const content = await adapter.read(clientPath);

                    if (debugManager) debugManager.log(`✅ Read ${content.length} bytes. Injecting script...`);

                    // Manual Injection
                    const script = document.createElement('script');
                    script.id = 'telegram-bridge-script';
                    script.type = 'module';
                    script.textContent = content;

                    // Error handling for script execution
                    window.onerror = (msg, url, line) => {
                        if (debugManager) debugManager.error("Global Error caught during injection:", msg, line);
                    };

                    document.body.appendChild(script);

                    if (debugManager) debugManager.log("✅ Script injected (Module). Waiting for window.TelegramBridge...");

                    // Wait for module execution (polling up to 5s)
                    let attempts = 0;
                    while (typeof window.TelegramBridge !== 'function' && attempts < 25) {
                        await new Promise(r => setTimeout(r, 200));
                        attempts++;
                    }
                } catch (readErr) {
                    throw new Error(`Failed to read/inject script: ${readErr.message}`);
                }

                if (typeof window.TelegramBridge !== 'function') {
                    throw new Error("TelegramBridge not found in window after manual loading");
                }

                const TelegramBridge = window.TelegramBridge;
                // Pass adapter to constructor
                const bridge = new TelegramBridge(folderPath, adapter);
                tgBridgeRef.current = bridge;
                // Save to registry
                window.__MCP_TG_REGISTRY__[folderPath] = bridge;

                if (debugManager) debugManager.log("🔌 TelegramBridge Logic Loaded & Instantiated");

                // Try Auto-Connect if credentials exist
                setTimeout(async () => {
                    try {
                        // 1. Try to get credentials from Keychain
                        const storage = dc.app.secretStorage;
                        let creds = null;
                        if (storage && typeof storage.getSecret === 'function') {
                            const secret = await storage.getSecret("dc-telegram-creds");
                            if (secret) creds = JSON.parse(secret);
                        }

                        if (creds && creds.apiId && creds.apiHash) {
                            // Auto-connect: ObsidianCLI will reuse this bridge
                            if (creds.botToken) {
                                await bridge.connectWithToken(creds.apiId, creds.apiHash, creds.botToken);
                                logActivity('telegram', 'connected', 'Bot auto-connected');
                            } else {
                                await bridge.connect(creds.apiId, creds.apiHash, creds.phone, null, async () => {
                                    throw new Error("Interactive login required - Auto-connect aborted");
                                });
                                logActivity('telegram', 'connected', 'User auto-connected');
                            }
                            updateState();
                        }
                    } catch (e) {
                        // SILENCED: Prevent startup log from triggering Antigravity
                        // if (debugManager) debugManager.log("Auto-connection skipped: " + e.message);
                    }
                }, 2000);

            } catch (e) {
                console.error("Failed to load TelegramBridge:", e);
                if (debugManager) debugManager.error("Failed to load TelegramBridge", e);
            }
        };

        initTelegram();

        // Connect DebugManager
        let unsubscribe = () => { };
        if (debugManager) {
            unsubscribe = debugManager.subscribe((type, args) => logConsole(type, args));
            // FIXED: Do not intercept global console logs to prevent mcp_logs.json spam/triggers
            // debugManager.interceptConsole();
            // debugManager.log('MCP Bridge Mounted and Intercepting');
        } else {
            console.warn("[MCPBridge] DebugManager not connected");
        }

        const checkCommands = async () => {
            try {
                // 1. Process Commands from File
                let content = null;

                if (fs && fs.existsSync(COMMAND_FILE)) {
                    content = fs.readFileSync(COMMAND_FILE, 'utf8');
                } else if (await adapter.exists(COMMAND_FILE)) {
                    // Fallback to adapter (might fail if path is absolute but adapter expects relative)
                    content = await adapter.read(COMMAND_FILE);
                }

                if (!content) return;

                let cmdData;
                try {
                    cmdData = JSON.parse(content);
                } catch (e) { return; } // Might be partially written

                if (cmdData && cmdData.executed === false) {
                    if (debugManager) debugManager.log("🤖 MCP BRIDGE: Executing command:", cmdData.action);
                    logActivity(cmdData.action, "executing");

                    let result = "Success";

                    const ALLOWED_ACTIONS = [
                        'reload', 'screenshot', 'run_tests', 'click', 'devtools', 'ping', 'open_settings',
                        'save_telegram_creds', 'get_telegram_creds',
                        'telegram_connect', 'telegram_send', 'telegram_submit_code', 'telegram_status', 'telegram_disconnect', 'telegram_nuclear_reset'
                    ];

                    if (!ALLOWED_ACTIONS.includes(cmdData.action)) {
                        throw new Error(`Unauthorized action: ${cmdData.action}`);
                    }

                    if (cmdData.action === 'telegram_nuclear_reset') {
                        try {
                            const files = [
                                folderPath + '/_resources/mcp/telegram_session.txt',
                                folderPath + '/_resources/mcp/telegram_session_user.txt',
                                folderPath + '/_resources/mcp/telegram_session_bot.txt'
                            ];
                            for (const f of files) {
                                if (await adapter.exists(f)) await adapter.remove(f);
                            }
                            if (tgBridgeRef.current) await tgBridgeRef.current.disconnect();
                            if (window.__MCP_TG_REGISTRY__) delete window.__MCP_TG_REGISTRY__[folderPath];
                            tgBridgeRef.current = null;

                            // Remove the script tag to force re-injection
                            const oldScript = document.getElementById('telegram-bridge-script');
                            if (oldScript) oldScript.remove();
                            window.TelegramBridge = null;

                            result = "Nuclear Reset Complete. All session files deleted. Please reconnect.";
                        } catch (e) {
                            result = "Nuclear Reset Error: " + e.message;
                        }
                    } else if (cmdData.action === 'reload') {
                        await onReload();
                        if (debugManager) debugManager.log('Reload triggered via bridge');
                    } else if (cmdData.action === 'screenshot') {
                        /* Screenshot Logic */
                        try {
                            const remote = require('@electron/remote') || require('electron').remote;
                            const webContents = remote.getCurrentWebContents();
                            const image = await webContents.capturePage();
                            const b64 = image.toDataURL();
                            await adapter.write(folderPath + '/mcp_screenshot_b64.txt', b64);
                            result = "Screenshot captured";
                        } catch (e) { result = "Screenshot failed: " + e.message; }
                    } else if (cmdData.action === 'devtools') {
                        try {
                            const remote = require('@electron/remote') || require('electron').remote;
                            remote.getCurrentWebContents().openDevTools();
                            result = "DevTools opened";
                        } catch (e) { result = "DevTools error: " + e.message; }
                    } else if (cmdData.action === 'run_tests') {
                        await onRunTests();
                        result = "Triggered Unit Test Window";
                    } else if (cmdData.action === 'save_telegram_creds') {
                        // ... Creds Logic ...
                        const payload = JSON.stringify({
                            apiId: cmdData.apiId,
                            apiHash: cmdData.apiHash,
                            phone: cmdData.phone || '',
                            botToken: cmdData.botToken || ''
                        });
                        try {
                            await dc.app.secretStorage.setSecret("dc-telegram-creds", payload);
                            result = "Credentials Saved";
                        } catch (e) { result = "Save Failed: " + e.message; }
                    } else if (cmdData.action === 'get_telegram_creds') {
                        try {
                            const secret = await dc.app.secretStorage.getSecret("dc-telegram-creds");
                            result = secret || "{}";
                        } catch (e) { result = "{}"; }
                    }
                    // --- TELEGRAM COMMANDS ---
                    else if (cmdData.action === 'telegram_connect') {
                        if (!tgBridgeRef.current) throw new Error("Bridge not loaded");

                        const { apiId, apiHash, phone, botToken } = cmdData;

                        if (botToken) {
                            // Bot Login
                            tgBridgeRef.current.connectWithToken(apiId, apiHash, botToken)
                                .then(() => logActivity('telegram', 'connected', 'Bot connected'))
                                .catch(e => logActivity('telegram', 'error', e.message));
                            result = "Bot Connection Initiated";
                        } else {
                            // User Login (Async Flow)
                            tgBridgeRef.current.connect(apiId, apiHash, phone, null, async () => {
                                logActivity('telegram', 'waiting_for_code');
                                return new Promise(resolve => {
                                    codeResolveRef.current = resolve;
                                });
                            })
                                .then(() => {
                                    logActivity('telegram', 'connected', 'User connected');
                                    codeResolveRef.current = null;
                                })
                                .catch(e => {
                                    logActivity('telegram', 'error', e.message);
                                    codeResolveRef.current = null;
                                });

                            result = "User Connection Initiated (Waiting for Code)";
                        }
                    } else if (cmdData.action === 'telegram_submit_code') {
                        if (codeResolveRef.current) {
                            codeResolveRef.current(cmdData.code);
                            codeResolveRef.current = null;
                            result = "Code Submitted";
                        } else {
                            result = "Error: Not waiting for code";
                        }
                    } else if (cmdData.action === 'telegram_send') {
                        if (!tgBridgeRef.current) throw new Error("Bridge not loaded");
                        await tgBridgeRef.current.sendMessage(cmdData.to, cmdData.text);
                        result = "Message Sent";
                    } else if (cmdData.action === 'telegram_status') {
                        if (!tgBridgeRef.current) throw new Error("Bridge not loaded");
                        const me = await tgBridgeRef.current.checkConnection();
                        result = `Connected as ${me.firstName}`;
                    } else if (cmdData.action === 'telegram_disconnect') {
                        if (tgBridgeRef.current) {
                            await tgBridgeRef.current.disconnect();
                            // Also clear from registry to allow fresh reconnect later
                            if (window.__MCP_TG_REGISTRY__) {
                                delete window.__MCP_TG_REGISTRY__[folderPath];
                            }
                            // Important: Clean up the ref so initTelegram can recreate if needed
                            tgBridgeRef.current = null;
                            result = "Disconnected and cleared registry";
                        } else {
                            result = "Bridge already offline";
                        }
                    }
                    // -------------------------

                    // Mark as executed
                    cmdData.executed = true;
                    cmdData.executedAt = new Date().toISOString();
                    cmdData.result = result;

                    // Write back
                    if (fs && fs.existsSync(COMMAND_FILE)) {
                        fs.writeFileSync(COMMAND_FILE, JSON.stringify(cmdData, null, 2));
                    } else {
                        await adapter.write(COMMAND_FILE, JSON.stringify(cmdData, null, 2));
                    }
                    await updateState({ lastResult: result });
                    logActivity(cmdData.action, "completed", result);
                }
            } catch (e) {
                if (debugManager) debugManager.warn("MCP Bridge Error:", e);
                await updateState({ lastError: e.message });
            }
        };

        // Initialize state
        updateState({ status: "started" });

        const interval = setInterval(checkCommands, 1000); // 1s polling
        const heart = setInterval(() => {
            if (debugManager && debugManager.enabled) logConsole('heartbeat', [new Date().toISOString()]);
            // Also check telegram state periodically
            if (tgBridgeRef.current && tgBridgeRef.current.client) {
                updateState();
            }
        }, 5000);

        return () => {
            clearInterval(interval);
            clearInterval(heart);
            if (debugManager) {
                debugManager.log('MCP Bridge Unmounting');
                debugManager.restoreConsole();
                unsubscribe();
            }
        };
    }, []);

    window.FOLDER_PATH = folderPath;
    return null;
}

return { MCPBridge };
