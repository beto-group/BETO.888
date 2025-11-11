

# ViewComponent

```jsx
const { useEffect, useRef, useState, useMemo } = dc;

/* ---------------------- UTILITIES ---------------------- */
function findNearestAncestorWithClass(el, className) { if (!el) return null; let cur = el.parentNode; while (cur) { if (cur.classList && cur.classList.contains(className)) return cur; cur = cur.parentNode; } return null; }
function findDirectChildByClass(parent, className) { if (!parent) return null; for (const ch of parent.children) { if (ch.classList && ch.classList.contains(className)) return ch; } return null; }
const pathJoin = (...segs) => segs.join("/").replace(/\/+/g, "/").replace(/\/$/, "");
const ensureUniquePath = (rawPath) => { const v = dc.app.vault; if (!v.getAbstractFileByPath(rawPath)) return rawPath; const i = rawPath.lastIndexOf("."); const base = i >= 0 ? rawPath.slice(0, i) : rawPath; const ext = i >= 0 ? rawPath.slice(i) : ""; let n = 2; while (v.getAbstractFileByPath(`${base} (${n})${ext}`)) n++; return `${base} (${n})${ext}`; };
const ensureFolder = async (p) => { const v = dc.app.vault; if (!v.getAbstractFileByPath(p)) await v.createFolder(p); };
const sanitizeFileName = (name) => name.replace(/[\\:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();

// Enhanced utilities for better functionality
const getFileMetadata = (file) => {
    const stat = file?.stat || {};
    return {
        size: stat.size || 0,
        created: stat.ctime || 0,
        modified: stat.mtime || 0,
        sizeKB: ((stat.size || 0) / 1024).toFixed(2),
        createdDate: stat.ctime ? new Date(stat.ctime).toLocaleDateString() : "Unknown",
        modifiedDate: stat.mtime ? new Date(stat.mtime).toLocaleDateString() : "Unknown"
    };
};

const getAllFilesInFolder = (folder, options = {}) => {
    const { recursive = true, extensions = null, minSize = 0, maxSize = Infinity, modifiedAfter = null, modifiedBefore = null } = options;
    const files = [];
    const stack = [folder];
    while (stack.length) {
        const cur = stack.pop();
        if (cur?.children) {
            for (const ch of cur.children) {
                if (ch?.children) {
                    if (recursive) stack.push(ch);
                } else {
                    // Apply filters
                    if (extensions && !extensions.includes((ch.extension || "").toLowerCase())) continue;
                    const meta = getFileMetadata(ch);
                    if (meta.size < minSize || meta.size > maxSize) continue;
                    if (modifiedAfter && meta.modified < modifiedAfter) continue;
                    if (modifiedBefore && meta.modified > modifiedBefore) continue;
                    files.push(ch);
                }
            }
        }
    }
    return files;
};

const batchRenameFiles = async (files, renameFunction) => {
    const results = { success: [], failed: [] };
    for (const file of files) {
        try {
            const newName = renameFunction(file);
            if (newName && newName !== file.name) {
                const newPath = file.parent ? pathJoin(file.parent.path, newName) : newName;
                await dc.app.vault.rename(file, newPath);
                results.success.push({ old: file.path, new: newPath });
            }
        } catch (e) {
            results.failed.push({ file: file.path, error: e.message });
        }
    }
    return results;
};

const batchMoveFiles = async (files, targetFolder) => {
    const results = { success: [], failed: [] };
    for (const file of files) {
        try {
            const newPath = pathJoin(targetFolder.path, file.name);
            await dc.app.vault.rename(file, newPath);
            results.success.push({ old: file.path, new: newPath });
        } catch (e) {
            results.failed.push({ file: file.path, error: e.message });
        }
    }
    return results;
};

/* ---------------------- PICKERS & MODALS ---------------------- */
const FilePicker = ({ isOpen, onClose, onSelectFile, multiSelect = false, showPreview = false }) => {
    if (!isOpen) return null;
    const [search, setSearch] = useState("");
    const [all, setAll] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [previewFile, setPreviewFile] = useState(null);
    const [previewContent, setPreviewContent] = useState("");
    
    useEffect(() => {
        const files = dc.app.vault.getMarkdownFiles() || [];
        const items = files.map(file => ({
            path: file.path,
            basename: file.basename,
            file: file,
            ...getFileMetadata(file)
        }));
        setAll(items);
    }, []);

    useEffect(() => {
        if (showPreview && previewFile) {
            dc.app.vault.cachedRead(previewFile.file).then(content => {
                setPreviewContent(content.slice(0, 2000)); // First 2000 chars
            }).catch(() => setPreviewContent("Error loading preview"));
        }
    }, [previewFile, showPreview]);

    const filtered = useMemo(() => { 
        const t = (search || "").toLowerCase(); 
        if (!t) return all; 
        return all.filter(p => p.path.toLowerCase().includes(t) || p.basename.toLowerCase().includes(t)); 
    }, [all, search]);
    
    const styles = { 
        overlay: { position: 'fixed', inset: 0, background: 'rgba(17,18,20,.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }, 
        modal: { background: 'var(--background-primary)', width: '92%', maxWidth: showPreview ? 1200 : 720, height: '72%', borderRadius: 14, display: 'flex', flexDirection: showPreview ? 'row' : 'column' }, 
        leftPanel: { flex: showPreview ? '1 1 60%' : 1, display: 'flex', flexDirection: 'column', borderRight: showPreview ? '1px solid var(--background-modifier-border)' : 'none' },
        rightPanel: { flex: '1 1 40%', display: 'flex', flexDirection: 'column', padding: 12, overflow: 'auto' },
        head: { padding: '14px 18px', borderBottom: '1px solid var(--background-modifier-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, 
        title: { margin: 0, fontSize: 16 }, 
        btn: { background: 'transparent', border: '1px solid var(--background-modifier-border)', color: 'var(--text-muted)', borderRadius: 8, fontSize: 18, cursor: 'pointer', width: 36, height: 36, display: 'grid', placeItems: 'center' }, 
        input: { width: 'calc(100% - 32px)', margin: 16, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', color: 'var(--text-normal)' }, 
        list: { flex: 1, overflowY: 'auto', padding: '0 12px 12px' }, 
        item: { padding: '10px 12px', cursor: 'pointer', borderRadius: 10, border: '1px solid var(--background-modifier-border)', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }, 
        path: { fontSize: 12, color: 'var(--text-muted)' },
        meta: { fontSize: 11, color: 'var(--text-faint)', marginTop: 4 },
        footer: { padding: '10px 18px', borderTop: '1px solid var(--background-modifier-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        preview: { fontFamily: 'ui-monospace', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.4 }
    };
    
    const resolve = (p) => { const v = dc.app.vault; return (v.getAbstractFileByPath && v.getAbstractFileByPath(p)) || (v.getFileByPath && v.getFileByPath(p)) || null; };
    
    const handleSelect = (item) => {
        if (multiSelect) {
            const newSelected = new Set(selected);
            if (newSelected.has(item.path)) {
                newSelected.delete(item.path);
            } else {
                newSelected.add(item.path);
            }
            setSelected(newSelected);
        } else {
            const f = resolve(item.path);
            if (f) onSelectFile(f);
            else new Notice(`Could not resolve: ${item.path}`);
        }
    };

    const confirmMultiSelect = () => {
        const files = Array.from(selected).map(path => resolve(path)).filter(Boolean);
        onSelectFile(files);
    };
    
    return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.leftPanel}>
            <div style={styles.head}>
                <h3 style={styles.title}>Select {multiSelect ? "Files" : "a File"} ({filtered.length})</h3>
                <button style={styles.btn} onClick={onClose}>✕</button>
            </div>
            <input style={styles.input} placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
            <div style={styles.list}>{filtered.map(p => {
                const isSelected = selected.has(p.path);
                return (<div key={p.path} style={{ ...styles.item, background: isSelected ? 'var(--background-modifier-hover)' : 'transparent' }} 
                    onClick={() => handleSelect(p)}
                    onMouseEnter={() => showPreview && setPreviewFile(p)}>
                    {multiSelect && <input type="checkbox" checked={isSelected} onChange={() => {}} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{p.basename || p.path}</div>
                        <div style={styles.path}>{p.path}</div>
                        <div style={styles.meta}>{p.sizeKB} KB • Modified: {p.modifiedDate}</div>
                    </div>
                </div>);
            })}</div>
            {multiSelect && <div style={styles.footer}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selected.size} selected</span>
                <button style={{ ...styles.btn, width: 'auto', padding: '8px 16px' }} onClick={confirmMultiSelect} disabled={selected.size === 0}>Confirm Selection</button>
            </div>}
        </div>
        {showPreview && <div style={styles.rightPanel}>
            {previewFile ? (<>
                <h4 style={{ margin: '0 0 12px 0' }}>{previewFile.basename}</h4>
                <div style={styles.meta}>{previewFile.path}<br/>{previewFile.sizeKB} KB • {previewFile.modifiedDate}</div>
                <div style={{ borderTop: '1px solid var(--background-modifier-border)', marginTop: 12, paddingTop: 12 }}>
                    <pre style={styles.preview}>{previewContent || "Loading..."}</pre>
                </div>
            </>) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Hover over a file to preview</div>}
        </div>}
    </div></div>);
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

/* ───────────────── Unified Advanced Filter Modal ───────────────── */
const UnifiedFilterModal = ({ isOpen, onClose, baseFolder, currentFilters, onApply }) => {
  if (!isOpen) return null;
  const [subfolders, setSubfolders] = useState([]);
  const [selectedSubfolders, setSelectedSubfolders] = useState(new Set(currentFilters?.subfolders || []));
  const [selectedExtensions, setSelectedExtensions] = useState(new Set(currentFilters?.extensions || ["md"]));
  const [customExt, setCustomExt] = useState("");
  const [minSize, setMinSize] = useState(currentFilters?.minSize || 0);
  const [maxSize, setMaxSize] = useState(currentFilters?.maxSize || "");
  const [modifiedAfter, setModifiedAfter] = useState(currentFilters?.modifiedAfter || "");
  const [modifiedBefore, setModifiedBefore] = useState(currentFilters?.modifiedBefore || "");
  const [namePattern, setNamePattern] = useState(currentFilters?.namePattern || "");
  const [useRegex, setUseRegex] = useState(currentFilters?.useRegex || false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!baseFolder) return;
    const base = baseFolder.path === "/" ? "" : baseFolder.path;
    const list = [];
    const stack = [baseFolder];
    while (stack.length) {
      const cur = stack.pop();
      if (cur?.children) {
        for (const ch of cur.children) {
          if (ch?.children) {
            stack.push(ch);
            const rel = base ? ch.path.slice(base.length + 1) : ch.path;
            if (rel) list.push(rel);
          }
        }
      }
    }
    list.sort((a, b) => a.localeCompare(b));
    setSubfolders(list);
  }, [baseFolder]);

  const filteredSubfolders = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return subfolders;
    return subfolders.filter((x) => x.toLowerCase().includes(t));
  }, [subfolders, query]);

  const availableExtensions = ["md", "txt", "json", "csv", "canvas", "pdf", "png", "jpg", "svg"];

  const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { width: 920, maxWidth: '95%', background: 'var(--background-primary)', borderRadius: 12, border: '1px solid var(--background-modifier-border)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' },
    head: { padding: '14px 18px', borderBottom: '1px solid var(--background-modifier-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    body: { flex: 1, overflow: 'auto', padding: 16, display: 'grid', gap: 20 },
    section: { border: '1px solid var(--background-modifier-border)', borderRadius: 10, padding: 14 },
    sectionTitle: { fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text-normal)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 },
    chip: { display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--background-modifier-border)', borderRadius: 18, padding: '6px 10px', fontSize: 12 },
    input: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', color: 'var(--text-normal)', width: '100%' },
    row: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
    label: { fontSize: 13, color: 'var(--text-muted)', minWidth: 120 },
    list: { maxHeight: 200, overflow: 'auto', display: 'grid', gap: 4, marginTop: 8 },
    listItem: { display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', border: '1px solid var(--background-modifier-border)', borderRadius: 8 },
    foot: { padding: 14, borderTop: '1px solid var(--background-modifier-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' },
    btn: { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', cursor: 'pointer' }
  };

  const toggleSubfolder = (rel) => {
    const n = new Set(selectedSubfolders);
    n.has(rel) ? n.delete(rel) : n.add(rel);
    setSelectedSubfolders(n);
  };

  const toggleExtension = (ext) => {
    const n = new Set(selectedExtensions);
    n.has(ext) ? n.delete(ext) : n.add(ext);
    setSelectedExtensions(n);
  };

  const addCustomExt = () => {
    const e = customExt.trim().toLowerCase().replace(/^\./, "");
    if (!e) return;
    const n = new Set(selectedExtensions);
    n.add(e);
    setSelectedExtensions(n);
    setCustomExt("");
  };

  const handleApply = () => {
    onApply({
      subfolders: Array.from(selectedSubfolders),
      extensions: Array.from(selectedExtensions),
      minSize,
      maxSize: maxSize ? parseInt(maxSize) : Infinity,
      modifiedAfter: modifiedAfter ? new Date(modifiedAfter).getTime() : null,
      modifiedBefore: modifiedBefore ? new Date(modifiedBefore).getTime() : null,
      namePattern,
      useRegex
    });
    onClose();
  };

  const resetFilters = () => {
    setSelectedSubfolders(new Set());
    setSelectedExtensions(new Set(["md"]));
    setMinSize(0);
    setMaxSize("");
    setModifiedAfter("");
    setModifiedBefore("");
    setNamePattern("");
    setUseRegex(false);
  };

  return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
    <div style={styles.head}>
      <h3 style={{ margin: 0, fontSize: 16 }}>Advanced Filters</h3>
      <button style={{ ...styles.btn, padding: '6px 10px' }} onClick={onClose}>✕</button>
    </div>

    <div style={styles.body}>
      {/* File Types */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📝 File Types</div>
        <div style={styles.grid}>
          {availableExtensions.map(ext => (
            <label key={ext} style={styles.chip}>
              <input type="checkbox" checked={selectedExtensions.has(ext)} onChange={() => toggleExtension(ext)} />
              <span>.{ext}</span>
            </label>
          ))}
        </div>
        <div style={{ ...styles.row, marginTop: 10 }}>
          <input style={{ ...styles.input, flex: 1 }} placeholder="Custom extension (e.g., adoc)" value={customExt} onChange={e => setCustomExt(e.target.value)} />
          <button style={styles.btn} onClick={addCustomExt}>Add</button>
        </div>
      </div>

      {/* Subfolders */}
      {baseFolder && subfolders.length > 0 && <div style={styles.section}>
        <div style={styles.sectionTitle}>📁 Subfolders (select specific or leave empty for all)</div>
        <input style={styles.input} placeholder="Search subfolders..." value={query} onChange={e => setQuery(e.target.value)} />
        <div style={styles.list}>
          {filteredSubfolders.map(rel => (
            <label key={rel} style={styles.listItem}>
              <input type="checkbox" checked={selectedSubfolders.has(rel)} onChange={() => toggleSubfolder(rel)} />
              <span style={{ fontSize: 12 }}>{rel}</span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button style={styles.btn} onClick={() => setSelectedSubfolders(new Set(filteredSubfolders))}>Select All</button>
          <button style={styles.btn} onClick={() => setSelectedSubfolders(new Set())}>Clear</button>
        </div>
      </div>}

      {/* File Size */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📊 File Size (KB)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ ...styles.label, marginBottom: 6 }}>Min Size</div>
            <input type="number" style={styles.input} value={minSize} onChange={e => setMinSize(parseInt(e.target.value) || 0)} placeholder="0" />
          </div>
          <div>
            <div style={{ ...styles.label, marginBottom: 6 }}>Max Size</div>
            <input type="number" style={styles.input} value={maxSize} onChange={e => setMaxSize(e.target.value)} placeholder="Unlimited" />
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📅 Modified Date</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ ...styles.label, marginBottom: 6 }}>After</div>
            <input type="date" style={styles.input} value={modifiedAfter} onChange={e => setModifiedAfter(e.target.value)} />
          </div>
          <div>
            <div style={{ ...styles.label, marginBottom: 6 }}>Before</div>
            <input type="date" style={styles.input} value={modifiedBefore} onChange={e => setModifiedBefore(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Name Pattern */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>🔍 File Name Pattern</div>
        <div style={styles.row}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input type="checkbox" checked={useRegex} onChange={e => setUseRegex(e.target.checked)} />
            Use Regex
          </label>
        </div>
        <input style={styles.input} placeholder={useRegex ? "e.g., ^note-\\d+$" : "e.g., project"} value={namePattern} onChange={e => setNamePattern(e.target.value)} />
      </div>
    </div>

    <div style={styles.foot}>
      <button style={styles.btn} onClick={resetFilters}>Reset All</button>
      <button style={{ ...styles.btn, background: 'var(--interactive-accent)', color: 'var(--text-on-accent)' }} onClick={handleApply}>Apply Filters</button>
    </div>
  </div></div>);
};

/* ───────────────── Subfolder Filter (from v1) ───────────────── */
const SubfolderFilterModal = ({ isOpen, onClose, baseFolder, selected, onApply }) => {
  if (!isOpen) return null;
  const [items, setItems] = useState([]);
  const [picked, setPicked] = useState(new Set(selected || []));
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!baseFolder) return;
    const base = baseFolder.path === "/" ? "" : baseFolder.path;
    const list = [];
    const stack = [baseFolder];
    while (stack.length) {
      const cur = stack.pop();
      if (cur?.children) {
        for (const ch of cur.children) {
          if (ch?.children) {
            stack.push(ch);
            const rel = base ? ch.path.slice(base.length + 1) : ch.path;
            if (rel) list.push(rel);
          }
        }
      }
    }
    list.sort((a, b) => a.localeCompare(b));
    setItems(list);
  }, [baseFolder]);

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return items;
    return items.filter((x) => x.toLowerCase().includes(t));
  }, [items, query]);

  const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { width: 720, maxWidth: '92%', background: 'var(--background-primary)', borderRadius: 12, border: '1px solid var(--background-modifier-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    head: { padding: '12px 14px', borderBottom: '1px solid var(--background-modifier-border)', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' },
    list: { padding: 12, maxHeight: 360, overflow: 'auto', display: 'grid', gap: 6 },
    row: { display: 'flex', gap: 8, alignItems: 'center', border: '1px solid var(--background-modifier-border)', borderRadius: 8, padding: '8px 10px' },
    foot: { padding: 12, borderTop: '1px solid var(--background-modifier-border)', display: 'flex', gap: 8, justifyContent: 'flex-end' },
    btn: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', cursor: 'pointer' },
    search: { width: '60%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', color: 'var(--text-normal)' }
  };

  if (!baseFolder) {
    return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
      <div style={styles.head}><strong>Subfolder Filter</strong></div>
      <div style={{ padding: 12, color: 'var(--text-muted)' }}>Pick a base folder first.</div>
      <div style={styles.foot}><button style={styles.btn} onClick={onClose}>Close</button></div>
    </div></div>);
  }

  const toggle = (rel) => { const n = new Set(picked); n.has(rel) ? n.delete(rel) : n.add(rel); setPicked(n); };

  return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
    <div style={styles.head}><strong>Subfolder Filter — {baseFolder.path}</strong><input style={styles.search} placeholder="Filter…" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <div style={styles.list}>
      {filtered.map(rel => (<label key={rel} style={styles.row}><input type="checkbox" checked={picked.has(rel)} onChange={() => toggle(rel)} /><span>{rel}</span></label>))}
      {filtered.length === 0 && <div style={{ padding: 12, color: 'var(--text-muted)' }}>No subfolders.</div>}
    </div>
    <div style={styles.foot}>
      <button style={styles.btn} onClick={() => setPicked(new Set(filtered))}>Select shown</button>
      <button style={styles.btn} onClick={() => setPicked(new Set())}>Clear</button>
      <button style={styles.btn} onClick={() => { onApply(Array.from(picked)); onClose(); }}>Apply</button>
    </div>
  </div></div>);
};

/* ───────────────── Extension Filter (from v1) ───────────────── */
const ExtFilterModal = ({ isOpen, onClose, available, selected, onApply }) => {
  if (!isOpen) return null;
  const [picked, setPicked] = useState(new Set(selected || ["md"]));
  const [custom, setCustom] = useState("");

  const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { width: 560, maxWidth: '92%', background: 'var(--background-primary)', borderRadius: 12, border: '1px solid var(--background-modifier-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    head: { padding: '12px 14px', borderBottom: '1px solid var(--background-modifier-border)' },
    list: { padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 300, overflow: 'auto' },
    chip: { display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--background-modifier-border)', borderRadius: 18, padding: '6px 10px' },
    foot: { padding: 12, borderTop: '1px solid var(--background-modifier-border)', display: 'flex', gap: 8, justifyContent: 'flex-end' },
    btn: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', cursor: 'pointer' },
    input: { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', color: 'var(--text-normal)' }
  };

  const toggle = (e) => { const ext = e.toLowerCase().replace(/^\./, ""); const n = new Set(picked); n.has(ext) ? n.delete(ext) : n.add(ext); setPicked(n); };
  const add = () => { const e = custom.trim().toLowerCase().replace(/^\./, ""); if (!e) return; const n = new Set(picked); n.add(e); setPicked(n); setCustom(""); };
  const all = (available && available.length) ? available : ["md", "txt", "json", "csv", "canvas"];

  return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
    <div style={styles.head}><strong>Type / Extension Filter</strong></div>
    <div style={styles.list}>
      {all.map(ext => (<label key={ext} style={styles.chip}><input type="checkbox" checked={picked.has(ext)} onChange={() => toggle(ext)} /><span>.{ext}</span></label>))}
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 12px 12px' }}>
      <input style={styles.input} placeholder="Add custom (e.g. .adoc)" value={custom} onChange={e => setCustom(e.target.value)} />
      <button style={styles.btn} onClick={add}>Add</button>
    </div>
    <div style={styles.foot}>
      <button style={styles.btn} onClick={() => setPicked(new Set(all))}>Select all</button>
      <button style={styles.btn} onClick={() => setPicked(new Set(["md"]))}>Only .md</button>
      <button style={styles.btn} onClick={() => { onApply(Array.from(picked)); onClose(); }}>Apply</button>
    </div>
  </div></div>);
};

/* ───────────── Supplement Manager (from v1) ───────────── */
const SupplementManagerModal = ({ isOpen, onClose, supplements, onChange, onAddRequest, createDir, onPickCreateDir, onCreateNew }) => {
  if (!isOpen) return null;
  const [newName, setNewName] = useState("");
  const [expanded, setExpanded] = useState({});

  const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { width: 860, maxWidth: '95%', background: 'var(--background-primary)', color: 'var(--text-normal)', borderRadius: 12, border: '1px solid var(--background-modifier-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    head: { padding: 12, borderBottom: '1px solid var(--background-modifier-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    btn: { padding: '6px 10px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', cursor: 'pointer' },
    list: { maxHeight: 320, overflow: 'auto', display: 'grid', gap: 8, padding: 12 },
    row: { display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto auto', alignItems: 'center', gap: 8, border: '1px solid var(--background-modifier-border)', borderRadius: 10, padding: '8px 10px' },
    path: { fontFamily: 'ui-monospace', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    chip: { fontSize: 12, padding: '2px 6px', border: '1px solid var(--background-modifier-border)', borderRadius: 8, background: 'var(--background-secondary)' },
    foot: { padding: 12, borderTop: '1px solid var(--background-modifier-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    createWrap: { display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 8, alignItems: 'center', padding: '10px 12px', borderTop: '1px dashed var(--background-modifier-border)', background: 'var(--background-secondary)' },
    label: { fontSize: 12, color: 'var(--text-muted)' },
    input: { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-primary)', color: 'var(--text-normal)' },
    dirBadge: { fontFamily: 'ui-monospace', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-primary)' },
    infoBox: { gridColumn: '1 / -1', background: 'var(--background-primary-alt)', border: '1px dashed var(--background-modifier-border)', borderRadius: 8, padding: '8px 10px', fontFamily: 'ui-monospace', fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }
  };

  const toggle = (i, key) => { const next = [...supplements]; next[i] = { ...next[i], [key]: !next[i][key] }; onChange(next); };
  const flipPlacement = (i) => { const next = [...supplements]; next[i] = { ...next[i], placement: next[i].placement === "append" ? "prepend" : "append" }; onChange(next); };
  const remove = (i) => { const next = [...supplements]; next.splice(i, 1); onChange(next); };
  const toggleExpand = async (i) => { setExpanded(m => ({ ...m, [i]: !m[i] })); };

  const fileInfoString = (file) => {
    try {
      const stat = file?.stat || {};
      const size = (stat.size != null) ? ` • ${stat.size} bytes` : "";
      const mtime = stat.mtime ? new Date(stat.mtime).toLocaleString() : "unknown";
      const ctime = stat.ctime ? new Date(stat.ctime).toLocaleString() : "unknown";
      return `mtime: ${mtime} • ctime: ${ctime}${size}`;
    } catch { return "(no metadata)"; }
  };

  return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
    <div style={styles.head}><strong>Supplement Manager</strong><div style={{ display: 'flex', gap: 8 }}>
      <button style={styles.btn} onClick={onAddRequest} title="Add existing file">➕ Add file</button>
      <button style={styles.btn} onClick={onClose}>Close</button>
    </div></div>
    
    <div style={styles.createWrap}>
      <span style={styles.label}>Create in:</span>
      <div style={styles.dirBadge} title={createDir || "(pick a folder)"}>{createDir || "(pick a folder)"}</div>
      <button style={styles.btn} title="Pick folder" onClick={onPickCreateDir}>📁</button>
      <div style={{ display: 'contents' }} />
      <span style={styles.label}>Filename:</span>
      <input style={styles.input} placeholder="my-supplement.md" value={newName} onChange={e => setNewName(e.target.value)} />
      <button style={styles.btn} title="Create file" onClick={() => { if (!newName.trim()) { new Notice("Enter a file name.", 2000); return; } onCreateNew(newName.trim()); setNewName(""); }}>🆕 Create</button>
    </div>

    <div style={styles.list}>
      {supplements.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No supplements yet. Use "➕ Add file" or "🆕 Create".</div>}
      {supplements.map((s, i) => (<div key={s.file.path + "_" + i} style={styles.row}>
        <div title={s.file.path} style={styles.path}>{s.file.path}</div>
        <button style={styles.btn} title={`Inject inside compiled notes: ${s.inject ? "ON" : "OFF"}`} onClick={() => toggle(i, "inject")}>{s.inject ? "✅ Inject" : "⛔ Inject"}</button>
        <button style={styles.btn} title={`Placement when injecting: ${s.placement}`} onClick={() => flipPlacement(i)}>{s.placement === "append" ? "⬇ Append" : "⬆ Prepend"}</button>
        <button style={styles.btn} title={`Copy alongside outputs: ${s.copy ? "ON" : "OFF"}`} onClick={() => toggle(i, "copy")}>{s.copy ? "📥 Copy" : "📥 No"}</button>
        <button style={styles.btn} title={`Recursive copy into every _compiled/<subfolder>: ${s.recursive ? "ON" : "OFF"}`} onClick={() => toggle(i, "recursive")}>{s.recursive ? "🔁 Rec" : "⏹️ One"}</button>
        <button style={styles.btn} title="More info / preview" onClick={() => toggleExpand(i)}>{expanded[i] ? "🔽 Info" : "🔼 Info"}</button>
        <button style={styles.btn} title="Remove" onClick={() => remove(i)}>🗑️</button>
        {expanded[i] && <div style={styles.infoBox}>
          <div>Path: {s.file.path}{"\n"}{fileInfoString(s.file)}</div>
          <div style={{ marginTop: 6, opacity: 0.9 }}>Inject: {s.inject ? "yes" : "no"} • Placement: {s.placement} • Copy: {s.copy ? "yes" : "no"} • Recursive: {s.recursive ? "yes" : "no"}</div>
          <div style={{ marginTop: 6 }}>Tip: "Inject" places this file's content inside every compiled note. "Copy" writes the file next to the compiled notes; with "Recursive" it's copied into each <code>_compiled/&lt;subfolder&gt;</code>.</div>
        </div>}
      </div>))}
    </div>

    <div style={styles.foot}>
      <span className="note" style={styles.chip}>"Recursive" copies into every <code>_compiled/&lt;subfolder&gt;</code>. "Append/Prepend" controls where the injected text appears inside compiled notes.</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Need an existing note? Use "➕ Add file".</span>
    </div>
  </div></div>);
};

/* ───────────── Contextual Help (from v1) ───────────── */
const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { width: 780, maxWidth: '95%', background: 'var(--background-primary)', borderRadius: 12, border: '1px solid var(--background-modifier-border)', overflow: 'hidden', color: 'var(--text-normal)', display: 'flex', flexDirection: 'column' },
    head: { padding: '12px 14px', borderBottom: '1px solid var(--background-modifier-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    btn: { padding: '6px 10px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', cursor: 'pointer' },
    body: { padding: 14, display: 'grid', gap: 10, fontSize: 14, lineHeight: 1.5, maxHeight: '70vh', overflow: 'auto' },
    code: { fontFamily: 'ui-monospace', fontSize: 12, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', borderRadius: 8, padding: '8px 10px' },
    grid: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' },
    k: { width: 38, height: 34, display: 'grid', placeItems: 'center', border: '1px solid var(--background-modifier-border)', borderRadius: 8, background: 'var(--background-secondary)' }
  };
  const Item = ({ icon, text }) => (<><div style={styles.k}>{icon}</div><div>{text}</div></>);
  return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
    <div style={styles.head}><strong>Help & Icon Legend</strong><button style={styles.btn} onClick={onClose}>Close</button></div>
    <div style={styles.body}>
      <div style={styles.grid}>
        <Item icon="⤢" text="Full view" />
        <Item icon="📄" text="Pick a file to view/edit" />
        <Item icon="📌" text="Pick base folder (for advanced compile)" />
        <Item icon="⚙️" text="Compile now (uses current settings & base folder)" />
        <Item icon="🗃️/🧾" text="Group by folder / Flat output" />
        <Item icon="🔁" text="Grouping recursion on/off" />
        <Item icon="🎯" text="Select specific subfolders to include" />
        <Item icon="🔡" text="Filter by file types/extensions" />
        <Item icon="📦" text="Supplement Manager (add/create, inject, copy, recursive)" />
        <Item icon="📎" text="Quick single supplement (optional)" />
        <Item icon="🗂️" text="Compile Single Folder (simple, all files)" />
        <Item icon="🗂️+" text="Compile Multiple Subfolders (with groups)" />
        <Item icon="📂➡️📋" text="List Subfolders (generate text list)" />
        <Item icon="{...}" text="Compile from JSON (category-based)" />
        <Item icon="🎯" text="Universal Compile (All-in-One compile modal)" />
        <Item icon="⚡" text="Batch Operations (rename, move, tag, delete, copy, archive)" />
        <Item icon="🗑️" text="Delete SVG Files in Folder" />
        <Item icon="✏️/💾/↩️" text="Edit / Save / Cancel" />
        <Item icon="📂" text="Open current file in a new pane" />
        <Item icon="📋" text="Copy current content to clipboard" />
        <Item icon="👁️‍🗨️" text="Toggle Inspector (show/hide settings summary)" />
        <Item icon="⤬" text="Exit full view" />
      </div>
      <div><strong>Typical flow (Advanced Compile):</strong>
        <ol>
          <li>Click <b>📌</b> to pick your base folder.</li>
          <li>Optionally refine with <b>🎯</b> subfolders & <b>🔡</b> types.</li>
          <li>(Optional) Open <b>📦</b> to add/create supplementary files, toggle inject/copy/recursive.</li>
          <li>Choose <b>🗃️</b> or <b>🧾</b>, set <b>Parts</b>, then click <b>⚙️</b> to compile.</li>
          <li>Outputs go to <code>&lt;base&gt;/_compiled/…</code>.</li>
        </ol>
      </div>
      <div><strong>Simple Operations:</strong>
        <ul>
          <li><b>🗂️</b> Compile Single Folder: Quick compile of all files in one folder</li>
          <li><b>🗂️+</b> Multi-Subfolder: Select multiple subfolders, assign to groups or compile separately</li>
          <li><b>📂➡️📋</b> List Subfolders: Get a text list of all subfolders in a folder</li>
          <li><b>{`{...}`}</b> JSON Compile: Provide JSON with categories and file names</li>
          <li><b>🎯</b> Universal Compile: All-in-one modal with Simple, Advanced, Multi-Folder, and JSON tabs</li>
          <li><b>⚡</b> Batch Operations: Perform rename, move, tag, delete, copy, or archive on multiple files at once</li>
          <li><b>🗑️</b> SVG Delete: Batch delete all .svg files in a folder (with confirmation)</li>
        </ul>
      </div>
      <div><strong>Parts Splitting:</strong> N evenly sized chunks by section boundary (<code>---</code>).</div>
      <div><strong>Supplement behavior:</strong>
        <div style={styles.code}>{`Inject = place the file text inside each compiled output (prepend/append)
