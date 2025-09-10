


# ViewComponent

```jsx
/** 
 * Complete, drop-in component with all requested functionality:
 * - Pick base folder, choose exact subfolders, filter by file types
 * - Combine files (flat or grouped by folder), split into N parts
 * - Output into <base>/_compiled[/<sub>] with modern UI
 * - Mini viewer (compact) + Full view editor, open in pane, copy to clipboard
 * - Supplement Manager (add existing files + create new file), per-file inject/placement/copy/recursive
 * - Clear tooltips, contextual Help, and inline Inspector for “what’s active”
 *
 * Requires Obsidian + Datacore context: `dc`, `Notice`
 */
const { useEffect, useRef, useState, useMemo } = dc;

/* ────────────────────────── Utilities ────────────────────────── */
function findNearestAncestorWithClass(element, className) {
  if (!element) return null;
  let current = element.parentNode;
  while (current) {
    if (current.classList && current.classList.contains(className)) return current;
    current = current.parentNode;
  }
  return null;
}
function findDirectChildByClass(parent, className) {
  if (!parent) return null;
  for (const child of parent.children) {
    if (child.classList && child.classList.contains(className)) return child;
  }
  return null;
}
const pathJoin = (...segs) => segs.join("/").replace(/\/+/g, "/").replace(/\/$/, "");
const ensureUniquePath = (rawPath) => {
  const v = dc.app.vault;
  if (!v.getAbstractFileByPath(rawPath)) return rawPath;
  const i = rawPath.lastIndexOf(".");
  const base = i >= 0 ? rawPath.slice(0, i) : rawPath;
  const ext = i >= 0 ? rawPath.slice(i) : "";
  let n = 2;
  while (v.getAbstractFileByPath(`${base} (${n})${ext}`)) n++;
  return `${base} (${n})${ext}`;
};
const sanitizeFileName = (name) =>
  name.replace(/[\\:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();

/* ────────────────────────── Pickers ────────────────────────── */
const FilePicker = ({ isOpen, onClose, onSelectFile }) => {
  if (!isOpen) return null;
  const [search, setSearch] = useState("");
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setLoading(true);
      const pages = dc.api.query("@page") || [];
      const items = pages.map((p) => ({
        path: p.$path,
        basename: (p.$path.split("/").pop() || "").replace(/\.md$/i, ""),
      }));
      setAll(items);
      setError(null);
    } catch (e) {
      setError(e);
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    const t = (search || "").toLowerCase();
    if (!t) return all;
    return all.filter(
      (p) => p.path.toLowerCase().includes(t) || p.basename.toLowerCase().includes(t)
    );
  }, [all, search]);

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(17,18,20,.6)",
      backdropFilter: "blur(2px)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    modal: {
      background: "var(--background-primary)",
      width: "92%",
      maxWidth: 720,
      height: "72%",
      borderRadius: 14,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    },
    head: {
      padding: "14px 18px",
      borderBottom: "1px solid var(--background-modifier-border)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: { margin: 0, fontSize: 16, fontWeight: 600 },
    btn: {
      background: "transparent",
      border: "1px solid var(--background-modifier-border)",
      color: "var(--text-muted)",
      borderRadius: 8,
      fontSize: 18,
      cursor: "pointer",
      width: 36,
      height: 36,
      display: "grid",
      placeItems: "center",
    },
    input: {
      width: "calc(100% - 32px)",
      margin: 16,
      padding: "12px 14px",
      borderRadius: 10,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-secondary)",
      color: "var(--text-normal)",
      fontSize: 14,
    },
    list: { flex: 1, overflowY: "auto", padding: "0 12px 12px" },
    item: {
      padding: "10px 12px",
      cursor: "pointer",
      borderRadius: 10,
      border: "1px solid var(--background-modifier-border)",
      marginBottom: 8,
      display: "flex",
      flexDirection: "column",
      gap: 4,
    },
    path: { fontSize: 12, color: "var(--text-muted)" },
    msg: { color: "var(--text-muted)", textAlign: "center", padding: 20 },
  };

  const resolve = (p) => {
    const v = dc.app.vault;
    const t =
      (v.getAbstractFileByPath && v.getAbstractFileByPath(p)) ||
      (v.getFileByPath && v.getFileByPath(p));
    return t || null;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>
          <h3 style={styles.title}>Select a File</h3>
          <button style={styles.btn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        <input
          style={styles.input}
          placeholder="Search files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div style={styles.list}>
          {loading && <p style={styles.msg}>Loading…</p>}
          {error && (
            <p style={{ ...styles.msg, color: "var(--text-error)" }}>
              Error: {error.message}
            </p>
          )}
          {!loading &&
            !error &&
            filtered.map((p) => (
              <div
                key={p.path}
                style={styles.item}
                className="fp-item"
                onClick={() => {
                  const f = resolve(p.path);
                  if (!f) {
                    new Notice(`Could not resolve: ${p.path}`, 3000);
                    return;
                  }
                  onSelectFile(f);
                }}
              >
                <div style={{ fontWeight: 600 }}>{p.basename || p.path}</div>
                <div style={styles.path}>{p.path}</div>
              </div>
            ))}
          {!loading && !error && filtered.length === 0 && (
            <p style={styles.msg}>No files found.</p>
          )}
        </div>
        <style>{`.fp-item:hover{background-color:var(--background-modifier-hover)}`}</style>
      </div>
    </div>
  );
};

const FolderPicker = ({ isOpen, onClose, onSelectFolder, title = "Select a Folder" }) => {
  if (!isOpen) return null;
  const [search, setSearch] = useState("");
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    const root = dc.app.vault.getRoot();
    const out = [];
    const stack = [root];
    while (stack.length) {
      const cur = stack.pop();
      out.push(cur);
      if (cur?.children) for (const ch of cur.children) if (ch?.children) stack.push(ch);
    }
    setFolders(out);
  }, []);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return folders;
    return folders.filter((f) => (f.path || "").toLowerCase().includes(t));
  }, [folders, search]);

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(17,18,20,.6)",
      backdropFilter: "blur(2px)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    modal: {
      background: "var(--background-primary)",
      width: "92%",
      maxWidth: 720,
      height: "72%",
      borderRadius: 14,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    },
    head: {
      padding: "14px 18px",
      borderBottom: "1px solid var(--background-modifier-border)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: { margin: 0, fontSize: 16, fontWeight: 600 },
    btn: {
      background: "transparent",
      border: "1px solid var(--background-modifier-border)",
      color: "var(--text-muted)",
      borderRadius: 8,
      fontSize: 18,
      cursor: "pointer",
      width: 36,
      height: 36,
      display: "grid",
      placeItems: "center",
    },
    input: {
      width: "calc(100% - 32px)",
      margin: 16,
      padding: "12px 14px",
      borderRadius: 10,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-secondary)",
      color: "var(--text-normal)",
      fontSize: 14,
    },
    list: { flex: 1, overflowY: "auto", padding: "0 12px 12px" },
    item: {
      padding: "10px 12px",
      cursor: "pointer",
      borderRadius: 10,
      border: "1px solid var(--background-modifier-border)",
      marginBottom: 8,
      display: "flex",
      flexDirection: "column",
      gap: 4,
    },
    path: { fontSize: 12, color: "var(--text-muted)" },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>
          <h3 style={styles.title}>{title}</h3>
          <button style={styles.btn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        <input
          style={styles.input}
          placeholder="Search folders…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div style={styles.list}>
          {filtered.map((f) => (
            <div
              key={f.path}
              style={styles.item}
              className="fld-item"
              onClick={() => onSelectFolder(f)}
            >
              <div style={{ fontWeight: 600 }}>
                {f.name || (f.path === "/" ? "Vault Root" : f.path)}
              </div>
              <div style={styles.path}>{f.path}</div>
            </div>
          ))}
        </div>
        <style>{`.fld-item:hover{background-color:var(--background-modifier-hover)}`}</style>
      </div>
    </div>
  );
};

/* ───────────────── Subfolder Filter ───────────────── */
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
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.6)",
      zIndex: 10001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    modal: {
      width: 720,
      maxWidth: "92%",
      background: "var(--background-primary)",
      borderRadius: 12,
      border: "1px solid var(--background-modifier-border)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    head: {
      padding: "12px 14px",
      borderBottom: "1px solid var(--background-modifier-border)",
      display: "flex",
      gap: 8,
      alignItems: "center",
      justifyContent: "space-between",
    },
    list: {
      padding: 12,
      maxHeight: 360,
      overflow: "auto",
      display: "grid",
      gap: 6,
    },
    row: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      border: "1px solid var(--background-modifier-border)",
      borderRadius: 8,
      padding: "8px 10px",
    },
    foot: {
      padding: 12,
      borderTop: "1px solid var(--background-modifier-border)",
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
    },
    btn: {
      padding: "8px 12px",
      borderRadius: 8,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-secondary)",
      cursor: "pointer",
    },
    search: {
      width: "60%",
      padding: "8px 10px",
      borderRadius: 8,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-secondary)",
      color: "var(--text-normal)",
    },
  };

  if (!baseFolder) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.head}>
            <strong>Subfolder Filter</strong>
          </div>
          <div style={{ padding: 12, color: "var(--text-muted)" }}>
            Pick a base folder first.
          </div>
          <div style={styles.foot}>
            <button style={styles.btn} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const toggle = (rel) => {
    const n = new Set(picked);
    n.has(rel) ? n.delete(rel) : n.add(rel);
    setPicked(n);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>
          <strong>Subfolder Filter — {baseFolder.path}</strong>
          <input
            style={styles.search}
            placeholder="Filter…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div style={styles.list}>
          {filtered.map((rel) => (
            <label key={rel} style={styles.row}>
              <input
                type="checkbox"
                checked={picked.has(rel)}
                onChange={() => toggle(rel)}
              />
              <span>{rel}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 12, color: "var(--text-muted)" }}>
              No subfolders.
            </div>
          )}
        </div>
        <div style={styles.foot}>
          <button style={styles.btn} onClick={() => setPicked(new Set(filtered))}>
            Select shown
          </button>
          <button style={styles.btn} onClick={() => setPicked(new Set())}>
            Clear
          </button>
          <button
            style={styles.btn}
            onClick={() => {
              onApply(Array.from(picked));
              onClose();
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── Extension Filter ───────────────── */
const ExtFilterModal = ({ isOpen, onClose, available, selected, onApply }) => {
  if (!isOpen) return null;
  const [picked, setPicked] = useState(new Set(selected || ["md"]));
  const [custom, setCustom] = useState("");

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.6)",
      zIndex: 10001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    modal: {
      width: 560,
      maxWidth: "92%",
      background: "var(--background-primary)",
      borderRadius: 12,
      border: "1px solid var(--background-modifier-border)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    head: {
      padding: "12px 14px",
      borderBottom: "1px solid var(--background-modifier-border)",
    },
    list: {
      padding: 12,
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      maxHeight: 300,
      overflow: "auto",
    },
    chip: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      border: "1px solid var(--background-modifier-border)",
      borderRadius: 18,
      padding: "6px 10px",
    },
    foot: {
      padding: 12,
      borderTop: "1px solid var(--background-modifier-border)",
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
    },
    btn: {
      padding: "8px 12px",
      borderRadius: 8,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-secondary)",
      cursor: "pointer",
    },
    input: {
      padding: "8px 10px",
      borderRadius: 8,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-secondary)",
      color: "var(--text-normal)",
    },
  };

  const toggle = (e) => {
    const ext = e.toLowerCase().replace(/^\./, "");
    const n = new Set(picked);
    n.has(ext) ? n.delete(ext) : n.add(ext);
    setPicked(n);
  };
  const add = () => {
    const e = custom.trim().toLowerCase().replace(/^\./, "");
    if (!e) return;
    const n = new Set(picked);
    n.add(e);
    setPicked(n);
    setCustom("");
  };
  const all = (available && available.length) ? available : ["md", "txt", "json", "csv", "canvas"];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>
          <strong>Type / Extension Filter</strong>
        </div>
        <div style={styles.list}>
          {all.map((ext) => (
            <label key={ext} style={styles.chip}>
              <input
                type="checkbox"
                checked={picked.has(ext)}
                onChange={() => toggle(ext)}
              />
              <span>.{ext}</span>
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "0 12px 12px" }}>
          <input
            style={styles.input}
            placeholder="Add custom (e.g. .adoc)"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button style={styles.btn} onClick={add}>
            Add
          </button>
        </div>
        <div style={styles.foot}>
          <button style={styles.btn} onClick={() => setPicked(new Set(all))}>
            Select all
          </button>
          <button style={styles.btn} onClick={() => setPicked(new Set(["md"]))}>
            Only .md
          </button>
          <button
            style={styles.btn}
            onClick={() => {
              onApply(Array.from(picked));
              onClose();
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────── Supplement Manager (with Create New) ───────────── */
const SupplementManagerModal = ({
  isOpen,
  onClose,
  supplements,
  onChange,
  onAddRequest,
  createDir,
  onPickCreateDir,
  onCreateNew,
}) => {
  if (!isOpen) return null;

  const [newName, setNewName] = useState("");
  const [expanded, setExpanded] = useState({}); // row -> show details

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.6)",
      zIndex: 10001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    modal: {
      width: 860,
      maxWidth: "95%",
      background: "var(--background-primary)",
      color: "var(--text-normal)",
      borderRadius: 12,
      border: "1px solid var(--background-modifier-border)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    head: {
      padding: 12,
      borderBottom: "1px solid var(--background-modifier-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    btn: {
      padding: "6px 10px",
      borderRadius: 8,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-secondary)",
      cursor: "pointer",
    },
    list: {
      maxHeight: 320,
      overflow: "auto",
      display: "grid",
      gap: 8,
      padding: 12,
    },
    row: {
      display: "grid",
      gridTemplateColumns: "1fr auto auto auto auto auto auto",
      alignItems: "center",
      gap: 8,
      border: "1px solid var(--background-modifier-border)",
      borderRadius: 10,
      padding: "8px 10px",
    },
    path: {
      fontFamily: "ui-monospace",
      fontSize: 12,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    chip: {
      fontSize: 12,
      padding: "2px 6px",
      border: "1px solid var(--background-modifier-border)",
      borderRadius: 8,
      background: "var(--background-secondary)",
    },
    foot: {
      padding: 12,
      borderTop: "1px solid var(--background-modifier-border)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    createWrap: {
      display: "grid",
      gridTemplateColumns: "auto 1fr auto auto",
      gap: 8,
      alignItems: "center",
      padding: "10px 12px",
      borderTop: "1px dashed var(--background-modifier-border)",
      background: "var(--background-secondary)",
    },
    label: { fontSize: 12, color: "var(--text-muted" },
    input: {
      padding: "8px 10px",
      borderRadius: 8,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-primary)",
      color: "var(--text-normal)",
    },
    dirBadge: {
      fontFamily: "ui-monospace",
      fontSize: 12,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      padding: "6px 8px",
      borderRadius: 8,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-primary)",
    },
    infoBox: {
      gridColumn: "1 / -1",
      background: "var(--background-primary-alt)",
      border: "1px dashed var(--background-modifier-border)",
      borderRadius: 8,
      padding: "8px 10px",
      fontFamily: "ui-monospace",
      fontSize: 12,
      whiteSpace: "pre-wrap",
      color: "var(--text-muted)",
    },
  };

  const toggle = (i, key) => {
    const next = [...supplements];
    next[i] = { ...next[i], [key]: !next[i][key] };
    onChange(next);
  };
  const flipPlacement = (i) => {
    const next = [...supplements];
    next[i] = { ...next[i], placement: next[i].placement === "append" ? "prepend" : "append" };
    onChange(next);
  };
  const remove = (i) => {
    const next = [...supplements];
    next.splice(i, 1);
    onChange(next);
  };

  const toggleExpand = async (i) => {
    setExpanded((m) => ({ ...m, [i]: !m[i] }));
  };

  const fileInfoString = (file) => {
    try {
      const stat = file?.stat || {};
      const size = (stat.size != null) ? ` • ${stat.size} bytes` : "";
      const mtime = stat.mtime ? new Date(stat.mtime).toLocaleString() : "unknown";
      const ctime = stat.ctime ? new Date(stat.ctime).toLocaleString() : "unknown";
      return `mtime: ${mtime} • ctime: ${ctime}${size}`;
    } catch {
      return "(no metadata)";
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>
          <strong>Supplement Manager</strong>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.btn} onClick={onAddRequest} title="Add existing file">
              ➕ Add file
            </button>
            <button style={styles.btn} onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Create new supplementary file */}
        <div style={styles.createWrap}>
          <span style={styles.label}>Create in:</span>
          <div style={styles.dirBadge} title={createDir || "(pick a folder)"}>
            {createDir || "(pick a folder)"}
          </div>
          <button style={styles.btn} title="Pick folder" onClick={onPickCreateDir}>
            📁
          </button>
          <div style={{ display: "contents" }} />
          <span style={styles.label}>Filename:</span>
          <input
            style={styles.input}
            placeholder="my-supplement.md"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            style={styles.btn}
            title="Create file"
            onClick={() => {
              if (!newName.trim()) {
                new Notice("Enter a file name.", 2000);
                return;
              }
              onCreateNew(newName.trim());
              setNewName("");
            }}
          >
            🆕 Create
          </button>
        </div>

        {/* List of managed supplements */}
        <div style={styles.list}>
          {supplements.length === 0 && (
            <div style={{ color: "var(--text-muted)" }}>
              No supplements yet. Use “➕ Add file” or “🆕 Create”.
            </div>
          )}
          {supplements.map((s, i) => (
            <div key={s.file.path + "_" + i} style={styles.row}>
              <div title={s.file.path} style={styles.path}>
                {s.file.path}
              </div>
              <button
                style={styles.btn}
                title={`Inject inside compiled notes: ${s.inject ? "ON" : "OFF"}`}
                onClick={() => toggle(i, "inject")}
              >
                {s.inject ? "✅ Inject" : "⛔ Inject"}
              </button>
              <button
                style={styles.btn}
                title={`Placement when injecting: ${s.placement}`}
                onClick={() => flipPlacement(i)}
              >
                {s.placement === "append" ? "⬇ Append" : "⬆ Prepend"}
              </button>
              <button
                style={styles.btn}
                title={`Copy alongside outputs: ${s.copy ? "ON" : "OFF"}`}
                onClick={() => toggle(i, "copy")}
              >
                {s.copy ? "📥 Copy" : "📥 No"}
              </button>
              <button
                style={styles.btn}
                title={`Recursive copy into every _compiled/<subfolder>: ${s.recursive ? "ON" : "OFF"}`}
                onClick={() => toggle(i, "recursive")}
              >
                {s.recursive ? "🔁 Rec" : "⏹️ One"}
              </button>
              <button
                style={styles.btn}
                title="More info / preview"
                onClick={() => toggleExpand(i)}
              >
                {expanded[i] ? "🔽 Info" : "🔼 Info"}
              </button>
              <button style={styles.btn} title="Remove" onClick={() => remove(i)}>
                🗑️
              </button>

              {expanded[i] && (
                <div style={styles.infoBox}>
                  <div>
                    Path: {s.file.path}
                    {"\n"}
                    {fileInfoString(s.file)}
                  </div>
                  <div style={{ marginTop: 6, opacity: 0.9 }}>
                    Inject: {s.inject ? "yes" : "no"} • Placement: {s.placement} • Copy:{" "}
                    {s.copy ? "yes" : "no"} • Recursive: {s.recursive ? "yes" : "no"}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    Tip: “Inject” places this file’s content inside every compiled note.
                    “Copy” writes the file next to the compiled notes; with “Recursive”
                    it’s copied into each <code>_compiled/&lt;subfolder&gt;</code>.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.foot}>
          <span className="note" style={styles.chip}>
            “Recursive” copies into every <code>_compiled/&lt;subfolder&gt;</code>. “Append/Prepend”
            controls where the injected text appears inside compiled notes.
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Need an existing note? Use “➕ Add file”.
          </span>
        </div>
      </div>
    </div>
  );
};

/* ───────────── Contextual Help (icon legend & flow) ───────────── */
const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.6)",
      zIndex: 10002,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    modal: {
      width: 780,
      maxWidth: "95%",
      background: "var(--background-primary)",
      borderRadius: 12,
      border: "1px solid var(--background-modifier-border)",
      overflow: "hidden",
      color: "var(--text-normal)",
      display: "flex",
      flexDirection: "column",
    },
    head: {
      padding: "12px 14px",
      borderBottom: "1px solid var(--background-modifier-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    btn: {
      padding: "6px 10px",
      borderRadius: 8,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-secondary)",
      cursor: "pointer",
    },
    body: { padding: 14, display: "grid", gap: 10, fontSize: 14, lineHeight: 1.5 },
    code: {
      fontFamily: "ui-monospace",
      fontSize: 12,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-secondary)",
      borderRadius: 8,
      padding: "8px 10px",
    },
    grid: { display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, alignItems: "center" },
    k: {
      width: 38,
      height: 34,
      display: "grid",
      placeItems: "center",
      border: "1px solid var(--background-modifier-border)",
      borderRadius: 8,
      background: "var(--background-secondary)",
    },
  };
  const Item = ({ icon, text }) => (
    <>
      <div style={styles.k}>{icon}</div>
      <div>{text}</div>
    </>
  );
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>
          <strong>Help & Icon Legend</strong>
          <button style={styles.btn} onClick={onClose}>Close</button>
        </div>
        <div style={styles.body}>
          <div style={styles.grid}>
            <Item icon="⤢" text="Full view" />
            <Item icon="📄" text="Pick a file to view/edit" />
            <Item icon="📌" text="Pick base folder (does not compile)" />
            <Item icon="⚙️" text="Compile now (uses current settings & base folder)" />
            <Item icon="🗃️/🧾" text="Group by folder / Flat output" />
            <Item icon="🔁" text="Grouping recursion on/off (how folders are segmented)" />
            <Item icon="🎯" text="Select specific subfolders to include" />
            <Item icon="🔡" text="Filter by file types/extensions" />
            <Item icon="📦" text="Supplement Manager (add/create, inject, copy, recursive)" />
            <Item icon="📎" text="Quick single supplement (optional)" />
            <Item icon="✏️/💾/↩️" text="Edit / Save / Cancel" />
            <Item icon="📂" text="Open current file in a new pane" />
            <Item icon="📋" text="Copy current content to clipboard" />
            <Item icon="⤬" text="Exit full view" />
          </div>
          <div>
            <strong>Typical flow:</strong>
            <ol>
              <li>Click <b>📌</b> to pick your base folder.</li>
              <li>Optionally refine with <b>🎯</b> subfolders & <b>🔡</b> types.</li>
              <li>(Optional) Open <b>📦</b> to add/create supplementary files, toggle inject/copy/recursive.</li>
              <li>Choose <b>🗃️</b> or <b>🧾</b>, set <b>Parts</b>, then click <b>⚙️</b> to compile.</li>
              <li>Outputs go to <code>&lt;base&gt;/_compiled/…</code>.</li>
            </ol>
          </div>
          <div>
            <strong>Parts Splitting:</strong> N evenly sized chunks by section boundary (<code>---</code>).
          </div>
          <div>
            <strong>Supplement behavior:</strong>
            <div style={styles.code}>
{`Inject = place the file text inside each compiled output (prepend/append)
Copy = copy the file next to compiled outputs
Recursive = copy into every _compiled/<subfolder> directory`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────── Main Component ────────────────────────── */
function BasicView() {
  const uniqueWrapperClass =
    "interactive-wrapper-" + useRef(Math.random().toString(36).substr(2, 9)).current;

  const STYLES = {
    hover: `.${uniqueWrapperClass}:hover .subtle-icon{opacity:.8;transform:scale(1)}.${uniqueWrapperClass} .icon-btn:hover{background-color:var(--background-modifier-hover)}`,
    wrap: {
      position: "relative",
      height: "100%",
      width: "100%",
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      background: "linear-gradient(180deg,var(--background-secondary),var(--background-primary))",
      border: "1px solid var(--background-modifier-border)",
      borderRadius: 14,
      color: "var(--text-normal)",
    },
    bar: {
      display: "grid",
      gridTemplateColumns: "1fr auto auto",
      alignItems: "center",
      gap: 10,
      padding: "8px 10px",
      background: "var(--background-primary)",
      borderRadius: 12,
      border: "1px solid var(--background-modifier-border)",
    },
    left: { display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" },
    iconBtn: {
      background: "var(--background-secondary)",
      border: "1px solid var(--background-modifier-border)",
      color: "var(--text-normal)",
      borderRadius: 10,
      cursor: "pointer",
      padding: 8,
      width: 36,
      height: 36,
      display: "grid",
      placeItems: "center",
      fontSize: 16,
    },
    fileName: {
      fontFamily: "ui-monospace",
      fontSize: 13,
      color: "var(--text-muted)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      padding: "6px 8px",
      background: "var(--background-secondary)",
      borderRadius: 8,
      border: "1px solid var(--background-modifier-border)",
      minWidth: 0,
      flex: 1,
    },
    partsWrap: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      background: "var(--background-secondary)",
      border: "1px solid var(--background-modifier-border)",
      padding: "6px 8px",
      borderRadius: 10,
    },
    numberInput: {
      width: 64,
      padding: "6px 8px",
      borderRadius: 8,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-primary)",
      color: "var(--text-normal)",
      fontSize: 13,
      textAlign: "center",
    },
    label: { fontSize: 12, color: "var(--text-muted)" },
    chip: {
      maxWidth: 360,
      fontSize: 12,
      color: "var(--text-muted)",
      padding: "4px 8px",
      borderRadius: 8,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-secondary)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    inspector: {
      display: "grid",
      gap: 6,
      padding: "8px 10px",
      borderRadius: 10,
      border: "1px dashed var(--background-modifier-border)",
      background: "var(--background-primary)",
      fontFamily: "ui-monospace",
      fontSize: 12,
      color: "var(--text-muted)",
    },
    content: {
      flexGrow: 1,
      position: "relative",
      overflow: "hidden",
      background: "var(--background-primary)",
      borderRadius: 12,
      border: "1px solid var(--background-modifier-border)",
    },
    editor: {
      position: "absolute",
      inset: 0,
      padding: 16,
      border: "none",
      resize: "none",
      background: "transparent",
      color: "var(--text-normal)",
      fontFamily: "ui-monospace",
      fontSize: 14,
      lineHeight: 1.55,
      outline: "none",
    },
    pre: {
      margin: 0,
      padding: 16,
      height: "100%",
      overflow: "auto",
      whiteSpace: "pre-wrap",
      wordWrap: "break-word",
      fontFamily: "ui-monospace",
      fontSize: 14,
      lineHeight: 1.55,
    },
    compact: {
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      border: "1px dashed var(--background-modifier-border)",
      borderRadius: 14,
      background: "linear-gradient(180deg,var(--background-primary-alt),var(--background-primary))",
    },
    mini: {
      maxHeight: 240,
      overflow: "auto",
      padding: 12,
      borderRadius: 10,
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-primary)",
      fontFamily: "ui-monospace",
      fontSize: 13,
      lineHeight: 1.5,
    },
    row: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  };

  /* View/Editor state */
  const [isFull, setFull] = useState(false);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;

  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [edited, setEdited] = useState("");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("idle");

  /* Pickers & Modals */
  const [fpOpen, setFpOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  /* Folder/Compile settings */
  const [baseFolder, setBaseFolder] = useState(null);
  const [chooseBaseOpen, setChooseBaseOpen] = useState(false);

  const [parts, setParts] = useState(1);
  const [groupByFolder, setGroup] = useState(false);
  const [recursiveGrouping, setRecursiveGrouping] = useState(true);

  /* Filters */
  const [subFilterOpen, setSubFilterOpen] = useState(false);
  const [subList, setSubList] = useState([]);
  const [extFilterOpen, setExtFilterOpen] = useState(false);
  const [extAvail, setExtAvail] = useState(["md"]);
  const [extSel, setExtSel] = useState(["md"]);

  /* Quick Supplement (still supported) */
  const [suppFile, setSuppFile] = useState(null);
  const [suppInject, setSuppInject] = useState(false);
  const [suppPlace, setSuppPlace] = useState("append");
  const [suppCopy, setSuppCopy] = useState(false);
  const [suppPickOpen, setSuppPickOpen] = useState(false);

  /* Supplement Manager (add multiple + per-file recursive + create new) */
  const [suppMgrOpen, setSuppMgrOpen] = useState(false);
  const [suppMgrPickOpen, setSuppMgrPickOpen] = useState(false);
  const [supplements, setSupplements] = useState([]); // [{file, inject, placement, copy, recursive}]
  const [suppCreateDir, setSuppCreateDir] = useState(null);
  const [suppCreateDirPickerOpen, setSuppCreateDirPickerOpen] = useState(false);

  /* Inspector toggle (what’s active) */
  const [showInspector, setShowInspector] = useState(true);

  /* Full-tab mount */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isFull) {
      if (!el.parentNode) {
        setTimeout(() => setFull(true), 50);
        return;
      }
      const leaf = findNearestAncestorWithClass(el, "workspace-leaf-content");
      if (!leaf) {
        setFull(false);
        return;
      }
      const wrapper = findDirectChildByClass(leaf, "view-content") || leaf;
      stateRefs.originalParent = el.parentNode;
      stateRefs.placeholder = document.createElement("div");
      stateRefs.placeholder.style.display = "none";
      el.parentNode.insertBefore(stateRefs.placeholder, el);
      const pos = window.getComputedStyle(wrapper).position;
      stateRefs.parentPosition = { element: wrapper, original: wrapper.style.position };
      if (pos === "static") wrapper.style.position = "relative";
      wrapper.appendChild(el);
      Object.assign(el.style, {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 9998,
        overflow: "auto",
      });
    }
    return () => {
      if (!stateRefs.originalParent) return;
      if (stateRefs.placeholder?.parentNode)
        stateRefs.placeholder.parentNode.replaceChild(el, stateRefs.placeholder);
      else stateRefs.originalParent.appendChild(el);
      if (stateRefs.parentPosition?.element)
        stateRefs.parentPosition.element.style.position = stateRefs.parentPosition.original || "";
      el.removeAttribute("style");
      Object.keys(stateRefs).forEach((k) => (stateRefs[k] = null));
    };
  }, [isFull]);

  /* Default creation dir when base folder changes */
  useEffect(() => {
    if (baseFolder && baseFolder.path) {
      setSuppCreateDir((baseFolder.path === "/" ? "" : baseFolder.path) + "/_supplements");
    } else {
      setSuppCreateDir("Supplements");
    }
  }, [baseFolder]);

  /* Core helpers */
  const loadFile = async (f) => {
    if (!f) {
      new Notice("No file specified.", 2500);
      return false;
    }
    setStatus("loading");
    try {
      setFile(f);
      const content = await dc.app.vault.cachedRead(f);
      setFileContent(content);
      setEdited(content);
      setStatus("loaded");
      setEditing(false);
      return true;
    } catch (e) {
      setFileContent(`Error loading file:\n${e.message}`);
      setStatus("error");
      return false;
    }
  };

  const enterFull = async () => {
    const host = dc.app.workspace.getActiveFile();
    const ok = await loadFile(host);
    if (ok) setFull(true);
    else new Notice("Failed to load the host file.", 4000);
  };
  const exitFull = (e) => {
    e.stopPropagation();
    setEditing(false);
    setFull(false);
    setStatus("idle");
  };

  const save = async () => {
    if (!file) {
      new Notice("No file to save.", 2500);
      return;
    }
    setStatus("saving");
    try {
      await dc.app.vault.modify(file, edited);
      setFileContent(edited);
      setEditing(false);
      setStatus("loaded");
      new Notice(`Saved “${file.basename}”.`);
    } catch (e) {
      setStatus("loaded");
      new Notice(`Save failed: ${e.message}`, 5000);
    }
  };
  const openInPane = async () => {
    try {
      const t = file || dc.app.workspace.getActiveFile();
      if (!t) {
        new Notice("No file to open.", 2500);
        return;
      }
      await dc.app.workspace.getLeaf(false).openFile(t);
      new Notice(`Opened: ${t.path}`, 2000);
    } catch (e) {
      new Notice(`Open failed: ${e.message}`, 4000);
    }
  };
  const copyToClipboard = async () => {
    try {
      const txt = editing ? edited : fileContent;
      if (!txt) {
        new Notice("Nothing to copy.", 2000);
        return;
      }
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(txt);
      else {
        const ta = document.createElement("textarea");
        ta.value = txt;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      new Notice("Copied.", 1500);
    } catch (e) {
      new Notice(`Copy failed: ${e.message}`, 4000);
    }
  };

  const ensureFolder = async (p) => {
    const v = dc.app.vault;
    if (!v.getAbstractFileByPath(p)) {
      // create nested paths safely
      const parts = p.replace(/^\//, "").split("/").filter(Boolean);
      let acc = "";
      for (const seg of parts) {
        acc = acc ? acc + "/" + seg : seg;
        if (!v.getAbstractFileByPath(acc)) await v.createFolder(acc);
      }
    }
  };
  const extOf = (f) => (f.extension || "").toLowerCase();

  /* Base folder picker (does not compile) */
  const pickBaseFolder = (f) => {
    if (!f?.path) return;
    setBaseFolder(f);
    // probe for extensions immediately
    const { exts } = collectFilesAndExtensions(f);
    setExtAvail(exts.length ? exts : ["md"]);
    if (!extSel?.length) setExtSel(["md"]);
    setChooseBaseOpen(false);
    new Notice(`Base folder set: ${f.path}`, 2000);
  };

  /* File collection and filters */
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
    const chosen = new Set(
      (extSel && extSel.length ? extSel : ["md"]).map((e) => e.toLowerCase())
    );
    return files.filter((f) => chosen.has(extOf(f)));
  };

  /* Supplements: read & build stacks */
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
      if (topLevel === true && it.recursive) continue; // recursive handled per-group below
      if (topLevel === false && !it.recursive) continue; // non-recursive only at top
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

  /* Compile helpers */
  const splitEven = (body, partsCount, folderPath, label, stacks) => {
    const sep = "\n---\n";
    const sections = body.split(sep);
    const target = Math.ceil(body.length / partsCount);
    const chunks = [];
    let bucket = [],
      len = 0;
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
        const p = pathJoin(
          outDir,
          `compiled-${safe}-${ts}-part-${String(i + 1).padStart(2, "0")}-of-${String(texts.length).padStart(2, "0")}.md`
        );
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
          const p = pathJoin(
            segDir,
            `compiled-${safe}-${segSafe}-${ts}-part-${String(i + 1).padStart(2, "0")}-of-${String(texts.length).padStart(2, "0")}.md`
          );
          createdAll.push(await dc.app.vault.create(p, texts[i]));
        }
      }

      // recursive supplements into each group directory
      await copySuppToDir(segDir, stacks, false);
    }
    // non-recursive supplements into top-level only
    await copySuppToDir(outDir, stacks, true);
    return createdAll;
  };

  /* Compile using current settings */
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

      const outDir =
        (baseFolder.path === "/" ? "" : baseFolder.path)
          ? pathJoin(baseFolder.path, "_compiled")
          : "_compiled";
      await ensureFolder(outDir);

      const stacks = await collectSuppStacks();
      const count = Math.max(1, Number.isFinite(+parts) ? Math.max(1, Math.floor(+parts)) : 1);

      const created = groupByFolder
        ? await compileGrouped(baseFolder, afterExt, outDir, count, stacks)
        : await compileFlat(baseFolder, afterExt, outDir, count, stacks);

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

  /* Create new supplementary file (inside Supplement Manager) */
  const createSupplementFile = async (rawName) => {
    try {
      const v = dc.app.vault;
      if (!suppCreateDir) {
        new Notice("Pick a folder for creation.", 2500);
        return;
      }
      // ensure folder path exists (nested)
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

      setSupplements((list) => [
        ...list,
        { file: created, inject: true, placement: "append", copy: true, recursive: true },
      ]);
      new Notice(`Created ${created.path} and added to supplements.`, 3500);
    } catch (e) {
      new Notice(`Create failed: ${e.message}`, 5000);
    }
  };

  /* UI */
  return (
    <div ref={containerRef}>
      <style>{STYLES.hover}</style>

      {/* Global dialogs */}
      <FilePicker
        isOpen={fpOpen}
        onClose={() => setFpOpen(false)}
        onSelectFile={async (f) => {
          setFpOpen(false);
          await loadFile(f);
        }}
      />
      <FilePicker
        isOpen={suppPickOpen}
        onClose={() => setSuppPickOpen(false)}
        onSelectFile={(f) => {
          setSuppFile(f);
          setSuppPickOpen(false);
          new Notice(`Supplement set: ${f.path}`, 2000);
        }}
      />
      <FilePicker
        isOpen={suppMgrPickOpen}
        onClose={() => setSuppMgrPickOpen(false)}
        onSelectFile={(f) => {
          setSuppMgrPickOpen(false);
          setSupplements((list) => [
            ...list,
            { file: f, inject: true, placement: "append", copy: true, recursive: true },
          ]);
        }}
      />
      <FolderPicker
        isOpen={chooseBaseOpen}
        onClose={() => setChooseBaseOpen(false)}
        onSelectFolder={pickBaseFolder}
        title="Choose Base Folder"
      />
      <FolderPicker
        isOpen={suppCreateDirPickerOpen}
        onClose={() => setSuppCreateDirPickerOpen(false)}
        onSelectFolder={(f) => {
          setSuppCreateDir(f.path);
          setSuppCreateDirPickerOpen(false);
        }}
        title="Choose Folder for New Supplement"
      />
      <SubfolderFilterModal
        isOpen={subFilterOpen}
        onClose={() => setSubFilterOpen(false)}
        baseFolder={baseFolder}
        selected={subList}
        onApply={setSubList}
      />
      <ExtFilterModal
        isOpen={extFilterOpen}
        onClose={() => setExtFilterOpen(false)}
        available={extAvail}
        selected={extSel}
        onApply={setExtSel}
      />
      <SupplementManagerModal
        isOpen={suppMgrOpen}
        onClose={() => setSuppMgrOpen(false)}
        supplements={supplements}
        onChange={setSupplements}
        onAddRequest={() => setSuppMgrPickOpen(true)}
        createDir={suppCreateDir}
        onPickCreateDir={() => setSuppCreateDirPickerOpen(true)}
        onCreateNew={createSupplementFile}
      />
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {isFull ? (
        <div style={STYLES.wrap} className={uniqueWrapperClass}>
          <div style={STYLES.bar}>
            <div style={STYLES.left}>
              {/* View & Base Folder */}
              <button
                style={STYLES.iconBtn}
                title="Choose File"
                onClick={() => setFpOpen(true)}
              >
                📄
              </button>
              <button
                style={STYLES.iconBtn}
                title="Pick Base Folder (does not compile)"
                onClick={() => setChooseBaseOpen(true)}
              >
                📌
              </button>
              <div style={STYLES.chip} title={baseFolder ? baseFolder.path : "No base folder"}>
                Base: {baseFolder ? baseFolder.path : "—"}
              </div>

              {/* Grouping */}
              <button
                style={STYLES.iconBtn}
                title={groupByFolder ? "Grouping: by folder" : "Grouping: flat"}
                onClick={() => setGroup((v) => !v)}
              >
                {groupByFolder ? "🗃️" : "🧾"}
              </button>
              <button
                style={STYLES.iconBtn}
                title={
                  recursiveGrouping
                    ? "Grouping recursion: ON (deep subfolders keep their own groups)"
                    : "Grouping recursion: OFF (group only by first level)"
                }
                onClick={() => setRecursiveGrouping((v) => !v)}
              >
                🔁
              </button>

              {/* Filters */}
              <button
                style={STYLES.iconBtn}
                title="Subfolder Filter"
                onClick={() => setSubFilterOpen(true)}
              >
                🎯
              </button>
              <button
                style={STYLES.iconBtn}
                title="Type / Extension Filter"
                onClick={() => setExtFilterOpen(true)}
              >
                🔡
              </button>

              {/* Parts + Compile */}
              <div style={STYLES.partsWrap} title="Split output into N parts">
                <span style={STYLES.label}>Parts</span>
                <input
                  style={STYLES.numberInput}
                  type="number"
                  min={1}
                  step={1}
                  value={parts}
                  onChange={(e) =>
                    setParts(Math.max(1, parseInt(e.target.value || "1", 10)))
                  }
                />
                <button
                  style={STYLES.iconBtn}
                  title="Compile (uses current base folder & settings)"
                  onClick={compileCurrent}
                >
                  ⚙️
                </button>
              </div>

              {/* Supplements */}
              <button
                style={STYLES.iconBtn}
                title="Supplement Manager"
                onClick={() => setSuppMgrOpen(true)}
              >
                📦
              </button>
              <button
                style={STYLES.iconBtn}
                title="Quick: pick single supplementary"
                onClick={() => setSuppPickOpen(true)}
              >
                📎
              </button>
              <button
                style={STYLES.iconBtn}
                title={`Quick Inject: ${suppInject ? "ON" : "OFF"}`}
                onClick={() => setSuppInject((v) => !v)}
              >
                🧩
              </button>
              <button
                style={STYLES.iconBtn}
                title={`Quick Placement: ${suppPlace}`}
                onClick={() => setSuppPlace((p) => (p === "append" ? "prepend" : "append"))}
              >
                {suppPlace === "append" ? "⬇️" : "⬆️"}
              </button>
              <button
                style={STYLES.iconBtn}
                title={`Quick Copy alongside outputs: ${suppCopy ? "ON" : "OFF"}`}
                onClick={() => setSuppCopy((v) => !v)}
              >
                📥
              </button>

              {/* File indicator */}
              <div style={STYLES.fileName} title={file ? file.path : "No file selected"}>
                {file ? file.path : "No file selected"}
              </div>

              {/* Help toggle */}
              <button
                style={STYLES.iconBtn}
                title="Help / Icon Legend"
                onClick={() => setHelpOpen(true)}
              >
                ❔
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!editing && (
                <button
                  style={STYLES.iconBtn}
                  title="Edit"
                  onClick={() => setEditing(true)}
                >
                  ✏️
                </button>
              )}
              {editing && (
                <>
                  <button
                    style={STYLES.iconBtn}
                    title="Cancel"
                    onClick={() => {
                      setEditing(false);
                      setEdited(fileContent);
                    }}
                  >
                    ↩️
                  </button>
                  <button style={STYLES.iconBtn} title="Save" onClick={save}>
                    💾
                  </button>
                </>
              )}
              <button
                style={STYLES.iconBtn}
                title="Open In Pane"
                onClick={openInPane}
              >
                📂
              </button>
              <button
                style={STYLES.iconBtn}
                title="Copy Content"
                onClick={copyToClipboard}
              >
                📋
              </button>
            </div>
            <button
              style={{ ...STYLES.iconBtn, width: 36 }}
              className="subtle-icon"
              title="Exit Full"
              onClick={exitFull}
            >
              ⤬
            </button>
          </div>

          {/* Inspector summary */}
          {showInspector && (
            <div style={STYLES.inspector}>
              <div>
                <b>Base:</b> {baseFolder ? baseFolder.path : "—"} •{" "}
                <b>Grouping:</b> {groupByFolder ? "by folder" : "flat"} •{" "}
                <b>Recursive:</b> {recursiveGrouping ? "ON" : "OFF"} •{" "}
                <b>Parts:</b> {parts}
              </div>
              <div>
                <b>Subfolders:</b>{" "}
                {subList.length ? `${subList.length} selected` : "All"}
              </div>
              <div>
                <b>Types:</b> {extSel.join(", ")}
              </div>
              <div>
                <b>SuppMgr:</b> {supplements.length} file(s) •{" "}
                <b>Quick:</b> {suppFile ? `${suppFile.path} (${suppInject ? "inject" : "no inject"}, ${suppPlace}, ${suppCopy ? "copy" : "no copy"})` : "—"}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="icon-btn"
                  style={STYLES.iconBtn}
                  title="Hide Inspector"
                  onClick={() => setShowInspector(false)}
                >
                  👁️‍🗨️
                </button>
                <button
                  className="icon-btn"
                  style={STYLES.iconBtn}
                  title="Help / Icon Legend"
                  onClick={() => setHelpOpen(true)}
                >
                  ❔
                </button>
              </div>
            </div>
          )}

          <div style={STYLES.content}>
            {status === "loading" && <p style={STYLES.pre}>Loading…</p>}
            {status === "compiling" && <p style={STYLES.pre}>Compiling…</p>}
            {status === "error" && (
              <pre style={{ ...STYLES.pre, color: "var(--text-error)" }}>
                {fileContent}
              </pre>
            )}
            {status === "loaded" &&
              (editing ? (
                <textarea
                  style={STYLES.editor}
                  value={edited}
                  onChange={(e) => setEdited(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === "s") {
                      e.preventDefault();
                      save();
                    }
                  }}
                />
              ) : (
                <pre style={STYLES.pre}>{fileContent}</pre>
              ))}
          </div>
        </div>
      ) : (
        <div style={STYLES.compact}>
          <div style={STYLES.row}>
            <button style={STYLES.iconBtn} title="Full View" onClick={enterFull}>
              ⤢
            </button>
            <button style={STYLES.iconBtn} title="Choose File" onClick={() => setFpOpen(true)}>
              📄
            </button>
            <button
              style={STYLES.iconBtn}
              title="Pick Base Folder (does not compile)"
              onClick={() => setChooseBaseOpen(true)}
            >
              📌
            </button>
            <button
              style={STYLES.iconBtn}
              title={groupByFolder ? "Grouping: by folder" : "Grouping: flat"}
              onClick={() => setGroup((v) => !v)}
            >
              {groupByFolder ? "🗃️" : "🧾"}
            </button>
            <button
              style={STYLES.iconBtn}
              title={
                recursiveGrouping
                  ? "Grouping recursion: ON"
                  : "Grouping recursion: OFF"
              }
              onClick={() => setRecursiveGrouping((v) => !v)}
            >
              🔁
            </button>
            <button
              style={STYLES.iconBtn}
              title="Subfolder Filter"
              onClick={() => setSubFilterOpen(true)}
            >
              🎯
            </button>
            <button
              style={STYLES.iconBtn}
              title="Type / Extension Filter"
              onClick={() => setExtFilterOpen(true)}
            >
              🔡
            </button>

            <div style={STYLES.partsWrap}>
              <span style={STYLES.label}>Parts</span>
              <input
                style={STYLES.numberInput}
                type="number"
                min={1}
                step={1}
                value={parts}
                onChange={(e) => setParts(Math.max(1, parseInt(e.target.value || "1", 10)))}
              />
              <button
                style={STYLES.iconBtn}
                title="Compile (uses current base folder & settings)"
                onClick={compileCurrent}
              >
                ⚙️
              </button>
            </div>

            <button
              style={STYLES.iconBtn}
              title="Supplement Manager"
              onClick={() => setSuppMgrOpen(true)}
            >
              📦
            </button>
            <button
              style={STYLES.iconBtn}
              title="Quick: pick single supplementary"
              onClick={() => setSuppPickOpen(true)}
            >
              📎
            </button>
            <button
              style={STYLES.iconBtn}
              title={`Quick Inject: ${suppInject ? "ON" : "OFF"}`}
              onClick={() => setSuppInject((v) => !v)}
            >
              🧩
            </button>
            <button
              style={STYLES.iconBtn}
              title={`Quick Placement: ${suppPlace}`}
              onClick={() => setSuppPlace((p) => (p === "append" ? "prepend" : "append"))}
            >
              {suppPlace === "append" ? "⬇️" : "⬆️"}
            </button>
            <button
              style={STYLES.iconBtn}
              title={`Quick Copy alongside outputs: ${suppCopy ? "ON" : "OFF"}`}
              onClick={() => setSuppCopy((v) => !v)}
            >
              📥
            </button>

            <button style={STYLES.iconBtn} title="Open In Pane" onClick={openInPane}>
              📂
            </button>
            <button style={STYLES.iconBtn} title="Copy Content" onClick={copyToClipboard}>
              📋
            </button>
            <button
              style={STYLES.iconBtn}
              title={showInspector ? "Hide Inspector" : "Show Inspector"}
              onClick={() => setShowInspector((s) => !s)}
            >
              👁️‍🗨️
            </button>
            <button style={STYLES.iconBtn} title="Help / Icon Legend" onClick={() => setHelpOpen(true)}>
              ❔
            </button>
          </div>

          <div style={STYLES.mini}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
              {file ? file.path : "No file selected"}
            </div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {fileContent ? fileContent.slice(0, 4000) : "Pick a file to preview here."}
            </pre>
          </div>

          {/* Compact Inspector */}
          {showInspector && (
            <div style={STYLES.inspector}>
              <div>
                <b>Base:</b> {baseFolder ? baseFolder.path : "—"} •{" "}
                <b>Grouping:</b> {groupByFolder ? "by folder" : "flat"} •{" "}
                <b>Recursive:</b> {recursiveGrouping ? "ON" : "OFF"} • <b>Parts:</b> {parts}
              </div>
              <div>
                <b>Subfolders:</b> {subList.length ? `${subList.length} selected` : "All"}
              </div>
              <div>
                <b>Types:</b> {extSel.join(", ")}
              </div>
              <div>
                <b>SuppMgr:</b> {supplements.length} •{" "}
                <b>Quick:</b> {suppFile ? `${suppFile.path} (${suppInject ? "inject" : "no"}, ${suppPlace}, ${suppCopy ? "copy" : "no"})` : "—"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

return { BasicView };

```


