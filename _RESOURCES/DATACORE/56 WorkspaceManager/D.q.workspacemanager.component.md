



# ViewComponent

```jsx
const { useEffect, useRef, useState, useCallback, useMemo } = dc;

// --- UTILITY FUNCTIONS & HOOKS ---
function findNearestAncestorWithClass(element, className) { if (!element) return null; let current = element.parentNode; while (current) { if (current.classList && current.classList.contains(className)) { return current; } current = current.parentNode; } return null; }
function findDirectChildByClass(parent, className) { if (!parent) return null; for (const child of parent.children) { if (child.classList && child.classList.contains(className)) { return child; } } return null; }

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

// --- CUSTOM MODALS REPLACED WITH BROWSER DEFAULTS ---
// Using window.confirm for confirmation dialogs
function showConfirm(title, message, onConfirm) {
    const result = window.confirm(`${title}\n\n${message}`);
    onConfirm(result);
}

// Using window.prompt for name input
function showNamePrompt(title, placeholder, onSubmit) {
    const result = window.prompt(title, placeholder);
    if (result !== null) { // User clicked OK
        const value = result.trim();
        if (value) {
            onSubmit(value);
        }
    }
    // If result is null, user clicked Cancel, so we do nothing.
}


// --- OPTIMIZED VIRTUALIZED LIST COMPONENT ---
function VirtualizedList({ items, renderItem, itemHeight, containerHeight }) {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);

    const onScroll = (e) => setScrollTop(e.currentTarget.scrollTop);

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
        items.length - 1,
        Math.floor((scrollTop + containerHeight) / itemHeight)
    );

    const visibleItems = useMemo(() => {
        const result = [];
        for (let i = startIndex; i <= endIndex; i++) {
            if (items[i]) {
                result.push(
                    <div key={items[i].path} style={{ position: 'absolute', top: `${i * itemHeight}px`, width: '100%' }}>
                        {renderItem(items[i])}
                    </div>
                );
            }
        }
        return result;
    }, [startIndex, endIndex, items, renderItem, itemHeight]);

    const STYLES = {
        container: { flex: 1, overflowY: 'auto', position: 'relative', height: `${containerHeight}px` },
        content: { height: `${items.length * itemHeight}px`, position: 'relative' },
    };

    return (
        <div ref={containerRef} style={STYLES.container} onScroll={onScroll}>
            <div style={STYLES.content}>
                {visibleItems}
            </div>
        </div>
    );
}

// --- OPTIMIZED FILE SEARCH PANEL COMPONENT ---
function FileSearchPanel({ allFiles, searchTerm, setSearchTerm, onFileDragStart, debouncedSearchTerm }) {
    const ITEM_HEIGHT = 34;
    const containerRef = useRef(null);
    const [containerHeight, setContainerHeight] = useState(300);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                setContainerHeight(entries[0].target.clientHeight);
            }
        });
        if (containerRef.current) {
            setContainerHeight(containerRef.current.clientHeight);
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, []);

    const STYLES = {
        panel: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '8px', borderLeft: '1px solid #444', width: '250px', flexShrink: 0 },
        searchInput: { width: '100%', padding: '8px', backgroundColor: '#333', color: '#e0e0e0', border: '1px solid #555', borderRadius: '4px', boxSizing: 'border-box' },
        fileListContainer: { flex: 1, minHeight: 0 },
        fileItem: { padding: '8px', fontSize: '13px', backgroundColor: '#3c3c3c', borderRadius: '4px', cursor: 'grab', userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.5', height: `${ITEM_HEIGHT}px`, boxSizing: 'border-box' },
    };

    const filteredFiles = useMemo(() => {
        if (!debouncedSearchTerm) return allFiles;
        const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
        return allFiles.filter(file => file.path.toLowerCase().includes(lowerCaseSearchTerm));
    }, [allFiles, debouncedSearchTerm]);

    const renderFileItem = useCallback((file) => (
        <div style={STYLES.fileItem} draggable="true" onDragStart={(e) => onFileDragStart(e, file.path)} title={file.path}>
            {file.name}
        </div>
    ), [onFileDragStart]);

    return (
        <div style={STYLES.panel}>
            <input type="text" style={STYLES.searchInput} placeholder="Search files..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div ref={containerRef} style={STYLES.fileListContainer}>
                {containerHeight > 0 && <VirtualizedList items={filteredFiles} renderItem={renderFileItem} itemHeight={ITEM_HEIGHT} containerHeight={containerHeight} />}
            </div>
        </div>
    );
}

// --- RECURSIVE LAYOUT RENDERER COMPONENT ---
function LayoutNode({ node, isDebugVisible, depth = 0, onDelete, onDrop, onAddNode, onSplit, dragOverId, setDragOverId }) {
    if (!node || typeof node !== 'object') return null;
    
    const isDroppableContainer = node.type === 'split' || node.type === 'tabs';
    const STYLES = {
        split: { display: 'flex', flex: '1 1 0%', margin: '2px', padding: '4px', border: '1px solid #555', borderRadius: '8px', minWidth: 0, minHeight: 0, position: 'relative', transition: 'border-color 0.2s ease, border-width 0.2s ease' },
        tabs: { display: 'flex', flexDirection: 'column', flex: 1, border: '1px solid #444', borderRadius: '8px', padding: '8px', margin: '4px', backgroundColor: 'rgba(20,20,20,0.3)', position: 'relative', transition: 'border-color 0.2s ease, border-width 0.2s ease' },
        leaf: { display: 'flex', flex: 1, backgroundColor: '#3a3a3a', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '12px', margin: '4px', border: '1px solid #555', borderRadius: '12px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.4)', minHeight: '40px', position: 'relative' },
        header: { fontSize: '12px', color: '#888', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #555', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        fileInfo: { fontSize: '13px', color: '#b0bec5', fontStyle: 'italic', wordBreak: 'break-all' },
        typeInfo: { fontSize: '13px', color: '#b0bec5', fontStyle: 'italic' },
        debugInfo: { position: 'absolute', top: '2px', left: '4px', fontSize: '9px', fontFamily: 'monospace', color: 'rgb(255, 121, 121)', backgroundColor: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: '2px', zIndex: 10 },
        actionButton: { position: 'absolute', top: '2px', right: '4px', cursor: 'pointer', zIndex: 11, fontSize: '14px', userSelect: 'none', display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: '3px' },
        icon: { color: 'rgb(255, 121, 121)', lineHeight: '1' },
        addIcon: { color: '#76e076', fontWeight: 'bold', lineHeight: '1' },
        splitIcon: { color: '#6ab0f3', fontWeight: 'bold', lineHeight: '1', fontSize: '12px' },
        dragOver: { borderColor: '#8A2BE2', borderWidth: '2px' }
    };

    const { type, children, state, direction, id } = node;

    const handleDelete = (e) => { e.stopPropagation(); onDelete(id); };
    const handleAdd = (e) => { e.stopPropagation(); onAddNode(id); };
    const handleSplit = (e, dir) => { e.stopPropagation(); onSplit(id, dir); };
    const handleDragStart = (e) => { e.stopPropagation(); e.dataTransfer.setData('application/node-id', id); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e) => { if (isDroppableContainer) { e.preventDefault(); e.stopPropagation(); setDragOverId(id); } };
    const handleDragLeave = (e) => { e.stopPropagation(); setDragOverId(null); };
    const handleDrop = (e) => { if (isDroppableContainer) { e.preventDefault(); e.stopPropagation(); onDrop(e, id); setDragOverId(null); }};

    const wrapperProps = { onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop };

    switch (type) {
        case 'split':
            const splitStyle = { ...STYLES.split, flexDirection: direction === 'horizontal' ? 'column' : 'row', ...(dragOverId === id ? STYLES.dragOver : {}) };
            return <div style={splitStyle} {...wrapperProps} draggable="true" onDragStart={handleDragStart}>{isDebugVisible && <div style={STYLES.debugInfo}>{`type: ${type}, dir: ${direction}`}</div>}<div style={STYLES.actionButton}><span style={STYLES.addIcon} onClick={handleAdd} title="Add New Pane Here">+</span><span style={STYLES.icon} onClick={handleDelete} title="Delete Split">&times;</span></div>{(children || []).map((child) => <LayoutNode key={child.id} {...{node: child, isDebugVisible, depth: depth + 1, onDelete, onDrop, onAddNode, onSplit, dragOverId, setDragOverId}} />)}</div>;
        case 'tabs':
            const tabStyle = { ...STYLES.tabs, ...(dragOverId === id ? STYLES.dragOver : {}) };
            return <div style={tabStyle} {...wrapperProps} draggable="true" onDragStart={handleDragStart}>{isDebugVisible && <div style={STYLES.debugInfo}>{`type: ${type}`}</div>}<div style={STYLES.header}><span>Tab Group</span><div style={{display:'flex', gap: '8px', alignItems: 'center'}}><span style={STYLES.splitIcon} onClick={(e) => handleSplit(e, 'vertical')} title="Split Vertical">↔</span><span style={STYLES.splitIcon} onClick={(e) => handleSplit(e, 'horizontal')} title="Split Horizontal">↕</span><span style={STYLES.addIcon} onClick={handleAdd} title="Add New Pane Here">+</span><span style={STYLES.icon} onClick={handleDelete} title="Delete Tab Group">&times;</span></div></div>{(children || []).map((leaf) => <LayoutNode key={leaf.id} {...{node: leaf, isDebugVisible, depth: depth + 1, onDelete, onDrop, onAddNode, onSplit, dragOverId, setDragOverId}} />)}</div>;
        case 'leaf':
            const leafContent = state?.state?.file ? <span style={STYLES.fileInfo}>{state.state.file.split('/').pop()}</span> : <span style={STYLES.typeInfo}>{state?.type || 'Empty Pane'}</span>;
            return <div style={STYLES.leaf} title={state?.state?.file || state?.type} draggable="true" onDragStart={handleDragStart}>{isDebugVisible && <div style={STYLES.debugInfo}>{`type: ${type}`}</div>}<div style={STYLES.actionButton}><span style={STYLES.icon} onClick={handleDelete} title="Delete Pane">&times;</span></div>{leafContent}</div>;
        default:
             if (children && Array.isArray(children)) return children.map((child) => <LayoutNode key={child.id} {...{node: child, isDebugVisible, depth: depth + 1, onDelete, onDrop, onAddNode, onSplit, dragOverId, setDragOverId}} />);
             return null;
    }
}

// --- MAIN WORKSPACE EDITOR COMPONENT ---
function WorkspaceLayoutViewer() {
  const uniqueWrapperClass = "interactive-wrapper-" + useRef(Math.random().toString(36).substr(2, 9)).current;
  const STYLES = {
    hoverEffectStyle: `.${uniqueWrapperClass}:hover .subtle-icon { opacity: 0.7; transform: scale(1); }`,
    fullTabWrapper: { position: 'relative', height: "100%", width: "100%", padding: "20px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "15px", backgroundColor: "var(--background-secondary)", color: "var(--text-normal)" },
    exitIcon: { position: "absolute", top: "15px", right: "20px", fontFamily: "monospace", fontSize: "14px", color: "var(--text-faint)", userSelect: "none", cursor: "pointer", opacity: 0, transform: "scale(0.9)", transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out", zIndex: 10, },
    compactWrapper: { padding: "16px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", border: "1px dashed var(--background-modifier-border)", borderRadius: "8px", backgroundColor: "var(--background-primary-alt)" },
    compactText: { margin: 0, color: "var(--text-muted)", fontSize: "14px" },
    buttonGroup: { display: "flex", gap: "10px" },
    button: { padding: "8px 16px", fontSize: "12px", fontWeight: "500", color: "var(--text-on-accent)", backgroundColor: "var(--interactive-accent)", border: "none", borderRadius: "6px", cursor: "pointer" },
    secondaryButton: { backgroundColor: "var(--background-modifier-hover)", color: "var(--text-muted)" },
    header: { fontSize: '24px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
    controls: { display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '8px', flexShrink: 0, flexWrap: 'wrap' },
    select: { flex: '1 1 180px', padding: '8px', backgroundColor: '#333', color: '#e0e0e0', border: '1px solid #555', borderRadius: '4px' },
    layoutContainerWrapper: { flex: 1, display: 'flex', gap: '10px', overflow: 'hidden' },
    layoutContainer: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', border: '2px dashed #8A2BE2', padding: '10px', borderRadius: '8px', minHeight: '200px' },
    sidebarContainer: { display: 'flex', gap: '10px', flex: 1, minHeight: 0 },
    mainArea: { flex: 3, display: 'flex', flexDirection: 'column', minWidth: 0 },
    sidebar: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
    areaTitle: { textAlign: 'center', padding: '5px', color: '#aaa', fontSize: '12px', backgroundColor: '#2f2f2f', borderBottom: '1px solid #666', borderRadius: '4px 4px 0 0' },
    debugContainer: { marginTop: '15px', border: '1px solid #444', borderRadius: '4px', flexShrink: 0 },
    debugPre: { backgroundColor: '#222', color: '#d0d0d0', padding: '15px', margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' },
    iconButton: { padding: '6px', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' },
    error: { color: '#ff5555', backgroundColor: '#2d1c1c', border: '1px solid #c53030', borderRadius: '4px', padding: '15px' },
    managementButton: { padding: '8px 12px', fontSize: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 },
    saveButton: { fontWeight: 'bold', color: 'var(--text-on-accent)', backgroundColor: 'var(--interactive-success)' }
  };

  const [isFullTab, setIsFullTab] = useState(true);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;
  const [layout, setLayout] = useState(null);
  const [savedWorkspaces, setSavedWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [allFiles, setAllFiles] = useState([]);
  const [isFilePanelVisible, setIsFilePanelVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [dragOverId, setDragOverId] = useState(null);
  
  const getPlugin = () => { const plugin = dc.app.internalPlugins.plugins['workspaces']?.instance; if (!plugin) throw new Error("The 'Workspaces' core plugin could not be accessed."); return plugin; };
  
  const loadWorkspaceList = useCallback(() => {
    setIsLoading(true); setError(null);
    try {
        const plugin = getPlugin();
        const savedData = plugin.workspaces || {};
        const workspaceIds = Object.keys(savedData);
        setSavedWorkspaces(workspaceIds.map(id => ({ id, name: id })));
        if (!selectedWorkspaceId || !workspaceIds.includes(selectedWorkspaceId)) {
            const newSelection = plugin.activeWorkspace && workspaceIds.includes(plugin.activeWorkspace) ? plugin.activeWorkspace : (workspaceIds[0] || '');
            setSelectedWorkspaceId(newSelection);
        }
    } catch (e) { setError(e.message); } finally { setIsLoading(false); }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    const files = dc.app.vault.getMarkdownFiles();
    setAllFiles(files);
    loadWorkspaceList();
  }, [loadWorkspaceList]);

  useEffect(() => {
    if (!selectedWorkspaceId) { setLayout(null); return; }
    try {
        const plugin = getPlugin();
        const rawLayout = JSON.parse(JSON.stringify(plugin.workspaces[selectedWorkspaceId] || null));
        const addIds = (node, prefix = 'node') => { if (!node || typeof node !== 'object') return node; node.id = `${prefix}-${Math.random().toString(36).substr(2, 9)}`; if (node.children) { node.children = node.children.map((child, index) => addIds(child, `${node.id}-${index}`)); } return node; };
        if (rawLayout) { if (rawLayout.main) rawLayout.main = addIds(rawLayout.main, 'main'); if (rawLayout.left) rawLayout.left = addIds(rawLayout.left, 'left'); if (rawLayout.right) rawLayout.right = addIds(rawLayout.right, 'right'); }
        setLayout(rawLayout);
    } catch (e) { setError(`Could not load layout for "${selectedWorkspaceId}".`); setLayout(null); }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    const container = containerRef.current; if (!container) return; if (isFullTab) { if (!container.parentNode) { setTimeout(() => setIsFullTab(true), 50); return; } const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content'); if (!targetPaneContent) { setIsFullTab(false); return; } const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent; stateRefs.originalParent = container.parentNode; stateRefs.placeholder = document.createElement('div'); container.parentNode.insertBefore(stateRefs.placeholder, container); const computedParentPosition = window.getComputedStyle(contentWrapper).position; stateRefs.parentPositionInfo = { element: contentWrapper, originalInlinePosition: contentWrapper.style.position }; if (computedParentPosition === 'static') contentWrapper.style.position = "relative"; contentWrapper.appendChild(container); Object.assign(container.style, { position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: "9998", overflow: "hidden" }); } return () => { if (!stateRefs.originalParent) return; if (stateRefs.placeholder?.parentNode) stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder); else stateRefs.originalParent.appendChild(container); if (stateRefs.parentPositionInfo?.element) stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || ''; container.removeAttribute("style"); Object.keys(stateRefs).forEach(key => stateRefs[key] = null); };
  }, [isFullTab]);
    
  const handleSaveWorkspace = async () => {
    if (!selectedWorkspaceId || !layout) { window.alert('No workspace selected or layout is empty.'); return; }
    try {
        const plugin = getPlugin();
        const stripIds = (node) => { if (!node || typeof node !== 'object') return node; const { id, ...rest } = node; if (rest.children) { rest.children = rest.children.map(stripIds); } return rest; };
        const cleanLayout = JSON.parse(JSON.stringify(layout));
        const finalLayout = { main: cleanLayout.main ? stripIds(cleanLayout.main) : undefined, left: cleanLayout.left ? stripIds(cleanLayout.left) : undefined, right: cleanLayout.right ? stripIds(cleanLayout.right) : undefined, };
        plugin.workspaces[selectedWorkspaceId] = finalLayout;
        await plugin.saveData(plugin.workspaces);
        window.alert(`Workspace '${selectedWorkspaceId}' saved successfully!`);
    } catch (e) { setError(`Failed to save workspace: ${e.message}`); window.alert(`Error saving workspace. See console for details.`); }
  };

  const handleAddNewWorkspace = () => {
    showNamePrompt("Create New Workspace", "Enter workspace name...", async (name) => {
        if (!name) return;
        try {
            const plugin = getPlugin();
            if (plugin.workspaces[name]) { window.alert(`Workspace "${name}" already exists.`); return; }
            
            // --- FIX IS HERE: New workspaces now spawn with left, right, and main panels by default ---
            const newLayout = {
                main: { type: 'tabs', id: `main-${Math.random().toString(36).substr(2, 9)}`, children: [{ type: 'leaf', id: `leaf-${Math.random().toString(36).substr(2, 9)}`, state: { type: 'empty', state: {} } }] },
                left: { type: 'tabs', id: `left-${Math.random().toString(36).substr(2, 9)}`, children: [{ type: 'leaf', id: `leaf-${Math.random().toString(36).substr(2, 9)}`, state: { type: 'empty', state: {} } }] },
                right: { type: 'tabs', id: `right-${Math.random().toString(36).substr(2, 9)}`, children: [{ type: 'leaf', id: `leaf-${Math.random().toString(36).substr(2, 9)}`, state: { type: 'empty', state: {} } }] }
            };

            plugin.workspaces[name] = newLayout;
            await plugin.saveData(plugin.workspaces);
            window.alert(`Workspace '${name}' created.`);
            loadWorkspaceList();
            setSelectedWorkspaceId(name);
        } catch (e) { setError(`Failed to create workspace: ${e.message}`); }
    });
  };
    
  const handleDeleteWorkspace = () => {
    if (!selectedWorkspaceId) return;
    showConfirm("Delete Workspace", `Are you sure you want to permanently delete "${selectedWorkspaceId}"?`, async (confirmed) => {
        if (!confirmed) return;
        try {
            const plugin = getPlugin();
            delete plugin.workspaces[selectedWorkspaceId];
            await plugin.saveData(plugin.workspaces);
            window.alert(`Workspace '${selectedWorkspaceId}' deleted.`);
            setSelectedWorkspaceId('');
            loadWorkspaceList();
        } catch (e) { setError(`Failed to delete workspace: ${e.message}`); }
    });
  };

  const handleDeleteNode = useCallback((nodeId) => {
    const removeNodeRecursively = (root) => {
        if (!root) return null;
        if (root.id === nodeId) return null;
        if (!root.children) return root;
        
        let newChildren = root.children.map(removeNodeRecursively).filter(Boolean);
        
        if (root.type === 'split' && newChildren.length === 1) {
            return newChildren[0];
        }
        
        return { ...root, children: newChildren };
    };

    setLayout(prev => {
        const newLayout = JSON.parse(JSON.stringify(prev));
        
        if (newLayout.main) newLayout.main = removeNodeRecursively(newLayout.main);
        if (newLayout.left) newLayout.left = removeNodeRecursively(newLayout.left);
        if (newLayout.right) newLayout.right = removeNodeRecursively(newLayout.right);

        // --- IMPROVEMENT: Clean up empty root properties ---
        if (!newLayout.main) delete newLayout.main;
        if (!newLayout.left) delete newLayout.left;
        if (!newLayout.right) delete newLayout.right;

        return newLayout;
    });
}, []);


  const handleAddNode = useCallback((parentId) => {
    const newNode = { type: 'leaf', state: { type: 'empty', state: {} }, id: `leaf-${Math.random().toString(36).substr(2, 9)}` };
    const addRecursively = (root) => { if (!root) return null; if (root.id === parentId) { if (!root.children) root.children = []; root.children.push(newNode); return root; } if (root.children) { root.children = root.children.map(addRecursively); } return root; };
    setLayout(prev => { const newLayout = JSON.parse(JSON.stringify(prev)); if (newLayout.main) addRecursively(newLayout.main); if (newLayout.left) addRecursively(newLayout.left); if (newLayout.right) addRecursively(newLayout.right); return newLayout; });
  }, []);

  const handleSplitNode = useCallback((nodeId, direction) => {
    setLayout(prev => {
        const newLayout = JSON.parse(JSON.stringify(prev));
        let foundAndReplaced = false;
        const findAndReplace = (parent) => {
            if (!parent || !parent.children || foundAndReplaced) return parent;
            const childIndex = parent.children.findIndex(c => c.id === nodeId);
            if (childIndex > -1) {
                const originalNode = parent.children[childIndex];
                const newEmptyNode = { type: 'leaf', state: { type: 'empty', state: {} }, id: `leaf-${Math.random().toString(36).substr(2, 9)}` };
                const newSplitNode = { type: 'split', direction: direction, id: `split-${Math.random().toString(36).substr(2, 9)}`, children: [ originalNode, newEmptyNode ] };
                parent.children[childIndex] = newSplitNode;
                foundAndReplaced = true;
            } else { parent.children.forEach(findAndReplace); }
            return parent;
        };
        const processRoot = (root) => {
            if (!root) return null;
            if (root.id === nodeId) {
                 const newEmptyNode = { type: 'leaf', state: { type: 'empty', state: {} }, id: `leaf-${Math.random().toString(36).substr(2, 9)}` };
                 foundAndReplaced = true;
                 return { type: 'split', direction: direction, id: `split-${Math.random().toString(36).substr(2, 9)}`, children: [ root, newEmptyNode ] };
            }
            return findAndReplace(root);
        }
        if (newLayout.main) newLayout.main = processRoot(newLayout.main);
        if (!foundAndReplaced && newLayout.left) newLayout.left = processRoot(newLayout.left);
        if (!foundAndReplaced && newLayout.right) newLayout.right = processRoot(newLayout.right);
        return newLayout;
    });
  }, []);

  const handleDrop = useCallback((event, targetNodeId) => {
    const draggedNodeId = event.dataTransfer.getData('application/node-id');
    const draggedFilePath = event.dataTransfer.getData('application/file-path');
    if (draggedNodeId && draggedNodeId !== targetNodeId) {
        setLayout(prevLayout => {
            const newLayout = JSON.parse(JSON.stringify(prevLayout)); let draggedNode = null;
            const findAndRemove = (parent) => { if (!parent || !parent.children) return false; const index = parent.children.findIndex(child => child.id === draggedNodeId); if (index !== -1) { [draggedNode] = parent.children.splice(index, 1); if (parent.type === 'split' && parent.children.length === 1) { return parent.children[0]; } return true; } for (let i = 0; i < parent.children.length; i++) { const result = findAndRemove(parent.children[i]); if (result === true) return true; if (result) { parent.children[i] = result; return true; } } return false; };
            const findAndAdd = (parent) => { if (parent.id === targetNodeId) { if (!parent.children) parent.children = []; parent.children.push(draggedNode); return true; } if (!parent.children) return false; return parent.children.some(findAndAdd); };
            const roots = ['main', 'left', 'right'].filter(k => newLayout[k]);
            for (const rootKey of roots) { if (findAndRemove(newLayout[rootKey])) break; }
            for (const rootKey of roots) { if (findAndAdd(newLayout[rootKey])) break; }
            return newLayout;
        });
    } else if (draggedFilePath) {
        const newFileNode = { type: 'leaf', id: `leaf-${Math.random().toString(36).substr(2, 9)}`, state: { type: 'markdown', state: { file: draggedFilePath, mode: 'source', backlink: false } } };
        const addRecursively = (root) => { if (!root) return null; if (root.id === targetNodeId) { if (!root.children) root.children = []; root.children.push(newFileNode); return root; } if (root.children) { root.children = root.children.map(addRecursively); } return root; };
        setLayout(prev => { const newLayout = JSON.parse(JSON.stringify(prev)); if (newLayout.main) addRecursively(newLayout.main); if (newLayout.left) addRecursively(newLayout.left); if (newLayout.right) addRecursively(newLayout.right); return newLayout; });
    }
  }, []);
    
  const handleAddSidebar = (side) => {
      setLayout(prev => { if (prev[side]) return prev; const newSidebar = { type: 'tabs', id: `${side}-${Math.random().toString(36).substr(2, 9)}`, children: [{ type: 'leaf', state: { type: 'empty', state: {} }, id: `leaf-${Math.random().toString(36).substr(2, 9)}` }] }; return { ...prev, [side]: newSidebar }; });
  };
    
  const onFileDragStart = (e, filePath) => {
      e.dataTransfer.setData('application/file-path', filePath);
      e.dataTransfer.effectAllowed = 'copy';
  };

  const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
  const handleExitFullTab = (e) => { e.stopPropagation(); setIsFullTab(false); };
  const handleEnterFullTab = () => setIsFullTab(true);
  const handleCopyPath = () => { try { const activeFile = dc.app.workspace.getActiveFile(); if (activeFile) { navigator.clipboard.writeText(activeFile.path); window.alert(`Path copied: ${activeFile.path}`); } else { window.alert("Could not find active file."); } } catch (e) { window.alert("Error copying path."); } };
  const DebugIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 16.1A5 5 0 0 1 5.9 20h.2a5 5 0 0 1 5.9-3.9h0a5 5 0 0 1 5.9 3.9h.2a5 5 0 0 1 3.9-3.9"/><line x1="8" x2="8" y1="4" y2="9"/><line x1="16" x2="16" y1="4" y2="9"/><line x1="12" x2="12" y1="20" y2="9"/></svg>);
  const ReloadIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 4.5V9.5H16.5" stroke="currentColor" strokeWidth="2"/><path d="M3.5 19.5V14.5H8.5" stroke="currentColor" strokeWidth="2"/><path d="M21.16 12.55a10 10 0 1 1-1.33-4.55" stroke="currentColor" strokeWidth="2"/></svg>);
  
  return (
    <div ref={containerRef}>
      <style>{STYLES.hoverEffectStyle}</style>
      {isFullTab ? (
        <div style={STYLES.fullTabWrapper} className={uniqueWrapperClass}>
          <span style={STYLES.exitIcon} className="subtle-icon" title="Exit Full Tab" onClick={handleExitFullTab}>&lt;/&gt;</span>
          <div style={STYLES.header}>
              <span>Workspace Editor</span>
              <div style={{display: 'flex', gap: '8px'}}>
                  <button style={STYLES.iconButton} onClick={() => setIsFilePanelVisible(p => !p)} title="Toggle File Search"><SearchIcon /></button>
                  <button style={STYLES.iconButton} onClick={loadWorkspaceList} title="Reload Workspaces"><ReloadIcon /></button>
                  <button style={STYLES.iconButton} onClick={() => setIsDebugVisible(p => !p)} title="Toggle Debug View"><DebugIcon /></button>
              </div>
          </div>
          {error && <p style={STYLES.error}><strong>Error:</strong> {error}</p>}
          <div style={STYLES.controls}>
              <select value={selectedWorkspaceId} onChange={(e) => setSelectedWorkspaceId(e.target.value)} style={STYLES.select} disabled={isLoading}>
                  <option value="">-- Select a Workspace --</option>
                  {savedWorkspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
              </select>
              <button style={STYLES.managementButton} onClick={handleDeleteWorkspace} disabled={!selectedWorkspaceId}>Delete</button>
              <button style={STYLES.managementButton} onClick={handleAddNewWorkspace}>New</button>
              {!layout?.left && <button style={STYLES.managementButton} onClick={() => handleAddSidebar('left')} disabled={!selectedWorkspaceId}>Add Left Sidebar</button>}
              {!layout?.right && <button style={STYLES.managementButton} onClick={() => handleAddSidebar('right')} disabled={!selectedWorkspaceId}>Add Right Sidebar</button>}
              <button style={{...STYLES.managementButton, ...STYLES.saveButton, marginLeft: 'auto'}} onClick={handleSaveWorkspace} disabled={!selectedWorkspaceId}>Save Changes</button>
          </div>
          <div style={STYLES.layoutContainerWrapper}>
              <div style={STYLES.layoutContainer}>
                  {layout ? (
                      <div style={STYLES.sidebarContainer}>
                          {layout.left && <div style={STYLES.sidebar}><div style={STYLES.areaTitle}>Left Sidebar</div><LayoutNode {...{node: layout.left, isDebugVisible, onDelete: handleDeleteNode, onDrop: handleDrop, onAddNode: handleAddNode, onSplit: handleSplitNode, dragOverId, setDragOverId}} /></div>}
                          {layout.main && <div style={STYLES.mainArea}><div style={STYLES.areaTitle}>Main Area</div><LayoutNode {...{node: layout.main, isDebugVisible, onDelete: handleDeleteNode, onDrop: handleDrop, onAddNode: handleAddNode, onSplit: handleSplitNode, dragOverId, setDragOverId}} /></div>}
                          {layout.right && <div style={STYLES.sidebar}><div style={STYLES.areaTitle}>Right Sidebar</div><LayoutNode {...{node: layout.right, isDebugVisible, onDelete: handleDeleteNode, onDrop: handleDrop, onAddNode: handleAddNode, onSplit: handleSplitNode, dragOverId, setDragOverId}} /></div>}
                      </div>
                  ) : <p>Select or create a workspace to begin.</p>}
              </div>
              {isFilePanelVisible && <FileSearchPanel {...{allFiles, searchTerm, setSearchTerm, onFileDragStart, debouncedSearchTerm}} />}
          </div>
          {isDebugVisible && layout && (<div style={STYLES.debugContainer}><pre style={STYLES.debugPre}>{JSON.stringify(layout, null, 2)}</pre></div>)}
        </div>
      ) : (
        <div style={STYLES.compactWrapper}>
            <p style={STYLES.compactText}>Workspace Layout Editor is collapsed.</p>
            <div style={STYLES.buttonGroup}>
                <button style={STYLES.button} onClick={handleEnterFullTab}>Show Editor</button>
                <button style={{...STYLES.button, ...STYLES.secondaryButton}} onClick={handleCopyPath}>Find Codeblock</button>
            </div>
        </div>
      )}
    </div>
  );
};

return { BasicView: WorkspaceLayoutViewer };
```