Copy = copy the file next to compiled outputs
Recursive = copy into every _compiled/<subfolder> directory`}</div>
      </div>
    </div>
  </div></div>);
};

/* ───────────────── a) Universal Compile Modal ───────────────── */
const UniversalCompileModal = ({ isOpen, onClose, baseFolder }) => {
  if (!isOpen) return null;
  const [activeTab, setActiveTab] = useState("simple");
  const [simpleOptions, setSimpleOptions] = useState({ recursive: true, extensions: [], outputName: "compiled" });
  const [advancedOptions, setAdvancedOptions] = useState({ parts: 1, grouping: "flat", recursion: false, toc: false, timestamps: true, template: "default" });
  const [multiOptions, setMultiOptions] = useState({ folders: [], groupMode: "separate" });
  const [jsonConfig, setJsonConfig] = useState("");
  const [outputFormat, setOutputFormat] = useState("md");

  const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 10003, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { width: 900, maxWidth: '95%', maxHeight: '90vh', background: 'var(--background-primary)', borderRadius: 12, border: '1px solid var(--background-modifier-border)', overflow: 'hidden', color: 'var(--text-normal)', display: 'flex', flexDirection: 'column' },
    head: { padding: '14px 16px', borderBottom: '1px solid var(--background-modifier-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--background-secondary)' },
    tabs: { display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--background-modifier-border)', background: 'var(--background-primary-alt)' },
    tab: (active) => ({ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: active ? 'var(--interactive-accent)' : 'var(--background-secondary)', color: active ? 'var(--text-on-accent)' : 'var(--text-normal)', cursor: 'pointer', fontWeight: active ? 'bold' : 'normal' }),
    body: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', flexGrow: 1 },
    btn: { padding: '8px 14px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', cursor: 'pointer', color: 'var(--text-normal)' },
    input: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-primary)', color: 'var(--text-normal)', width: '100%' },
    label: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
    section: { display: 'flex', flexDirection: 'column', gap: 10, padding: 14, border: '1px solid var(--background-modifier-border)', borderRadius: 10, background: 'var(--background-primary-alt)' },
    textarea: { padding: '10px 12px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-primary)', color: 'var(--text-normal)', fontFamily: 'ui-monospace', fontSize: 13, minHeight: 200, resize: 'vertical' },
    foot: { padding: '12px 16px', borderTop: '1px solid var(--background-modifier-border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--background-primary-alt)' }
  };

  const handleCompile = async () => {
    if (!baseFolder) { new Notice("⚠️ Please select a base folder first"); return; }
    
    try {
      let result;
      if (activeTab === "simple") {
        // Simple compile: all files in folder
        const files = getAllFilesInFolder(baseFolder, { 
          recursive: simpleOptions.recursive,
          extensions: simpleOptions.extensions.length ? simpleOptions.extensions : null
        });
        const content = files.map(f => `# ${f.basename}\n\n${dc.app.vault.cachedRead(f)}`).join("\n\n---\n\n");
        const outPath = pathJoin(baseFolder.path, `${simpleOptions.outputName}.${outputFormat}`);
        await dc.app.vault.create(ensureUniquePath(outPath), content);
        new Notice(`✅ Compiled ${files.length} files to ${simpleOptions.outputName}.${outputFormat}`);
      } else if (activeTab === "advanced") {
        // Advanced compile with parts, TOC, templates
        const files = getAllFilesInFolder(baseFolder, { recursive: advancedOptions.recursion });
        let content = files.map(f => `# ${f.basename}\n\n${dc.app.vault.cachedRead(f)}`).join("\n\n---\n\n");
        
        if (advancedOptions.toc) {
          const toc = "## Table of Contents\n\n" + files.map((f, i) => `${i + 1}. ${f.basename}`).join("\n") + "\n\n---\n\n";
          content = toc + content;
        }
        if (advancedOptions.timestamps) {
          content = `<!-- Compiled: ${new Date().toISOString()} -->\n\n` + content;
        }
        
        const outPath = pathJoin(baseFolder.path, `compiled-advanced.${outputFormat}`);
        await dc.app.vault.create(ensureUniquePath(outPath), content);
        new Notice(`✅ Advanced compile complete`);
      } else if (activeTab === "multi") {
        // Multi-folder compile
        new Notice("🚧 Multi-folder compile coming soon");
      } else if (activeTab === "json") {
        // JSON-based compile
        new Notice("🚧 JSON compile coming soon");
      }
      onClose();
    } catch (e) {
      new Notice(`❌ Compile failed: ${e.message}`);
    }
  };

  return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
    <div style={styles.head}>
      <strong>🎯 Universal Compile</strong>
      <button style={styles.btn} onClick={onClose}>Close</button>
    </div>
    <div style={styles.tabs}>
      <button style={styles.tab(activeTab === "simple")} onClick={() => setActiveTab("simple")}>Simple</button>
      <button style={styles.tab(activeTab === "advanced")} onClick={() => setActiveTab("advanced")}>Advanced</button>
      <button style={styles.tab(activeTab === "multi")} onClick={() => setActiveTab("multi")}>Multi-Folder</button>
      <button style={styles.tab(activeTab === "json")} onClick={() => setActiveTab("json")}>JSON</button>
    </div>
    <div style={styles.body}>
      {activeTab === "simple" && (
        <div style={styles.section}>
          <h3>Simple Compile</h3>
          <label style={styles.label}>
            <input type="checkbox" checked={simpleOptions.recursive} onChange={e => setSimpleOptions({...simpleOptions, recursive: e.target.checked})} />
            Include subfolders (recursive)
          </label>
          <label style={styles.label}>
            Output name:
            <input style={styles.input} value={simpleOptions.outputName} onChange={e => setSimpleOptions({...simpleOptions, outputName: e.target.value})} />
          </label>
          <label style={styles.label}>
            Format:
            <select style={styles.input} value={outputFormat} onChange={e => setOutputFormat(e.target.value)}>
              <option value="md">Markdown (.md)</option>
              <option value="txt">Text (.txt)</option>
              <option value="html">HTML (.html)</option>
            </select>
          </label>
        </div>
      )}
      {activeTab === "advanced" && (
        <div style={styles.section}>
          <h3>Advanced Options</h3>
          <label style={styles.label}>
            Parts: <input type="number" min="1" style={{...styles.input, width: 100}} value={advancedOptions.parts} onChange={e => setAdvancedOptions({...advancedOptions, parts: parseInt(e.target.value)})} />
          </label>
          <label style={styles.label}>
            <input type="checkbox" checked={advancedOptions.toc} onChange={e => setAdvancedOptions({...advancedOptions, toc: e.target.checked})} />
            Generate table of contents
          </label>
          <label style={styles.label}>
            <input type="checkbox" checked={advancedOptions.timestamps} onChange={e => setAdvancedOptions({...advancedOptions, timestamps: e.target.checked})} />
            Add timestamps
          </label>
          <label style={styles.label}>
            <input type="checkbox" checked={advancedOptions.recursion} onChange={e => setAdvancedOptions({...advancedOptions, recursion: e.target.checked})} />
            Recursive grouping
          </label>
          <label style={styles.label}>
            Template:
            <select style={styles.input} value={advancedOptions.template} onChange={e => setAdvancedOptions({...advancedOptions, template: e.target.value})}>
              <option value="default">Default</option>
              <option value="report">Report Style</option>
              <option value="minimal">Minimal</option>
            </select>
          </label>
        </div>
      )}
      {activeTab === "multi" && (
        <div style={styles.section}>
          <h3>Multi-Folder Compile</h3>
          <p style={{color: 'var(--text-muted)'}}>Select multiple subfolders and choose how to compile them.</p>
          <label style={styles.label}>
            <input type="radio" name="multiMode" checked={multiOptions.groupMode === "separate"} onChange={() => setMultiOptions({...multiOptions, groupMode: "separate"})} />
            Compile separately
          </label>
          <label style={styles.label}>
            <input type="radio" name="multiMode" checked={multiOptions.groupMode === "combined"} onChange={() => setMultiOptions({...multiOptions, groupMode: "combined"})} />
            Combine into one
          </label>
        </div>
      )}
      {activeTab === "json" && (
        <div style={styles.section}>
          <h3>JSON Configuration</h3>
          <p style={{color: 'var(--text-muted)', fontSize: 13}}>Format: {`{"Category Name": ["file1.md", "file2.md"]}`}</p>
          <textarea style={styles.textarea} placeholder='{"Research": ["notes1.md", "notes2.md"], "Ideas": ["idea1.md"]}' value={jsonConfig} onChange={e => setJsonConfig(e.target.value)} />
        </div>
      )}
    </div>
    <div style={styles.foot}>
      <button style={styles.btn} onClick={onClose}>Cancel</button>
      <button style={{...styles.btn, background: 'var(--interactive-accent)', color: 'var(--text-on-accent)'}} onClick={handleCompile}>
        {activeTab === "simple" ? "Compile Now" : activeTab === "advanced" ? "Advanced Compile" : activeTab === "multi" ? "Multi Compile" : "JSON Compile"}
      </button>
    </div>
  </div></div>);
};

