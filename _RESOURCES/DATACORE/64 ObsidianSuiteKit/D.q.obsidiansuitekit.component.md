

# ViewComponent

```jsx
// =================================================================================
// --- OBSIDIAN API EXPLORER ---
// - Access Obsidian's global API (app, requirejs modules)
// - The Obsidian API is NOT available as an external npm module
// - It's only accessible within the Obsidian app context
// - We can access it through: window.app, requirejs('obsidian')
// =================================================================================

const { useEffect, useState, useRef } = dc;

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

const Component = () => {
    const instanceIdRef = useRef(Math.random().toString(36).substr(2, 5));
    const instanceId = instanceIdRef.current;
    const uniqueWrapperClass = `interactive-wrapper-${instanceId}`;
    
    const [obsidianModule, setObsidianModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [apiKeys, setApiKeys] = useState([]);
    const [appInfo, setAppInfo] = useState(null);
    const [isFullTab, setIsFullTab] = useState(true);
    
    const containerRef = useRef(null);
    const stateRefs = useRef({});

    // Full-tab mode effect
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
        
        stateRefs.current.originalParent = container.parentNode;
        stateRefs.current.placeholder = document.createElement("div");
        stateRefs.current.placeholder.style.display = "none";
        container.parentNode.insertBefore(stateRefs.current.placeholder, container);
        
        stateRefs.current.parentPositionInfo = {
            element: contentWrapper,
            original: window.getComputedStyle(contentWrapper).position,
        };
        
        if (stateRefs.current.parentPositionInfo.original === "static") {
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
            if (stateRefs.current.placeholder?.parentNode) {
                stateRefs.current.placeholder.parentNode.replaceChild(
                    container,
                    stateRefs.current.placeholder
                );
            }
            if (stateRefs.current.parentPositionInfo?.element) {
                stateRefs.current.parentPositionInfo.element.style.position =
                    stateRefs.current.parentPositionInfo.original === "static"
                        ? ""
                        : stateRefs.current.parentPositionInfo.original;
            }
            container.removeAttribute("style");
            Object.keys(stateRefs.current).forEach((key) => (stateRefs.current[key] = null));
        };
    }, [isFullTab]);

    // Hide status bar when component is mounted
    useEffect(() => {
        const statusBar = document.querySelector('body > .app-container .status-bar');
        if (statusBar) {
            const originalDisplay = statusBar.style.display;
            statusBar.style.display = 'none';
            
            return () => {
                const statusBarToRestore = document.querySelector('body > .app-container .status-bar');
                if (statusBarToRestore) {
                    statusBarToRestore.style.display = originalDisplay;
                }
            };
        }
    }, []);

    // Add CSS for details arrow animation
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            details summary span:first-child {
                transition: transform 0.2s ease;
            }
            details[open] summary span:first-child {
                transform: rotate(90deg);
            }
            .${uniqueWrapperClass} .exit-icon {
                opacity: 0;
                transform: scale(0.9);
                transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
            }
            .${uniqueWrapperClass}:hover .exit-icon {
                opacity: 0.7;
                transform: scale(1);
            }
            .${uniqueWrapperClass} .exit-icon:hover {
                opacity: 1;
            }
            .${uniqueWrapperClass} .exit-icon:hover .exit-tooltip {
                visibility: visible;
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
        return () => style.remove();
    }, [uniqueWrapperClass]);

    useEffect(() => {
        let isMounted = true;

        async function loadObsidian() {
            try {
                // Use require('obsidian') - this is how Obsidian plugins access the API
                const obsidian = require('obsidian');
                
                if (!isMounted) return;
                
                // Get app info
                const app = window.app;
                const info = {
                    hasApp: !!app,
                    hasObsidianModule: !!obsidian,
                    vault: app?.vault ? {
                        name: app.vault.getName(),
                        adapter: app.vault.adapter?.constructor?.name
                    } : null,
                    workspace: app?.workspace ? 'Available' : null,
                    metadataCache: app?.metadataCache ? 'Available' : null,
                    fileManager: app?.fileManager ? 'Available' : null
                };
                
                setAppInfo(info);
                setObsidianModule(obsidian);
                
                const keys = Object.keys(obsidian).filter(k => typeof obsidian[k] === 'function' || typeof obsidian[k] === 'object');
                setApiKeys(keys.sort());
                
                setLoading(false);
            } catch (err) {
                console.error('❌ Failed to load Obsidian API:', err);
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        }

        loadObsidian();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleExitFullTab = (e) => {
        e.stopPropagation();
        setIsFullTab(false);
    };
    
    const handleEnterFullTab = () => setIsFullTab(true);

    const containerStyle = {
        padding: '24px',
        fontFamily: 'monospace',
        backgroundColor: '#000000',
        color: '#ffffff',
        borderRadius: '12px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        minHeight: '100vh'
    };

    const headerStyle = {
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '24px',
        color: '#8b5cf6',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        letterSpacing: '0.5px'
    };

    const sectionStyle = {
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#0a0a0a',
        borderRadius: '12px',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)'
    };

    const keyStyle = {
        display: 'inline-block',
        padding: '6px 12px',
        margin: '4px',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'monospace',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        color: '#e0e0e0',
        transition: 'all 0.2s ease'
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '10px'
    };

    const exitIconStyle = {
        position: 'absolute',
        top: '20px',
        right: '24px',
        cursor: 'pointer',
        zIndex: 10,
        fontSize: '16px',
        color: '#666',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    const tooltipStyle = {
        visibility: 'hidden',
        opacity: 0,
        backgroundColor: '#0a0a0a',
        color: '#8b5cf6',
        textAlign: 'center',
        borderRadius: '6px',
        padding: '6px 12px',
        position: 'absolute',
        zIndex: 1,
        top: '50%',
        right: '120%',
        transform: 'translateY(-50%)',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        fontFamily: 'monospace',
        transition: 'all 0.2s ease'
    };

    const compactWrapperStyle = {
        padding: '20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        backgroundColor: '#0a0a0a',
        fontFamily: 'monospace'
    };

    const compactTextStyle = {
        margin: 0,
        color: '#666',
        fontSize: '14px'
    };

    const buttonStyle = {
        padding: '12px 20px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#e0e0e0',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontFamily: 'monospace',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    if (!isFullTab) {
        return (
            <div ref={containerRef} style={compactWrapperStyle}>
                <p style={compactTextStyle}>Obsidian Suite Kit - Compact Mode</p>
                <button 
                    style={buttonStyle}
                    onClick={handleEnterFullTab}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.25)';
                        e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
                        e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    }}
                >
                    <dc.Icon icon="maximize-2" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                    Enter Full Tab
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div ref={containerRef} style={containerStyle} className={uniqueWrapperClass}>
                <div 
                    style={exitIconStyle}
                    className="exit-icon"
                    onClick={handleExitFullTab}
                >
                    <dc.Icon icon="minimize-2" style={{ width: '18px', height: '18px' }} />
                    <span className="exit-tooltip" style={tooltipStyle}>
                        Exit Full Tab
                    </span>
                </div>
                <div style={headerStyle}>
                    <dc.Icon icon="loader" style={{ width: '28px', height: '28px', color: '#8b5cf6' }} />
                    <span>Loading Obsidian Module...</span>
                </div>
                <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                        <dc.Icon icon="loader" style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
                    </div>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>Importing from CDN...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div ref={containerRef} style={containerStyle} className={uniqueWrapperClass}>
                <div 
                    style={exitIconStyle}
                    className="exit-icon"
                    onClick={handleExitFullTab}
                >
                    <dc.Icon icon="minimize-2" style={{ width: '18px', height: '18px' }} />
                    <span className="exit-tooltip" style={tooltipStyle}>
                        Exit Full Tab
                    </span>
                </div>
                <div style={headerStyle}>
                    <dc.Icon icon="alert-circle" style={{ width: '28px', height: '28px', color: '#ef4444' }} />
                    <span>Error Loading Obsidian</span>
                </div>
                <div style={{ 
                    ...sectionStyle, 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#ef4444' 
                }}>
                    <strong>Error:</strong> {error}
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={containerStyle} className={uniqueWrapperClass}>
            <div 
                style={exitIconStyle}
                className="exit-icon"
                onClick={handleExitFullTab}
            >
                <dc.Icon icon="minimize-2" style={{ width: '18px', height: '18px' }} />
                <span className="exit-tooltip" style={tooltipStyle}>
                    Exit Full Tab
                </span>
            </div>
            
            <div style={headerStyle}>
                <dc.Icon icon="package" style={{ width: '28px', height: '28px', color: '#8b5cf6' }} />
                <span>Obsidian API Module</span>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ 
                    marginTop: 0, 
                    color: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '18px',
                    fontWeight: '600'
                }}>
                    <dc.Icon icon="check-circle" style={{ width: '20px', height: '20px', color: '#10b981' }} />
                    Obsidian API Detected!
                </h3>
                <p style={{ margin: '12px 0', color: '#666', fontSize: '13px' }}>
                    Accessed through: <code style={{ 
                        padding: '4px 8px', 
                        backgroundColor: '#000000', 
                        borderRadius: '4px',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        color: '#8b5cf6',
                        fontFamily: 'monospace'
                    }}>
                        require('obsidian')
                    </code>
                </p>
                <p style={{ margin: '12px 0', color: '#e0e0e0', fontSize: '14px' }}>
                    <strong style={{ color: '#8b5cf6' }}>Total Properties:</strong> {apiKeys.length}
                </p>
                {appInfo && (
                    <div style={{ marginTop: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e0e0e0' }}>
                            <dc.Icon icon="folder" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                            <strong>Vault:</strong> {appInfo.vault?.name || 'N/A'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e0e0e0' }}>
                            <dc.Icon icon="layout" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                            <strong>Workspace:</strong> {appInfo.workspace || 'N/A'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e0e0e0' }}>
                            <dc.Icon icon="search" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                            <strong>Metadata Cache:</strong> {appInfo.metadataCache || 'N/A'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e0e0e0' }}>
                            <dc.Icon icon="file-text" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                            <strong>File Manager:</strong> {appInfo.fileManager || 'N/A'}
                        </div>
                    </div>
                )}
            </div>

            <div style={sectionStyle}>
                <details style={{ cursor: 'pointer' }}>
                    <summary style={{ 
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#8b5cf6',
                        padding: '12px 0',
                        listStyle: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <dc.Icon icon="chevron-right" style={{ width: '16px', height: '16px', color: '#666' }} />
                        <dc.Icon icon="book-open" style={{ width: '18px', height: '18px', color: '#8b5cf6' }} />
                        <span>Obsidian Module Exports</span>
                        <span style={{ 
                            marginLeft: 'auto',
                            fontSize: '12px',
                            padding: '4px 10px',
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            borderRadius: '6px',
                            color: '#8b5cf6',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            fontWeight: '600'
                        }}>
                            {apiKeys.length} properties
                        </span>
                    </summary>
                    <div style={{ ...gridStyle, marginTop: '20px' }}>
                        {apiKeys.map(key => (
                            <div 
                                key={key} 
                                style={keyStyle}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
                                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                                }}
                            >
                                {key}
                            </div>
                        ))}
                    </div>
                </details>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ 
                    marginTop: 0, 
                    color: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '18px',
                    fontWeight: '600'
                }}>
                    <dc.Icon icon="info" style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
                    API Details
                </h3>
                <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong style={{ color: '#8b5cf6' }}>Source:</strong> require('obsidian')</div>
                    <div><strong style={{ color: '#8b5cf6' }}>Type:</strong> {typeof obsidianModule}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#8b5cf6' }}>Plugin class:</strong> 
                        {obsidianModule.Plugin ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                                <dc.Icon icon="check" style={{ width: '14px', height: '14px' }} /> Available
                            </span>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                                <dc.Icon icon="x" style={{ width: '14px', height: '14px' }} /> Not found
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#8b5cf6' }}>Modal class:</strong> 
                        {obsidianModule.Modal ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                                <dc.Icon icon="check" style={{ width: '14px', height: '14px' }} /> Available
                            </span>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                                <dc.Icon icon="x" style={{ width: '14px', height: '14px' }} /> Not found
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#8b5cf6' }}>Notice class:</strong> 
                        {obsidianModule.Notice ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                                <dc.Icon icon="check" style={{ width: '14px', height: '14px' }} /> Available
                            </span>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                                <dc.Icon icon="x" style={{ width: '14px', height: '14px' }} /> Not found
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ 
                    marginTop: 0, 
                    color: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '12px'
                }}>
                    <dc.Icon icon="sparkles" style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
                    Obsidian UI Components Examples
                </h3>
                <p style={{ margin: '12px 0', color: '#666', fontSize: '13px' }}>
                    Click each button to test genuine Obsidian API components!
                </p>
                    
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '20px' }}>
                    {/* Modal - Base class for creating modal dialogs */}
                    {obsidianModule.Modal && (
                        <button 
                            onClick={() => {
                                const { Modal } = obsidianModule;
                                class ExampleModal extends Modal {
                                    onOpen() {
                                        const { contentEl } = this;
                                        contentEl.createEl('h2', { text: 'Custom Modal' });
                                        contentEl.createEl('p', { text: 'This is a modal created using the Obsidian API!' });
                                        contentEl.createEl('p', { text: 'You can add any content here.', cls: 'mod-muted' });
                                    }
                                    onClose() {
                                        const { contentEl } = this;
                                        contentEl.empty();
                                    }
                                }
                                new ExampleModal(window.app).open();
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.25)';
                                e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
                                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                            }}
                        >
                            <dc.Icon icon="maximize-2" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                            Open Modal
                        </button>
                    )}

                    {/* Notice - Shows temporary notification messages */}
                    {obsidianModule.Notice && (
                        <>
                            <button 
                                onClick={() => {
                                    const { Notice } = obsidianModule;
                                    new Notice('✅ Success! This is a notice message.');
                                }}
                                style={{
                                    padding: '14px 18px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                    color: '#e0e0e0',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.25)';
                                    e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                                    e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                                }}
                            >
                                <dc.Icon icon="check-circle" style={{ width: '16px', height: '16px', color: '#10b981' }} />
                                Show Notice
                            </button>

                            <button 
                                onClick={() => {
                                    const { Notice } = obsidianModule;
                                    new Notice('⚠️ Warning message!', 3000);
                                }}
                                style={{
                                    padding: '14px 18px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                    color: '#e0e0e0',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'rgba(245, 158, 11, 0.25)';
                                    e.target.style.borderColor = 'rgba(245, 158, 11, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                                    e.target.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                                }}
                            >
                                <dc.Icon icon="alert-triangle" style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                                Warning Notice
                            </button>

                            <button 
                                onClick={() => {
                                    const { Notice } = obsidianModule;
                                    new Notice('❌ Error notification!', 3000);
                                }}
                                style={{
                                    padding: '14px 18px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    color: '#e0e0e0',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                                    e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                                    e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                }}
                            >
                                <dc.Icon icon="x-circle" style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                                Error Notice
                            </button>
                        </>
                    )}

                    {/* SuggestModal - Modal with suggestions based on user input */}
                    {obsidianModule.SuggestModal && (
                        <button 
                            onClick={() => {
                                const { SuggestModal } = obsidianModule;
                                class FruitSuggest extends SuggestModal {
                                    constructor(app) {
                                        super(app);
                                        this.fruits = ['🍎 Apple', '🍌 Banana', '🍊 Orange', '🍇 Grapes', '🍓 Strawberry', '🥝 Kiwi'];
                                    }
                                    getSuggestions(query) {
                                        return this.fruits.filter(fruit => 
                                            fruit.toLowerCase().includes(query.toLowerCase())
                                        );
                                    }
                                    renderSuggestion(fruit, el) {
                                        el.createEl('div', { text: fruit });
                                    }
                                    onChooseSuggestion(fruit, evt) {
                                        new obsidianModule.Notice(`You selected: ${fruit}`);
                                    }
                                }
                                new FruitSuggest(window.app).open();
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(192, 132, 252, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(192, 132, 252, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(192, 132, 252, 0.25)';
                                e.target.style.borderColor = 'rgba(192, 132, 252, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(192, 132, 252, 0.15)';
                                e.target.style.borderColor = 'rgba(192, 132, 252, 0.3)';
                            }}
                        >
                            <dc.Icon icon="search" style={{ width: '16px', height: '16px', color: '#c084fc' }} />
                            Suggest Modal
                        </button>
                    )}

                    {/* FuzzySuggestModal - Modal with fuzzy search filtering */}
                    {obsidianModule.FuzzySuggestModal && (
                        <button 
                            onClick={() => {
                                const { FuzzySuggestModal } = obsidianModule;
                                class EmojiPicker extends FuzzySuggestModal {
                                    constructor(app) {
                                        super(app);
                                        this.emojis = ['😀 Grinning', '😂 Laughing', '🤔 Thinking', '👍 Thumbs Up', 
                                                      '❤️ Heart', '🎉 Party', '🚀 Rocket', '⭐ Star', '🔥 Fire'];
                                    }
                                    getItems() {
                                        return this.emojis;
                                    }
                                    getItemText(item) {
                                        return item;
                                    }
                                    onChooseItem(item, evt) {
                                        new obsidianModule.Notice(`Selected: ${item}`);
                                    }
                                }
                                new EmojiPicker(window.app).open();
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(236, 72, 153, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(236, 72, 153, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(236, 72, 153, 0.25)';
                                e.target.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(236, 72, 153, 0.15)';
                                e.target.style.borderColor = 'rgba(236, 72, 153, 0.3)';
                            }}
                        >
                            <dc.Icon icon="target" style={{ width: '16px', height: '16px', color: '#ec4899' }} />
                            Fuzzy Suggest
                        </button>
                    )}

                    {/* Setting - Component for building settings UI */}
                    {obsidianModule.Setting && (
                        <button 
                            onClick={() => {
                                const { Modal, Setting } = obsidianModule;
                                class SettingsModal extends Modal {
                                    onOpen() {
                                        const { contentEl } = this;
                                        contentEl.createEl('h2', { text: '⚙️ Settings Example' });
                                        
                                        new Setting(contentEl)
                                            .setName('Toggle Setting')
                                            .setDesc('This is a toggle switch')
                                            .addToggle(toggle => toggle
                                                .setValue(true)
                                                .onChange(value => {
                                                    new obsidianModule.Notice(`Toggle: ${value}`);
                                                }));
                                        
                                        new Setting(contentEl)
                                            .setName('Text Input')
                                            .setDesc('Enter some text')
                                            .addText(text => text
                                                .setPlaceholder('Type something...')
                                                .onChange(value => {
                                                    console.log('Text:', value);
                                                }));
                                        
                                        new Setting(contentEl)
                                            .setName('Dropdown')
                                            .setDesc('Select an option')
                                            .addDropdown(dropdown => dropdown
                                                .addOption('option1', 'Option 1')
                                                .addOption('option2', 'Option 2')
                                                .addOption('option3', 'Option 3')
                                                .onChange(value => {
                                                    new obsidianModule.Notice(`Selected: ${value}`);
                                                }));
                                    }
                                    onClose() {
                                        const { contentEl } = this;
                                        contentEl.empty();
                                    }
                                }
                                new SettingsModal(window.app).open();
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.25)';
                                e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
                                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                            }}
                        >
                            <dc.Icon icon="settings" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                            Settings Demo
                        </button>
                    )}

                    {/* Menu - Context menu component */}
                    {obsidianModule.Menu && (
                        <button 
                            onClick={(e) => {
                                const { Menu } = obsidianModule;
                                const menu = new Menu();
                                
                                menu.addItem((item) =>
                                    item
                                        .setTitle('📄 Create Note')
                                        .setIcon('document')
                                        .onClick(() => {
                                            new obsidianModule.Notice('Create Note clicked!');
                                        })
                                );
                                
                                menu.addItem((item) =>
                                    item
                                        .setTitle('📁 Open Folder')
                                        .setIcon('folder')
                                        .onClick(() => {
                                            new obsidianModule.Notice('Open Folder clicked!');
                                        })
                                );
                                
                                menu.addSeparator();
                                
                                menu.addItem((item) =>
                                    item
                                        .setTitle('⚙️ Settings')
                                        .setIcon('settings')
                                        .onClick(() => {
                                            new obsidianModule.Notice('Settings clicked!');
                                        })
                                );
                                
                                menu.showAtMouseEvent(e.nativeEvent);
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(167, 139, 250, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(167, 139, 250, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(167, 139, 250, 0.25)';
                                e.target.style.borderColor = 'rgba(167, 139, 250, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(167, 139, 250, 0.15)';
                                e.target.style.borderColor = 'rgba(167, 139, 250, 0.3)';
                            }}
                        >
                            <dc.Icon icon="menu" style={{ width: '16px', height: '16px', color: '#a78bfa' }} />
                            Context Menu
                        </button>
                    )}

                    {/* MarkdownRenderer - Renders markdown with Obsidian features */}
                    {obsidianModule.MarkdownRenderer && obsidianModule.Component && (
                        <button 
                            onClick={() => {
                                const { Modal, MarkdownRenderer, Component } = obsidianModule;
                                class MarkdownModal extends Modal {
                                    async onOpen() {
                                        const { contentEl } = this;
                                        contentEl.createEl('h2', { text: '📝 Markdown Renderer' });
                                        
                                        const mdContent = `
