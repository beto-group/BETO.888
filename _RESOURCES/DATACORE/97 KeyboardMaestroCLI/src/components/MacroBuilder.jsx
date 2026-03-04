/**
 * MacroBuilder.jsx
 * The "Create" tab UI — builds and submits new macros to Keyboard Maestro via AppleScript
 */

function MacroBuilder({ asUtils, styles, addLog, onCreated }) {
    const { useState, useEffect } = dc;

    const [macroName, setMacroName] = useState("");
    const [groupName, setGroupName] = useState("");
    const [startEnabled, setStartEnabled] = useState(true);
    const [groups, setGroups] = useState([]);

    // Trigger
    const [triggerType, setTriggerType] = useState("hotkey");
    const [triggerKey, setTriggerKey] = useState("k");
    const [triggerCmd, setTriggerCmd] = useState(true);
    const [triggerShift, setTriggerShift] = useState(false);
    const [triggerOpt, setTriggerOpt] = useState(false);
    const [triggerCtrl, setTriggerCtrl] = useState(false);
    const [triggerScheme, setTriggerScheme] = useState("myapp");
    const [triggerTime, setTriggerTime] = useState("2:00 PM");

    // Action
    const [actionType, setActionType] = useState("shell");
    const [actionScript, setActionScript] = useState("echo 'Hello from KM!'");
    const [actionKeystroke, setActionKeystroke] = useState("Hello");
    const [actionMessage, setActionMessage] = useState("Macro triggered!");
    const [actionFilePath, setActionFilePath] = useState("~/Desktop");

    // Load groups on mount
    useEffect(() => {
        const load = async () => {
            const g = await asUtils.listMacroGroups();
            setGroups(g);
            if (g.length > 0) setGroupName(g[0]);
        };
        load();
    }, []);

    const handleCreate = async () => {
        if (!macroName || !groupName) {
            addLog("Error: Macro Name and Group are required.", "error");
            return;
        }

        const trigger = {
            type: triggerType,
            key: triggerKey,
            cmd: triggerCmd, shift: triggerShift, opt: triggerOpt, ctrl: triggerCtrl,
            scheme: triggerScheme,
            time: triggerTime,
        };

        const action = {
            type: actionType,
            script: actionScript,
            keystroke: actionKeystroke,
            message: actionMessage,
            filePath: actionFilePath,
        };

        addLog(`Creating macro "${macroName}" in group "${groupName}"...`);
        const result = await asUtils.createMacro({ macroName, groupName, trigger, action, enabled: startEnabled });

        if (result.success) {
            addLog(`Created! "${macroName}" is now in Keyboard Maestro.`, "success");
            setMacroName("");
            if (onCreated) onCreated(macroName);
        } else {
            addLog(`Failed: ${result.error}`, "error");
        }
    };

    const S = {
        section: { marginBottom: "18px" },
        row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
        label: { ...styles.label, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" },
        input: { ...styles.input, width: "100%", boxSizing: "border-box" },
        select: {
            ...styles.select,
            width: "100%", boxSizing: "border-box",
        },
        option: {
            ...styles.option,
        },
        textarea: {
            ...styles.input,
            width: "100%", boxSizing: "border-box",
            minHeight: "80px", resize: "vertical",
            fontFamily: "monospace", fontSize: "0.85rem",
        },
        modRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
        modChk: { ...styles.checkboxItem, fontSize: "0.8rem" },
        divider: { borderTop: "1px solid rgba(139,92,246,0.08)", margin: "14px 0" },
        sectionTitle: {
            fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase",
            color: "#8b5cf6", letterSpacing: "1px", marginBottom: "12px",
            display: "flex", alignItems: "center", gap: "6px",
        },
    };

    return (
        <div style={{ padding: "16px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Identity */}
            <div style={S.section}>
                <div style={S.sectionTitle}><dc.Icon icon="tag" size={12} /> Identity</div>
                <div style={S.row}>
                    <div>
                        <label style={S.label}><dc.Icon icon="type" size={12} /> Name</label>
                        <input style={S.input} value={macroName} onChange={e => setMacroName(e.target.value)}
                            onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                            onBlur={e => Object.assign(e.target.style, styles.input)}
                            placeholder="My New Macro" />
                    </div>
                    <div>
                        <label style={S.label}><dc.Icon icon="folder" size={12} /> Group</label>
                        {groups.length > 0 ? (
                            <select style={S.select} value={groupName} onChange={e => setGroupName(e.target.value)}>
                                {groups.map(g => <option key={g} value={g} style={S.option}>{g}</option>)}
                                <option value="__custom__" style={S.option}>Custom…</option>
                            </select>
                        ) : (
                            <input style={S.input} value={groupName} onChange={e => setGroupName(e.target.value)}
                                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                                onBlur={e => Object.assign(e.target.style, styles.input)}
                                placeholder="Global Macro Group" />
                        )}
                    </div>
                </div>
                <div style={{ marginTop: "12px" }}>
                    <label style={S.modChk}>
                        <input type="checkbox" checked={startEnabled} onChange={e => setStartEnabled(e.target.checked)} />
                        Start Enabled
                    </label>
                </div>
            </div>

            <div style={S.divider} />

            {/* Trigger */}
            <div style={S.section}>
                <div style={S.sectionTitle}><dc.Icon icon="zap" size={12} /> Trigger</div>
                <div style={{ marginBottom: "10px" }}>
                    <label style={S.label}><dc.Icon icon="list" size={12} /> Type</label>
                    <select style={S.select} value={triggerType} onChange={e => setTriggerType(e.target.value)}>
                        <option value="hotkey" style={S.option}>Hot Key</option>
                        <option value="url" style={S.option}>URL Scheme</option>
                        <option value="time" style={S.option}>One-Time (Time)</option>
                        <option value="none" style={S.option}>No Trigger</option>
                    </select>
                </div>

                {triggerType === "hotkey" && (
                    <>
                        <div style={{ marginBottom: "8px" }}>
                            <label style={S.label}><dc.Icon icon="keyboard" size={12} /> Key</label>
                            <input style={{ ...S.input, width: "80px" }} value={triggerKey}
                                onChange={e => setTriggerKey(e.target.value)} maxLength={1} />
                        </div>
                        <div style={S.modRow}>
                            {[["⌘ Command", triggerCmd, setTriggerCmd], ["⇧ Shift", triggerShift, setTriggerShift],
                            ["⌥ Option", triggerOpt, setTriggerOpt], ["⌃ Control", triggerCtrl, setTriggerCtrl]].map(([label, val, set]) => (
                                <label key={label} style={S.modChk}>
                                    <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </>
                )}

                {triggerType === "url" && (
                    <div>
                        <label style={S.label}><dc.Icon icon="link" size={12} /> URL Scheme</label>
                        <input style={S.input} value={triggerScheme} onChange={e => setTriggerScheme(e.target.value)}
                            onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                            onBlur={e => Object.assign(e.target.style, styles.input)}
                            placeholder="myapp" />
                        <div style={{ fontSize: "0.73rem", color: "#555", marginTop: "4px" }}>
                            Triggers when <span style={{ color: "#8b5cf6" }}>{triggerScheme}://</span> is opened
                        </div>
                    </div>
                )}

                {triggerType === "time" && (
                    <div>
                        <label style={S.label}><dc.Icon icon="clock" size={12} /> Time</label>
                        <input style={S.input} value={triggerTime} onChange={e => setTriggerTime(e.target.value)}
                            onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                            onBlur={e => Object.assign(e.target.style, styles.input)}
                            placeholder="2:00 PM" />
                    </div>
                )}
            </div>

            <div style={S.divider} />

            {/* Action */}
            <div style={S.section}>
                <div style={S.sectionTitle}><dc.Icon icon="play-circle" size={12} /> Action</div>
                <div style={{ marginBottom: "10px" }}>
                    <label style={S.label}><dc.Icon icon="list" size={12} /> Type</label>
                    <select style={S.select} value={actionType} onChange={e => setActionType(e.target.value)}>
                        <option value="shell" style={S.option}>Run Shell Script</option>
                        <option value="applescript" style={S.option}>Run AppleScript</option>
                        <option value="keystroke" style={S.option}>Type Keystroke</option>
                        <option value="notification" style={S.option}>Show Notification</option>
                        <option value="openfile" style={S.option}>Open File / Path</option>
                    </select>
                </div>

                {(actionType === "shell" || actionType === "applescript") && (
                    <div>
                        <label style={S.label}><dc.Icon icon="code" size={12} /> Script</label>
                        <textarea style={S.textarea} value={actionScript}
                            onChange={e => setActionScript(e.target.value)}
                            onFocus={e => Object.assign(e.target.style, { ...S.textarea, borderColor: "#8b5cf6" })}
                            onBlur={e => Object.assign(e.target.style, S.textarea)}
                        />
                    </div>
                )}

                {actionType === "keystroke" && (
                    <div>
                        <label style={S.label}><dc.Icon icon="keyboard" size={12} /> Keystrokes</label>
                        <input style={S.input} value={actionKeystroke}
                            onChange={e => setActionKeystroke(e.target.value)}
                            onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                            onBlur={e => Object.assign(e.target.style, styles.input)}
                            placeholder="Hello World" />
                    </div>
                )}

                {actionType === "notification" && (
                    <div>
                        <label style={S.label}><dc.Icon icon="bell" size={12} /> Message</label>
                        <input style={S.input} value={actionMessage}
                            onChange={e => setActionMessage(e.target.value)}
                            onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                            onBlur={e => Object.assign(e.target.style, styles.input)}
                            placeholder="Macro triggered!" />
                    </div>
                )}

                {actionType === "openfile" && (
                    <div>
                        <label style={S.label}><dc.Icon icon="folder-open" size={12} /> File Path</label>
                        <input style={S.input} value={actionFilePath}
                            onChange={e => setActionFilePath(e.target.value)}
                            onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                            onBlur={e => Object.assign(e.target.style, styles.input)}
                            placeholder="~/Desktop/file.txt" />
                    </div>
                )}
            </div>

            {/* Create Button */}
            <button
                style={{ ...styles.executeButton, gridColumn: "unset", marginTop: "auto" }}
                onClick={handleCreate}
                onMouseEnter={e => Object.assign(e.target.style, styles.executeButtonHover)}
                onMouseLeave={e => Object.assign(e.target.style, styles.executeButton)}
            >
                <dc.Icon icon="plus-circle" size={18} />
                Create Macro in Keyboard Maestro
            </button>
        </div>
    );
}

return { MacroBuilder };
