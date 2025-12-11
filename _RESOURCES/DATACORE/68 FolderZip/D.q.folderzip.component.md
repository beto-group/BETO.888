




# ViewComponent

```jsx
const { useEffect, useRef, useState } = dc;

/* ---------------------- UTILITIES ---------------------- */
const pathJoin = (...segs) => segs.join("/").replace(/\/+/g, "/").replace(/\/$/, "");
const sanitizeFileName = (name) => name.replace(/[\\:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();

// DOM Traversal Utilities
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

/* ---------------------- FOLDER PICKER ---------------------- */
const FolderPicker = ({ isOpen, onClose, onSelectFolder, zIndex = 10000 }) => {
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
            if (cur?.children) {
                for (const ch of cur.children) {
                    if (ch?.children) stack.push(ch);
                }
            }
        } 
        setFolders(out); 
    }, []);
    
    const filtered = search.trim() 
        ? folders.filter(f => (f.path || "").toLowerCase().includes(search.toLowerCase())) 
        : folders;
    
    const styles = {
        overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        modal: { background: '#000000', width: '92%', maxWidth: 720, height: '72%', borderRadius: 12, display: 'flex', flexDirection: 'column', border: '1px solid rgba(139, 92, 246, 0.2)' }, 
        head: { padding: '14px 18px', borderBottom: '1px solid rgba(139, 92, 246, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a' }, 
        title: { margin: 0, fontSize: 16, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }, 
        btn: { background: 'transparent', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#ffffff', borderRadius: 8, cursor: 'pointer', width: 36, height: 36, display: 'grid', placeItems: 'center' }, 
        input: { width: 'calc(100% - 32px)', margin: 16, padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(139, 92, 246, 0.2)', background: '#0a0a0a', color: '#ffffff' }, 
        list: { flex: 1, overflowY: 'auto', padding: '0 12px 12px', background: '#000000' }, 
        item: { padding: '10px 12px', cursor: 'pointer', borderRadius: 10, border: '1px solid rgba(139, 92, 246, 0.1)', marginBottom: 8, background: '#0a0a0a', transition: 'all 0.2s ease' }, 
        path: { fontSize: 12, color: '#666' }
    };
    
    return (<div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.head}>
                <h3 style={styles.title}>
                    <dc.Icon icon="folder" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                    Select Folder to Compress
                </h3>
                <button style={styles.btn} onClick={onClose} onMouseEnter={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'} onMouseLeave={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}>
                    <dc.Icon icon="x" style={{ width: '16px', height: '16px' }} />
                </button>
            </div>
            <input style={styles.input} placeholder="Search folders…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
            <div style={styles.list}>
                {filtered.map(f => (
                    <div key={f.path} style={styles.item} onClick={() => onSelectFolder(f)} onMouseEnter={(e) => {e.target.style.background = 'rgba(139, 92, 246, 0.1)'; e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';}} onMouseLeave={(e) => {e.target.style.background = '#0a0a0a'; e.target.style.borderColor = 'rgba(139, 92, 246, 0.1)';}}>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{f.name || (f.path === "/" ? "Vault Root" : f.path)}</div>
                        <div style={styles.path}>{f.path}</div>
                    </div>
                ))}
            </div>
        </div>
    </div>);
};

/* ---------------------- COMPRESS PROGRESS MODAL ---------------------- */
const CompressProgressModal = ({ isOpen, onClose, logs, isProcessing, totalFolders, processedFolders, failedFolders }) => {
    if (!isOpen) return null;
    const logContainerRef = useRef(null);
    
    useEffect(() => { 
        if (logContainerRef.current) { 
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight; 
        } 
    }, [logs]);
    
    const styles = {
        overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.90)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        modal: { width: 800, maxWidth: '95%', maxHeight: '85vh', background: '#000000', borderRadius: 12, border: '1px solid rgba(139, 92, 246, 0.2)', overflow: 'hidden', color: '#ffffff', display: 'flex', flexDirection: 'column' },
        head: { padding: '14px 16px', borderBottom: '1px solid rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a' },
        progress: { padding: '12px 16px', borderBottom: '1px solid rgba(139, 92, 246, 0.1)', display: 'flex', flexDirection: 'column', gap: 8, background: '#000000' },
        progressBar: { width: '100%', height: 8, background: '#0a0a0a', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(139, 92, 246, 0.1)' },
        progressFill: (percent) => ({ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.8), rgba(139, 92, 246, 0.5))', transition: 'width 0.3s ease' }),
        stats: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#ffffff' },
        logContainer: { flex: 1, overflow: 'auto', padding: 16, fontFamily: 'ui-monospace', fontSize: 12, lineHeight: 1.6, background: '#000000', color: '#ffffff', whiteSpace: 'pre-wrap' },
        foot: { padding: '12px 16px', borderTop: '1px solid rgba(139, 92, 246, 0.1)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#0a0a0a' },
        btn: { padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(139, 92, 246, 0.2)', background: '#000000', cursor: 'pointer', color: '#ffffff', transition: 'all 0.2s ease' }
    };
    
    const progressPercent = totalFolders > 0 ? (processedFolders / totalFolders) * 100 : 0;
    
    return (<div style={styles.overlay} onClick={!isProcessing ? onClose : undefined}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.head}>
                <strong style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <dc.Icon icon="package" style={{ width: '18px', height: '18px', color: '#8b5cf6' }} />
                    Compression Progress
                </strong>
                {!isProcessing && <button style={styles.btn} onClick={onClose} onMouseEnter={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'} onMouseLeave={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}>Close</button>}
            </div>
            
            <div style={styles.progress}>
                <div style={styles.stats}>
                    <span>Progress: {processedFolders} / {totalFolders} folders</span>
                    <span>{failedFolders > 0 && `❌ ${failedFolders} failed`}</span>
                </div>
                <div style={styles.progressBar}>
                    <div style={styles.progressFill(progressPercent)}></div>
                </div>
            </div>
            
            <div ref={logContainerRef} style={styles.logContainer}>
                {logs.join('\n')}
            </div>
            
            {!isProcessing && (
                <div style={styles.foot}>
                    <span style={{flex: 1, fontSize: 13, color: '#666'}}>
                        {failedFolders > 0 ? `⚠️ ${failedFolders} folders failed to compress` : '✅ All compressions completed successfully'}
                    </span>
                    <button style={styles.btn} onClick={onClose} onMouseEnter={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'} onMouseLeave={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}>Close</button>
                </div>
            )}
        </div>
    </div>);
};

/* ---------------------- MAIN COMPONENT ---------------------- */
function FolderZipComponent() {
    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
    const uniqueWrapperClass = `folder-zip-wrapper-${instanceId}`;
    
    const STYLES = {
        hoverEffectStyle: `
            .${uniqueWrapperClass} .subtle-icon {
                opacity: 0;
                transform: scale(0.9);
                transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
            }
            .${uniqueWrapperClass}:hover .subtle-icon {
                opacity: 0.7;
                transform: scale(1);
            }
            .${uniqueWrapperClass} .subtle-icon:hover {
                opacity: 1;
            }
            .${uniqueWrapperClass} button:not(:disabled):hover {
                transform: translateY(-1px);
                border-color: rgba(139, 92, 246, 0.4);
            }
            .${uniqueWrapperClass} *::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            .${uniqueWrapperClass} *::-webkit-scrollbar-track {
                background: #000000;
                border-radius: 4px;
            }
            .${uniqueWrapperClass} *::-webkit-scrollbar-thumb {
                background: rgba(139, 92, 246, 0.3);
                border-radius: 4px;
            }
            .${uniqueWrapperClass} *::-webkit-scrollbar-thumb:hover {
                background: rgba(139, 92, 246, 0.5);
            }
        `,
        wrap: { 
            position: 'relative', 
            height: "100%", 
            width: "100%", 
            padding: 24, 
            display: "flex", 
            flexDirection: "column", 
            gap: 20, 
            background: '#000000', 
            borderRadius: 12, 
            color: '#ffffff',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            boxSizing: 'border-box',
            overflow: 'auto'
        },
        iconContainer: {
            position: "absolute",
            top: "20px",
            right: "24px",
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#8b5cf6",
            userSelect: "none",
            cursor: "pointer",
            zIndex: 10,
        },
        card: {
            background: '#0a0a0a',
            borderRadius: 12,
            padding: 24,
            border: '1px solid rgba(139, 92, 246, 0.1)',
        },
        header: {
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#ffffff',
            letterSpacing: '0.5px'
        },
        description: {
            fontSize: 14,
            lineHeight: 1.6,
            color: '#999',
            marginBottom: 20
        },
        selectedFolder: {
            padding: 14,
            background: '#000000',
            borderRadius: 10,
            border: '1px solid rgba(139, 92, 246, 0.15)',
            fontFamily: 'ui-monospace',
            fontSize: 13,
            color: '#ffffff',
            wordBreak: 'break-all'
        },
        buttonContainer: {
            display: 'flex',
            gap: 10,
            marginTop: 16,
            flexWrap: 'wrap'
        },
        button: {
            padding: '10px 20px',
            background: '#0a0a0a',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: 8,
            cursor: 'pointer',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        },
        buttonPrimary: {
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
        },
        buttonDanger: {
            background: 'rgba(220, 38, 38, 0.15)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
        },
        buttonDisabled: {
            opacity: 0.5,
            cursor: 'not-allowed'
        },
        infoBox: {
            padding: 14,
            background: '#000000',
            borderRadius: 10,
            border: '1px solid rgba(139, 92, 246, 0.1)',
            fontSize: 13,
            lineHeight: 1.6,
            color: '#ccc'
        },
        folderList: {
            maxHeight: 300,
            overflow: 'auto',
            padding: 12,
            background: '#000000',
            borderRadius: 10,
            border: '1px solid rgba(139, 92, 246, 0.1)',
            marginTop: 12
        },
        folderItem: {
            padding: '10px 12px',
            background: '#0a0a0a',
            borderRadius: 8,
            marginBottom: 8,
            fontSize: 13,
            fontFamily: 'ui-monospace',
            color: '#ffffff',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        folderItemBlacklisted: {
            opacity: 0.4,
            textDecoration: 'line-through'
        },
        compactWrapper: {
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            borderRadius: "12px",
            background: "#0a0a0a",
        },
        compactText: { 
            margin: 0, 
            color: "#666", 
            fontSize: "14px", 
            fontFamily: "monospace" 
        },
    };
    
    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;
    const [folderPickerOpen, setFolderPickerOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [subfolders, setSubfolders] = useState([]);
    const [blacklist, setBlacklist] = useState(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressModalOpen, setProgressModalOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [totalFolders, setTotalFolders] = useState(0);
    const [processedFolders, setProcessedFolders] = useState(0);
    const [failedFolders, setFailedFolders] = useState(0);
    
    // Full-tab effect
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullTab) return;
        
        if (!container.parentNode) {
            setTimeout(() => setIsFullTab(true), 50);
            return;
        }
        
        const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
        if (!targetPaneContent) {
            setIsFullTab(false);
            return;
        }
        
        const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
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
                stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position =
                    stateRefs.parentPositionInfo.original === "static" ? "" : stateRefs.parentPositionInfo.original;
            }
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
        };
    }, [isFullTab]);
    
    // Load default folder on mount
    useEffect(() => {
        const defaultPath = "_RESOURCES/DATACORE";
        const defaultFolder = dc.app.vault.getAbstractFileByPath(defaultPath);
        if (defaultFolder) {
            handleFolderSelect(defaultFolder);
        }
    }, []);
    
    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    };
    
    const toggleBlacklist = (folderPath) => {
        setBlacklist(prev => {
            const next = new Set(prev);
            if (next.has(folderPath)) {
                next.delete(folderPath);
            } else {
                next.add(folderPath);
            }
            return next;
        });
    };
    
    const clearBlacklist = () => {
        setBlacklist(new Set());
    };
    
    const handleFolderSelect = (folder) => {
        if (!folder?.children) {
            new Notice("Selected folder has no contents.", 3000);
            setFolderPickerOpen(false);
            return;
        }
        
        // Get immediate child folders only
        const childFolders = folder.children.filter(child => child?.children);
        
        if (childFolders.length === 0) {
            new Notice("No subfolders found in selected folder.", 3000);
            setFolderPickerOpen(false);
            return;
        }
        
        setSelectedFolder(folder);
        setSubfolders(childFolders);
        setBlacklist(new Set()); // Clear blacklist on new folder selection
        setFolderPickerOpen(false);
        addLog(`✅ Selected folder: ${folder.path}`);
        addLog(`📁 Found ${childFolders.length} subfolder(s) to compress`);
        new Notice(`Found ${childFolders.length} subfolder(s) ready to compress`, 3000);
    };
    
    const getFileCount = (folder) => {
        let count = 0;
        const stack = [folder];
        
        while (stack.length) {
            const current = stack.pop();
            if (current?.children) {
                for (const child of current.children) {
                    if (child?.children) {
                        stack.push(child);
                    } else {
                        count++;
                    }
                }
            }
        }
        
        return count;
    };
    
    const compressFolderToZip = async (folder) => {
        try {
            const fileCount = getFileCount(folder);
            
            if (fileCount === 0) {
                addLog(`⚠️ Skipping "${folder.name}" - no files found`);
                return { success: false, reason: 'empty' };
            }
            
            addLog(`📦 Compressing "${folder.name}" (${fileCount} files)...`);
            
            // Get vault adapter and paths
            const adapter = dc.app.vault.adapter;
            const vaultPath = adapter.basePath;
            
            // Get component folder path (strip filename after last /)
            const componentPath = dc.resolvePath("D.q.folderzip.component");
            const outputDir = componentPath.substring(0, componentPath.lastIndexOf("/")) + "zip/";
            const outputDirFull = `${vaultPath}/${outputDir}`;
            
            const folderFullPath = `${vaultPath}/${folder.path}`;
            const parentPath = selectedFolder.path === "/" ? vaultPath : `${vaultPath}/${selectedFolder.path}`;
            const zipFileName = sanitizeFileName(folder.name) + ".zip";
            const zipFullPath = `${outputDirFull}/${zipFileName}`;
            
            // Use zip command: cd to source folder parent, output to component folder
            const command = `cd "${parentPath}" && zip -r "${zipFullPath}" "${folder.name}"`;
            
            // Execute via Node if available
            if (typeof require !== 'undefined') {
                const { exec } = require('child_process');
                
                await new Promise((resolve, reject) => {
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            reject(new Error(stderr || error.message));
                        } else {
                            resolve(stdout);
                        }
                    });
                });
                
                addLog(`✅ Successfully created: ${outputDir}/${zipFileName}`);
                return { success: true };
            } else {
                throw new Error("Node.js 'require' not available in this environment");
            }
            
        } catch (error) {
            addLog(`❌ Failed to compress "${folder.name}": ${error.message}`);
            return { success: false, reason: error.message };
        }
    };
    
    const compressAllSubfolders = async () => {
        if (!selectedFolder || subfolders.length === 0) {
            new Notice("No subfolders to compress", 2000);
            return;
        }
        
        // Filter out blacklisted folders
        const foldersToCompress = subfolders.filter(f => !blacklist.has(f.path));
        
        if (foldersToCompress.length === 0) {
            new Notice("All folders are blacklisted. Nothing to compress.", 3000);
            return;
        }
        
        // Check if require is available
        if (typeof require === 'undefined') {
            new Notice("⚠️ Node.js not available. This feature requires Node.js access.", 5000);
            addLog("❌ ERROR: Node.js 'require' not available. Cannot use zip command.");
            return;
        }
        
        // Get output directory (component folder)
        const componentPath = dc.resolvePath("FolderZip.component");
        const outputDir = componentPath.substring(0, componentPath.lastIndexOf("/"));
        
        const blacklistedCount = subfolders.length - foldersToCompress.length;
        const confirmMsg = `Compress ${foldersToCompress.length} subfolder(s) from "${selectedFolder.path}"?\n\n` +
            `Using system command: zip -r\n` +
            (blacklistedCount > 0 ? `\n⚠️ Skipping ${blacklistedCount} blacklisted folder(s)\n` : '') +
            `\nZip files will be saved to: ${outputDir}`;
        
        const confirmed = confirm(confirmMsg);
        
        if (!confirmed) {
            addLog("❌ Compression cancelled by user");
            return;
        }
        
        setIsProcessing(true);
        setProgressModalOpen(true);
        setLogs([]);
        setTotalFolders(foldersToCompress.length);
        setProcessedFolders(0);
        setFailedFolders(0);
        
        addLog("🚀 Starting compression process...");
        addLog(`📍 Source folder: ${selectedFolder.path}`);
        addLog(`💾 Output folder: ${outputDir}`);
        addLog(`📊 Total subfolders: ${subfolders.length}`);
        addLog(`✅ Compressing: ${foldersToCompress.length}`);
        if (blacklistedCount > 0) {
            addLog(`⛔ Blacklisted (skipping): ${blacklistedCount}`);
        }
        addLog(`🔧 Using system command: zip -r`);
        addLog("");
        
        let failed = 0;
        
        for (let i = 0; i < foldersToCompress.length; i++) {
            const folder = foldersToCompress[i];
            const result = await compressFolderToZip(folder);
            
            if (!result.success) {
                failed++;
            }
            
            setProcessedFolders(i + 1);
            setFailedFolders(failed);
            
            // Small delay to prevent UI freezing
            await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        addLog("");
        addLog("🏁 Compression process complete!");
        addLog(`✅ Successful: ${foldersToCompress.length - failed}`);
        if (failed > 0) {
            addLog(`❌ Failed: ${failed}`);
        }
        if (blacklistedCount > 0) {
            addLog(`⛔ Skipped (blacklisted): ${blacklistedCount}`);
        }
        
        setIsProcessing(false);
        
        new Notice(
            `Compression complete: ${foldersToCompress.length - failed} successful${failed > 0 ? `, ${failed} failed` : ''}${blacklistedCount > 0 ? `, ${blacklistedCount} skipped` : ''}`,
            5000
        );
    };
    
    const handleExitFullTab = (e) => {
        e.stopPropagation();
        setIsFullTab(false);
    };
    
    const handleEnterFullTab = () => setIsFullTab(true);
    
    // Compact mode
    if (!isFullTab) {
        return (
            <div ref={containerRef} style={STYLES.compactWrapper}>
                <dc.Icon icon="package" style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
                <p style={STYLES.compactText}>Folder Zipper is in compact mode.</p>
                <button 
                    style={{...STYLES.button, ...STYLES.buttonPrimary}}
                    onClick={handleEnterFullTab}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'}
                >
                    <dc.Icon icon="maximize-2" style={{ width: '16px', height: '16px' }} />
                    Enter Full Tab
                </button>
            </div>
        );
    }
    
    const nonBlacklistedCount = subfolders.filter(f => !blacklist.has(f.path)).length;
    
    return (
        <div ref={containerRef}>
            <style>{STYLES.hoverEffectStyle}</style>
            <div style={STYLES.wrap} className={uniqueWrapperClass}>
                <div
                    style={STYLES.iconContainer}
                    className="subtle-icon"
                    onClick={handleExitFullTab}
                >
                    &lt;/&gt;
                </div>
                
                <FolderPicker 
                    isOpen={folderPickerOpen} 
                    onClose={() => setFolderPickerOpen(false)} 
                    onSelectFolder={handleFolderSelect} 
                />
                
                <CompressProgressModal
                    isOpen={progressModalOpen}
                    onClose={() => setProgressModalOpen(false)}
                    logs={logs}
                    isProcessing={isProcessing}
                    totalFolders={totalFolders}
                    processedFolders={processedFolders}
                    failedFolders={failedFolders}
                />
            
            <div style={STYLES.card}>
                <h1 style={STYLES.header}>
                    <dc.Icon icon="package" style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
                    Folder Zipper
                </h1>
                
                <p style={STYLES.description}>
                    Select a parent folder to compress each immediate subfolder into its own .zip file using the system <code style={{background: '#000', padding: '2px 6px', borderRadius: 4, color: '#8b5cf6'}}>zip -r</code> command.
                    Perfect for organizing exports, backups, or preparing folders for distribution.
                </p>
                
                {selectedFolder && (
                    <div>
                        <div style={{fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#999', display: 'flex', alignItems: 'center', gap: 6}}>
                            <dc.Icon icon="folder-open" style={{ width: '14px', height: '14px', color: '#8b5cf6' }} />
                            Selected Folder:
                        </div>
                        <div style={STYLES.selectedFolder}>
                            {selectedFolder.path}
                        </div>
                    </div>
                )}
                
                <div style={STYLES.buttonContainer}>
                    <button 
                        style={{...STYLES.button, ...(!selectedFolder && STYLES.buttonPrimary)}}
                        onClick={() => setFolderPickerOpen(true)}
                        disabled={isProcessing}
                        onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)')}
                        onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)')}
                    >
                        <dc.Icon icon={selectedFolder ? "edit" : "folder"} style={{ width: '16px', height: '16px' }} />
                        {selectedFolder ? 'Change Folder' : 'Select Folder'}
                    </button>
                    
                    {selectedFolder && subfolders.length > 0 && (
                        <>
                            <button 
                                style={{...STYLES.button, ...STYLES.buttonPrimary, ...(isProcessing && STYLES.buttonDisabled)}}
                                onClick={compressAllSubfolders}
                                disabled={isProcessing || nonBlacklistedCount === 0}
                                onMouseEnter={(e) => !isProcessing && nonBlacklistedCount > 0 && (e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)')}
                                onMouseLeave={(e) => !isProcessing && nonBlacklistedCount > 0 && (e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)')}
                            >
                                <dc.Icon icon="zap" style={{ width: '16px', height: '16px' }} />
                                Compress {nonBlacklistedCount} Folder{nonBlacklistedCount !== 1 ? 's' : ''}
                            </button>
                            
                            {blacklist.size > 0 && (
                                <button 
                                    style={{...STYLES.button, ...STYLES.buttonDanger}}
                                    onClick={clearBlacklist}
                                    disabled={isProcessing}
                                    onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.5)')}
                                    onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)')}
                                >
                                    <dc.Icon icon="x-circle" style={{ width: '16px', height: '16px' }} />
                                    Clear Blacklist ({blacklist.size})
                                </button>
                            )}
                        </>
                    )}
                    
                    {logs.length > 0 && (
                        <button 
                            style={STYLES.button}
                            onClick={() => setProgressModalOpen(true)}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'}
                        >
                            <dc.Icon icon="bar-chart-2" style={{ width: '16px', height: '16px' }} />
                            View Progress
                        </button>
                    )}
                </div>
            </div>
            
            {selectedFolder && subfolders.length > 0 && (
                <div style={STYLES.card}>
                    <div style={{fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                            <dc.Icon icon="list" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                            Subfolders ({subfolders.length} total, {nonBlacklistedCount} to compress, {blacklist.size} blacklisted)
                        </div>
                        <div style={{fontSize: 12, color: '#666'}}>
                            Click folder to toggle blacklist
                        </div>
                    </div>
                    <div style={STYLES.folderList}>
                        {subfolders.map((folder, index) => {
                            const fileCount = getFileCount(folder);
                            const isBlacklisted = blacklist.has(folder.path);
                            return (
                                <div 
                                    key={folder.path} 
                                    style={{
                                        ...STYLES.folderItem, 
                                        ...(isBlacklisted && STYLES.folderItemBlacklisted),
                                        cursor: 'pointer'
                                    }} 
                                    onClick={() => toggleBlacklist(folder.path)}
                                    onMouseEnter={(e) => {
                                        if (!isBlacklisted) {
                                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)'; 
                                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                                        }
                                    }} 
                                    onMouseLeave={(e) => {
                                        if (!isBlacklisted) {
                                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.1)'; 
                                            e.currentTarget.style.background = '#0a0a0a';
                                        }
                                    }}
                                >
                                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                        <dc.Icon 
                                            icon={isBlacklisted ? "x-circle" : "folder"} 
                                            style={{ 
                                                width: '14px', 
                                                height: '14px', 
                                                color: isBlacklisted ? '#dc2626' : '#8b5cf6',
                                                flexShrink: 0
                                            }} 
                                        />
                                        <span>
                                            {index + 1}. {folder.name} 
                                            <span style={{opacity: 0.6, marginLeft: 8}}>({fileCount} files)</span>
                                        </span>
                                    </div>
                                    {isBlacklisted && (
                                        <span style={{fontSize: 11, color: '#dc2626', fontWeight: 600}}>BLACKLISTED</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            <div style={STYLES.card}>
                <div style={{fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8}}>
                    <dc.Icon icon="info" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                    How It Works:
                </div>
                <div style={STYLES.infoBox}>
                    <ol style={{margin: 0, paddingLeft: 20, lineHeight: 2}}>
                        <li>Select a parent folder containing subfolders you want to compress</li>
                        <li>The tool will find all immediate child folders (not nested deeper)</li>
                        <li>Click "Compress" to create individual .zip files using <code style={{background: '#0a0a0a', padding: '2px 6px', borderRadius: 4, color: '#8b5cf6'}}>zip -r foo.zip bar</code></li>
                        <li>All .zip files will be saved in the same folder as this component</li>
                        <li>Each .zip contains all files from its subfolder (including nested content)</li>
                    </ol>
                </div>
            </div>
            </div>
        </div>
    );
}

return { View : FolderZipComponent };
```


