/**
 * MacroControl.jsx
 * Keyboard Maestro CLI with persistent favorites, Library tab, and purple dc.Icon theme
 */

function copyToClipboard(text) {
    try {
        require('electron').clipboard.writeText(text);
        return true;
    } catch (e) {
        // Fallback: DOM approach
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        return true;
    }
}

const LIBRARY = [
    {
        category: "Basics",
        entries: [
            {
                title: "Trigger by Name",
                example: 'keyboardmaestro "My Macro"',
                description: "Trigger a macro by its unique name.",
                macro: "My Macro", parameter: "", isAsync: false,
            },
            {
                title: "Trigger by UUID",
                example: 'keyboardmaestro "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"',
                description: "Trigger a macro using its UUID.",
                macro: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX", parameter: "", isAsync: false,
            },
        ],
    },
    {
        category: "Flags",
        entries: [
            {
                title: "Pass Parameter (-p)",
                example: 'keyboardmaestro "My Macro" -p "Hello World"',
                description: "Pass a value as %TriggerValue% to the macro.",
                macro: "My Macro", parameter: "Hello World", isAsync: false,
            },
            {
                title: "Run Async (-a)",
                example: 'keyboardmaestro -a "Long Macro"',
                description: "Don't wait for the macro to finish.",
                macro: "Long Macro", parameter: "", isAsync: true,
            },
            {
                title: "Verbose (-v)",
                example: 'keyboardmaestro -v "My Macro"',
                description: "Show debugging information during execution.",
                macro: "My Macro", parameter: "", isAsync: false,
            },
        ],
    },
    {
        category: "Edit Mode",
        entries: [
            {
                title: "Edit Macro (-e)",
                example: 'keyboardmaestro -e "My Macro"',
                description: "Open a macro for editing in Keyboard Maestro.",
                macro: "My Macro", parameter: "", isAsync: false,
            },
            {
                title: "Edit Group (-e)",
                example: 'keyboardmaestro -e "Utilities"',
                description: "Open a macro group in Keyboard Maestro editor.",
                macro: "Utilities", parameter: "", isAsync: false,
            },
        ],
    },
    {
        category: "XML Actions",
        entries: [
            {
                title: "Execute XML Action",
                example: "keyboardmaestro '<dict><key>MacroActionType</key>...'",
                description: "Trigger an inline XML action directly from the CLI.",
                macro: "", parameter: "", isAsync: false,
            },
        ],
    },
];