/* ───────────────── b) Batch Operations Modal ───────────────── */
const BatchOperationsModal = ({ isOpen, onClose, selectedFiles = [] }) => {
  if (!isOpen) return null;
  const [operation, setOperation] = useState("rename");
  const [renamePattern, setRenamePattern] = useState("{name}");
  const [targetFolder, setTargetFolder] = useState(null);
  const [tagOperation, setTagOperation] = useState("add");
  const [tags, setTags] = useState("");
  const [archiveDate, setArchiveDate] = useState(true);

  const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 10003, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { width: 800, maxWidth: '95%', maxHeight: '85vh', background: 'var(--background-primary)', borderRadius: 12, border: '1px solid var(--background-modifier-border)', overflow: 'hidden', color: 'var(--text-normal)', display: 'flex', flexDirection: 'column' },
    head: { padding: '14px 16px', borderBottom: '1px solid var(--background-modifier-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--background-secondary)' },
    body: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', flexGrow: 1 },
    btn: { padding: '8px 14px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-secondary)', cursor: 'pointer', color: 'var(--text-normal)' },
    input: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: 'var(--background-primary)', color: 'var(--text-normal)', width: '100%', fontFamily: 'ui-monospace' },
    label: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
    section: { display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid var(--background-modifier-border)', borderRadius: 10, background: 'var(--background-primary-alt)' },
    ops: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 },
    opBtn: (active) => ({ padding: '12px 16px', borderRadius: 8, border: '1px solid var(--background-modifier-border)', background: active ? 'var(--interactive-accent)' : 'var(--background-secondary)', color: active ? 'var(--text-on-accent)' : 'var(--text-normal)', cursor: 'pointer', textAlign: 'center', fontWeight: active ? 'bold' : 'normal' }),
    info: { padding: 10, borderRadius: 8, background: 'var(--background-modifier-border)', fontSize: 13, color: 'var(--text-muted)' },
    fileList: { maxHeight: 150, overflow: 'auto', padding: 12, border: '1px solid var(--background-modifier-border)', borderRadius: 8, background: 'var(--background-primary)', fontFamily: 'ui-monospace', fontSize: 12 },
    foot: { padding: '12px 16px', borderTop: '1px solid var(--background-modifier-border)', display: 'flex', gap: 10, justifyContent: 'space-between', background: 'var(--background-primary-alt)' }
  };

  const handleExecute = async () => {
    if (!selectedFiles.length) { new Notice("⚠️ No files selected"); return; }
    
    try {
      if (operation === "rename") {
        const results = await batchRenameFiles(selectedFiles, (file) => {
          return renamePattern
            .replace("{name}", file.basename)
            .replace("{index}", selectedFiles.indexOf(file) + 1)
            .replace("{date}", new Date().toISOString().split('T')[0]) + `.${file.extension}`;
        });
        new Notice(`✅ Renamed ${results.success.length} files${results.failed.length ? `, ${results.failed.length} failed` : ''}`);
      } else if (operation === "move") {
        if (!targetFolder) { new Notice("⚠️ Select target folder"); return; }
        const results = await batchMoveFiles(selectedFiles, targetFolder);
        new Notice(`✅ Moved ${results.success.length} files${results.failed.length ? `, ${results.failed.length} failed` : ''}`);
      } else if (operation === "delete") {
        const confirm = await new Promise(resolve => {
          const modal = new Modal(dc.app);
          modal.contentEl.createEl("p", { text: `Delete ${selectedFiles.length} files? This cannot be undone.` });
          const btnDiv = modal.contentEl.createDiv({ cls: "modal-button-container" });
          btnDiv.createEl("button", { text: "Cancel" }).onclick = () => { modal.close(); resolve(false); };
          btnDiv.createEl("button", { text: "Delete", cls: "mod-warning" }).onclick = () => { modal.close(); resolve(true); };
          modal.open();
        });
        if (confirm) {
          for (const file of selectedFiles) await dc.app.vault.delete(file);
          new Notice(`✅ Deleted ${selectedFiles.length} files`);
        }
      } else if (operation === "copy") {
        for (const file of selectedFiles) {
          const content = await dc.app.vault.read(file);
          const newPath = ensureUniquePath(file.path.replace(file.basename, `${file.basename}-copy`));
          await dc.app.vault.create(newPath, content);
        }
        new Notice(`✅ Copied ${selectedFiles.length} files`);
      } else if (operation === "tag") {
        const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
        for (const file of selectedFiles) {
          const content = await dc.app.vault.read(file);
          const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
          const match = content.match(frontmatterRegex);
          let newContent;
          if (match) {
            const fm = match[1];
            const lines = fm.split("\n");
            const tagLineIndex = lines.findIndex(l => l.startsWith("tags:"));
            if (tagOperation === "add") {
              if (tagLineIndex >= 0) {
                lines[tagLineIndex] += `, ${tagList.join(", ")}`;
              } else {
                lines.push(`tags: ${tagList.join(", ")}`);
              }
            } else {
              // Remove tags - simplified
              if (tagLineIndex >= 0) lines.splice(tagLineIndex, 1);
            }
            newContent = `---\n${lines.join("\n")}\n---` + content.slice(match[0].length);
          } else {
            newContent = `---\ntags: ${tagList.join(", ")}\n---\n\n` + content;
          }
          await dc.app.vault.modify(file, newContent);
        }
        new Notice(`✅ ${tagOperation === "add" ? "Added" : "Removed"} tags for ${selectedFiles.length} files`);
      } else if (operation === "archive") {
        const archiveFolder = dc.app.vault.getAbstractFileByPath("_archive") || await dc.app.vault.createFolder("_archive");
        const dateStr = archiveDate ? new Date().toISOString().split('T')[0] : "";
        const targetPath = dateStr ? pathJoin("_archive", dateStr) : "_archive";
        await ensureFolder(targetPath);
        const targetFolderObj = dc.app.vault.getAbstractFileByPath(targetPath);
        const results = await batchMoveFiles(selectedFiles, targetFolderObj);
        new Notice(`✅ Archived ${results.success.length} files to ${targetPath}`);
      }
      onClose();
    } catch (e) {
      new Notice(`❌ Operation failed: ${e.message}`);
    }
  };

  return (<div style={styles.overlay} onClick={onClose}><div style={styles.modal} onClick={e => e.stopPropagation()}>
    <div style={styles.head}>
      <strong>⚡ Batch Operations ({selectedFiles.length} files)</strong>
      <button style={styles.btn} onClick={onClose}>Close</button>
    </div>
    <div style={styles.body}>
      <div style={styles.section}>
        <strong>Select Operation</strong>
        <div style={styles.ops}>
          <button style={styles.opBtn(operation === "rename")} onClick={() => setOperation("rename")}>✏️ Rename</button>
          <button style={styles.opBtn(operation === "move")} onClick={() => setOperation("move")}>📦 Move</button>
          <button style={styles.opBtn(operation === "tag")} onClick={() => setOperation("tag")}>🏷️ Tag</button>
          <button style={styles.opBtn(operation === "delete")} onClick={() => setOperation("delete")}>🗑️ Delete</button>
          <button style={styles.opBtn(operation === "copy")} onClick={() => setOperation("copy")}>📋 Copy</button>
          <button style={styles.opBtn(operation === "archive")} onClick={() => setOperation("archive")}>📥 Archive</button>
        </div>
      </div>

      {operation === "rename" && (
        <div style={styles.section}>
          <strong>Rename Pattern</strong>
          <div style={styles.info}>Variables: {`{name}`} = original name, {`{index}`} = number, {`{date}`} = today's date</div>
          <input style={styles.input} value={renamePattern} onChange={e => setRenamePattern(e.target.value)} placeholder="{name}-{index}" />
          <div style={{fontSize: 12, color: 'var(--text-muted)'}}>Preview: {renamePattern.replace("{name}", "example").replace("{index}", "1").replace("{date}", new Date().toISOString().split('T')[0])}.md</div>
        </div>
      )}

      {operation === "move" && (
        <div style={styles.section}>
          <strong>Target Folder</strong>
          <button style={styles.btn} onClick={() => {
            new FolderPicker({ onSelectFolder: (f) => setTargetFolder(f) }).open();
          }}>
            {targetFolder ? `📁 ${targetFolder.path}` : "Select Folder"}
          </button>
        </div>
      )}

      {operation === "tag" && (
        <div style={styles.section}>
          <strong>Tag Operation</strong>
          <div style={styles.label}>
            <input type="radio" name="tagOp" checked={tagOperation === "add"} onChange={() => setTagOperation("add")} /> Add tags
          </div>
          <div style={styles.label}>
            <input type="radio" name="tagOp" checked={tagOperation === "remove"} onChange={() => setTagOperation("remove")} /> Remove tags
          </div>
          <input style={styles.input} value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2, tag3" />
        </div>
      )}

      {operation === "delete" && (
        <div style={styles.section}>
          <strong style={{color: 'var(--text-error)'}}>⚠️ Warning</strong>
          <div style={{color: 'var(--text-muted)'}}>This will permanently delete {selectedFiles.length} files. This action cannot be undone.</div>
        </div>
      )}

      {operation === "copy" && (
        <div style={styles.section}>
          <strong>Copy Files</strong>
          <div style={{color: 'var(--text-muted)'}}>Creates duplicates of selected files with "-copy" suffix in the same location.</div>
        </div>
      )}

      {operation === "archive" && (
        <div style={styles.section}>
          <strong>Archive Settings</strong>
          <label style={styles.label}>
            <input type="checkbox" checked={archiveDate} onChange={e => setArchiveDate(e.target.checked)} />
            Organize by date (create subfolder with today's date)
          </label>
          <div style={{fontSize: 12, color: 'var(--text-muted)'}}>Files will be moved to: _archive{archiveDate ? `/${new Date().toISOString().split('T')[0]}` : ""}</div>
        </div>
      )}

      <div style={styles.section}>
        <strong>Selected Files</strong>
        <div style={styles.fileList}>
          {selectedFiles.length === 0 ? "No files selected" : selectedFiles.map(f => <div key={f.path}>• {f.path}</div>)}
        </div>
      </div>
    </div>
    <div style={styles.foot}>
      <div style={{fontSize: 13, color: 'var(--text-muted)'}}>{selectedFiles.length} files selected</div>
      <div style={{display: 'flex', gap: 10}}>
        <button style={styles.btn} onClick={onClose}>Cancel</button>
        <button style={{...styles.btn, background: operation === "delete" ? 'var(--text-error)' : 'var(--interactive-accent)', color: 'white'}} onClick={handleExecute}>
          Execute {operation.charAt(0).toUpperCase() + operation.slice(1)}
        </button>
      </div>
    </div>
  </div></div>);
};


