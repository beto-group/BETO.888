


# ViewComponent

```jsx
const { useState, useRef, useEffect } = dc;

function IconBrowserView() {
  const [iconName, setIconName] = useState('search');
  const [size, setSize] = useState(48);
  const [isFullTab, setIsFullTab] = useState(true);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;
  const uniqueWrapperClass = "iconpack-fulltab-" + useRef(Math.random().toString(36).substr(2, 9)).current;

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

  // Suppress iframe console errors
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      // Filter out known iframe-related errors
      if (message.includes('currentColor') || 
          message.includes('cross-origin') || 
          message.includes('autofocus')) {
        return; // Suppress these specific errors
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('currentColor') || 
          message.includes('cross-origin') || 
          message.includes('autofocus')) {
        return;
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Fulltab effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (isFullTab) {
      if (!container.parentNode) {
        setTimeout(() => setIsFullTab(true), 50);
        return;
      }
      // Find Obsidian tab content
      function findNearestAncestorWithClass(element, className) { if (!element) return null; let current = element.parentNode; while (current) { if (current.classList && current.classList.contains(className)) { return current; } current = current.parentNode; } return null; }
      function findDirectChildByClass(parent, className) { if (!parent) return null; for (const child of parent.children) { if (child.classList && child.classList.contains(className)) { return child; } } return null; }
      const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
      if (!targetPaneContent) {
        setIsFullTab(false);
        return;
      }
      const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;
      stateRefs.originalParent = container.parentNode;
      stateRefs.placeholder = document.createElement('div');
      stateRefs.placeholder.style.display = 'none';
      container.parentNode.insertBefore(stateRefs.placeholder, container);
      const computedParentPosition = window.getComputedStyle(contentWrapper).position;
      stateRefs.parentPositionInfo = {
        element: contentWrapper,
        originalInlinePosition: contentWrapper.style.position
      };
      if (computedParentPosition === 'static') {
        contentWrapper.style.position = "relative";
      }
      contentWrapper.appendChild(container);
      Object.assign(container.style, {
        position: "absolute", top: "0px", left: "0px",
        width: "100%", height: "100%", zIndex: "9998",
        overflow: "auto"
      });
    }
    // Cleanup
    return () => {
      if (!stateRefs.originalParent) return;
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      } else {
        stateRefs.originalParent.appendChild(container);
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || '';
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach(key => stateRefs[key] = null);
    };
  }, [isFullTab]);

  const sizes = [
    { label: 'Small (24px)', value: 24 },
    { label: 'Medium (48px)', value: 48 },
    { label: 'Large (72px)', value: 72 },
    { label: 'XL (96px)', value: 96 }
  ];

  // --- UI ---
  return (
    <div ref={containerRef}>
      <style>{`
        .${uniqueWrapperClass}:hover .subtle-icon {
          opacity: 1;
          transform: scale(1);
        }
        .iconspack-preview-icon svg.svg-icon {
          width: var(--icon-size, 24px);
          height: var(--icon-size, 24px);
        }
        .iconspack-input:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.4);
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
        }
        .iconspack-button:hover {
          background-color: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.4);
        }
      `}</style>
      {isFullTab ? (
        <div style={{
          display: 'flex',
          gap: '20px',
          height: '100vh',
          fontFamily: 'monospace',
          backgroundColor: '#000000',
          color: '#ffffff',
          padding: '24px',
          position: 'relative'
        }} className={uniqueWrapperClass}>
          {/* Exit Full Tab Icon */}
          <div style={{
            position: "absolute", 
            top: "24px", 
            right: "24px", 
            fontFamily: "monospace",
            fontSize: "14px", 
            color: "#8b5cf6", 
            userSelect: "none",
            cursor: "pointer", 
            opacity: 0.6, 
            transform: "scale(0.95)",
            transition: "opacity 0.2s, transform 0.2s", 
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            borderRadius: "6px"
          }} 
          className="subtle-icon" 
          title="Exit Full Tab" 
          onClick={() => setIsFullTab(false)}>
            <dc.Icon icon="minimize-2" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
            <span>Exit Full Tab</span>
          </div>
          {/* Left Panel - Icon Preview */}
          <div style={{
            width: '380px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: '#0a0a0a',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)'
          }}>
            <h2 style={{ 
              margin: 0, 
              color: '#8b5cf6', 
              fontWeight: '600',
              fontSize: '20px',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <dc.Icon icon="eye" style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
              Icon Preview
            </h2>
            <div 
              className="icon-preview-container"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000000',
                padding: '60px',
                borderRadius: '12px',
                minHeight: '200px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                boxShadow: '0 0 40px rgba(139, 92, 246, 0.1) inset'
              }}
            >
              <span 
                className="iconspack-preview-icon"
                style={{
                  '--icon-size': `${size}px`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8b5cf6'
                }}
              >
                <dc.Icon icon={iconName} />
              </span>
            </div>

            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px', 
                fontWeight: '600',
                color: '#e0e0e0',
                fontSize: '14px'
              }}>
                <dc.Icon icon="tag" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                Icon Name:
              </label>
              <input
                type="text"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                placeholder="Enter icon name..."
                className="iconspack-input"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px', 
                fontWeight: '600',
                color: '#e0e0e0',
                fontSize: '14px'
              }}>
                <dc.Icon icon="move" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                Size:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sizes.map(s => (
                  <label key={s.value} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    padding: '10px',
                    backgroundColor: size === s.value ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    border: '1px solid',
                    borderColor: size === s.value ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="radio"
                      value={s.value}
                      checked={size === s.value}
                      onChange={() => setSize(s.value)}
                      style={{ marginRight: '10px', accentColor: '#8b5cf6' }}
                    />
                    <span style={{ color: size === s.value ? '#8b5cf6' : '#e0e0e0' }}>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px', 
                fontWeight: '600',
                color: '#e0e0e0',
                fontSize: '14px'
              }}>
                <dc.Icon icon="code" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                Usage:
              </label>
              <div style={{
                backgroundColor: '#000000',
                padding: '16px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.8',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                overflow: 'auto'
              }}>
                <div style={{ color: '#569cd6' }}>{'<span'}</div>
                <div style={{ marginLeft: '20px' }}>
                  <span style={{ color: '#9cdcfe' }}>className</span>
                  <span style={{ color: '#d4d4d4' }}>="</span>
                  <span style={{ color: '#ce9178' }}>custom-icon</span>
                  <span style={{ color: '#d4d4d4' }}>"</span>
                </div>
                <div style={{ marginLeft: '20px' }}>
                  <span style={{ color: '#9cdcfe' }}>style</span>
                  <span style={{ color: '#d4d4d4' }}>=&#123;&#123; </span>
                  <span style={{ color: '#ce9178' }}>'--icon-size'</span>
                  <span style={{ color: '#d4d4d4' }}>: </span>
                  <span style={{ color: '#ce9178' }}>'{size}px'</span>
                  <span style={{ color: '#d4d4d4' }}> &#125;&#125;</span>
                </div>
                <div style={{ color: '#569cd6' }}>{'>'}</div>
                <div style={{ marginLeft: '20px' }}>
                  <span style={{ color: '#569cd6' }}>{'<dc.Icon'}</span>
                  <span style={{ color: '#d4d4d4' }}> </span>
                  <span style={{ color: '#9cdcfe' }}>icon</span>
                  <span style={{ color: '#d4d4d4' }}>="</span>
                  <span style={{ color: '#ce9178' }}>{iconName}</span>
                  <span style={{ color: '#d4d4d4' }}>" </span>
                  <span style={{ color: '#569cd6' }}>{'/>'}</span>
                </div>
                <div style={{ color: '#569cd6' }}>{'</span>'}</div>
              </div>
            </div>
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px', 
                fontWeight: '600',
                color: '#e0e0e0',
                fontSize: '14px'
              }}>
                <dc.Icon icon="zap" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                Quick Examples:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['search', 'home', 'star', 'heart', 'settings', 'user', 'file', 'folder', 'bell', 'bookmark', 'calendar', 'check'].map(name => (
                  <button
                    key={name}
                    onClick={() => setIconName(name)}
                    className="iconspack-button"
                    style={{
                      padding: '8px 14px',
                      backgroundColor: iconName === name ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.05)',
                      color: iconName === name ? '#8b5cf6' : '#e0e0e0',
                      border: '1px solid',
                      borderColor: iconName === name ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.1)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      transition: 'all 0.2s ease',
                      fontWeight: iconName === name ? '600' : '400'
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Right Panel - Lucide Icons Browser */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0a0a',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
              backgroundColor: '#000000'
            }}>
              <h2 style={{ 
                margin: 0,
                color: '#8b5cf6',
                fontWeight: '600',
                fontSize: '20px',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <dc.Icon icon="package" style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
                Lucide Icons Browser
              </h2>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '13px' }}>
                Find an icon, copy its name, and paste it in the preview panel
              </p>
            </div>
            <iframe
              src="https://lucide.dev/icons/"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#ffffff',
                borderRadius: '0 0 12px 12px'
              }}
            />
          </div>
        </div>
      ) : (
        // Compact mode
        <div style={{
          padding: "24px", 
          boxSizing: "border-box", 
          display: "flex",
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          gap: "16px", 
          border: "1px solid rgba(139, 92, 246, 0.2)",
          borderRadius: "12px", 
          backgroundColor: "#0a0a0a"
        }}>
          <dc.Icon icon="package" style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
          <p style={{ margin: 0, color: "#666", fontSize: "14px", fontFamily: "monospace" }}>Component is in compact mode.</p>
          <button style={{
            padding: '10px 20px', 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#ffffff',
            backgroundColor: 'rgba(139, 92, 246, 0.2)', 
            border: '1px solid rgba(139, 92, 246, 0.3)', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }} 
          onClick={() => setIsFullTab(true)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
            e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
            e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
          }}>
            <dc.Icon icon="maximize-2" style={{ width: '16px', height: '16px', color: '#ffffff' }} />
            Enter Full Tab
          </button>
        </div>
      )}
    </div>
  );
}

return { View: IconBrowserView };
```


