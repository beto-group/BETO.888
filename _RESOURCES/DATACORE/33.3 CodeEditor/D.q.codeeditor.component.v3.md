---
tags: datacore-component
---

# ViewComponent

```jsx
// -------------------------
// Live Development Environment (ViewComponent)
// -------------------------
const { useState, useEffect, useRef, useCallback, useMemo } = dc;
const { Component: PreactComponent } = dc.preact;
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Import the GitSuite component
 const { GitSuite } = await dc.require(dc.headerLink(dc.resolvePath("D.q.codeeditor.component.v3.md"), "GitSuite"));

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- UTILITY FUNCTIONS & CUSTOM COMPONENTS ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }

// --- NEW: Custom Notice (Replaces Obsidian's Notice) ---
function CustomNotice(message, duration = 4000) {
    let noticeContainer = document.getElementById('custom-notice-container-lde');
    if (!noticeContainer) {
        noticeContainer = document.createElement('div');
        noticeContainer.id = 'custom-notice-container-lde';
        Object.assign(noticeContainer.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '10001', // High z-index to be on top of everything
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-end',
        });
        document.body.appendChild(noticeContainer);
    }

    const noticeEl = document.createElement('div');
    noticeEl.textContent = message;
    Object.assign(noticeEl.style, {
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        color: '#e0e0e0',
        padding: '12px 18px',
        borderRadius: '6px',
        border: '1px solid #444',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        fontFamily: 'sans-serif',
        fontSize: '14px',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        maxWidth: '300px',
        textAlign: 'right',
    });

    noticeContainer.appendChild(noticeEl);

    setTimeout(() => {
        noticeEl.style.opacity = '1';
        noticeEl.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        noticeEl.style.opacity = '0';
        noticeEl.style.transform = 'translateX(100%)';
        noticeEl.addEventListener('transitionend', () => {
            noticeEl.remove();
            if (noticeContainer.children.length === 0) {
                noticeContainer.remove();
            }
        });
    }, duration);
}


// --- NEW: Custom Button Component (Replaces Obsidian's ButtonComponent) ---
function CustomButton({ text, onClick, isCta = false }) {
    const baseStyle = { padding: '8px 16px', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.2s, border-color 0.2s', };
    const ctaStyle = { backgroundColor: '#c53030', color: '#fff', borderColor: '#c53030', };
    const defaultStyle = { backgroundColor: '#333', color: '#e0e0e0', };
    const finalStyle = { ...baseStyle, ...(isCta ? ctaStyle : defaultStyle) };
    return (<button style={finalStyle} onClick={onClick}> {text} </button>);
}

// --- NEW: Custom Modal Component (Replaces Obsidian's Modal) ---
function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;
    const backdropStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', };
    const modalStyle = { backgroundColor: '#1f1f1f', color: '#e0e0e0', padding: '24px', borderRadius: '8px', border: '1px solid #333', width: '90%', maxWidth: '450px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', fontFamily: 'sans-serif', };
    const titleStyle = { fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#f56565' };
    const messageStyle = { marginBottom: '24px', lineHeight: '1.5', };
    const buttonContainerStyle = { display: 'flex', justifyContent: 'flex-end', gap: '12px', };
    const handleConfirm = () => { onConfirm(); onCancel(); };

    return (
        <div style={backdropStyle} onClick={onCancel}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <h2 style={titleStyle}>{title}</h2>
                <p style={messageStyle}>{message}</p>
                <div style={buttonContainerStyle}>
                    <CustomButton text="Cancel" onClick={onCancel} />
                    <CustomButton text="Delete" onClick={handleConfirm} isCta={true} />
                </div>
            </div>
        </div>
    );
}

// --- Linter for Best Practices ---
function runLinter(code) {
    const markers = [];
    if (!code) return markers;
    const lines = code.split('\n');
    lines.forEach((line, index) => {
        const styleMatch = line.match(/style\s*=\s*\{\{/);
        if (styleMatch) {
            markers.push({ message: "[Best Practice] Avoid inline styles. Define styles in a separate object for better maintainability.", severity: 'Info', startLineNumber: index + 1, endLineNumber: index + 1, startColumn: styleMatch.index + 1, endColumn: line.length + 1, });
        }
    });
    lines.forEach((line, index) => {
        const consoleMatches = [...line.matchAll(/console\.log/g)];
        consoleMatches.forEach(match => {
            markers.push({ message: "[Best Practice] Avoid 'console.log'. Use a proper logger or remove it before production.", severity: 'Warning', startLineNumber: index + 1, endLineNumber: index + 1, startColumn: match.index + 1, endColumn: match.index + match[0].length + 1, });
        });
    });
    return markers;
}


// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- STYLES - Enigmatic Dark Theme (Consolidated) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const styles = {
    baseWrapper: { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', fontFamily: 'sans-serif', backgroundColor: '#0a0a0a', color: '#e0e0e0', boxSizing: 'border-box' },
    headerBar: { display: 'flex', padding: '8px 12px', gap: '8px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333', alignItems: 'center', justifyContent: 'flex-end' },
    mainContent: { flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 },
    iconButton: { padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', transition: 'background-color 0.2s', },
    editorPaneContainer: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#121212', minWidth: 0 },
    statusBar: { padding: '8px 12px', backgroundColor: '#1f1f1f', borderTop: '1px solid #333', color: '#888', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', },
    previewPane: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#181818', position: 'relative', minWidth: 0 },
    previewHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#1f1f1f', color: '#aaa', fontSize: '12px', textAlign: 'center', borderBottom: '1px solid #333', },
    previewContent: { flex: 1, position: 'relative', overflow: 'auto', padding: '10px', },
    tabBar: { display: 'flex', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333', overflowX: 'auto', alignItems: 'center', flexShrink: 0 },
    tab: { padding: '10px 48px 10px 16px', cursor: 'pointer', color: '#888', borderBottom: '2px solid transparent', transition: 'color 0.2s, border-color 0.2s', whiteSpace: 'nowrap', fontSize: '13px', position: 'relative' },
    activeTab: { color: '#e0e0e0', borderBottom: '2px solid #8A2BE2', },
    renameInput: { background: 'transparent', border: 'none', outline: 'none', color: '#e0e0e0', fontSize: '13px', fontFamily: 'inherit', padding: '0', margin: '0', width: '100%', boxSizing: 'border-box' },
    resizer: { flex: '0 0 5px', cursor: 'col-resize', backgroundColor: '#333', backgroundClip: 'padding-box', borderLeft: '2px solid transparent', borderRight: '2px solid transparent', transition: 'background-color 0.2s', zIndex: 10, },
    horizontalResizer: { cursor: 'row-resize', height: '5px', width: '100%', borderTop: '2px solid transparent', borderBottom: '2px solid transparent' },
    resizerHover: { backgroundColor: '#8A2BE2', },
    fileExplorerPane: { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1c1c1c', minWidth: '150px', resize: 'horizontal' },
};

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 1. CRASH-PROOF ERROR HANDLING & COMPONENT LOADER ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function ErrorDisplay({ errorMessage }) {
    const errorStyles = { wrapper: { padding: '20px' }, details: { fontFamily: 'sans-serif', border: '1px solid #c53030', borderRadius: '8px', backgroundColor: '#2d1c1c', color: '#fed7d7', padding: '16px', }, summary: { cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#f56565', listStyle: 'none', display: 'flex', alignItems: 'center', }, summaryText: { marginLeft: '8px', }, content: { marginTop: '12px', borderTop: '1px solid #742a2a', paddingTop: '12px', color: '#e0e0e0', fontSize: '14px', }, pre: { whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#ccc', fontSize: '13px', marginTop: '12px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontFamily: 'monospace', } };
    return (<div style={errorStyles.wrapper}> <details style={errorStyles.details} open> <summary style={errorStyles.summary}> <span>⚠️</span><span style={errorStyles.summaryText}>Component Rendering Error</span> </summary> <div style={errorStyles.content}> <p>The component failed to render. Fix the error in the editor and save.</p> <pre style={errorStyles.pre}>{errorMessage}</pre> </div> </details> </div>);
}
class ErrorBoundary extends PreactComponent {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { console.error("ErrorBoundary caught an error:", error, info); }
    componentDidUpdate(prevProps) { if (prevProps.renderKey !== this.props.renderKey) { this.setState({ hasError: false, error: null }); } }
    render() { if (this.state.hasError) { return <ErrorDisplay errorMessage={this.state.error?.toString()} />; } return this.props.children; }
}
function DynamicComponentLoader({ filePath, activeHeader, renderKey }) {
    const [LoadedComponent, setLoadedComponent] = useState(null); const [loadError, setLoadError] = useState(null);
    useEffect(() => { let isCancelled = false; const loadComponent = async () => { if (!filePath || !activeHeader) { setLoadedComponent(null); setLoadError(null); return; } setLoadedComponent(null); setLoadError(null); try { const dynamicModule = await dc.require(dc.headerLink(filePath, activeHeader)); if (isCancelled) return; let Component = null; if (typeof dynamicModule === 'function') Component = dynamicModule; else if (dynamicModule && typeof dynamicModule === 'object') { const keys = Object.keys(dynamicModule); if (keys.length > 0) Component = dynamicModule[keys[0]]; } if (typeof Component !== 'function') { throw new Error("Module did not export a renderable component."); } if (!isCancelled) { setLoadedComponent(() => Component); } } catch (err) { console.error("Component load error:", err); if (!isCancelled) { setLoadError(err.toString()); } } }; loadComponent(); return () => { isCancelled = true; }; }, [filePath, activeHeader, renderKey]);
    if (loadError) { return <ErrorDisplay errorMessage={loadError} />; } if (LoadedComponent) { return (<ErrorBoundary renderKey={renderKey}> <LoadedComponent /> </ErrorBoundary>); } return <p style={{ color: '#888', padding: '20px' }}>Select a component file to render its preview.</p>;
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 2. THE FILE EXPLORER (Left Pane) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

// --- New Helper Component: Context Menu ---
function ContextMenu({ x, y, items, onClose }) {
    const menuRef = useRef(null);
    useEffect(() => { const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) { onClose(); } }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, [onClose]);
    const menuStyle = { position: 'fixed', top: `${y}px`, left: `${x}px`, backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '6px', zIndex: 1000, color: '#e0e0e0', fontFamily: 'sans-serif', fontSize: '13px', };
    const itemStyle = { padding: '8px 12px', cursor: 'pointer', borderRadius: '3px', };
    const handleItemClick = (action) => { action(); onClose(); };
    return (<div ref={menuRef} style={menuStyle}> {items.map((item, index) => (<div key={index} style={itemStyle} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8A2BE2'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => handleItemClick(item.action)}> {item.label} </div>))} </div>);
}

function FileExplorerItem({
    item, depth, onFileSelect, activeFile, onFolderSelect, selectedFolderPath,
    openFolders, onToggleFolder,
    draggedItem, dropTargetPath,
    onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
    renamingPath, onStartRename, onRenameChange, onConfirmRename, onCancelRename,
    onContextMenu // New prop for right-click
}) {
    const isFolder = Array.isArray(item.children);
    const isComponent = !isFolder && /\.component(\.v\d+)?\.md$/i.test(item.name);
    const isOpen = !!openFolders[item.path];
    const isSelectedFile = !isFolder && item.path === activeFile;
    const isSelectedFolder = isFolder && item.path === selectedFolderPath;
    const isBeingDragged = item.path === draggedItem?.path;
    const isDropTarget = isFolder && item.path === dropTargetPath && item.path !== draggedItem?.path;
    const isRenaming = item.path === renamingPath;
    const renameInputRef = useRef(null);

    useEffect(() => { if (isRenaming && renameInputRef.current) { renameInputRef.current.focus(); renameInputRef.current.select(); } }, [isRenaming]);
    const handleItemClick = useCallback(() => { if (isRenaming) return; if (isFolder) { onFolderSelect(item); onToggleFolder(item.path); } else { onFileSelect(item); } }, [isFolder, onFileSelect, onFolderSelect, onToggleFolder, item, isRenaming]);
    const handleRenameKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); onConfirmRename(); } else if (e.key === 'Escape') { e.preventDefault(); onCancelRename(); } };
    const handleDragStart = (e) => { e.stopPropagation(); onDragStart({ path: item.path, isFolder }); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.path); };
    const handleDragOver = (e) => { if (isFolder && !isRenaming) { e.preventDefault(); e.stopPropagation(); onDragOver(item.path); } };
    const handleDragLeave = (e) => { e.stopPropagation(); onDragLeave(); };
    const handleDrop = (e) => { if (isFolder && !isRenaming) { e.preventDefault(); e.stopPropagation(); onDrop(item.path); } };
    const getBackgroundColor = () => { if (isSelectedFile) return 'rgba(138, 43, 226, 0.6)'; if (isSelectedFolder) return 'rgba(138, 43, 226, 0.25)'; return 'transparent'; };
    const contentStyle = { display: 'flex', alignItems: 'center', padding: `4px 8px`, paddingLeft: `${depth * 20}px`, cursor: 'pointer', borderRadius: '4px', backgroundColor: getBackgroundColor(), color: isSelectedFile ? '#fff' : (isComponent ? 'var(--text-normal)' : 'var(--text-muted)'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '1px 0', transition: 'background-color 0.2s, border-color 0.2s', opacity: isBeingDragged ? 0.5 : 1, borderColor: isDropTarget ? '#8A2BE2' : (isSelectedFolder ? 'rgba(138, 43, 226, 0.5)' : 'transparent'), borderWidth: '1px', borderStyle: 'solid', };
    const iconStyle = { marginRight: '8px', width: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    const getIconName = () => {
        if (isFolder) return isOpen ? 'folder-open' : 'folder';
        if (isComponent) return 'file-code';
        return 'file';
    };
    const renameInputStyle = { background: 'transparent', border: 'none', outline: '1px solid #8A2BE2', color: '#e0e0e0', fontSize: 'inherit', fontFamily: 'inherit', padding: '1px 3px', margin: '0', width: '100%', boxSizing: 'border-box' };

    return (
        <div draggable={!isRenaming} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onDragEnd={onDragEnd}>
            <div style={contentStyle} onClick={handleItemClick} onContextMenu={(e) => onContextMenu(e, item)} title={item.path}>
                <span style={iconStyle}><dc.Icon icon={getIconName()} style={{ fontSize: '16px' }} /></span>
                {isRenaming ? (<input ref={renameInputRef} type="text" style={renameInputStyle} value={onRenameChange.value} onChange={(e) => onRenameChange.handler(e.target.value)} onBlur={onConfirmRename} onKeyDown={handleRenameKeyDown} onClick={(e) => e.stopPropagation()} />) : (<span>{item.name}</span>)}
            </div>
            {isFolder && isOpen && item.children.length > 0 && (<div> {item.children.map(child => (<FileExplorerItem key={child.path} item={child} depth={depth + 1} onFileSelect={onFileSelect} activeFile={activeFile} onFolderSelect={onFolderSelect} selectedFolderPath={selectedFolderPath} openFolders={openFolders} onToggleFolder={onToggleFolder} draggedItem={draggedItem} dropTargetPath={dropTargetPath} onDragStart={onDragStart} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onDragEnd={onDragEnd} renamingPath={renamingPath} onStartRename={onStartRename} onRenameChange={onRenameChange} onConfirmRename={onConfirmRename} onCancelRename={onCancelRename} onContextMenu={onContextMenu} />))} </div>)}
        </div>
    );
}

function FileExplorerView({ rootPath = '/', onFileSelect, activeFile }) {
    const [fileTree, setFileTree] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFolderPath, setSelectedFolderPath] = useState(rootPath);
    const [selectedItem, setSelectedItem] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [createState, setCreateState] = useState(null);
    const [newItemName, setNewItemName] = useState("");
    const inputRef = useRef(null);
    const [openFolders, setOpenFolders] = useState({ [rootPath]: true });
    const [draggedItem, setDraggedItem] = useState(null);
    const [dropTargetPath, setDropTargetPath] = useState(null);
    const [renamingPath, setRenamingPath] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [contextMenu, setContextMenu] = useState(null);
    const [confirmationDialog, setConfirmationDialog] = useState(null); // State for the custom modal

    const fetchTree = useCallback(async () => {
        setIsLoading(true);
        if (!dc.app?.vault?.adapter) { setError("Vault adapter is not available."); setIsLoading(false); return; }
        const buildTreeForPath = async (currentPath) => {
            let listResult; try { listResult = await dc.app.vault.adapter.list(currentPath); } catch (e) { console.warn(`Could not list path: ${currentPath}`, e); return []; }
            const { files, folders } = listResult;
            const folderPromises = folders.map(async (folderPath) => ({ name: folderPath.split('/').pop(), path: folderPath, children: await buildTreeForPath(folderPath) }));
            const fileNodes = files.map(filePath => ({ name: filePath.split('/').pop(), path: filePath, children: null }));
            const allChildren = [...(await Promise.all(folderPromises)), ...fileNodes];
            allChildren.sort((a, b) => { const aIsFolder = a.children !== null; const bIsFolder = b.children !== null; if (aIsFolder && !bIsFolder) return -1; if (!aIsFolder && bIsFolder) return 1; return a.name.localeCompare(b.name); });
            return allChildren;
        };
        try { const children = await buildTreeForPath(rootPath); const rootName = (rootPath === '/' || rootPath === '') ? 'Vault' : rootPath.split('/').pop(); const tree = { name: rootName, path: rootPath, children: children }; setFileTree(tree); setSelectedItem(tree); setError(null); } catch (e) { setError(`Failed to load file tree: ${e.message}`); console.error(e); } finally { setIsLoading(false); }
    }, [rootPath]);

    useEffect(() => { fetchTree(); }, [rootPath, refreshKey, fetchTree]);
    useEffect(() => { if (isLoading === false && fileTree && !activeFile) { if (fileTree.path === rootPath && fileTree.children) { const mainTsFile = fileTree.children.find(child => child.name === 'main.ts' && child.children === null); if (mainTsFile) { onFileSelect(mainTsFile.path); setSelectedItem(mainTsFile); } } } }, [isLoading, fileTree, activeFile, rootPath, onFileSelect]);
    const handleFileSelectInternal = (item) => { onFileSelect(item.path); setSelectedItem(item); };
    useEffect(() => { if (createState && inputRef.current) { inputRef.current.focus(); } }, [createState]);
    const handleToggleFolder = (folderPath) => { setOpenFolders(prev => ({ ...prev, [folderPath]: !prev[folderPath] })); };
    const handleFolderClick = useCallback((folderItem) => { setSelectedFolderPath(folderItem.path); setSelectedItem(folderItem); if (folderItem.children) { const mainTsFile = folderItem.children.find(child => child.name === 'main.ts' && child.children === null); if (mainTsFile) { onFileSelect(mainTsFile.path); } } }, [onFileSelect]);
    const handleDragStart = (item) => { setDraggedItem(item); };
    const handleDragOver = (path) => { if (path !== draggedItem?.path) { setDropTargetPath(path); } };
    const handleDragLeave = () => { setDropTargetPath(null); };
    const handleDragEnd = () => { setDraggedItem(null); setDropTargetPath(null); };

    const handleDrop = async (targetFolderPath) => {
        if (!draggedItem || !targetFolderPath || draggedItem.path === targetFolderPath) return;
        if (targetFolderPath.startsWith(draggedItem.path + '/')) { CustomNotice("Error: Cannot move a folder into itself.", 3000); return; }
        const itemName = draggedItem.path.split('/').pop(); const newPath = targetFolderPath === '/' ? itemName : `${targetFolderPath}/${itemName}`; if (newPath === draggedItem.path) return;
        try { await dc.app.vault.adapter.rename(draggedItem.path, newPath); if (draggedItem.isFolder && openFolders[draggedItem.path]) { setOpenFolders(prev => { const newOpenState = { ...prev }; delete newOpenState[draggedItem.path]; newOpenState[newPath] = true; return newOpenState; }); } CustomNotice(`Moved '${itemName}' successfully.`); setRefreshKey(k => k + 1); } catch (e) { console.error("Error moving item:", e); CustomNotice(`Error: Could not move item. See console.`, 3000); }
    };

    const handleStartCreate = (type) => { setCreateState({ type }); setNewItemName(""); };
    const handleCancelCreate = () => { setCreateState(null); setNewItemName(""); };
    const handleConfirmCreate = async () => {
        if (!newItemName || !createState) return; const { type } = createState; if (newItemName.includes('/') || newItemName.includes('\\')) { CustomNotice("Error: Name cannot contain slashes."); return; } const newPath = selectedFolderPath === '/' ? newItemName : `${selectedFolderPath}/${newItemName}`;
        try { if (type === 'folder') { await dc.app.vault.adapter.mkdir(newPath); setOpenFolders(prev => ({ ...prev, [selectedFolderPath]: true })); CustomNotice(`Folder created: ${newItemName}`); } else { const content = /\.component(\.v\d+)?\.md$/i.test(newItemName) ? `---\ntags: datacore-component\n---\n\n# ViewComponent\n\n\`\`\`jsx\nfunction MyComponent() {\n  return <div>Hello, World!</div>;\n}\n\nreturn { MyComponent };\n\`\`\`` : ''; await dc.app.vault.adapter.write(newPath, content); CustomNotice(`File created: ${newItemName}`); } setRefreshKey(k => k + 1); } catch (e) { console.error(`Error creating ${type}:`, e); CustomNotice(`Error: Could not create ${type}. See console.`); } finally { handleCancelCreate(); }
    };

    const handleStartRename = (path, currentName) => { setRenamingPath(path); setRenameValue(currentName); };
    const handleCancelRename = () => { setRenamingPath(null); setRenameValue(""); };
    const handleConfirmRename = async () => {
        const trimmedValue = renameValue.trim();
        if (!renamingPath || !trimmedValue) { handleCancelRename(); return; }
        const originalName = renamingPath.split('/').pop();
        if (originalName === trimmedValue) { handleCancelRename(); return; }
        if (trimmedValue.includes('/') || trimmedValue.includes('\\')) { CustomNotice("Error: Name cannot contain slashes."); return; }
        const parentPath = renamingPath.substring(0, renamingPath.lastIndexOf('/'));
        const newPath = parentPath ? `${parentPath}/${trimmedValue}` : trimmedValue;
        if (newPath === renamingPath) { handleCancelRename(); return; }
        try { if (await dc.app.vault.adapter.exists(newPath)) { CustomNotice(`Error: '${trimmedValue}' already exists.`); return; } await dc.app.vault.adapter.rename(renamingPath, newPath); CustomNotice(`Renamed to '${trimmedValue}'`); setRefreshKey(k => k + 1); } catch (e) { console.error("Error renaming item:", e); CustomNotice(`Error: Could not rename. See console.`, 3000); } finally { handleCancelRename(); }
    };

    const handleDeleteItem = (item) => {
        if (!item || !item.path || item.path === rootPath) { CustomNotice("Cannot delete the root directory or an invalid item."); return; }
        setConfirmationDialog({
            title: `Delete ${Array.isArray(item.children) ? 'Folder' : 'File'}`,
            message: `Are you sure you want to permanently delete '${item.name}'? This action cannot be undone.`,
            onConfirm: async () => {
                const isFolder = Array.isArray(item.children);
                try {
                    if (isFolder) { await dc.app.vault.adapter.rmdir(item.path, true); } else { await dc.app.vault.adapter.remove(item.path); }
                    CustomNotice(`'${item.name}' has been deleted.`);
                    if (item.path === activeFile) { onFileSelect(null); }
                    setRefreshKey(k => k + 1);
                } catch (e) { console.error("Error deleting item:", e); CustomNotice(`Error: Could not delete item. See console.`); }
            },
            onCancel: () => setConfirmationDialog(null)
        });
    };

    const handleContextMenu = (event, item) => {
        event.preventDefault(); event.stopPropagation(); setSelectedItem(item);
        const menuItems = [{ label: 'Rename', action: () => handleStartRename(item.path, item.name) }];
        if (item.path !== rootPath) { menuItems.push({ label: 'Delete', action: () => handleDeleteItem(item) }); }
        setContextMenu({ x: event.clientX, y: event.clientY, items: menuItems });
    };

    const isRootSelected = selectedItem?.path === rootPath;
    const STYLES = { wrap: { height: "100%", width: "100%", background: '#1c1c1c', color: 'var(--text-normal)', overflow: 'hidden', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }, header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 'bold', padding: '12px', borderBottom: '1px solid #333', flexShrink: 0 }, button: { background: '#333', border: '1px solid #555', color: '#e0e0e0', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }, buttonDisabled: { cursor: 'not-allowed', opacity: 0.5 }, content: { padding: '8px', flex: 1, overflowY: 'auto' }, createForm: { padding: '8px', background: '#2a2a2a', display: 'flex', gap: '8px', alignItems: 'center' }, createInput: { flex: 1, background: '#1a1a1a', border: '1px solid #555', color: '#e0e0e0', borderRadius: '4px', padding: '6px 8px', outline: 'none' }, contentLoading: { opacity: 0.7, pointerEvents: 'none', transition: 'opacity 0.2s' } };
    const contentDynamicStyle = { ...STYLES.content, ...(isLoading && fileTree ? STYLES.contentLoading : {}) };
    const headerRenameButtonStyle = { ...STYLES.button, ...(!selectedItem || isRootSelected ? STYLES.buttonDisabled : {}) };
    const headerDeleteButtonStyle = { ...STYLES.button, color: '#ffaaaa', ...(!selectedItem || isRootSelected ? STYLES.buttonDisabled : {}) };

    return (
        <div style={STYLES.wrap}>
            <ConfirmationDialog isOpen={!!confirmationDialog} {...confirmationDialog} />
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />}
            <div style={STYLES.header}>
                <span>File Explorer</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={STYLES.button} title="New File" onClick={() => handleStartCreate('file')}><dc.Icon icon="file-plus" style={{ fontSize: '14px' }} /></button>
                    <button style={STYLES.button} title="New Folder" onClick={() => handleStartCreate('folder')}><dc.Icon icon="folder-plus" style={{ fontSize: '14px' }} /></button>
                    <div style={{ borderLeft: '1px solid #444', margin: '0 4px' }}></div>
                    <button style={headerRenameButtonStyle} title="Rename selected item" disabled={!selectedItem || isRootSelected} onClick={() => handleStartRename(selectedItem.path, selectedItem.name)}><dc.Icon icon="edit-3" style={{ fontSize: '14px' }} /></button>
                    <button style={headerDeleteButtonStyle} title="Delete selected item" disabled={!selectedItem || isRootSelected} onClick={() => handleDeleteItem(selectedItem)}><dc.Icon icon="trash-2" style={{ fontSize: '14px' }} /></button>
                </div>
            </div>
            {createState && (<div style={STYLES.createForm}> <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}><dc.Icon icon={createState.type === 'folder' ? 'folder' : 'file'} style={{ fontSize: '18px' }} /></span> <input ref={inputRef} type="text" style={STYLES.createInput} placeholder={`Name for new ${createState.type}...`} value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmCreate(); if (e.key === 'Escape') handleCancelCreate(); }} /> <button style={STYLES.button} onClick={handleConfirmCreate}><dc.Icon icon="check" style={{ fontSize: '14px' }} /></button> <button style={STYLES.button} onClick={handleCancelCreate}><dc.Icon icon="x" style={{ fontSize: '14px' }} /></button> </div>)}
            <div style={contentDynamicStyle}> {isLoading && !fileTree && <p>Loading files...</p>} {error && <p style={{ color: '#c53030' }}>Error: {error}</p>} {fileTree && (<FileExplorerItem item={fileTree} depth={0} onFileSelect={handleFileSelectInternal} activeFile={activeFile} onFolderSelect={handleFolderClick} selectedFolderPath={selectedFolderPath} openFolders={openFolders} onToggleFolder={handleToggleFolder} draggedItem={draggedItem} dropTargetPath={dropTargetPath} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onDragEnd={handleDragEnd} renamingPath={renamingPath} onStartRename={handleStartRename} onRenameChange={{ value: renameValue, handler: setRenameValue }} onConfirmRename={handleConfirmRename} onCancelRename={handleCancelRename} onContextMenu={handleContextMenu} />)} </div>
        </div>
    );
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 3. THE LIVE EDITOR (Middle Pane) ---
// =-=----=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function PlaygroundEditor({ filePath, onSave, reloadKey }) {
    const MONACO_VERSION = "0.45.0";
    const SETUP_DIR_BASE = ".datacore/playground";
    const SETUP_DIR = `${SETUP_DIR_BASE}/monaco-host`;
    const HOST_FILE_VERSION = 19;
    const HOST_FILENAME_BASE = "monaco-host";
    const HOST_FILENAME = `${HOST_FILENAME_BASE}-v${HOST_FILE_VERSION}.html`;
    const HOST_FILE_PATH = `${SETUP_DIR}/${HOST_FILENAME}`;
    const TYPES_CACHE_DIR = `${SETUP_DIR_BASE}/types`;
    const OBSIDIAN_TYPES_FILENAME = `obsidian.d.ts`;
    const OBSIDIAN_TYPES_PATH = `${TYPES_CACHE_DIR}/${OBSIDIAN_TYPES_FILENAME}`;
    const OBSIDIAN_TYPES_URL = 'https://raw.githubusercontent.com/obsidianmd/obsidian-api/master/obsidian.d.ts';

    const [status, setStatus] = useState("Select a file to begin editing.");
    const [isHostFileReady, setIsHostFileReady] = useState(false);
    const [lintResults, setLintResults] = useState({ warnings: 0, infos: 0 });
    const iframeRef = useRef(null);
    const isEditorReadyRef = useRef(false);
    const pendingContentRef = useRef(null);
    const currentFileContentRef = useRef("");

    const debouncedLint = useCallback(debounce((path, code) => {
        if (!iframeRef.current || !path) return;
        const markers = runLinter(code);
        const warnings = markers.filter(m => m.severity === 'Warning').length;
        const infos = markers.filter(m => m.severity === 'Info').length;
        setLintResults({ warnings, infos });
        iframeRef.current.contentWindow.postMessage({ type: 'set-markers', value: { filePath: `file:///${path}`, markers, } }, '*');
    }, 500), []);

    useEffect(() => {
        const setupHostFile = async () => {
            if (typeof app === 'undefined' || !app.vault?.adapter) { setStatus("Setup failed: Obsidian app context not available."); return; }
            const adapter = app.vault.adapter;
            if (await adapter.exists(HOST_FILE_PATH)) { setIsHostFileReady(true); return; }
            setStatus("Performing first-time editor setup...");
            try {
                if (!await adapter.exists(SETUP_DIR)) await adapter.mkdir(SETUP_DIR);
                const monacoLoaderUrl = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs/loader.js`;
                const monacoBasePath = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs`;
                const hostHtmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body,html{margin:0;padding:0;height:100%;overflow:hidden}#container{width:100%;height:100%}</style></head><body><div id="container"></div><script src="${monacoLoaderUrl}"></script><script>
                    let editor = null;
                    const params = new URLSearchParams(window.location.search);
                    const initialTheme = params.get("theme");
                    function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }
                    require.config({ paths: { 'vs': '${monacoBasePath}' }});
                    window.addEventListener("message", (event) => {
                        const { type, value } = event.data;
                        if (!editor) return;
                        switch (type) {
                            case 'set-content': { const { code, language, filePath } = value; const modelUri = monaco.Uri.parse(filePath || "inmemory://model/" + Date.now()); let model = monaco.editor.getModel(modelUri); if (model) { if (model.getValue() !== code) model.setValue(code); } else { model = monaco.editor.createModel(code, language, modelUri); } if (editor.getModel() !== model) editor.setModel(model); monaco.editor.setModelMarkers(model, 'linter', []); break; }
                            case 'set-theme': { monaco.editor.setTheme(value); break; }
                            case 'setup-language-services': { if (value) { monaco.languages.typescript.javascriptDefaults.setCompilerOptions(value.compilerOptions); monaco.languages.typescript.typescriptDefaults.setCompilerOptions(value.compilerOptions); if (value.extraLibs) { value.extraLibs.forEach(lib => { monaco.languages.typescript.javascriptDefaults.addExtraLib(lib.content, lib.filePath); monaco.languages.typescript.typescriptDefaults.addExtraLib(lib.content, lib.filePath); }); } } break; }
                            case 'set-markers': { const { filePath, markers } = value; const modelUri = monaco.Uri.parse(filePath); const model = monaco.editor.getModel(modelUri); if (model) { const severityMap = { 'Error': monaco.MarkerSeverity.Error, 'Warning': monaco.MarkerSeverity.Warning, 'Info': monaco.MarkerSeverity.Info, 'Hint': monaco.MarkerSeverity.Hint, }; const monacoMarkers = markers.map(m => ({ ...m, severity: severityMap[m.severity] || monaco.MarkerSeverity.Warning })); monaco.editor.setModelMarkers(model, 'linter', monacoMarkers); } break; }
                        }
                    });
                    require(['vs/editor/editor.main'], function() { editor = monaco.editor.create(document.getElementById('container'), { model: null, theme: initialTheme, automaticLayout: true, minimap: { enabled: true }, wordWrap: 'on', fontSize: 14, fontFamily: 'monospace', }); editor.onDidChangeModelContent(debounce(() => { parent.postMessage({ type: 'change', value: editor.getValue() }, '*'); }, 200)); parent.postMessage({ type: 'editor-ready' }, '*'); });
                </script></body></html>`;
                await adapter.write(HOST_FILE_PATH, hostHtmlContent); setIsHostFileReady(true); setStatus("Editor setup complete.");
            } catch (error) { console.error("[PlaygroundEditor] Monaco host setup failed:", error); setStatus(`Setup failed: ${error.message}`); }
        };
        setupHostFile();
    }, []);

    const sendContentToEditor = useCallback((contentPayload) => { if (!contentPayload) return; if (isEditorReadyRef.current && iframeRef.current) { iframeRef.current.contentWindow.postMessage(contentPayload, '*'); pendingContentRef.current = null; } else { pendingContentRef.current = contentPayload; } }, []);

    useEffect(() => {
        if (!filePath) { setStatus("Select a file to edit."); sendContentToEditor({ type: 'set-content', value: { code: `// No file selected. Please choose a file from the explorer.`, language: 'plaintext', filePath: 'welcome.js' } }); setLintResults({ warnings: 0, infos: 0 }); return; }
        const loadFile = async () => {
            setStatus(`Loading ${filePath}...`);
            try {
                const fileContent = await app.vault.adapter.read(filePath);
                currentFileContentRef.current = fileContent; let language = 'plaintext';
                const extension = filePath.split('.').pop();
                switch (extension) { case 'js': case 'jsx': language = 'javascript'; break; case 'ts': case 'tsx': language = 'typescript'; break; case 'css': language = 'css'; break; case 'json': language = 'json'; break; case 'html': language = 'html'; break; case 'md': language = 'markdown'; break; }
                sendContentToEditor({ type: 'set-content', value: { code: fileContent, language, filePath: `file:///${filePath}` } });
                debouncedLint(filePath, fileContent); setStatus("Ready");
            } catch (e) { console.error(`[PlaygroundEditor] Error reading file: ${e.message}`); setStatus(`Error reading ${filePath}`); }
        };
        loadFile();
    }, [filePath, sendContentToEditor, debouncedLint]);

    useEffect(() => {
        const handleMessage = async (event) => {
            if (!event.data || !iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
            const { type, value } = event.data;
            if (type === 'editor-ready') {
                isEditorReadyRef.current = true;
                iframeRef.current.contentWindow.postMessage({ type: 'set-theme', value: 'vs-dark' }, '*');
                const compilerOptions = { allowNonTsExtensions: true, moduleResolution: 2, target: 99, module: 99, jsx: 2, allowJs: true, };
                const extraLibs = [];
                const adapter = app.vault.adapter;
                try {
                    const reactDtsResponse = await requestUrl({ url: "https://unpkg.com/@types/react@17/index.d.ts" });
                    extraLibs.push({ content: reactDtsResponse.text, filePath: 'file:///node_modules/@types/react/index.d.ts' });
                    let obsidianDts;
                    if (await adapter.exists(OBSIDIAN_TYPES_PATH)) { obsidianDts = await adapter.read(OBSIDIAN_TYPES_PATH); }
                    else {
                        setStatus("Downloading Obsidian API types..."); CustomNotice("Downloading Obsidian API types for first-time setup...");
                        if (!await adapter.exists(TYPES_CACHE_DIR)) { await adapter.mkdir(TYPES_CACHE_DIR); }
                        const response = await requestUrl({ url: OBSIDIAN_TYPES_URL }); obsidianDts = response.text; await adapter.write(OBSIDIAN_TYPES_PATH, obsidianDts);
                        setStatus("API types cached successfully."); CustomNotice("Obsidian API types have been cached locally.");
                    }
                    extraLibs.push({ content: obsidianDts, filePath: 'file:///node_modules/obsidian/obsidian.d.ts' });
                } catch (e) { console.error("Could not fetch or cache type definitions:", e); CustomNotice("Error: Failed to load API type definitions. Autocomplete may be incomplete.", 4000); }

                if (!iframeRef.current) return;
                iframeRef.current.contentWindow.postMessage({ type: 'setup-language-services', value: { compilerOptions, extraLibs } }, '*');
                if (pendingContentRef.current) { sendContentToEditor(pendingContentRef.current); }
                setStatus(s => s.startsWith("API types") || s.startsWith("Downloading") ? "Ready" : s);
                return;
            }
            if (type === 'change') { currentFileContentRef.current = value; if (filePath) { debouncedLint(filePath, value); } }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [sendContentToEditor, filePath, debouncedLint]);

    const performSave = useCallback(async () => {
        if (!filePath) return; setStatus("Saving...");
        try { await app.vault.adapter.write(filePath, currentFileContentRef.current); if (onSave) { onSave(filePath, currentFileContentRef.current); } setStatus("Saved successfully ✅"); setTimeout(() => setStatus(s => s === "Saved successfully ✅" ? "Ready" : s), 2000); } catch (e) { setStatus(`Error saving: ${e.message}`); console.error("Error during save:", e); }
    }, [filePath, onSave]);

    useEffect(() => { const handleKeyDown = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); performSave(); } }; document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }, [performSave]);
    const iframeSrc = useMemo(() => { if (!isHostFileReady) return "about:blank"; return dc.app.vault.adapter.getResourcePath(HOST_FILE_PATH); }, [isHostFileReady, HOST_FILE_PATH]);

    return (
        <div style={styles.editorPaneContainer}>
            <div style={{ flex: 1, position: 'relative' }}> {iframeSrc === "about:blank" ? (<div style={{ padding: '20px', textAlign: 'center', color: '#ccc' }}>{status}</div>) : (<iframe key={reloadKey} style={{ width: '100%', height: '100%', border: 'none' }} src={iframeSrc} ref={iframeRef} name={`monaco-editor-${filePath}`} />)} </div>
            <div style={styles.statusBar}>
                <span>{status}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span title={`${lintResults.warnings} warnings, ${lintResults.infos} info hints`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> <span><span style={{ color: '#f1fa8c' }}>⚠️</span> {lintResults.warnings}</span> <span><span style={{ color: '#89b4fa' }}>ℹ️</span> {lintResults.infos}</span> </span>
                    <span>{filePath || 'No file selected'}</span>
                </div>
                <button style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }} onClick={performSave} disabled={!filePath}>Save (Ctrl+S)</button>
            </div>
        </div>
    );
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 4. THE INTEGRATED TERMINAL (Bottom Pane) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function IntegratedTerminal({ rootPath }) {
    const [tabs, setTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const outputRefs = useRef({});
    const inputRefs = useRef({});
    const workingDirectory = useMemo(() => { const vaultBasePath = dc.app.vault.adapter.getBasePath(); return path.join(vaultBasePath, rootPath || ''); }, [rootPath]);
    const THEME = { background: '#0a0a0a', foreground: '#d0d0d0', selection: '#222222', comment: '#666666', purple: '#8A2BE2', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c', blue: '#89b4fa', cyan: '#89dceb', };
    const FONT_SETTINGS = { fontFamily: '"Fira Code", Menlo, "DejaVu Sans Mono", "Lucida Console", monospace', fontSize: '13px' };
    const ANSI_COLORS = { '30': '#45475a', '31': THEME.red, '32': THEME.green, '33': THEME.yellow, '34': THEME.blue, '35': THEME.purple, '36': THEME.cyan, '37': THEME.foreground, '90': '#9399b2', '91': THEME.red, '92': THEME.green, '93': THEME.yellow, '94': THEME.blue, '95': THEME.purple, '96': THEME.cyan, '97': '#a6adc8' };
    const parseAnsi = (text) => { const ansiRegex = /\u001b\[(\d+;?)*m/g; const parts = text.split(ansiRegex).filter(Boolean); const elements = []; let currentStyle = {}; let key = 0; for (const part of parts) { if (/^\d+;?$/.test(part)) { const codes = part.split(';').map(Number); for (const code of codes) { if (code === 0) currentStyle = {}; else if (ANSI_COLORS[code]) currentStyle.color = ANSI_COLORS[code]; else if (code === 1) currentStyle.fontWeight = 'bold'; else if (code === 4) currentStyle.textDecoration = 'underline'; } } else { elements.push(<span key={key++} style={currentStyle}>{part}</span>); } } return elements; };
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
    const appendToOutput = (tabId, line) => { setTabs(prev => prev.map(t => t.id === tabId ? { ...t, output: [...t.output, line] } : t)); };
    const handleNewTab = useCallback(() => { const newTabId = Date.now(); const newTab = { id: newTabId, title: `Shell ${tabs.length + 1}`, output: [<div style={{ color: THEME.comment }}>Working directory: {workingDirectory}</div>], status: 'idle', process: null, currentInput: '', commandHistory: [], historyIndex: 0 }; setTabs(prev => [...prev, newTab]); setActiveTabId(newTabId); setTimeout(() => inputRefs.current[newTabId]?.focus(), 0); }, [tabs.length, workingDirectory]);
    useEffect(() => { if (tabs.length === 0) { handleNewTab(); } }, [tabs.length, handleNewTab]);
    const handleCloseTab = (tabIdToClose) => { const tab = tabs.find(t => t.id === tabIdToClose); if (tab?.process) { try { process.kill(-tab.process.pid, 'SIGKILL'); } catch (e) { console.warn(`Could not kill process for tab ${tabIdToClose}`, e); } } setTabs(prev => { const remainingTabs = prev.filter(t => t.id !== tabIdToClose); if (activeTabId === tabIdToClose) { setActiveTabId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null); } return remainingTabs; }); };
    const runCommand = (tabId, command) => {
        if (!command.trim()) return; const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/sh'); const promptLine = <div style={{ whiteSpace: 'nowrap' }}><span style={{ color: THEME.purple, userSelect: 'none' }}>❯ </span> {command}</div>; appendToOutput(tabId, promptLine);
        const child = spawn(shell, ['-l', '-c', command], { cwd: workingDirectory, detached: true });
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, process: child, status: 'running', currentInput: '', commandHistory: [command, ...t.commandHistory], historyIndex: 0 } : t));
        const handleData = (data) => { const lines = data.toString().split('\n'); lines.forEach((line, index) => { if (index === lines.length - 1 && line === '') return; appendToOutput(tabId, <div>{parseAnsi(line)}</div>); }); };
        child.stdout.on('data', handleData); child.stderr.on('data', handleData);
        const onExit = (code) => { appendToOutput(tabId, <div style={{ color: THEME.comment, marginTop: '5px' }}>Process finished with exit code {code}.</div>); setTabs(prev => prev.map(t => t.id === tabId ? { ...t, process: null, status: 'idle' } : t)); };
        child.on('close', onExit); child.on('error', (err) => { appendToOutput(tabId, <div style={{ color: THEME.red, marginTop: '5px' }}>Error: {err.message}</div>); onExit(-1); });
    };
    const handleInputKeyDown = (e, tab) => {
        if (e.key === 'Enter') { e.preventDefault(); if (tab.status === 'idle') { runCommand(tab.id, tab.currentInput); } }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (tab.historyIndex < tab.commandHistory.length) { const newIndex = tab.historyIndex + 1; setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, historyIndex: newIndex, currentInput: t.commandHistory[newIndex - 1] || '' } : t)); } }
        else if (e.key === 'ArrowDown') { e.preventDefault(); if (tab.historyIndex > 0) { const newIndex = tab.historyIndex - 1; setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, historyIndex: newIndex, currentInput: t.commandHistory[newIndex - 1] || '' } : t)); } }
        else if (e.key === 'c' && e.ctrlKey && activeTab?.process) { try { process.kill(-activeTab.process.pid, 'SIGINT'); } catch (e) { console.warn("Failed to send SIGINT", e) } CustomNotice('Sent interrupt signal (Ctrl+C)'); }
    };
    useEffect(() => { if (activeTabId && outputRefs.current[activeTabId]) { outputRefs.current[activeTabId].scrollTop = outputRefs.current[activeTabId].scrollHeight; } }, [tabs, activeTabId]);
    const terminalStyles = { wrapper: { ...FONT_SETTINGS, backgroundColor: THEME.background, color: THEME.foreground, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }, tabBar: { display: 'flex', backgroundColor: '#000000', flexShrink: 0 }, tab: { padding: '8px 24px 8px 16px', cursor: 'pointer', color: THEME.comment, borderBottom: `2px solid transparent`, position: 'relative', transition: 'color 0.2s' }, activeTab: { color: THEME.purple, borderBottom: `2px solid ${THEME.purple}` }, closeTabBtn: { position: 'absolute', top: '50%', right: '6px', transform: 'translateY(-50%)', color: THEME.comment, fontSize: '16px', lineHeight: '1', cursor: 'pointer', opacity: 0.6 }, newTabBtn: { padding: '8px 12px', cursor: 'pointer', color: THEME.purple, fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }, content: { flex: 1, padding: '10px', overflowY: 'auto', lineHeight: '1.6', backgroundColor: THEME.background }, inputArea: { display: 'flex', alignItems: 'center', padding: '5px 10px', backgroundColor: '#000000', borderTop: `1px solid ${THEME.selection}` }, prompt: { color: THEME.purple, marginRight: '8px', userSelect: 'none' }, input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: THEME.foreground, ...FONT_SETTINGS }, statusIndicator: { display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', marginRight: '8px', backgroundColor: THEME.comment, transition: 'background-color 0.3s' }, statusRunning: { backgroundColor: THEME.purple, animation: 'pulse 1.5s infinite' }, };
    return (<div style={terminalStyles.wrapper}> <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }`}</style> <div style={terminalStyles.tabBar}> {tabs.map(tab => (<div key={tab.id} style={{ ...terminalStyles.tab, ...(tab.id === activeTabId ? terminalStyles.activeTab : {}) }} onClick={() => setActiveTabId(tab.id)}> <span style={{ ...terminalStyles.statusIndicator, ...(tab.status === 'running' ? terminalStyles.statusRunning : {}) }}></span> {tab.title} <span style={terminalStyles.closeTabBtn} onMouseOver={(e) => e.currentTarget.style.color = THEME.purple} onMouseOut={(e) => e.currentTarget.style.color = THEME.comment} onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}>×</span> </div>))} <div style={terminalStyles.newTabBtn} onClick={handleNewTab}>+</div> </div> {activeTab ? (<> <div style={terminalStyles.content} ref={el => outputRefs.current[activeTab.id] = el} onClick={() => inputRefs.current[activeTab.id]?.focus()}> {activeTab.output.map((line, i) => <div key={i}>{line}</div>)} </div> <div style={terminalStyles.inputArea}> <span style={terminalStyles.prompt}>❯</span> <input ref={el => inputRefs.current[activeTab.id] = el} type="text" style={terminalStyles.input} value={activeTab.currentInput} onChange={(e) => setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, currentInput: e.target.value } : t))} onKeyDown={(e) => handleInputKeyDown(e, activeTab)} placeholder={activeTab.status === 'running' ? 'Process running... (Ctrl+C to interrupt)' : 'Enter command'} disabled={activeTab.status === 'running'} autoFocus /> </div> </>) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.comment }}>No active terminal. <span style={{ textDecoration: 'underline', cursor: 'pointer', marginLeft: '5px', color: THEME.purple }} onClick={handleNewTab}>Create a new tab?</span></div>} </div>);
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 4.5: Editor Tab Bar Component ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function EditorTabBar({ tabs, activeTabPath, onTabClick, onTabClose }) {
    const tabStyles = { bar: { display: 'flex', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333', flexShrink: 0, overflowX: 'auto' }, tab: { padding: '10px 24px 10px 16px', cursor: 'pointer', color: '#888', borderBottom: '2px solid transparent', transition: 'color 0.2s, border-color 0.2s', whiteSpace: 'nowrap', fontSize: '13px', position: 'relative' }, activeTab: { color: '#e0e0e0', borderBottom: '2px solid #8A2BE2' }, closeBtn: { position: 'absolute', top: '50%', right: '6px', transform: 'translateY(-50%)', color: '#888', fontSize: '16px', lineHeight: '1', cursor: 'pointer', opacity: 0.7 } };
    return (<div style={tabStyles.bar}> {tabs.map(tab => (<div key={tab.path} style={{ ...tabStyles.tab, ...(tab.path === activeTabPath ? tabStyles.activeTab : {}) }} onClick={() => onTabClick(tab.path)}> <span>{tab.title}</span> <span style={tabStyles.closeBtn} onMouseOver={(e) => e.currentTarget.style.color = '#e0e0e0'} onMouseOut={(e) => e.currentTarget.style.color = '#888'} onClick={(e) => { e.stopPropagation(); onTabClose(tab.path); }}>×</span> </div>))} </div>);
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- 5. MAIN COMPONENT - Live Development Environment (Integrated) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function LiveDevelopmentEnvironment({ rootPath = '/', onSave: onFileSave, initialFullTab }) {
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTabPath, setActiveTabPath] = useState(null);
    const [activeMode, setActiveMode] = useState(() => {
        // Only use initialFullTab prop if explicitly provided
        if (initialFullTab !== undefined) {
            return initialFullTab ? 'fullTab' : 'default';
        }
        // Otherwise maintain default behavior (starts in default mode)
        return 'default';
    });
    const [initialParent, setInitialParent] = useState(null);
    const [isResizing, setIsResizing] = useState(false);
    const [activeResizer, setActiveResizer] = useState(null);
    const [explorerWidth, setExplorerWidth] = useState(20);
    const [terminalHeight, setTerminalHeight] = useState(30);
    const [isTerminalVisible, setIsTerminalVisible] = useState(false);
    const [activeLeftPaneTab, setActiveLeftPaneTab] = useState('files'); // 'files' or 'git'

    const absoluteRepoPath = useMemo(() => { const vaultBasePath = dc.app.vault.adapter.getBasePath(); return path.join(vaultBasePath, rootPath || ''); }, [rootPath]);
    const containerRef = useRef(null);
    const mainContentRef = useRef(null);
    const resizerOverlayRef = useRef(null);

    useEffect(() => { const statusBar = document.querySelector('body > .app-container .status-bar'); if (statusBar) { const originalDisplay = statusBar.style.display; statusBar.style.display = 'none'; return () => { const statusBarToRestore = document.querySelector('body > .app-container .status-bar'); if (statusBarToRestore) statusBarToRestore.style.display = originalDisplay; }; } }, []);
    const handleFileSelect = useCallback((path) => { if (path === null) { setActiveTabPath(null); return; } if (!openTabs.some(tab => tab.path === path)) { setOpenTabs(prev => [...prev, { path, title: path.split('/').pop() }]); } setActiveTabPath(path); }, [openTabs]);
    const handleCloseTab = useCallback((path) => { const tabIndex = openTabs.findIndex(tab => tab.path === path); const newTabs = openTabs.filter(tab => tab.path !== path); setOpenTabs(newTabs); if (activeTabPath === path) { const newActivePath = newTabs.length > 0 ? newTabs[Math.max(0, tabIndex - 1)].path : null; setActiveTabPath(newActivePath); } }, [openTabs, activeTabPath]);

    const handleSave = useCallback(async (savedFilePath, content) => {
        if (onFileSave) { onFileSave(savedFilePath, content); }
    }, [onFileSave]);

    const handleMouseDown = useCallback((resizerId) => { setIsResizing(true); setActiveResizer(resizerId); if (resizerOverlayRef.current) { resizerOverlayRef.current.style.display = 'block'; } }, []);
    const handleMouseUp = useCallback(() => { setIsResizing(false); setActiveResizer(null); if (resizerOverlayRef.current) { resizerOverlayRef.current.style.display = 'none'; } }, []);
    const handleMouseMove = useCallback((e) => {
        if (!isResizing) return; const { clientX, clientY } = e;
        if (activeResizer === 'main-terminal') { const containerRect = containerRef.current.getBoundingClientRect(); const newTerminalHeight = Math.max(10, Math.min(((containerRect.bottom - clientY) / containerRect.height) * 100, 80)); setTerminalHeight(newTerminalHeight); }
        else if (activeResizer === 'explorer-editor') { const mainRect = mainContentRef.current.getBoundingClientRect(); const mouseX = clientX - mainRect.left; const newExplorerWidth = Math.max(10, Math.min((mouseX / mainRect.width) * 100, 80)); setExplorerWidth(newExplorerWidth); }
    }, [isResizing, activeResizer]);

    useEffect(() => {
        const overlay = resizerOverlayRef.current; if (isResizing && overlay) { overlay.addEventListener('mousemove', handleMouseMove); overlay.addEventListener('mouseup', handleMouseUp); overlay.addEventListener('mouseleave', handleMouseUp); }
        return () => { if (overlay) { overlay.removeEventListener('mousemove', handleMouseMove); overlay.removeEventListener('mouseup', handleMouseUp); overlay.removeEventListener('mouseleave', handleMouseUp); } };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    function findNearestAncestorWithClass(element, className) { if (!element) return null; let current = element.parentNode; while (current) { if (current.classList && current.classList.contains(className)) { return current; } current = current.parentNode; } return null; }
    function findDirectChildByClass(parent, className) { if (!parent) return null; for (const child of parent.children) { if (child.classList && child.classList.contains(className)) { return child; } } return null; }
    const toggleScreenMode = () => { setActiveMode(prev => (prev === 'default' ? 'fullTab' : 'default')); };
    useEffect(() => { const container = containerRef.current; if (!container) return; if (!initialParent) { setInitialParent(container.parentNode); } if (activeMode === 'fullTab') { const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content'); if (targetPaneContent) { const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent; contentWrapper.appendChild(container); } } else if (initialParent) { initialParent.appendChild(container); } }, [activeMode, initialParent]);
    const wrapperStyle = useMemo(() => { const baseStyle = { ...styles.baseWrapper, position: 'relative' }; if (activeMode === 'fullTab') { return { ...baseStyle, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }; } return baseStyle; }, [activeMode]);
    const overlayStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9998, display: 'none' };



    const explorerPaneStyle = { flex: `0 0 ${explorerWidth}%`, ...styles.fileExplorerPane };
    const editorContainerStyle = { flex: '1 1 auto', display: 'flex', flexDirection: 'column', minWidth: 0 };
    const mainAreaStyle = { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 };
    const topPanesStyle = { ...styles.mainContent, flex: 1, minHeight: 0, cursor: isResizing ? 'col-resize' : 'default' };
    const terminalAreaStyle = { flex: `0 0 ${terminalHeight}%`, display: 'flex', flexDirection: 'column', minHeight: 0, backgroundColor: '#1f1f1f', cursor: isResizing && activeResizer === 'main-terminal' ? 'row-resize' : 'default' };

    return (
        <div ref={containerRef} style={wrapperStyle}>
            <div ref={resizerOverlayRef} style={overlayStyle}></div>
            <div style={styles.headerBar}>
                <button type="button" style={styles.iconButton} onClick={() => setIsTerminalVisible(p => !p)} title={isTerminalVisible ? "Hide Terminal" : "Show Terminal"}><dc.Icon icon="terminal" /></button>
                <button type="button" style={styles.iconButton} onClick={toggleScreenMode} title={activeMode === 'default' ? "Enter Full Tab Mode" : "Exit Full Tab Mode"}><dc.Icon icon={activeMode === 'default' ? "maximize-2" : "minimize-2"} /></button>
            </div>
            <div style={mainAreaStyle}>
                <div style={topPanesStyle} ref={mainContentRef}>
                    <div style={explorerPaneStyle}>
                        <div style={{ display: 'flex', borderBottom: '1px solid #333', backgroundColor: '#1a1a1a' }}>
                            <button style={{ ...styles.tab, borderBottom: activeLeftPaneTab === 'files' ? styles.activeTab.borderBottom : '2px solid transparent', color: activeLeftPaneTab === 'files' ? styles.activeTab.color : styles.tab.color, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setActiveLeftPaneTab('files')} title="File Explorer" > <dc.Icon icon="folder-open" /> Files </button>
                            <button style={{ ...styles.tab, borderBottom: activeLeftPaneTab === 'git' ? styles.activeTab.borderBottom : '2px solid transparent', color: activeLeftPaneTab === 'git' ? styles.activeTab.color : styles.tab.color, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setActiveLeftPaneTab('git')} title="Git Source Control" > <dc.Icon icon="git-branch" /> Git </button>
                        </div>
                        {activeLeftPaneTab === 'files' ? (<FileExplorerView rootPath={rootPath} onFileSelect={handleFileSelect} activeFile={activeTabPath} />) :  (<GitSuite repoPath={absoluteRepoPath} />) }
                    </div>
                    <div style={{ ...styles.resizer, ...(activeResizer === 'explorer-editor' ? styles.resizerHover : {}) }} onMouseDown={() => handleMouseDown('explorer-editor')} />
                    <div style={editorContainerStyle}>
                        <EditorTabBar tabs={openTabs} activeTabPath={activeTabPath} onTabClick={setActiveTabPath} onTabClose={handleCloseTab} />
                        <PlaygroundEditor key={activeTabPath} filePath={activeTabPath} onSave={handleSave} reloadKey={activeTabPath} />
                    </div>
                </div>
                {isTerminalVisible && (<> <div style={{ ...styles.resizer, ...styles.horizontalResizer, ...(activeResizer === 'main-terminal' ? styles.resizerHover : {}) }} onMouseDown={() => handleMouseDown('main-terminal')} /> <div style={terminalAreaStyle}> <IntegratedTerminal rootPath={rootPath} /> </div> </>)}
            </div>
        </div>
    );
}

// --- EXPORT THE MAIN COMPONENT ---
return { IntegratedIDE: LiveDevelopmentEnvironment };
```


# GitSuite

```jsx
const { useEffect, useRef, useState, useMemo } = dc;

// --- Node.js Imports ---
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');

// --- Custom UI Components (Replaces Obsidian/Datacore UI) ---

// A generic, self-contained Modal class
class CustomModal {
    constructor() {
        this.overlayEl = null;
    }

    open(contentRenderer) {
        if (this.overlayEl) return; // Modal is already open

        // Create overlay
        this.overlayEl = document.createElement('div');
        this.overlayEl.style.position = 'fixed';
        this.overlayEl.style.top = '0';
        this.overlayEl.style.left = '0';
        this.overlayEl.style.width = '100%';
        this.overlayEl.style.height = '100%';
        this.overlayEl.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        this.overlayEl.style.display = 'flex';
        this.overlayEl.style.alignItems = 'center';
        this.overlayEl.style.justifyContent = 'center';
        this.overlayEl.style.zIndex = '1000';

        // Create modal content container
        const contentEl = document.createElement('div');
        contentEl.style.backgroundColor = '#1e1e1e';
        contentEl.style.color = '#e0e0e0';
        contentEl.style.padding = '24px';
        contentEl.style.borderRadius = '8px';
        contentEl.style.border = '1px solid #333';
        contentEl.style.minWidth = '400px';
        contentEl.style.maxWidth = '90vw';
        contentEl.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';

        // Close modal when clicking on the overlay, but not the content
        this.overlayEl.addEventListener('click', (e) => {
            if (e.target === this.overlayEl) {
                this.close();
            }
        });

        // Pass the content container and a close function to the renderer
        if (typeof contentRenderer === 'function') {
            contentRenderer(contentEl, this.close.bind(this));
        }

        this.overlayEl.appendChild(contentEl);
        document.body.appendChild(this.overlayEl);
    }

    close() {
        if (this.overlayEl) {
            document.body.removeChild(this.overlayEl);
            this.overlayEl = null;
        }
    }
}

// --- Core Execution Logic (Self-contained and stable) ---
function getUserShell() {
    if (os.platform() === 'win32') return 'powershell.exe';
    const preferredShell = process.env.SHELL;
    if (preferredShell && fs.existsSync(preferredShell)) return preferredShell;
    return '/bin/sh';
}

function executeShellCommand(commandString, workingDir) {
    return new Promise((resolve, reject) => {
        const userShell = getUserShell();
        const child = spawn(userShell, ['-l', '-c', commandString], { cwd: workingDir });
        let stdout = '', stderr = '';
        child.stdout.on('data', (data) => { stdout += data.toString(); });
        child.stderr.on('data', (data) => { stderr += data.toString(); });
        child.on('close', (code) => {
            if (code !== 0) reject(new Error(stderr || `Command failed with exit code ${code}: ${commandString}`));
            else resolve(stdout);
        });
        child.on('error', (err) => reject(new Error(`Failed to spawn shell '${userShell}': ${err.message}`)));
    });
}

class NewBranchModal {
    constructor(onSubmit) { this.onSubmit = onSubmit; this.branchName = ''; }
    open() {
        new CustomModal().open((contentEl, close) => {
            const header = contentEl.createEl('h2', { text: 'Create New Branch' });
            header.style.marginTop = '0';

            const textInput = contentEl.createEl('input');
            Object.assign(textInput.style, STYLES.input, { marginBottom: '10px' });
            textInput.placeholder = 'Enter new branch name...';
            textInput.oninput = (e) => this.branchName = e.target.value;

            const createButton = contentEl.createEl('button', { text: 'Create' });
            Object.assign(createButton.style, STYLES.button);
            createButton.onclick = () => { if (this.branchName.trim()) { this.onSubmit(this.branchName.trim()); close(); } };

            textInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); createButton.click(); } });
        });
    }
}

class MergeModal {
    constructor(branches, currentBranch, onSubmit) {
        this.branches = branches.filter(b => b !== currentBranch);
        this.onSubmit = onSubmit;
        this.selectedBranch = this.branches[0] || '';
    }
    open() {
        new CustomModal().open((contentEl, close) => {
            const header = contentEl.createEl('h2', { text: 'Merge Branch' });
            header.style.marginTop = '0';
            contentEl.createEl('p', { text: `Select a branch to merge into the current branch:` });

            const dropdown = contentEl.createEl('select');
            Object.assign(dropdown.style, STYLES.input, { marginBottom: '10px', padding: '8px' });

            if (this.branches.length === 0) {
                dropdown.createEl('option', { text: 'No other branches to merge' });
            } else {
                this.branches.forEach(branch => dropdown.createEl('option', { text: branch, value: branch }));
            }
            dropdown.onchange = (e) => this.selectedBranch = e.target.value;

            const mergeButton = contentEl.createEl('button', { text: 'Merge' });
            Object.assign(mergeButton.style, STYLES.button);
            mergeButton.onclick = () => { if (this.selectedBranch) { this.onSubmit(this.selectedBranch); close(); } };

            if (this.branches.length === 0) mergeButton.disabled = true;
        });
    }
}

class HelpModal {
    open() {
        new CustomModal().open((contentEl, close) => {
            const header = contentEl.createEl('h2', { text: 'Connecting a Remote Repository' });
            header.style.marginTop = '0';
            contentEl.createEl('p', { text: 'To push and pull changes, your local repository needs to connect to a remote one hosted on a service like GitHub, GitLab, or Bitbucket.' });
            contentEl.createEl('p', { text: 'The standard workflow is:' });
            const list = contentEl.createEl('ol');
            list.style.paddingLeft = '20px';
            list.createEl('li', { text: 'Create a new, empty repository on your preferred hosting platform.' });
            list.createEl('li', { text: 'Copy the HTTPS or SSH URL they provide.' });
            list.createEl('li', { text: 'Paste that URL into the "Remote URL" field and click "Set Remote".' });

            const subHeader = contentEl.createEl('h4', { text: 'Create a new repository on:' });
            subHeader.style.marginTop = '20px';

            const linkContainer = contentEl.createDiv({ attr: { style: 'display: flex; flex-direction: column; gap: 10px; margin-top: 10px;' } });
            const linkStyle = 'color: #c084fc; text-decoration: none;';
            linkContainer.createEl('a', { text: 'GitHub', href: 'https://github.com/new', attr: { target: '_blank', rel: 'noopener noreferrer', style: linkStyle } });
            linkContainer.createEl('a', { text: 'GitLab', href: 'https://gitlab.com/projects/new', attr: { target: '_blank', rel: 'noopener noreferrer', style: linkStyle } });
            linkContainer.createEl('a', { text: 'Bitbucket', href: 'https://bitbucket.org/repo/create', attr: { target: '_blank', rel: 'noopener noreferrer', style: linkStyle } });

            contentEl.createEl('p', {
                text: 'You can also use any other Git hosting platform of your choice. Just paste its repository URL.',
                attr: { style: 'margin-top: 20px; font-size: 12px; color: #888888;' }
            });
        });
    }
}

function useGitRepository(initialRepoPath) {
    const [repoPath, setRepoPath] = useState(initialRepoPath || dc.app.vault.adapter.basePath);
    const [remoteUrl, setRemoteUrl] = useState('');
    const [ahead, setAhead] = useState(0);
    const [behind, setBehind] = useState(0);
    const [history, setHistory] = useState([]);
    const [isRepo, setIsRepo] = useState(false);
    const [status, setStatus] = useState({ staged: [], changes: [] });
    const [currentBranch, setCurrentBranch] = useState('...');
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const [gitSystemStatus, setGitSystemStatus] = useState('checking');
    const [gitUserName, setGitUserName] = useState('');
    const [gitUserEmail, setGitUserEmail] = useState('');

    const git = {
        version: () => executeShellCommand('git --version', dc.app.vault.adapter.basePath),
        getConfig: (key) => executeShellCommand(`git config --global ${key}`, dc.app.vault.adapter.basePath),
        setConfig: (key, value) => executeShellCommand(`git config --global ${key} "${value}"`, dc.app.vault.adapter.basePath),
        check: (path) => executeShellCommand('git rev-parse --is-inside-work-tree', path),
        status: (path) => executeShellCommand('git status --porcelain -u', path),
        branch: (path) => executeShellCommand('git symbolic-ref --short HEAD', path),
        allBranches: (path) => executeShellCommand('git branch --all', path),
        init: (path) => executeShellCommand('git init -b main', path),
        clone: (parentPath, url, directoryName) => executeShellCommand(`git clone "${url}" "${directoryName}"`, parentPath),
        add: (path, filePath) => executeShellCommand(`git add "${filePath}"`, path),
        addAll: (path) => executeShellCommand('git add .', path),
        reset: (path, filePath) => executeShellCommand(`git reset HEAD -- "${filePath}"`, path),
        commit: (path, message) => executeShellCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`, path),
        checkout: (path, branchName, isNew = false) => executeShellCommand(`git checkout ${isNew ? '-b' : ''} "${branchName}"`, path),
        discard: (path, filePath) => executeShellCommand(`git checkout -- "${filePath}"`, path),
        pull: (path, branch) => executeShellCommand(`git pull origin "${branch}"`, path),
        push: (path, branch) => executeShellCommand(`git push --set-upstream origin ${branch}`, path),
        getRemote: (path) => executeShellCommand('git remote get-url origin', path),
        addOrUpdateRemote: (path, url) => executeShellCommand(`(git remote set-url origin "${url}" || git remote add origin "${url}")`, path),
        fetch: (path) => executeShellCommand('git fetch --prune', path),
        getAheadBehind: (path, branch) => executeShellCommand(`git rev-list --left-right --count origin/${branch}...${branch}`, path),
        merge: (path, sourceBranch) => executeShellCommand(`git merge "${sourceBranch}"`, path),
        log: (path) => executeShellCommand('git log --all --pretty=format:"%H<||>%P<||>%an<||>%ar<||>%d<||>%s<##>" -n 100', path),
        getLocalCommitCount: (path) => executeShellCommand('git rev-list --count HEAD --not --remotes', path),
    };

    const checkGitSystem = async () => {
        setGitSystemStatus('checking');
        try {
            await git.version();
            const [nameResult, emailResult] = await Promise.allSettled([
                git.getConfig('user.name'),
                git.getConfig('user.email')
            ]);
            const name = (nameResult.status === 'fulfilled' && nameResult.value.trim()) || '';
            const email = (emailResult.status === 'fulfilled' && emailResult.value.trim()) || '';
            setGitUserName(name);
            setGitUserEmail(email);
            if (name && email) {
                setGitSystemStatus('ready');
            } else {
                setGitSystemStatus('not_configured');
            }
        } catch (versionErr) {
            setGitSystemStatus('not_found');
        }
    };

    const refreshState = async (path = repoPath) => {
        // The path object from the adapter has a join method
        const adapterPath = dc.app.vault.adapter.path;

        // The CORRECT check: Does a '.git' folder exist *directly* in this path?
        const repoExists = fs.existsSync(adapterPath.join(path, '.git'));
        setIsRepo(repoExists);


        if (repoExists) {
            try {
                await git.fetch(path).catch(() => { });
                const [statusOutput, branchOutputRaw, allBranchesOutput, remoteOutput, logOutput] = await Promise.all([
                    git.status(path),
                    git.branch(path).catch(() => ""),
                    git.allBranches(path),
                    git.getRemote(path).catch(() => ""),
                    git.log(path).catch(() => "")
                ]);

                let currentBranchName = branchOutputRaw.trim();
                const commits = logOutput.trim().split('<##>').filter(Boolean).map(line => {
                    const [hash, parents, author, date, refs, message] = line.trim().split('<||>');
                    return { hash, parents: parents.split(' ').filter(Boolean), author, date, refs: refs.trim(), message };
                });
                setHistory(commits);

                if (!currentBranchName && commits.length === 0) {
                    currentBranchName = 'main';
                }
                setCurrentBranch(currentBranchName || '...');

                setRemoteUrl(remoteOutput.trim());
                if (remoteOutput.trim() && currentBranchName) {
                    try {
                        const aheadBehindOutput = await git.getAheadBehind(path, currentBranchName);
                        const [behindCount, aheadCount] = aheadBehindOutput.trim().split('\t').map(Number);
                        setAhead(aheadCount || 0);
                        setBehind(behindCount || 0);
                    } catch (e) {
                        try {
                            const localCommits = await git.getLocalCommitCount(path);
                            setAhead(parseInt(localCommits.trim(), 10) || 0);
                        } catch (localErr) { setAhead(0); }
                        setBehind(0);
                    }
                } else {
                    setAhead(0);
                    setBehind(0);
                }

                const staged = [], changes = [];
                statusOutput.split('\n').filter(Boolean).forEach(line => {
                    const code = line.substring(0, 2), filePath = line.substring(3);
                    if (code === '??') changes.push({ path: filePath, status: 'U' });
                    else {
                        if (code[0].trim()) staged.push({ path: filePath, status: code[0].trim() });
                        if (code[1].trim()) changes.push({ path: filePath, status: code[1].trim() });
                    }
                });
                setStatus({ staged, changes });

                const parsedBranches = allBranchesOutput.split('\n')
                    .filter(Boolean)
                    .map(b => b.replace(/^\*?\s*/, '').trim())
                    .filter(b => !b.includes('->'))
                    .map(b => b.replace('remotes/origin/', ''))
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .sort();
                if (currentBranchName && currentBranchName !== '...' && !parsedBranches.includes(currentBranchName)) {
                    parsedBranches.unshift(currentBranchName);
                    parsedBranches.sort();
                }
                setBranches(parsedBranches);

            } catch (e) {
                setError(`Failed to refresh Git status: ${e.message}`);
            }
        } else {
            setCurrentBranch('...');
            setBranches([]);
            setStatus({ staged: [], changes: [] });
            setHistory([]);
            setAhead(0);
            setBehind(0);
            setRemoteUrl('');
        }
    };

    const runAction = async (action, isWriteOperation = false) => {
        setIsProcessing(true);
        if (isWriteOperation) setIsSaving(true);
        setError('');
        try {
            await action();
            await new Promise(res => setTimeout(res, 200));
            await refreshState();
        }
        catch (err) { setError(err.message); }
        finally {
            if (isWriteOperation) setIsSaving(false);
            setIsProcessing(false);
        }
    };

    const handleMerge = async (sourceBranch) => {
        if (status.staged.length > 0 || status.changes.length > 0) {
            setError("You have uncommitted changes. Please commit or stash them before merging to avoid losing work.");
            return;
        }
        await runAction(() => git.merge(repoPath, sourceBranch), true);
    };

    const handlePush = async () => {
        if (behind > 0) {
            setError("Your branch is behind the remote. Please Pull first to avoid conflicts.");
            return;
        }
        await runAction(() => git.push(repoPath, currentBranch), true);
    };

    const cloneRepo = (url, targetDirectory) => runAction(async () => {
        const parentDir = dc.app.vault.adapter.basePath;
        const newRepoPath = dc.app.vault.adapter.path.join(parentDir, targetDirectory);
        if (fs.existsSync(newRepoPath)) {
            throw new Error(`Directory '${targetDirectory}' already exists in the vault.`);
        }
        await git.clone(parentDir, url, targetDirectory);
        setRepoPath(newRepoPath);
    }, true);

    const setGitConfig = (name, email) => runAction(async () => {
        if (!name.trim() || !email.trim()) {
            throw new Error("Both name and email are required.");
        }
        await git.setConfig('user.name', name);
        await git.setConfig('user.email', email);
        await checkGitSystem();
    }, true);

    useEffect(() => {
        (async () => {
            await checkGitSystem();
        })();
    }, []);

    useEffect(() => {
        if (gitSystemStatus === 'ready') {
            (async () => {
                setIsLoading(true);
                await refreshState();
                setIsLoading(false);
            })();
        }
    }, [repoPath, gitSystemStatus]);

    return {
        repoPath, isRepo, status, currentBranch, branches, history, remoteUrl,
        ahead, behind, isLoading, isProcessing, isSaving, error, setRepoPath,
        gitSystemStatus, gitUserName, gitUserEmail,
        checkGitSystem, setGitConfig,
        refresh: () => runAction(() => refreshState(), false),
        init: () => runAction(() => git.init(repoPath), true),
        cloneRepo,
        stage: (filePath) => runAction(() => git.add(repoPath, filePath), true),
        stageAll: () => runAction(() => git.addAll(repoPath), true),
        unstage: (filePath) => runAction(() => git.reset(repoPath, filePath), true),
        discard: (filePath) => runAction(() => git.discard(repoPath, filePath), true),
        commit: (message) => runAction(() => git.commit(repoPath, message), true),
        pull: () => runAction(() => git.pull(repoPath, currentBranch), true),
        push: handlePush,
        merge: handleMerge,
        checkoutBranch: (branchName) => runAction(() => git.checkout(repoPath, branchName), true),
        createBranch: (branchName) => runAction(() => git.checkout(repoPath, branchName, true), true),
        setRemote: (url) => runAction(() => git.addOrUpdateRemote(repoPath, url), true),
    };
}