/* ---------------------- MAIN COMPONENT ---------------------- */
function BasicView() {
    const uniqueWrapperClass = useRef("rfc-" + Math.random().toString(36).substr(2, 9)).current;
    
    const STYLES = {
        wrap: { position: 'relative', height: "100%", width: "100%", padding: 16, display: "flex", flexDirection: "column", gap: 14, background: 'linear-gradient(180deg, #0a0a0a, #000000)', border: '1px solid #1a1a1a', borderRadius: 16, color: '#ffffff' },
        bar: { display: 'flex', flexDirection: 'column', gap: 12, padding: "12px", background: '#0a0a0a', borderRadius: 12, border: '1px solid #1a1a1a' },
        buttonRow: { display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4, scrollbarWidth: 'thin', scrollbarColor: '#8b5cf6 #1a1a1a' },
        left: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 },
        iconBtn: { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ffffff', borderRadius: 10, cursor: 'pointer', padding: 8, minWidth: 36, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'all 0.2s ease', flexShrink: 0, position: 'relative' },
        iconBtnActive: { background: '#8b5cf6', borderColor: '#a78bfa', boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.3)' },
        iconBtnHover: { background: '#8b5cf6', borderColor: '#a78bfa' },
        fileName: { fontFamily: 'ui-monospace', fontSize: 13, color: '#a0a0a0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '8px 12px', background: '#1a1a1a', borderRadius: 10, border: '1px solid #2a2a2a', minWidth: 0, flex: 1 },
        content: { flexGrow: 1, position: 'relative', overflow: 'hidden', background: '#000000', borderRadius: 12, border: '1px solid #1a1a1a' },
        editor: { position: 'absolute', inset: 0, padding: 16, border: 'none', resize: 'none', background: 'transparent', color: '#ffffff', fontFamily: 'ui-monospace', fontSize: 14, lineHeight: 1.55, outline: 'none' },
        pre: { margin: 0, padding: 16, height: '100%', overflow: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'ui-monospace', fontSize: 14, lineHeight: 1.55, color: '#ffffff' },
        compact: { padding: 20, display: "flex", flexDirection: "column", gap: 16, border: "1px dashed #2a2a2a", borderRadius: 16, background: '#0a0a0a', alignItems: 'center' },
        mini: { maxHeight: 220, overflow: 'auto', padding: 14, borderRadius: 10, border: '1px solid #1a1a1a', background: '#000000', fontFamily: 'ui-monospace', fontSize: 13, lineHeight: 1.5, color: '#ffffff' },
        row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
        log: { margin: 0, padding: 16, height: '100%', overflow: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'ui-monospace', fontSize: 13, lineHeight: 1.6, background: '#0a0a0a', color: '#ffffff' },
        debugToggle: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 12, color: '#a0a0a0', padding: '6px 10px', borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a' },
        logFooter: { padding: '12px 16px', borderTop: '1px solid #1a1a1a', background: '#0a0a0a' },
        retryBtn: { padding: '10px 14px', borderRadius: 10, border: '1px solid #2a2a2a', background: '#1a1a1a', cursor: 'pointer', color: '#ffffff', transition: 'all 0.2s ease' },
        exitIcon: { position: 'absolute', top: 18, right: 22, fontSize: 18, color: '#666', cursor: 'pointer', opacity: 0, transform: 'scale(0.9)', transition: 'opacity 0.2s, transform 0.2s', zIndex: 100, userSelect: 'none' },
        helpPanel: { padding: 14, background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 200, overflowY: 'auto' },
        helpTitle: { fontSize: 15, fontWeight: 600, color: '#8b5cf6', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 },
        helpDesc: { fontSize: 13, color: '#ffffff', lineHeight: 1.5, marginBottom: 6 },
        helpExample: { fontSize: 12, color: '#a0a0a0', fontStyle: 'italic', padding: 8, background: '#000000', borderRadius: 6, border: '1px solid #1a1a1a', marginBottom: 8 },
        helpAction: { padding: '8px 16px', background: '#8b5cf6', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s ease', alignSelf: 'flex-start' }
    };

    const [isFull, setFull] = useState(true);  // Start in full-tab mode by default
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
    
    // Advanced compile features from v1
    const [parts, setParts] = useState(1);
    const [groupByFolder, setGroup] = useState(false);
    const [recursiveGrouping, setRecursiveGrouping] = useState(true);
    const [subFilterOpen, setSubFilterOpen] = useState(false);
    const [subList, setSubList] = useState([]);
    const [extFilterOpen, setExtFilterOpen] = useState(false);
    const [extAvail, setExtAvail] = useState(["md"]);
    const [extSel, setExtSel] = useState(["md"]);
    const [suppFile, setSuppFile] = useState(null);
    const [suppInject, setSuppInject] = useState(false);
    const [suppPlace, setSuppPlace] = useState("append");
    const [suppCopy, setSuppCopy] = useState(false);
    const [suppPickOpen, setSuppPickOpen] = useState(false);
    const [suppMgrOpen, setSuppMgrOpen] = useState(false);
    const [suppMgrPickOpen, setSuppMgrPickOpen] = useState(false);
    const [supplements, setSupplements] = useState([]);
    const [suppCreateDir, setSuppCreateDir] = useState(null);
    const [suppCreateDirPickerOpen, setSuppCreateDirPickerOpen] = useState(false);
    const [showInspector, setShowInspector] = useState(true);
    const [helpOpen, setHelpOpen] = useState(false);
    const [chooseBaseOpen, setChooseBaseOpen] = useState(false);
    const [unifiedFilterOpen, setUnifiedFilterOpen] = useState(false);
    
    // New modal states for a) Universal Compile and b) Batch Operations
    const [universalCompileOpen, setUniversalCompileOpen] = useState(false);
    const [batchOpsOpen, setBatchOpsOpen] = useState(false);
    const [selectedFilesForBatch, setSelectedFilesForBatch] = useState([]);
    
    // Help panel state
    const [activeHelp, setActiveHelp] = useState(null);
    const helpInfoRef = useRef(null);

    useEffect(() => {
        const el = containerRef.current; 
        if (!el) return;
        if (!isFull) return; // Only mount when in full-tab mode
        
        // Check if parent exists, if not, retry
        if (!el.parentNode) { 
            setTimeout(() => setFull(true), 50); 
            return; 
        }
        
        const leaf = findNearestAncestorWithClass(el, 'workspace-leaf-content'); 
        if (!leaf) { 
            setFull(false); 
            return; 
        } 
        
        const wrapper = findDirectChildByClass(leaf, 'view-content') || leaf; 
        stateRefs.originalParent = el.parentNode; 
        stateRefs.placeholder = document.createElement('div'); 
        stateRefs.placeholder.style.display = 'none';
        el.parentNode.insertBefore(stateRefs.placeholder, el); 
        
        const pos = window.getComputedStyle(wrapper).position; 
        stateRefs.parentPosition = { element: wrapper, original: pos }; 
        if (pos === 'static') wrapper.style.position = 'relative'; 
        
        wrapper.appendChild(el); 
        Object.assign(el.style, { 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%", 
            zIndex: 9998, 
            overflow: "auto" 
        });
        
        return () => { 
            if (!stateRefs.originalParent) return; 
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(el, stateRefs.placeholder);
            } else {
                stateRefs.originalParent.appendChild(el);
            }
            if (stateRefs.parentPosition?.element) {
                stateRefs.parentPosition.element.style.position = 
                    stateRefs.parentPosition.original === 'static' ? '' : stateRefs.parentPosition.original;
            }
            el.removeAttribute("style"); 
            Object.keys(stateRefs).forEach(k => stateRefs[k] = null); 
        };
    }, [isFull]);

    useEffect(() => { if (logContainerRef.current) { logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight; } }, [logMessages]);

    // Default creation dir when base folder changes (from v1)
    useEffect(() => {
        if (baseFolder && baseFolder.path) {
            setSuppCreateDir((baseFolder.path === "/" ? "" : baseFolder.path) + "/_supplements");
        } else {
            setSuppCreateDir("Supplements");
        }
    }, [baseFolder]);

    const loadFile = async (f) => { if (!f) { new Notice("No file specified.", 2500); return false; } setLogMessages([]); setFailedFiles([]); setStatus("loading"); try { setFile(f); const content = await dc.app.vault.cachedRead(f); setFileContent(content); setEdited(content); setStatus("loaded"); setEditing(false); return true; } catch (e) { setFileContent(`Error loading file:\n${e.message}`); setStatus("error"); return false; } };
    const enterFull = () => setFull(true);
    const exitFull = (e) => { e.stopPropagation(); setEditing(false); setFull(false); setStatus("idle"); };
    const save = async () => { if (!file) return; setStatus("saving"); try { await dc.app.vault.modify(file, edited); setFileContent(edited); setEditing(false); setStatus("loaded"); new Notice(`Saved "${file.basename}".`); } catch (e) { setStatus("loaded"); new Notice(`Save failed: ${e.message}`, 5000); } };
    const openInPane = async () => { const t = file || dc.app.workspace.getActiveFile(); if (!t) return; await dc.app.workspace.getLeaf(false).openFile(t); };
    const copyToClipboard = async () => { const txt = editing ? edited : fileContent; if (!txt) return; await navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 1200); };
    const compileSingleFolder = async (folder) => { if (!folder?.path) { new Notice("No folder selected."); return; } setFldOpen(false); setLogMessages([]); setFailedFiles([]); setStatus("compiling"); try { const allFiles = []; const stack = [folder]; while (stack.length) { const cur = stack.pop(); if (cur?.children) for (const ch of cur.children) ch?.children ? stack.push(ch) : allFiles.push(ch); } if (allFiles.length === 0) { new Notice("No files to compile in this folder."); setStatus("idle"); return; } const partsArr = []; for (const f of allFiles) { try { const c = await dc.app.vault.cachedRead(f); partsArr.push(`## ${f.path}\n\n${c}\n`); } catch (e) { partsArr.push(`## ${f.path}\n\n> [Skipped: ${e.message}]\n`); } } const body = partsArr.join("\n---\n"); const ts = new Date().toISOString().replace(/[:.]/g, "-"); const safeName = (folder.name || "root").replace(/[\\/:*?"<>|]/g, "-"); const outDir = (folder.path === "/" ? "" : folder.path) ? pathJoin(folder.path, "_compiled") : "_compiled"; await ensureFolder(outDir); const outPath = ensureUniquePath(pathJoin(outDir, `compiled-${safeName}-${ts}.md`)); const created = await dc.app.vault.create(outPath, `# Compiled from ${folder.path}\n\n${body}`); new Notice(`Successfully compiled into ${created.path}`); const ok = await loadFile(created); if (ok && !isFull) setFull(true); } catch (e) { new Notice(`Compile failed: ${e.message}`); } finally { if (status !== 'loaded') setStatus("idle"); } };
    const compileMultipleSubfolders = async (groupAssignments, compileSeparately) => { if (!groupAssignments || groupAssignments.size === 0) { new Notice("No subfolders were selected for grouping."); return; } setLogMessages([]); setFailedFiles([]); setStatus("compiling"); const v = dc.app.vault; let createdCount = 0; const outDir = baseFolder.path === "/" ? "_compiled" : pathJoin(baseFolder.path, "_compiled"); await ensureFolder(outDir); if (compileSeparately) { const selectedFolders = [...groupAssignments.keys()]; for (const folderPath of selectedFolders) { const folder = v.getAbstractFileByPath(folderPath); if (!folder || !folder.children) continue; const allFiles = []; const stack = [folder]; while (stack.length) { const cur = stack.pop(); if (cur?.children) for (const ch of cur.children) ch?.children ? stack.push(ch) : allFiles.push(ch); } if (allFiles.length === 0) continue; const partsArr = []; for (const f of allFiles) { try { const c = await v.cachedRead(f); partsArr.push(`## ${f.path}\n\n${c}\n`); } catch (e) { /* skip */ } } if (partsArr.length === 0) continue; const body = partsArr.join("\n---\n"); const safeName = folder.name.replace(/[\\/:*?"<>|]/g, "-"); const outPath = ensureUniquePath(pathJoin(outDir, `compiled-${safeName}.md`)); await v.create(outPath, `# Compiled from ${folder.path}\n\n${body}`); createdCount++; } } else { const groups = new Map(); for (const [folderPath, groupSet] of groupAssignments.entries()) { for (const groupNum of groupSet) { if (!groups.has(groupNum)) groups.set(groupNum, []); groups.get(groupNum).push(folderPath); } } for (const [groupNum, folderPaths] of groups.entries()) { const partsArr = []; for (const folderPath of folderPaths) { const folder = v.getAbstractFileByPath(folderPath); if (!folder || !folder.children) continue; const allFiles = []; const stack = [folder]; while (stack.length) { const cur = stack.pop(); if (cur?.children) for (const ch of cur.children) ch?.children ? stack.push(ch) : allFiles.push(ch); } for (const f of allFiles) { try { const c = await v.cachedRead(f); partsArr.push(`## ${f.path}\n\n${c}\n`); } catch (e) {/* skip */} } } if (partsArr.length === 0) continue; const body = partsArr.join("\n---\n"); const outPath = ensureUniquePath(pathJoin(outDir, `compiled-group-${groupNum}.md`)); await v.create(outPath, `# Compiled from Group ${groupNum}\n\n${body}`); createdCount++; } } new Notice(`Finished: Created ${createdCount} compiled file(s).`); setStatus("idle"); };
    const openMultiCompile = () => { const activeFile = dc.app.workspace.getActiveFile(); const base = activeFile ? activeFile.parent : dc.app.vault.getRoot(); setBaseFolder(base); setMultiCompileOpen(true); };
    const generateSubfolderList = (parentFolder) => { if (!parentFolder?.children) { new Notice("Not a valid folder or it has no contents.", 3000); return; } const folderNames = []; for (const child of parentFolder.children) { if (child.children) { folderNames.push(child.name); } } folderNames.sort((a, b) => a.localeCompare(b)); setTargetFolderName(parentFolder.name || "Vault Root"); setSubfolderList(folderNames); setListFoldersModalOpen(true); };
    const compileFromFormattedList = async (categories, baseFolder) => { setLogMessages([]); setFailedFiles([]); setStatus("compiling"); const v = dc.app.vault; let createdCount = 0; const getAllFilesInFolder = (folder) => { const files = []; const stack = [folder]; while (stack.length) { const current = stack.pop(); if (current.children) { for (const child of current.children) { if (child.children) stack.push(child); else if (child.path.toLowerCase().endsWith('.md')) files.push(child); } } } return files; }; const filesToSearch = baseFolder ? getAllFilesInFolder(baseFolder) : v.getMarkdownFiles(); const findFileByName = (name) => { const exactMatch = filesToSearch.find(f => f.basename === name); if (exactMatch) return exactMatch; const lowerName = name.toLowerCase(); const pathMatch = filesToSearch.find(f => f.path.toLowerCase().includes(lowerName)); return pathMatch || null; }; const outDir = baseFolder && baseFolder.path !== "/" ? pathJoin(baseFolder.path, "_compiled") : "_compiled"; await ensureFolder(outDir); for (const categoryName in categories) { const entries = categories[categoryName]; if (!Array.isArray(entries) || entries.length === 0) continue; const partsArr = []; for (const entryName of entries) { const file = findFileByName(entryName); if (file) { try { const content = await v.cachedRead(file); partsArr.push(`## ${file.path}\n\n${content}\n`); } catch (e) { partsArr.push(`## ${entryName}\n\n> [Skipped: Could not read file: ${file.path}]\n`); } } else { partsArr.push(`## ${entryName}\n\n> [Skipped: File not found in scope]\n`); } } const body = partsArr.join("\n---\n"); const safeName = categoryName.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, '_'); const outPath = ensureUniquePath(pathJoin(outDir, `compiled-category-${safeName}.md`)); await v.create(outPath, `# Compiled Category: ${categoryName}\n\n${body}`); createdCount++; } new Notice(`Finished: Created ${createdCount} compiled file(s) from JSON.`); setStatus("idle"); };
    
    // Advanced compile functions from v1
    const pickBaseFolder = (f) => {
        if (!f?.path) return;
        setBaseFolder(f);
        const { exts } = collectFilesAndExtensions(f);
        setExtAvail(exts.length ? exts : ["md"]);
        if (!extSel?.length) setExtSel(["md"]);
        setChooseBaseOpen(false);
        new Notice(`Base folder set: ${f.path}`, 2000);
    };

    const collectFilesAndExtensions = (folder) => {
        const files = [];
        const exts = new Set();
        const stack = [folder];
        while (stack.length) {
            const cur = stack.pop();
            if (cur?.children) {
                for (const ch of cur.children) {
                    if (ch?.children) stack.push(ch);
                    else {
                        files.push(ch);
                        if (ch.extension) exts.add(ch.extension.toLowerCase());
                    }
                }
            }
        }
        return { files, exts: Array.from(exts).sort() };
    };

    const filterBySubfolders = (folder, files) => {
        if (!baseFolder || baseFolder.path !== folder.path) return files;
        if (subList.length === 0) return files;
        const base = folder.path === "/" ? "" : folder.path;
        const abs = subList.map((rel) => pathJoin(base, rel));
        return files.filter((f) => abs.some((a) => f.path === a || f.path.startsWith(a + "/")));
    };

    const filterByExt = (files) => {
        const chosen = new Set((extSel && extSel.length ? extSel : ["md"]).map((e) => e.toLowerCase()));
        return files.filter((f) => chosen.has((f.extension || "").toLowerCase()));
    };

    const readSuppText = async (sf) => {
        const txt = await dc.app.vault.cachedRead(sf.file);
        const banner = `> **Supplementary**: ${sf.file.path}\n\n`;
        return { text: `${banner}${txt}`, placement: sf.placement };
    };

    const collectSuppStacks = async () => {
        const entries = [];
        for (const s of supplements) entries.push(s);
        if (suppFile) entries.push({ file: suppFile, inject: suppInject, placement: suppPlace, copy: suppCopy, recursive: true });
        const prepend = [];
        const append = [];
        const copyList = [];
        for (const s of entries) {
            if (s.copy) copyList.push({ file: s.file, recursive: !!s.recursive });
            if (s.inject) {
                try {
                    const t = await readSuppText({ file: s.file, placement: s.placement });
                    (t.placement === "prepend" ? prepend : append).push(t.text);
                } catch (e) {
                    new Notice(`Failed reading supplementary: ${s.file.path}`, 2500);
                }
            }
        }
        return { prepend, append, copyList };
    };

    const applyInjections = (compiled, stacks) => {
        const sep = "\n---\n";
        let out = compiled;
        if (stacks.prepend.length) out = stacks.prepend.join(sep) + sep + out;
        if (stacks.append.length) out = out + sep + stacks.append.join(sep);
        return out;
    };

    const copySuppToDir = async (dirPath, stacks, topLevel = false) => {
        const v = dc.app.vault;
        for (const it of stacks.copyList) {
            if (topLevel === true && it.recursive) continue;
            if (topLevel === false && !it.recursive) continue;
            try {
                const supTxt = await dc.app.vault.cachedRead(it.file);
                const baseName = it.file.name || (it.file.path.split("/").pop() || "supplement.md");
                const dest = ensureUniquePath(pathJoin(dirPath, baseName));
                if (!v.getAbstractFileByPath(dest)) await v.create(dest, supTxt);
            } catch (e) {
                new Notice(`Copy supplementary failed in ${dirPath}: ${e.message}`, 4000);
            }
        }
    };

    const splitEven = (body, partsCount, folderPath, label, stacks) => {
        const sep = "\n---\n";
        const sections = body.split(sep);
        const target = Math.ceil(body.length / partsCount);
        const chunks = [];
        let bucket = [], len = 0;
        for (const sec of sections) {
            const l = sec.length + sep.length;
            if (len >= target && chunks.length < partsCount - 1) {
                chunks.push(bucket.join(sep));
                bucket = [sec];
                len = l;
            } else {
                bucket.push(sec);
                len += l;
            }
        }
        chunks.push(bucket.join(sep));
        const ts = new Date().toLocaleString();
        return chunks.map((c, i) =>
            applyInjections(
                `# Compiled from ${folderPath}${label ? ` • ${label}` : ""}\n\nGenerated: ${ts}\nPart ${i + 1} of ${partsCount}\n\n${c}`,
                stacks
            )
        );
    };

    const compileFlat = async (folder, files, outDir, count, stacks) => {
        const sections = [];
        for (const f of files) {
            try {
                const c = await dc.app.vault.cachedRead(f);
                sections.push(`## ${f.path}\n\n${c}\n`);
            } catch (e) {
                sections.push(`## ${f.path}\n\n> [Skipped: ${e.message}]\n`);
            }
        }
        const body = sections.join("\n---\n");
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const safe = (folder.name || "root").replace(/[\\/:*?"<>|]/g, "-");
        if (count <= 1) {
            const compiled = applyInjections(
                `# Compiled from ${folder.path}\n\nGenerated: ${new Date().toLocaleString()}\n\n${body}`,
                stacks
            );
            const p = pathJoin(outDir, `compiled-${safe}-${ts}.md`);
            const created = await dc.app.vault.create(p, compiled);
            await copySuppToDir(outDir, stacks, true);
            return [created];
        } else {
            const texts = splitEven(body, count, folder.path, null, stacks);
            const created = [];
            for (let i = 0; i < texts.length; i++) {
                const p = pathJoin(outDir, `compiled-${safe}-${ts}-part-${String(i + 1).padStart(2, "0")}-of-${String(texts.length).padStart(2, "0")}.md`);
                created.push(await dc.app.vault.create(p, texts[i]));
            }
            await copySuppToDir(outDir, stacks, true);
            return created;
        }
    };

    const compileGrouped = async (folder, files, outDir, count, stacks) => {
        const basePrefix = folder.path === "/" ? "" : folder.path + "/";
        const groups = new Map();
        for (const f of files) {
            const rel = f.path.startsWith(basePrefix) ? f.path.slice(basePrefix.length) : f.path;
            const dir = rel.includes("/") ? rel.substring(0, rel.lastIndexOf("/")) : "";
            const key = recursiveGrouping ? (dir || "_root") : (dir.split("/")[0] || "_root");
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(f);
        }
        const createdAll = [];
        for (const [seg, arr] of groups.entries()) {
            const segSafe = seg.replace(/[\\/:*?"<>|]/g, "-") || "_root";
            const segDir = pathJoin(outDir, segSafe);
            await ensureFolder(segDir);
            const sections = [];
            for (const f of arr) {
                try {
                    const c = await dc.app.vault.cachedRead(f);
                    sections.push(`## ${f.path}\n\n${c}\n`);
                } catch (e) {
                    sections.push(`## ${f.path}\n\n> [Skipped: ${e.message}]\n`);
                }
            }
            const body = sections.join("\n---\n");
            const ts = new Date().toISOString().replace(/[:.]/g, "-");
            const safe = (folder.name || "root").replace(/[\\/:*?"<>|]/g, "-");
            if (count <= 1) {
                const compiled = applyInjections(
                    `# Compiled from ${folder.path} • ${seg || "_root"}\n\nGenerated: ${new Date().toLocaleString()}\n\n${body}`,
                    stacks
                );
                const p = pathJoin(segDir, `compiled-${safe}-${segSafe}-${ts}.md`);
                const created = await dc.app.vault.create(p, compiled);
                createdAll.push(created);
            } else {
                const texts = splitEven(body, count, folder.path, seg, stacks);
                for (let i = 0; i < texts.length; i++) {
                    const p = pathJoin(segDir, `compiled-${safe}-${segSafe}-${ts}-part-${String(i + 1).padStart(2, "0")}-of-${String(texts.length).padStart(2, "0")}.md`);
                    createdAll.push(await dc.app.vault.create(p, texts[i]));
                }
            }
            await copySuppToDir(segDir, stacks, false);
        }
        await copySuppToDir(outDir, stacks, true);
        return createdAll;
    };

    const compileCurrent = async () => {
        try {
            if (!baseFolder || !baseFolder.path) {
                setChooseBaseOpen(true);
                new Notice("Pick a base folder first.", 2500);
                return;
            }
            setStatus("compiling");
            const { files: allFiles } = collectFilesAndExtensions(baseFolder);
            const afterSub = filterBySubfolders(baseFolder, allFiles);
            const afterExt = filterByExt(afterSub);
            if (afterExt.length === 0) {
                setStatus("loaded");
                new Notice("No files matched your filters.", 4000);
                return;
            }
            const outDir = (baseFolder.path === "/" ? "" : baseFolder.path) ? pathJoin(baseFolder.path, "_compiled") : "_compiled";
            await ensureFolder(outDir);
            const stacks = await collectSuppStacks();
            const count = Math.max(1, Number.isFinite(+parts) ? Math.max(1, Math.floor(+parts)) : 1);
            const created = groupByFolder ? await compileGrouped(baseFolder, afterExt, outDir, count, stacks) : await compileFlat(baseFolder, afterExt, outDir, count, stacks);
            if (created.length) {
                const first = created[0];
                setFile(first);
                const txt = await dc.app.vault.cachedRead(first);
                setFileContent(txt);
                setEdited(txt);
                setEditing(false);
                setFull(true);
                setStatus("loaded");
                new Notice(`Created ${created.length} file(s) in ${outDir}`, 4500);
            } else {
                setStatus("loaded");
                new Notice("Nothing created.", 3000);
            }
        } catch (e) {
            setStatus("loaded");
            new Notice(`Compile failed: ${e.message}`, 6000);
        }
    };

    const createSupplementFile = async (rawName) => {
        try {
            const v = dc.app.vault;
            if (!suppCreateDir) {
                new Notice("Pick a folder for creation.", 2500);
                return;
            }
            const parts = suppCreateDir.replace(/^\//, "").split("/").filter(Boolean);
            let acc = "";
            for (const p of parts) {
                acc = acc ? acc + "/" + p : p;
                if (!v.getAbstractFileByPath(acc)) await v.createFolder(acc);
            }
            let name = sanitizeFileName(rawName);
            if (!name) {
                new Notice("Invalid file name.", 2500);
                return;
            }
            if (!/\.[a-z0-9]+$/i.test(name)) name += ".md";
            if (name.includes("/")) {
                new Notice("Please enter only a file name (no '/').", 3000);
                return;
            }
            const target = pathJoin(suppCreateDir, name);
            const unique = ensureUniquePath(target);
            const now = new Date().toLocaleString();
            const body = `# Supplement\n\nCreated: ${now}\n\n(Add content here)\n`;
            const created = await v.create(unique, body);
            setSupplements((list) => [...list, { file: created, inject: true, placement: "append", copy: true, recursive: true }]);
            new Notice(`Created ${created.path} and added to supplements.`, 3500);
        } catch (e) {
            new Notice(`Create failed: ${e.message}`, 5000);
        }
    };
    
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

    // Help information for each button - defined after all functions
    const HELP_INFO = {
        'file-picker': { title: 'Choose File', desc: 'Select a markdown file to view or edit in the main panel.', example: 'Click to browse your vault and pick any .md file to load.', action: () => setFpOpen(true) },
        'base-folder': { title: 'Pick Base Folder', desc: 'Set the base folder for advanced compile operations. All subfolders and filters will be relative to this folder.', example: 'Select "Projects" folder, then compile all nested markdown files.', action: () => setChooseBaseOpen(true) },
        'group-folder': { title: 'Toggle Grouping', desc: 'Switch between grouped output (organized by subfolder) and flat output (all files in one document).', example: 'Grouped: Each subfolder gets its own section. Flat: All content merged.', action: () => setGroup(v => !v) },
        'recursive': { title: 'Recursive Grouping', desc: 'When ON, subfolders are processed recursively (includes nested folders). When OFF, only immediate children.', example: 'ON: Process /folder/sub1/sub2. OFF: Only /folder/sub1.', action: () => setRecursiveGrouping(v => !v) },
        'subfolder-filter': { title: 'Subfolder Filter', desc: 'Choose specific subfolders to include in compilation. Leave empty to include all.', example: 'Only compile files from "Research" and "Notes" subfolders.', action: () => setSubFilterOpen(true) },
        'extension-filter': { title: 'Extension Filter', desc: 'Filter files by extension type (md, txt, etc). Useful for excluding certain file types.', example: 'Only include .md files, exclude .txt and .pdf.', action: () => setExtFilterOpen(true) },
        'unified-filter': { title: 'Unified Filters', desc: 'All-in-one filter modal: subfolders, extensions, file size, date range, and name patterns.', example: 'Filter: .md files, modified this week, larger than 5KB, matching "daily*".', action: () => setUnifiedFilterOpen(true) },
        'compile-current': { title: 'Compile Now', desc: 'Execute compilation using current base folder, filters, grouping, and parts settings.', example: 'After setting filters and options, click to generate compiled output.', action: compileCurrent },
        'supplement-manager': { title: 'Supplement Manager', desc: 'Manage supplementary files to inject or copy alongside compiled outputs.', example: 'Add header.md and footer.md to prepend/append to all compiled files.', action: () => setSuppMgrOpen(true) },
        'supplement-quick': { title: 'Quick Supplement', desc: 'Quickly pick a single supplementary file without opening full manager.', example: 'Select "template.md" to use as quick supplement.', action: () => setSuppPickOpen(true) },
        'supplement-inject': { title: 'Toggle Inject', desc: 'When ON, supplement content is inserted into compiled files. When OFF, just copied alongside.', example: 'ON: Template content appears inside output. OFF: Template copied as separate file.', action: () => setSuppInject(v => !v) },
        'supplement-placement': { title: 'Supplement Placement', desc: 'Toggle between prepend (top) and append (bottom) for supplement injection.', example: 'Prepend: Header at top. Append: Footer at bottom.', action: () => setSuppPlace(p => p === "append" ? "prepend" : "append") },
        'supplement-copy': { title: 'Copy Supplement', desc: 'When ON, supplement files are copied next to compiled outputs.', example: 'Copy styles.css alongside every compiled markdown file.', action: () => setSuppCopy(v => !v) },
        'compile-single': { title: 'Compile Single Folder', desc: 'Quick compile: Select a folder and combine all its files into one document.', example: 'Select "Meeting Notes" folder → get one combined document.', action: () => setFldOpen(true) },
        'compile-multi': { title: 'Compile Multiple Subfolders', desc: 'Advanced: Select multiple subfolders, assign to groups, compile separately or together.', example: 'Compile "Research" and "Ideas" as separate groups or combined.', action: openMultiCompile },
        'list-subfolders': { title: 'List Subfolders', desc: 'Generate a text list of all subfolders in a directory (useful for documentation).', example: 'Get a formatted list of all project subfolders for README.', action: () => setFolderPickerForListOpen(true) },
        'compile-json': { title: 'Compile from JSON', desc: 'Provide JSON configuration with categories and file names for custom compilation.', example: '{"Chapter 1": ["intro.md", "part1.md"], "Chapter 2": ["part2.md"]}.', action: () => { setListCompilerBaseFolder(null); setListCompilerOpen(true); } },
        'universal-compile': { title: 'Universal Compile', desc: 'All-in-one compile modal with tabs: Simple, Advanced, Multi-Folder, and JSON modes.', example: 'One interface for all compilation needs with format selection (MD/HTML/TXT).', action: () => setUniversalCompileOpen(true) },
        'batch-ops': { title: 'Batch Operations', desc: 'Perform bulk operations: rename, move, tag, delete, copy, or archive multiple files at once.', example: 'Rename 50 files with pattern, or move all PDFs to archive folder.', action: () => setBatchOpsOpen(true) },
        'delete-svg': { title: 'Delete SVG Files', desc: 'Batch delete all .svg files in a folder (useful for cleaning up exports).', example: 'Remove all SVG diagrams from export folder after converting to PNG.', action: () => setSvgDeletePickerOpen(true) },
        'help': { title: 'Help & Legend', desc: 'View complete icon legend and usage instructions for all features.', example: 'Learn keyboard shortcuts, typical workflows, and advanced features.', action: () => setHelpOpen(true) },
        'inspector': { title: 'Toggle Inspector', desc: 'Show/hide the settings summary panel displaying current configuration.', example: 'View active base folder, filters, grouping mode, and supplement settings.', action: () => setShowInspector(s => !s) },
        'debug': { title: 'Debug Mode', desc: 'Enable detailed logging for troubleshooting compilation and file operations.', example: 'See exactly which files are processed and any errors encountered.', action: () => setDebugMode(v => !v) },
        'edit': { title: 'Edit Mode', desc: 'Switch to editing mode to modify the currently loaded file.', example: 'Make changes to the compiled output before saving.', action: () => setEditing(true) },
        'save': { title: 'Save Changes', desc: 'Save modifications to the current file.', example: 'After editing compiled output, save changes to vault.', action: save },
        'cancel': { title: 'Cancel Edit', desc: 'Discard changes and exit editing mode.', example: 'Revert to original content without saving.', action: () => { setEditing(false); setEdited(fileContent); } },
        'open-pane': { title: 'Open in New Pane', desc: 'Open the current file in a separate Obsidian pane for side-by-side viewing.', example: 'View compiled output in one pane while working in another.', action: openInPane },
        'copy': { title: 'Copy to Clipboard', desc: 'Copy the current file content to your clipboard.', example: 'Copy compiled markdown to paste into email or another app.', action: copyToClipboard }
    };

    // Helper component for buttons with help integration
    const HelpButton = ({ helpId, icon, title, onClick, active = false }) => (
        <button 
            className="icon-btn" 
            style={{...STYLES.iconBtn, ...(activeHelp === helpId ? STYLES.iconBtnActive : {})}} 
            title={title}
            onClick={(e) => {
                e.stopPropagation();
                if (activeHelp === helpId) {
                    setActiveHelp(null);
                } else {
                    setActiveHelp(helpId);
                    setTimeout(() => helpInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
                }
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                setActiveHelp(null);
                onClick();
            }}
        >
            <dc.Icon icon={icon} />
        </button>
    );

    return (
        <div ref={containerRef}>
            <style>{`
                .${uniqueWrapperClass}:hover .subtle-exit-icon {
                    opacity: 0.7;
                    transform: scale(1);
                }
                .${uniqueWrapperClass} .subtle-exit-icon {
                    opacity: 0;
                    transform: scale(0.9);
                    transition: opacity 0.2s, transform 0.2s;
                }
                .${uniqueWrapperClass} .subtle-exit-icon:hover {
                    opacity: 1;
                    color: #8b5cf6;
                }
                .${uniqueWrapperClass} .icon-btn:hover {
                    background: #8b5cf6;
                    border-color: #a78bfa;
                    transform: translateY(-1px);
                }
                .${uniqueWrapperClass} .button-row::-webkit-scrollbar {
                    height: 6px;
                }
                .${uniqueWrapperClass} .button-row::-webkit-scrollbar-track {
                    background: #1a1a1a;
                    border-radius: 3px;
                }
                .${uniqueWrapperClass} .button-row::-webkit-scrollbar-thumb {
                    background: #8b5cf6;
                    border-radius: 3px;
                }
                .${uniqueWrapperClass} .button-row::-webkit-scrollbar-thumb:hover {
                    background: #a78bfa;
                }
            `}</style>
            <FilePicker isOpen={fpOpen} onClose={() => setFpOpen(false)} onSelectFile={async f => { setFpOpen(false); await loadFile(f); }} />
            <FolderPicker isOpen={fldOpen} onClose={() => setFldOpen(false)} onSelectFolder={compileSingleFolder} />
            <MultiSubfolderCompilerModal isOpen={multiCompileOpen} onClose={() => setMultiCompileOpen(false)} baseFolder={baseFolder} onCompile={compileMultipleSubfolders} />
            <FolderPicker isOpen={folderPickerForListOpen} onClose={() => setFolderPickerForListOpen(false)} onSelectFolder={(folder) => { setFolderPickerForListOpen(false); generateSubfolderList(folder); }} />
            <ListSubfoldersModal isOpen={listFoldersModalOpen} onClose={() => setListFoldersModalOpen(false)} subfolders={subfolderList} folderName={targetFolderName} />
            <FolderPicker isOpen={folderPickerForListCompilerOpen} onClose={() => setFolderPickerForListCompilerOpen(false)} onSelectFolder={(folder) => { setListCompilerBaseFolder(folder); setFolderPickerForListCompilerOpen(false); }} zIndex={10002}/>
            <FormattedListCompilerModal isOpen={listCompilerOpen} onClose={() => setListCompilerOpen(false)} onCompile={compileFromFormattedList} baseFolder={listCompilerBaseFolder} onSelectFolder={() => setFolderPickerForListCompilerOpen(true)}/>
            <FolderPicker isOpen={svgDeletePickerOpen} onClose={() => setSvgDeletePickerOpen(false)} onSelectFolder={deleteSvgsInFolder} />
            
            {/* Advanced compile modals from v1 */}
            <FolderPicker isOpen={chooseBaseOpen} onClose={() => setChooseBaseOpen(false)} onSelectFolder={pickBaseFolder} zIndex={10000} />
            <FilePicker isOpen={suppPickOpen} onClose={() => setSuppPickOpen(false)} onSelectFile={(f) => { setSuppFile(f); setSuppPickOpen(false); new Notice(`Supplement set: ${f.path}`, 2000); }} />
            <FilePicker isOpen={suppMgrPickOpen} onClose={() => setSuppMgrPickOpen(false)} onSelectFile={(f) => { setSuppMgrPickOpen(false); setSupplements((list) => [...list, { file: f, inject: true, placement: "append", copy: true, recursive: true }]); }} />
            <FolderPicker isOpen={suppCreateDirPickerOpen} onClose={() => setSuppCreateDirPickerOpen(false)} onSelectFolder={(f) => { setSuppCreateDir(f.path); setSuppCreateDirPickerOpen(false); }} zIndex={10002} />
            <SubfolderFilterModal isOpen={subFilterOpen} onClose={() => setSubFilterOpen(false)} baseFolder={baseFolder} selected={subList} onApply={setSubList} />
            <ExtFilterModal isOpen={extFilterOpen} onClose={() => setExtFilterOpen(false)} available={extAvail} selected={extSel} onApply={setExtSel} />
            <SupplementManagerModal isOpen={suppMgrOpen} onClose={() => setSuppMgrOpen(false)} supplements={supplements} onChange={setSupplements} onAddRequest={() => setSuppMgrPickOpen(true)} createDir={suppCreateDir} onPickCreateDir={() => setSuppCreateDirPickerOpen(true)} onCreateNew={createSupplementFile} />
            <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
            
            {/* New enhanced modals: a) Universal Compile and b) Batch Operations */}
            <UniversalCompileModal isOpen={universalCompileOpen} onClose={() => setUniversalCompileOpen(false)} baseFolder={baseFolder} />
            <BatchOperationsModal isOpen={batchOpsOpen} onClose={() => setBatchOpsOpen(false)} selectedFiles={selectedFilesForBatch} />

            {isFull ? (
                <div style={STYLES.wrap} className={uniqueWrapperClass}>
                    <span className="subtle-exit-icon" style={STYLES.exitIcon} title="Exit Full Tab" onClick={exitFull}>&lt;/&gt;</span>
                    
                    <div style={STYLES.bar}>
                        {/* Row 1: File and Folder Operations */}
                        <div className="button-row" style={STYLES.buttonRow}>
                            <HelpButton helpId="file-picker" icon="file-text" title="Choose File to View" onClick={() => setFpOpen(true)} />
                            <HelpButton helpId="base-folder" icon="folder-open" title="Pick Base Folder" onClick={() => setChooseBaseOpen(true)} />
                            <div style={STYLES.fileName} title={baseFolder ? baseFolder.path : "No base folder"}>Base: {baseFolder ? baseFolder.path : "—"}</div>
                        </div>

                        {/* Row 2: Grouping and Filter Controls */}
                        <div className="button-row" style={STYLES.buttonRow}>
                            <HelpButton helpId="group-folder" icon={groupByFolder ? "folder-tree" : "list"} title={groupByFolder ? "Grouping: by folder" : "Grouping: flat"} onClick={() => setGroup(v => !v)} />
                            <HelpButton helpId="recursive" icon="repeat" title={recursiveGrouping ? "Recursion: ON" : "Recursion: OFF"} onClick={() => setRecursiveGrouping(v => !v)} />
                            <HelpButton helpId="subfolder-filter" icon="filter" title="Subfolder Filter" onClick={() => setSubFilterOpen(true)} />
                            <HelpButton helpId="extension-filter" icon="file-type" title="Extension Filter" onClick={() => setExtFilterOpen(true)} />
                            <HelpButton helpId="unified-filter" icon="sliders-horizontal" title="Unified Filters" onClick={() => setUnifiedFilterOpen(true)} />
                            
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '6px 10px', borderRadius: 10, flexShrink: 0 }}>
                                <span style={{ fontSize: 12, color: '#a0a0a0', whiteSpace: 'nowrap' }}>Parts</span>
                                <input style={{ width: 64, padding: '6px 8px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#000000', color: '#ffffff', fontSize: 13, textAlign: 'center' }} type="number" min={1} step={1} value={parts} onChange={e => setParts(Math.max(1, parseInt(e.target.value || "1", 10)))} />
                                <HelpButton helpId="compile-current" icon="play-circle" title="Compile Now" onClick={compileCurrent} />
                            </div>
                        </div>

                        {/* Row 3: Supplement Controls */}
                        <div className="button-row" style={STYLES.buttonRow}>
                            <HelpButton helpId="supplement-manager" icon="package" title="Supplement Manager" onClick={() => setSuppMgrOpen(true)} />
                            <HelpButton helpId="supplement-quick" icon="paperclip" title="Quick Supplement" onClick={() => setSuppPickOpen(true)} />
                            <HelpButton helpId="supplement-inject" icon={suppInject ? "toggle-right" : "toggle-left"} title={`Inject: ${suppInject ? "ON" : "OFF"}`} onClick={() => setSuppInject(v => !v)} />
                            <HelpButton helpId="supplement-placement" icon={suppPlace === "append" ? "arrow-down" : "arrow-up"} title={`Placement: ${suppPlace}`} onClick={() => setSuppPlace(p => p === "append" ? "prepend" : "append")} />
                            <HelpButton helpId="supplement-copy" icon={suppCopy ? "check-square" : "square"} title={`Copy: ${suppCopy ? "ON" : "OFF"}`} onClick={() => setSuppCopy(v => !v)} />
                        </div>

                        {/* Row 4: Compile Operations */}
                        <div className="button-row" style={STYLES.buttonRow}>
                            <HelpButton helpId="compile-single" icon="folder" title="Compile Single Folder" onClick={() => setFldOpen(true)} />
                            <HelpButton helpId="compile-multi" icon="folders" title="Compile Multiple Subfolders" onClick={openMultiCompile} />
                            <HelpButton helpId="list-subfolders" icon="list-tree" title="List Subfolders" onClick={() => setFolderPickerForListOpen(true)} />
                            <HelpButton helpId="compile-json" icon="braces" title="Compile from JSON" onClick={() => { setListCompilerBaseFolder(null); setListCompilerOpen(true); }} />
                            <HelpButton helpId="universal-compile" icon="target" title="Universal Compile" onClick={() => setUniversalCompileOpen(true)} />
                            <HelpButton helpId="batch-ops" icon="zap" title="Batch Operations" onClick={() => setBatchOpsOpen(true)} />
                            <HelpButton helpId="delete-svg" icon="trash-2" title="Delete SVG Files" onClick={() => setSvgDeletePickerOpen(true)} />
                        </div>

                        {/* Row 5: View and Utility Controls */}
                        <div className="button-row" style={STYLES.buttonRow}>
                            <HelpButton helpId="help" icon="help-circle" title="Help & Legend" onClick={() => setHelpOpen(true)} />
                            <HelpButton helpId="inspector" icon="eye" title={showInspector ? "Hide Inspector" : "Show Inspector"} onClick={() => setShowInspector(s => !s)} />
                            <label style={STYLES.debugToggle} title="Toggle Debug Mode" onClick={() => { setActiveHelp(activeHelp === 'debug' ? null : 'debug'); }}><input type="checkbox" checked={isDebugMode} onChange={e => setDebugMode(e.target.checked)} /><dc.Icon icon="bug" /></label>
                            {!editing && <HelpButton helpId="edit" icon="edit" title="Edit" onClick={() => setEditing(true)} />}
                            {editing && (<><HelpButton helpId="cancel" icon="x" title="Cancel" onClick={() => { setEditing(false); setEdited(fileContent); }} /><HelpButton helpId="save" icon="save" title="Save" onClick={save} /></>)}
                            <HelpButton helpId="open-pane" icon="external-link" title="Open In New Pane" onClick={openInPane} />
                            <HelpButton helpId="copy" icon={copied ? "check" : "clipboard"} title={copied ? "Copied" : "Copy Content"} onClick={copyToClipboard} />
                        </div>
                        
                        {/* Help Panel - Shows when button is clicked */}
                        {activeHelp && HELP_INFO[activeHelp] && (
                            <div ref={helpInfoRef} style={STYLES.helpPanel}>
                                <div style={STYLES.helpTitle}>
                                    <dc.Icon icon="info" />
                                    {HELP_INFO[activeHelp].title}
                                    <button style={{marginLeft: 'auto', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: 4}} onClick={() => setActiveHelp(null)}>
                                        <dc.Icon icon="x" />
                                    </button>
                                </div>
                                <div style={STYLES.helpDesc}>{HELP_INFO[activeHelp].desc}</div>
                                <div style={STYLES.helpExample}>💡 Example: {HELP_INFO[activeHelp].example}</div>
                                <button style={STYLES.helpAction} onClick={() => { HELP_INFO[activeHelp].action(); setActiveHelp(null); }}>
                                    Start {HELP_INFO[activeHelp].title}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {showInspector && (
                        <div style={{ display: 'grid', gap: 8, padding: '12px 14px', borderRadius: 10, border: '1px dashed #2a2a2a', background: '#0a0a0a', fontFamily: 'ui-monospace', fontSize: 12, color: '#a0a0a0' }}>
                            <div><b style={{color: '#8b5cf6'}}>Base:</b> {baseFolder ? baseFolder.path : "—"} • <b style={{color: '#8b5cf6'}}>Grouping:</b> {groupByFolder ? "by folder" : "flat"} • <b style={{color: '#8b5cf6'}}>Recursive:</b> {recursiveGrouping ? "ON" : "OFF"} • <b style={{color: '#8b5cf6'}}>Parts:</b> {parts}</div>
                            <div><b style={{color: '#8b5cf6'}}>Subfolders:</b> {subList.length ? `${subList.length} selected` : "All"}</div>
                            <div><b style={{color: '#8b5cf6'}}>Types:</b> {extSel.join(", ")}</div>
                            <div><b style={{color: '#8b5cf6'}}>SuppMgr:</b> {supplements.length} file(s) • <b style={{color: '#8b5cf6'}}>Quick:</b> {suppFile ? `${suppFile.path} (${suppInject ? "inject" : "no inject"}, ${suppPlace}, ${suppCopy ? "copy" : "no copy"})` : "—"}</div>
                        </div>
                    )}
                    
                    <div style={{...STYLES.content, display: 'flex', flexDirection: 'column'}}>
                        {status === 'loading' && <p style={STYLES.pre}>Loading…</p>}
                        {status === 'compiling' && <p style={STYLES.pre}>Compiling…</p>}
                        {status === 'deleting' ? ( <pre ref={logContainerRef} style={{...STYLES.log, flex: 1, borderBottom: failedFiles.length > 0 ? '1px solid #1a1a1a' : 'none'}}> {logMessages.join('\n')} </pre>
                        ) : status === 'error' ? ( <pre style={{ ...STYLES.pre, color: '#ff6b6b' }}>{fileContent}</pre>
                        ) : status === 'loaded' && (editing ? <textarea style={STYLES.editor} value={edited} onChange={e => setEdited(e.target.value)} onKeyDown={e => { if (e.ctrlKey && e.key === 's') { e.preventDefault(); save(); } }} /> : <pre style={STYLES.pre}>{fileContent}</pre>)}
                        
                        {status === 'deleting' && failedFiles.length > 0 && (
                            <div style={STYLES.logFooter}>
                                <button style={STYLES.retryBtn} onClick={retryDeletions}> Retry {failedFiles.length} Failed File(s) </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={STYLES.compact} className={uniqueWrapperClass}>
                    <p style={{ textAlign: 'center', color: '#a0a0a0', fontSize: 15, margin: '12px 0', fontWeight: 500 }}>
                        RandomFileControls • Compact Mode
                    </p>
                    <button className="icon-btn" style={{...STYLES.iconBtn, padding: '10px 20px', width: 'auto', background: '#8b5cf6', borderColor: '#a78bfa'}} onClick={enterFull}>
                        <dc.Icon icon="maximize-2" style={{marginRight: 8}} />
                        Enter Full Tab
                    </button>
                    <div style={STYLES.mini}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8, borderBottom: '1px solid #1a1a1a', paddingBottom: 6 }}>{file ? file.path : 'No file selected'}</div>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#ffffff' }}>{fileContent ? fileContent.slice(0, 4000) : 'Enter full tab mode to access all features.'}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}

return { BasicView };
```


