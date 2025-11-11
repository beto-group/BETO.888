

# ViewComponent

```jsx
const { loadScript, loadMultiple, fetchAndCacheImage } = await dc.require(dc.headerLink(dc.resolvePath("D.q.loadscript.component.md"), "LoadScriptUpgrade"));

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

function LoadScriptDemo() {
  const [loadedLibraries, setLoadedLibraries] = dc.useState([]);
  const [error, setError] = dc.useState(null);
  const [customUrl, setCustomUrl] = dc.useState('');
  const [customGlobal, setCustomGlobal] = dc.useState('');
  const [customType, setCustomType] = dc.useState('script');
  const [expandedLibrary, setExpandedLibrary] = dc.useState(null);
  const [explorerPath, setExplorerPath] = dc.useState([]);
  const [isFullTab, setIsFullTab] = dc.useState(true);
  const [loadingLibrary, setLoadingLibrary] = dc.useState(null);
  const [loadingProgress, setLoadingProgress] = dc.useState('');
  
  const containerRef = dc.useRef(null);
  const stateRefs = dc.useRef({}).current;
  const instanceId = dc.useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `loadscript-fulltab-${instanceId}`;

  // Full-tab effect
  dc.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    if (isFullTab) {
      if (!container.parentNode) {
        setTimeout(() => setIsFullTab(true), 50);
        return;
      }
      
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
        position: "absolute",
        top: "0px",
        left: "0px",
        width: "100%",
        height: "100%",
        zIndex: "9998",
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

  // Predefined library presets
  const presets = {
    classic: [
      { name: 'Globe.gl', url: 'https://unpkg.com/globe.gl', global: 'Globe', type: 'script' },
      { name: 'Three.js', url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js', global: 'THREE', type: 'script' },
      { name: 'GSAP', url: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js', global: 'gsap', type: 'script' },
      { name: 'Chart.js', url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js', global: 'Chart', type: 'script' },
      { name: 'D3.js', url: 'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js', global: 'd3', type: 'script' },
    ],
    esm: [
      { name: 'Svelte Compiler', url: 'https://esm.sh/svelte@5/compiler?bundle', global: 'SvelteCompiler', type: 'module' },
      { name: 'Marked (Markdown)', url: 'https://esm.sh/marked@12.0.0', global: 'marked', type: 'module' },
      { name: 'Prettier', url: 'https://esm.sh/prettier@3.2.5/standalone', global: 'prettier', type: 'module' },
    ]
  };

  const analyzeLibrary = (lib, result) => {
    const info = {
      name: lib.name,
      url: lib.url,
      global: lib.global,
      type: lib.type,
      loaded: true,
      timestamp: new Date().toLocaleTimeString(),
      fullTimestamp: new Date().toLocaleString(),
      details: {},
      justLoaded: true // Flag for animation
    };

    try {
      if (lib.type === 'module' && result) {
        // ESM module analysis
        const exports = Object.keys(result);
        info.details = {
          exports: exports,
          exportCount: exports.length,
          functions: exports.filter(key => typeof result[key] === 'function'),
          objects: exports.filter(key => typeof result[key] === 'object' && result[key] !== null),
          constants: exports.filter(key => typeof result[key] !== 'function' && typeof result[key] !== 'object')
        };
      } else if (lib.type === 'script' && lib.global && window[lib.global]) {
        // Classic script analysis
        const globalObj = window[lib.global];
        const props = Object.keys(globalObj);
        info.details = {
          properties: props.slice(0, 20),
          propertyCount: props.length,
          type: typeof globalObj,
          isFunction: typeof globalObj === 'function',
          isObject: typeof globalObj === 'object',
          hasPrototype: !!(globalObj.prototype),
          constructor: globalObj.constructor?.name
        };
      }
    } catch (e) {
      info.details.error = e.message;
    }

    // Remove justLoaded flag after 3 seconds
    setTimeout(() => {
      setLoadedLibraries(prev => 
        prev.map(l => l.url === lib.url ? { ...l, justLoaded: false } : l)
      );
    }, 3000);

    return info;
  };

  const loadLibrary = async (lib) => {
    try {
      setError(null);
      setLoadingLibrary(lib.name);
      setLoadingProgress('Checking for existing library...');
      
      // Check if already loaded
      if (loadedLibraries.some(l => l.url === lib.url)) {
        setError(`${lib.name} is already loaded!`);
        setLoadingLibrary(null);
        setLoadingProgress('');
        return;
      }

      setLoadingProgress(`Fetching ${lib.type === 'module' ? 'ESM module' : 'script'} from CDN...`);
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 300));

      const result = await loadScript(dc, lib.url, {
        type: lib.type,
        globalName: lib.global
      });

      setLoadingProgress('Analyzing library structure...');
      await new Promise(resolve => setTimeout(resolve, 200));

      const libraryInfo = analyzeLibrary(lib, result);
      setLoadedLibraries(prev => [...prev, libraryInfo]);
      
      setLoadingProgress('✓ Library loaded successfully!');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setLoadingLibrary(null);
      setLoadingProgress('');

    } catch (err) {
      setError(`Failed to load ${lib.name}: ${err.message}`);
      setLoadingLibrary(null);
      setLoadingProgress('');
    }
  };

  const loadCustomLibrary = async () => {
    if (!customUrl) {
      setError('Please enter a URL');
      return;
    }

    const customLib = {
      name: customGlobal || 'Custom Library',
      url: customUrl,
      global: customGlobal || undefined,
      type: customType
    };

    await loadLibrary(customLib);
  };

  const removeLibrary = (index) => {
    setLoadedLibraries(prev => prev.filter((_, i) => i !== index));
  };

  const toggleExplorer = (index) => {
    if (expandedLibrary === index) {
      setExpandedLibrary(null);
      setExplorerPath([]);
    } else {
      setExpandedLibrary(index);
      setExplorerPath([]);
    }
  };

  const getObjectAtPath = (lib, path) => {
    let obj;
    
    if (lib.type === 'module') {
      // For ESM modules, get the exports
      obj = window[lib.global];
    } else if (lib.type === 'script' && lib.global) {
      // For classic scripts, get the global
      obj = window[lib.global];
    } else {
      return null;
    }

    // Navigate the path
    for (const key of path) {
      if (obj && typeof obj === 'object') {
        obj = obj[key];
      } else {
        return null;
      }
    }

    return obj;
  };

  const exploreProperty = (key) => {
    setExplorerPath(prev => [...prev, key]);
  };

  const navigateBack = () => {
    setExplorerPath(prev => prev.slice(0, -1));
  };

  const analyzeValue = (value, key) => {
    const type = typeof value;
    const result = {
      key,
      type,
      value: null,
      isExpandable: false,
      preview: '',
      details: {}
    };

    if (value === null) {
      result.preview = 'null';
    } else if (value === undefined) {
      result.preview = 'undefined';
    } else if (type === 'function') {
      const funcStr = value.toString();
      const params = funcStr.match(/\(([^)]*)\)/)?.[1] || '';
      result.preview = `ƒ ${key}(${params})`;
      result.details.parameters = params;
      result.details.source = funcStr.length > 200 ? funcStr.slice(0, 200) + '...' : funcStr;
      result.isExpandable = Object.keys(value).length > 0;
    } else if (type === 'object') {
      if (Array.isArray(value)) {
        result.preview = `Array(${value.length})`;
        result.details.length = value.length;
        result.isExpandable = value.length > 0;
      } else {
        const keys = Object.keys(value);
        result.preview = `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
        result.details.keys = keys;
        result.details.keyCount = keys.length;
        result.isExpandable = keys.length > 0;
      }
      result.details.constructor = value.constructor?.name;
    } else if (type === 'string') {
      result.preview = value.length > 50 ? `"${value.slice(0, 50)}..."` : `"${value}"`;
      result.value = value;
    } else if (type === 'number' || type === 'boolean') {
      result.preview = String(value);
      result.value = value;
    } else {
      result.preview = String(value);
    }

    return result;
  };

  const LibraryExplorer = ({ lib, libIndex }) => {
    const currentObj = getObjectAtPath(lib, explorerPath);
    
    if (!currentObj) {
      return <div style={{ color: '#6b7280', padding: '10px' }}>Unable to access object</div>;
    }

    let properties = [];
    
    try {
      if (typeof currentObj === 'function') {
        // For functions, show their properties
        properties = Object.keys(currentObj);
      } else if (Array.isArray(currentObj)) {
        // For arrays, show indices and methods
        properties = Object.keys(currentObj).slice(0, 100); // Limit to first 100 items
      } else if (typeof currentObj === 'object') {
        // For objects, show properties
        properties = Object.keys(currentObj);
      }
    } catch (e) {
      return <div style={{ color: '#fca5a5' }}>Error reading properties: {e.message}</div>;
    }

    return (
      <div style={{ 
        backgroundColor: '#000000', 
        padding: '15px', 
        borderRadius: '6px',
        marginTop: '10px',
        border: '1px solid #2d2d2d',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {/* Breadcrumb Navigation */}
        <div style={{ 
          marginBottom: '15px', 
          paddingBottom: '10px', 
          borderBottom: '1px solid #2d2d2d',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontFamily: 'monospace'
        }}>
          <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>
            {lib.global || lib.name}
          </span>
          {explorerPath.map((segment, i) => (
            <span key={i}>
              <span style={{ color: '#6b7280' }}> → </span>
              <span 
                style={{ 
                  color: '#8b5cf6', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                onClick={() => setExplorerPath(explorerPath.slice(0, i + 1))}
              >
                {segment}
              </span>
            </span>
          ))}
          {explorerPath.length > 0 && (
            <button 
              onClick={navigateBack} 
              style={{ 
                marginLeft: 'auto',
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
          )}
        </div>

        {/* Object Type Info */}
        <div style={{ 
          fontSize: '12px', 
          color: '#9ca3af', 
          marginBottom: '10px',
          padding: '8px',
          backgroundColor: '#0a0a0a',
          borderRadius: '4px',
          border: '1px solid #1a1a1a'
        }}>
          <strong>Type:</strong> {typeof currentObj}
          {currentObj.constructor && ` (${currentObj.constructor.name})`}
          {Array.isArray(currentObj) && ` [${currentObj.length} items]`}
          {typeof currentObj === 'object' && !Array.isArray(currentObj) && ` {${properties.length} properties}`}
        </div>

        {/* Properties List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {properties.length === 0 ? (
            <div style={{ color: '#6b7280', fontStyle: 'italic', padding: '10px' }}>
              No properties to display
            </div>
          ) : (
            properties.map(key => {
              let value;
              try {
                value = currentObj[key];
              } catch (e) {
                return (
                  <div key={key} style={{ 
                    padding: '6px 8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#fca5a5'
                  }}>
                    {key}: [Error accessing]
                  </div>
                );
              }

              const analysis = analyzeValue(value, key);
              
              return (
                <div 
                  key={key} 
                  style={{ 
                    padding: '6px 8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: analysis.isExpandable ? 'pointer' : 'default',
                    transition: 'background-color 0.1s',
                    border: '1px solid #1a1a1a'
                  }}
                  onMouseEnter={(e) => {
                    if (analysis.isExpandable) {
                      e.currentTarget.style.backgroundColor = '#1a1a1a';
                      e.currentTarget.style.borderColor = '#8b5cf6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0a0a0a';
                    e.currentTarget.style.borderColor = '#1a1a1a';
                  }}
                  onClick={() => {
                    if (analysis.isExpandable) {
                      exploreProperty(key);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    {analysis.isExpandable && (
                      <span style={{ color: '#8b5cf6' }}>▶</span>
                    )}
                    <span style={{ color: '#60a5fa' }}>{key}:</span>
                    <span style={{ 
                      color: analysis.type === 'function' ? '#a78bfa' : 
                             analysis.type === 'object' ? '#fb923c' : 
                             analysis.type === 'string' ? '#4ade80' : 
                             '#9ca3af'
                    }}>
                      {analysis.preview}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#6b7280',
                    backgroundColor: '#000000',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    border: '1px solid #1a1a1a'
                  }}>
                    {analysis.type}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#1a1a1a',
    color: 'white',
    border: '1px solid #8b5cf6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    marginRight: '8px',
    marginBottom: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)'
  };

  const smallButtonStyle = {
    ...buttonStyle,
    padding: '4px 12px',
    fontSize: '11px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #6b21a8',
    boxShadow: '0 0 5px rgba(107, 33, 168, 0.2)'
  };

  const cardStyle = {
    backgroundColor: '#0a0a0a',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid #2d2d2d',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
  };

  const inputStyle = {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #2d2d2d',
    backgroundColor: '#000000',
    color: 'white',
    fontSize: '13px',
    width: '100%',
    marginBottom: '8px',
    transition: 'border-color 0.2s ease'
  };

  const hoverEffectStyle = `
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
    .${uniqueWrapperClass} .subtle-icon:hover .exit-tooltip {
      visibility: visible;
      opacity: 1;
    }
  `;

  const exitTooltipStyle = {
    visibility: 'hidden',
    opacity: 0,
    backgroundColor: '#1a1a1a',
    color: 'white',
    textAlign: 'center',
    borderRadius: '4px',
    padding: '5px 10px',
    position: 'absolute',
    zIndex: 1,
    top: '50%',
    right: '120%',
    transform: 'translateY(-50%)',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    border: '1px solid #8b5cf6',
    transition: 'opacity 0.2s ease-in-out'
  };

  const exitIconStyle = {
    position: 'absolute',
    top: '15px',
    right: '20px',
    fontFamily: 'monospace',
    fontSize: '18px',
    color: '#8b5cf6',
    userSelect: 'none',
    cursor: 'pointer',
    zIndex: 10
  };

  const compactWrapperStyle = {
    padding: '16px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    border: '1px dashed #2d2d2d',
    borderRadius: '8px',
    backgroundColor: '#0a0a0a'
  };

  const compactTextStyle = {
    margin: 0,
    color: '#9ca3af',
    fontSize: '14px'
  };

  const compactButtonStyle = {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#8b5cf6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)',
    transition: 'all 0.2s ease'
  };

  // If not in full-tab mode, show compact view
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={compactWrapperStyle}>
        <dc.Icon icon="package" style={{ fontSize: '48px', color: '#8b5cf6' }} />
        <p style={compactTextStyle}>LoadScript component in compact mode.</p>
        <button 
          style={compactButtonStyle} 
          onClick={() => setIsFullTab(true)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#a78bfa';
            e.target.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#8b5cf6';
            e.target.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.3)';
          }}
        >
          <dc.Icon icon="maximize" style={{ fontSize: '14px', marginRight: '6px', verticalAlign: 'middle' }} />
          Enter Full Tab
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <style>{hoverEffectStyle}</style>
      <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', backgroundColor: '#000000', minHeight: '100vh', position: 'relative' }} className={uniqueWrapperClass}>
        {/* Exit Full Tab Icon */}
        <div 
          style={exitIconStyle} 
          className="subtle-icon" 
          onClick={() => setIsFullTab(false)}
        >
          <dc.Icon icon="minimize" style={{ fontSize: '18px' }} />
          <span className="exit-tooltip" style={exitTooltipStyle}>
            Exit Full Tab
          </span>
        </div>

        <h2 style={{ color: 'white', textShadow: '0 0 10px rgba(139, 92, 246, 0.5)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <dc.Icon icon="package" style={{ fontSize: '32px', color: '#8b5cf6' }} />
          LoadScript Upgrade - Library Manager
        </h2>
      <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
        Load and analyze classic scripts and ESM modules with caching
      </p>

      {/* Loading Indicator */}
      {loadingLibrary && (
        <div style={{
          ...cardStyle,
          backgroundColor: '#1a1a1a',
          border: '2px solid #8b5cf6',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
          marginBottom: '20px',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              animation: 'spin 1s linear infinite',
              display: 'flex',
              alignItems: 'center'
            }}>
              <dc.Icon icon="loader" style={{ fontSize: '32px', color: '#8b5cf6' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <dc.Icon icon="download" style={{ fontSize: '20px', color: '#8b5cf6' }} />
                Loading {loadingLibrary}...
              </h3>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
                {loadingProgress}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ ...cardStyle, backgroundColor: '#1a0a0a', color: '#fca5a5', border: '1px solid #7f1d1d', marginBottom: '15px', display: 'flex', alignItems: 'start', gap: '10px' }}>
          <dc.Icon icon="alert-circle" style={{ fontSize: '20px', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>Error:</strong> {error}
          </div>
          <button style={{ ...smallButtonStyle, float: 'right', backgroundColor: '#0a0a0a', padding: '2px 8px' }} onClick={() => setError(null)}>
            <dc.Icon icon="x" style={{ fontSize: '12px' }} />
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        {/* Classic Scripts Presets */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, color: 'white', borderBottom: '1px solid #8b5cf6', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <dc.Icon icon="scroll" style={{ fontSize: '20px', color: '#8b5cf6' }} />
            Classic Scripts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {presets.classic.map((lib, i) => (
              <button 
                key={i} 
                style={buttonStyle} 
                onClick={() => loadLibrary(lib)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2d1f3d';
                  e.target.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#1a1a1a';
                  e.target.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.3)';
                }}
              >
                <dc.Icon icon="download" style={{ fontSize: '14px', marginRight: '6px', verticalAlign: 'middle' }} />
                {lib.name}
              </button>
            ))}
          </div>
        </div>

        {/* ESM Modules Presets */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, color: 'white', borderBottom: '1px solid #8b5cf6', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <dc.Icon icon="package" style={{ fontSize: '20px', color: '#8b5cf6' }} />
            ESM Modules
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {presets.esm.map((lib, i) => (
              <button 
                key={i} 
                style={buttonStyle} 
                onClick={() => loadLibrary(lib)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2d1f3d';
                  e.target.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#1a1a1a';
                  e.target.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.3)';
                }}
              >
                <dc.Icon icon="download" style={{ fontSize: '14px', marginRight: '6px', verticalAlign: 'middle' }} />
                {lib.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Library Loader */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, color: 'white', borderBottom: '1px solid #8b5cf6', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <dc.Icon icon="wrench" style={{ fontSize: '20px', color: '#8b5cf6' }} />
          Load Custom Library
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="https://cdn.example.com/library.js"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#2d2d2d'}
          />
          <input
            type="text"
            placeholder="Global name (optional)"
            value={customGlobal}
            onChange={(e) => setCustomGlobal(e.target.value)}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#2d2d2d'}
          />
          <select 
            value={customType} 
            onChange={(e) => setCustomType(e.target.value)} 
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#2d2d2d'}
          >
            <option value="script">Classic</option>
            <option value="module">ESM</option>
          </select>
        </div>
        <button 
          style={buttonStyle} 
          onClick={loadCustomLibrary}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#2d1f3d';
            e.target.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#1a1a1a';
            e.target.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.3)';
          }}
        >
          <dc.Icon icon="plus" style={{ fontSize: '14px', marginRight: '6px', verticalAlign: 'middle' }} />
          Load Custom
        </button>
      </div>

      {/* Loaded Libraries */}
      {loadedLibraries.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>� Loaded Libraries ({loadedLibraries.length})</h3>
          {loadedLibraries.map((lib, index) => (
            <div key={index} style={{
              backgroundColor: '#0f0f0f',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '10px',
              border: lib.justLoaded ? '2px solid #8b5cf6' : '1px solid #2d2d2d',
              boxShadow: lib.justLoaded 
                ? '0 0 20px rgba(139, 92, 246, 0.6), 0 4px 8px rgba(0, 0, 0, 0.5)' 
                : '0 2px 4px rgba(0, 0, 0, 0.5)',
              animation: lib.justLoaded ? 'slideIn 0.5s ease-out' : 'none',
              transition: 'all 0.3s ease'
            }}>
              <style>{`
                @keyframes slideIn {
                  from {
                    opacity: 0;
                    transform: translateY(-10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              {lib.justLoaded && (
                <div style={{
                  backgroundColor: '#2d1f3d',
                  color: '#a78bfa',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid #8b5cf6'
                }}>
                  <dc.Icon icon="check-circle" style={{ fontSize: '14px' }} />
                  <strong>Just Loaded!</strong> • {lib.fullTimestamp}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <dc.Icon icon={lib.type === 'module' ? 'package' : 'scroll'} style={{ fontSize: '18px' }} />
                    {lib.name}
                  </h4>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    {lib.type === 'module' ? 'ESM Module' : 'Classic Script'} • {lib.timestamp}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    style={{
                      ...smallButtonStyle, 
                      backgroundColor: expandedLibrary === index ? '#2d1f3d' : '#0a0a0a',
                      border: expandedLibrary === index ? '1px solid #8b5cf6' : '1px solid #6b21a8'
                    }} 
                    onClick={() => toggleExplorer(index)}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#2d1f3d';
                      e.target.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = expandedLibrary === index ? '#2d1f3d' : '#0a0a0a';
                      e.target.style.boxShadow = '0 0 5px rgba(107, 33, 168, 0.2)';
                    }}
                  >
                    <dc.Icon icon={expandedLibrary === index ? 'eye-off' : 'eye'} style={{ fontSize: '11px', marginRight: '4px', verticalAlign: 'middle' }} />
                    {expandedLibrary === index ? 'Hide Explorer' : 'Explore'}
                  </button>
                  <button 
                    style={smallButtonStyle} 
                    onClick={() => removeLibrary(index)}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#1a0a0a';
                      e.target.style.border = '1px solid #7f1d1d';
                      e.target.style.boxShadow = '0 0 10px rgba(127, 29, 29, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#0a0a0a';
                      e.target.style.border = '1px solid #6b21a8';
                      e.target.style.boxShadow = '0 0 5px rgba(107, 33, 168, 0.2)';
                    }}
                  >
                    <dc.Icon icon="trash-2" style={{ fontSize: '11px', marginRight: '4px', verticalAlign: 'middle' }} />
                    Remove
                  </button>
                </div>
              </div>

              {expandedLibrary !== index && (
                <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#000000', padding: '10px', borderRadius: '4px', border: '1px solid #1a1a1a' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <dc.Icon icon="link" style={{ fontSize: '12px', color: '#9ca3af' }} />
                    <strong style={{ color: '#9ca3af' }}>URL:</strong> 
                    <span style={{ color: '#8b5cf6', fontSize: '11px', wordBreak: 'break-all' }}>{lib.url}</span>
                  </div>
                  {lib.global && (
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <dc.Icon icon="globe" style={{ fontSize: '12px', color: '#9ca3af' }} />
                      <strong style={{ color: '#9ca3af' }}>Global:</strong> 
                      <span style={{ color: '#4ade80' }}>window.{lib.global}</span>
                    </div>
                  )}
                  
                  {/* Quick Stats */}
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '8px', 
                    backgroundColor: '#0a0a0a', 
                    borderRadius: '4px',
                    border: '1px solid #1a1a1a',
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap'
                  }}>
                    {lib.type === 'module' && lib.details.exports && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <dc.Icon icon="box" style={{ fontSize: '14px', color: '#60a5fa' }} />
                          <span style={{ color: '#9ca3af' }}>Exports: <strong style={{ color: 'white' }}>{lib.details.exportCount}</strong></span>
                        </div>
                        {lib.details.functions?.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <dc.Icon icon="function-square" style={{ fontSize: '14px', color: '#a78bfa' }} />
                            <span style={{ color: '#9ca3af' }}>Functions: <strong style={{ color: 'white' }}>{lib.details.functions.length}</strong></span>
                          </div>
                        )}
                        {lib.details.objects?.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <dc.Icon icon="package" style={{ fontSize: '14px', color: '#fb923c' }} />
                            <span style={{ color: '#9ca3af' }}>Objects: <strong style={{ color: 'white' }}>{lib.details.objects.length}</strong></span>
                          </div>
                        )}
                      </>
                    )}
                    {lib.type === 'script' && lib.details.propertyCount && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <dc.Icon icon="list" style={{ fontSize: '14px', color: '#60a5fa' }} />
                        <span style={{ color: '#9ca3af' }}>Properties: <strong style={{ color: 'white' }}>{lib.details.propertyCount}</strong></span>
                      </div>
                    )}
                  </div>
                  
                  {lib.type === 'module' && lib.details.exports && (
                    <>
                      <div style={{ marginTop: '10px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <dc.Icon icon="layers" style={{ fontSize: '14px', color: '#8b5cf6' }} />
                        <strong style={{ color: '#9ca3af' }}>Detailed Exports:</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginLeft: '10px' }}>
                        {lib.details.functions?.length > 0 && (
                          <div>
                            <div style={{ color: '#60a5fa', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                              <dc.Icon icon="function-square" style={{ fontSize: '10px', marginRight: '4px' }} />
                              Functions ({lib.details.functions.length}):
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '11px' }}>
                              {lib.details.functions.join(', ')}
                            </div>
                          </div>
                        )}
                        {lib.details.objects?.length > 0 && (
                          <div>
                            <div style={{ color: '#fb923c', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                              <dc.Icon icon="package" style={{ fontSize: '10px', marginRight: '4px' }} />
                              Objects ({lib.details.objects.length}):
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '11px' }}>
                              {lib.details.objects.join(', ')}
                            </div>
                          </div>
                        )}
                        {lib.details.constants?.length > 0 && (
                          <div>
                            <div style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                              <dc.Icon icon="tag" style={{ fontSize: '10px', marginRight: '4px' }} />
                              Constants ({lib.details.constants.length}):
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '11px' }}>
                              {lib.details.constants.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {lib.type === 'script' && lib.details.properties && (
                    <>
                      <div style={{ marginTop: '10px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <dc.Icon icon="info" style={{ fontSize: '14px', color: '#8b5cf6' }} />
                        <strong style={{ color: '#9ca3af' }}>Library Details:</strong>
                      </div>
                      <div style={{ marginLeft: '10px', color: '#6b7280', fontSize: '11px' }}>
                        {lib.details.type && <div style={{ marginBottom: '4px' }}>
                          <dc.Icon icon="code" style={{ fontSize: '10px', marginRight: '6px', color: '#60a5fa' }} />
                          Type: <strong style={{ color: 'white' }}>{lib.details.type}</strong>
                        </div>}
                        {lib.details.constructor && <div style={{ marginBottom: '4px' }}>
                          <dc.Icon icon="cpu" style={{ fontSize: '10px', marginRight: '6px', color: '#a78bfa' }} />
                          Constructor: <strong style={{ color: 'white' }}>{lib.details.constructor}</strong>
                        </div>}
                        {lib.details.hasPrototype && <div style={{ marginBottom: '4px' }}>
                          <dc.Icon icon="check-circle" style={{ fontSize: '10px', marginRight: '6px', color: '#4ade80' }} />
                          Has Prototype: <strong style={{ color: 'white' }}>✓</strong>
                        </div>}
                        {lib.details.properties && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#0a0a0a', borderRadius: '3px', border: '1px solid #2d2d2d' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                              <dc.Icon icon="list" style={{ fontSize: '12px', color: '#8b5cf6' }} />
                              <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 'bold' }}>
                                Properties ({lib.details.propertyCount} total)
                              </span>
                            </div>
                            <div style={{ 
                              color: '#a78bfa', 
                              fontSize: '10px', 
                              lineHeight: '1.6',
                              maxHeight: '120px',
                              overflowY: 'auto',
                              padding: '4px',
                              backgroundColor: '#000000',
                              borderRadius: '2px'
                            }}>
                              {lib.details.properties.join(', ')}
                            </div>
                            {lib.details.propertyCount > 20 && (
                              <div style={{ marginTop: '4px', color: '#6b7280', fontSize: '9px', fontStyle: 'italic' }}>
                                <dc.Icon icon="alert-circle" style={{ fontSize: '9px', marginRight: '4px' }} />
                                Showing first 20 properties only. {lib.details.propertyCount - 20} more available.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {expandedLibrary === index && (
                <LibraryExplorer lib={lib} libIndex={index} />
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ ...cardStyle, backgroundColor: '#0a0a0a', border: '1px solid #8b5cf6' }}>
        <h4 style={{ color: 'white', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <dc.Icon icon="sparkles" style={{ fontSize: '20px', color: '#8b5cf6' }} />
          Features
        </h4>
        <ul style={{ fontSize: '13px', color: '#9ca3af', margin: '10px 0', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <dc.Icon icon="check" style={{ fontSize: '14px', color: '#4ade80' }} />
            Classic script & ESM module support
          </li>
          <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <dc.Icon icon="check" style={{ fontSize: '14px', color: '#4ade80' }} />
            Vault caching for offline access
          </li>
          <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <dc.Icon icon="check" style={{ fontSize: '14px', color: '#4ade80' }} />
            Global deduplication (no duplicate loads)
          </li>
          <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <dc.Icon icon="check" style={{ fontSize: '14px', color: '#4ade80' }} />
            Library analysis (exports, functions, properties)
          </li>
          <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <dc.Icon icon="check" style={{ fontSize: '14px', color: '#4ade80' }} />
            Custom library loading
          </li>
          <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <dc.Icon icon="check" style={{ fontSize: '14px', color: '#4ade80' }} />
            Real-time library information
          </li>
        </ul>
      </div>
    </div>
    </div>
  );
}

return { View: LoadScriptDemo };
```

---

# LoadScriptUpgrade

```jsx
/**
 * Universal Script & Module Loader with ESM Support
 * ================================================
 * Loads scripts (classic or ESM modules) from URLs or local vault paths with caching.
 * 
 * Features:
 * - Classic script loading via <script> tags
 * - ESM module loading via dynamic import()
 * - URL caching in vault for offline access
 * - Local vault path support
 * - Global deduplication (prevents duplicate loads)
 * - Idempotent with global checks
 * 
 * Usage:
 * ```js
 * // Classic script with global check
 * await loadScript(dc, 'https://unpkg.com/globe.gl', { globalName: 'Globe' });
 * 
 * // ESM module from CDN
 * const { compile } = await loadScript(dc, 'https://esm.sh/svelte@5/compiler?bundle', { 
 *   type: 'module',
 *   globalName: 'SvelteCompiler'
 * });
 * 
 * // Local vault script
 * await loadScript(dc, 'scripts/mylib.js');
 * ```
 */

/**
 * Loads a script or ESM module with caching and global deduplication.
 * 
 * @param {object} dc - The Datacore context object (required for vault access).
 * @param {string} src - The URL or local vault path of the script/module.
 * @param {object} [options] - Configuration options.
 * @param {string} [options.type='script'] - Load type: 'script' (classic) or 'module' (ESM).
 * @param {string} [options.globalName] - Global variable name to check/store (for deduplication).
 * @param {boolean} [options.cache=true] - Whether to cache URL resources in the vault.
 * @param {Function} [options.onload] - Callback when script loads successfully.
 * @param {Function} [options.onerror] - Callback on error.
 * @returns {Promise<any>} Promise resolving with the module exports (for ESM) or script element (for classic).
 */
async function loadScript(dc, src, options = {}) {
  const {
    type = 'script',
    globalName = null,
    cache = true,
    onload = null,
    onerror = null
  } = options;

  // Validate dc context
  if (!dc || !dc.app || !dc.app.vault || !dc.app.vault.adapter) {
    const error = new Error("Datacore context 'dc' with vault adapter is required for loadScript.");
    if (onerror) onerror(error);
    throw error;
  }

  const adapter = dc.app.vault.adapter;
  const cacheDir = ".datacore/script_cache";
  const isUrl = /^https?:\/\//.test(src);

  // --- GLOBAL DEDUPLICATION CHECK ---
  if (globalName && window[globalName]) {
    console.log(`[LoadScript] ✓ ${globalName} already available (skipping load)`);
    return type === 'module' ? window[globalName] : Promise.resolve();
  }

  // --- GLOBAL PROMISE TRACKING (prevent duplicate concurrent loads) ---
  window.__scriptPromises = window.__scriptPromises || {};
  const promiseKey = `${type}:${src}`;
  
  if (window.__scriptPromises[promiseKey]) {
    console.log(`[LoadScript] ⏳ ${src} already loading, reusing promise...`);
    return window.__scriptPromises[promiseKey];
  }

  console.log(`[LoadScript] 📥 Loading ${type} from ${isUrl ? 'URL' : 'local'}: ${src}`);

  // --- MAIN LOADING LOGIC ---
  const loadPromise = (async () => {
    try {
      let scriptContent = null;

      // Step 1: Fetch or read script content
      if (isUrl) {
        const safeFilename = src
          .replace(/^https?:\/\//, '')
          .replace(/[\/\\?%*:|"<>]/g, '_') + '.js';
        const cachePath = `${cacheDir}/${safeFilename}`;

        // Check cache first
        if (cache && await adapter.exists(cachePath)) {
          console.log(`[LoadScript] 📦 Loading from cache: ${cachePath}`);
          try {
            scriptContent = await adapter.read(cachePath);
          } catch (readError) {
            console.warn(`[LoadScript] ⚠️ Cache read failed, refetching:`, readError);
          }
        }

        // Fetch from network if not cached
        if (scriptContent === null) {
          console.log(`[LoadScript] 🌐 Fetching from network: ${src}`);
          const response = await fetch(src);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          scriptContent = await response.text();

          // Write to cache
          if (cache) {
            try {
              if (!(await adapter.exists(cacheDir))) {
                await adapter.mkdir(cacheDir);
              }
              console.log(`[LoadScript] 💾 Caching to: ${cachePath}`);
              await adapter.write(cachePath, scriptContent);
            } catch (writeError) {
              console.warn(`[LoadScript] ⚠️ Cache write failed:`, writeError);
            }
          }
        }
      } else {
        // Local vault path
        console.log(`[LoadScript] 📁 Reading from vault: ${src}`);
        if (!(await adapter.exists(src))) {
          throw new Error(`Local file not found: ${src}`);
        }
        scriptContent = await adapter.read(src);
      }

      // Step 2: Execute based on type
      let result;

      if (type === 'module') {
        // ESM MODULE LOADING
        console.log(`[LoadScript] 🎭 Loading as ESM module...`);
        
        // For ESM modules, we should directly import from the URL instead of using blob
        // This allows the browser to properly resolve module imports
        try {
          let moduleExports;
          
          if (isUrl) {
            // For URLs, import directly - the CDN handles resolution
            console.log(`[LoadScript] 📦 Importing from URL: ${src}`);
            moduleExports = await import(src);
          } else {
            // For local files, we need to create a blob URL
            console.log(`[LoadScript] 📦 Importing from blob...`);
            const blob = new Blob([scriptContent], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            
            try {
              moduleExports = await import(blobUrl);
            } finally {
              URL.revokeObjectURL(blobUrl);
            }
          }
          
          console.log(`[LoadScript] ✅ Module loaded successfully`);
          console.log(`[LoadScript] 📊 Exports:`, Object.keys(moduleExports));
          
          // Store in global if requested
          if (globalName) {
            window[globalName] = moduleExports;
            console.log(`[LoadScript] 🌍 Stored as window.${globalName}`);
          }
          
          result = moduleExports;
          
        } catch (importError) {
          throw new Error(`Module import failed: ${importError.message}`);
        }
        
      } else {
        // CLASSIC SCRIPT LOADING
        console.log(`[LoadScript] 📜 Loading as classic script...`);
        
        const scriptElement = document.createElement('script');
        
        // For inline scripts (textContent), onload doesn't fire
        // We need to execute synchronously and resolve immediately
        try {
          scriptElement.textContent = scriptContent;
          
          // Append to DOM to execute
          document.body.appendChild(scriptElement);
          
          // Script executes synchronously, so check immediately
          console.log(`[LoadScript] ✅ Script executed successfully`);
          
          // Check for global if specified
          if (globalName) {
            if (window[globalName]) {
              console.log(`[LoadScript] 🌍 window.${globalName} available`);
            } else {
              console.warn(`[LoadScript] ⚠️ Global "${globalName}" not found after load`);
            }
          }
          
          result = scriptElement;
          
        } catch (execError) {
          console.error(`[LoadScript] ❌ Script execution failed:`, execError);
          if (scriptElement.parentNode) {
            scriptElement.parentNode.removeChild(scriptElement);
          }
          throw new Error(`Script execution failed: ${execError.message}`);
        }
      }

      // Success callback
      if (onload) {
        onload(result);
      }

      console.log(`[LoadScript] 🎉 Load complete: ${src}`);
      return result;

    } catch (error) {
      console.error(`[LoadScript] 💥 Failed to load ${src}:`, error);
      
      if (onerror) {
        onerror(error);
      }
      
      throw error;
      
    } finally {
      // Clean up promise tracker
      delete window.__scriptPromises[promiseKey];
    }
  })();

  // Store promise for deduplication
  window.__scriptPromises[promiseKey] = loadPromise;
  
  return loadPromise;
}

/**
 * Helper: Load multiple scripts/modules in sequence or parallel.
 * 
 * @param {object} dc - Datacore context.
 * @param {Array<{src: string, options?: object}>} scripts - Array of script configs.
 * @param {boolean} [parallel=false] - Load in parallel (true) or sequence (false).
 * @returns {Promise<Array>} Array of results.
 */
async function loadMultiple(dc, scripts, parallel = false) {
  if (parallel) {
    return Promise.all(scripts.map(({ src, options }) => loadScript(dc, src, options)));
  } else {
    const results = [];
    for (const { src, options } of scripts) {
      results.push(await loadScript(dc, src, options));
    }
    return results;
  }
}

/**
 * Fetches an image from a URL and caches it in the vault for offline access.
 * On subsequent loads, it reads the image directly from the cache.
 *
 * @param {object} dc - The Datacore context object.
 * @param {string} url - The URL of the image to fetch.
 * @returns {Promise<string>} A promise that resolves with a local blob URL for the image.
 */
async function fetchAndCacheImage(dc, url) {
  const cacheDir = ".datacore/image_cache";
  const adapter = dc.app.vault.adapter;

  const safeFilename = url.replace(/^https?:\/\//, '').replace(/[\/\\?%*:|"<>]/g, '_');
  const cachePath = `${cacheDir}/${safeFilename}`;

  // Check cache
  if (await adapter.exists(cachePath)) {
    console.log(`[ImageCache] Loading from cache: ${cachePath}`);
    try {
      const binaryData = await adapter.readBinary(cachePath);
      const blob = new Blob([binaryData]);
      return URL.createObjectURL(blob);
    } catch (readError) {
      console.warn(`[ImageCache] Cache read failed, re-fetching:`, readError);
    }
  }

  // Fetch from network
  console.log(`[ImageCache] Fetching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();

  // Write to cache
  try {
    const buffer = await blob.arrayBuffer();
    if (!(await adapter.exists(cacheDir))) {
      await adapter.mkdir(cacheDir);
    }
    console.log(`[ImageCache] Caching to: ${cachePath}`);
    await adapter.writeBinary(cachePath, buffer);
  } catch (writeError) {
    console.warn(`[ImageCache] Cache write failed:`, writeError);
  }

  return URL.createObjectURL(blob);
}

return { loadScript, loadMultiple, fetchAndCacheImage };
```

