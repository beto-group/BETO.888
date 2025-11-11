


# ViewComponent

```jsx
// --- Script Loading Utility ---
async function loadScript(dc, url) {
  const scriptId = `script-${url.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  // Check if already loaded
  if (document.getElementById(scriptId)) {
    console.log(`[LoadScript] Script already loaded: ${url}`);
    return;
  }
  
  console.log(`[LoadScript] Loading script: ${url}`);
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = url;
    script.onload = () => {
      console.log(`[LoadScript] ✅ Script loaded: ${url}`);
      resolve();
    };
    script.onerror = () => {
      console.error(`[LoadScript] ❌ Failed to load: ${url}`);
      reject(new Error(`Failed to load script: ${url}`));
    };
    document.head.appendChild(script);
  });
}

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

/**
 * Fetches an image from a URL and caches it in the vault for offline access.
 * On subsequent loads, it reads the image directly from the cache.
 */
async function fetchAndCacheImage(dc, url) {
  const cacheDir = ".datacore/image_cache";
  const adapter = dc.app.vault.adapter;

  const safeFilename = url.replace(/^https?:\/\//, '').replace(/[\/\\?%*:|"<>]/g, '_');
  const cachePath = `${cacheDir}/${safeFilename}`;

  // Check if cached
  if (await adapter.exists(cachePath)) {
    console.log(`[Globe Cache] Loading image from cache: ${cachePath}`);
    try {
      const binaryData = await adapter.readBinary(cachePath);
      const blob = new Blob([binaryData]);
      return URL.createObjectURL(blob);
    } catch (readError) {
      console.warn(`[Globe Cache] Failed to read cached image, re-fetching.`, readError);
    }
  }

  // Fetch from network
  console.log(`[Globe Network] Fetching image: ${url}`);
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
    console.log(`[Globe Cache] Writing image to cache: ${cachePath}`);
    await adapter.writeBinary(cachePath, buffer);
  } catch (writeError) {
    console.warn(`[Globe Cache] Failed to write image to cache:`, writeError);
  }

  return URL.createObjectURL(blob);
}

function View() {
  const instanceId = dc.useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `globe-wrapper-${instanceId}`;
  
  const globeRef = dc.useRef(null);
  const containerRef = dc.useRef(null);
  const stateRefs = dc.useRef({}).current;
  
  const [ready, setReady] = dc.useState(false);
  const [isFullTab, setIsFullTab] = dc.useState(true);

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
      .${uniqueWrapperClass} .subtle-icon:hover .exit-tooltip {
        visibility: visible;
        opacity: 1;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `,
    fullTabWrapper: {
      position: "relative",
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0a0a0a",
      overflow: "hidden",
    },
    iconContainer: {
      position: "absolute",
      top: "15px",
      right: "20px",
      fontFamily: "monospace",
      fontSize: "14px",
      color: "rgba(147, 51, 234, 0.8)",
      userSelect: "none",
      cursor: "pointer",
      zIndex: 10,
      padding: "8px 12px",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      borderRadius: "6px",
      border: "1px solid rgba(147, 51, 234, 0.3)",
      backdropFilter: "blur(10px)",
    },
    tooltip: {
      visibility: "hidden",
      opacity: 0,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      color: "#9ca3af",
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
      border: "1px solid rgba(147, 51, 234, 0.3)",
    },
    compactWrapper: {
      padding: "16px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      border: "1px dashed rgba(147, 51, 234, 0.3)",
      borderRadius: "8px",
      backgroundColor: "#0a0a0a",
    },
    compactText: { 
      margin: 0, 
      color: "#9ca3af", 
      fontSize: "14px" 
    },
    button: {
      padding: "8px 16px",
      fontSize: "12px",
      fontWeight: "500",
      color: "#ffffff",
      backgroundColor: "rgba(147, 51, 234, 0.8)",
      border: "1px solid rgba(147, 51, 234, 0.5)",
      borderRadius: "6px",
      cursor: "pointer",
    },
  };

  // Full-tab mode effect
  dc.useEffect(() => {
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

  // Globe setup effect
  dc.useEffect(() => {
    async function setupGlobe() {
      console.log("[Globe] Setup started...");

      if (!globeRef.current) {
        console.error("[Globe] Container not ready, aborting.");
        return;
      }

      if (!window.THREE) {
        console.log("[Globe] Loading Three.js library...");
        await loadScript(dc, "https://unpkg.com/three@0.158.0/build/three.min.js");
        console.log("[Globe] Three.js loaded successfully.");
      } else {
        console.log("[Globe] Three.js already loaded.");
      }

      if (!window.Globe) {
        console.log("[Globe] Loading Globe.gl library...");
        await loadScript(dc, "https://unpkg.com/globe.gl@2.27.2/dist/globe.gl.min.js");
        console.log("[Globe] Globe.gl loaded successfully.");
      } else {
        console.log("[Globe] Globe.gl already loaded.");
      }

      console.log("[Globe] Loading Earth textures...");
      const [globeTexture, bumpTexture] = await Promise.all([
        fetchAndCacheImage(dc, "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"),
        fetchAndCacheImage(dc, "https://unpkg.com/three-globe/example/img/earth-topology.png")
      ]);
      console.log("[Globe] Textures loaded. Creating globe...");

      const globe = Globe()(globeRef.current)
        .globeImageUrl(globeTexture)
        .bumpImageUrl(bumpTexture)
        .width(globeRef.current.offsetWidth)
        .height(globeRef.current.offsetHeight)
        .backgroundColor("rgba(0,0,0,0)")
        .atmosphereColor("rgba(147, 51, 234, 0.5)")
        .atmosphereAltitude(0.2);

      console.log("[Globe] Configuring controls...");
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.35;
      globe.controls().enableZoom = true;
      globe.controls().minDistance = 101;
      globe.controls().maxDistance = 500;
      
      // Set initial camera position
      globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

      console.log("[Globe] Ready! 🌍");
      setReady(true);
    }

    if (globeRef.current && isFullTab) {
      setupGlobe().catch((err) => {
        console.error(`[Globe] ERROR: ${err.message}`);
      });
    }
  }, [isFullTab]);

  const handleExitFullTab = (e) => {
    e.stopPropagation();
    setIsFullTab(false);
  };
  
  const handleEnterFullTab = () => setIsFullTab(true);

  if (!isFullTab) {
    return (
      <div ref={containerRef} style={STYLES.compactWrapper}>
        <p style={STYLES.compactText}>🌍 Globe in compact mode.</p>
        <button style={STYLES.button} onClick={handleEnterFullTab}>
          Enter Full Tab
        </button>
      </div>
    );
  }

  const loadingStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  };

  const spinnerStyle = {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(147, 51, 234, 0.2)',
    borderTop: '3px solid rgba(147, 51, 234, 0.8)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  return (
    <div ref={containerRef}>
      <style>{STYLES.hoverEffectStyle}</style>
      
      <div style={STYLES.fullTabWrapper} className={uniqueWrapperClass}>
        <div
          style={STYLES.iconContainer}
          className="subtle-icon"
          onClick={handleExitFullTab}
        >
          &lt;/&gt;
          <span className="exit-tooltip" style={STYLES.tooltip}>
            Close Full Mode
          </span>
        </div>

        <div ref={globeRef} style={{ width: "100%", height: "100%" }}>
          {!ready && (
            <div style={loadingStyle}>
              <div style={spinnerStyle}></div>
              <span>Initializing Globe...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

return { View };
```

