



# ViewComponent


```jsx

// Ensure 'dc' is available in the environment where this component runs.
const { useRef, useEffect, useState } = dc;

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

function WorldView() {
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `babylon-wrapper-${instanceId}`;
  const currentPath = dc.resolvePath("D.q.babylonlocal.component"); // Get current file path
  
  const canvasRef = useRef(null); // Ref for the canvas element
  const containerRef = useRef(null); // Ref for the container element
  const stateRefs = useRef({}).current;
  
  const [engine, setEngine] = useState(null); // State to hold the Babylon.js engine instance
  const [scene, setScene] = useState(null);   // State to hold the Babylon.js scene instance
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullTab, setIsFullTab] = useState(true);
  const [loading, setLoading] = useState(true);

  // Suppress ResizeObserver loop errors globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalErrorHandler = window.onerror;
      window.onerror = function(message, source, lineno, colno, error) {
        if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
          return true; // Suppress the error
        }
        if (originalErrorHandler) {
          return originalErrorHandler(message, source, lineno, colno, error);
        }
        return false;
      };
    }
  }, []);

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
      
      /* Base styles for the refresh button */
      .refresh-button {
        background-color: #333;
        transition: background-color 0.3s ease, transform 0.1s ease;
        box-sizing: border-box;
      }
      
      /* Hover effect: change background to dark purple and slightly enlarge */
      .refresh-button:hover {
        background-color: #6A0DAD;
        transform: scale(1.05);
      }
      
      /* Active (click) effect: shrink slightly for tactile feedback */
      .refresh-button:active {
        transform: scale(0.95);
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
      backgroundColor: "#000000",
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
      zIndex: 10000,
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

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve(existingScript);
        return;
      }
      
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        resolve(script);
      };
      script.onerror = (e) => {
        console.error(`[Babylon] ❌ Failed to load script: ${src}`);
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.body.appendChild(script);
    });
  };

  const initBabylon = async () => {
    // Check if canvas is available and Babylon.js core/loaders are loaded.
    if (!canvasRef.current || !window.BABYLON || !window.BABYLON.SceneLoader) {
      console.error("[Babylon] ❌ Canvas or libraries not ready");
      return () => {};
    }

    setLoading(true);

    // Create a Babylon.js engine instance
    const babylonEngine = new window.BABYLON.Engine(
      canvasRef.current,
      true, // enable antialiasing
      { preserveDrawingBuffer: true, stencil: true, antialias: true }
    );
    
    // Create a new scene
    const babylonScene = new window.BABYLON.Scene(babylonEngine);
    babylonScene.clearColor = new window.BABYLON.Color4(0, 0, 0, 1); // Black background

    // Setup ArcRotateCamera
    const camera = new window.BABYLON.ArcRotateCamera(
      "Camera",
      -Math.PI / 2, // alpha (initial rotation around Y-axis)
      Math.PI / 2.5, // beta (initial rotation around X-axis)
      10, // initial radius (distance from target)
      window.BABYLON.Vector3.Zero(), // target (center of scene)
      babylonScene
    );
    camera.attachControl(canvasRef.current, true);
    camera.minZ = 0.1;
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 10;
    const rotationSpeed = 0.008;

    // Enhanced lighting
    const light = new window.BABYLON.HemisphericLight(
      "hemisphericLight",
      new window.BABYLON.Vector3(0, 1, 0),
      babylonScene
    );
    light.intensity = 0.8;

    const directionalLight = new window.BABYLON.DirectionalLight(
      "directionalLight",
      new window.BABYLON.Vector3(0.5, -1, 0.5),
      babylonScene
    );
    directionalLight.intensity = 1.5;
    directionalLight.diffuse = new window.BABYLON.Color3(1.0, 0.95, 0.9);

    // Add glow layer
    const glow = new window.BABYLON.GlowLayer("glow", babylonScene);
    glow.intensity = 0.5;

    // Store engine and scene in state
    setEngine(babylonEngine);
    setScene(babylonScene);

    // --- GLB Model Loading ---
    // Get the directory of the current component file
    const componentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const modelPath = componentDir + "/_resources/glb/b26.card.888.glb";
    
    try {
      // Wait a bit for the canvas to be properly sized
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const assetUrl = dc.app.vault.adapter.getResourcePath(modelPath);

      const result = await window.BABYLON.SceneLoader.ImportMeshAsync(
        null,
        "",
        assetUrl,
        babylonScene
      );

      if (result.meshes && result.meshes.length > 0) {
        let mainModelMesh = result.meshes.find(m => m.getTotalVertices() > 0 && m.name !== "__root__");
        if (!mainModelMesh) {
          mainModelMesh = result.meshes[0];
        }

        mainModelMesh.position = window.BABYLON.Vector3.Zero();
        mainModelMesh.scaling = new window.BABYLON.Vector3(2.5, 3.5, 3.5);

        const boundingInfo = mainModelMesh.getBoundingInfo();
        if (boundingInfo) {
          const center = boundingInfo.boundingSphere.center;
          const radius = boundingInfo.boundingSphere.radius;
          camera.setTarget(center);
          camera.radius = radius * 7.7;
        }
      } else {
        console.warn("[Babylon] ⚠️ No meshes found in GLB");
      }
    } catch (error) {
      console.error("[Babylon] ❌ GLB loading error:", error);
    } finally {
      setLoading(false);
    }

    // Implement onPointerDown to change radius limits
    babylonScene.onPointerDown = (e) => {
      if (e.button === 0) {
        camera.lowerRadiusLimit = 1;
        camera.upperRadiusLimit = 15;
      }
    };

    // Start the render loop
    babylonEngine.runRenderLoop(() => {
      if (babylonScene.activeCamera) {
        camera.alpha += rotationSpeed;
        babylonScene.render();
      }
    });

    // Handle window resizing
    const handleResize = () => {
      try {
        if (babylonEngine && !babylonEngine.isDisposed) {
          babylonEngine.resize();
        }
      } catch (error) {
        console.warn("[Babylon] Resize warning:", error);
      }
    };
    
    window.addEventListener("resize", handleResize);

    // Disable mouse wheel zoom
    const canvas = canvasRef.current;
    const handleWheel = (e) => {
      e.preventDefault();
    };

    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false });
    }

    // Return cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      babylonEngine.stopRenderLoop();
      if (babylonScene) babylonScene.dispose();
      if (babylonEngine) babylonEngine.dispose();
      setEngine(null);
      setScene(null);

      if (canvas) {
        canvas.removeEventListener("wheel", handleWheel);
      }
    };
  };

  // useEffect hook to manage the Babylon.js lifecycle
  useEffect(() => {
    if (!isFullTab) return; // Don't initialize in compact mode
    
    let cleanupBabylon = () => {};
    const loadedScripts = [];

    const setupEnvironment = async () => {
      try {
        // Check if Babylon.js is already loaded
        if (!window.BABYLON || !window.BABYLON.SceneLoader) {
          loadedScripts.push(await loadScript("https://cdn.babylonjs.com/babylon.js"));
          loadedScripts.push(await loadScript("https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"));
        }

        // Wait for canvas to be ready
        if (!canvasRef.current) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        if (window.BABYLON && window.BABYLON.SceneLoader && canvasRef.current) {
          cleanupBabylon = await initBabylon();
        } else {
          console.error("[Babylon] ❌ Initialization failed");
        }

      } catch (error) {
        console.error("[Babylon] ❌ Setup error:", error);
        setLoading(false);
      }
    };

    setupEnvironment();

    return () => {
      if (typeof cleanupBabylon === 'function') {
        cleanupBabylon();
      }
      loadedScripts.forEach(script => {
        if (script && script.parentElement) {
          document.body.removeChild(script);
        }
      });
      console.log("[Babylon] useEffect cleanup completed");
    };
  }, [refreshKey, isFullTab, currentPath]); // Add currentPath to dependencies

  // Resize Observer for proper canvas sizing
  useEffect(() => {
    if (!engine || !containerRef.current) return;
    
    let observer;
    let resizeTimeout;
    
    observer = new ResizeObserver((entries) => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      
      resizeTimeout = setTimeout(() => {
        window.requestAnimationFrame(() => {
          try {
            if (engine && !engine.isDisposed) {
              engine.resize();
            }
          } catch (error) {
            // Silent resize error
          }
        });
      }, 150);
    });
    
    observer.observe(containerRef.current);
    
    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (observer && containerRef.current) {
        try {
          observer.unobserve(containerRef.current);
          observer.disconnect();
        } catch (error) {
          // Silent cleanup
        }
      }
    };
  }, [engine]);

  // Force resize on mode change
  useEffect(() => {
    const resizeTimer = setTimeout(() => {
      try {
        if (engine && !engine.isDisposed) {
          engine.resize();
        }
      } catch (error) {
        // Silent resize error
      }
    }, 250);
    
    return () => clearTimeout(resizeTimer);
  }, [isFullTab, engine]);

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
      overflow: "hidden",
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

  if (!isFullTab) {
    return (
      <div ref={containerRef} style={STYLES.compactWrapper}>
        <p style={STYLES.compactText}>🎮 Babylon.js 3D View in compact mode.</p>
        <button style={STYLES.button} onClick={handleEnterFullTab}>
          Enter Full Tab
        </button>
      </div>
    );
  }

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

        {/* Loading indicator */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10002,
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(147, 51, 234, 0.2)',
              borderTop: '3px solid rgba(147, 51, 234, 0.8)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Loading 3D Model...</span>
          </div>
        )}

        {/* Canvas element where Babylon.js renders */}
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

        {/* The Refresh Scene Button */}
        <button
          onClick={() => setRefreshKey(prevKey => prevKey + 1)} // Increment refreshKey to trigger re-initialization
          className="refresh-button" // Apply the CSS class defined above
          style={{
            position: "absolute",
            top: "70px",
            right: "20px",
            zIndex: 10000, // Ensure the button is above the canvas
            width: "44px", // Fixed width for a square button
            height: "44px", // Fixed height for a square button
            borderRadius: "50%", // Makes the button circular
            border: "none", // Remove default button border
            display: "flex", // Use flexbox to center the icon inside
            justifyContent: "center", // Center horizontally
            alignItems: "center", // Center vertically
            cursor: "pointer", // Indicate clickable element
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.4)", // Add a subtle shadow
            color: "white", // Set icon color to white
            outline: "none", // Remove browser's default focus outline on click/focus
          }}
          aria-label="Refresh Scene" // Accessibility: label for screen readers
          title="Refresh Scene" // Tooltip on hover
        >
          {/* SVG Icon for Refresh (standard reload symbol) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor" // This makes the SVG inherit the 'color' property from its parent button
          >
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// In 'dc' environment, components are typically exported like this:
return { WorldView };
```