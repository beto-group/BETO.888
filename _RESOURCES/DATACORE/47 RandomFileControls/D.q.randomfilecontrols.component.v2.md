

# ViewComponent

```jsx
const { useEffect, useRef, useState, useMemo } = dc;

/* ---------------------- UTILITIES ---------------------- */
function findNearestAncestorWithClass(el, className) { if (!el) return null; let cur = el.parentNode; while (cur) { if (cur.classList && cur.classList.contains(className)) return cur; cur = cur.parentNode; } return null; }
function findDirectChildByClass(parent, className) { if (!parent) return null; for (const ch of parent.children) { if (ch.classList && ch.classList.contains(className)) return ch; } return null; }
const pathJoin = (...segs) => segs.join("/").replace(/\/+/g, "/").replace(/\/$/, "");
const ensureUniquePath = (rawPath) => { const v = dc.app.vault; if (!v.getAbstractFileByPath(rawPath)) return rawPath; const i = rawPath.lastIndexOf("."); const base = i >= 0 ? rawPath.slice(0, i) : rawPath; const ext = i >= 0 ? rawPath.slice(i) : ""; let n = 2; while (v.getAbstractFileByPath(`${base} (${n})${ext}`)) n++; return `${base} (${n})${ext}`; };
const ensureFolder = async (p) => { const v = dc.app.vault; if (!v.getAbstractFileByPath(p)) await v.createFolder(p); };

/* ---------------------- PICKERS & MODALS ---------------------- */
const FilePicker = ({ isOpen, onClose, onSelectFile }) => {
    if (!isOpen) return null;
    const [search, setSearch] = useState("");
    const [all, setAll] = useState([]);
    
    useEffect(() => {
        // --- START: Performance Fix & Debug Timer ---
        console.log("FilePicker: Starting file list retrieval...");
        const startTime = performance.now();

        // NEW, FAST METHOD using Obsidian's native API:
        const files = dc.app.vault.getMarkdownFiles() || [];
        const items = files.map(file => ({
            path: file.path,
            basename: file.basename // TFile objects have a convenient .basename property (name without .md)
        }));
        
        setAll(items);

        const endTime = performance.now();
        const duration = endTime - startTime;
        const message = `[DEBUG] Found ${items.length} files in ${duration.toFixed(2)} ms.`;
        
        console.log(message);
        // Display a notice so you can see the timing in the UI
        new Notice(message, 4000); 
        // --- END: Performance Fix & Debug Timer ---
    }, []);

    const filtered = useMemo(() => { const t = (search || "").toLowerCase(); if (!t) return all; return all.filter(p => p.path.toLowerCase().includes(t) || p.basename.toLowerCase().includes(t)); }, [all, search]);
    const styles = { overlay: { position: 'fixed', inset: 0, background: 'rgba(17,18,20,.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }, modal: { background: 'var(--background-primary)', width: '92%', maxWidth: 720, height: '72%', borderRadius: 14, display: 'flex', flexDirection: 'column' }, head: { padding: '14px 18px', borderBottom: '1px solid var(--background-modifier-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, title: { margin: 0, fontSize: 16 }, btn: { background: 'transparent', border: '1px solid var(--background-modifier-border)', color: 'var(--text-muted)', borderRadius: 8, fontSize: 18, cursor: 'pointer', width: 36, height: 36, display: 'grid', placeItems: 'center' }, input: { width: 'calc(100% - 32px)', margin: 16, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', color: 'var(--text-normal)' }, list: { flex: 1, overflowY: 'auto', padding: '0 12px 12px' }, item: { padding: '10px 12px', cursor: 'pointer', borderRadius: 10, border: '1px solid var(--background-modifier-border)', marginBottom: 8 }, path: { fontSize: 12, color: 'var(--text-muted)' } };
    const resolve = (p) => { const v = dc.app.vault; return (v.getAbstractFileByPath && v.getAbstractFileByPath(p)) || (v.getFileByPath && v.getFileByPath(p)) || null; };
    return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.head}><h3 style={styles.title}>Select a File</h3><button style={styles.btn} onClick={onClose}>✕</button></div>
        <input style={styles.input} placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        <div style={styles.list}>{filtered.map(p => (<div key={p.path} style={styles.item} onClick={() => { const f = resolve(p.path); if (f) onSelectFile(f); else new Notice(`Could not resolve: ${p.path}`); }}>
            <div style={{ fontWeight: 600 }}>{p.basename || p.path}</div><div style={styles.path}>{p.path}</div>
        </div>))}</div></div></div>);
};

const FolderPicker = ({ isOpen, onClose, onSelectFolder, zIndex = 10000 }) => {
    if (!isOpen) return null;
    const [search, setSearch] = useState("");
    const [folders, setFolders] = useState([]);
    useEffect(() => { const root = dc.app.vault.getRoot(); const out = []; const stack = [root]; while (stack.length) { const cur = stack.pop(); out.push(cur); if (cur?.children) for (const ch of cur.children) if (ch?.children) stack.push(ch); } setFolders(out); }, []);
    const filtered = useMemo(() => { const t = search.trim().toLowerCase(); if (!t) return folders; return folders.filter(f => (f.path || "").toLowerCase().includes(t)); }, [folders, search]);
    const styles = {
        overlay: { position: 'fixed', inset: 0, background: 'rgba(17,18,20,.6)', zIndex: zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        modal: { background: 'var(--background-primary)', width: '92%', maxWidth: 720, height: '72%', borderRadius: 14, display: 'flex', flexDirection: 'column' }, head: { padding: '14px 18px', borderBottom: '1px solid var(--background-modifier-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, title: { margin: 0, fontSize: 16 }, btn: { background: 'transparent', border: '1px solid var(--background-modifier-border)', color: 'var(--text-muted)', borderRadius: 8, fontSize: 18, cursor: 'pointer', width: 36, height: 36, display: 'grid', placeItems: 'center' }, input: { width: 'calc(100% - 32px)', margin: 16, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', color: 'var(--text-normal)' }, list: { flex: 1, overflowY: 'auto', padding: '0 12px 12px' }, item: { padding: '10px 12px', cursor: 'pointer', borderRadius: 10, border: '1px solid var(--background-modifier-border)', marginBottom: 8 }, path: { fontSize: 12, color: 'var(--text-muted)' }
    };
    return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.head}><h3 style={styles.title}>Select a Folder</h3><button style={styles.btn} onClick={onClose}>✕</button></div>
        <input style={styles.input} placeholder="Search folders…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        <div style={styles.list}>{filtered.map(f => (<div key={f.path} style={styles.item} onClick={() => onSelectFolder(f)}>
            <div style={{ fontWeight: 600 }}>{f.name || (f.path === "/" ? "Vault Root" : f.path)}</div><div style={styles.path}>{f.path}</div>
        </div>))}</div></div></div>);
};

const MultiSubfolderCompilerModal = ({ isOpen, onClose, baseFolder, onCompile }) => {
    if (!isOpen) return null;
    const [subfolders, setSubfolders] = useState([]);
    const [query, setQuery] = useState("");
    const [currentGroup, setCurrentGroup] = useState(1);
    const [assignments, setAssignments] = useState(new Map()); // Map<path: string, groups: Set<number>>
    const [separateFiles, setSeparateFiles] = useState(false);

    useEffect(() => {
        if (!baseFolder) return;
        const base = baseFolder.path === "/" ? "" : baseFolder.path;
        const list = []; const stack = [baseFolder];
        while (stack.length) {
            const cur = stack.pop();
            if (cur?.children) for (const ch of cur.children) if (ch?.children) {
                stack.push(ch);
                const rel = base ? ch.path.slice(base.length + 1) : ch.path;
                if (rel) list.push({ path: ch.path, relative: rel });
            }
        }
        list.sort((a, b) => a.relative.localeCompare(b.relative));
        setSubfolders(list);
    }, [baseFolder]);

    const filteredSubfolders = useMemo(() => {
        const t = query.trim().toLowerCase();
        if (!t) return subfolders;
        return subfolders.filter(f => f.relative.toLowerCase().includes(t));
    }, [subfolders, query]);

    const styles = {
        overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        modal: { width: 720, maxWidth: '92%', background: 'var(--background-primary)', borderRadius: 12, display: 'flex', flexDirection: 'column' },
        head: { padding: '12px 14px', borderBottom: '1px solid var(--background-modifier-border)', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' },
        list: { padding: 12, maxHeight: 360, overflow: 'auto', display: 'grid', gap: 6 },
        row: { display: 'flex', gap: 8, alignItems: 'center', border: '1px solid var(--background-modifier-border)', borderRadius: 8, padding: '8px 10px' },
        foot: { padding: 12, borderTop: '1px solid var(--background-modifier-border)', display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' },
        btn: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', cursor: 'pointer' },
        searchInput: { flexGrow: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', color: 'var(--text-normal)' },
        groupTicker: { display: 'flex', alignItems: 'center', gap: 4 },
        groupInput: { width: 60, textAlign: 'center', padding: '8px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-primary)' },
        badgeContainer: { display: 'flex', gap: '4px', flexWrap: 'wrap' },
        groupBadge: { fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: 'var(--background-modifier-success)', color: 'var(--text-on-accent)' },
        toggleLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }
    };

    if (!baseFolder) { return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}><div style={styles.head}><strong>Multi-Compile Subfolders</strong></div><div style={{ padding: 20, color: 'var(--text-muted)' }}>Please select a base folder first.</div><div style={styles.foot}><button style={styles.btn} onClick={onClose}>Close</button></div></div></div>); }

    const toggleAssignment = (path) => {
        const next = new Map(assignments);
        const existingGroups = next.get(path) || new Set();
        if (existingGroups.has(currentGroup)) {
            existingGroups.delete(currentGroup);
        } else {
            existingGroups.add(currentGroup);
        }
        if (existingGroups.size === 0) {
            next.delete(path);
        } else {
            next.set(path, existingGroups);
        }
        setAssignments(next);
    };

    const allGroupNumbers = new Set();
    for (const groupSet of assignments.values()) { for (const num of groupSet) allGroupNumbers.add(num); }
    const numGroups = allGroupNumbers.size;
    const numFolders = assignments.size;

    const compileButtonText = separateFiles
        ? `Compile ${numFolders} folder(s) into ${numFolders} separate file(s)`
        : `Compile ${numFolders} folder(s) into ${numGroups} group(s)`;

    return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.head}>
            <input style={styles.searchInput} placeholder="Search to filter subfolders..." value={query} onChange={e => setQuery(e.target.value)} />
            <div style={styles.groupTicker}><label>Group #</label><input style={styles.groupInput} type="number" min="1" value={currentGroup} onChange={e => setCurrentGroup(Math.max(1, parseInt(e.target.value) || 1))} disabled={separateFiles} /></div>
        </div>
        <div style={styles.list}>
            {filteredSubfolders.map(f => {
                const assignedGroups = assignments.get(f.path);
                const isInCurrentGroup = assignedGroups?.has(currentGroup);
                return (<label key={f.path} style={styles.row}>
                    <input type="checkbox" checked={isInCurrentGroup} onChange={() => toggleAssignment(f.path)} />
                    <span style={{ flexGrow: 1 }}>{f.relative}</span>
                    {assignedGroups && assignedGroups.size > 0 && <div style={styles.badgeContainer}>
                        {[...assignedGroups].sort((a, b) => a - b).map(g => (<span key={g} style={styles.groupBadge}>G{g}</span>))}
                    </div>}
                </label>)
            })}
            {filteredSubfolders.length === 0 && <div style={{ padding: 12, color: 'var(--text-muted)' }}>No matching subfolders found.</div>}
        </div>
        <div style={styles.foot}>
            <label style={styles.toggleLabel}>
                <input type="checkbox" checked={separateFiles} onChange={e => setSeparateFiles(e.target.checked)} />
                Compile each folder separately
            </label>
            <button style={styles.btn} onClick={() => { onCompile(assignments, separateFiles); onClose(); }} disabled={numFolders === 0}>
                {compileButtonText}
            </button>
        </div>
    </div></div>);
};

const ListSubfoldersModal = ({ isOpen, onClose, folderName, subfolders }) => {
    if (!isOpen) return null;
    const [copied, setCopied] = useState(false);
    const listText = subfolders.join("\n");

    const handleCopy = async () => {
        if (!listText) return;
        await navigator.clipboard.writeText(listText);
        setCopied(true);
        new Notice("List copied to clipboard!", 2000);
        setTimeout(() => setCopied(false), 2000);
    };

    const styles = {
        overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        modal: { width: 500, maxWidth: '90%', background: 'var(--background-primary)', borderRadius: 12, display: 'flex', flexDirection: 'column' },
        head: { padding: '12px 14px', borderBottom: '1px solid var(--background-modifier-border)' },
        content: { padding: 16, maxHeight: 400, overflow: 'auto', fontFamily: 'ui-monospace', fontSize: 14, whiteSpace: 'pre-wrap', color: 'var(--text-normal)' },
        foot: { padding: 12, borderTop: '1px solid var(--background-modifier-border)', display: 'flex', gap: 8, justifyContent: 'flex-end' },
        btn: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', cursor: 'pointer' }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.head}><strong>Subfolders in `{folderName}`</strong></div>
                <div style={styles.content}>
                    {listText || <span style={{ color: 'var(--text-muted)' }}>No subfolders found.</span>}
                </div>
                <div style={styles.foot}>
                    <button style={styles.btn} onClick={handleCopy} disabled={!listText}>{copied ? "Copied!" : "Copy List"}</button>
                    <button style={styles.btn} onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

// MODIFIED: Switched to JSON input
const FormattedListCompilerModal = ({ isOpen, onClose, onCompile, baseFolder, onSelectFolder }) => {
    if (!isOpen) return null;
    const [inputText, setInputText] = useState("");
    const placeholderText = `{\n  "CATEGORY NAME 1": [\n    "FileName1",\n    "FileName2"\n  ],\n  "CATEGORY NAME 2": [\n    "AnotherFile"\n  ]\n}`;

    const styles = {
        overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        modal: { width: 600, maxWidth: '90%', background: 'var(--background-primary)', borderRadius: 12, display: 'flex', flexDirection: 'column' },
        head: { padding: '12px 14px', borderBottom: '1px solid var(--background-modifier-border)' },
        content: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
        textarea: { minHeight: 250, maxHeight: 400, resize: 'vertical', padding: '10px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', color: 'var(--text-normal)', fontFamily: 'ui-monospace' },
        foot: { padding: 12, borderTop: '1px solid var(--background-modifier-border)', display: 'flex', gap: 8, justifyContent: 'flex-end' },
        btn: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', cursor: 'pointer' },
        folderSelector: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--background-secondary)', borderRadius: 8 },
        folderPath: { fontSize: 13, fontFamily: 'ui-monospace', color: 'var(--text-muted)' }
    };

    const handleCompile = () => {
        let parsedJson;
        try {
            parsedJson = JSON.parse(inputText);
            if (typeof parsedJson !== 'object' || parsedJson === null) throw new Error("Input is not a valid JSON object.");
        } catch (e) {
            new Notice(`Invalid JSON: ${e.message}`, 4000);
            return;
        }
        onCompile(parsedJson, baseFolder);
        onClose();
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.head}><strong>Compile from JSON</strong></div>
                <div style={styles.content}>
                    <div style={styles.folderSelector}>
                        <span style={styles.folderPath}>Searching in: <strong>{baseFolder ? baseFolder.path : "Entire Vault"}</strong></span>
                        <button style={{ ...styles.btn, padding: '6px 10px' }} onClick={onSelectFolder}>Select Folder</button>
                    </div>
                    <textarea
                        style={styles.textarea}
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder={placeholderText}
                        autoFocus
                    />
                </div>
                <div style={styles.foot}>
                    <button style={styles.btn} onClick={handleCompile}>Compile</button>
                    <button style={styles.btn} onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};


/* ---------------------- MAIN COMPONENT ---------------------- */
function BasicView() {
    const STYLES = {
        wrap: { position: 'relative', height: "100%", width: "100%", padding: 12, display: "flex", flexDirection: "column", gap: 12, background: 'linear-gradient(180deg,var(--background-secondary),var(--background-primary))', border: '1px solid var(--background-modifier-border)', borderRadius: 14, color: 'var(--text-normal)' },
        bar: { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10, padding: "8px 10px", background: 'var(--background-primary)', borderRadius: 12, border: '1px solid var(--background-modifier-border)' },
        left: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
        iconBtn: { background: 'var(--background-secondary)', border: '1px solid var(--background-modifier-border)', color: 'var(--text-normal)', borderRadius: 10, cursor: 'pointer', padding: 8, width: 36, height: 36, display: 'grid', placeItems: 'center', fontSize: 16 },
        fileName: { fontFamily: 'ui-monospace', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '6px 8px', background: 'var(--background-secondary)', borderRadius: 8, border: '1px solid var(--background-modifier-border)', minWidth: 0, flex: 1 },
        content: { flexGrow: 1, position: 'relative', overflow: 'hidden', background: 'var(--background-primary)', borderRadius: 12, border: '1px solid var(--background-modifier-border)' },
        editor: { position: 'absolute', inset: 0, padding: 16, border: 'none', resize: 'none', background: 'transparent', color: 'var(--text-normal)', fontFamily: 'ui-monospace', fontSize: 14, lineHeight: 1.55, outline: 'none' },
        pre: { margin: 0, padding: 16, height: '100%', overflow: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'ui-monospace', fontSize: 14, lineHeight: 1.55 },
        compact: { padding: 16, display: "flex", flexDirection: "column", gap: 12, border: "1px dashed var(--background-modifier-border)", borderRadius: 14, background: 'linear-gradient(180deg,var(--background-primary-alt),var(--background-primary))' },
        mini: { maxHeight: 220, overflow: 'auto', padding: 12, borderRadius: 10, border: '1px solid var(--background-modifier-border)', background: 'var(--background-primary)', fontFamily: 'ui-monospace', fontSize: 13, lineHeight: 1.5 },
        row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
        log: { margin: 0, padding: 16, height: '100%', overflow: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'ui-monospace', fontSize: 13, lineHeight: 1.6, background: 'var(--background-secondary)' },
        debugToggle: { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 12, color: 'var(--text-muted)' },
        logFooter: { padding: '10px 16px', borderTop: '1px solid var(--background-modifier-border)' },
        retryBtn: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-primary)', cursor: 'pointer', color: 'var(--text-normal)' }
    };

    const [isFull, setFull] = useState(false);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;
    const [file, setFile] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [edited, setEdited] = useState("");
    const [editing, setEditing] = useState(false);
    const [status, setStatus] = useState("idle");
    const [fpOpen, setFpOpen] = useState(false);
    const [fldOpen, setFldOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [multiCompileOpen, setMultiCompileOpen] = useState(false);
    const [baseFolder, setBaseFolder] = useState(null);
    const [listFoldersModalOpen, setListFoldersModalOpen] = useState(false);
    const [folderPickerForListOpen, setFolderPickerForListOpen] = useState(false);
    const [subfolderList, setSubfolderList] = useState([]);
    const [targetFolderName, setTargetFolderName] = useState("");
    const [listCompilerOpen, setListCompilerOpen] = useState(false);
    const [listCompilerBaseFolder, setListCompilerBaseFolder] = useState(null);
    const [folderPickerForListCompilerOpen, setFolderPickerForListCompilerOpen] = useState(false);
    const [svgDeletePickerOpen, setSvgDeletePickerOpen] = useState(false);
    const [isDebugMode, setDebugMode] = useState(false);
    const [logMessages, setLogMessages] = useState([]);
    const logContainerRef = useRef(null);
    const [failedFiles, setFailedFiles] = useState([]);

    useEffect(() => {
        const el = containerRef.current; if (!el) return;
        if (isFull) { if (!el.parentNode) { setTimeout(() => setFull(true), 50); return; } const leaf = findNearestAncestorWithClass(el, 'workspace-leaf-content'); if (!leaf) { setFull(false); return; } const wrapper = findDirectChildByClass(leaf, 'view-content') || leaf; stateRefs.originalParent = el.parentNode; stateRefs.placeholder = document.createElement('div'); el.parentNode.insertBefore(stateRefs.placeholder, el); const pos = window.getComputedStyle(wrapper).position; stateRefs.parentPosition = { element: wrapper, original: wrapper.style.position }; if (pos === 'static') wrapper.style.position = 'relative'; wrapper.appendChild(el); Object.assign(el.style, { position: 'absolute', top: 0, left: 0, width: "100%", height: "100%", zIndex: 9998, overflow: "auto" }); }
        return () => { if (!stateRefs.originalParent) return; if (stateRefs.placeholder?.parentNode) stateRefs.placeholder.parentNode.replaceChild(el, stateRefs.placeholder); else stateRefs.originalParent.appendChild(el); if (stateRefs.parentPosition?.element) stateRefs.parentPosition.element.style.position = stateRefs.parentPosition.original || ''; el.removeAttribute("style"); Object.keys(stateRefs).forEach(k => stateRefs[k] = null); };
    }, [isFull]);

    useEffect(() => { if (logContainerRef.current) { logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight; } }, [logMessages]);

    const loadFile = async (f) => { if (!f) { new Notice("No file specified.", 2500); return false; } setLogMessages([]); setFailedFiles([]); setStatus("loading"); try { setFile(f); const content = await dc.app.vault.cachedRead(f); setFileContent(content); setEdited(content); setStatus("loaded"); setEditing(false); return true; } catch (e) { setFileContent(`Error loading file:\n${e.message}`); setStatus("error"); return false; } };
    const enterFull = async () => { const host = dc.app.workspace.getActiveFile(); const ok = await loadFile(host); if (ok) setFull(true); else new Notice("Failed to load the host file to enter full screen.", 4000); };
    const exitFull = (e) => { e.stopPropagation(); setEditing(false); setFull(false); setStatus("idle"); };
    const save = async () => { if (!file) return; setStatus("saving"); try { await dc.app.vault.modify(file, edited); setFileContent(edited); setEditing(false); setStatus("loaded"); new Notice(`Saved "${file.basename}".`); } catch (e) { setStatus("loaded"); new Notice(`Save failed: ${e.message}`, 5000); } };
    const openInPane = async () => { const t = file || dc.app.workspace.getActiveFile(); if (!t) return; await dc.app.workspace.getLeaf(false).openFile(t); };
    const copyToClipboard = async () => { const txt = editing ? edited : fileContent; if (!txt) return; await navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 1200); };
    const compileSingleFolder = async (folder) => { if (!folder?.path) { new Notice("No folder selected."); return; } setFldOpen(false); setLogMessages([]); setFailedFiles([]); setStatus("compiling"); try { const allFiles = []; const stack = [folder]; while (stack.length) { const cur = stack.pop(); if (cur?.children) for (const ch of cur.children) ch?.children ? stack.push(ch) : allFiles.push(ch); } if (allFiles.length === 0) { new Notice("No files to compile in this folder."); setStatus("idle"); return; } const partsArr = []; for (const f of allFiles) { try { const c = await dc.app.vault.cachedRead(f); partsArr.push(`## ${f.path}\n\n${c}\n`); } catch (e) { partsArr.push(`## ${f.path}\n\n> [Skipped: ${e.message}]\n`); } } const body = partsArr.join("\n---\n"); const ts = new Date().toISOString().replace(/[:.]/g, "-"); const safeName = (folder.name || "root").replace(/[\\/:*?"<>|]/g, "-"); const outDir = (folder.path === "/" ? "" : folder.path) ? pathJoin(folder.path, "_compiled") : "_compiled"; await ensureFolder(outDir); const outPath = ensureUniquePath(pathJoin(outDir, `compiled-${safeName}-${ts}.md`)); const created = await dc.app.vault.create(outPath, `# Compiled from ${folder.path}\n\n${body}`); new Notice(`Successfully compiled into ${created.path}`); const ok = await loadFile(created); if (ok && !isFull) setFull(true); } catch (e) { new Notice(`Compile failed: ${e.message}`); } finally { if (status !== 'loaded') setStatus("idle"); } };
    const compileMultipleSubfolders = async (groupAssignments, compileSeparately) => { if (!groupAssignments || groupAssignments.size === 0) { new Notice("No subfolders were selected for grouping."); return; } setLogMessages([]); setFailedFiles([]); setStatus("compiling"); const v = dc.app.vault; let createdCount = 0; const outDir = baseFolder.path === "/" ? "_compiled" : pathJoin(baseFolder.path, "_compiled"); await ensureFolder(outDir); if (compileSeparately) { const selectedFolders = [...groupAssignments.keys()]; for (const folderPath of selectedFolders) { const folder = v.getAbstractFileByPath(folderPath); if (!folder || !folder.children) continue; const allFiles = []; const stack = [folder]; while (stack.length) { const cur = stack.pop(); if (cur?.children) for (const ch of cur.children) ch?.children ? stack.push(ch) : allFiles.push(ch); } if (allFiles.length === 0) continue; const partsArr = []; for (const f of allFiles) { try { const c = await v.cachedRead(f); partsArr.push(`## ${f.path}\n\n${c}\n`); } catch (e) { /* skip */ } } if (partsArr.length === 0) continue; const body = partsArr.join("\n---\n"); const safeName = folder.name.replace(/[\\/:*?"<>|]/g, "-"); const outPath = ensureUniquePath(pathJoin(outDir, `compiled-${safeName}.md`)); await v.create(outPath, `# Compiled from ${folder.path}\n\n${body}`); createdCount++; } } else { const groups = new Map(); for (const [folderPath, groupSet] of groupAssignments.entries()) { for (const groupNum of groupSet) { if (!groups.has(groupNum)) groups.set(groupNum, []); groups.get(groupNum).push(folderPath); } } for (const [groupNum, folderPaths] of groups.entries()) { const partsArr = []; for (const folderPath of folderPaths) { const folder = v.getAbstractFileByPath(folderPath); if (!folder || !folder.children) continue; const allFiles = []; const stack = [folder]; while (stack.length) { const cur = stack.pop(); if (cur?.children) for (const ch of cur.children) ch?.children ? stack.push(ch) : allFiles.push(ch); } for (const f of allFiles) { try { const c = await v.cachedRead(f); partsArr.push(`## ${f.path}\n\n${c}\n`); } catch (e) {/* skip */} } } if (partsArr.length === 0) continue; const body = partsArr.join("\n---\n"); const outPath = ensureUniquePath(pathJoin(outDir, `compiled-group-${groupNum}.md`)); await v.create(outPath, `# Compiled from Group ${groupNum}\n\n${body}`); createdCount++; } } new Notice(`Finished: Created ${createdCount} compiled file(s).`); setStatus("idle"); };
    const openMultiCompile = () => { const activeFile = dc.app.workspace.getActiveFile(); const base = activeFile ? activeFile.parent : dc.app.vault.getRoot(); setBaseFolder(base); setMultiCompileOpen(true); };
    const generateSubfolderList = (parentFolder) => { if (!parentFolder?.children) { new Notice("Not a valid folder or it has no contents.", 3000); return; } const folderNames = []; for (const child of parentFolder.children) { if (child.children) { folderNames.push(child.name); } } folderNames.sort((a, b) => a.localeCompare(b)); setTargetFolderName(parentFolder.name || "Vault Root"); setSubfolderList(folderNames); setListFoldersModalOpen(true); };
    const compileFromFormattedList = async (categories, baseFolder) => { setLogMessages([]); setFailedFiles([]); setStatus("compiling"); const v = dc.app.vault; let createdCount = 0; const getAllFilesInFolder = (folder) => { const files = []; const stack = [folder]; while (stack.length) { const current = stack.pop(); if (current.children) { for (const child of current.children) { if (child.children) stack.push(child); else if (child.path.toLowerCase().endsWith('.md')) files.push(child); } } } return files; }; const filesToSearch = baseFolder ? getAllFilesInFolder(baseFolder) : v.getMarkdownFiles(); const findFileByName = (name) => { const exactMatch = filesToSearch.find(f => f.basename === name); if (exactMatch) return exactMatch; const lowerName = name.toLowerCase(); const pathMatch = filesToSearch.find(f => f.path.toLowerCase().includes(lowerName)); return pathMatch || null; }; const outDir = baseFolder && baseFolder.path !== "/" ? pathJoin(baseFolder.path, "_compiled") : "_compiled"; await ensureFolder(outDir); for (const categoryName in categories) { const entries = categories[categoryName]; if (!Array.isArray(entries) || entries.length === 0) continue; const partsArr = []; for (const entryName of entries) { const file = findFileByName(entryName); if (file) { try { const content = await v.cachedRead(file); partsArr.push(`## ${file.path}\n\n${content}\n`); } catch (e) { partsArr.push(`## ${entryName}\n\n> [Skipped: Could not read file: ${file.path}]\n`); } } else { partsArr.push(`## ${entryName}\n\n> [Skipped: File not found in scope]\n`); } } const body = partsArr.join("\n---\n"); const safeName = categoryName.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, '_'); const outPath = ensureUniquePath(pathJoin(outDir, `compiled-category-${safeName}.md`)); await v.create(outPath, `# Compiled Category: ${categoryName}\n\n${body}`); createdCount++; } new Notice(`Finished: Created ${createdCount} compiled file(s) from JSON.`); setStatus("idle"); };
    
    const runBatchDelete = async (filesToDelete, attemptType = "Initial") => {
        const deletionPromises = filesToDelete.map(file => dc.app.vault.delete(file).then(() => ({ status: 'fulfilled', file })).catch(error => ({ status: 'rejected', file, reason: error })));
        const results = await Promise.all(deletionPromises);
        
        const successes = [];
        const failures = [];
        const reportLogs = [];

        results.forEach(result => {
            if (result.status === 'fulfilled') { successes.push(result.file); reportLogs.push(`  [OK] Deleted: ${result.file.path}`); } 
            else { failures.push(result.file); reportLogs.push(`  [ERROR] FAILED to delete ${result.file.path}: ${result.reason.message}`); }
        });

        // MODIFIED: More accurate logging
        const summaryLog = [
            `[INFO] --- ${attemptType} Deletion Requests Sent ---`,
            `[INFO] Summary: ${successes.length} successful requests, ${failures.length} failed requests.`
        ];
        
        setLogMessages(prev => [...prev, ...reportLogs, ...summaryLog]);
        setFailedFiles(failures);
        
        let noticeMessage = `${successes.length} deletion requests sent.`;
        if (failures.length > 0) { noticeMessage += ` ${failures.length} failed.`; }
        new Notice(noticeMessage, 4000);
    };

    const retryDeletions = async () => {
        if (failedFiles.length === 0) { new Notice("No failed files to retry."); return; }
        setLogMessages(prev => [...prev, `\n[INFO] --- Retrying ${failedFiles.length} failed files... ---`]);
        await runBatchDelete(failedFiles, "Retry");
    };
    
    const deleteSvgsInFolder = async (folder) => {
        if (!folder?.path) { return; }
        setSvgDeletePickerOpen(false);
        setLogMessages([]);
        setFailedFiles([]);
        setStatus("deleting");

        setLogMessages([`[INFO] Starting SVG deletion process in folder: "${folder.path}"`, `[INFO] Scanning for .svg files...`]);

        const svgFilesToDelete = [];
        const stack = [folder];
        while (stack.length) { const cur = stack.pop(); if (cur?.children) { for (const child of cur.children) { if (child.children) stack.push(child); else if (child.path.toLowerCase().endsWith('.svg')) svgFilesToDelete.push(child); } } }
        
        setLogMessages(prev => [...prev, `[INFO] Scan complete. Found ${svgFilesToDelete.length} .svg file(s).`]);
        
        if (svgFilesToDelete.length === 0) { new Notice(`No .svg files found in "${folder.name}".`); setStatus("idle"); return; }

        const confirmed = window.confirm(`Are you sure you want to permanently delete ${svgFilesToDelete.length} .svg file(s) from "${folder.path}"?\n\nThis action cannot be undone.`);

        if (!confirmed) { setLogMessages(prev => [...prev, "[WARN] Operation cancelled by user."]); setStatus("idle"); return; }

        await runBatchDelete(svgFilesToDelete, "Initial");
        
        // NEW: The crucial fix for OS and UI lag
        setLogMessages(prev => [...prev, "\n[INFO] Giving the file system a moment to catch up..."]);
        
        setTimeout(() => {
            try {
                if (dc.app.fileManager.requestUpdate) {
                    dc.app.fileManager.requestUpdate();
                    setLogMessages(prev => [...prev, "[INFO] File explorer refresh requested. Deletion should now be visible."]);
                }
            } catch (e) {
                console.error("Could not request file manager update:", e);
                setLogMessages(prev => [...prev, "[WARN] Could not automatically refresh file explorer."]);
            }
            
            setLogMessages(prev => [
                ...prev,
                "\n[DEBUG ADVICE] If files consistently fail or the UI is slow to update:",
                "  - Ensure no other program (like an image editor) has the file open.",
                "  - Check if a file sync service (iCloud, Dropbox) is locking the file.",
                "  - Clicking 'Retry Failed' can resolve temporary locks."
            ]);
        }, 2000); // 2-second grace period
    };

    return (
        <div ref={containerRef}>
            <FilePicker isOpen={fpOpen} onClose={() => setFpOpen(false)} onSelectFile={async f => { setFpOpen(false); await loadFile(f); }} />
            <FolderPicker isOpen={fldOpen} onClose={() => setFldOpen(false)} onSelectFolder={compileSingleFolder} />
            <MultiSubfolderCompilerModal isOpen={multiCompileOpen} onClose={() => setMultiCompileOpen(false)} baseFolder={baseFolder} onCompile={compileMultipleSubfolders} />
            <FolderPicker isOpen={folderPickerForListOpen} onClose={() => setFolderPickerForListOpen(false)} onSelectFolder={(folder) => { setFolderPickerForListOpen(false); generateSubfolderList(folder); }} />
            <ListSubfoldersModal isOpen={listFoldersModalOpen} onClose={() => setListFoldersModalOpen(false)} subfolders={subfolderList} folderName={targetFolderName} />
            <FolderPicker isOpen={folderPickerForListCompilerOpen} onClose={() => setFolderPickerForListCompilerOpen(false)} onSelectFolder={(folder) => { setListCompilerBaseFolder(folder); setFolderPickerForListCompilerOpen(false); }} zIndex={10002}/>
            <FormattedListCompilerModal isOpen={listCompilerOpen} onClose={() => setListCompilerOpen(false)} onCompile={compileFromFormattedList} baseFolder={listCompilerBaseFolder} onSelectFolder={() => setFolderPickerForListCompilerOpen(true)}/>
            <FolderPicker isOpen={svgDeletePickerOpen} onClose={() => setSvgDeletePickerOpen(false)} onSelectFolder={deleteSvgsInFolder} />

            {isFull ? (
                <div style={STYLES.wrap}>
                    <div style={STYLES.bar}>
                        <div style={STYLES.left}>
                            <button style={STYLES.iconBtn} title="Choose File to View" onClick={() => setFpOpen(true)}>📄</button>
                            <button style={STYLES.iconBtn} title="Compile Single Folder" onClick={() => setFldOpen(true)}>🗂️</button>
                            <button style={STYLES.iconBtn} title="Compile Multiple Subfolders" onClick={openMultiCompile}>🗂️+</button>
                            <button style={STYLES.iconBtn} title="List Subfolders" onClick={() => setFolderPickerForListOpen(true)}>📂➡️📋</button>
                            <button style={STYLES.iconBtn} title="Compile from JSON" onClick={() => { setListCompilerBaseFolder(null); setListCompilerOpen(true); }}>{`{...}`}</button>
                            <button style={STYLES.iconBtn} title="Delete SVG Files in Folder" onClick={() => setSvgDeletePickerOpen(true)}>🗑️</button>
                            <div style={STYLES.fileName} title={file ? file.path : 'No file selected'}>{file ? file.path : "No file selected"}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <label style={STYLES.debugToggle} title="Toggle Debug Mode"> <input type="checkbox" checked={isDebugMode} onChange={e => setDebugMode(e.target.checked)} /> 🐞 </label>
                            {!editing && <button style={STYLES.iconBtn} title="Edit" onClick={() => setEditing(true)}>✏️</button>}
                            {editing && (<><button style={STYLES.iconBtn} title="Cancel" onClick={() => { setEditing(false); setEdited(fileContent); }}>↩️</button><button style={STYLES.iconBtn} title="Save" onClick={save}>💾</button></>)}
                            <button style={STYLES.iconBtn} title="Open In New Pane" onClick={openInPane}>📂</button>
                            <button style={STYLES.iconBtn} title={copied ? "Copied" : "Copy Content"} onClick={copyToClipboard}>{copied ? "✅" : "📋"}</button>
                            <button style={{ ...STYLES.iconBtn }} title="Exit Full View" onClick={exitFull}>⤬</button>
                        </div>
                    </div>
                    
                    <div style={{...STYLES.content, display: 'flex', flexDirection: 'column'}}>
                        {status === 'loading' && <p style={STYLES.pre}>Loading…</p>}
                        {status === 'compiling' && <p style={STYLES.pre}>Compiling…</p>}
                        {status === 'deleting' ? ( <pre ref={logContainerRef} style={{...STYLES.log, flex: 1, borderBottom: failedFiles.length > 0 ? '1px solid var(--background-modifier-border)' : 'none'}}> {logMessages.join('\n')} </pre>
                        ) : status === 'error' ? ( <pre style={{ ...STYLES.pre, color: 'var(--text-error)' }}>{fileContent}</pre>
                        ) : status === 'loaded' && (editing ? <textarea style={STYLES.editor} value={edited} onChange={e => setEdited(e.target.value)} onKeyDown={e => { if (e.ctrlKey && e.key === 's') { e.preventDefault(); save(); } }} /> : <pre style={STYLES.pre}>{fileContent}</pre>)}
                        
                        {status === 'deleting' && failedFiles.length > 0 && (
                            <div style={STYLES.logFooter}>
                                <button style={STYLES.retryBtn} onClick={retryDeletions}> Retry {failedFiles.length} Failed File(s) </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={STYLES.compact}>
                    <div style={STYLES.row}>
                        <button style={STYLES.iconBtn} title="Enter Full View" onClick={enterFull}>⤢</button>
                        <button style={STYLES.iconBtn} title="Choose File to View" onClick={() => setFpOpen(true)}>📄</button>
                        <button style={STYLES.iconBtn} title="Compile Single Folder" onClick={() => setFldOpen(true)}>🗂️</button>
                        <button style={STYLES.iconBtn} title="Compile Multiple Subfolders" onClick={openMultiCompile}>🗂️+</button>
                        <button style={STYLES.iconBtn} title="List Subfolders" onClick={() => setFolderPickerForListOpen(true)}>📂➡️📋</button>
                        <button style={STYLES.iconBtn} title="Compile from JSON" onClick={() => { setListCompilerBaseFolder(null); setListCompilerOpen(true); }}>{`{...}`}</button>
                        <button style={STYLES.iconBtn} title="Delete SVG Files in Folder" onClick={() => setSvgDeletePickerOpen(true)}>🗑️</button>
                        <label style={STYLES.debugToggle} title="Toggle Debug Mode"> <input type="checkbox" checked={isDebugMode} onChange={e => setDebugMode(e.target.checked)} /> Debug </label>
                    </div>
                    <div style={STYLES.mini}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{file ? file.path : 'No file selected'}</div>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{fileContent ? fileContent.slice(0, 4000) : 'Pick a file or compile a folder to see results here.'}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}

return { BasicView };
```


