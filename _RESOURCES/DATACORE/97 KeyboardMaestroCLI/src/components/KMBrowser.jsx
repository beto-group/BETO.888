/**
 * KMBrowser.jsx
 * Browse tab — shows all Keyboard Maestro groups and macros, live from AppleScript
 */

function KMBrowser({ asUtils, styles, onSelectMacro, refreshKey }) {
    const { useState, useEffect } = dc;
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await asUtils.listMacrosByGroup();
            setGroups(data);
            // Auto-expand first group only on initial load
            if (data.length > 0 && Object.keys(expanded).length === 0) {
                setExpanded({ [data[0].group]: true });
            }
            setLoading(false);
        };
        load();
    }, [refreshKey]);

    const toggleGroup = (groupName) => {
        setExpanded(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const filtered = search.trim()
        ? groups.map(g => ({
            ...g,
            macros: g.macros.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
        })).filter(g => g.macros.length > 0 || g.group.toLowerCase().includes(search.toLowerCase()))
        : groups;

    if (loading) {
        return (
            <div style={{ padding: "20px", color: "#555", textAlign: "center", fontSize: "0.85rem" }}>
                <dc.Icon icon="loader-2" size={22} style={{ display: "block", margin: "0 auto 10px", color: "#8b5cf6", animation: "spin 1s linear infinite" }} />
                Loading from Keyboard Maestro…
            </div>
        );
    }

    if (!filtered.length) {
        return (
            <div style={{ padding: "20px", color: "#555", textAlign: "center", fontSize: "0.85rem" }}>
                <dc.Icon icon="search-x" size={22} style={{ display: "block", margin: "0 auto 10px" }} />
                No macros found.
            </div>
        );
    }

    const [deleting, setDeleting] = useState(null); // Track which macro is in 'confirm delete' state

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Search */}
            <div style={{ padding: "10px 10px 6px" }}>
                <div style={{ position: "relative" }}>
                    <dc.Icon icon="search" size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#555" }} />
                    <input
                        style={{ ...styles.input, width: "100%", boxSizing: "border-box", paddingLeft: "30px", height: "34px", fontSize: "0.82rem", lineHeight: "34px" }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search macros…"
                        onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                        onBlur={e => Object.assign(e.target.style, { ...styles.input, width: "100%", boxSizing: "border-box", paddingLeft: "30px", height: "34px", fontSize: "0.82rem" })}
                    />
                </div>
            </div>

            {/* Tree */}
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 6px 12px" }}>
                {filtered.map((g) => (
                    <div key={g.group} style={{ marginBottom: "4px", opacity: g.enabled ? 1 : 0.6 }}>
                        {/* Group row */}
                        <div
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "7px 10px", cursor: "pointer",
                                borderRadius: "6px",
                                backgroundColor: expanded[g.group] ? "rgba(139,92,246,0.08)" : "transparent",
                                transition: "background 0.15s",
                            }}
                            onClick={() => { toggleGroup(g.group); setDeleting(null); }}
                        >
                            <dc.Icon icon={expanded[g.group] ? "chevron-down" : "chevron-right"} size={13} style={{ color: "#555", flexShrink: 0 }} />
                            <dc.Icon icon="folder" size={13} style={{ color: g.enabled ? "#8b5cf6" : "#444", flexShrink: 0 }} />
                            <span style={{ fontSize: "0.82rem", color: "#ccc", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.group}</span>
                            <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "#444", flexShrink: 0 }}>{g.macros.length}</span>
                            <div
                                style={{
                                    color: g.enabled ? "#8b5cf6" : "#444",
                                    padding: "4px", borderRadius: "4px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer",
                                }}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    setDeleting(null);
                                    const newState = !g.enabled;
                                    await asUtils.setGroupEnabled(g.group, newState);
                                    setGroups(prev => prev.map(item => item.group === g.group ? { ...item, enabled: newState } : item));
                                }}
                            >
                                <dc.Icon icon={g.enabled ? "eye" : "eye-off"} size={13} />
                            </div>
                        </div>

                        {/* Macro list */}
                        {expanded[g.group] && g.macros.map(macroObj => (
                            <div
                                key={macroObj.name}
                                style={{
                                    display: "flex", alignItems: "center", gap: "8px",
                                    padding: "6px 10px 6px 32px",
                                    cursor: "pointer", borderRadius: "6px",
                                    transition: "background 0.15s, opacity 0.2s",
                                    opacity: macroObj.enabled ? 1 : 0.4,
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(139,92,246,0.07)"}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                onClick={() => { onSelectMacro(macroObj.name); setDeleting(null); }}
                            >
                                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                                    <dc.Icon icon="zap" size={12} style={{ color: g.enabled && macroObj.enabled ? "#8b5cf6" : "#444", flexShrink: 0 }} />
                                    <span style={{ fontSize: "0.82rem", color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{macroObj.name}</span>
                                </div>
                                <div style={{ display: "flex", gap: "4px" }}>
                                    <div
                                        style={{
                                            color: macroObj.enabled ? "#8b5cf6" : "#444",
                                            padding: "4px", borderRadius: "4px",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            cursor: "pointer",
                                        }}
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            setDeleting(null);
                                            const newState = !macroObj.enabled;
                                            await asUtils.setMacroEnabled(macroObj.name, newState);
                                            setGroups(prev => prev.map(item => ({
                                                ...item,
                                                macros: item.macros.map(m => m.name === macroObj.name ? { ...m, enabled: newState } : m)
                                            })));
                                        }}
                                        title={macroObj.enabled ? "Disable Macro" : "Enable Macro"}
                                    >
                                        <dc.Icon icon={macroObj.enabled ? "eye" : "eye-off"} size={13} />
                                    </div>
                                    <div
                                        style={{
                                            color: deleting === macroObj.name ? "#ff4444" : "#444",
                                            padding: "4px", borderRadius: "4px",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            cursor: "pointer",
                                            backgroundColor: deleting === macroObj.name ? "rgba(255, 68, 68, 0.1)" : "transparent",
                                            transition: "all 0.2s",
                                        }}
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (deleting === macroObj.name) {
                                                await asUtils.deleteMacro(macroObj.name);
                                                setDeleting(null);
                                                // Local update
                                                setGroups(prev => prev.map(item => ({
                                                    ...item,
                                                    macros: item.macros.filter(m => m.name !== macroObj.name)
                                                })));
                                            } else {
                                                setDeleting(macroObj.name);
                                            }
                                        }}
                                        title={deleting === macroObj.name ? "Confirm Delete" : "Delete Macro"}
                                    >
                                        <dc.Icon icon={deleting === macroObj.name ? "alert-triangle" : "trash-2"} size={13} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

return { KMBrowser };
