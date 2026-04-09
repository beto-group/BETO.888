const { useEffect, useState, useRef } = dc;
const { spawn } = require('child_process');
const crypto = require('crypto');

// Modular Imports
const activeFile = dc.app.workspace.getActiveFile().path;
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { SceneControls } = await dc.require(folderPath + '/src/components/manager/SceneControls.jsx');
const { ObsControl } = await dc.require(folderPath + '/src/components/manager/ObsControl.jsx');
const { BotControl } = await dc.require(folderPath + '/src/components/manager/BotControl.jsx');
const { CountdownControl } = await dc.require(folderPath + '/src/components/manager/CountdownControl.jsx');
const { useStreamHotkeys } = await dc.require(folderPath + '/src/hooks/useStreamHotkeys.js');
const { useObsClient } = await dc.require(folderPath + '/src/hooks/useObsClient.js');

function LiveStreamManager(props) {
    const { styles, domUtils, components, onReload } = props;
    const STYLES = styles;
    const { LiveStreamOverlay } = components;

    const [countdown, setCountdown] = useState("10:00");
    const [isPaused, setIsPaused] = useState(true);
    const [showManager, setShowManager] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // PERSISTENCE: Initialize from storage
    const STORAGE_KEY = "beto-livestream-yt-creds";

    const [currentScene, setCurrentScene] = useState(null);
    const [videoId, setVideoId] = useState(() => localStorage.getItem(`${STORAGE_KEY}-videoId`) || "");
    const [apiKey, setApiKey] = useState(() => localStorage.getItem(`${STORAGE_KEY}-apiKey`) || "");
    const [oauthToken, setOauthToken] = useState(() => localStorage.getItem(`${STORAGE_KEY}-oauthToken`) || "");
    const [liveChatId, setLiveChatId] = useState(() => localStorage.getItem(`${STORAGE_KEY}-liveChatId`) || "");
    const [clientId, setClientId] = useState(() => localStorage.getItem(`${STORAGE_KEY}-clientId`) || "");
    const [clientSecret, setClientSecret] = useState(() => localStorage.getItem(`${STORAGE_KEY}-clientSecret`) || "");
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(`${STORAGE_KEY}-refreshToken`) || "");

    // BOT PERSISTENCE
    const [botApiKey, setBotApiKey] = useState(() => localStorage.getItem(`${STORAGE_KEY}-botApiKey`) || "");
    const [botClientId, setBotClientId] = useState(() => localStorage.getItem(`${STORAGE_KEY}-botClientId`) || "");
    const [botClientSecret, setBotClientSecret] = useState(() => localStorage.getItem(`${STORAGE_KEY}-botClientSecret`) || "");
    const [botRefreshToken, setBotRefreshToken] = useState(() => localStorage.getItem(`${STORAGE_KEY}-botRefreshToken`) || "");
    const [botOauthToken, setBotOauthToken] = useState(() => localStorage.getItem(`${STORAGE_KEY}-botOauthToken`) || "");
    const [botPromptPath, setBotPromptPath] = useState(() => localStorage.getItem(`${STORAGE_KEY}-botPromptPath`) || "73 LiveStreamManager/resources/data/prompts/default_bot_prompt.md");
    const [botEnabled, setBotEnabled] = useState(() => localStorage.getItem(`${STORAGE_KEY}-botEnabled`) === "true");
    const [botCommands, setBotCommands] = useState(() => {
        const saved = localStorage.getItem(`${STORAGE_KEY}-botCommands`);
        const defaults = [
            { id: '8ball', name: '8ball', description: 'Ask the magic 8-ball', permission: 'everyone', enabled: true },
            { id: 'commands', name: 'commands', description: 'List all commands', permission: 'everyone', enabled: true },
            { id: 'uptime', name: 'uptime', description: 'Show stream uptime', permission: 'everyone', enabled: true },
            { id: 'vanish', name: 'vanish', description: 'Vanish in a puff of smoke', permission: 'everyone', enabled: true },
            { id: 'quote', name: 'quote', description: 'Show a random quote', permission: 'everyone', enabled: true },
            { id: 'timer', name: 'timer', description: 'Toggle stream timers', permission: 'moderator', enabled: true },
            { id: 'command', name: 'command', description: 'Add/edit commands', permission: 'moderator', enabled: true },
            { id: 'bot', name: 'bot', description: 'Toggle bot intelligence', permission: 'supermod', enabled: true },
            { id: 'filesay', name: 'filesay', description: 'Output file to chat', permission: 'supermod', enabled: true },
            { id: 'nuke', name: 'nuke', description: 'Mass remove messages', permission: 'supermod', enabled: true },
            { id: 'qna', name: 'qna', description: 'AI Tech Support', permission: 'everyone', enabled: true, type: 'ai' },
            { id: 'lore', name: 'lore', description: 'AI Fun Facts', permission: 'everyone', enabled: true, type: 'ai' }
        ];
        if (!saved) return defaults;
        try {
            const parsed = JSON.parse(saved);
            const migrated = parsed.map(c => ({ ...c, name: c.name.toLowerCase().replace(/\s+/g, '-') }));
            const existingIds = new Set(migrated.map(c => c.id));
            const missing = defaults.filter(d => !existingIds.has(d.id));
            return missing.length > 0 ? [...migrated, ...missing] : migrated;
        } catch (e) { return defaults; }
    });
    const [superMods, setSuperMods] = useState(() => JSON.parse(localStorage.getItem(`${STORAGE_KEY}-superMods`) || '["Beto Group", "Beto_Group"]'));
    const [botFilters, setBotFilters] = useState(() => JSON.parse(localStorage.getItem(`${STORAGE_KEY}-botFilters`) || '["spam", "profanity", "links"]'));
    const [botChatMode, setBotChatMode] = useState(() => localStorage.getItem(`${STORAGE_KEY}-botChatMode`) || "no-quota");
    const [activeTab, setActiveTab] = useState('production');
    const [isTowerHovered, setIsTowerHovered] = useState(false);
    const [liveMessages, setLiveMessages] = useState([]);

    // AUTO-FETCH liveChatId if missing
    useEffect(() => {
        if (!videoId || !oauthToken || liveChatId) return;
        const autoFetchChatId = async () => {
            try {
                const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}`, {
                    headers: { 'Authorization': `Bearer ${oauthToken}` }
                });
                const data = await res.json();
                const activeId = data.items?.[0]?.liveStreamingDetails?.activeLiveChatId;
                if (activeId) {
                    setLiveChatId(activeId);
                    localStorage.setItem(`${STORAGE_KEY}-liveChatId`, activeId);
                }
            } catch (e) {
                console.warn("[LiveStreamManager] Auto-fetch liveChatId failed:", e.message);
            }
        };
        autoFetchChatId();
    }, [videoId, oauthToken, liveChatId]);

    // AUTO-AUTHORIZE on mount
    useEffect(() => {
        if (refreshToken && clientId && clientSecret && !oauthToken) {
            console.log("[LiveStreamManager] Auto-authorizing YouTube...");
            refreshAccessToken(true);
        }
    }, []);

    // ROBUST PROXIMITY DETECTION: 
    // Uses global mousemove to bypass any potential overlay hit-test blocking
    useEffect(() => {
        const handleMouseMove = (e) => {
            // MASSIVE PROXIMITY ZONE: 450px from right, 300px from top
            const isTopRightProximity = (window.innerWidth - e.clientX < 450) && (e.clientY < 300);
            setIsTowerHovered(isTopRightProximity);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // OBS Settings
    const [obsHost, setObsHost] = useState(() => localStorage.getItem(`${STORAGE_KEY}-obsHost`) || "localhost");
    const [obsPort, setObsPort] = useState(() => localStorage.getItem(`${STORAGE_KEY}-obsPort`) || "4455");
    const [obsPassword, setObsPassword] = useState(() => localStorage.getItem(`${STORAGE_KEY}-obsPassword`) || "");
    const [sceneMap, setSceneMap] = useState(() => JSON.parse(localStorage.getItem(`${STORAGE_KEY}-sceneMap`) || '{"starting":"Starting Soon","privacy":"Privacy","brb":"BRB","ending":"Ending"}'));

    const [reconnectTrigger, setReconnectTrigger] = useState(0);
    const [autoRepairEnabled, setAutoRepairEnabled] = useState(true);
    const [streamMessages, setStreamMessages] = useState([]);

    const wrapperRef = useRef(null);
    const chatProxyRef = useRef(null);
    const chatProcessRef = useRef(null);

    // OBS CLIENT HOOK
    const {
        obsStatus,
        obsScenes,
        obsSceneItems,
        activeProgramScene,
        isStreaming,
        isRecording,
        obsScreenshot,
        focusInputSettings,
        sendObsMessage,
        getInputSettings,
        createInput,
        setInputSettings,
        removeSceneItem,
        createScene,
        removeScene,
        toggleStreaming,
        toggleRecording,
        toggleSceneItem,
        fetchSceneItems,
        obsMonitors,
        fetchMonitors,
        fetchScreenshot,
        restartActiveCapture
    } = useObsClient({ obsHost, obsPort, obsPassword, reconnectTrigger, autoRepairEnabled });

    // Save persistence on change
    useEffect(() => {
        const data = {
            videoId, apiKey, oauthToken, liveChatId, refreshToken, clientId, clientSecret,
            obsHost, obsPort, obsPassword, botApiKey, botClientId, botClientSecret,
            botRefreshToken, botOauthToken, botPromptPath, botEnabled, botCommands, botFilters, botChatMode, superMods, sceneMap
        };
        Object.keys(data).forEach(key => {
            const val = data[key];
            localStorage.setItem(`${STORAGE_KEY}-${key}`, typeof val === 'object' ? JSON.stringify(val) : val);
        });
    }, [videoId, apiKey, oauthToken, liveChatId, refreshToken, clientId, clientSecret, obsHost, obsPort, obsPassword, botApiKey, botClientId, botClientSecret, botRefreshToken, botOauthToken, botPromptPath, botEnabled, botCommands, botFilters, botChatMode, superMods, sceneMap]);

    const [availableWindows, setAvailableWindows] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showYoutubeSecurity, setShowYoutubeSecurity] = useState(false);

    const fetchAvailableApplications = () => {
        // Fallback for Window Capture: List running apps
        const { spawn } = require('child_process');
        const ls = spawn('lsappinfo', ['list']);
        let output = '';
        ls.stdout.on('data', (data) => output += data.toString());
        ls.on('close', () => {
            const apps = [];
            const lines = output.split('\n');
            lines.forEach(line => {
                const match = line.match(/^(\d+)\) "(.*?)"/);
                if (match) {
                    const pid = line.match(/pid = (\d+)/);
                    const label = pid ? `${match[2]} (PID: ${pid[1]})` : match[2];
                    if (!apps.includes(label)) apps.push(label);
                }
            });
            setAvailableWindows(apps.sort());
        });
    };

    // Helpers
    const handleSceneChange = (id) => {
        setCurrentScene(id);
        if (id && sceneMap[id] && obsStatus === 'connected') {
            sendObsMessage('SetCurrentProgramScene', { sceneName: sceneMap[id] });
        }

        // Logic: Only run countdown in "starting" state, with a 2s delay
        if (id === 'starting') {
            setIsPaused(true); // Ensure it's paused initially
            setTimeout(() => {
                setIsPaused(false); // Start after 2 seconds
            }, 2000);
        } else {
            setIsPaused(true); // Pause when leaving starting screen
        }
    };

    const addTime = (mins) => {
        const parts = countdown.split(':');
        let totalSecs = parseInt(parts[0]) * 60 + parseInt(parts[1]) + (mins * 60);
        totalSecs = Math.max(0, totalSecs);
        const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
        const s = (totalSecs % 60).toString().padStart(2, '0');
        setCountdown(`${m}:${s}`);
    };

    const setPreset = (time) => { setCountdown(time); setIsPaused(false); };



    // Hide status bar (Copied from ActionsManager)
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

    const toggleFullscreen = () => {
        if (!wrapperRef.current) return;
        if (!document.fullscreenElement) {
            // Force focus synchronously before requesting fullscreen
            // This ensures the browser treats this as a valid user-initiated action context
            wrapperRef.current.focus({ preventScroll: true });

            wrapperRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const refreshAccessToken = async (silent = false) => {
        if (!refreshToken || !clientId || !clientSecret) {
            if (!silent) alert("Missing OAuth Refresh Token, Client ID, or Client Secret.");
            return;
        }
        try {
            const resp = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' })
            });
            const data = await resp.json();
            if (data.access_token) {
                setOauthToken(data.access_token);
                localStorage.setItem(`${STORAGE_KEY}-oauthToken`, data.access_token);
                if (!silent) console.log("[LiveStreamManager] Token refreshed successfully.");
                return data.access_token;
            } else {
                const msg = "Failed to refresh token: " + (data.error_description || data.error);
                if (!silent) alert(msg);
                else console.warn("[LiveStreamManager]", msg);
            }
        } catch (err) {
            if (!silent) alert("Error refreshing token: " + err.message);
            else console.error("[LiveStreamManager] Refresh Error:", err);
        }
    };

    const refreshBotAccessToken = async () => {
        if (!botRefreshToken || !botClientId || !botClientSecret) return alert("Missing Bot OAuth Refresh Token, Client ID, or Client Secret.");
        try {
            const resp = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ client_id: botClientId, client_secret: botClientSecret, refresh_token: botRefreshToken, grant_type: 'refresh_token' })
            });
            const data = await resp.json();
            if (data.access_token) {
                setBotOauthToken(data.access_token);
                alert("Bot token refreshed successfully.");
            } else { alert("Failed to refresh bot token: " + (data.error_description || data.error)); }
        } catch (err) { alert("Error refreshing bot token: " + err.message); }
    };

    // AUTO-OPEN OBS: Restore the mount logic
    useEffect(() => {
        if (autoRepairEnabled && obsStatus === 'disconnected') {
            console.log("Auto-repair: Launching OBS...");
            launchOBS();
        }
    }, []); // Only once on mount

    // Countdown Timer logic
    useEffect(() => {
        let timer = null;
        if (!isPaused && countdown !== "00:00") {
            timer = setInterval(() => {
                setCountdown(current => {
                    const parts = current.split(':');
                    let totalSecs = parseInt(parts[0]) * 60 + parseInt(parts[1]) - 1;
                    if (totalSecs <= 0) {
                        clearInterval(timer);
                        return "00:00";
                    }
                    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
                    const s = (totalSecs % 60).toString().padStart(2, '0');
                    return `${m}:${s}`;
                });
            }, 1000);
        }
        return () => { if (timer) clearInterval(timer); };
    }, [isPaused, countdown]);




    // CHAT PROXY Initialization
    useEffect(() => {
        if (!videoId) return;

        let chatProcess = null;

        const pruneChatHistory = async (vid) => {
            const chatFile = `73 LiveStreamManager/resources/data/chat/${vid}.md`;
            try {
                const exists = await dc.app.vault.adapter.exists(chatFile);
                if (!exists) return;

                const content = await dc.app.vault.adapter.read(chatFile);
                const lines = content.split('\n');
                const seenIds = new Set();
                const uniqueContent = [];

                for (let line of lines) {
                    if (line.startsWith('> **')) {
                        // Match author, time, text, and optional ID
                        const match = line.match(/^> \*\*(.*?)\*\* \[(.*?)\]: (.*?)(\s*<!-- id:(.*?) -->)?$/);
                        if (match) {
                            const author = match[1].trim();
                            const text = match[3].trim();
                            const id = match[5] || crypto.createHash('md5').update(`${author}:${text}`).digest('hex');

                            if (!seenIds.has(id)) {
                                seenIds.add(id);
                                // Re-standardize the line with ID if missing
                                uniqueContent.push(`> **${author}** [${match[2]}]: ${text} <!-- id:${id} -->`);
                            }
                        }
                    } else if (line.trim() !== '') {
                        // Keep other metadata if any
                        uniqueContent.push(line);
                    }
                }

                const newBody = uniqueContent.join('\n\n') + '\n';
                if (newBody !== content && uniqueContent.length > 0) {
                    await dc.app.vault.adapter.write(chatFile, newBody);
                    console.log(`[ChatManager] Pruned history for ${vid}. Unique: ${seenIds.size}`);
                }
                return { uniqueContent, seenIds };
            } catch (err) {
                console.error("[ChatManager] Pruning Error:", err);
                return null;
            }
        };

        const loadChatHistory = async (vid) => {
            const chatFile = `73 LiveStreamManager/resources/data/chat/${vid}.md`;
            try {
                const exists = await dc.app.vault.adapter.exists(chatFile);
                if (!exists) {
                    setStreamMessages([]);
                    return;
                }

                // Prune first to ensure we don't load junk
                const pruned = await pruneChatHistory(vid);
                if (!pruned) return;

                const { uniqueContent } = pruned;
                const history = [];

                uniqueContent.forEach(line => {
                    if (line.startsWith('> **')) {
                        const match = line.match(/^> \*\*(.*?)\*\* \[(.*?)\]: (.*?)(\s*<!-- id:(.*?) -->)?$/);
                        if (match) {
                            history.push({
                                id: match[5],
                                author: match[1],
                                text: match[3],
                                publishedAt: new Date().toISOString(),
                                isHistory: true
                            });
                        }
                    }
                });
                // console.log(`[ChatManager] Loaded ${history.length} messages.`);
                setStreamMessages(history);
            } catch (err) {
                console.error("[LiveStreamManager] Load History Error:", err);
                setStreamMessages([]);
            }
        };

        const startChatProxy = () => {
            try {
                const path = require('path');
                const fs = require('fs');
                const vaultPath = dc.app.vault.adapter.basePath;

                // Construct absolute path to chat-proxy.js
                let absoluteScriptPath = path.join(folderPath, 'src', 'scripts', 'chat-proxy.js');
                if (!path.isAbsolute(absoluteScriptPath)) {
                    absoluteScriptPath = path.join(vaultPath, folderPath, 'src', 'scripts', 'chat-proxy.js');
                }

                if (!fs.existsSync(absoluteScriptPath)) {
                    console.error("[ChatProxy] Script not found:", absoluteScriptPath);
                    return;
                }

                // Find Node
                let nodeExec = 'node';
                for (const p of ['/usr/local/bin/node', '/opt/homebrew/bin/node', '/usr/bin/node']) {
                    if (fs.existsSync(p)) { nodeExec = p; break; }
                }

                console.log(`[ChatProxy] Spawning: ${nodeExec} "${absoluteScriptPath}" for ${videoId}`);
                chatProcessRef.current = spawn(nodeExec, [absoluteScriptPath]);

                const rl = require('readline').createInterface({
                    input: chatProcessRef.current.stdout,
                    terminal: false
                });

                rl.on('line', (line) => {
                    if (!line.trim()) return;
                    try {
                        const msg = JSON.parse(line);
                        if (msg.type === 'chat') {
                            setStreamMessages(prev => {
                                // Robust check: Do we already have this ID?
                                if (prev.some(m => m.id === msg.message.id)) return prev;
                                return [...prev.slice(-150), msg.message];
                            });
                        } else if (msg.type === 'send_result') {
                            console.log("[ChatProxy Send Result]", msg);
                        } else if (msg.type === 'status') {
                            console.log("[ChatProxy Status]", msg.msg);
                        } else if (msg.type === 'error') {
                            console.error("[ChatProxy Error]", msg.msg);
                        } else {
                            console.log("[ChatProxy Unknown]", msg);
                        }
                    } catch (e) {
                        // Non-JSON output
                    }
                });

                chatProcessRef.current.stderr.on('data', (data) => console.error("[ChatProxy Stderr]", data.toString()));

                // Construct data storage path
                const dataPath = path.join(vaultPath, folderPath, 'resources', 'data', 'chat');

                // Send connect command
                chatProcessRef.current.stdin.write(JSON.stringify({
                    type: 'connect',
                    videoId,
                    storagePath: dataPath,
                    oauthToken
                }) + '\n');

            } catch (err) {
                console.error("[ChatProxy Start Error]", err);
            }
        };

        // Load history first then start proxy
        loadChatHistory(videoId).then(() => {
            startChatProxy();
        });

        return () => {
            if (chatProcessRef.current) {
                chatProcessRef.current.stdin.write(JSON.stringify({ type: 'stop' }) + '\n');
                chatProcessRef.current.kill();
                chatProcessRef.current = null;
            }
        };
    }, [videoId]);

    const launchOBS = () => {
        // Use standard open to prevent password prompts
        const child = spawn('open', ['-a', 'OBS']);

        child.on('close', () => {
            // OBS is now launching.
            // We need to wait for a bit and then pull Obsidian back into focus
            // Doing a 5s and 10s check to be sure we win the focus battle.
            setTimeout(() => { spawn('open', ['-a', 'Obsidian']); }, 5000);
            setTimeout(() => { spawn('open', ['-a', 'Obsidian']); }, 10000);
        });
    };

    const scenes = [
        { id: 'starting', icon: 'hourglass' },
        { id: 'privacy', icon: 'shield' },
        { id: 'brb', icon: 'coffee' },
        { id: 'ending', icon: 'clapperboard' },
        { id: 'bot-control', icon: 'bot' },
        { id: 'obs-engine', icon: 'cpu' }
    ];

    // HOTKEY HOOK INTEGRATION
    useStreamHotkeys({
        wrapperRef,
        toggleFullscreen,
        setShowManager,
        handleSceneChange,
        addTime,
        isModalOpen,
        closeModals: () => {
            // This will be handled via event or callback usually, 
            // but for now, we just inform the manager which can't easily deep-close
            // So we'll trigger a global event that components listen to.
            window.dispatchEvent(new CustomEvent('close-modals'));
            setIsModalOpen(false);
        }
    });

    return (
        <div ref={wrapperRef} style={{ ...STYLES.fullTabWrapper, outline: 'none', background: '#000' }} tabIndex="0">
            <LiveStreamOverlay
                {...props}
                countdown={countdown}
                isPaused={isPaused}
                setIsPaused={setIsPaused}
                currentScene={currentScene}
                onSelectScene={handleSceneChange}
                videoId={videoId} setVideoId={setVideoId}
                apiKey={apiKey} setApiKey={setApiKey}
                oauthToken={oauthToken} setOauthToken={setOauthToken}
                liveChatId={liveChatId} setLiveChatId={setLiveChatId}
                clientId={clientId} setClientId={setClientId}
                clientSecret={clientSecret} setClientSecret={setClientSecret}
                refreshToken={refreshToken} setRefreshToken={setRefreshToken}
                obsHost={obsHost} setObsHost={setObsHost}
                obsPort={obsPort} setObsPort={setObsPort}
                obsPassword={obsPassword} setObsPassword={setObsPassword}
                obsStatus={obsStatus}
                setReconnectTrigger={setReconnectTrigger}
                refreshAccessToken={refreshAccessToken}
                botApiKey={botApiKey} setBotApiKey={setBotApiKey}
                botClientId={botClientId} setBotClientId={setBotClientId}
                botClientSecret={botClientSecret} setBotClientSecret={setBotClientSecret}
                botRefreshToken={botRefreshToken} setBotRefreshToken={setBotRefreshToken}
                botOauthToken={botOauthToken}
                refreshBotAccessToken={refreshBotAccessToken}
                botEnabled={botEnabled} setBotEnabled={setBotEnabled}
                botPromptPath={botPromptPath} setBotPromptPath={setBotPromptPath}
                botCommands={botCommands} setBotCommands={setBotCommands}
                botFilters={botFilters} setBotFilters={setBotFilters}
                messages={streamMessages}
                obsScenes={obsScenes}
                obsSceneItems={obsSceneItems}
                activeProgramScene={activeProgramScene}
                toggleSceneItem={toggleSceneItem}
                fetchSceneItems={fetchSceneItems}
                fetchScreenshot={fetchScreenshot}
                restartActiveCapture={restartActiveCapture}
                obsScreenshot={obsScreenshot}
                isStreaming={isStreaming}
                isRecording={isRecording}
                toggleStreaming={toggleStreaming}
                toggleRecording={toggleRecording}
                sceneMap={sceneMap}
                toggleFullscreen={toggleFullscreen}
                createInput={createInput}
                setInputSettings={setInputSettings}
                getInputSettings={getInputSettings}
                focusInputSettings={focusInputSettings}
                removeSceneItem={removeSceneItem}
                createScene={createScene}
                removeScene={removeScene}
                obsMonitors={obsMonitors}
                fetchMonitors={fetchMonitors}
                availableWindows={availableWindows}
                fetchAvailableWindows={fetchAvailableApplications}
                onModalToggle={setIsModalOpen}
                launchOBS={launchOBS}
                onSendMessage={(text) => {
                    if (chatProcessRef.current && chatProcessRef.current.stdin.writable) {
                        chatProcessRef.current.stdin.write(JSON.stringify({ type: 'send', text, oauthToken }) + '\n');
                    }
                }}
            />

            {/* CONTROL TOWER: Render based on proximity state */}
            <div style={{
                ...STYLES.controlTower,
                opacity: isTowerHovered || showManager ? 1 : 0,
                transform: (isTowerHovered || showManager) ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: (isTowerHovered || showManager) ? 'auto' : 'none',
                display: 'flex',
                gap: '12px',
                zIndex: 10005 // Force to top
            }}>
                {/* 1. RELOAD / EXIT */}
                <button
                    style={STYLES.controlButton}
                    onClick={onReload}
                    title="Reload Tool / Exit Tab"
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                >
                    <dc.Icon icon="rotate-cw" style={{ width: '18px', height: '18px' }} />
                </button>

                {/* 2. HELP / LEGEND */}
                <button
                    style={STYLES.controlButton}
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('toggle-help'));
                    }}
                    title="Keyboard Shortcuts (H)"
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                >
                    <dc.Icon icon="help-circle" style={{ width: '18px', height: '18px' }} />
                </button>

                {/* 3. CHAT TOGGLE */}
                <button
                    style={STYLES.controlButton}
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('toggle-chat'));
                    }}
                    title="Toggle Chat Window (C)"
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                >
                    <dc.Icon icon="message-circle" style={{ width: '18px', height: '18px' }} />
                </button>

                {/* 4. BROADCAST MANAGER */}
                <button
                    style={STYLES.controlButton}
                    onClick={() => setShowManager(!showManager)}
                    title="Toggle Manager (M)"
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                >
                    <dc.Icon icon={showManager ? "chevron-up" : "menu"} style={{ width: '18px', height: '18px' }} />
                </button>
            </div>

            {showManager && (
                <div style={STYLES.managerUI} className="livestream-manager-tool">
                    <div style={STYLES.managerHeader}>
                        <div style={STYLES.managerTitle}>
                            <dc.Icon icon="settings-2" style={{ width: '16px', height: '16px' }} />
                            <span>Broadcast Control</span>
                        </div>
                    </div>

                    <div style={STYLES.managerBody}>
                        <div style={STYLES.managerTabs}>
                            <button style={{ ...STYLES.managerTab, ...(activeTab === 'production' ? STYLES.managerTabActive : {}) }} onClick={() => setActiveTab('production')}>
                                <dc.Icon icon="monitor" style={{ width: '14px' }} /> Production
                            </button>
                            <button style={{ ...STYLES.managerTab, ...(activeTab === 'bot' ? STYLES.managerTabActive : {}) }} onClick={() => setActiveTab('bot')}>
                                <dc.Icon icon="bot" style={{ width: '14px' }} /> Bot
                            </button>
                        </div>

                        {activeTab === 'production' ? (
                            <>
                                {/* YouTube Core Settings */}
                                <div style={{ background: 'rgba(160, 118, 249, 0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(160, 118, 249, 0.1)', marginBottom: '12px' }}>
                                    <div
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showYoutubeSecurity ? '12px' : '0' }}
                                        onClick={() => setShowYoutubeSecurity(!showYoutubeSecurity)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: (liveChatId && oauthToken) ? '#10b981' : '#71717a', boxShadow: (liveChatId && oauthToken) ? '0 0 10px #10b981' : 'none' }} />
                                            <div style={{ fontSize: '10px', fontWeight: '900', color: (liveChatId && oauthToken) ? '#fff' : '#71717a', letterSpacing: '1px' }}>YOUTUBE SETTINGS & AUTH</div>
                                        </div>
                                        <dc.Icon icon={showYoutubeSecurity ? "chevron-up" : "chevron-down"} style={{ width: 14, opacity: 0.5 }} />
                                    </div>

                                    {showYoutubeSecurity && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '8px', color: '#71717a', display: 'block', marginBottom: '4px' }}>VIDEO ID</label>
                                                    <input style={STYLES.controlInput} placeholder="ID" value={videoId} onChange={e => setVideoId(e.target.value)} />
                                                </div>
                                                <div style={{ flex: 1.5 }}>
                                                    <label style={{ fontSize: '8px', color: '#71717a', display: 'block', marginBottom: '4px' }}>API KEY</label>
                                                    <input type="password" style={STYLES.controlInput} placeholder="AIza..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '8px', color: '#71717a', display: 'block', marginBottom: '4px' }}>CLIENT ID</label>
                                                    <input type="password" style={STYLES.controlInput} placeholder="ID" value={clientId} onChange={e => setClientId(e.target.value)} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '8px', color: '#71717a', display: 'block', marginBottom: '4px' }}>CLIENT SECRET</label>
                                                    <input type="password" style={STYLES.controlInput} placeholder="Secret" value={clientSecret} onChange={e => setClientSecret(e.target.value)} />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '8px', color: '#71717a', display: 'block', marginBottom: '4px' }}>REFRESH TOKEN</label>
                                                <input type="password" style={STYLES.controlInput} placeholder="RefreshToken" value={refreshToken} onChange={e => setRefreshToken(e.target.value)} />
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '8px', color: '#71717a', display: 'block', marginBottom: '4px' }}>LIVE CHAT ID</label>
                                                    <input style={STYLES.controlInput} placeholder="Auto or Manual" value={liveChatId} onChange={e => setLiveChatId(e.target.value)} />
                                                </div>
                                                <button onClick={() => setLiveChatId("")} style={{ ...STYLES.controlButton, height: '36px', width: '36px' }} title="Re-fetch Chat ID">
                                                    <dc.Icon icon="refresh-cw" style={{ width: 14 }} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const token = await refreshAccessToken();
                                                        if (token && window._LIVESTREAM_CHAT_WIN && !window._LIVESTREAM_CHAT_WIN.isDestroyed()) {
                                                            window._LIVESTREAM_CHAT_WIN.webContents.send('update-config', { accessToken: token, liveChatId, apiKey });
                                                        }
                                                    }}
                                                    style={{ ...STYLES.controlButton, flex: 1, height: '36px', background: '#a076f922', color: '#a076f9', border: '1px solid #a076f944' }}
                                                >
                                                    AUTHORIZE
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <SceneControls currentScene={currentScene} handleSceneChange={handleSceneChange} scenes={scenes} />
                                <ObsControl
                                    obsStatus={obsStatus}
                                    obsHost={obsHost} setObsHost={setObsHost}
                                    obsPort={obsPort} setObsPort={setObsPort}
                                    obsPassword={obsPassword} setObsPassword={setObsPassword}
                                    isStreaming={isStreaming} toggleStreaming={toggleStreaming}
                                    isRecording={isRecording} toggleRecording={toggleRecording}
                                    sceneMap={sceneMap} setSceneMap={setSceneMap}
                                    obsScenes={obsScenes} currentScene={currentScene}
                                    obsSceneItems={obsSceneItems} toggleSceneItem={toggleSceneItem}
                                    fetchSceneItems={fetchSceneItems}
                                    launchOBS={launchOBS}
                                />
                                <CountdownControl
                                    countdown={countdown} setCountdown={setCountdown}
                                    isPaused={isPaused} setIsPaused={setIsPaused}
                                    addTime={addTime} setPreset={setPreset}
                                />
                            </>
                        ) : (
                            <BotControl
                                botEnabled={botEnabled} setBotEnabled={setBotEnabled}
                                botPromptPath={botPromptPath} setBotPromptPath={setBotPromptPath}
                                botCommands={botCommands} setBotCommands={setBotCommands}
                                botFilters={botFilters} setBotFilters={setBotFilters}
                                botApiKey={botApiKey} setBotApiKey={setBotApiKey}
                                botClientId={botClientId} setBotClientId={setBotClientId}
                                botClientSecret={botClientSecret} setBotClientSecret={setBotClientSecret}
                                botRefreshToken={botRefreshToken} setBotRefreshToken={setBotRefreshToken}
                                botOauthToken={botOauthToken}
                                refreshBotAccessToken={refreshBotAccessToken}
                            />
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .livestream-manager-tool { animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideIn { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>

        </div>
    );
}

return { LiveStreamManager };