// =================================================================================
// --- UI COMPONENTS ---
// =================================================================================
const ICONS = {
    branch: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12" /><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M6 15h12" /></svg>,
    add: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    remove: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    delete: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>,
    pull: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    push: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 6 12 1 17 6" /><line x1="12" y1="1" x2="12" y2="15" /></svg>,
    refresh: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
    chevronDown: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
    chevronRight: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
    merge: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 18h-3a3 3 0 0 1-3-3V5" /><path d="M6 5v10a3 3 0 0 0 3 3h3" /><path d="m15 15-3-3 3-3" /></svg>,
    remote: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg>,
    help: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
};

const STYLES = {
    wrapper: { position: 'relative', backgroundColor: "#121212", color: "#e0e0e0", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", height: "100%", width: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" },
    mainArea: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflow: 'hidden' },
    input: { width: '100%', boxSizing: 'border-box', backgroundColor: '#1e1e1e', border: '1px solid #333333', borderRadius: '6px', padding: '10px 14px', color: '#e0e0e0', fontSize: '14px', '::placeholder': { color: '#6b6b6b' }, ':focus': { borderColor: '#9333ea', boxShadow: '0 0 0 2px rgba(147, 51, 234, 0.3)' } },
    button: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#9333ea', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'background-color 0.2s', ':hover': { backgroundColor: '#a855f7' }, ':disabled': { backgroundColor: '#2a2a2a', color: '#6b6b6b', cursor: 'not-allowed' } },
    buttonSecondary: { backgroundColor: '#1e1e1e', color: '#e0e0e0', border: '1px solid #333333', ':hover': { backgroundColor: '#2a2a2a' } },
    buttonIcon: { background: 'transparent', border: '1px solid #333333', color: '#9e9e9e', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', ':hover': { backgroundColor: '#2a2a2a', color: '#e0e0e0' } },
    branchSelect: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e1e1e', border: '1px solid #333333', borderRadius: '6px', padding: '8px 12px' },
    commitInput: { minHeight: '90px', resize: 'vertical' },
    historyContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0', overflow: 'hidden', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333333' },
    historyHeader: { padding: '12px 16px', borderBottom: '1px solid #333333', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    historyHeaderTitle: { fontWeight: 500, fontSize: '16px' },
    historyContent: { flex: 1, overflowY: 'auto' },
    historyItem: { position: 'relative', display: 'flex', alignItems: 'center', padding: '16px 16px 16px 35px', borderBottom: '1px solid #333333', ':last-child': { borderBottom: 'none' } },
    historyGraphLine: { position: 'absolute', left: '16px', top: 0, bottom: 0, width: '2px', backgroundColor: '#333333' },
    historyGraphDot: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '10px', height: '10px', borderRadius: '50%', zIndex: 1 },
    historyDetails: { display: 'flex', flexDirection: 'column', gap: '6px' },
    historyMessage: { fontWeight: 500, color: '#e0e0e0', fontSize: '14px' },
    historyMeta: { fontSize: '12px', color: '#888888' },
    historyRefPillContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' },
    historyRefPill: { padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
    historyRefPillHead: { backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#c084fc' },
    historyRefPillLocal: { backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#c084fc' },
    historyRefPillRemote: { backgroundColor: '#3a3a3a', color: '#b0b0b0' },
};

const FileListSection = ({ title, files, onStage, onStageAll, onUnstage, onDiscard, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const hasFiles = files && files.length > 0;

    const getStatusStyle = (status) => {
        const baseStyle = { fontWeight: 'bold', fontFamily: 'monospace', fontSize: '13px', flexShrink: 0, width: '16px', textAlign: 'center' };
        switch (status) {
            case 'M': return { ...baseStyle, color: '#e5c07b' };
            case 'U': return { ...baseStyle, color: '#98c379' };
            case 'D': return { ...baseStyle, color: '#e06c75' };
            case 'A': return { ...baseStyle, color: '#98c379' };
            case 'R': return { ...baseStyle, color: '#c678dd' };
            default: return { ...baseStyle, color: '#abb2bf' };
        }
    };

    return (
        <div style={{ border: '1px solid #333333', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
            <div style={{ ...STYLES.historyHeader, cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
                <span style={{ ...STYLES.historyHeaderTitle, fontSize: '14px' }}>{title} ({files.length})</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {onStageAll && hasFiles && (
                        <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Stage All" onClick={(e) => { e.stopPropagation(); onStageAll(); }}>
                            {ICONS.add}
                        </button>
                    )}
                    <span style={{ ...STYLES.buttonIcon, pointerEvents: 'none', border: 'none' }}>{isOpen ? ICONS.chevronDown : ICONS.chevronRight}</span>
                </div>
            </div>
            {isOpen && (
                <div>
                    {hasFiles ? (
                        files.map(file => (
                            <div key={file.path} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderTop: '1px solid #333333' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#b0b0b0', wordBreak: 'break-all' }}>{file.path}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {onStage && <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Stage" onClick={() => onStage(file.path)}>{ICONS.add}</button>}
                                        {onUnstage && <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Unstage" onClick={() => onUnstage(file.path)}>{ICONS.remove}</button>}
                                        {onDiscard && <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Discard Changes" onClick={() => onDiscard(file.path)}>{ICONS.delete}</button>}
                                    </div>
                                    <span style={getStatusStyle(file.status)}>{file.status}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '12px 16px', color: '#6b6b6b', fontSize: '13px', borderTop: '1px solid #333333' }}>No changes to display.</div>
                    )}
                </div>
            )}
        </div>
    );
};

const HistoryView = ({ history }) => {
    const [isOpen, setIsOpen] = useState(true);
    const branchColorMap = useRef(new Map());
    const MAIN_BRANCH_COLOR = '#9333ea';
    const ACCENT_COLORS = ['#f472b6', '#38bdf8', '#2dd4bf', '#fb923c', '#a78bfa', '#facc15'];

    const commitToBranchMap = useMemo(() => {
        const map = new Map();
        if (!history || history.length === 0) return map;
        const commitMap = new Map(history.map(c => [c.hash, c]));
        const branchHeads = [];
        for (const commit of history) {
            const refs = commit.refs.replace(/[()]/g, '').split(',').map(r => r.trim());
            for (const ref of refs) {
                if (!ref.startsWith('origin/') && ref !== 'HEAD' && !ref.startsWith('tag:')) {
                    let branchName = ref.startsWith('HEAD ->') ? ref.replace('HEAD ->', '').trim() : ref.trim();
                    if (branchName && !branchHeads.some(h => h.branchName === branchName)) {
                        branchHeads.push({ branchName, hash: commit.hash });
                    }
                }
            }
        }
        const headHashes = new Set(branchHeads.map(h => h.hash));
        branchHeads.sort((a, b) => {
            if (a.branchName === 'main' || a.branchName === 'master') return -1;
            if (b.branchName === 'main' || b.branchName === 'master') return 1;
            return 0;
        });
        for (const head of branchHeads) {
            const queue = [head.hash];
            const visited = new Set();
            while (queue.length > 0) {
                const currentHash = queue.shift();
                if (!currentHash || visited.has(currentHash)) continue;
                visited.add(currentHash);
                if (map.has(currentHash)) continue;
                if (headHashes.has(currentHash) && currentHash !== head.hash) {
                    continue;
                }
                map.set(currentHash, head.branchName);
                const commit = commitMap.get(currentHash);
                if (commit && commit.parents) {
                    for (const parentHash of commit.parents) {
                        queue.push(parentHash);
                    }
                }
            }
        }
        return map;
    }, [history]);

    const getBranchForCommit = (commit) => commitToBranchMap.get(commit.hash) || 'main';

    const getColorForBranch = (branchName) => {
        if (branchName === 'main' || branchName === 'master') return MAIN_BRANCH_COLOR;
        if (!branchColorMap.current.has(branchName)) {
            let hash = 0;
            for (let i = 0; i < branchName.length; i++) hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
            const colorIndex = Math.abs(hash % ACCENT_COLORS.length);
            branchColorMap.current.set(branchName, ACCENT_COLORS[colorIndex]);
        }
        return branchColorMap.current.get(branchName);
    };

    const parseAndCategorizeRefs = (refsString) => {
        if (!refsString) return [];
        const allRefs = refsString.replace(/[()]/g, '').split(',').map(r => r.trim()).filter(Boolean);
        const headRefName = (allRefs.find(r => r.startsWith('HEAD ->')) || '').replace('HEAD -> ', '');
        return allRefs.filter(r => !r.startsWith('tag:') && r !== 'HEAD').map(ref => {
            let type = 'local';
            if (ref === headRefName) type = 'head';
            else if (ref.startsWith('origin/')) type = 'remote';
            return { name: ref, type };
        });
    };

    return (
        <div style={STYLES.historyContainer}>
            <div style={STYLES.historyHeader} onClick={() => setIsOpen(!isOpen)}>
                <span style={STYLES.historyHeaderTitle}>History</span>
                <span style={{ ...STYLES.buttonIcon, pointerEvents: 'none', border: 'none' }}>{isOpen ? ICONS.chevronDown : ICONS.chevronRight}</span>
            </div>
            {isOpen && (
                <div style={STYLES.historyContent}>
                    {history.map((commit) => {
                        const branchName = getBranchForCommit(commit);
                        const dotColor = getColorForBranch(branchName);
                        return (
                            <div key={commit.hash} style={STYLES.historyItem}>
                                <div style={STYLES.historyGraphLine}></div>
                                <div style={{ ...STYLES.historyGraphDot, backgroundColor: dotColor }}></div>
                                <div style={STYLES.historyDetails}>
                                    <div style={STYLES.historyRefPillContainer}>
                                        {parseAndCategorizeRefs(commit.refs).map(({ name, type }) => {
                                            let style = STYLES.historyRefPill;
                                            if (type === 'head') style = { ...style, ...STYLES.historyRefPillHead };
                                            else if (type === 'remote') style = { ...style, ...STYLES.historyRefPillRemote };
                                            else style = { ...style, ...STYLES.historyRefPillLocal };
                                            return (<span key={name} style={style}>{name}</span>);
                                        })}
                                    </div>
                                    <span style={STYLES.historyMessage}>{commit.message}</span>
                                    <span style={STYLES.historyMeta}>{commit.author} - {commit.date}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const RepoView = ({ git, commitMessage, setCommitMessage }) => {
    const [remoteInput, setRemoteInput] = useState(git.remoteUrl);

    useEffect(() => {
        setRemoteInput(git.remoteUrl);
    }, [git.remoteUrl]);

    const handleBranchChange = (e) => {
        const selectedValue = e.target.value;
        if (selectedValue === "__CREATE_NEW_BRANCH__") {
            new NewBranchModal((name) => git.createBranch(name)).open();
            e.target.value = git.currentBranch;
        } else if (selectedValue !== git.currentBranch) {
            git.checkoutBranch(selectedValue);
        }
    };

    const openMergeModal = () => {
        new MergeModal(git.branches, git.currentBranch, (selectedBranch) => {
            git.merge(selectedBranch);
        }).open();
    };

    const isRemoteUnchanged = remoteInput === git.remoteUrl;

    const secondaryIconBtn = { ...STYLES.buttonIcon, ...STYLES.buttonSecondary, flex: 1, padding: '8px' };
    const primaryIconBtn = { ...STYLES.button, flex: 1, padding: '8px' };

    return (
        <div style={STYLES.mainArea}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ ...STYLES.branchSelect, padding: '0' }}>
                    <span style={{ paddingLeft: '12px' }}>{ICONS.branch}</span>
                    <select
                        value={git.currentBranch}
                        onChange={handleBranchChange}
                        disabled={git.isProcessing}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 500, cursor: 'pointer', outline: 'none', width: '100%', padding: '8px 12px' }}
                    >
                        {git.currentBranch && git.currentBranch !== '...' && !git.branches.includes(git.currentBranch) && (
                            <option key={git.currentBranch} value={git.currentBranch}>{git.currentBranch}</option>
                        )}
                        {git.branches.filter(b => !b.startsWith('remotes/')).map(branch => (<option key={branch} value={branch}>{branch}</option>))}
                        <option value="__CREATE_NEW_BRANCH__" style={{ fontStyle: 'italic', color: '#a0a0a0' }}>+ Create new branch...</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '8px', border: '1px solid #333333', borderRadius: '6px', backgroundColor: '#1e1e1e' }}>{ICONS.remote}</span>
                    <input type="text" value={remoteInput} onChange={(e) => setRemoteInput(e.target.value)} style={{ ...STYLES.input, flex: 1 }} placeholder="Enter any Git repository URL" disabled={git.isProcessing} />
                    <button style={{ ...STYLES.buttonIcon }} title="How to get a remote URL?" onClick={() => new HelpModal().open()}>
                        {ICONS.help}
                    </button>
                </div>
                <button style={STYLES.button} onClick={() => git.setRemote(remoteInput)} disabled={git.isProcessing || !remoteInput.trim() || isRemoteUnchanged}>
                    {git.remoteUrl ? 'Update Remote' : 'Set Remote'}
                </button>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button style={secondaryIconBtn} title="Merge Branch" onClick={openMergeModal} disabled={git.isProcessing}>{ICONS.merge}</button>
                    <button style={secondaryIconBtn} onClick={git.refresh} title="Refresh" disabled={git.isProcessing}>{ICONS.refresh}</button>
                    {git.isProcessing && <div style={{ border: '3px solid #333', borderTop: `3px solid ${STYLES.button.backgroundColor}`, borderRadius: '50%', width: '18px', height: '18px', animation: 'spin 1s linear infinite', alignSelf: 'center', marginLeft: 'auto' }}></div>}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={secondaryIconBtn} title={`Pull (${git.behind} behind)`} onClick={git.pull} disabled={git.isProcessing || !git.remoteUrl}>{ICONS.pull}</button>
                    <button style={primaryIconBtn} title={`Push (${git.ahead} ahead)`} onClick={git.push} disabled={git.isProcessing || git.ahead === 0 || !git.remoteUrl}>{ICONS.push}</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                    <textarea style={{ ...STYLES.input, ...STYLES.commitInput }} placeholder="Commit message..." value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} disabled={git.isProcessing} />
                    <button style={{ ...STYLES.button, width: '100%' }} onClick={() => git.commit(commitMessage).then(() => setCommitMessage(''))} disabled={git.status.staged.length === 0 || !commitMessage.trim() || git.isProcessing}>Commit to {git.currentBranch}</button>
                </div>
                <FileListSection title="Staged Changes" files={git.status.staged} onUnstage={git.unstage} defaultOpen={true} />
                <FileListSection title="Changes" files={git.status.changes} onStage={git.stage} onStageAll={git.stageAll} onDiscard={git.discard} defaultOpen={true} />
            </div>

            <HistoryView history={git.history} />
        </div>
    );
};

const InitView = ({ git }) => (
    <div style={{ ...STYLES.mainArea, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Source Control</h3>
        <p style={{ color: '#888888', maxWidth: '400px' }}>This path is not a Git repository. Initialize one locally to start tracking changes, then connect it to a remote service like GitHub or GitLab.</p>
        <input type="text" value={git.repoPath} onChange={(e) => git.setRepoPath(e.target.value)} style={{ ...STYLES.input, maxWidth: '500px' }} disabled={git.isProcessing} />
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={git.refresh} disabled={git.isProcessing}>Use Path</button>
            <button style={STYLES.button} onClick={git.init} disabled={git.isProcessing}>Initialize Repository</button>
        </div>
    </div>
);

const GitSetupView = ({ git }) => {
    const [name, setName] = useState(git.gitUserName || '');
    const [email, setEmail] = useState(git.gitUserEmail || '');

    const getInstallInstructions = () => {
        const platform = os.platform();
        const codeStyle = { backgroundColor: '#2a2a2a', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' };
        switch (platform) {
            case 'win32':
                return (
                    <>
                        <p>Please install <a href="https://git-scm.com/download/win" target="_blank" rel="noopener noreferrer">Git for Windows</a>.</p>
                        <p>The official installer includes the Git Credential Manager to securely handle authentication with services like GitHub.</p>
                    </>
                );
            case 'darwin':
                return (
                    <>
                        <p>The easiest way to install Git on macOS is with the Xcode Command Line Tools.</p>
                        <p>1. Open the Terminal app (you can find it in Applications/Utilities).</p>
                        <p>2. Run the command: <code style={codeStyle}>xcode-select --install</code></p>
                        <p>Alternatively, if you use Homebrew, you can run: <code style={codeStyle}>brew install git</code></p>
                    </>
                );
            case 'linux':
                return (
                    <>
                        <p>Install Git using your distribution's package manager.</p>
                        <p>For Debian/Ubuntu, run: <code style={codeStyle}>sudo apt update && sudo apt install git</code></p>
                        <p>For Fedora/CentOS, run: <code style={codeStyle}>sudo dnf install git</code> or <code style={codeStyle}>sudo yum install git</code></p>
                    </>
                );
            default:
                return <p>Please install Git for your operating system from the <a href="https://git-scm.com/downloads" target="_blank" rel="noopener noreferrer">official website</a>.</p>;
        }
    };

    const renderContent = () => {
        if (git.gitSystemStatus === 'not_found') {
            return (
                <div style={{ width: '100%', maxWidth: '600px', textAlign: 'left' }}>
                    <h4 style={{ margin: 0, fontWeight: 500, fontSize: '18px', color: '#e06c75' }}>Git Installation Not Found</h4>
                    <div style={{ color: '#b0b0b0', marginTop: '16px', lineHeight: 1.6 }}>
                        {getInstallInstructions()}
                    </div>
                    <button style={{ ...STYLES.button, marginTop: '24px' }} onClick={git.checkGitSystem}>I've installed Git, check again</button>
                </div>
            );
        }

        if (git.gitSystemStatus === 'not_configured') {
            return (
                <div style={{ width: '100%', maxWidth: '500px', textAlign: 'left' }}>
                    <h4 style={{ margin: 0, fontWeight: 500, fontSize: '18px' }}>Configure Your Git Identity</h4>
                    <p style={{ color: '#888888', marginTop: '8px' }}>Please set your user name and email. This is required to identify you as the author of your commits.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={STYLES.input} placeholder="Your Name" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={STYLES.input} placeholder="your.email@example.com" />
                    </div>
                    <button
                        style={{ ...STYLES.button, marginTop: '24px', width: '100%' }}
                        onClick={() => git.setGitConfig(name, email)}
                        disabled={!name.trim() || !email.trim() || git.isProcessing}
                    >
                        Save Configuration
                    </button>
                </div>
            );
        }

        return <p>Checking Git installation...</p>;
    };

    return (
        <div style={{ ...STYLES.mainArea, alignItems: 'center', justifyContent: 'center' }}>
            {renderContent()}
        </div>
    );
};

function GitSourceControlView({ repoPath: initialRepoPath, onSaveStateChange, refreshTrigger }) {
    const git = useGitRepository(initialRepoPath);
    const [commitMessage, setCommitMessage] = useState('');

    useEffect(() => {
        if (typeof onSaveStateChange === 'function') {
            onSaveStateChange(git.isSaving);
        }
    }, [git.isSaving, onSaveStateChange]);

    useEffect(() => {
        const styleTagId = 'git-spinner-styles';
        if (!document.getElementById(styleTagId)) {
            const styleSheet = document.createElement("style"); styleSheet.id = styleTagId;
            styleSheet.innerText = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(styleSheet);
        }
    }, []);

    useEffect(() => {
        if (git.gitSystemStatus === 'ready' && !git.isLoading && !git.isProcessing) {
            git.refresh();
        }
    }, [refreshTrigger]);

    if (git.isLoading || git.gitSystemStatus === 'checking') {
        return <div style={STYLES.wrapper}><div style={{ ...STYLES.mainArea, alignItems: 'center', justifyContent: 'center' }}><div style={{ border: '3px solid #333', borderTop: `3px solid ${STYLES.button.backgroundColor}`, borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }}></div></div></div>;
    }

    return (
        <div style={STYLES.wrapper}>
            {git.gitSystemStatus !== 'ready'
                ? <GitSetupView git={git} />
                : git.isRepo
                    ? <RepoView git={git} commitMessage={commitMessage} setCommitMessage={setCommitMessage} />
                    : <InitView git={git} />
            }
            {git.error && <p style={{ color: '#e06c75', textAlign: 'center', position: 'absolute', bottom: '10px', left: '15px', right: '15px', background: 'rgba(224, 108, 117, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid #e06c75', zIndex: 20 }}>{git.error}</p>}
        </div>
    );
};

function MainView(props) {
    return <GitSourceControlView {...props} />;
}

return {
    GitSuite: MainView,
    useGit: useGitRepository
};
```