# Hello Markdown!

This is **bold** and *italic* text.

- Item 1
- Item 2
- Item 3

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

> A blockquote for inspiration
                                        `;
                                        
                                        const mdContainer = contentEl.createDiv();
                                        
                                        // Create a Component instance to pass to renderMarkdown
                                        // This prevents memory leaks from global event handlers
                                        const component = new Component();
                                        
                                        // Register component cleanup when modal closes
                                        this.component = component;
                                        
                                        await MarkdownRenderer.renderMarkdown(mdContent, mdContainer, '', component);
                                    }
                                    onClose() {
                                        const { contentEl } = this;
                                        contentEl.empty();
                                        // Clean up the component when modal closes
                                        if (this.component) {
                                            this.component.unload();
                                        }
                                    }
                                }
                                new MarkdownModal(window.app).open();
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(217, 70, 239, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(217, 70, 239, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(217, 70, 239, 0.25)';
                                e.target.style.borderColor = 'rgba(217, 70, 239, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(217, 70, 239, 0.15)';
                                e.target.style.borderColor = 'rgba(217, 70, 239, 0.3)';
                            }}
                        >
                            <dc.Icon icon="file-text" style={{ width: '16px', height: '16px', color: '#d946ef' }} />
                            Markdown Render
                        </button>
                    )}

                    {/* TextComponent - Simple text display component */}
                    {obsidianModule.TextComponent && (
                        <button 
                            onClick={() => {
                                const { Modal, TextComponent } = obsidianModule;
                                class TextModal extends Modal {
                                    onOpen() {
                                        const { contentEl } = this;
                                        contentEl.createEl('h2', { text: 'TextComponent Example' });
                                        
                                        const container = contentEl.createDiv();
                                        const textComp = new TextComponent(container);
                                        textComp
                                            .setPlaceholder('Type something here...')
                                            .setValue('Hello from TextComponent!')
                                            .onChange((value) => {
                                                console.log('Text changed:', value);
                                            });
                                    }
                                    onClose() {
                                        const { contentEl } = this;
                                        contentEl.empty();
                                    }
                                }
                                new TextModal(window.app).open();
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.25)';
                                e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
                                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                            }}
                        >
                            <dc.Icon icon="type" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                            TextComponent
                        </button>
                    )}

                    {/* ButtonComponent - Clickable button component */}
                    {obsidianModule.ButtonComponent && (
                        <button 
                            onClick={() => {
                                const { Modal, ButtonComponent } = obsidianModule;
                                class ButtonModal extends Modal {
                                    onOpen() {
                                        const { contentEl } = this;
                                        contentEl.createEl('h2', { text: 'ButtonComponent Example' });
                                        
                                        const container = contentEl.createDiv({ cls: 'button-demo' });
                                        container.style.display = 'flex';
                                        container.style.gap = '10px';
                                        container.style.marginTop = '20px';
                                        
                                        new ButtonComponent(container)
                                            .setButtonText('Primary Button')
                                            .setCta()
                                            .onClick(() => {
                                                new obsidianModule.Notice('Primary button clicked!');
                                            });
                                        
                                        new ButtonComponent(container)
                                            .setButtonText('Warning Button')
                                            .setWarning()
                                            .onClick(() => {
                                                new obsidianModule.Notice('Warning button clicked!');
                                            });
                                    }
                                    onClose() {
                                        const { contentEl } = this;
                                        contentEl.empty();
                                    }
                                }
                                new ButtonModal(window.app).open();
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(236, 72, 153, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(236, 72, 153, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(236, 72, 153, 0.25)';
                                e.target.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(236, 72, 153, 0.15)';
                                e.target.style.borderColor = 'rgba(236, 72, 153, 0.3)';
                            }}
                        >
                            <dc.Icon icon="square" style={{ width: '16px', height: '16px', color: '#ec4899' }} />
                            ButtonComponent
                        </button>
                    )}

                    {/* ToggleComponent - Toggle switch component */}
                    {obsidianModule.ToggleComponent && (
                        <button 
                            onClick={() => {
                                const { Modal, ToggleComponent } = obsidianModule;
                                class ToggleModal extends Modal {
                                    onOpen() {
                                        const { contentEl } = this;
                                        contentEl.createEl('h2', { text: 'ToggleComponent Example' });
                                        
                                        const container = contentEl.createDiv();
                                        container.style.marginTop = '20px';
                                        
                                        const label = container.createEl('div', { text: 'Enable Feature: ' });
                                        label.style.marginBottom = '10px';
                                        
                                        const toggleContainer = container.createDiv();
                                        new ToggleComponent(toggleContainer)
                                            .setValue(true)
                                            .onChange((value) => {
                                                new obsidianModule.Notice(`Toggle is now: ${value ? 'ON' : 'OFF'}`);
                                            });
                                    }
                                    onClose() {
                                        const { contentEl } = this;
                                        contentEl.empty();
                                    }
                                }
                                new ToggleModal(window.app).open();
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(192, 132, 252, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(192, 132, 252, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(192, 132, 252, 0.25)';
                                e.target.style.borderColor = 'rgba(192, 132, 252, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(192, 132, 252, 0.15)';
                                e.target.style.borderColor = 'rgba(192, 132, 252, 0.3)';
                            }}
                        >
                            <dc.Icon icon="toggle-right" style={{ width: '16px', height: '16px', color: '#c084fc' }} />
                            ToggleComponent
                        </button>
                    )}

                    {/* DropdownComponent - Dropdown select component */}
                    {obsidianModule.DropdownComponent && (
                        <button 
                            onClick={() => {
                                const { Modal, DropdownComponent } = obsidianModule;
                                class DropdownModal extends Modal {
                                    onOpen() {
                                        const { contentEl } = this;
                                        contentEl.createEl('h2', { text: 'DropdownComponent Example' });
                                        
                                        const container = contentEl.createDiv();
                                        container.style.marginTop = '20px';
                                        
                                        new DropdownComponent(container)
                                            .addOption('apple', '🍎 Apple')
                                            .addOption('banana', '🍌 Banana')
                                            .addOption('orange', '🍊 Orange')
                                            .addOption('grape', '🍇 Grape')
                                            .setValue('apple')
                                            .onChange((value) => {
                                                new obsidianModule.Notice(`Selected: ${value}`);
                                            });
                                    }
                                    onClose() {
                                        const { contentEl } = this;
                                        contentEl.empty();
                                    }
                                }
                                new DropdownModal(window.app).open();
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(167, 139, 250, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(167, 139, 250, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(167, 139, 250, 0.25)';
                                e.target.style.borderColor = 'rgba(167, 139, 250, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(167, 139, 250, 0.15)';
                                e.target.style.borderColor = 'rgba(167, 139, 250, 0.3)';
                            }}
                        >
                            <dc.Icon icon="chevron-down" style={{ width: '16px', height: '16px', color: '#a78bfa' }} />
                            DropdownComponent
                        </button>
                    )}

                    {/* SliderComponent - Slider input component */}
                    {obsidianModule.SliderComponent && (
                        <button 
                            onClick={() => {
                                const { Modal, SliderComponent } = obsidianModule;
                                class SliderModal extends Modal {
                                    onOpen() {
                                        const { contentEl } = this;
                                        contentEl.createEl('h2', { text: 'SliderComponent Example' });
                                        
                                        const container = contentEl.createDiv();
                                        container.style.marginTop = '20px';
                                        
                                        const label = container.createEl('div', { text: 'Volume: 50' });
                                        label.style.marginBottom = '10px';
                                        
                                        new SliderComponent(container)
                                            .setLimits(0, 100, 1)
                                            .setValue(50)
                                            .setDynamicTooltip()
                                            .onChange((value) => {
                                                label.setText(`Volume: ${value}`);
                                            });
                                    }
                                    onClose() {
                                        const { contentEl } = this;
                                        contentEl.empty();
                                    }
                                }
                                new SliderModal(window.app).open();
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(217, 70, 239, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(217, 70, 239, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(217, 70, 239, 0.25)';
                                e.target.style.borderColor = 'rgba(217, 70, 239, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(217, 70, 239, 0.15)';
                                e.target.style.borderColor = 'rgba(217, 70, 239, 0.3)';
                            }}
                        >
                            <dc.Icon icon="sliders" style={{ width: '16px', height: '16px', color: '#d946ef' }} />
                            SliderComponent
                        </button>
                    )}

                    {/* TextAreaComponent - Multi-line text input */}
                    {obsidianModule.TextAreaComponent && (
                        <button 
                            onClick={() => {
                                const { Modal, TextAreaComponent } = obsidianModule;
                                class TextAreaModal extends Modal {
                                    onOpen() {
                                        const { contentEl } = this;
                                        contentEl.createEl('h2', { text: 'TextAreaComponent Example' });
                                        
                                        const container = contentEl.createDiv();
                                        container.style.marginTop = '20px';
                                        
                                        new TextAreaComponent(container)
                                            .setPlaceholder('Enter multiple lines of text...')
                                            .setValue('Line 1\nLine 2\nLine 3')
                                            .onChange((value) => {
                                                console.log('TextArea changed:', value);
                                            });
                                    }
                                    onClose() {
                                        const { contentEl } = this;
                                        contentEl.empty();
                                    }
                                }
                                new TextAreaModal(window.app).open();
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.25)';
                                e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
                                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                            }}
                        >
                            <dc.Icon icon="align-left" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                            TextAreaComponent
                        </button>
                    )}

                    {/* Workspace - Access workspace leaves and views */}
                    {window.app?.workspace && (
                        <button 
                            onClick={() => {
                                const { Notice } = obsidianModule;
                                const workspace = window.app.workspace;
                                const activeView = workspace.getActiveViewOfType(obsidianModule.MarkdownView);
                                
                                if (activeView) {
                                    const editor = activeView.editor;
                                    const cursor = editor.getCursor();
                                    new Notice(`Cursor at line ${cursor.line + 1}, column ${cursor.ch + 1}`);
                                } else {
                                    new Notice('No active markdown view found!');
                                }
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.25)';
                                e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                                e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                            }}
                        >
                            <dc.Icon icon="layout" style={{ width: '16px', height: '16px', color: '#10b981' }} />
                            Workspace API
                        </button>
                    )}

                    {/* Vault - File operations */}
                    {window.app?.vault && (
                        <button 
                            onClick={async () => {
                                const { Notice } = obsidianModule;
                                const vault = window.app.vault;
                                const files = vault.getMarkdownFiles();
                                new Notice(`Found ${files.length} markdown files in vault`);
                            }}
                            style={{
                                padding: '14px 18px',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                color: '#e0e0e0',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(245, 158, 11, 0.25)';
                                e.target.style.borderColor = 'rgba(245, 158, 11, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                                e.target.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                            }}
                        >
                            <dc.Icon icon="folder" style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                            Vault API
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

return { View : Component };
```
