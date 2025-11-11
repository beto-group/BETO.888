---
tags: datacore-component
---



# ViewComponent

```jsx
// -------------------------
// Simple Component Loader (ViewComponent)
// -------------------------
const { useState, useEffect, useRef, useCallback, useMemo } = dc;
const { Component: PreactComponent } = dc.preact;

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- DOM TRAVERSAL UTILITIES ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function findNearestAncestorWithClass(element, className) {
//   console.log("[SANDBOX] findNearestAncestorWithClass called:", 
//   {
//     startElement: element && element.className,
//     searchingFor: className
//   });
  
  if (!element) return null;
  let current = element.parentNode;
  let depth = 0;
  
  while (current) {
    depth++;
    // console.log("[SANDBOX] Checking depth " + depth + ":", {
    //   nodeName: current.nodeName,
    //   className: current.className,
    //   isSandbox: current.getAttribute && current.getAttribute('data-sandbox'),
    //   matches: current.classList && current.classList.contains(className)
    // });
    
    if (current.classList && current.classList.contains(className)) {
    //   console.log("[SANDBOX] Found '" + className + "' at depth " + depth + ":", {
    //     element: current.className,
    //     isSandbox: current.getAttribute('data-sandbox'),
    //     position: current.style && current.style.position,
    //     zIndex: current.style && current.style.zIndex
    //   });
      return current;
    }
    current = current.parentNode;
  }
  
  console.log("[SANDBOX] No ancestor found with class:", className);
  return null;
}

function findDirectChildByClass(parent, className) {
//   console.log("[SANDBOX] findDirectChildByClass called:", {
//     parent: parent && parent.className,
//     searchingFor: className
//   });
  
  if (!parent) return null;
  for (const child of parent.children) {
    if (child.classList && child.classList.contains(className)) {
    //   console.log("[SANDBOX] Found child:", {
    //     className: child.className,
    //     position: child.style && child.style.position
    //   });
      return child;
    }
  }
  
//   console.log("[SANDBOX] No child found with class:", className);
  return null;
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- ERROR HANDLING ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function ErrorDisplay({ errorMessage }) {
    const errorStyles = {
        wrapper: { padding: '20px' },
        details: {
            fontFamily: 'sans-serif',
            border: '1px solid #c53030',
            borderRadius: '8px',
            backgroundColor: '#2d1c1c',
            color: '#fed7d7',
            padding: '16px',
        },
        summary: {
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#f56565',
            listStyle: 'none',
            display: 'flex',
            alignItems: 'center',
        },
        summaryText: { marginLeft: '8px' },
        content: {
            marginTop: '12px',
            borderTop: '1px solid #742a2a',
            paddingTop: '12px',
            color: '#e0e0e0',
            fontSize: '14px',
        },
        pre: {
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            color: '#ccc',
            fontSize: '13px',
            marginTop: '12px',
            padding: '10px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            fontFamily: 'monospace',
        }
    };

    return (
        <div style={errorStyles.wrapper}>
            <details style={errorStyles.details} open>
                <summary style={errorStyles.summary}>
                    <span>⚠️</span>
                    <span style={errorStyles.summaryText}>Component Error</span>
                </summary>
                <div style={errorStyles.content}>
                    <p>Failed to render component.</p>
                    <pre style={errorStyles.pre}>{errorMessage}</pre>
                </div>
            </details>
        </div>
    );
}

class ErrorBoundary extends PreactComponent {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("ErrorBoundary caught an error:", error, info);
    }
    
    componentDidUpdate(prevProps) {
        if (prevProps.renderKey !== this.props.renderKey) {
            this.setState({ hasError: false, error: null });
        }
    }

    render() {
        if (this.state.hasError) {
            return <ErrorDisplay errorMessage={this.state.error?.toString()} />;
        }
        return this.props.children;
    }
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- COMPONENT LOADER ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function DynamicComponentLoader(props) {
    const componentName = props.componentName;
    const renderKey = props.renderKey;
    const componentProps = props.componentProps || {};
    const [LoadedComponent, setLoadedComponent] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const sandboxRef = useRef(null);
    
    // Debug: Log received props
    // console.log('[DynamicComponentLoader] Received props:', {
    //     componentName,
    //     renderKey,
    //     componentProps,
    //     propsKeys: Object.keys(componentProps),
    //     propsValues: componentProps
    // });

    // DOM Mutation Observer to track and PREVENT full-tab escapes
    useEffect(() => {
        if (!LoadedComponent) return;
        
        const sandboxBoundary = document.querySelector('.component-sandbox-isolator');
        if (!sandboxBoundary) return;
        
        // console.log("[SANDBOX] Setting up escape prevention on:", sandboxBoundary);
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('component-render-root')) {
                            // console.log("[ESCAPE DETECTED] Component tried to escape! Putting it back...");
                            
                            const escapedElement = document.querySelector('.component-render-root');
                            if (escapedElement && !sandboxBoundary.contains(escapedElement)) {
                                // console.log("[SANDBOX] Component escaped to:", escapedElement.parentElement);
                                
                                const viewContent = sandboxBoundary.querySelector('.view-content');
                                if (viewContent) {
                                    // console.log("[SANDBOX] Moving component back to sandbox");
                                    viewContent.appendChild(escapedElement);
                                    
                                    if (escapedElement.style.position === 'absolute') {
                                        escapedElement.style.position = 'relative';
                                    }
                                }
                            }
                        }
                    });
                    
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            // console.log("[SANDBOX] Node added:", {
                            //     nodeName: node.nodeName,
                            //     className: node.className,
                            //     style: node.style && node.style.cssText,
                            //     position: node.style && node.style.position,
                            //     zIndex: node.style && node.style.zIndex,
                            //     parentElement: node.parentElement && node.parentElement.className,
                            //     isOutsideSandbox: !sandboxBoundary.contains(node)
                            // });
                            
                            if (!sandboxBoundary.contains(node) && node.style && node.style.position === 'absolute') {
                                console.log("[BREACH DETECTED] Absolute positioned element added outside sandbox!");
                            }
                        }
                    });
                }
                
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target;
                    if (target.style && target.style.position === 'absolute' && target.style.zIndex > 9000) {
                        // console.log("[SANDBOX] High z-index absolute positioning detected:", {
                        //     element: target.className,
                        //     position: target.style.position,
                        //     zIndex: target.style.zIndex,
                        //     top: target.style.top,
                        //     left: target.style.left,
                        //     isInSandbox: sandboxBoundary.contains(target)
                        // });
                    }
                }
            });
        });
        
        // Observe both the sandbox AND the document body to catch escapes
        observer.observe(sandboxBoundary, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
        
        console.log("[SANDBOX] Observer attached to sandbox AND document.body");
        
        return () => observer.disconnect();
    }, [LoadedComponent]);

    useEffect(() => {
        let isCancelled = false;
        
        const loadComponent = async () => {
            if (!componentName) {
                setLoadedComponent(null); 
                setLoadError(null);
                setIsLoading(false);
                return;
            }
            
            setLoadedComponent(null); 
            setLoadError(null);
            setIsLoading(true);

            try {
                const allFiles = app.vault.getMarkdownFiles();
                const matchingFiles = allFiles.filter(file => 
                    file.name.toLowerCase().includes(componentName.toLowerCase()) && 
                    file.name.includes('.component') &&
                    file.name.endsWith('.md')
                );
                
                if (matchingFiles.length === 0) {
                    throw new Error(`No component found matching "${componentName}" in vault`);
                }
                
                const file = matchingFiles[0];
                const filePath = file.path;
                
                const fileContent = await app.vault.read(file);
                const headerMatch = fileContent.match(/^#\s+(\w+)/m);
                const header = headerMatch?.[1] || "ViewComponent";
                
                const resolvedPath = dc.resolvePath(filePath);
                const dynamicModule = await dc.require(dc.headerLink(resolvedPath, header));
                if (isCancelled) return;

                let Component = null;
                if (typeof dynamicModule === 'function') {
                    Component = dynamicModule;
                } else if (dynamicModule && typeof dynamicModule === 'object') {
                    const keys = Object.keys(dynamicModule);
                    if (keys.length > 0) Component = dynamicModule[keys[0]];
                }

                if (typeof Component !== 'function') {
                    throw new Error("Module did not export a renderable component.");
                }

                if (!isCancelled) {
                    setLoadedComponent(() => Component);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("[❌ Component Error]", err);
                if (!isCancelled) {
                    setLoadError(err.toString());
                    setIsLoading(false);
                }
            }
        };

        loadComponent();
        return () => { isCancelled = true; };
    }, [componentName, renderKey]);

    if (isLoading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                <div>Loading component...</div>
            </div>
        );
    }
    
    if (loadError) {
        return <ErrorDisplay errorMessage={loadError} />;
    }
    
    if (LoadedComponent) {
        // console.log('[DynamicComponentLoader] Rendering component:', {
        //     componentName,
        //     renderKey,
        //     componentProps,
        //     propsCount: Object.keys(componentProps).length,
        //     propKeys: Object.keys(componentProps),
        //     propValues: JSON.stringify(componentProps, null, 2)
        // });
        
        return (
            <div ref={sandboxRef} className="component-render-root">
                <ErrorBoundary renderKey={renderKey}>
                    <LoadedComponent 
                        key={`component-${renderKey}`} 
                        {...componentProps} 
                    />
                </ErrorBoundary>
            </div>
        );
    }
    
    return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
            <div>Select a component to load</div>
        </div>
    );
}

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- MAIN COMPONENT ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function SimpleComponentLoader() {
    const [componentName, setComponentName] = useState("");
    const [loadedComponentName, setLoadedComponentName] = useState("");
    const [componentProps, setComponentProps] = useState({});
    const [renderKey, setRenderKey] = useState(0);
    const [exampleComponents, setExampleComponents] = useState([]);
    const [isFullTab, setIsFullTab] = useState(true);
    
    // Props editor state
    const [propsEditorOpen, setPropsEditorOpen] = useState(false);
    const [propsList, setPropsList] = useState([]); // Array of {key, value, isEditing, displayValue}
    const [newPropInput, setNewPropInput] = useState('');
    
    // Debug panel state
    const [showDebug, setShowDebug] = useState(false);
    
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;
    
    // === PROPS MANAGEMENT FUNCTIONS ===
    const parsePropValue = (valueStr) => {
        try {
            // Handle JSX curly brace syntax: {value} -> value
            let cleanValue = valueStr.trim();
            if (cleanValue.startsWith('{') && cleanValue.endsWith('}')) {
                cleanValue = cleanValue.slice(1, -1).trim();
            }
            
            // Parse as JavaScript expression
            const result = eval('(' + cleanValue + ')');
            return result;
        } catch (e) {
            // If parsing fails, return as string
            return valueStr;
        }
    };
    
    const addNewProp = () => {
        const trimmed = newPropInput.trim();
        if (!trimmed) return;
        
        // Parse format: key={value} or key="value"
        const match = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
        if (!match) {
            new Notice('Invalid format. Use: propName={value} or propName="value"', 3000);
            return;
        }
        
        const [, key, valueStr] = match;
        const value = parsePropValue(valueStr);
        
        // console.log('[SimpleComponentLoader] Parsed new prop:', { key, valueStr, parsedValue: value, type: typeof value });
        
        // Check if prop already exists
        if (propsList.some(p => p.key === key)) {
            new Notice(`Prop "${key}" already exists. Double-click to edit it.`, 3000);
            return;
        }
        
        const newPropsList = [...propsList, { key, value, isEditing: false, displayValue: valueStr }];
        setPropsList(newPropsList);
        setNewPropInput('');
        
        // Update component props
        const newProps = { ...componentProps, [key]: value };
        // console.log('[SimpleComponentLoader] Setting new props object:', newProps);
        setComponentProps(newProps);
        setRenderKey(prev => {
            const nextKey = prev + 1;
            // console.log('[SimpleComponentLoader] Incrementing renderKey from', prev, 'to', nextKey);
            return nextKey;
        });
    };
    
    const removeProp = (key) => {
        const newPropsList = propsList.filter(p => p.key !== key);
        setPropsList(newPropsList);
        
        const newProps = { ...componentProps };
        delete newProps[key];
        setComponentProps(newProps);
        setRenderKey(prev => prev + 1);
    };
    
    const startEditProp = (key) => {
        setPropsList(propsList.map(p => 
            p.key === key ? { ...p, isEditing: true } : p
        ));
    };
    
    const updateProp = (key, newValueStr) => {
        const newValue = parsePropValue(newValueStr);
        const newPropsList = propsList.map(p => 
            p.key === key ? { ...p, value: newValue, displayValue: newValueStr, isEditing: false } : p
        );
        setPropsList(newPropsList);
        
        const newProps = { ...componentProps, [key]: newValue };
        setComponentProps(newProps);
        setRenderKey(prev => prev + 1);
    };
    
    const cancelEditProp = (key) => {
        setPropsList(propsList.map(p => 
            p.key === key ? { ...p, isEditing: false } : p
        ));
    };
    
    // Get all component files from _resources/datacore folders
    useEffect(() => {
        const allFiles = app.vault.getMarkdownFiles();
        const componentFiles = allFiles.filter(file => 
            file.path.includes('_resources/datacore') &&
            file.path.endsWith('.component.md')
        );
        
        // Parse file info - extract component name
        const examples = componentFiles.map(file => {
            const fileName = file.name.replace('.md', '');
            // Extract parts: D.q.name.component
            const parts = fileName.split('.');
            const componentName = parts[2] || parts[1]; // Get the name part
            
            return {
                name: componentName.charAt(0).toUpperCase() + componentName.slice(1),
                queryName: componentName // lowercase for query
            };
        });
        
        setExampleComponents(examples.sort((a, b) => a.name.localeCompare(b.name)));
    }, []);
    
    // Full-tab mode DOM manipulation
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullTab) return;
        
        const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
        if (!targetPaneContent) return;
        
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
            backgroundColor: "var(--background-primary)",
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

    const handleLoadComponent = (e) => {
        e.preventDefault();
        if (!componentName.trim()) return;
        
        setLoadedComponentName(componentName.trim());
        setRenderKey(prev => prev + 1);
    };
    
    const handleQuickLoad = (example) => {
        setComponentName(example.queryName);
        setLoadedComponentName(example.queryName);
        setRenderKey(prev => prev + 1);
    };
    
    const handleClearComponent = () => {
        setLoadedComponentName("");
        setRenderKey(prev => prev + 1);
    };
    
    const handleExitFullTab = () => setIsFullTab(false);
    const handleEnterFullTab = () => setIsFullTab(true);

    // Black on black on black theme with subtle purple accents
    const mainWrapperStyle = {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: '#0a0a0a',
        overflow: 'hidden'
    };

    const controlPanelStyle = {
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(10, 10, 10, 1) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(60, 60, 60, 0.3)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
        flexShrink: 0
    };

    const displayAreaStyle = {
        flex: 1,
        padding: '24px',
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: '#000000'
    };

    const spawnBoxStyle = {
        width: '100%',
        height: '100%',
        background: 'rgba(15, 15, 15, 0.6)',
        border: '2px dashed rgba(80, 80, 80, 0.3)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: 'rgba(160, 160, 160, 0.5)',
        fontSize: '18px',
        fontWeight: '600',
        backdropFilter: 'blur(10px)',
        boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.2)',
        overflow: 'auto'
    };

    const formStyle = {
        maxWidth: '800px',
        margin: '0 auto'
    };

    const inputStyle = {
        flex: 1,
        padding: '12px 16px',
        background: 'rgba(20, 20, 20, 0.8)',
        border: '1px solid rgba(80, 80, 80, 0.3)',
        borderRadius: '10px',
        color: '#e0e0e0',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'all 0.3s ease',
        outline: 'none',
        boxSizing: 'border-box'
    };

    const buttonStyle = {
        padding: '12px 32px',
        background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.8) 0%, rgba(30, 30, 30, 0.9) 100%)',
        border: '1px solid rgba(160, 118, 249, 0.15)',
        borderRadius: '10px',
        color: '#e0e0e0',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        flexShrink: 0
    };

    const titleStyle = {
        fontSize: '22px',
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: '20px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '12px',
        fontWeight: '600',
        color: 'rgba(200, 200, 200, 0.7)',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    };

    const formRowStyle = {
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        alignItems: 'center'
    };

    const fieldStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    };
    
    const exampleButtonStyle = {
        padding: '10px 16px',
        background: 'rgba(40, 40, 40, 0.6)',
        border: '1px solid rgba(80, 80, 80, 0.4)',
        borderRadius: '8px',
        color: '#c0c0c0',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    };

    const compactWrapper = {
        padding: "20px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        border: "1px solid rgba(80, 80, 80, 0.3)",
        borderRadius: "12px",
        backgroundColor: "#0a0a0a",
    };

    const compactText = { 
        margin: 0, 
        color: "rgba(180, 180, 180, 0.7)", 
        fontSize: "14px" 
    };

    if (!isFullTab) {
        return (
            <div ref={containerRef} style={compactWrapper}>
                <dc.Icon icon="maximize-2" style={{ fontSize: '32px', color: 'rgba(140, 140, 140, 0.5)' }} />
                <p style={compactText}>Component Loader is in compact mode.</p>
                <button 
                    style={buttonStyle} 
                    onClick={handleEnterFullTab}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, rgba(60, 60, 60, 0.9) 0%, rgba(50, 50, 50, 1) 100%)';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 24px rgba(160, 118, 249, 0.15)';
                        e.target.style.borderColor = 'rgba(160, 118, 249, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, rgba(40, 40, 40, 0.8) 0%, rgba(30, 30, 30, 0.9) 100%)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
                        e.target.style.borderColor = 'rgba(160, 118, 249, 0.15)';
                    }}
                >
                    <dc.Icon icon="maximize" style={{ fontSize: '16px' }} />
                    <span>Enter Full Tab</span>
                </button>
            </div>
        );
    }
    
    return (
        <div ref={containerRef} style={mainWrapperStyle}>
            {/* Control Panel */}
            <div style={controlPanelStyle}>
                <div style={formStyle}>
                    <h2 style={titleStyle}>
                        <dc.Icon icon="box" style={{ fontSize: '24px' }} />
                        <span>Component Loader</span>
                    </h2>
                    
                    {/* Quick Load Examples */}
                    {exampleComponents.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>
                                <dc.Icon icon="zap" style={{ fontSize: '14px' }} />
                                <span>Quick Load Examples</span>
                            </label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {exampleComponents.map((example, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleQuickLoad(example)}
                                        style={exampleButtonStyle}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'rgba(60, 60, 60, 0.8)';
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(160, 118, 249, 0.1)';
                                            e.target.style.borderColor = 'rgba(160, 118, 249, 0.25)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'rgba(40, 40, 40, 0.6)';
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                            e.target.style.borderColor = 'rgba(80, 80, 80, 0.4)';
                                        }}
                                    >
                                        {example.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleLoadComponent}>
                        <div style={formRowStyle}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>
                                    <dc.Icon icon="package" style={{ fontSize: '12px' }} />
                                    <span>Component Name</span>
                                </label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="e.g., lottieexperiment, kanban, d3jstest"
                                        value={componentName}
                                        onChange={(e) => setComponentName(e.target.value)}
                                        style={inputStyle}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'rgba(160, 118, 249, 0.3)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(160, 118, 249, 0.05)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(80, 80, 80, 0.3)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                    <button 
                                        type="submit" 
                                        style={buttonStyle}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'linear-gradient(135deg, rgba(60, 60, 60, 0.9) 0%, rgba(50, 50, 50, 1) 100%)';
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 6px 24px rgba(160, 118, 249, 0.15)';
                                            e.target.style.borderColor = 'rgba(160, 118, 249, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'linear-gradient(135deg, rgba(40, 40, 40, 0.8) 0%, rgba(30, 30, 30, 0.9) 100%)';
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
                                            e.target.style.borderColor = 'rgba(160, 118, 249, 0.15)';
                                        }}
                                    >
                                        <dc.Icon icon="play" style={{ fontSize: '16px' }} />
                                        <span>Load Component</span>
                                    </button>
                                </div>
                                <div style={{ 
                                    fontSize: '11px', 
                                    color: 'rgba(140, 140, 140, 0.6)',
                                    marginTop: '6px',
                                    fontStyle: 'italic',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <dc.Icon icon="folder-search" style={{ fontSize: '12px' }} />
                                    <span>Searches all vault for .component.md files</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Props Editor - Collapsible Dropdown */}
                        <div style={{ marginTop: '16px' }}>
                            <div 
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    background: 'rgba(20, 20, 20, 0.8)',
                                    border: '1px solid rgba(80, 80, 80, 0.3)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onClick={() => setPropsEditorOpen(!propsEditorOpen)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(30, 30, 30, 0.9)';
                                    e.currentTarget.style.borderColor = 'rgba(160, 118, 249, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(20, 20, 20, 0.8)';
                                    e.currentTarget.style.borderColor = 'rgba(80, 80, 80, 0.3)';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <dc.Icon 
                                        icon={propsEditorOpen ? "chevron-down" : "chevron-right"} 
                                        style={{ fontSize: '14px', color: 'rgba(200, 200, 200, 0.7)' }} 
                                    />
                                    <dc.Icon icon="braces" style={{ fontSize: '12px', color: 'rgba(200, 200, 200, 0.7)' }} />
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#e0e0e0' }}>
                                        Component Props
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: '11px',
                                    color: 'rgba(160, 118, 249, 0.8)',
                                    background: 'rgba(160, 118, 249, 0.1)',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                }}>
                                    {propsList.length} {propsList.length === 1 ? 'prop' : 'props'}
                                </span>
                            </div>
                            
                            {propsEditorOpen && (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '12px',
                                    background: 'rgba(15, 15, 15, 0.6)',
                                    border: '1px solid rgba(80, 80, 80, 0.3)',
                                    borderRadius: '8px',
                                }}>
                                    {/* Add new prop input */}
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{
                                            ...labelStyle,
                                            marginBottom: '6px',
                                            fontSize: '11px',
                                        }}>
                                            <dc.Icon icon="plus" style={{ fontSize: '10px' }} />
                                            <span>Add New Prop</span>
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                placeholder='e.g., title="Hello" or count={5}'
                                                value={newPropInput}
                                                onChange={(e) => setNewPropInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addNewProp();
                                                    }
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    background: 'rgba(20, 20, 20, 0.8)',
                                                    border: '1px solid rgba(80, 80, 80, 0.3)',
                                                    borderRadius: '6px',
                                                    color: '#e0e0e0',
                                                    fontSize: '12px',
                                                    fontFamily: 'monospace',
                                                    outline: 'none',
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = 'rgba(160, 118, 249, 0.3)';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(160, 118, 249, 0.05)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = 'rgba(80, 80, 80, 0.3)';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={addNewProp}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.8) 0%, rgba(30, 30, 30, 0.9) 100%)',
                                                    border: '1px solid rgba(160, 118, 249, 0.15)',
                                                    borderRadius: '6px',
                                                    color: '#e0e0e0',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = 'linear-gradient(135deg, rgba(60, 60, 60, 0.9) 0%, rgba(50, 50, 50, 1) 100%)';
                                                    e.target.style.borderColor = 'rgba(160, 118, 249, 0.3)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = 'linear-gradient(135deg, rgba(40, 40, 40, 0.8) 0%, rgba(30, 30, 30, 0.9) 100%)';
                                                    e.target.style.borderColor = 'rgba(160, 118, 249, 0.15)';
                                                }}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Props list */}
                                    {propsList.length === 0 ? (
                                        <div style={{
                                            padding: '16px',
                                            textAlign: 'center',
                                            color: 'rgba(140, 140, 140, 0.6)',
                                            fontSize: '12px',
                                        }}>
                                            No props set. Add one above.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {propsList.map((prop) => (
                                                <div
                                                    key={prop.key}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '8px 10px',
                                                        background: 'rgba(20, 20, 20, 0.8)',
                                                        border: '1px solid rgba(80, 80, 80, 0.3)',
                                                        borderRadius: '6px',
                                                    }}
                                                >
                                                    <span style={{
                                                        fontFamily: 'monospace',
                                                        fontSize: '12px',
                                                        color: 'rgba(160, 118, 249, 0.9)',
                                                        fontWeight: '600',
                                                        minWidth: '60px',
                                                    }}>
                                                        {prop.key}=
                                                    </span>
                                                    
                                                    {prop.isEditing ? (
                                                        <input
                                                            type="text"
                                                            defaultValue={prop.displayValue}
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    updateProp(prop.key, e.target.value);
                                                                } else if (e.key === 'Escape') {
                                                                    cancelEditProp(prop.key);
                                                                }
                                                            }}
                                                            onBlur={(e) => updateProp(prop.key, e.target.value)}
                                                            style={{
                                                                flex: 1,
                                                                padding: '4px 8px',
                                                                background: 'rgba(30, 30, 30, 0.9)',
                                                                border: '1px solid rgba(160, 118, 249, 0.4)',
                                                                borderRadius: '4px',
                                                                color: '#e0e0e0',
                                                                fontSize: '12px',
                                                                fontFamily: 'monospace',
                                                                outline: 'none',
                                                            }}
                                                        />
                                                    ) : (
                                                        <span
                                                            style={{
                                                                flex: 1,
                                                                fontFamily: 'monospace',
                                                                fontSize: '12px',
                                                                color: '#c0c0c0',
                                                                cursor: 'pointer',
                                                            }}
                                                            onDoubleClick={() => startEditProp(prop.key)}
                                                            title="Double-click to edit"
                                                        >
                                                            {prop.displayValue}
                                                        </span>
                                                    )}
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProp(prop.key)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'rgba(220, 38, 38, 0.7)',
                                                            fontSize: '14px',
                                                            cursor: 'pointer',
                                                            borderRadius: '4px',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.background = 'rgba(220, 38, 38, 0.2)';
                                                            e.target.style.color = '#ef4444';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.background = 'transparent';
                                                            e.target.style.color = 'rgba(220, 38, 38, 0.7)';
                                                        }}
                                                        title="Remove prop"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Clear all button */}
                                    {propsList.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPropsList([]);
                                                setComponentProps({});
                                                setRenderKey(prev => prev + 1);
                                            }}
                                            style={{
                                                width: '100%',
                                                marginTop: '12px',
                                                padding: '8px',
                                                background: 'rgba(220, 38, 38, 0.15)',
                                                border: '1px solid rgba(220, 38, 38, 0.3)',
                                                borderRadius: '6px',
                                                color: '#ef4444',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = 'rgba(220, 38, 38, 0.25)';
                                                e.target.style.borderColor = 'rgba(220, 38, 38, 0.5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = 'rgba(220, 38, 38, 0.15)';
                                                e.target.style.borderColor = 'rgba(220, 38, 38, 0.3)';
                                            }}
                                        >
                                            Clear All Props
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
            
            {/* Component Display Area */}
            <div style={displayAreaStyle}>
                <div style={spawnBoxStyle}>
                    {loadedComponentName ? (
                        <div 
                            className="component-sandbox-isolator"
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#050505',
                                overflow: 'hidden',
                                isolation: 'isolate',
                                border: '1px solid rgba(60, 60, 60, 0.2)'
                            }}
                        >
                            {/* Debug Panel */}
                            {showDebug && (
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    left: '12px',
                                    maxWidth: '400px',
                                    background: 'rgba(0, 0, 0, 0.95)',
                                    border: '2px solid #00ff00',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    zIndex: 10001,
                                    fontFamily: 'monospace',
                                    fontSize: '11px',
                                    color: '#00ff00',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #00ff00', paddingBottom: '4px' }}>
                                        <strong>🐛 LIVE DEBUG</strong>
                                        <button 
                                            onClick={() => setShowDebug(false)}
                                            style={{ 
                                                background: 'transparent', 
                                                border: 'none', 
                                                color: '#ff0000', 
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                padding: '0 4px'
                                            }}
                                        >×</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div><strong>Component:</strong> {loadedComponentName}</div>
                                        <div><strong>RenderKey:</strong> {renderKey}</div>
                                        <div><strong>Props Count:</strong> {Object.keys(componentProps).length}</div>
                                        <div style={{ borderTop: '1px solid #00ff00', paddingTop: '4px', marginTop: '4px' }}>
                                            <strong>PropsList Array:</strong>
                                            {propsList.length === 0 ? (
                                                <div style={{ color: '#ff9900', marginLeft: '8px' }}>Empty</div>
                                            ) : (
                                                <div style={{ marginLeft: '8px' }}>
                                                    {propsList.map((p, i) => (
                                                        <div key={i}>
                                                            {p.key}: {JSON.stringify(p.value)} ({typeof p.value})
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ borderTop: '1px solid #00ff00', paddingTop: '4px', marginTop: '4px' }}>
                                            <strong>ComponentProps Object:</strong>
                                            {Object.keys(componentProps).length === 0 ? (
                                                <div style={{ color: '#ff9900', marginLeft: '8px' }}>Empty {'{}'}</div>
                                            ) : (
                                                <div style={{ marginLeft: '8px' }}>
                                                    {Object.entries(componentProps).map(([key, value]) => (
                                                        <div key={key}>
                                                            {key}: {JSON.stringify(value)} ({typeof value})
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ borderTop: '1px solid #00ff00', paddingTop: '4px', marginTop: '4px' }}>
                                            <strong>Raw JSON:</strong>
                                            <pre style={{ 
                                                margin: '4px 0 0 0', 
                                                fontSize: '10px', 
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-all',
                                                color: '#00ffff'
                                            }}>
                                                {JSON.stringify(componentProps, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {!showDebug && (
                                <button
                                    onClick={() => setShowDebug(true)}
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        left: '12px',
                                        padding: '6px 10px',
                                        background: 'rgba(160, 118, 249, 0.08)',
                                        border: '1px solid rgba(160, 118, 249, 0.15)',
                                        borderRadius: '6px',
                                        color: 'rgba(160, 118, 249, 0.6)',
                                        fontSize: '10px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        zIndex: 10000,
                                        fontFamily: 'monospace',
                                        opacity: '0.5',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.opacity = '1';
                                        e.target.style.background = 'rgba(160, 118, 249, 0.15)';
                                        e.target.style.borderColor = 'rgba(160, 118, 249, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.opacity = '0.5';
                                        e.target.style.background = 'rgba(160, 118, 249, 0.08)';
                                        e.target.style.borderColor = 'rgba(160, 118, 249, 0.15)';
                                    }}
                                >
                                    🐛
                                </button>
                            )}
                            
                            <button
                                onClick={handleClearComponent}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    padding: '8px 16px',
                                    background: 'rgba(40, 40, 40, 0.8)',
                                    border: '1px solid rgba(220, 38, 38, 0.3)',
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    zIndex: 10000,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(220, 38, 38, 0.2)';
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.borderColor = 'rgba(220, 38, 38, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(40, 40, 40, 0.8)';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.borderColor = 'rgba(220, 38, 38, 0.3)';
                                }}
                            >
                                <dc.Icon icon="x" style={{ fontSize: '14px' }} />
                                <span>Close</span>
                            </button>
                            {/* Isolated workspace structure - this MUST be the first workspace-leaf-content found */}
                            <div 
                                className="workspace-leaf-content component-sandbox-boundary"
                                data-sandbox="true"
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    overflow: 'hidden',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    contain: 'layout style paint',
                                    zIndex: 1
                                }}
                            >
                                <div 
                                    className="view-content"
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        overflow: 'auto', 
                                        padding: '60px 20px 20px 20px',
                                        position: 'relative',
                                        flex: 1
                                    }}
                                >
                                    <DynamicComponentLoader 
                                        componentName={loadedComponentName} 
                                        componentProps={componentProps}
                                        renderKey={renderKey} 
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <dc.Icon icon="package-open" style={{ fontSize: '48px', color: 'rgba(140, 140, 140, 0.4)' }} />
                            <div style={{ fontSize: '16px', color: 'rgba(180, 180, 180, 0.6)' }}>Components will appear here</div>
                            {exampleComponents.length > 0 && (
                                <div style={{ fontSize: '13px', color: 'rgba(140, 140, 140, 0.5)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <dc.Icon icon="arrow-up" style={{ fontSize: '14px' }} />
                                    <span>Try the quick load buttons above!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- EXPORT ---
return { View : SimpleComponentLoader };
```