function MacroControl({ kmUtils, asUtils, MacroBuilder, KMBrowser, storageUtils, folderPath, styles, ControlsMenu, onToggleFullTab, isFullTab, onCodeReloadRequest }) {
    const { useState, useEffect, useRef } = dc;

    const [activeTab, setActiveTab] = useState("favorites"); // "favorites" | "library" | "create"
    const [macro, setMacro] = useState("");
    const [parameter, setParameter] = useState("");
    const [isAsync, setIsAsync] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [logs, setLogs] = useState([
        { type: 'info', text: 'KM-CLI initialized. System online.' }
    ]);
    const [macroEnabled, setMacroEnabledLocal] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const terminalRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            const config = await storageUtils.loadConfig(folderPath);
            if (config.favorites && config.favorites.length > 0) {
                setFavorites(config.favorites);
                addLog(`Loaded ${config.favorites.length} favorites.`, "info");
            } else {
                addLog("No favorites yet. Trigger a macro and click 'Save Favorite'.", "info");
            }
        };
        init();
    }, []);

    useEffect(() => {
        const checkEnabled = async () => {
            if (macro && macro.length > 2) {
                const en = await asUtils.getMacroEnabled(macro);
                setMacroEnabledLocal(en);
            }
        };
        const timer = setTimeout(checkEnabled, 500);
        return () => clearTimeout(timer);
    }, [macro]);

    const addLog = (text, type = 'info') => {
        setLogs(prev => [...prev.slice(-49), { type, text }]);
    };

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    const loadEntry = (entry) => {
        setMacro(entry.macro || "");
        setParameter(entry.parameter || "");
        setIsAsync(entry.isAsync || false);
        addLog(`Loaded: ${entry.title}`, "info");
    };

    const handleExecute = async (overrideParams = null) => {
        const m = overrideParams ? overrideParams.macro : macro;
        const p = overrideParams ? overrideParams.parameter : parameter;
        const a = overrideParams ? overrideParams.isAsync : isAsync;

        if (!m) {
            addLog("Error: Macro name or UUID is required.", "error");
            return;
        }

        addLog(`Triggering: ${m}...`);
        const result = await kmUtils.executeKMCommand({ macro: m, parameter: p, isAsync: a });

        if (result.success) {
            addLog(`Success: ${result.output}`, "success");
        } else {
            addLog(`Failure: ${result.error}`, "error");
        }
    };

    const handleSaveFavorite = async () => {
        if (!macro) return;
        const newFav = {
            name: macro.length > 20 ? macro.substring(0, 17) + "..." : macro,
            macro, parameter, isAsync
        };
        const updatedFavs = [...favorites, newFav];
        setFavorites(updatedFavs);
        await storageUtils.saveConfig(folderPath, { favorites: updatedFavs });
        addLog(`Saved favorite: ${macro}`, "success");
        setActiveTab("favorites");
    };

    const handleRemoveFavorite = async (e, index) => {
        e.stopPropagation();
        const updatedFavs = favorites.filter((_, i) => i !== index);
        setFavorites(updatedFavs);
        await storageUtils.saveConfig(folderPath, { favorites: updatedFavs });
    };

    const tabBtn = (id, icon, label) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                flex: 1,
                padding: "10px 0",
                backgroundColor: activeTab === id ? "rgba(139,92,246,0.15)" : "transparent",
                border: "none",
                borderBottom: activeTab === id ? "2px solid #8b5cf6" : "2px solid transparent",
                color: activeTab === id ? "#8b5cf6" : "#555",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "0.8rem",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.2s",
            }}
        >
            <dc.Icon icon={icon} size={14} />
            {label}
        </button>
    );

    return (
        <div style={styles.fullTabWrapper}>
            <header style={styles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <dc.Icon icon="command" size={20} style={{ color: "#8b5cf6" }} />
                    <h1 style={styles.title}>Keyboard Maestro CLI</h1>
                </div>
                <div style={styles.controlsContainer}>
                    <ControlsMenu
                        onReload={onCodeReloadRequest}
                        onToggleFullTab={onToggleFullTab}
                        isFullTab={isFullTab}
                        styles={styles}
                    />
                </div>
            </header>

            <main style={styles.mainContent}>
                {/* ===== LEFT SIDEBAR ===== */}
                <aside style={styles.sidebar}>
                    {/* Tab Bar */}
                    <div style={{ display: "flex", borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
                        {tabBtn("favorites", "star", "Favs")}
                        {tabBtn("library", "book-open", "Lib")}
                        {tabBtn("browse", "layout-list", "Browse")}
                        {tabBtn("create", "plus-circle", "New")}
                    </div>

                    {activeTab === "favorites" && (
                        <div style={styles.favoriteList}>
                            {favorites.length === 0 ? (
                                <div style={{ padding: "16px", color: "#444", fontSize: "0.8rem", textAlign: "center" }}>
                                    <dc.Icon icon="bookmark-x" size={28} style={{ marginBottom: "8px", display: "block", margin: "0 auto 8px" }} />
                                    No favorites yet.
                                </div>
                            ) : favorites.map((fav, i) => (
                                <div
                                    key={i}
                                    style={styles.favoriteItem}
                                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.favoriteItemHover)}
                                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.favoriteItem)}
                                >
                                    <div style={{ ...styles.favoriteName, flex: 1, cursor: "pointer" }} onClick={() => handleExecute(fav)}>
                                        <dc.Icon icon="zap" size={13} style={{ color: "#8b5cf6", flexShrink: 0 }} />
                                        {fav.name}
                                    </div>
                                    <div style={{ display: "flex", gap: "4px" }}>
                                        <button
                                            style={{ ...styles.removeBtn, color: "#8b5cf6" }}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const en = await asUtils.getMacroEnabled(fav.macro);
                                                await asUtils.setMacroEnabled(fav.macro, !en);
                                                setRefreshKey(prev => prev + 1);
                                                addLog(`${!en ? 'Enabled' : 'Disabled'} favorite: ${fav.name}`, "info");
                                            }}
                                            title="Toggle Enable/Disable"
                                        >
                                            <dc.Icon icon="power" size={13} />
                                        </button>
                                        <button
                                            style={styles.removeBtn}
                                            onClick={(e) => handleRemoveFavorite(e, i)}
                                            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.removeBtnHover)}
                                            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.removeBtn)}
                                        >
                                            <dc.Icon icon="trash-2" size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "library" && (
                        <div style={{ ...styles.favoriteList, padding: "12px 8px" }}>
                            {LIBRARY.map((cat) => (
                                <div key={cat.category} style={{ marginBottom: "16px" }}>
                                    <div style={{
                                        fontSize: "0.7rem",
                                        fontWeight: "700",
                                        textTransform: "uppercase",
                                        color: "#8b5cf6",
                                        letterSpacing: "1px",
                                        padding: "4px 10px 8px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }}>
                                        <dc.Icon icon="folder" size={12} />
                                        {cat.category}
                                    </div>
                                    {cat.entries.map((entry, ei) => (
                                        <div
                                            key={ei}
                                            style={styles.favoriteItem}
                                            onClick={() => loadEntry(entry)}
                                            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.favoriteItemHover)}
                                            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.favoriteItem)}
                                            title={entry.description}
                                        >
                                            <div style={{ ...styles.favoriteName, flexDirection: "column", alignItems: "flex-start", gap: "3px" }}>
                                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <dc.Icon icon="terminal" size={12} style={{ color: "#8b5cf6", flexShrink: 0 }} />
                                                    {entry.title}
                                                </span>
                                                <span style={{ fontSize: "0.7rem", color: "#555", marginLeft: "18px" }}>{entry.description}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "browse" && (
                        <KMBrowser
                            asUtils={asUtils}
                            styles={styles}
                            onSelectMacro={(macroName) => {
                                setMacro(macroName);
                                addLog(`Loaded from browser: ${macroName}`, "info");
                            }}
                            refreshKey={refreshKey}
                        />
                    )}

                    {activeTab === "create" && (
                        <MacroBuilder
                            asUtils={asUtils}
                            styles={styles}
                            addLog={addLog}
                            onCreated={(name) => {
                                setRefreshKey(prev => prev + 1);
                                setMacro(name);
                                setActiveTab("browse");
                            }}
                        />
                    )}
                </aside>

                {/* ===== CONTROL PANEL ===== */}
                <div style={styles.controlPanel}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            <dc.Icon icon="type" size={14} />
                            Macro Name or UUID
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                style={{ ...styles.input, width: "100%", paddingRight: "40px" }}
                                value={macro}
                                onChange={(e) => setMacro(e.target.value)}
                                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                                onBlur={(e) => Object.assign(e.target.style, styles.input)}
                                placeholder="e.g. Daily Note"
                            />
                            <div
                                style={{
                                    position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                                    cursor: "pointer", color: macroEnabled ? "#8b5cf6" : "#444",
                                    transition: "color 0.2s", opacity: macro ? 1 : 0.3
                                }}
                                onClick={async () => {
                                    if (!macro) return;
                                    const newState = !macroEnabled;
                                    await asUtils.setMacroEnabled(macro, newState);
                                    setMacroEnabledLocal(newState);
                                    setRefreshKey(prev => prev + 1);
                                    addLog(`${newState ? 'Enabled' : 'Disabled'} macro: ${macro}`, "info");
                                }}
                                title={macroEnabled ? "Macro is ENABLED" : "Macro is DISABLED"}
                            >
                                <dc.Icon icon={macroEnabled ? "power" : "power-off"} size={16} />
                            </div>
                        </div>
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            <dc.Icon icon="settings-2" size={14} />
                            Parameter (-p)
                        </label>
                        <input
                            style={styles.input}
                            value={parameter}
                            onChange={(e) => setParameter(e.target.value)}
                            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                            onBlur={(e) => Object.assign(e.target.style, styles.input)}
                            placeholder="Optional parameters..."
                        />
                    </div>

                    <div style={styles.checkboxGroup}>
                        <label style={styles.checkboxItem}>
                            <input type="checkbox" checked={isAsync} onChange={(e) => setIsAsync(e.target.checked)} />
                            Async (-a)
                        </label>
                        <button style={styles.saveButton} onClick={handleSaveFavorite}>
                            <dc.Icon icon="plus" size={14} />
                            Save Favorite
                        </button>
                    </div>

                    <button
                        style={styles.executeButton}
                        onClick={() => handleExecute()}
                        onMouseEnter={(e) => Object.assign(e.target.style, styles.executeButtonHover)}
                        onMouseLeave={(e) => Object.assign(e.target.style, styles.executeButton)}
                    >
                        <dc.Icon icon="play" size={18} />
                        Execute Macro
                    </button>
                </div>

                {/* ===== TERMINAL LOG ===== */}
                <div style={{ ...styles.terminal, display: 'flex', flexDirection: 'column', padding: 0 }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 14px', borderBottom: '1px solid rgba(139,92,246,0.08)',
                        backgroundColor: '#0a0a0a',
                    }}>
                        <span style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <dc.Icon icon="terminal" size={12} />
                            Log
                        </span>
                        <button
                            style={{ background: 'none', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '4px', color: '#8b5cf6', cursor: 'pointer', padding: '3px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}
                            onClick={() => {
                                const text = logs.map(l => `> ${l.text}`).join('\n');
                                copyToClipboard(text);
                            }}
                            title="Copy all logs"
                        >
                            <dc.Icon icon="copy" size={12} />
                            Copy
                        </button>
                    </div>
                    <div ref={terminalRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
                        {logs.map((log, i) => (
                            <div key={i} style={styles.terminalLine}>
                                <span style={styles.prompt}>❯</span>
                                <span style={styles[log.type]}>{log.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

return { MacroControl };
