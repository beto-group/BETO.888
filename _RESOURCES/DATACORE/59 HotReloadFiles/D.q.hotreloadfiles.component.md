

# ViewComponent

```jsx
const { useEffect, useState, useRef } = dc;

function FolderEventListenerTesterV2() {
    // Calculate the folder to watch relative to the component
    const RELATIVE_FOLDER = '_resources/example-folder';
    
    const [lastMatch, setLastMatch] = useState(null);
    const [watchFolder, setWatchFolder] = useState(null);
    const noticeTimeoutRef = useRef(null);
    const lastChangeRef = useRef(null);

    // Calculate the full path to watch based on component location
    useEffect(() => {
        // Get the current component's path
        const currentPath = dc.resolvePath("D.q.hotreloadfiles.component");
        if (!currentPath) return;
        
        // Get the directory of the current file (strip the .md filename)
        const componentDir = currentPath.substring(0, currentPath.lastIndexOf("/"));
        
        // Build the full path to watch
        const fullPath = `${componentDir}/${RELATIVE_FOLDER}`;
        const cleanPath = fullPath.replace(/\\/g, '/').replace(/\/$/, '');
        
        setWatchFolder(cleanPath);
        console.log(`[Folder Watcher] Component at: "${currentPath}"`);
        console.log(`[Folder Watcher] Watching: "${cleanPath}"`);
    }, []);

    useEffect(() => {
        if (!watchFolder) return;
        
        // console.log(`[Folder Watcher] Active on: "${watchFolder}"`);
        // Only one notice when starting
        new Notice(`🔍 Watching: ${watchFolder.split('/').pop()}`);

        const handleFileChange = (filePath) => {
            const normalizedFilePath = filePath.replace(/\\/g, '/');

            // THE FILTER LOGIC
            if (normalizedFilePath.startsWith(watchFolder + '/')) {
                const eventTime = new Date().toLocaleTimeString();
                const fileName = normalizedFilePath.split('/').pop();

                // console.log(`%c[Folder Watcher] ✓ ${fileName} changed at ${eventTime}`, 'color: lightgreen; font-weight: bold;');
                
                // Update UI immediately
                setLastMatch({ path: normalizedFilePath, time: eventTime });
                
                // Store this change
                lastChangeRef.current = { fileName, eventTime };
                
                // Clear any existing timeout
                if (noticeTimeoutRef.current) {
                    clearTimeout(noticeTimeoutRef.current);
                }
                
                // Set new timeout - only show notice after 1 second of no changes
                noticeTimeoutRef.current = setTimeout(() => {
                    if (lastChangeRef.current) {
                        new Notice(`✓ ${lastChangeRef.current.fileName} changed`);
                        lastChangeRef.current = null;
                    }
                }, 1000);

            } else {
                // Silent - no notice for ignored files
                // console.log(`[Folder Watcher] Ignored: "${normalizedFilePath}"`);
            }
        };

        const eventRef = dc.app.vault.on('raw', handleFileChange);

        return () => {
            // console.log("[Folder Watcher] Stopped watching.");
            // Clear timeout on cleanup
            if (noticeTimeoutRef.current) {
                clearTimeout(noticeTimeoutRef.current);
            }
            dc.app.vault.offref(eventRef);
        };
    }, [watchFolder]);

    const styles = {
        wrapper: { 
            padding: '32px', 
            border: '1px solid rgba(139, 92, 246, 0.2)', 
            borderRadius: '12px', 
            backgroundColor: '#000000',
            color: '#e0e0e0',
            fontFamily: 'monospace'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            paddingBottom: '16px'
        },
        title: { 
            margin: 0, 
            color: '#ffffff', 
            fontWeight: '600', 
            fontSize: '24px' 
        },
        section: {
            marginBottom: '20px'
        },
        label: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#888',
            marginBottom: '8px'
        },
        filePath: { 
            fontFamily: 'monospace', 
            backgroundColor: '#0a0a0a', 
            padding: '8px 12px', 
            borderRadius: '6px', 
            color: '#8b5cf6',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            fontSize: '13px',
            display: 'inline-block'
        },
        status: { 
            marginTop: '24px', 
            padding: '16px',
            backgroundColor: '#0a0a0a',
            borderRadius: '8px',
            border: '1px solid rgba(139, 92, 246, 0.1)'
        },
        matchInfo: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '6px',
            color: '#e0e0e0'
        },
        waitingInfo: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#888',
            fontSize: '14px'
        },
        pathInfo: { 
            fontSize: '12px', 
            color: '#666', 
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        }
    };

    return (
        <div style={styles.wrapper}>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            
            <div style={styles.header}>
                <dc.Icon icon="eye" style={{ fontSize: '28px', color: '#8b5cf6' }} />
                <h3 style={styles.title}>Folder Event Listener</h3>
            </div>
            
            <div style={styles.section}>
                <div style={styles.label}>
                    <dc.Icon icon="folder" style={{ fontSize: '14px', color: '#8b5cf6' }} />
                    <span>Relative Path</span>
                </div>
                <code style={styles.filePath}>{RELATIVE_FOLDER}</code>
            </div>
            
            {watchFolder && (
                <div style={styles.section}>
                    <div style={styles.label}>
                        <dc.Icon icon="map-pin" style={{ fontSize: '14px', color: '#666' }} />
                        <span>Full Path</span>
                    </div>
                    <code style={styles.filePath}>{watchFolder}</code>
                </div>
            )}
            
            <div style={styles.status}>
                {lastMatch ? (
                    <div style={styles.matchInfo}>
                        <dc.Icon icon="check-circle" style={{ fontSize: '20px', color: '#50fa7b', marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>
                                Last Matched Change
                            </div>
                            <div style={{ fontSize: '13px', color: '#aaa', wordBreak: 'break-all' }}>
                                {lastMatch.path}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <dc.Icon icon="clock" style={{ fontSize: '12px' }} />
                                {lastMatch.time}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={styles.waitingInfo}>
                        <dc.Icon icon="loader" style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }} />
                        <span>Waiting for a matching file change...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

return { View: FolderEventListenerTesterV2 };
```


