


# ViewComponent

```jsx
const { useState, useEffect, useMemo, useRef } = dc;

// --- DOM Traversal Utilities ---
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

const PROPERTY_TYPES_CONFIG = {
  text: { display: 'Text', placeholder: 'Enter any text...' },
  number: { display: 'Number', placeholder: 'e.g., 42 or 3.14' },
  checkbox: { display: 'Checkbox', placeholder: 'true or false' },
  list: { display: 'List', placeholder: 'Add items below' },
  date: { display: 'Date', placeholder: 'YYYY-MM-DD' },
  datetime: { display: 'Date & time', placeholder: 'YYYY-MM-DDTHH:MM' },
};

function inferTypeFromValue(value) {
  if (typeof value === 'boolean') return 'checkbox';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'list';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return 'datetime';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
  }
  return 'text';
}

function getPropertyType(key, value, allKnownTypes) {
  return allKnownTypes[key]?.type || inferTypeFromValue(value);
}

function convertValueToType(raw, newType) {
  if (newType === 'list' && Array.isArray(raw)) return raw.slice();
  const trimmed = (typeof raw === 'string') ? raw.trim() : raw;
  switch (newType) {
    case 'number': {
      const n = parseFloat(String(trimmed));
      return Number.isFinite(n) ? n : 0;
    }
    case 'checkbox':
      return ['true', '1', 'yes', 'on', 'checked'].includes(String(trimmed).toLowerCase());
    case 'list':
      try {
        if (typeof trimmed !== 'string') return Array.isArray(trimmed) ? trimmed : [String(trimmed)];
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        if (!trimmed) return [];
        return [String(trimmed)];
      }
    case 'date':
      return String(trimmed).slice(0, 10);
    case 'datetime':
      return String(trimmed).replace(' ', 'T').slice(0, 16);
    default:
      return String(trimmed ?? '');
  }
}

async function mutateProperty(obsidianApp, files, key, value, action = 'update') {
  const promises = files.map(file => {
    return obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
      if (action === 'delete') delete frontmatter[key];
      else frontmatter[key] = value;
    });
  });
  await Promise.all(promises);
}

async function addItemToList(obsidianApp, file, key, itemToAdd) {
  await obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
    if (!Array.isArray(frontmatter[key])) frontmatter[key] = [];
    frontmatter[key].push(itemToAdd);
  });
}

async function removeItemFromList(obsidianApp, file, key, itemIndexToRemove) {
  await obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
    if (Array.isArray(frontmatter[key])) frontmatter[key].splice(itemIndexToRemove, 1);
  });
}

async function setListProperty(obsidianApp, files, key, items) {
  const list = Array.isArray(items) ? items.slice() : [];
  const promises = files.map(file => {
    return obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter[key] = list.slice();
    });
  });
  await Promise.all(promises);
}

async function appendListItems(obsidianApp, files, key, items) {
  const promises = files.map(file => {
    return obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
      if (!Array.isArray(frontmatter[key])) frontmatter[key] = [];
      const existingSet = new Set(frontmatter[key].map(v => String(v)));
      items.forEach(it => {
        const s = String(it);
        if (!existingSet.has(s)) {
          frontmatter[key].push(it);
          existingSet.add(s);
        }
      });
    });
  });
  await Promise.all(promises);
}

async function removeListItems(obsidianApp, files, key, items) {
  const toRemove = new Set(items.map(v => String(v)));
  const promises = files.map(file => {
    return obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
      if (!Array.isArray(frontmatter[key])) return;
      frontmatter[key] = frontmatter[key].filter(v => !toRemove.has(String(v)));
    });
  });
  await Promise.all(promises);
}

function ListEditorCell({ items, onAddItem, onRemoveItem, placeholder = "New list item..." }) {
  const [newItem, setNewItem] = useState("");
  const handleAdd = () => {
    if (newItem.trim()) {
      onAddItem(newItem);
      setNewItem("");
    }
  };
  return (
    <div className="datacore-list-editor">
      {items.length > 0 ? (
        <div className="datacore-list-items">
          {items.map((item, index) => (
            <div key={index} className="datacore-list-item">
              <span>{String(item)}</span>
              <button onClick={() => onRemoveItem(index)} className="datacore-icon-button" title="Remove item">
                <dc.Icon icon="x" />
              </button>
            </div>
          ))}
        </div>
      ) : <p className="datacore-empty-list-text">(empty list)</p>}
      <div className="datacore-list-add">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder={placeholder}
          className="datacore-input"
        />
        <button onClick={handleAdd} className="datacore-button">
          <dc.Icon icon="plus" />
        </button>
      </div>
    </div>
  );
}

function PropertyValueCell({ type, value, onSave, onAddItem, onRemoveItem }) {
  if (type === 'list' && Array.isArray(value)) {
    return (
      <ListEditorCell
        items={value}
        onAddItem={onAddItem}
        onRemoveItem={onRemoveItem}
      />
    );
  }
  const formatValueForInput = (val) => {
    if (val === null || typeof val === 'undefined') return '';
    if (type === 'date' && typeof val === 'string') return val.split('T')[0];
    if (type === 'datetime' && typeof val === 'string') return val.replace(' ', 'T').slice(0, 16);
    return String(val);
  };
  const [localValue, setLocalValue] = useState(() => formatValueForInput(value));
  useEffect(() => { setLocalValue(formatValueForInput(value)); }, [value, type]);
  const handleSave = () => {
    const formatted = formatValueForInput(value);
    if (localValue !== formatted) onSave(convertValueToType(localValue, type));
  };
  if (type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onSave(e.target.checked)}
        className="datacore-checkbox"
      />
    );
  }
  const inputProps = {
    value: localValue,
    onBlur: handleSave,
    onChange: e => setLocalValue(e.target.value),
    onKeyDown: (e) => { if (e.key === 'Enter') e.target.blur() },
    className: "datacore-input"
  };
  if (type === 'number') return <input type="number" step="any" {...inputProps} />;
  if (type === 'date') return <input type="date" {...inputProps} />;
  if (type === 'datetime') return <input type="datetime-local" {...inputProps} />;
  return <input type="text" {...inputProps} />;
}

function detectKeyTypeFromFiles(obsidianApp, files, key, propertyTypes) {
  let sawList = false, sawBool = false, sawNumber = false, sawDatetime = false, sawDate = false, sawStr = false;
  for (const f of files) {
    const fm = obsidianApp.metadataCache.getFileCache(f)?.frontmatter;
    if (!fm || typeof fm[key] === 'undefined') continue;
    const v = fm[key];
    if (Array.isArray(v)) { sawList = true; break; }
    if (typeof v === 'boolean') { sawBool = true; continue; }
    if (typeof v === 'number') { sawNumber = true; continue; }
    if (typeof v === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) { sawDatetime = true; continue; }
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { sawDate = true; continue; }
      sawStr = true;
    }
  }
  if (sawList) return 'list';
  if (sawBool && !sawNumber && !sawStr) return 'checkbox';
  if (sawNumber && !sawStr) return 'number';
  if (sawDatetime) return 'datetime';
  if (sawDate) return 'date';
  return propertyTypes[key]?.type || 'text';
}

function getUnionListForKey(obsidianApp, files, key) {
  const seen = new Set();
  const out = [];
  files.forEach(f => {
    const fm = obsidianApp.metadataCache.getFileCache(f)?.frontmatter;
    const arr = fm && Array.isArray(fm[key]) ? fm[key] : [];
    arr.forEach(v => {
      const s = String(v);
      if (!seen.has(s)) { seen.add(s); out.push(v); }
    });
  });
  return out;
}

function BasicView() {
  let obsidianApp;
  if (typeof dc !== 'undefined' && dc.app) obsidianApp = dc.app;
  else if (typeof app !== 'undefined') obsidianApp = app;
  if (!obsidianApp?.vault) return <h2>Waiting for Obsidian API...</h2>;

  // Get current file path and construct relative path to example file
  const currentPath = dc.resolvePath("D.q.metadataedit.component");
  console.log(currentPath)
  const exampleFilePath = currentPath 
    ? currentPath.substring(0, currentPath.lastIndexOf('/')) + '/_resources/example/Greek Sheet Pan Chicken Dinner.md'
    : null;

  // Full-tab state and refs
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `metadata-edit-wrapper-${instanceId}`;
  const [isFullTab, setIsFullTab] = useState(true);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;

  // Initialize with example file path
  const [fileInputs, setFileInputs] = useState(() => {
    return exampleFilePath 
      ? [{ id: Date.now(), path: exampleFilePath }]
      : [{ id: Date.now(), path: "" }];
  });
  const [validFiles, setValidFiles] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState({});
  const [status, setStatus] = useState({ message: "Ready.", type: "info" });
  const [isLoading, setIsLoading] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [bulkMode, setBulkMode] = useState(null);
  const [bulkEditKey, setBulkEditKey] = useState('');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [bulkEditList, setBulkEditList] = useState([]);
  const [bulkEditListMode, setBulkEditListMode] = useState('replace');
  const [bulkAddKey, setBulkAddKey] = useState("");
  const [bulkAddType, setBulkAddType] = useState("text");
  const [bulkAddValue, setBulkAddValue] = useState("");
  const [bulkAddList, setBulkAddList] = useState([]);
  const [bulkAddListMode, setBulkAddListMode] = useState('replace');
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropType, setNewPropType] = useState('text');
  const [newPropValue, setNewPropValue] = useState('');
  const [newPropList, setNewPropList] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Full-tab effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;
    const targetPaneContent = findNearestAncestorWithClass(
      container,
      "workspace-leaf-content"
    );
    if (!targetPaneContent) {
      setIsFullTab(false);
      return;
    }
    const contentWrapper =
      findDirectChildByClass(targetPaneContent, "view-content") ||
      targetPaneContent;
    stateRefs.originalParent = container.parentNode;
    stateRefs.placeholder = document.createElement("div");
    stateRefs.placeholder.style.display = "none";
    container.parentNode.insertBefore(stateRefs.placeholder, container);
    stateRefs.parentPositionInfo = {
      element: contentWrapper,
      original: window.getComputedStyle(contentWrapper).position,
    };
    if (stateRefs.parentPositionInfo.original === "static") {
      contentWrapper.style.position = "relative";
    }
    contentWrapper.appendChild(container);
    Object.assign(container.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      overflow: "auto",
    });
    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(
          container,
          stateRefs.placeholder
        );
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static"
            ? ""
            : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);

  const handleExitFullTab = (e) => {
    e.stopPropagation();
    setIsFullTab(false);
  };

  const handleEnterFullTab = () => setIsFullTab(true);

  // Update file inputs when current path changes
  useEffect(() => {
    if (currentPath && fileInputs.length === 1 && !fileInputs[0].path) {
      const newExamplePath = currentPath.substring(0, currentPath.lastIndexOf('/')) + '/_resources/example/Greek Sheet Pan Chicken Dinner.md';
      setFileInputs([{ id: Date.now(), path: newExamplePath }]);
    }
  }, [currentPath]);

  const allUniqueKeys = useMemo(() => {
    const keys = new Set();
    validFiles.forEach(f => {
      const fm = obsidianApp.metadataCache.getFileCache(f)?.frontmatter;
      if (fm) Object.keys(fm).forEach(k => keys.add(k));
    });
    return Array.from(keys).sort();
  }, [validFiles, refreshKey]);

  useEffect(() => {
    const valid = fileInputs.map(input => {
      const file = obsidianApp.vault.getAbstractFileByPath(input.path.trim());
      return (file && file.extension) ? file : null;
    }).filter(Boolean);
    setValidFiles(valid);
    if (activeFileIndex >= valid.length) setActiveFileIndex(Math.max(0, valid.length - 1));
    if (valid.length === 0) setStatus({ message: "Add at least one valid file path to begin.", type: "info" });
    else setStatus({ message: `Loaded ${valid.length} file(s). Listening for changes.`, type: "info" });
    setPropertyTypes(obsidianApp.metadataTypeManager.properties);
  }, [fileInputs, refreshKey]);

  useEffect(() => {
    if (validFiles.length === 0) return;
    const validPaths = new Set(validFiles.map(f => f.path));
    const handleMetadataChange = (file) => {
      if (validPaths.has(file.path)) {
        setStatus({ message: `Change detected in ${file.basename}. Refreshing...`, type: "info" });
        setRefreshKey(k => k + 1);
      }
    };
    obsidianApp.metadataCache.on('changed', handleMetadataChange);
    return () => { obsidianApp.metadataCache.off('changed', handleMetadataChange); };
  }, [validFiles]);

  const runOperation = async (operation, files, ...args) => {
    setIsLoading(true);
    try {
      await operation(obsidianApp, files, ...args);
      setStatus({ message: "Operation successful!", type: "success" });
    } catch (e) {
      setStatus({ message: `Error: ${e.message}`, type: "error" });
    } finally {
      setIsLoading(false);
      setBulkMode(null);
      setBulkEditValue('');
      setBulkAddKey('');
      setBulkAddValue('');
    }
  };

  const handleUpdateProperty = (file, key, value) => runOperation(mutateProperty, [file], key, value);
  const handleDeleteProperty = (file, key) => { if (window.confirm(`Delete '${key}' from ${file.basename}?`)) runOperation(mutateProperty, [file], key, null, 'delete'); };
  const handleAddItemToList = (file, key, item) => runOperation(addItemToList, [file], key, item);
  const handleRemoveItemFromList = (file, key, index) => runOperation(removeItemFromList, [file], key, index);

  const currentBulkType = bulkEditKey
    ? detectKeyTypeFromFiles(obsidianApp, validFiles, bulkEditKey, propertyTypes)
    : null;

  useEffect(() => {
    if (!bulkEditKey) { setBulkEditList([]); return; }
    const t = detectKeyTypeFromFiles(obsidianApp, validFiles, bulkEditKey, propertyTypes);
    if (t === 'list') setBulkEditList(getUnionListForKey(obsidianApp, validFiles, bulkEditKey));
    else setBulkEditList([]);
  }, [bulkEditKey, propertyTypes, validFiles]);

  const handleBulkUpdate = () => {
    if (!bulkEditKey) return;
    if (currentBulkType === 'list') {
      if (bulkEditListMode === 'replace') runOperation(setListProperty, validFiles, bulkEditKey, convertValueToType(bulkEditList, 'list'));
      else if (bulkEditListMode === 'append') runOperation(appendListItems, validFiles, bulkEditKey, convertValueToType(bulkEditList, 'list'));
      else if (bulkEditListMode === 'remove') runOperation(removeListItems, validFiles, bulkEditKey, convertValueToType(bulkEditList, 'list'));
    } else {
      runOperation(mutateProperty, validFiles, bulkEditKey, convertValueToType(bulkEditValue, currentBulkType || 'text'));
    }
  };

  const handleBulkAdd = () => {
    if (!bulkAddKey.trim()) return;
    if (bulkAddType === 'list') {
      if (bulkAddListMode === 'replace') runOperation(setListProperty, validFiles, bulkAddKey, convertValueToType(bulkAddList, 'list'));
      else runOperation(appendListItems, validFiles, bulkAddKey, convertValueToType(bulkAddList, 'list'));
    } else {
      runOperation(mutateProperty, validFiles, bulkAddKey, convertValueToType(bulkAddValue, bulkAddType));
    }
  };

  const handleBulkDelete = () => {
    if (!bulkEditKey) return;
    if (window.confirm(`Delete '${bulkEditKey}' from all ${validFiles.length} files?`)) {
      runOperation(mutateProperty, validFiles, bulkEditKey, null, 'delete');
    }
  };

  const handlePathChange = (id, newPath) => {
    setFileInputs(fileInputs.map(input => input.id === id ? { ...input, path: newPath } : input));
  };
  const addFileInput = () => { setFileInputs([...fileInputs, { id: Date.now(), path: '' }]); };
  const removeFileInput = (id) => { setFileInputs(fileInputs.filter(input => input.id !== id)); };

  const activeFile = validFiles[activeFileIndex];
  const activeFrontmatter = activeFile ? obsidianApp.metadataCache.getFileCache(activeFile)?.frontmatter : null;

  const [newPropKeyLocal, setNewPropKeyLocal] = useState('');
  useEffect(() => { setNewPropKeyLocal(newPropKey); }, [newPropKey]);

  const handleAddSingleProperty = () => {
    if (!activeFile || !newPropKey.trim()) return;
    const value = newPropType === 'list' ? convertValueToType(newPropList, 'list') : convertValueToType(newPropValue, newPropType);
    runOperation(mutateProperty, [activeFile], newPropKey, value);
    setNewPropKey('');
    setNewPropValue('');
    setNewPropList([]);
  };

  // Compact mode view
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={{
        padding: "16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        border: "1px dashed #333",
        borderRadius: "8px",
        backgroundColor: "#0a0a0a",
      }}>
        <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
          Metadata Editor is in compact mode.
        </p>
        <button
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "500",
            color: "#ffffff",
            backgroundColor: "#8b5cf6",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={handleEnterFullTab}
        >
          Enter Full Tab
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={uniqueWrapperClass}>
      <style>{`
        .${uniqueWrapperClass} .metadata-exit-icon {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }
        .${uniqueWrapperClass}:hover .metadata-exit-icon {
          opacity: 0.7;
          transform: scale(1);
        }
        .${uniqueWrapperClass} .metadata-exit-icon:hover {
          opacity: 1;
        }
        .${uniqueWrapperClass} .metadata-exit-icon:hover .exit-tooltip {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
      <div className="datacore-container">
        <div
          className="metadata-exit-icon"
          onClick={handleExitFullTab}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#666",
            userSelect: "none",
            cursor: "pointer",
            zIndex: 100,
          }}
        >
          &lt;/&gt;
          <span
            className="exit-tooltip"
            style={{
              visibility: "hidden",
              opacity: 0,
              backgroundColor: "#1a1a1a",
              color: "#ffffff",
              textAlign: "center",
              borderRadius: "4px",
              padding: "5px 10px",
              position: "absolute",
              zIndex: 1,
              top: "50%",
              right: "120%",
              transform: "translateY(-50%)",
              fontSize: "12px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              border: "1px solid #333",
            }}
          >
            Close Full Mode
          </span>
        </div>
      <div className="datacore-panel datacore-file-panel">
        <h3 style={{ margin: "0 0 12px 0", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
          <dc.Icon icon="files" style={{ color: "#8b5cf6" }} />
          File Selection
        </h3>
        <div className="datacore-file-list">
          {fileInputs.map((input) => {
            const file = obsidianApp.vault.getAbstractFileByPath(input.path.trim());
            const isValid = file && file.extension;
            return (
              <div key={input.id} className="datacore-path-input-group">
                <input
                  type="text"
                  value={input.path}
                  onChange={(e) => handlePathChange(input.id, e.target.value)}
                  placeholder="Path/to/file.md"
                  className={`datacore-input ${input.path.trim() && (isValid ? 'is-valid' : 'is-invalid')}`}
                />
                {fileInputs.length > 1 && <button onClick={() => removeFileInput(input.id)} className="datacore-remove-button" title="Remove">
                  <dc.Icon icon="x" />
                </button>}
              </div>
            );
          })}
        </div>
        <button onClick={addFileInput} className="datacore-add-path-button">
          <dc.Icon icon="plus" style={{ marginRight: "6px" }} />
          Add File Path
        </button>
      </div>

      <div className="datacore-panel datacore-editor-panel">
        {isLoading && <div className="datacore-loading-overlay"><div className="datacore-spinner"></div></div>}
        {validFiles.length > 0 ? (
          <>
            <div className="datacore-toolbar">
              <div className="datacore-bulk-edit-group">
                <select 
                  className="datacore-select" 
                  value={bulkEditKey} 
                  onChange={e => { setBulkEditKey(e.target.value); setBulkEditValue(''); }}
                  style={{ color: '#ffffff', backgroundColor: '#1a1a1a', padding: '8px', minHeight: '36px' }}
                >
                  <option value="" style={{ color: '#ffffff', backgroundColor: '#1a1a1a' }}>Bulk Edit a Property...</option>
                  {allUniqueKeys.map(key => <option key={key} value={key} style={{ color: '#ffffff', backgroundColor: '#1a1a1a' }}>{key}</option>)}
                </select>
                {bulkEditKey && (
                  <>
                    {currentBulkType === 'list' ? (
                      <div className="datacore-bulk-list-wrap">
                        <div className="datacore-segment">
                          <label className={`seg ${bulkEditListMode==='replace'?'active':''}`} onClick={()=>setBulkEditListMode('replace')}>Replace</label>
                          <label className={`seg ${bulkEditListMode==='append'?'active':''}`} onClick={()=>setBulkEditListMode('append')}>Append</label>
                          <label className={`seg ${bulkEditListMode==='remove'?'active':''}`} onClick={()=>setBulkEditListMode('remove')}>Remove</label>
                        </div>
                        <ListEditorCell
                          items={bulkEditList}
                          onAddItem={(it) => setBulkEditList(prev => [...prev, it])}
                          onRemoveItem={(idx) => setBulkEditList(prev => prev.filter((_, i) => i !== idx))}
                          placeholder="Add list item..."
                        />
                      </div>
                    ) : currentBulkType === 'checkbox' ? (
                      <input
                        type="checkbox"
                        checked={['true', '1', 'yes', 'on', 'checked'].includes(String(bulkEditValue).toLowerCase())}
                        onChange={(e) => setBulkEditValue(e.target.checked ? 'true' : 'false')}
                        className="datacore-checkbox"
                      />
                    ) : currentBulkType === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        value={bulkEditValue}
                        onChange={e => setBulkEditValue(e.target.value)}
                        placeholder={PROPERTY_TYPES_CONFIG.number.placeholder}
                        className="datacore-input"
                      />
                    ) : currentBulkType === 'date' ? (
                      <input
                        type="date"
                        value={bulkEditValue}
                        onChange={e => setBulkEditValue(e.target.value)}
                        placeholder={PROPERTY_TYPES_CONFIG.date.placeholder}
                        className="datacore-input"
                      />
                    ) : currentBulkType === 'datetime' ? (
                      <input
                        type="datetime-local"
                        value={bulkEditValue}
                        onChange={e => setBulkEditValue(e.target.value)}
                        placeholder={PROPERTY_TYPES_CONFIG.datetime.placeholder}
                        className="datacore-input"
                      />
                    ) : (
                      <input
                        type="text"
                        value={bulkEditValue}
                        onChange={e => setBulkEditValue(e.target.value)}
                        placeholder={PROPERTY_TYPES_CONFIG.text.placeholder}
                        className="datacore-input"
                      />
                    )}
                    <button onClick={handleBulkUpdate} className="datacore-button">Update All</button>
                  </>
                )}
              </div>
              <div className="datacore-bulk-actions">
                <button onClick={() => setBulkMode(bulkMode === 'add' ? null : 'add')} className="datacore-button">
                  <dc.Icon icon="plus" style={{ marginRight: "4px" }} />
                  Bulk Add
                </button>
                <button onClick={() => setBulkMode(bulkMode === 'delete' ? null : 'delete')} className="datacore-button-danger">
                  <dc.Icon icon="trash-2" style={{ marginRight: "4px" }} />
                  Bulk Delete
                </button>
              </div>
            </div>

            {bulkMode === 'add' && (
              <div className="datacore-modal-backdrop" onClick={() => setBulkMode(null)}>
                <div className="datacore-modal" onClick={e => e.stopPropagation()}>
                  <h3>Add Property to {validFiles.length} Files</h3>
                  <input type="text" value={bulkAddKey} onChange={e => setBulkAddKey(e.target.value)} placeholder="New Property Key" className="datacore-input" />
                  <select 
                    value={bulkAddType} 
                    onChange={e => { setBulkAddType(e.target.value); setBulkAddValue(''); setBulkAddList([]); }} 
                    className="datacore-select"
                    style={{ color: '#ffffff', backgroundColor: '#1a1a1a', padding: '8px', minHeight: '36px' }}
                  >
                    {Object.entries(PROPERTY_TYPES_CONFIG).map(([id, config]) => <option key={id} value={id} style={{ color: '#ffffff', backgroundColor: '#1a1a1a' }}>{config.display}</option>)}
                  </select>
                  {bulkAddType === 'list' ? (
                    <>
                      <div className="datacore-segment">
                        <label className={`seg ${bulkAddListMode==='replace'?'active':''}`} onClick={()=>setBulkAddListMode('replace')}>Replace if exists</label>
                        <label className={`seg ${bulkAddListMode==='append'?'active':''}`} onClick={()=>setBulkAddListMode('append')}>Append if exists</label>
                      </div>
                      <ListEditorCell
                        items={bulkAddList}
                        onAddItem={(it) => setBulkAddList(prev => [...prev, it])}
                        onRemoveItem={(idx) => setBulkAddList(prev => prev.filter((_, i) => i !== idx))}
                        placeholder="Add list item..."
                      />
                    </>
                  ) : bulkAddType === 'checkbox' ? (
                    <div className="datacore-checkbox-row">
                      <label className="datacore-checkbox-label">Checked</label>
                      <input
                        type="checkbox"
                        checked={['true', '1', 'yes', 'on', 'checked'].includes(String(bulkAddValue).toLowerCase())}
                        onChange={(e) => setBulkAddValue(e.target.checked ? 'true' : 'false')}
                        className="datacore-checkbox"
                      />
                    </div>
                  ) : bulkAddType === 'number' ? (
                    <input type="number" step="any" value={bulkAddValue} onChange={e => setBulkAddValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.number.placeholder} className="datacore-input" />
                  ) : bulkAddType === 'date' ? (
                    <input type="date" value={bulkAddValue} onChange={e => setBulkAddValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.date.placeholder} className="datacore-input" />
                  ) : bulkAddType === 'datetime' ? (
                    <input type="datetime-local" value={bulkAddValue} onChange={e => setBulkAddValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.datetime.placeholder} className="datacore-input" />
                  ) : (
                    <input type="text" value={bulkAddValue} onChange={e => setBulkAddValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG[bulkAddType].placeholder} className="datacore-input" />
                  )}
                  <div className="datacore-modal-actions">
                    <button onClick={() => setBulkMode(null)} className="datacore-button-secondary">Cancel</button>
                    <button onClick={handleBulkAdd} disabled={!bulkAddKey.trim()} className="datacore-button">Add to All</button>
                  </div>
                </div>
              </div>
            )}

            {bulkMode === 'delete' && (
              <div className="datacore-modal-backdrop" onClick={() => setBulkMode(null)}>
                <div className="datacore-modal" onClick={e => e.stopPropagation()}>
                  <h3>Delete Property from {validFiles.length} Files</h3>
                  <select 
                    className="datacore-select" 
                    value={bulkEditKey} 
                    onChange={e => setBulkEditKey(e.target.value)}
                    style={{ color: '#ffffff', backgroundColor: '#1a1a1a', padding: '8px', minHeight: '36px' }}
                  >
                    <option value="" style={{ color: '#ffffff', backgroundColor: '#1a1a1a' }}>Select property to delete...</option>
                    {allUniqueKeys.map(key => <option key={key} value={key} style={{ color: '#ffffff', backgroundColor: '#1a1a1a' }}>{key}</option>)}
                  </select>
                  <div className="datacore-modal-actions">
                    <button onClick={() => setBulkMode(null)} className="datacore-button-secondary">Cancel</button>
                    <button onClick={handleBulkDelete} disabled={!bulkEditKey} className="datacore-button-danger">Delete from All</button>
                  </div>
                </div>
              </div>
            )}

            <div className="datacore-tabs">
              {validFiles.map((file, index) => (
                <button key={file.path} onClick={() => setActiveFileIndex(index)} className={`datacore-tab ${index === activeFileIndex ? 'is-active' : ''}`}>{file.basename}</button>
              ))}
            </div>

            <div className="datacore-table-container">
              {activeFile && activeFrontmatter ? (
                <table className="datacore-table">
                  <thead><tr><th>Attribute</th><th>Type</th><th>Value</th><th>Actions</th></tr></thead>
                  <tbody>
                  {Object.entries(activeFrontmatter).sort(([a],[b]) => a.localeCompare(b)).map(([key, value]) => {
                    const currentType = getPropertyType(key, value, propertyTypes);
                    return (
                      <tr key={key}>
                        <td><code>{key}</code></td>
                        <td>
                          <select 
                            value={currentType} 
                            disabled 
                            className="datacore-select"
                            style={{ color: '#ffffff', backgroundColor: '#1a1a1a', padding: '8px', minHeight: '36px' }}
                          >
                            {Object.entries(PROPERTY_TYPES_CONFIG).map(([id, config]) => <option key={id} value={id} style={{ color: '#ffffff', backgroundColor: '#1a1a1a' }}>{config.display}</option>)}
                          </select>
                        </td>
                        <td>
                          <PropertyValueCell
                            type={currentType}
                            value={value}
                            onSave={(val) => handleUpdateProperty(activeFile, key, val)}
                            onAddItem={(item) => handleAddItemToList(activeFile, key, item)}
                            onRemoveItem={(index) => handleRemoveItemFromList(activeFile, key, index)}
                          />
                        </td>
                        <td>
                          <button onClick={() => handleDeleteProperty(activeFile, key)} className="datacore-icon-button" title={`Delete '${key}'`}>
                            <dc.Icon icon="trash-2" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              ) : (
                <div className="datacore-empty-state"><p>Select a file tab to view its properties.</p></div>
              )}
            </div>

            {activeFile && (
              <div className="datacore-add-single">
                <h4>Add Property to This File</h4>
                <div className="datacore-add-grid">
                  <input type="text" value={newPropKey} onChange={e => setNewPropKey(e.target.value)} placeholder="Property key" className="datacore-input" />
                  <select value={newPropType} onChange={e => { setNewPropType(e.target.value); setNewPropValue(''); setNewPropList([]); }} className="datacore-select" style={{ color: '#ffffff', backgroundColor: '#1a1a1a', padding: '8px', minHeight: '36px' }}>
                    {Object.entries(PROPERTY_TYPES_CONFIG).map(([id, config]) => <option key={id} value={id} style={{ color: '#ffffff', backgroundColor: '#1a1a1a' }}>{config.display}</option>)}
                  </select>
                  {newPropType === 'list' ? (
                    <div className="datacore-add-list">
                      <ListEditorCell
                        items={newPropList}
                        onAddItem={(it) => setNewPropList(prev => [...prev, it])}
                        onRemoveItem={(idx) => setNewPropList(prev => prev.filter((_, i) => i !== idx))}
                        placeholder="Add list item..."
                      />
                    </div>
                  ) : newPropType === 'checkbox' ? (
                    <div className="datacore-checkbox-row">
                      <label className="datacore-checkbox-label">Checked</label>
                      <input
                        type="checkbox"
                        checked={['true', '1', 'yes', 'on', 'checked'].includes(String(newPropValue).toLowerCase())}
                        onChange={(e) => setNewPropValue(e.target.checked ? 'true' : 'false')}
                        className="datacore-checkbox"
                      />
                    </div>
                  ) : newPropType === 'number' ? (
                    <input type="number" step="any" value={newPropValue} onChange={e => setNewPropValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.number.placeholder} className="datacore-input" />
                  ) : newPropType === 'date' ? (
                    <input type="date" value={newPropValue} onChange={e => setNewPropValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.date.placeholder} className="datacore-input" />
                  ) : newPropType === 'datetime' ? (
                    <input type="datetime-local" value={newPropValue} onChange={e => setNewPropValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.datetime.placeholder} className="datacore-input" />
                  ) : (
                    <input type="text" value={newPropValue} onChange={e => setNewPropValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.text.placeholder} className="datacore-input" />
                  )}
                  <button onClick={handleAddSingleProperty} disabled={!newPropKey.trim()} className="datacore-button datacore-add-single-btn">Add Property</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="datacore-empty-state">
            <h3>Select Files to Begin</h3>
            <p>Add valid file paths in the top panel to start editing their frontmatter.</p>
          </div>
        )}
      </div>

      <div className={`datacore-status-bar status-${status.type}`}><b>Status:</b> {status.message}</div>
      <style>{`
        .datacore-container { display: flex; flex-direction: column; gap: 16px; height: 90vh; width: 100%; padding: 16px; background-color: #000000; border-radius: 12px; }
        .datacore-panel { background-color: #0a0a0a; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; min-height: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.5); border: 1px solid #1a1a1a; }
        .datacore-file-panel { min-height: 150px; flex-shrink: 0; gap: 10px; }
        .datacore-editor-panel { flex-grow: 1; position: relative; gap: 12px; }
        .datacore-file-list { flex: 1; overflow-y: auto; margin-bottom: 10px; }
        .datacore-input, .datacore-select, .datacore-container textarea { 
          width: 100%; 
          padding: 10px 12px; 
          box-sizing: border-box; 
          background-color: #1a1a1a; 
          border: 1px solid #333; 
          border-radius: 10px; 
          color: #ffffff !important; 
          font-family: inherit; 
          font-size: 14px; 
          transition: border 120ms ease, box-shadow 120ms ease; 
        }
        .datacore-input::placeholder { color: #666; }
        .datacore-select { 
          appearance: none; 
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="%23888" d="M6 9L1 4h10z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
          cursor: pointer;
          color: #ffffff !important;
        }
        .datacore-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .datacore-select option { 
          background-color: #1a1a1a !important; 
          color: #ffffff !important; 
          padding: 10px 12px;
          font-size: 14px;
        }
        .datacore-input:focus, .datacore-select:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.25); }
        .datacore-input.is-valid { border-left: 3px solid #10b981; }
        .datacore-input.is-invalid { border-left: 3px solid #ef4444; }
        .datacore-path-input-group { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .datacore-remove-button { background-color: #ef4444; color: white; border: none; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; }
        .datacore-add-path-button { background: linear-gradient(180deg, #8b5cf6, #7c3aed); color: #ffffff; border: none; padding: 12px; width: 100%; margin-top: 5px; border-radius: 10px; cursor: pointer; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .datacore-add-path-button:hover { background: linear-gradient(180deg, #7c3aed, #6d28d9); }
        .datacore-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
        .datacore-bulk-edit-group { display: flex; align-items: flex-start; gap: 10px; flex-grow: 1; min-width: 320px; }
        .datacore-bulk-actions { display: flex; gap: 8px; }
        .datacore-tabs { display: flex; flex-wrap: wrap; border-bottom: 1px solid #333; gap: 6px; padding-bottom: 6px; }
        .datacore-tab { background: #1a1a1a; border: 1px solid #333; padding: 8px 12px; cursor: pointer; color: #888; border-radius: 999px; transition: all 0.2s ease; }
        .datacore-tab:hover { color: #ffffff; border-color: #8b5cf6; }
        .datacore-tab.is-active { color: #ffffff; font-weight: 700; border-color: #8b5cf6; background: rgba(139, 92, 246, 0.15); }
        .datacore-table-container { flex: 1; overflow-y: auto; border: 1px solid #333; border-radius: 10px; margin-top: 8px; background-color: #0a0a0a; }
        .datacore-table { width: 100%; border-collapse: collapse; }
        .datacore-table th, .datacore-table td { padding: 12px; border-bottom: 1px solid #1a1a1a; text-align: left; vertical-align: middle; color: #ffffff; }
        .datacore-table th { background-color: #000000; font-weight: 700; color: #888; position: sticky; top: 0; z-index: 1; }
        .datacore-table tr:hover { background-color: #0f0f0f; }
        .datacore-table tr:last-child td { border-bottom: none; }
        .datacore-table code { background-color: #1a1a1a; padding: 4px 8px; border-radius: 6px; color: #8b5cf6; }
        .datacore-checkbox { transform: scale(1.2); cursor: pointer; accent-color: #8b5cf6; }
        .datacore-button, .datacore-icon-button { padding: 10px 16px; background-color: #8b5cf6; color: #ffffff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: filter 120ms ease, transform 60ms ease; display: inline-flex; align-items: center; justify-content: center; }
        .datacore-button:hover { filter: brightness(1.15); }
        .datacore-button:active { transform: translateY(1px); }
        .datacore-button-danger { background-color: #ef4444; color: white; }
        .datacore-button-danger:hover { filter: brightness(1.15); }
        .datacore-button-secondary { background-color: #333; color: #ffffff; }
        .datacore-button-secondary:hover { background-color: #444; }
        .datacore-icon-button { background: none; color: #888; font-size: 18px; padding: 4px; border-radius: 8px; }
        .datacore-icon-button:hover { color: #ef4444; background: #1a1a1a; }
        .datacore-empty-state { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%; color: #666; gap: 6px; }
        .datacore-status-bar { flex-shrink: 0; border-top: 1px solid #333; padding-top: 12px; font-size: 13px; color: #888; }
        .status-success { color: #10b981; } .status-error { color: #ef4444; }
        .datacore-modal-backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.8); z-index: 100; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(4px); padding: 16px; }
        .datacore-modal { background-color: #0a0a0a; padding: 24px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 560px; border: 1px solid #1a1a1a; }
        .datacore-modal h3 { color: #ffffff; margin: 0 0 8px 0; }
        .datacore-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        .datacore-loading-overlay { position: absolute; inset: 0; background-color: rgba(0,0,0,0.8); z-index: 10; display: flex; justify-content: center; align-items: center; border-radius: 12px; }
        .datacore-spinner { width: 44px; height: 44px; border: 4px solid #333; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .datacore-list-editor { display: flex; flex-direction: column; gap: 8px; }
        .datacore-list-items { display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; }
        .datacore-list-item { display: flex; justify-content: space-between; align-items: center; background-color: #1a1a1a; padding: 8px 10px; border-radius: 8px; color: #ffffff; }
        .datacore-empty-list-text { color: #666; font-style: italic; padding: 6px 10px; }
        .datacore-list-add { display: flex; gap: 8px; }
        .datacore-list-add .datacore-button { padding: 8px 12px; }
        .datacore-bulk-list-wrap { flex: 1; min-width: 320px; }
        .datacore-checkbox-row { display: flex; align-items: center; gap: 10px; }
        .datacore-checkbox-label { color: #888; }
        .datacore-add-single { margin-top: 12px; padding: 12px; border: 1px dashed #333; border-radius: 12px; background: #0a0a0a; }
        .datacore-add-single h4 { color: #ffffff; margin: 0 0 12px 0; }
        .datacore-add-grid { display: grid; grid-template-columns: 1.2fr 0.8fr 2fr auto; gap: 10px; align-items: start; }
        .datacore-add-list { grid-column: span 2; }
        .datacore-add-single-btn { white-space: nowrap; }
        .datacore-segment { display: inline-flex; background: #1a1a1a; border: 1px solid #333; border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
        .datacore-segment .seg { padding: 6px 10px; cursor: pointer; color: #888; }
        .datacore-segment .seg.active { background: rgba(139, 92, 246, 0.2); color: #ffffff; font-weight: 700; }
      `}</style>
      </div>
    </div>
  );
}

return { BasicView };

```


