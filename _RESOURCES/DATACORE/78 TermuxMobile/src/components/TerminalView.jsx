const { useState, useEffect } = dc;

// Helper functions for Full Tab mode
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

function TerminalView(props) {
    const [url, setUrl] = useState(localStorage.getItem("termux-url") || "http://127.0.0.1:7681");
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState("");

    // Quick Command State
    const [isCopied, setIsCopied] = useState(null);

    const [DesktopTerminal, setDesktopTerminal] = useState(null);

    const isMobile = dc.app.isMobile;
    const iframeRef = dc.useRef ? dc.useRef(null) : { current: null };
    const containerRef = dc.useRef ? dc.useRef(null) : { current: null };

    // Desktop Loader
    useEffect(() => {
        if (!isMobile) {
            const loadDesktop = async () => {
                try {
                    const dtPath = dc.resolvePath("_RESOURCES/DATACORE/57 DatacoreTerminal/D.q.datacoreterminal.component.md");
                    const mod = await dc.require(dc.headerLink(dtPath, "ViewComponent"));
                    if (mod && mod.View) setDesktopTerminal(() => mod.View);
                } catch (e) {
                    console.error("Desktop Terminal Load Fail", e);
                }
            };
            loadDesktop();
        }
    }, [isMobile]);

    // Refs for cleanup
    const originalParentRef = dc.useRef(null);
    const placeholderRef = dc.useRef(null);

    // Removed manual DOM manipulation logic to fix layout conflicts

    const checkConnection = async (targetUrl) => {
        setDebugInfo(`Checking connection to ${targetUrl}...`);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            await fetch(targetUrl, { mode: 'no-cors', signal: controller.signal });
            clearTimeout(timeoutId);
            setIsConnected(true);
            setError(null);
            setDebugInfo(prev => prev + "\nSuccess!");
        } catch (e) {
            console.warn("[Termux] Connection probe failed:", e);
            setIsConnected(false);
            setError(`Could not connect to ${targetUrl}.`);
            setDebugInfo(prev => prev + `\nFailed: ${e.message}`);

            if (targetUrl.includes("localhost")) {
                const nextUrl = targetUrl.replace("localhost", "127.0.0.1");
                setDebugInfo(prev => prev + `\nTrying fallback to ${nextUrl}...`);
                checkConnection(nextUrl); // Simple recursion
            }
        }
    };

    const focusTerminal = () => {
        if (iframeRef.current) {
            iframeRef.current.focus();
            setDebugInfo(prev => prev + "\nManually requested focus.");
        }
    };

    const copyCommand = (cmd) => {
        navigator.clipboard.writeText(cmd);
        setIsCopied(cmd);
        setTimeout(() => setIsCopied(null), 2000);
        focusTerminal(); // Focus back after copy so they can paste
    };

    useEffect(() => {
        checkConnection(url);
    }, []);

    const handleUrlChange = (newUrl) => {
        setUrl(newUrl);
        localStorage.setItem("termux-url", newUrl);
        checkConnection(newUrl);
    };

    // WebSocket for Remote Control
    const wsRef = dc.useRef(null);
    const [isRemoteReady, setIsRemoteReady] = useState(false);

    // Command Queue System
    const [cmdQueue, setCmdQueue] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeCmdId, setActiveCmdId] = useState(null);

    // Initialize Switchboard (WebSocket)
    const connectSwitchboard = (targetUrl) => {
        if (!targetUrl) return;

        // Convert http(s) to ws(s)
        const wsUrl = targetUrl.replace("http", "ws") + "/ws";

        try {
            if (wsRef.current) wsRef.current.close();

            const ws = new WebSocket(wsUrl, ["ttyd"]);
            ws.binaryType = "arraybuffer";

            ws.onopen = () => {
                console.log("[Termux] Switchboard connected");
                setIsRemoteReady(true);
                // Handshake if needed (usually simple ttyd accepts input immediately)
            };

            ws.onclose = () => {
                setIsRemoteReady(false);
            };

            ws.onerror = (err) => {
                console.warn("[Termux] Switchboard error", err);
                setIsRemoteReady(false);
            };

            wsRef.current = ws;
        } catch (e) {
            console.error("[Termux] Failed to create WebSocket", e);
        }
    };

    // Queue Processor
    useEffect(() => {
        if (isProcessing || cmdQueue.length === 0 || !isRemoteReady) return;

        const processNext = async () => {
            setIsProcessing(true);
            const nextCmd = cmdQueue[0];
            setActiveCmdId(nextCmd.id);

            // Send to WebSocket
            // ttyd protocol: first byte 0 for input
            // We need to send the command string + carriage return
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                const payload = "0" + nextCmd.cmd + "\r";
                // ttyd usually expects text frame or binary with 0 prefix. 
                // Let's try text frame first as it's standard for the 'ttyd' protocol
                wsRef.current.send(payload);
            } else {
                // Fallback to clipboard if WS died
                copyCommand(nextCmd.cmd);
            }

            // Artificial Delay for Visual UX (Simulating "Running")
            // Give it 800ms "run time" so the user sees it happened
            await new Promise(r => setTimeout(r, 800));

            // Done
            setCmdQueue(prev => prev.slice(1));
            setActiveCmdId(null);
            setIsProcessing(false);
        };

        processNext();
    }, [cmdQueue, isProcessing, isRemoteReady]);

    const queueCommand = (cmd, label) => {
        const id = Date.now() + Math.random().toString();

        // Desktop Native Execution
        if (!isMobile && window.startSystemProcess) {
            window.startSystemProcess(cmd);
            setCmdQueue(prev => [...prev, { id, cmd, label }]);
            setTimeout(() => {
                setCmdQueue(prev => prev.filter(q => q.id !== id));
            }, 1000);
            return;
        }

        // Fallback: If not remote ready, Use old copy method
        if (!isRemoteReady) {
            navigator.clipboard.writeText(cmd);
            return;
        }

        setCmdQueue(prev => [...prev, { id, cmd, label }]);
    };

    useEffect(() => {
        if (isMobile) {
            checkConnection(url);
        } else {
            setIsConnected(true);
        }
    }, [isMobile]);

    useEffect(() => {
        if (isConnected && isMobile) {
            connectSwitchboard(url);
        }
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [isConnected, url, isMobile]);

    const handleRetry = () => {
        setDebugInfo("Retrying connection...");
        if (isConnected) {
            // Force reload
            const currentUrl = url;
            setIsConnected(false);
            setTimeout(() => {
                checkConnection(currentUrl);
            }, 100);
        } else {
            checkConnection(url);
        }
    };

    const renderTerminal = () => {
        if (!isMobile && DesktopTerminal) {
            return (
                <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#000" }}>
                    <DesktopTerminal {...props} isFullTab={false} />
                    <style>{`
                        div[style*="background-color: #000000; border-bottom: 1px solid #1A1A1A; display: flex; align-items: center"] {
                            display: none !important;
                        }
                    `}</style>
                </div>
            );
        }
        return (
            <iframe
                ref={iframeRef}
                src={url}
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none"
                }}
                title="Termux Terminal"
            />
        );
    };

    const handleInstall = () => {
        queueCommand("pkg install ttyd tmux -y || brew install ttyd tmux || (sudo apt update && sudo apt install ttyd tmux -y)", "INSTALL");
    };

    const handleUninstall = () => {
        queueCommand("pkg uninstall ttyd tmux -y || brew uninstall ttyd tmux || (sudo apt remove ttyd tmux -y)", "UNINSTALL");
    };

    const quickCommands = [
        { label: "LS", cmd: "ls -la" },
        { label: "GIT STATUS", cmd: "git status" },
        { label: "GIT PULL", cmd: "git pull" },
        { label: "CLEAR", cmd: "clear" },
        { label: "Top", cmd: "top" },
        { label: "EXIT", cmd: "exit" }
    ];

    return (
        <div ref={containerRef} style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#121212",
            color: "#e0e0e0",
            fontFamily: "var(--font-monospace)",
            overflow: "hidden"
        }}>
            {/* Top Padding for Obsidian Buttons */}
            <div style={{ height: "80px", background: "#1e1e1e", borderBottom: "1px solid #333", flexShrink: 0 }} />

            <div style={{
                padding: "8px 16px",
                background: "#1e1e1e",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #333",
                flexShrink: 0
            }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", textShadow: isConnected ? "0 0 10px rgba(76, 175, 80, 0.5)" : "none" }}>
                        🚀 Termux Console
                    </span>
                    <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: isConnected ? "#4caf50" : "#f44336",
                        boxShadow: isConnected ? "0 0 8px #4caf50" : "none",
                        transition: "all 0.3s ease"
                    }} />
                    {isRemoteReady && <span style={{ fontSize: "0.6rem", color: "#4caf50", border: "1px solid #4caf50", padding: "0 4px", borderRadius: "4px" }}>SYNC</span>}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                    {isConnected && (
                        <button
                            onClick={focusTerminal}
                            style={{
                                background: "rgba(76, 175, 80, 0.1)",
                                border: "1px solid #4caf50",
                                color: "#4caf50",
                                borderRadius: "4px",
                                padding: "4px 10px",
                                cursor: "pointer",
                                fontSize: "0.7rem",
                                fontWeight: "bold",
                                backdropFilter: "blur(4px)"
                            }}
                        >
                            ⌨️ Focus
                        </button>
                    )}
                    <button
                        onClick={handleRetry || (() => checkConnection(url))}
                        style={{
                            background: "transparent",
                            border: "1px solid #444",
                            color: "#aaa",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: "0.7rem"
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>

            {!isConnected && (
                <div style={{ padding: "20px", textAlign: "center", flex: 1, overflowY: "auto" }}>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        style={{
                            background: "#000",
                            border: "1px solid #444",
                            color: "#eee",
                            fontSize: "0.9rem",
                            padding: "8px",
                            borderRadius: "4px",
                            width: "80%",
                            marginBottom: "20px"
                        }}
                    />

                    <h4 style={{ color: "#f44336" }}>Terminal Not Reachable</h4>
                    <p style={{ fontSize: "0.8rem", color: "#888" }}>{error}</p>

                    <div style={{ margin: "15px auto", maxWidth: "400px", textAlign: "left", background: "#1e1e1e", padding: "12px", borderRadius: "4px", border: "1px solid #333" }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: "12px", color: "#ff9800" }}>⚠️ SETUP & CONFIG</p>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                            <button onClick={handleInstall} style={{ flex: 1, background: "#4caf50", color: "white", border: "none", padding: "10px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>
                                INSTALL
                            </button>
                            <button onClick={handleUninstall} style={{ flex: 1, background: "transparent", color: "#f44336", border: "1px solid #f44336", padding: "10px", borderRadius: "4px", cursor: "pointer" }}>
                                REMOVE
                            </button>
                        </div>
                        <p style={{ fontSize: "0.7rem", color: "#888" }}>
                            <b>Why tmux?</b> So we can inject magic commands from the button bar while you watch the terminal.
                        </p>
                    </div>

                    <div style={{ textAlign: "left", fontSize: "0.7rem", color: "#666", maxWidth: "400px", margin: "0 auto" }}>
                        <p><b>Diagnostics:</b></p>
                        <pre style={{ background: "#000", padding: "8px", borderRadius: "4px", whiteSpace: "pre-wrap" }}>{debugInfo}</pre>
                    </div>
                </div>
            )}

            {isConnected && (
                <div style={{ flex: 1, position: "relative" }}>
                    {renderTerminal()}

                    {/* Queue Overlay Indicator */}
                    {cmdQueue.length > 0 && (
                        <div style={{
                            position: "absolute",
                            bottom: "20px",
                            right: "20px",
                            background: "rgba(0,0,0,0.8)",
                            color: "#fff",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            fontSize: "0.7rem",
                            backdropFilter: "blur(4px)",
                            border: "1px solid #444",
                            zIndex: 20
                        }}>
                            ⏳ Queue: {cmdQueue.length}
                        </div>
                    )}
                </div>
            )}

            {/* Quick Commands Toolbar */}
            {isConnected && (
                <div style={{
                    padding: "16px",
                    background: "rgba(18, 18, 18, 0.95)",
                    borderTop: "1px solid #333",
                    display: "flex",
                    gap: "12px",
                    overflowX: "auto",
                    whiteSpace: "nowrap",
                    paddingBottom: "111px",
                    backdropFilter: "blur(10px)"
                }}>
                    {!isRemoteReady && (
                        <div style={{ color: "#f44336", fontSize: "0.7rem", padding: "10px", border: "1px dashed #f44336", borderRadius: "6px" }}>
                            ⚠️ No Sync. Install tmux for magic buttons.
                        </div>
                    )}
                    {quickCommands.map((item, idx) => {
                        // Check status in queue
                        const isPending = cmdQueue.some(q => q.label === item.label && q.id !== activeCmdId);
                        const isRunning = activeCmdId && cmdQueue.find(q => q.id === activeCmdId)?.label === item.label;
                        const isDone = false; // Ephemeral state, simpler to just animate active/pending

                        let statusColor = "#4caf50"; // Default nice green
                        let statusText = item.label;
                        let borderColor = "rgba(76, 175, 80, 0.3)";
                        let bg = "rgba(255, 255, 255, 0.05)";

                        if (isRunning) {
                            statusColor = "#00e5ff"; // Cyan for running
                            statusText = "RUNNING...";
                            borderColor = "#00e5ff";
                            bg = "rgba(0, 229, 255, 0.1)";
                        } else if (isPending) {
                            statusColor = "#ff9800"; // Orange for pending
                            statusText = "WAITING...";
                            borderColor = "#ff9800";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => queueCommand(item.cmd, item.label)}
                                disabled={!isRemoteReady}
                                style={{
                                    background: bg,
                                    color: statusColor,
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: "6px",
                                    padding: "12px 16px",
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                    cursor: isRemoteReady ? "pointer" : "not-allowed",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: isRunning
                                        ? `0 0 15px ${statusColor}`
                                        : "0 2px 4px rgba(0,0,0,0.2)",
                                    transform: isRunning ? "scale(0.95)" : "scale(1)",
                                    letterSpacing: "0.5px",
                                    minWidth: "80px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    opacity: isRemoteReady ? 1 : 0.5
                                }}
                            >
                                <span style={{ opacity: 0.7 }}>
                                    {isRunning ? "⚙️" : (isPending ? "⏳" : ">")}
                                </span>
                                {statusText}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

return { TerminalView };
