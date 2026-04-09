/**
 * Termux Mobile - Master Protocol (v2.0.0)
 * Consolidated Beto Group Standard Component
 */
async function View({ folderPath, ...props }, dcOverride) {
    const localDc = dcOverride || (typeof dc !== 'undefined' ? dc : window.dc);
    const { useState, useEffect, useRef } = localDc;

    // --- DOM UTILS (Rule #6 Support) ---
    const domUtils = {
        findNearestAncestorWithClass: (element, className) => {
            if (!element) return null;
            let current = element.parentNode;
            while (current) {
                if (current.classList && current.classList.contains(className)) return current;
                current = current.parentNode;
            }
            return null;
        },
        findDirectChildByClass: (parent, className) => {
            if (!parent) return null;
            for (const child of parent.children) {
                if (child.classList && child.classList.contains(className)) return child;
            }
            return null;
        }
    };

    // --- FULLTAB HOOK (Rule #6) ---
    function useFullTab({ isFullTab, containerRef }) {
        const stateRefs = useRef({}).current;
        const { findNearestAncestorWithClass, findDirectChildByClass } = domUtils;

        useEffect(() => {
            if (!isFullTab) return;
            const container = containerRef.current;
            if (!container) return;

            // Inject Global CSS to hide Obsidian's footer/status bar
            const style = document.createElement("style");
            style.id = "datacore-fulltab-immersion";
            style.innerHTML = `
                .status-bar, .side-dock-ribbon { display: none !important; }
                .workspace-leaf-content[data-type="markdown"] .view-header { display: none !important; }
                .workspace-leaf-content[data-type="markdown"] .view-content { padding: 0 !important; }
            `;
            document.head.appendChild(style);

            const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
            if (!targetPaneContent) return;

            const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
            const currentParent = container.parentNode;
            if (!currentParent) return;

            stateRefs.originalParent = currentParent;
            const placeholder = document.createElement("div");
            placeholder.className = "screen-mode-placeholder";
            placeholder.style.display = "none";

            if (container.nextSibling) {
                currentParent.insertBefore(placeholder, container.nextSibling);
            } else {
                currentParent.appendChild(placeholder);
            }
            stateRefs.placeholder = placeholder;

            stateRefs.parentPositionInfo = {
                element: contentWrapper,
                originalInlinePosition: contentWrapper.style.position,
            };

            if (window.getComputedStyle(contentWrapper).position === 'static') {
                contentWrapper.style.position = "relative";
            }

            contentWrapper.appendChild(container);

            requestAnimationFrame(() => {
                Object.assign(contentWrapper.style, {
                    padding: "0", margin: "0", height: "100%", width: "100%",
                    display: "block", overflow: "hidden", minHeight: "0"
                });
            });

            Object.assign(container.style, {
                position: "absolute", top: "0", left: "0", width: "100%", height: "100%",
                zIndex: "9998", overflow: "hidden", backgroundColor: "#000000",
            });

            return () => {
                if (stateRefs.placeholder?.parentNode) {
                    stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
                } else if (stateRefs.originalParent) {
                    stateRefs.originalParent.appendChild(container);
                }
                if (stateRefs.parentPositionInfo?.element) {
                    const { element, originalInlinePosition } = stateRefs.parentPositionInfo;
                    element.style.position = originalInlinePosition || '';
                }
                container.removeAttribute("style");
                const style = document.getElementById("datacore-fulltab-immersion");
                if (style) style.remove();
            };
        }, [isFullTab]);
    }

    // --- MAIN COMPONENT ---
    function TermuxMobile() {
        const [url, setUrl] = useState(localStorage.getItem("termux-url") || "http://127.0.0.1:7681");
        const [isConnected, setIsConnected] = useState(false);
        const [error, setError] = useState(null);
        const [debugInfo, setDebugInfo] = useState("");
        const [isCopied, setIsCopied] = useState(null);
        const [isSettingsOpen, setIsSettingsOpen] = useState(false);
        const [isFullTab, setIsFullTab] = useState(true);

        const isMobile = localDc.app ? localDc.app.isMobile : false;
        const iframeRef = useRef(null);
        const containerRef = useRef(null);
        const wsRef = useRef(null);

        // System States
        const [isRemoteReady, setIsRemoteReady] = useState(false);
        const [cmdQueue, setCmdQueue] = useState([]);
        const [isProcessing, setIsProcessing] = useState(false);
        const [activeCmdId, setActiveCmdId] = useState(null);

        // Initialize FullTab
        useFullTab({ isFullTab, containerRef });

        const checkConnection = async (targetUrl) => {
            setDebugInfo(`Probing ${targetUrl}...`);
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                await fetch(targetUrl, { mode: 'no-cors', signal: controller.signal });
                clearTimeout(timeoutId);
                setIsConnected(true);
                setError(null);
                setDebugInfo(prev => prev + "\nLink Established.");
            } catch (e) {
                setIsConnected(false);
                setError(`Target unreachable: ${targetUrl}`);
                setDebugInfo(prev => prev + `\nOffline: ${e.message}`);
                
                if (targetUrl.includes("localhost")) {
                    const nextUrl = targetUrl.replace("localhost", "127.0.0.1");
                    checkConnection(nextUrl);
                }
            }
        };

        const connectSwitchboard = (targetUrl) => {
            if (!targetUrl) return;
            const wsUrl = targetUrl.replace("http", "ws") + "/ws";
            
            try {
                if (wsRef.current) wsRef.current.close();
                
                // FIXED: More flexible handshake to fix "No Sync" warning
                const ws = new WebSocket(wsUrl); 
                ws.binaryType = "arraybuffer";

                ws.onopen = () => {
                    console.log("[Termux] Sync Established");
                    setIsRemoteReady(true);
                };
                ws.onclose = () => setIsRemoteReady(false);
                ws.onerror = () => setIsRemoteReady(false);
                wsRef.current = ws;
            } catch (e) {
                console.error("[Termux] WS Failed", e);
            }
        };

        useEffect(() => {
            checkConnection(url);
            return () => wsRef.current?.close();
        }, []);

        useEffect(() => {
            if (isConnected) connectSwitchboard(url);
        }, [isConnected, url]);

        // Command Processor
        useEffect(() => {
            if (isProcessing || cmdQueue.length === 0 || !isRemoteReady) return;

            const processNext = async () => {
                setIsProcessing(true);
                const nextCmd = cmdQueue[0];
                setActiveCmdId(nextCmd.id);

                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    const payload = "0" + nextCmd.cmd + "\r";
                    wsRef.current.send(payload);
                } else {
                    navigator.clipboard.writeText(nextCmd.cmd);
                }

                await new Promise(r => setTimeout(r, 600));
                setCmdQueue(prev => prev.slice(1));
                setActiveCmdId(null);
                setIsProcessing(false);
            };
            processNext();
        }, [cmdQueue, isProcessing, isRemoteReady]);

        const queueCommand = (cmd, label) => {
            const id = Date.now() + Math.random().toString();
            
            if (!isMobile) {
                try {
                    const nodeExec = require('child_process')?.exec;
                    if (nodeExec) {
                        nodeExec(cmd);
                        setIsCopied("EXECUTED");
                        setTimeout(() => setIsCopied(null), 2000);
                        return;
                    }
                } catch (e) {}
            }
            
            if (!isRemoteReady) {
                navigator.clipboard.writeText(cmd);
                setIsCopied("COPIED");
                setTimeout(() => setIsCopied(null), 2000);
                return;
            }

            setCmdQueue(prev => [...prev, { id, cmd, label }]);
        };

        const handleAction = (type) => {
            const startCmd = "/opt/homebrew/bin/ttyd -W -p 7681 tmux new -A -s betoos || /usr/local/bin/ttyd -W -p 7681 tmux new -A -s betoos || ttyd -W -p 7681 tmux new -A -s betoos";
            const installCmd = "/opt/homebrew/bin/brew install ttyd tmux || /usr/local/bin/brew install ttyd tmux || pkg install ttyd tmux -y || (sudo apt update && sudo apt install ttyd tmux -y)";
            const uninstallCmd = "pkg uninstall ttyd tmux -y || brew uninstall ttyd tmux || (sudo apt remove ttyd tmux -y)";

            if (type === 'start') queueCommand(`${startCmd} || (${installCmd} && ${startCmd})`, "SMART_START");
            if (type === 'uninstall') queueCommand(uninstallCmd, "UNINSTALL");
        };

        return (
            <div ref={containerRef} style={{
                height: "100%", display: "flex", flexDirection: "column",
                background: "#000", color: "#00e5ff", fontFamily: "var(--font-monospace)",
                overflow: "hidden", position: "relative"
            }}>
                {/* Header */}
                <div style={{
                    padding: "12px 20px", background: "#0a0a0a", borderBottom: "1px solid #1a1a1a",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0
                }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontWeight: "900", letterSpacing: "1px", textShadow: isConnected ? "0 0 10px #00e5ff" : "none" }}>
                            TERMINAL_OS
                        </span>
                        <div style={{
                            width: "8px", height: "8px", borderRadius: "50%",
                            background: isConnected ? "#00e5ff" : "#f44336",
                            boxShadow: isConnected ? "0 0 10px #00e5ff" : "none"
                        }} />
                        {isRemoteReady && <span style={{ fontSize: "0.6rem", border: "1px solid #00e5ff", padding: "1px 4px", borderRadius: "3px" }}>SYNC_ACTIVE</span>}
                        {isMobile && <span style={{ fontSize: "0.6rem", background: "rgba(255, 255, 255, 0.1)", color: "#aaa", padding: "1px 4px", borderRadius: "3px" }}>MOBILE_PLATFORM</span>}
                    </div>
                    
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} style={{ background: isSettingsOpen ? "#00e5ff" : "transparent", border: "1px solid #333", color: isSettingsOpen ? "#000" : "#666", fontSize: "0.7rem", cursor: "pointer", padding: "4px 8px", borderRadius: "4px" }}>
                            ⚙️ SYSTEM_ZONE
                        </button>
                        <button onClick={() => setIsFullTab(!isFullTab)} style={{ background: "transparent", border: "1px solid #333", color: "#666", fontSize: "0.7rem", cursor: "pointer", padding: "4px 8px", borderRadius: "4px" }}>
                            {isFullTab ? "EXIT_FULL" : "ENTER_FULL"}
                        </button>
                        <button onClick={() => checkConnection(url)} style={{ background: "transparent", border: "1px solid #333", color: "#666", fontSize: "0.7rem", cursor: "pointer", padding: "4px 8px", borderRadius: "4px" }}>
                            RETRY
                        </button>
                    </div>
                </div>

                {/* Main View */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                    {isConnected ? (
                        <iframe src={url} style={{ width: "100%", height: "100%", border: "none" }} />
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px" }}>
                            <div style={{ maxWidth: "500px", width: "100%", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
                                <h2 style={{ margin: "0 0 10px", color: "#f44336" }}>OFFLINE</h2>
                                <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "30px" }}>Terminal service heartbeat failed on {url}</p>
                                
                                <div style={{ background: "#000", padding: "16px", borderRadius: "8px", border: "1px solid #1a1a1a", marginBottom: "24px", textAlign: "left" }}>
                                    <p style={{ fontSize: "0.7rem", fontWeight: "bold", margin: "0 0 10px", color: "#00e5ff" }}>LIFECYCLE_CONTROL</p>
                                    <button 
                                        onClick={() => handleAction('start')}
                                        style={{ width: "100%", background: "#00e5ff", color: "#000", border: "none", padding: "14px", borderRadius: "6px", fontWeight: "900", cursor: "pointer" }}
                                    >
                                        INITIALIZE_TERMINAL_OS
                                    </button>
                                </div>
                                <p style={{ fontSize: "0.6rem", color: "#444" }}>Manual: ttyd -W -p 7681 tmux new -A -s betoos</p>
                            </div>
                        </div>
                    )}

                    {/* System Settings Overlay */}
                    {isSettingsOpen && (
                        <div style={{
                            position: "absolute", top: "0", right: "0", bottom: "0", width: "300px",
                            background: "rgba(10, 10, 10, 0.95)", borderLeft: "1px solid #1a1a1a",
                            zIndex: 1000, padding: "20px", backdropFilter: "blur(20px)",
                            display: "flex", flexDirection: "column", gap: "20px",
                            boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
                        }}>
                            <div>
                                <h3 style={{ fontSize: "0.8rem", margin: "0 0 20px" }}>COMMAND_CENTER</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ fontSize: "0.6rem", opacity: 0.4 }}>NETWORK_CONFIG</div>
                                    <input 
                                        value={url} 
                                        onChange={(e) => setUrl(e.target.value)}
                                        style={{ width: "100%", background: "#111", border: "1px solid #222", color: "#eee", padding: "10px", fontSize: "0.7rem", borderRadius: "4px" }} 
                                    />
                                    
                                    <div style={{ marginTop: "10px", fontSize: "0.6rem", opacity: 0.4 }}>TERMINAL_ACTIONS</div>
                                    <button onClick={() => handleAction('start')} style={{ width: "100%", background: "#00e5ff", color: "#000", border: "none", padding: "10px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}>
                                        RESTART_SERVICE
                                    </button>
                                    <button onClick={() => handleAction('uninstall')} style={{ width: "100%", background: "transparent", border: "1px solid #f44336", color: "#f44336", padding: "10px", borderRadius: "4px", fontSize: "0.7rem", cursor: "pointer" }}>
                                        UNINSTALL_BINARIES
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: "auto", borderTop: "1px solid #222", paddingTop: "20px" }}>
                                <p style={{ fontSize: "0.6rem", color: "#444", lineHeight: "1.4" }}>
                                    <b>PLATFORM:</b> {isMobile ? "Android / Termux" : "Desktop / CLI Bridge"}<br/>
                                    <b>SW_HANDSHAKE:</b> {isRemoteReady ? "SECURE" : "PENDING"}<br/>
                                    <b>VERSION:</b> 2.1.0
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Quick Toolbar */}
                    {isConnected && (
                        <div style={{
                            position: "absolute", bottom: "0", left: "0", right: "0",
                            padding: "16px 20px", background: "rgba(0,0,0,0.9)", borderTop: "1px solid #1a1a1a",
                            display: "flex", gap: "10px", overflowX: "auto", backdropFilter: "blur(10px)",
                            zIndex: 100
                        }}>
                            {!isRemoteReady && (
                                <div style={{ fontSize: "0.7rem", color: "#f44336", alignSelf: "center", marginRight: "20px" }}>
                                    HANDSHAKE_PENDING...
                                </div>
                            )}
                            {[
                                { l: "LS", c: "ls -la" },
                                { l: "STATUS", c: "git status" },
                                { l: "PULL", c: "git pull" },
                                { l: "TOP", c: "top" },
                                { l: "CLEAR", c: "clear" }
                            ].map((cmd, i) => (
                                <button
                                    key={i}
                                    onClick={() => queueCommand(cmd.c, cmd.l)}
                                    disabled={!isRemoteReady}
                                    style={{
                                        background: "rgba(0, 229, 255, 0.05)", color: "#00e5ff",
                                        border: "1px solid rgba(0, 229, 255, 0.2)", borderRadius: "4px",
                                        padding: "8px 16px", fontSize: "0.7rem", fontWeight: "bold",
                                        cursor: isRemoteReady ? "pointer" : "not-allowed",
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    {cmd.l}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Status Toast */}
                    {isCopied && (
                        <div style={{
                            position: "absolute", top: "80px", left: "50%", transform: "translateX(-50%)",
                            background: "#00e5ff", color: "#000", padding: "4px 12px", borderRadius: "20px",
                            fontSize: "0.7rem", fontWeight: "bold", zIndex: 1000
                        }}>
                           {isCopied}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return <TermuxMobile />;
}

return { View };
